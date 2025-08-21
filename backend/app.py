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
