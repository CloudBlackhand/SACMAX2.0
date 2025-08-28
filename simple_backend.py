#!/usr/bin/env python3
"""
Backend Simplificado - Apenas Proxy para WhatsApp Server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import requests
import uvicorn

# Configuração
WHATSAPP_API_URL = "http://localhost:3002"

# Criar aplicação FastAPI
app = FastAPI(
    title="SacsMax Simple Backend",
    description="Backend simplificado para WhatsApp",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check"""
    return {"status": "healthy", "service": "sacsmax-simple-backend"}

@app.get("/api/whatsapp/status")
async def get_whatsapp_status():
    """Status do WhatsApp"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return {
                "connected": data.get("isEnabled", False),
                "session_active": data.get("isEnabled", False),
                "websocket_connections": data.get("connections", 0),
                "status": "running" if data.get("status") == "running" else "error"
            }
        else:
            return {
                "connected": False,
                "session_active": False,
                "websocket_connections": 0,
                "status": "error"
            }
    except Exception as e:
        return {
            "connected": False,
            "session_active": False,
            "websocket_connections": 0,
            "status": "not_available"
        }

@app.post("/api/whatsapp/enable")
async def enable_whatsapp():
    """Ativar WhatsApp"""
    try:
        response = requests.post(f"{WHATSAPP_API_URL}/api/whatsapp/enable", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            return {"success": False, "message": "Erro ao ativar WhatsApp"}
    except Exception as e:
        return {"success": False, "message": f"Erro: {str(e)}"}

@app.post("/api/whatsapp/disable")
async def disable_whatsapp():
    """Desativar WhatsApp"""
    try:
        response = requests.post(f"{WHATSAPP_API_URL}/api/whatsapp/disable", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            return {"success": False, "message": "Erro ao desativar WhatsApp"}
    except Exception as e:
        return {"success": False, "message": f"Erro: {str(e)}"}

@app.post("/api/whatsapp/generate-qr")
async def generate_qr_code():
    """Gerar QR Code"""
    try:
        response = requests.post(f"{WHATSAPP_API_URL}/api/whatsapp/generate-qr", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            return {"success": False, "message": "Erro ao gerar QR Code"}
    except Exception as e:
        return {"success": False, "message": f"Erro: {str(e)}"}

@app.get("/api/whatsapp/qr")
async def get_whatsapp_qr():
    """Obter QR Code REAL"""
    try:
        response = requests.get(f"{WHATSAPP_API_URL}/api/whatsapp/qr", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ QR Code obtido do WhatsApp Server: {data.get('success')}")
            return data
        else:
            print(f"❌ Erro ao obter QR Code: {response.status_code}")
            return {"success": False, "message": "Erro ao obter QR Code"}
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return {"success": False, "message": f"Erro de conexão: {str(e)}"}

if __name__ == "__main__":
    print("🚀 Iniciando Backend Simplificado...")
    print(f"📱 Conectando ao WhatsApp Server: {WHATSAPP_API_URL}")
    uvicorn.run(app, host="0.0.0.0", port=5000)
