#!/usr/bin/env python3
"""
SacsMax - Sistema de Gestão de SAC
Script de inicialização simplificado para Railway
Versão 2.4 - Backend Python apenas
"""

import os
import sys
import subprocess
import time
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

# Processo global
backend_process = None

def cleanup_processes():
    """Limpar processos ao sair"""
    global backend_process
    try:
        if backend_process and backend_process.poll() is None:
            backend_process.terminate()
            backend_process.wait(timeout=5)
            logger.info("✅ Backend parado")
    except:
        if backend_process:
            backend_process.kill()
            logger.info("⚠️ Backend forçado a parar")

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
            '--port', str(PORT)
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

def main():
    """Função principal"""
    logger.info("🚀 SacsMax - Sistema de Gestão de SAC")
    logger.info("=" * 60)
    logger.info(f"🌍 Ambiente: {RAILWAY_ENVIRONMENT}")
    logger.info(f"🔌 Porta: {PORT}")
    
    # Verificar dependências Python
    if not check_dependencies():
        logger.error("❌ Dependências Python não atendidas")
        return False
    
    # Iniciar backend
    if not start_backend():
        logger.error("❌ Falha ao iniciar backend")
        return False
    
    logger.info("\n" + "=" * 60)
    logger.info("✅ Sistema iniciado com sucesso!")
    logger.info(f"🌐 Frontend: http://localhost:{PORT}")
    logger.info(f"🔧 Backend API: http://localhost:{PORT}/docs")
    logger.info("📱 WhatsApp: Será adicionado em breve")
    logger.info("=" * 60)
    
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
