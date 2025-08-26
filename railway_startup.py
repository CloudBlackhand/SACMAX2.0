#!/usr/bin/env python3
"""
SacsMax - Sistema de Gestão de SAC
Script de inicialização otimizado para Railway
Versão 2.1 - Backend + Frontend + WhatsApp Server Automático
"""

import os
import sys
import subprocess
import time
import threading
from pathlib import Path
import requests
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações do Railway
PORT = int(os.environ.get('PORT', 5000))
RAILWAY_ENVIRONMENT = os.environ.get('RAILWAY_ENVIRONMENT', 'development')

def check_dependencies():
    """Verificar dependências Python e Node.js"""
    # Verificar Python
    required_packages = ['fastapi', 'uvicorn', 'requests', 'psycopg2']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"❌ Dependências Python faltando: {missing_packages}")
        logger.error("⚠️ Instale as dependências:")
        logger.error("pip install -r requirements.txt")
        return False
    
    # Verificar Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"✅ Node.js encontrado: {result.stdout.strip()}")
        else:
            logger.error("❌ Node.js não encontrado")
            return False
    except FileNotFoundError:
        logger.error("❌ Node.js não encontrado")
        return False
    
    # Verificar npm
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"✅ npm encontrado: {result.stdout.strip()}")
        else:
            logger.error("❌ npm não encontrado")
            return False
    except FileNotFoundError:
        logger.error("❌ npm não encontrado")
        return False
    
    logger.info("✅ Todas as dependências verificadas")
    return True

def check_database_connection():
    """Verificar conexão com banco de dados"""
    try:
        from backend.database_config import db_manager
        
        if db_manager.connect():
            logger.info("✅ Conexão com banco de dados estabelecida")
            return True
        else:
            logger.warning("⚠️ Não foi possível conectar ao banco de dados")
            return False
    except Exception as e:
        logger.error(f"❌ Erro ao verificar banco de dados: {e}")
        return False

def start_backend():
    """Iniciar servidor backend FastAPI"""
    try:
        logger.info("🚀 Iniciando servidor backend FastAPI...")
        
        # Verificar se estamos no Railway
        if RAILWAY_ENVIRONMENT == 'production':
            # No Railway, usar uvicorn diretamente
            backend_process = subprocess.Popen([
                sys.executable, '-m', 'uvicorn', 
                'backend.app.app:app', 
                '--host', '0.0.0.0', 
                '--port', str(PORT)
            ])
        else:
            # Em desenvolvimento local
            backend_process = subprocess.Popen([
                sys.executable, '-m', 'uvicorn', 
                'backend.app.app:app', 
                '--host', '0.0.0.0', 
                '--port', str(PORT),
                '--reload'
            ])
        
        # Aguardar um pouco para verificar se iniciou
        time.sleep(5)
        
        if backend_process.poll() is None:
            logger.info(f"✅ Servidor backend FastAPI iniciado na porta {PORT}")
            return backend_process
        else:
            stdout, stderr = backend_process.communicate()
            logger.error(f"❌ Falha ao iniciar servidor backend")
            logger.error(f"STDOUT: {stdout}")
            logger.error(f"STDERR: {stderr}")
            return None
            
    except Exception as e:
        logger.error(f"❌ Erro ao iniciar servidor backend: {e}")
        return None

def start_whatsapp_server():
    """Iniciar servidor WhatsApp automaticamente"""
    try:
        logger.info("📱 Verificando servidor WhatsApp...")
        
        # No Docker, o WhatsApp server é iniciado pelo docker-entrypoint.sh
        # Apenas verificar se está rodando
        whatsapp_ports = [3001, 3002, 3003, 3004, 3005]
        
        for port in whatsapp_ports:
            try:
                response = requests.get(f"http://localhost:{port}/api/status", timeout=3)
                if response.status_code == 200:
                    logger.info(f"✅ WhatsApp server detectado na porta {port}")
                    return True
            except:
                continue
        
        logger.info("ℹ️ WhatsApp server não detectado (será iniciado pelo Docker)")
        return None
            
    except Exception as e:
        logger.error(f"❌ Erro ao verificar servidor WhatsApp: {e}")
        return None

