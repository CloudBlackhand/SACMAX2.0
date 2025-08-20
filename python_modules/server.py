#!/usr/bin/env python3
"""
Servidor Python completo para SacsMax
Substitui completamente o backend JavaScript
"""

import os
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import tempfile
import shutil

# Importar nossos módulos
from database_service import RailwayDatabaseService
from excel_processor import process_excel_file
from whatsapp_service import WhatsAppService

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configurações
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

# Criar diretórios necessários
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('logs', exist_ok=True)
os.makedirs('temp_data', exist_ok=True)

# Inicializar serviços
try:
    db_service = RailwayDatabaseService()
    whatsapp_service = WhatsAppService()
    logger.info("Serviços inicializados com sucesso")
except Exception as e:
    logger.error(f"Erro ao inicializar serviços: {e}")
    db_service = None
    whatsapp_service = None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check para Railway"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'sacsmax-python-backend',
        'version': '2.0.0'
    })

@app.route('/api/excel/upload', methods=['POST'])
def upload_excel():
    """Upload e processamento de planilha Excel"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Formato de arquivo não permitido'}), 400
        
        # Salvar arquivo temporariamente
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}")
        file.save(temp_path)
        
        logger.info(f"Arquivo salvo: {temp_path}")
        
        # Processar arquivo Excel
        result = process_excel_file(temp_path, 'contacts')
        
        # Salvar no banco de dados
        if db_service and result.get('contacts'):
            try:
                save_result = db_service.save_spreadsheet_data(result, filename, 'contacts')
                logger.info(f"Dados salvos no banco: {save_result}")
            except Exception as db_error:
                logger.error(f"Erro ao salvar no banco: {db_error}")
                # Continuar mesmo com erro no banco
        
        # Limpar arquivo temporário
        os.unlink(temp_path)
        
        return jsonify({
            'success': True,
            'contacts': result.get('contacts', []),
            'sheets': result.get('sheets', []),
            'message': f"Processado {len(result.get('contacts', []))} contatos",
            'savedToDatabase': True
        })
        
    except Exception as error:
        logger.error(f"Erro no upload: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

@app.route('/api/excel/client-data', methods=['POST'])
def upload_client_data():
    """Upload de dados de cliente por data"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Nenhum arquivo enviado'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Nenhum arquivo selecionado'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'error': 'Formato de arquivo não permitido'}), 400
        
        # Salvar arquivo temporariamente
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}")
        file.save(temp_path)
        
        logger.info(f"Arquivo salvo: {temp_path}")
        
        # Processar arquivo Excel
        result = process_excel_file(temp_path, 'client_data')
        
        # Salvar no banco de dados
        if db_service and result.get('client_data_by_date'):
            try:
                save_result = db_service.save_spreadsheet_data(result, filename, 'client_data')
                logger.info(f"Dados de cliente salvos no banco: {save_result}")
            except Exception as db_error:
                logger.error(f"Erro ao salvar dados de cliente no banco: {db_error}")
                # Continuar mesmo com erro no banco
        
        # Limpar arquivo temporário
        os.unlink(temp_path)
        
        return jsonify({
            'success': True,
            'client_data_by_date': result.get('client_data_by_date', {}),
            'sheets': result.get('sheets', []),
            'total_dates': result.get('total_dates', 0),
            'message': f"Processado {result.get('total_dates', 0)} datas com dados de clientes",
            'savedToDatabase': True
        })
        
    except Exception as error:
        logger.error(f"Erro no upload de client_data: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Listar todos os clientes"""
    try:
        if not db_service:
            return jsonify({'success': False, 'error': 'Serviço de banco não disponível'}), 500
        
        clients = db_service.get_all_clients()
        return jsonify({
            'success': True,
            'clients': clients,
            'total': len(clients)
        })
        
    except Exception as error:
        logger.error(f"Erro ao listar clientes: {error}")
        return jsonify({'success': False, 'error': str(error), 'clients': []}), 500

@app.route('/api/clients/<int:client_id>', methods=['GET'])
def get_client_data(client_id):
    """Obter dados de um cliente específico"""
    try:
        if not db_service:
            return jsonify({'success': False, 'error': 'Serviço de banco não disponível'}), 500
        
        data = db_service.get_client_data(client_id)
        return jsonify({
            'success': True,
            'data': data
        })
        
    except Exception as error:
        logger.error(f"Erro ao obter dados do cliente: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    """Deletar cliente"""
    try:
        if not db_service:
            return jsonify({'success': False, 'error': 'Serviço de banco não disponível'}), 500
        
        result = db_service.delete_client(client_id)
        return jsonify(result)
        
    except Exception as error:
        logger.error(f"Erro ao deletar cliente: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

@app.route('/api/feedback/classify', methods=['POST'])
def classify_feedback():
    """Classificar feedback"""
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'success': False, 'error': 'Texto não fornecido'}), 400
        
        if not db_service:
            return jsonify({'success': False, 'error': 'Serviço de banco não disponível'}), 500
        
        result = db_service.classify_feedback(data['text'])
        return jsonify({
            'success': True,
            'sentiment': result['sentiment'],
            'confidence': result['confidence'],
            'score': result['score']
        })
        
    except Exception as error:
        logger.error(f"Erro ao classificar feedback: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

@app.route('/api/whatsapp/status', methods=['GET'])
def whatsapp_status():
    """Status do WhatsApp"""
    try:
        if not whatsapp_service:
            return jsonify({
                'initialized': False,
                'connected': False,
                'ready': False,
                'qrCode': None,
                'error': 'Serviço WhatsApp não disponível'
            })
        
        status = whatsapp_service.get_status()
        return jsonify(status)
        
    except Exception as error:
        logger.error(f"Erro ao obter status do WhatsApp: {error}")
        return jsonify({
            'initialized': False,
            'connected': False,
            'ready': False,
            'qrCode': None,
            'error': str(error)
        })

@app.route('/api/whatsapp/start', methods=['POST'])
def start_whatsapp():
    """Iniciar WhatsApp"""
    try:
        if not whatsapp_service:
            return jsonify({'success': False, 'error': 'Serviço WhatsApp não disponível'}), 500
        
        result = whatsapp_service.initialize()
        return jsonify({
            'success': True,
            'message': 'WhatsApp iniciado com sucesso',
            'connected': whatsapp_service.is_connected(),
            'ready': whatsapp_service.is_ready()
        })
        
    except Exception as error:
        logger.error(f"Erro ao iniciar WhatsApp: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

@app.route('/api/whatsapp/stop', methods=['POST'])
def stop_whatsapp():
    """Parar WhatsApp"""
    try:
        if not whatsapp_service:
            return jsonify({'success': False, 'error': 'Serviço WhatsApp não disponível'}), 500
        
        whatsapp_service.disconnect()
        return jsonify({
            'success': True,
            'message': 'WhatsApp parado com sucesso'
        })
        
    except Exception as error:
        logger.error(f"Erro ao parar WhatsApp: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

@app.route('/api/whatsapp/send', methods=['POST'])
def send_whatsapp_message():
    """Enviar mensagem WhatsApp"""
    try:
        data = request.get_json()
        if not data or 'number' not in data or 'message' not in data:
            return jsonify({'success': False, 'error': 'Número e mensagem são obrigatórios'}), 400
        
        if not whatsapp_service:
            return jsonify({'success': False, 'error': 'Serviço WhatsApp não disponível'}), 500
        
        result = whatsapp_service.send_message(data['number'], data['message'])
        return jsonify(result)
        
    except Exception as error:
        logger.error(f"Erro ao enviar mensagem WhatsApp: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Estatísticas do sistema"""
    try:
        stats = {
            'timestamp': datetime.now().isoformat(),
            'database': {
                'available': db_service is not None,
                'clients_count': len(db_service.get_all_clients()) if db_service else 0
            },
            'whatsapp': {
                'available': whatsapp_service is not None,
                'connected': whatsapp_service.is_connected() if whatsapp_service else False,
                'ready': whatsapp_service.is_ready() if whatsapp_service else False
            },
            'system': {
                'uptime': 'running',
                'version': '2.0.0'
            }
        }
        return jsonify({'success': True, 'stats': stats})
        
    except Exception as error:
        logger.error(f"Erro ao obter estatísticas: {error}")
        return jsonify({'success': False, 'error': str(error)}), 500

# Servir arquivos estáticos (frontend)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Servir frontend"""
    if path and os.path.exists(os.path.join('frontend', path)):
        return send_from_directory('frontend', path)
    return send_from_directory('frontend', 'webInterface.js')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"🚀 Iniciando SacsMax Python Backend na porta {port}")
    logger.info(f"📊 Serviço de banco: {'✅ Disponível' if db_service else '❌ Indisponível'}")
    logger.info(f"📱 Serviço WhatsApp: {'✅ Disponível' if whatsapp_service else '❌ Indisponível'}")
    
    app.run(host=host, port=port, debug=False)
