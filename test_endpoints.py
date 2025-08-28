#!/usr/bin/env python3
"""
Script para testar todos os endpoints do WhatsApp e WAHA
"""

import requests
import json
import time

# Configuração
BASE_URL = "http://localhost:5000"

def test_endpoint(endpoint, method="GET", data=None, description=""):
    """Testar um endpoint específico"""
    try:
        url = f"{BASE_URL}{endpoint}"
        print(f"\n🔍 Testando: {description}")
        print(f"   URL: {url}")
        print(f"   Método: {method}")
        
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"   ✅ Sucesso: {result.get('success', 'N/A')}")
                if 'data' in result:
                    print(f"   📊 Dados: {len(result['data']) if isinstance(result['data'], list) else 'Object'}")
            except:
                print(f"   ✅ Resposta: {response.text[:100]}...")
        else:
            print(f"   ❌ Erro: {response.text}")
            
        return response.status_code == 200
        
    except Exception as e:
        print(f"   ❌ Exceção: {e}")
        return False

def main():
    print("🚀 Testando Endpoints do WhatsApp e WAHA")
    print("=" * 50)
    
    # Lista de endpoints para testar
    endpoints = [
        # Endpoints de Status
        ("/api/health", "GET", None, "Health Check"),
        ("/api/waha/status", "GET", None, "Status WAHA"),
        ("/api/whatsapp/status", "GET", None, "Status WhatsApp"),
        
        # Endpoints de Sessão
        ("/api/waha/sessions", "POST", {"session_name": "sacsmax"}, "Criar Sessão WAHA"),
        ("/api/whatsapp/session/create", "POST", None, "Criar Sessão WhatsApp"),
        
        # Endpoints de Contatos
        ("/api/waha/contacts", "GET", None, "Contatos WAHA"),
        ("/api/whatsapp/contacts", "GET", None, "Contatos WhatsApp"),
        ("/api/whatsapp/produtividade/contacts", "GET", None, "Contatos Produtividade"),
        
        # Endpoints de Chats
        ("/api/whatsapp/chats", "GET", None, "Chats WhatsApp"),
        
        # Endpoints de Mensagens
        ("/api/whatsapp/send", "POST", {
            "phone": "5511999999999",
            "message": "Teste de mensagem",
            "message_type": "text"
        }, "Enviar Mensagem"),
        
        # Endpoints de Screenshot
        ("/api/waha/screenshot", "GET", None, "Screenshot WAHA"),
        ("/api/whatsapp/screenshot", "GET", None, "Screenshot WhatsApp"),
    ]
    
    results = []
    
    for endpoint, method, data, description in endpoints:
        success = test_endpoint(endpoint, method, data, description)
        results.append((description, success))
        time.sleep(1)  # Pausa entre testes
    
    # Resumo
    print("\n" + "=" * 50)
    print("📊 RESUMO DOS TESTES")
    print("=" * 50)
    
    total = len(results)
    successful = sum(1 for _, success in results if success)
    
    for description, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {description}")
    
    print(f"\n🎯 Resultado: {successful}/{total} endpoints funcionando")
    
    if successful == total:
        print("🎉 TODOS OS ENDPOINTS ESTÃO FUNCIONANDO!")
    else:
        print("⚠️ Alguns endpoints precisam de atenção")

if __name__ == "__main__":
    main()
