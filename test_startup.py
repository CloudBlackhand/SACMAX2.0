#!/usr/bin/env python3
"""
Script de teste para verificar se o sistema SacsMax inicia corretamente
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def test_dependencies():
    """Testa se as dependências estão instaladas"""
    print("🔍 Testando dependências...")
    
    try:
        import flask
        print("✅ Flask instalado")
    except ImportError:
        print("❌ Flask não encontrado")
        return False
    
    try:
        import requests
        print("✅ Requests instalado")
    except ImportError:
        print("❌ Requests não encontrado")
        return False
    
    return True

def test_node_installation():
    """Testa se o Node.js está instalado"""
    print("🔍 Testando Node.js...")
    
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✅ Node.js instalado: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Node.js não encontrado")
        return False

def test_npm_installation():
    """Testa se o npm está instalado"""
    print("🔍 Testando npm...")
    
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, text=True, check=True)
        print(f"✅ npm instalado: {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ npm não encontrado")
        return False

def test_file_structure():
    """Testa se a estrutura de arquivos está correta"""
    print("🔍 Testando estrutura de arquivos...")
    
    required_files = [
        'railway_startup.py',
        'requirements.txt',
        'railway.json',
        'Procfile',
        'runtime.txt',
        'frontend/index.html',
        'frontend/main.js',
        'frontend/package.json'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
        else:
            print(f"✅ {file_path}")
    
    if missing_files:
        print("❌ Arquivos faltando:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    return True

def test_frontend_modules():
    """Testa se os módulos do frontend existem"""
    print("🔍 Testando módulos do frontend...")
    
    modules_dir = Path('frontend/modules')
    if not modules_dir.exists():
        print("❌ Diretório frontend/modules não encontrado")
        return False
    
    required_modules = [
        'dashboard.js',
        'excel.js',
        'whatsapp.js',
        'bot.js',
        'contacts.js',
        'settings.js'
    ]
    
    missing_modules = []
    for module in required_modules:
        module_path = modules_dir / module
        if not module_path.exists():
            missing_modules.append(module)
        else:
            print(f"✅ {module}")
    
    if missing_modules:
        print("❌ Módulos faltando:")
        for module in missing_modules:
            print(f"   - {module}")
        return False
    
    return True

def test_backend_creation():
    """Testa se o backend pode ser criado"""
    print("🔍 Testando criação do backend...")
    
    try:
        # Importa a função do railway_startup.py
        sys.path.append('.')
        from railway_startup import create_simple_backend
        
        if create_simple_backend():
            print("✅ Backend criado com sucesso")
            return True
        else:
            print("✅ Backend já existe")
            return True
    except Exception as e:
        print(f"❌ Erro ao criar backend: {e}")
        return False

def test_port_availability():
    """Testa se as portas estão disponíveis"""
    print("🔍 Testando disponibilidade de portas...")
    
    import socket
    
    def is_port_available(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('localhost', port))
                return True
            except OSError:
                return False
    
    port = int(os.environ.get('PORT', 3000))
    backend_port = port + 1
    
    if is_port_available(port):
        print(f"✅ Porta {port} disponível (frontend)")
    else:
        print(f"⚠️  Porta {port} em uso (frontend)")
    
    if is_port_available(backend_port):
        print(f"✅ Porta {backend_port} disponível (backend)")
    else:
        print(f"⚠️  Porta {backend_port} em uso (backend)")
    
    return True

def main():
    """Função principal de teste"""
    print("=" * 60)
    print("🧪 Teste do Sistema SacsMax")
    print("=" * 60)
    
    tests = [
        ("Dependências Python", test_dependencies),
        ("Node.js", test_node_installation),
        ("npm", test_npm_installation),
        ("Estrutura de arquivos", test_file_structure),
        ("Módulos do frontend", test_frontend_modules),
        ("Criação do backend", test_backend_creation),
        ("Disponibilidade de portas", test_port_availability)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 {test_name}:")
        try:
            if test_func():
                passed += 1
            else:
                print(f"❌ Teste '{test_name}' falhou")
        except Exception as e:
            print(f"❌ Erro no teste '{test_name}': {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 Resultado: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 Todos os testes passaram! O sistema está pronto para deploy.")
        print("\n🚀 Para iniciar o sistema:")
        print("   python railway_startup.py")
    else:
        print("⚠️  Alguns testes falharam. Verifique os erros acima.")
        sys.exit(1)

if __name__ == '__main__':
    main()
