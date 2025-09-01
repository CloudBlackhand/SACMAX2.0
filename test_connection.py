#!/usr/bin/env python3
"""
Script para testar conexão entre Backend e WhatsApp Server
"""

import requests
import json

def test_whatsapp_server():
    """Testar WhatsApp Server diretamente"""
    print("🔍 Testando WhatsApp Server...")
    
    try:
        # Testar status
        response = requests.get("http://localhost:3002/api/status", timeout=5)
        print(f"✅ Status WhatsApp Server: {response.status_code}")
        print(f"📄 Resposta: {response.json()}")
        
        # Ativar WhatsApp
        response = requests.post("http://localhost:3002/api/whatsapp/enable", timeout=10)
        print(f"✅ Ativar WhatsApp: {response.status_code}")
        print(f"📄 Resposta: {response.json()}")
        
        # Gerar QR Code
        response = requests.post("http://localhost:3002/api/whatsapp/generate-qr", timeout=10)
        print(f"✅ Gerar QR Code: {response.status_code}")
        print(f"📄 Resposta: {response.json()}")
        
        # Obter QR Code
        response = requests.get("http://localhost:3002/api/whatsapp/qr", timeout=10)
        print(f"✅ Obter QR Code: {response.status_code}")
        data = response.json()
        print(f"📄 Sucesso: {data.get('success')}")
        print(f"📄 Status: {data.get('status')}")
        print(f"📄 QR Code presente: {'qr' in data and data['qr'] is not None}")
        
        if data.get('success') and data.get('qr'):
            qr_data = data['qr']
            if qr_data.startswith('data:image/png;base64,'):
                print("✅ QR Code REAL detectado (Base64 PNG)")
            elif qr_data.startswith('https://'):
                print("❌ QR Code FALSO detectado (URL)")
            else:
                print(f"❓ QR Code desconhecido: {qr_data[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_backend():
    """Testar Backend"""
    print("\n🔍 Testando Backend...")
    
    try:
        # Testar se backend está rodando
        response = requests.get("http://localhost:5000/health", timeout=5)
        print(f"✅ Backend rodando: {response.status_code}")
        
        # Testar QR Code via backend
        response = requests.get("http://localhost:5000/api/whatsapp/qr", timeout=10)
        print(f"✅ QR Code via Backend: {response.status_code}")
        data = response.json()
        print(f"📄 Sucesso: {data.get('success')}")
        print(f"📄 Status: {data.get('status')}")
        print(f"📄 QR Code presente: {'qr' in data and data['qr'] is not None}")
        
        if data.get('success') and data.get('qr'):
            qr_data = data['qr']
            if qr_data.startswith('data:image/png;base64,'):
                print("✅ QR Code REAL detectado (Base64 PNG)")
            elif qr_data.startswith('https://'):
                print("❌ QR Code FALSO detectado (URL)")
            else:
                print(f"❓ QR Code desconhecido: {qr_data[:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Teste de Conexão - WhatsApp Server + Backend")
    print("=" * 50)
    
    # Testar WhatsApp Server
    whatsapp_ok = test_whatsapp_server()
    
    # Testar Backend
    backend_ok = test_backend()
    
    print("\n" + "=" * 50)
    print("📊 RESULTADO FINAL:")
    print(f"📱 WhatsApp Server: {'✅ OK' if whatsapp_ok else '❌ FALHOU'}")
    print(f"🔧 Backend: {'✅ OK' if backend_ok else '❌ FALHOU'}")
    
    if whatsapp_ok and backend_ok:
        print("🎉 TUDO FUNCIONANDO! QR Code REAL deve estar disponível!")
    else:
        print("⚠️ Há problemas que precisam ser resolvidos.")
