#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste para WAHA
"""

import requests
import json

def test_waha():
    print("Testando WAHA...")
    
    try:
        response = requests.get("http://localhost:3000/api/status", timeout=5)
        if response.status_code == 200:
            print("WAHA esta rodando!")
            return True
        else:
            print(f"WAHA retornou status {response.status_code}")
            return False
    except:
        print("WAHA nao esta rodando")
        return False

def test_backend():
    print("Testando Backend...")
    
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("Backend esta rodando!")
            return True
        else:
            print(f"Backend retornou status {response.status_code}")
            return False
    except:
        print("Backend nao esta rodando")
        return False

def main():
    print("=== Teste WAHA ===")
    
    waha_ok = test_waha()
    backend_ok = test_backend()
    
    if waha_ok and backend_ok:
        print("Sistema funcionando!")
    else:
        print("Execute: docker-compose up")

if __name__ == "__main__":
    main()
