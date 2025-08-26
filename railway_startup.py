#!/usr/bin/env python3
"""
SacsMax - Sistema de Gestão de SAC
Script de inicialização otimizado para Railway
Versão 2.2 - Arquitetura Multi-Processo Otimizada
"""

import os
import sys
import subprocess
import time
import threading
from pathlib import Path
import requests
import logging
import signal
import atexit

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configurações do Railway
PORT = int(os.environ.get('PORT', 5000))
RAILWAY_ENVIRONMENT = os.environ.get('RAILWAY_ENVIRONMENT', 'development')
NODE_ENV = os.environ.get('NODE_ENV', 'production')

# Processos globais
backend_process = None
whatsapp_process = None
processes_to_cleanup = []

def cleanup_processes():
    """Limpar todos os processos ao sair"""
    global processes_to_cleanup
    for process in processes_to_cleanup:
        try:
            if process and process.poll() is None:
                process.terminate()
                process.wait(timeout=5)
                logger.info(f"✅ Processo {process.pid} parado")
        except:
            if process:
                process.kill()
                logger.info(f"⚠️ Processo {process.pid} forçado a parar")

# Registrar cleanup
atexit.register(cleanup_processes)

def signal_handler(signum, frame):
    """Handler para sinais de interrupção"""
    logger.info("🛑 Recebido sinal de interrupção, parando sistema...")
    cleanup_processes()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def check_dependencies():
    """Verificar dependências Python"""
    required_packages = ['fastapi', 'uvicorn', 'requests']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"❌ Dependências Python faltando: {missing_packages}")
        return False
    
    logger.info("✅ Dependências Python verificadas")
    return True

def check_node_dependencies():
    """Verificar dependências Node.js"""
    try:
        # Verificar se o Node.js está disponível
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, check=True)
        logger.info(f"✅ Node.js {result.stdout.strip()} disponível")
        
        # Verificar se o npm está disponível
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True, check=True)
        logger.info(f"✅ npm {result.stdout.strip()} disponível")
        
        # Verificar se as dependências estão instaladas
        if not Path("node_modules").exists():
            logger.info("📦 Instalando dependências Node.js...")
            subprocess.run(['npm', 'install'], check=True)
            logger.info("✅ Dependências Node.js instaladas")
        else:
            logger.info("✅ Dependências Node.js já instaladas")
        
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Erro ao verificar Node.js: {e}")
        return False
    except FileNotFoundError:
        logger.error("❌ Node.js não encontrado no sistema")
        return False

def check_database_connection():
    """Verificar conexão com banco de dados"""
    try:
        from backend.database_config import db_manager
        
        if db_manager and hasattr(db_manager, 'connect'):
            if db_manager.connect():
                logger.info("✅ Conexão com banco de dados estabelecida")
                return True
            else:
                logger.warning("⚠️ Não foi possível conectar ao banco de dados")
                return False
        else:
            logger.warning("⚠️ db_manager não disponível")
            return False
    except Exception as e:
        logger.warning(f"⚠️ Erro ao verificar banco de dados: {e}")
        return False

def start_backend():
    """Iniciar servidor backend FastAPI"""
    global backend_process
    
    try:
        logger.info("🚀 Iniciando servidor backend FastAPI...")
        
        # Configurações para Railway
        cmd = [
            sys.executable, '-m', 'uvicorn', 
            'backend.app.app:app', 
            '--host', '0.0.0.0', 
            '--port', str(PORT),
            '--workers', '1'
        ]
        
        # Adicionar reload apenas em desenvolvimento
        if RAILWAY_ENVIRONMENT != 'production':
            cmd.append('--reload')
        
        backend_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        processes_to_cleanup.append(backend_process)
        
        # Aguardar inicialização
        time.sleep(8)
        
        if backend_process.poll() is None:
            logger.info(f"✅ Servidor backend FastAPI iniciado na porta {PORT}")
            return True
        else:
            stdout, stderr = backend_process.communicate()
            logger.error(f"❌ Falha ao iniciar servidor backend")
            logger.error(f"STDOUT: {stdout}")
            logger.error(f"STDERR: {stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erro ao iniciar servidor backend: {e}")
        return False

