#!/usr/bin/env python3
"""
SacsMax - Sistema de Gestão de SAC
Arquivo principal para inicialização no Railway
"""

import os
import sys
import subprocess
import threading
import time
import signal
from pathlib import Path

# Configurações
PORT = int(os.environ.get('PORT', 3000))
FRONTEND_DIR = Path(__file__).parent / 'frontend'
BACKEND_DIR = Path(__file__).parent / 'backend'

def check_dependencies():
    """Verifica se as dependências estão instaladas"""
    try:
        import flask
        import requests
        print("✅ Dependências Python verificadas")
        return True
    except ImportError as e:
        print(f"❌ Dependência Python faltando: {e}")
        return False

def install_node_dependencies():
    """Instala dependências do Node.js se necessário"""
    if (FRONTEND_DIR / 'package.json').exists():
        # Verifica se node_modules já existe
        if (FRONTEND_DIR / 'node_modules').exists():
            print("✅ Dependências do frontend já instaladas")
            return True
            
        print("📦 Instalando dependências do frontend...")
        try:
            subprocess.run(['npm', 'install'], cwd=FRONTEND_DIR, check=True, shell=True)
            print("✅ Dependências do frontend instaladas")
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print(f"⚠️ Aviso: Erro ao instalar dependências do frontend: {e}")
            print("⚠️ Continuando sem instalar dependências...")
            return True  # Continua mesmo com erro
    return True

def start_backend():
    """Inicia o servidor backend"""
    backend_file = BACKEND_DIR / 'app.py'
    if backend_file.exists():
        print("🚀 Iniciando servidor backend...")
        try:
            # Inicia o backend em uma porta diferente
            backend_port = PORT + 1
            env = os.environ.copy()
            env['BACKEND_PORT'] = str(backend_port)
            
            backend_process = subprocess.Popen([
                sys.executable, str(backend_file)
            ], cwd=BACKEND_DIR, env=env)
            
            print(f"✅ Backend iniciado na porta {backend_port}")
            return backend_process
        except Exception as e:
            print(f"❌ Erro ao iniciar backend: {e}")
            return None
    else:
        print("⚠️  Arquivo backend/app.py não encontrado - iniciando apenas frontend")
        return None

def start_frontend():
    """Inicia o servidor frontend"""
    if (FRONTEND_DIR / 'package.json').exists():
        print("🌐 Iniciando servidor frontend...")
        try:
            # Usa serve para servir os arquivos estáticos
            frontend_process = subprocess.Popen([
                'serve', '-s', str(FRONTEND_DIR), '-l', str(PORT)
            ], shell=True)
            
            print(f"✅ Frontend iniciado na porta {PORT}")
            return frontend_process
        except Exception as e:
            print(f"❌ Erro ao iniciar frontend: {e}")
            return None
    else:
        print("❌ Diretório frontend não encontrado")
        return None

def create_simple_backend():
    """Cria um backend simples se não existir"""
    backend_dir = Path('backend')
    backend_dir.mkdir(exist_ok=True)
    
    app_py = backend_dir / 'app.py'
    if not app_py.exists():
        print("🔧 Criando backend básico...")
        
        backend_code = '''#!/usr/bin/env python3
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
'''
        
        with open(app_py, 'w', encoding='utf-8') as f:
            f.write(backend_code)
        
        # Cria requirements.txt
        requirements_txt = backend_dir / 'requirements.txt'
        requirements_content = '''flask==2.3.3
flask-cors==4.0.0
python-dotenv==1.0.0
'''
        
        with open(requirements_txt, 'w', encoding='utf-8') as f:
            f.write(requirements_content)
        
        print("✅ Backend básico criado")
        return True
    
    return False

def signal_handler(signum, frame):
    """Manipulador de sinais para encerramento limpo"""
    print("\n🛑 Recebido sinal de encerramento...")
    sys.exit(0)

def main():
    """Função principal"""
    print("=" * 50)
    print("🚀 SacsMax - Sistema de Gestão de SAC")
    print("=" * 50)
    
    # Configura manipulador de sinais
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Verifica dependências
    if not check_dependencies():
        print("❌ Falha na verificação de dependências")
        sys.exit(1)
    
    # Instala dependências do Node.js
    if not install_node_dependencies():
        print("❌ Falha na instalação de dependências do Node.js")
        sys.exit(1)
    
    # Cria backend se não existir
    create_simple_backend()
    
    # Inicia processos
    backend_process = start_backend()
    frontend_process = start_frontend()
    
    if not frontend_process:
        print("❌ Falha ao iniciar frontend")
        sys.exit(1)
    
    print("=" * 50)
    print(f"✅ Sistema iniciado com sucesso!")
    print(f"🌐 Frontend: http://localhost:{PORT}")
    if backend_process:
        backend_port = PORT + 1
        print(f"🔧 Backend: http://localhost:{backend_port}")
    print("=" * 50)
    
    try:
        # Aguarda os processos
        while True:
            time.sleep(1)
            
            # Verifica se os processos ainda estão rodando
            if frontend_process and frontend_process.poll() is not None:
                print("❌ Frontend parou inesperadamente")
                break
            
            if backend_process and backend_process.poll() is not None:
                print("❌ Backend parou inesperadamente")
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Encerrando sistema...")
    
    finally:
        # Encerra processos
        if frontend_process:
            frontend_process.terminate()
            print("✅ Frontend encerrado")
        
        if backend_process:
            backend_process.terminate()
            print("✅ Backend encerrado")
        
        print("👋 Sistema encerrado")

if __name__ == '__main__':
    main()