def serve_frontend():
    """Servir frontend estático"""
    try:
        logger.info("🌐 Configurando servidor de arquivos estáticos...")
        
        frontend_dir = Path(__file__).parent / 'frontend'
        if not frontend_dir.exists():
            logger.warning("⚠️ Diretório frontend não encontrado")
            return False
        
        # Verificar se o index.html existe
        index_html = frontend_dir / 'index.html'
        if not index_html.exists():
            logger.warning("⚠️ index.html não encontrado")
            return False
        
        logger.info("✅ Frontend configurado para ser servido pelo FastAPI")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao configurar frontend: {e}")
        return False

def check_services():
    """Verificar se os serviços estão rodando"""
    services = [
        ("Backend", f"http://localhost:{PORT}/api/health")
    ]
    
    logger.info("🔍 Verificando serviços...")
    
    for name, url in services:
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                logger.info(f"✅ {name}: OK")
            else:
                logger.warning(f"⚠️ {name}: Status {response.status_code}")
        except Exception as e:
            logger.error(f"❌ {name}: Erro - {e}")
    
    # Verificar WhatsApp server
    whatsapp_ports = [3001, 3002, 3003, 3004, 3005]
    for port in whatsapp_ports:
        try:
            response = requests.get(f"http://localhost:{port}/api/status", timeout=3)
            if response.status_code == 200:
                logger.info(f"✅ WhatsApp Server: OK (porta {port})")
                return
        except:
            continue
    
    logger.info("ℹ️ WhatsApp Server: Não está rodando")

def main():
    """Função principal"""
    logger.info("🚀 SacsMax - Sistema de Gestão de SAC")
    logger.info("=" * 50)
    logger.info(f"🌍 Ambiente: {RAILWAY_ENVIRONMENT}")
    logger.info(f"🔌 Porta: {PORT}")
    
    # Verificar dependências
    if not check_dependencies():
        logger.error("❌ Dependências não atendidas")
        return False
    
    # Verificar banco de dados
    check_database_connection()
    
    # Configurar frontend
    serve_frontend()
    
    # Iniciar WhatsApp server primeiro
    whatsapp_process = start_whatsapp_server()
    
    # Iniciar backend
    backend_process = start_backend()
    if not backend_process:
        logger.error("❌ Falha ao iniciar backend")
        return False
    
    logger.info("\n✅ Sistema iniciado com sucesso!")
    logger.info(f"🌐 Frontend: http://localhost:{PORT}")
    logger.info(f"🔧 Backend API: http://localhost:{PORT}/docs")
    if whatsapp_process:
        logger.info(f"📱 WhatsApp: http://localhost:3002 (iniciado automaticamente)")
    else:
        logger.info(f"📱 WhatsApp: http://localhost:3002 (inicie manualmente via Settings)")
    
    # Verificar serviços
    time.sleep(10)
    check_services()
    
    logger.info("\n🎉 Sistema SacsMax pronto para uso!")
    logger.info("💡 Para parar o sistema, pressione Ctrl+C")
    
    try:
        # Manter o processo rodando
        while True:
            time.sleep(1)
            
            # Verificar se os processos morreram
            if backend_process.poll() is not None:
                logger.error("❌ Processo backend parou inesperadamente")
                return False
            
            if whatsapp_process and whatsapp_process.poll() is not None:
                logger.warning("⚠️ Processo WhatsApp parou, tentando reiniciar...")
                whatsapp_process = start_whatsapp_server()
                
    except KeyboardInterrupt:
        logger.info("\n🛑 Parando sistema...")
        
        # Parar processos
        try:
            if whatsapp_process:
                whatsapp_process.terminate()
                whatsapp_process.wait(timeout=5)
                logger.info("✅ WhatsApp Server parado")
        except:
            if whatsapp_process:
                whatsapp_process.kill()
                logger.info("⚠️ WhatsApp Server forçado a parar")
        
        try:
            backend_process.terminate()
            backend_process.wait(timeout=5)
            logger.info("✅ Backend parado")
        except:
            backend_process.kill()
            logger.info("⚠️ Backend forçado a parar")
        
        logger.info("✅ Sistema parado")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
