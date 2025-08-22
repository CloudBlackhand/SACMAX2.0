#!/usr/bin/env python3
"""
SacsMax - Sistema de Gestão de SAC
Script de inicialização para Railway
"""

import os
import sys
import subprocess
import time
import threading
from pathlib import Path

def check_dependencies():
    """Verificar dependências Python"""
    required_packages = ['fastapi', 'uvicorn']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"❌ Dependências faltando: {missing_packages}")
        print("⚠️ Instale as dependências manualmente:")
        print("pip3 install fastapi uvicorn")
        return False
    
        print("✅ Dependências Python verificadas")
    return True

def check_frontend_dependencies():
    """Verificar dependências do frontend"""
    frontend_dir = Path(__file__).parent / 'frontend'
    package_json = frontend_dir / 'package.json'
    
    if package_json.exists():
        print("✅ Dependências do frontend já instaladas")
        return True
    else:
        print("⚠️ Frontend não encontrado")
        return False

def start_whatsapp_server():
    """Iniciar servidor WhatsApp Web.js"""
    try:
        print("🚀 Iniciando servidor WhatsApp Web.js...")
        
        # Verificar se o servidor WhatsApp existe
        whatsapp_server = Path(__file__).parent / 'whatsapp-server.js'
        if not whatsapp_server.exists():
            print("⚠️ Servidor WhatsApp não encontrado")
            return None
        
        # Iniciar servidor WhatsApp na porta 3001
        whatsapp_process = subprocess.Popen(
            ['node', str(whatsapp_server)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Aguardar um pouco para verificar se iniciou
        time.sleep(3)
        
        if whatsapp_process.poll() is None:
            print("✅ Servidor WhatsApp Web.js iniciado na porta 3001")
            return whatsapp_process
        else:
            print("❌ Falha ao iniciar servidor WhatsApp")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao iniciar servidor WhatsApp: {e}")
        return None

def start_backend():
    """Iniciar servidor backend FastAPI"""
    try:
        print("🚀 Iniciando servidor backend FastAPI...")
        
        backend_file = Path(__file__).parent / 'backend' / 'main.py'
        
        if not backend_file.exists():
            print("❌ Arquivo backend/main.py não encontrado")
            return None
        
        # Iniciar backend na porta 5000
        backend_process = subprocess.Popen(
            [sys.executable, str(backend_file)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Aguardar um pouco para verificar se iniciou
        time.sleep(3)
        
        if backend_process.poll() is None:
            print("✅ Backend FastAPI iniciado na porta 5000")
            return backend_process
        else:
            print("❌ Falha ao iniciar backend")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao iniciar backend: {e}")
        return None

def start_frontend():
    """Iniciar servidor frontend"""
    try:
        print("🌐 Iniciando servidor frontend...")
        
        frontend_dir = Path(__file__).parent / 'frontend'
        
        if not frontend_dir.exists():
            print("⚠️ Diretório frontend não encontrado")
            return None
        
        # Verificar se serve está instalado
        try:
            subprocess.run(['npx', 'serve', '--version'], check=True, capture_output=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Instalando serve...")
            subprocess.run(['npm', 'install', '-g', 'serve'], check=True)
        
        # Iniciar frontend na porta 3000
        frontend_process = subprocess.Popen(
            ['npx', 'serve', '-s', str(frontend_dir), '-l', '3000'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Aguardar um pouco para verificar se iniciou
        time.sleep(3)
        
        if frontend_process.poll() is None:
            print("✅ Frontend iniciado na porta 3000")
            return frontend_process
        else:
            print("❌ Falha ao iniciar frontend")
            return None
            
    except Exception as e:
        print(f"❌ Erro ao iniciar frontend: {e}")
        return None

def main():
    """Função principal"""
    print("=" * 50)
    print("🚀 SacsMax - Sistema de Gestão de SAC")
    print("=" * 50)
    
    # Verificar dependências
    if not check_dependencies():
        print("❌ Falha na verificação de dependências")
        return
    
    check_frontend_dependencies()
    
    # Iniciar servidor WhatsApp
    whatsapp_process = start_whatsapp_server()
    
    # Iniciar backend
    backend_process = start_backend()
    
    # Iniciar frontend
    frontend_process = start_frontend()
    
    print("=" * 50)
    print("✅ Sistema iniciado com sucesso!")
    print("🌐 Frontend: http://localhost:3000")
    print("🔧 Backend: http://localhost:5000")
    print("📱 WhatsApp: http://localhost:3001")
    print("📚 API Docs: http://localhost:5000/docs")
    print("=" * 50)
    
    try:
        # Manter processos rodando
        while True:
            time.sleep(10)
            
            # Verificar se os processos ainda estão rodando
            if backend_process and backend_process.poll() is not None:
                print("❌ Backend parou inesperadamente")
                break
                
            if frontend_process and frontend_process.poll() is not None:
                print("❌ Frontend parou inesperadamente")
                break
            
            if whatsapp_process and whatsapp_process.poll() is not None:
                print("❌ Servidor WhatsApp parou inesperadamente")
                break
                
    except KeyboardInterrupt:
        print("\n🛑 Encerrando sistema...")
    
    finally:
        # Encerrar processos
        if frontend_process:
            frontend_process.terminate()
            print("✅ Frontend encerrado")
        
        if backend_process:
            backend_process.terminate()
            print("✅ Backend encerrado")
            
        if whatsapp_process:
            whatsapp_process.terminate()
            print("✅ Servidor WhatsApp encerrado")
        
        print("👋 Sistema encerrado")

if __name__ == "__main__":
    main()
