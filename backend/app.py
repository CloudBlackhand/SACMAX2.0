#!/usr/bin/env python3
"""
SacsMax Backend - API básica
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime
import threading
import time

app = Flask(__name__)
CORS(app)

# Configuração
PORT = int(os.environ.get('BACKEND_PORT', 5000))
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

# Dados em memória (em produção, usar banco de dados)
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
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "SacsMax Backend"
    })

@app.route('/api/stats')
def get_stats():
    """Estatísticas do sistema"""
    return jsonify({
        "total_contacts": len(contacts),
        "total_messages": len(messages),
        "online_contacts": len([c for c in contacts if c.get('status') == 'online']),
        "unread_messages": len([m for m in messages if not m.get('read')])
    })

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

@app.route('/api/excel/upload', methods=['POST'])
def upload_excel():
    """Simular upload de Excel"""
    # Em produção, processar arquivo real
    return jsonify({
        "status": "success",
        "message": "Arquivo processado com sucesso",
        "rows_processed": 150,
        "timestamp": datetime.now().isoformat()
    })

def start_heartbeat():
    """Thread para manter o servidor ativo"""
    while True:
        time.sleep(30)
        print(f"💓 Heartbeat - Backend ativo na porta {PORT}")

if __name__ == '__main__':
    print(f"🚀 Iniciando SacsMax Backend na porta {PORT}")
    
    # Inicia thread de heartbeat
    heartbeat_thread = threading.Thread(target=start_heartbeat, daemon=True)
    heartbeat_thread.start()
    
    app.run(host='0.0.0.0', port=PORT, debug=False)
