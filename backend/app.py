#!/usr/bin/env python3
"""
SacsMax Backend - API completa com integração de banco de dados PostgreSQL
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime
import threading
import time
from werkzeug.utils import secure_filename
from excel_to_database import ExcelToDatabaseConverter
from database_config import db_manager, init_database, close_database
from feedback_analyzer import feedback_analyzer
import logging

app = Flask(__name__)
CORS(app)

# Configuração
PORT = int(os.environ.get('BACKEND_PORT', 5000))
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Dados em memória (fallback se banco não estiver disponível)
contacts = []
messages = []
bot_config = {
    "name": "SacsMax Bot",
    "enabled": True,
    "welcome_message": "Olá! Como posso ajudar?",
    "working_hours": {"start": "08:00", "end": "18:00"}
}

@app.route('/')
def index():
    """Serve o frontend"""
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/api/health')
def health():
    """Endpoint de saúde"""
    db_status = "connected" if db_manager.connection else "disconnected"
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "SacsMax Backend",
        "database": db_status
    })

@app.route('/api/stats')
def get_stats():
    """Estatísticas do sistema"""
    if db_manager.connection:
        try:
            # Estatísticas do banco PostgreSQL
            tables = db_manager.get_all_tables()
            total_records = 0
            
            for table in tables:
                count = db_manager.get_table_count(table)
                total_records += count
            
            return jsonify({
                "total_tables": len(tables),
                "total_records": total_records,
                "tables": tables,
                "database": "postgresql"
            })
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
    
    # Fallback para dados em memória
    return jsonify({
        "total_contacts": len(contacts),
        "total_messages": len(messages),
        "online_contacts": len([c for c in contacts if c.get('status') == 'online']),
        "unread_messages": len([m for m in messages if not m.get('read')]),
        "database": "memory"
    })

@app.route('/api/database/tables')
def get_tables():
    """Lista todas as tabelas do banco"""
    if not db_manager.connection:
        return jsonify({"error": "Database not connected"}), 500
    
    try:
        tables = db_manager.get_all_tables()
        table_info = []
        
        for table in tables:
            count = db_manager.get_table_count(table)
            table_info.append({
                "name": table,
                "records": count
            })
        
        return jsonify({
            "tables": table_info,
            "total_tables": len(tables)
        })
    except Exception as e:
        logger.error(f"Erro ao listar tabelas: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/database/table/<table_name>')
def get_table_data(table_name):
    """Obtém dados de uma tabela específica"""
    if not db_manager.connection:
        return jsonify({"error": "Database not connected"}), 500
    
    try:
        limit = request.args.get('limit', 100, type=int)
        data = db_manager.get_table_data(table_name, limit)
        
        return jsonify({
            "table": table_name,
            "data": data,
            "total_records": len(data)
        })
    except Exception as e:
        logger.error(f"Erro ao obter dados da tabela {table_name}: {e}")
        return jsonify({"error": str(e)}), 500



@app.route('/api/contacts', methods=['GET', 'POST'])
def handle_contacts():
    """Gerenciar contatos"""
    global contacts
    
    if request.method == 'GET':
        return jsonify(contacts)
    
    elif request.method == 'POST':
        contact = request.json
        contact['id'] = len(contacts) + 1
        contact['created_at'] = datetime.now().isoformat()
        contacts.append(contact)
        return jsonify(contact), 201

@app.route('/api/messages', methods=['GET', 'POST'])
def handle_messages():
    """Gerenciar mensagens"""
    global messages
    
    if request.method == 'GET':
        contact_id = request.args.get('contact_id')
        if contact_id:
            filtered_messages = [m for m in messages if m.get('contact_id') == int(contact_id)]
            return jsonify(filtered_messages)
        return jsonify(messages)
    
    elif request.method == 'POST':
        message = request.json
        message['id'] = len(messages) + 1
        message['timestamp'] = datetime.now().isoformat()
        message['read'] = False
        messages.append(message)
        return jsonify(message), 201

@app.route('/api/bot/config', methods=['GET', 'PUT'])
def handle_bot_config():
    """Gerenciar configuração do bot"""
    global bot_config
    
    if request.method == 'GET':
        return jsonify(bot_config)
    
    elif request.method == 'PUT':
        bot_config.update(request.json)
        return jsonify(bot_config)

# Configuração para upload de arquivos
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}
DATABASE_FOLDER = 'databases'

# Criar diretórios se não existirem
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATABASE_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/excel/upload', methods=['POST'])
def upload_excel():
    """Upload e processamento real de arquivo Excel"""
    try:
        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "Nenhum arquivo enviado"
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                "status": "error",
                "message": "Nenhum arquivo selecionado"
            }), 400
        
        if file and allowed_file(file.filename):
            # Salvar arquivo
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            safe_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
            file.save(file_path)
            
            # Processar Excel para banco de dados
            database_name = f"{timestamp}_{filename.rsplit('.', 1)[0]}.db"
            database_path = os.path.join(DATABASE_FOLDER, database_name)
            
            converter = ExcelToDatabaseConverter(file_path, database_path)
            
            if converter.process_excel_to_database():
                # Gerar script SQL
                sql_script_name = f"{timestamp}_{filename.rsplit('.', 1)[0]}.sql"
                sql_script_path = converter.generate_sql_script(sql_script_name)
                
                # Obter resumo
                summary = converter.get_database_summary()
                
                converter.close_connection()
                
                # Limpar arquivo temporário
                os.remove(file_path)
                
                return jsonify({
                    "status": "success",
                    "message": "Arquivo Excel processado e convertido para banco de dados com sucesso!",
                    "database_file": database_name,
                    "sql_script": sql_script_name,
                    "summary": summary,
                    "timestamp": datetime.now().isoformat()
                })
            else:
                converter.close_connection()
                return jsonify({
                    "status": "error",
                    "message": "Erro ao processar arquivo Excel"
                }), 500
        
        else:
            return jsonify({
                "status": "error",
                "message": "Tipo de arquivo não permitido. Use apenas .xlsx ou .xls"
            }), 400
            
    except Exception as e:
        logging.error(f"Erro no upload: {e}")
        return jsonify({
            "status": "error",
            "message": f"Erro interno: {str(e)}"
        }), 500

@app.route('/api/feedback/analyze', methods=['POST'])
def analyze_feedback():
    """Analisa sentimento de uma mensagem"""
    try:
        data = request.json
        message_data = {
            'text': data.get('text', ''),
            'contact_id': data.get('contact_id'),
            'contact_name': data.get('contact_name', 'Cliente'),
            'contact_phone': data.get('contact_phone', ''),
            'timestamp': data.get('timestamp', datetime.now().isoformat())
        }
        
        feedback = feedback_analyzer.process_message(message_data)
        return jsonify(feedback)
    except Exception as e:
        logger.error(f"Erro ao analisar feedback: {e}")
        return jsonify({"error": "Erro ao analisar feedback"}), 500

@app.route('/api/feedback/list', methods=['GET'])
def list_feedbacks():
    """Lista todos os feedbacks"""
    try:
        # Em produção, buscar do banco de dados
        # Por enquanto, retorna dados mock
        feedbacks = [
            {
                'id': '1',
                'contact_id': '1',
                'contact_name': 'João Silva',
                'contact_phone': '(11) 99999-9999',
                'text': 'Excelente atendimento! O técnico foi muito profissional.',
                'sentiment': 'positive',
                'score': 0.8,
                'keywords': ['atendimento', 'profissional'],
                'date': '2024-01-15 14:30'
            },
            {
                'id': '2',
                'contact_id': '2',
                'contact_name': 'Maria Santos',
                'contact_phone': '(11) 88888-8888',
                'text': 'Demorou muito para resolver meu problema.',
                'sentiment': 'negative',
                'score': 0.6,
                'keywords': ['demora', 'problema'],
                'date': '2024-01-14 16:45'
            }
        ]
        return jsonify(feedbacks)
    except Exception as e:
        logger.error(f"Erro ao listar feedbacks: {e}")
        return jsonify({"error": "Erro ao listar feedbacks"}), 500

@app.route('/api/feedback/stats', methods=['GET'])
def feedback_stats():
    """Estatísticas dos feedbacks"""
    try:
        # Em produção, calcular do banco de dados
        stats = {
            'total': 25,
            'positive': 15,
            'negative': 5,
            'neutral': 5,
            'positive_percent': 60.0,
            'negative_percent': 20.0,
            'neutral_percent': 20.0
        }
        return jsonify(stats)
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        return jsonify({"error": "Erro ao obter estatísticas"}), 500

@app.route('/api/contacts/produtividade', methods=['GET'])
def get_produtividade_contacts():
    """Busca todos os contatos da tabela produtividade"""
    try:
        if not db_manager.connection:
            return jsonify({"error": "Banco de dados não conectado"}), 500
        
        query = """
            SELECT 
                id,
                data,
                tecnico,
                servico,
                sa,
                documento,
                nome_cliente,
                endereco,
                telefone1,
                telefone2,
                plano,
                status,
                obs,
                created_at
            FROM produtividade 
            ORDER BY data DESC, nome_cliente
        """
        
        cursor = db_manager.connection.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        
        contacts = []
        for row in rows:
            contact = {
                'id': row[0],
                'data': row[1].isoformat() if row[1] else None,
                'tecnico': row[2],
                'servico': row[3],
                'sa': row[4],
                'documento': row[5],
                'nome_cliente': row[6],
                'endereco': row[7],
                'telefone1': row[8],
                'telefone2': row[9],
                'plano': row[10],
                'status': row[11],
                'obs': row[12],
                'created_at': row[13].isoformat() if row[13] else None
            }
            contacts.append(contact)
        
        return jsonify({
            'success': True,
            'contacts': contacts,
            'total': len(contacts)
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar contatos da produtividade: {e}")
        return jsonify({"error": f"Erro ao buscar contatos: {str(e)}"}), 500

@app.route('/api/contacts/search', methods=['GET'])
def search_contacts():
    """Busca contatos por termo"""
    try:
        search_term = request.args.get('q', '').strip()
        if not search_term:
            return jsonify({"error": "Termo de busca não fornecido"}), 400
        
        if not db_manager.connection:
            return jsonify({"error": "Banco de dados não conectado"}), 500
        
        query = """
            SELECT 
                id,
                data,
                tecnico,
                servico,
                sa,
                documento,
                nome_cliente,
                endereco,
                telefone1,
                telefone2,
                plano,
                status,
                obs
            FROM produtividade 
            WHERE 
                nome_cliente ILIKE %s OR
                telefone1 ILIKE %s OR
                telefone2 ILIKE %s OR
                sa ILIKE %s OR
                documento ILIKE %s OR
                endereco ILIKE %s
            ORDER BY nome_cliente
        """
        
        search_pattern = f'%{search_term}%'
        cursor = db_manager.connection.cursor()
        cursor.execute(query, (search_pattern, search_pattern, search_pattern, search_pattern, search_pattern, search_pattern))
        rows = cursor.fetchall()
        cursor.close()
        
        contacts = []
        for row in rows:
            contact = {
                'id': row[0],
                'data': row[1].isoformat() if row[1] else None,
                'tecnico': row[2],
                'servico': row[3],
                'sa': row[4],
                'documento': row[5],
                'nome_cliente': row[6],
                'endereco': row[7],
                'telefone1': row[8],
                'telefone2': row[9],
                'plano': row[10],
                'status': row[11],
                'obs': row[12]
            }
            contacts.append(contact)
        
        return jsonify({
            'success': True,
            'contacts': contacts,
            'total': len(contacts),
            'search_term': search_term
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar contatos: {e}")
        return jsonify({"error": f"Erro ao buscar contatos: {str(e)}"}), 500

@app.route('/api/contacts/<int:contact_id>', methods=['GET'])
def get_contact_details(contact_id):
    """Busca detalhes de um contato específico"""
    try:
        if not db_manager.connection:
            return jsonify({"error": "Banco de dados não conectado"}), 500
        
        query = """
            SELECT 
                id,
                data,
                tecnico,
                servico,
                sa,
                documento,
                nome_cliente,
                endereco,
                telefone1,
                telefone2,
                plano,
                status,
                obs,
                created_at
            FROM produtividade 
            WHERE id = %s
        """
        
        cursor = db_manager.connection.cursor()
        cursor.execute(query, (contact_id,))
        row = cursor.fetchone()
        cursor.close()
        
        if not row:
            return jsonify({"error": "Contato não encontrado"}), 404
        
        contact = {
            'id': row[0],
            'data': row[1].isoformat() if row[1] else None,
            'tecnico': row[2],
            'servico': row[3],
            'sa': row[4],
            'documento': row[5],
            'nome_cliente': row[6],
            'endereco': row[7],
            'telefone1': row[8],
            'telefone2': row[9],
            'plano': row[10],
            'status': row[11],
            'obs': row[12],
            'created_at': row[13].isoformat() if row[13] else None
        }
        
        return jsonify({
            'success': True,
            'contact': contact
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar detalhes do contato: {e}")
        return jsonify({"error": f"Erro ao buscar detalhes do contato: {str(e)}"}), 500

@app.route('/api/messages/save', methods=['POST'])
def save_message():
    """Salva uma mensagem no banco de dados"""
    try:
        data = request.json
        contact_id = data.get('contact_id')
        message_text = data.get('text')
        is_outgoing = data.get('is_outgoing', False)
        message_type = data.get('type', 'text')
        
        if not contact_id or not message_text:
            return jsonify({"error": "Dados obrigatórios não fornecidos"}), 400
        
        if not db_manager.connection:
            return jsonify({"error": "Banco de dados não conectado"}), 500
        
        # Criar tabela de mensagens se não existir
        create_messages_table_query = """
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                is_outgoing BOOLEAN DEFAULT FALSE,
                message_type VARCHAR(50) DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contact_id) REFERENCES produtividade(id)
            )
        """
        
        cursor = db_manager.connection.cursor()
        cursor.execute(create_messages_table_query)
        
        # Inserir mensagem
        insert_query = """
            INSERT INTO messages (contact_id, text, is_outgoing, message_type)
            VALUES (%s, %s, %s, %s)
            RETURNING id, created_at
        """
        
        cursor.execute(insert_query, (contact_id, message_text, is_outgoing, message_type))
        result = cursor.fetchone()
        db_manager.connection.commit()
        cursor.close()
        
        return jsonify({
            'success': True,
            'message_id': result[0],
            'created_at': result[1].isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao salvar mensagem: {e}")
        return jsonify({"error": f"Erro ao salvar mensagem: {str(e)}"}), 500

@app.route('/api/messages/<int:contact_id>', methods=['GET'])
def get_messages(contact_id):
    """Busca mensagens de um contato específico"""
    try:
        if not db_manager.connection:
            return jsonify({"error": "Banco de dados não conectado"}), 500
        
        # Criar tabela de mensagens se não existir
        create_messages_table_query = """
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                is_outgoing BOOLEAN DEFAULT FALSE,
                message_type VARCHAR(50) DEFAULT 'text',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contact_id) REFERENCES produtividade(id)
            )
        """
        
        cursor = db_manager.connection.cursor()
        cursor.execute(create_messages_table_query)
        
        # Buscar mensagens
        query = """
            SELECT 
                id,
                text,
                is_outgoing,
                message_type,
                created_at
            FROM messages 
            WHERE contact_id = %s
            ORDER BY created_at ASC
        """
        
        cursor.execute(query, (contact_id,))
        rows = cursor.fetchall()
        cursor.close()
        
        messages = []
        for row in rows:
            message = {
                'id': row[0],
                'text': row[1],
                'is_outgoing': row[2],
                'type': row[3],
                'time': row[4].strftime('%H:%M') if row[4] else None,
                'created_at': row[4].isoformat() if row[4] else None
            }
            messages.append(message)
        
        return jsonify({
            'success': True,
            'messages': messages,
            'total': len(messages)
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar mensagens: {e}")
        return jsonify({"error": f"Erro ao buscar mensagens: {str(e)}"}), 500

def start_heartbeat():
    """Thread para manter o servidor ativo"""
    while True:
        time.sleep(30)
        db_status = "connected" if db_manager.connection else "disconnected"
        print(f"💓 Heartbeat - Backend ativo na porta {PORT} - DB: {db_status}")

if __name__ == '__main__':
    print(f"🚀 Iniciando SacsMax Backend na porta {PORT}")
    
    # Inicializa conexão com banco
    if init_database():
        print("✅ Conectado ao banco PostgreSQL do Railway")
    else:
        print("⚠️ Usando dados em memória (banco não disponível)")
    
    # Inicia thread de heartbeat
    heartbeat_thread = threading.Thread(target=start_heartbeat, daemon=True)
    heartbeat_thread.start()
    
    try:
        app.run(host='0.0.0.0', port=PORT, debug=False)
    finally:
        close_database()
