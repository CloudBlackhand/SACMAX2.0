#!/usr/bin/env python3
"""
SacsMax - Sistema de Gestão de SAC
Script de inicialização otimizado para Railway
Versão 2.2 - Backend + Frontend (WhatsApp apenas em desenvolvimento)
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

# Verificar se estamos no Railway
IS_RAILWAY = os.environ.get('RAILWAY_ENVIRONMENT') is not None or os.environ.get('PORT') is not None

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
        if IS_RAILWAY:
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
        ("Backend", f"http://localhost:{PORT}/health"),
        ("WAHA", "http://localhost:3000/api/status")
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
            if name == "WAHA":
                logger.info(f"ℹ️ {name}: Não está rodando (normal em desenvolvimento)")
            else:
                logger.error(f"❌ {name}: Erro - {e}")

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
    
    # Verificar banco de dados (opcional no Railway)
    if not IS_RAILWAY:
        check_database_connection()
    else:
        logger.info("ℹ️ Verificação de banco de dados pulada no Railway")
    
    # Configurar frontend
    serve_frontend()
    
    # Iniciar backend
    backend_process = start_backend()
    if not backend_process:
        logger.error("❌ Falha ao iniciar backend")
        return False
    
    logger.info("\n✅ Sistema iniciado com sucesso!")
    logger.info(f"🌐 Frontend: http://localhost:{PORT}")
    logger.info(f"🔧 Backend API: http://localhost:{PORT}/docs")
    logger.info(f"📱 WAHA: http://localhost:3000 (disponível via Docker)")
    logger.info(f"📱 WhatsApp: Disponível via WAHA (sem QR Code)")
    
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
                
    except KeyboardInterrupt:
        logger.info("\n🛑 Parando sistema...")
        
        # Parar processos
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
