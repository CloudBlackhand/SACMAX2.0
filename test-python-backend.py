#!/usr/bin/env python3
"""
Teste do novo backend Python
"""

import requests
import json
import time

def test_python_backend():
    base_url = "http://localhost:3000"
    
    print("🐍 Testando Backend Python...\n")
    
    # 1. Testar health check
    print("1. Testando Health Check...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Health Check: OK")
            print(f"   📊 Status: {response.json()}")
        else:
            print(f"   ❌ Health Check: Erro {response.status_code}")
    except Exception as e:
        print(f"   ❌ Health Check: {e}")
    
    # 2. Testar estatísticas
    print("\n2. Testando Estatísticas...")
    try:
        response = requests.get(f"{base_url}/api/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print("   ✅ Estatísticas: OK")
            print(f"   📊 Banco: {'✅' if stats['stats']['database']['available'] else '❌'}")
            print(f"   📱 WhatsApp: {'✅' if stats['stats']['whatsapp']['available'] else '❌'}")
        else:
            print(f"   ❌ Estatísticas: Erro {response.status_code}")
    except Exception as e:
        print(f"   ❌ Estatísticas: {e}")
    
    # 3. Testar listagem de clientes
    print("\n3. Testando Listagem de Clientes...")
    try:
        response = requests.get(f"{base_url}/api/clients", timeout=5)
        if response.status_code == 200:
            clients = response.json()
            print("   ✅ Clientes: OK")
            print(f"   👥 Total: {clients['total']} clientes")
        else:
            print(f"   ❌ Clientes: Erro {response.status_code}")
    except Exception as e:
        print(f"   ❌ Clientes: {e}")
    
    # 4. Testar classificação de feedback
    print("\n4. Testando Classificação de Feedback...")
    try:
        test_texts = [
            "Excelente atendimento, muito satisfeito!",
            "Péssimo serviço, não recomendo.",
            "O produto é bom, mas poderia melhorar."
        ]
        
        for text in test_texts:
            response = requests.post(
                f"{base_url}/api/feedback/classify",
                json={"text": text},
                timeout=5
            )
            if response.status_code == 200:
                result = response.json()
                print(f"   📝 '{text[:30]}...' -> {result['sentiment']} ({result['confidence']:.1%})")
            else:
                print(f"   ❌ Classificação: Erro {response.status_code}")
    except Exception as e:
        print(f"   ❌ Classificação: {e}")
    
    # 5. Testar status do WhatsApp
    print("\n5. Testando Status do WhatsApp...")
    try:
        response = requests.get(f"{base_url}/api/whatsapp/status", timeout=5)
        if response.status_code == 200:
            status = response.json()
            print("   ✅ WhatsApp Status: OK")
            print(f"   📱 Conectado: {'✅' if status['connected'] else '❌'}")
            print(f"   🟢 Pronto: {'✅' if status['ready'] else '❌'}")
        else:
            print(f"   ❌ WhatsApp Status: Erro {response.status_code}")
    except Exception as e:
        print(f"   ❌ WhatsApp Status: {e}")
    
    print("\n🎉 Teste do Backend Python concluído!")

if __name__ == "__main__":
    test_python_backend()