def start_whatsapp_server():
    """Iniciar servidor WhatsApp como processo separado"""
    global whatsapp_process
    
    try:
        logger.info("📱 Iniciando servidor WhatsApp...")
        
        # Verificar se o arquivo existe
        whatsapp_server_path = Path("whatsapp-server-simple.js")
        if not whatsapp_server_path.exists():
            logger.warning("⚠️ whatsapp-server-simple.js não encontrado")
            return False
        
        # Configurar variáveis de ambiente para o processo Node.js
        env = os.environ.copy()
        env['NODE_ENV'] = NODE_ENV
        env['WHATSAPP_PORT'] = '3002'
        
        # Iniciar processo Node.js
        whatsapp_process = subprocess.Popen([
            'node', 'whatsapp-server-simple.js'
        ], 
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
        )
        
        processes_to_cleanup.append(whatsapp_process)
        
        # Aguardar inicialização
        time.sleep(5)
        
        if whatsapp_process.poll() is None:
            logger.info("✅ Servidor WhatsApp iniciado na porta 3002")
            return True
        else:
            stdout, stderr = whatsapp_process.communicate()
            logger.error(f"❌ Falha ao iniciar servidor WhatsApp")
            logger.error(f"STDOUT: {stdout}")
            logger.error(f"STDERR: {stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erro ao iniciar servidor WhatsApp: {e}")
        return False

def check_backend_health():
    """Verificar se o backend está respondendo"""
    try:
        response = requests.get(f"http://localhost:{PORT}/api/health", timeout=10)
        if response.status_code == 200:
            logger.info("✅ Backend: OK")
            return True
        else:
            logger.warning(f"⚠️ Backend: Status {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Backend: Erro - {e}")
        return False

def check_whatsapp_health():
    """Verificar se o WhatsApp server está respondendo"""
    try:
        response = requests.get("http://localhost:3002/api/status", timeout=5)
        if response.status_code == 200:
            logger.info("✅ WhatsApp Server: OK")
            return True
        else:
            logger.warning(f"⚠️ WhatsApp Server: Status {response.status_code}")
            return False
    except Exception as e:
        logger.info("ℹ️ WhatsApp Server: Não está rodando (normal em produção)")
        return False

def monitor_processes():
    """Monitorar processos e reiniciar se necessário"""
    global backend_process, whatsapp_process
    
    while True:
        time.sleep(30)  # Verificar a cada 30 segundos
        
        # Verificar backend
        if backend_process and backend_process.poll() is not None:
            logger.warning("⚠️ Backend parou, tentando reiniciar...")
            if start_backend():
                logger.info("✅ Backend reiniciado com sucesso")
            else:
                logger.error("❌ Falha ao reiniciar backend")
        
        # Verificar WhatsApp (apenas se estiver rodando)
        if whatsapp_process and whatsapp_process.poll() is not None:
            logger.warning("⚠️ WhatsApp Server parou, tentando reiniciar...")
            if start_whatsapp_server():
                logger.info("✅ WhatsApp Server reiniciado com sucesso")
            else:
                logger.error("❌ Falha ao reiniciar WhatsApp Server")

def main():
    """Função principal"""
    logger.info("🚀 SacsMax - Sistema de Gestão de SAC")
    logger.info("=" * 60)
    logger.info(f"🌍 Ambiente: {RAILWAY_ENVIRONMENT}")
    logger.info(f"🔌 Porta: {PORT}")
    logger.info(f"📦 Node.js: {NODE_ENV}")
    
    # Verificar dependências Python
    if not check_dependencies():
        logger.error("❌ Dependências Python não atendidas")
        return False
    
    # Verificar dependências Node.js
    if not check_node_dependencies():
        logger.warning("⚠️ Dependências Node.js não atendidas - WhatsApp não funcionará")
    
    # Verificar banco de dados
    check_database_connection()
    
    # Iniciar backend primeiro
    if not start_backend():
        logger.error("❌ Falha ao iniciar backend")
        return False
    
    # Aguardar backend inicializar
    time.sleep(10)
    
    # Verificar backend
    if not check_backend_health():
        logger.error("❌ Backend não está respondendo")
        return False
    
    # Tentar iniciar WhatsApp server
    whatsapp_started = False
    if check_node_dependencies():
        whatsapp_started = start_whatsapp_server()
        if whatsapp_started:
            time.sleep(5)
            check_whatsapp_health()
    
    logger.info("\n" + "=" * 60)
    logger.info("✅ Sistema iniciado com sucesso!")
    logger.info(f"🌐 Frontend: http://localhost:{PORT}")
    logger.info(f"🔧 Backend API: http://localhost:{PORT}/docs")
    if whatsapp_started:
        logger.info(f"📱 WhatsApp: http://localhost:3002 (automático)")
    else:
        logger.info(f"📱 WhatsApp: http://localhost:3002 (inicie via Settings)")
    logger.info("=" * 60)
    
    # Iniciar monitoramento em thread separada
    monitor_thread = threading.Thread(target=monitor_processes, daemon=True)
    monitor_thread.start()
    
    try:
        # Manter o processo principal rodando
        while True:
            time.sleep(1)
            
            # Verificar se o backend morreu
            if backend_process and backend_process.poll() is not None:
                logger.error("❌ Processo backend parou inesperadamente")
                return False
                
    except KeyboardInterrupt:
        logger.info("\n🛑 Parando sistema...")
        cleanup_processes()
        logger.info("✅ Sistema parado")
        return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
