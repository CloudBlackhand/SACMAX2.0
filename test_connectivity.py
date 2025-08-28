#!/usr/bin/env python3
"""
Script de teste de conectividade do SacsMax
"""

import requests
import time
import sys
from pathlib import Path

def test_backend_health():
    """Testar saúde do backend"""
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ Backend: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend: {e}")
        return False

def test_database():
    """Testar conexão com banco de dados"""
    try:
        response = requests.get("http://localhost:5000/api/database/test", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Database: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ Database: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Database: {e}")
        return False

def test_waha():
    """Testar WAHA"""
    try:
        response = requests.get("http://localhost:5000/api/waha/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ WAHA: {data.get('status', 'unknown')}")
            return True
        else:
            print(f"❌ WAHA: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ WAHA: {e}")
        return False

def test_frontend():
    """Testar frontend"""
    try:
        response = requests.get("http://localhost:5000/", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend: Acessível")
            return True
        else:
            print(f"❌ Frontend: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend: {e}")
        return False

def main():
    """Função principal"""
    print("🔍 Testando conectividade do SacsMax...")
    print("=" * 50)
    
    tests = [
        ("Backend", test_backend_health),
        ("Database", test_database),
        ("WAHA", test_waha),
        ("Frontend", test_frontend)
    ]
    
    results = {}
    
    for name, test_func in tests:
        print(f"\n📊 Testando {name}...")
        results[name] = test_func()
        time.sleep(1)
    
    print("\n" + "=" * 50)
    print("📋 Resumo dos testes:")
    
    all_passed = True
    for name, passed in results.items():
        status = "✅ PASSOU" if passed else "❌ FALHOU"
        print(f"  {name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 Todos os testes passaram! Sistema funcionando corretamente.")
        return 0
    else:
        print("⚠️ Alguns testes falharam. Verifique a configuração.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
