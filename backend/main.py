"""
SACSMAX Backend - Sistema de Automação de Contatos e Feedback
Backend Python com FastAPI para integração com WhatsApp e Excel
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import uvicorn
import os
from pathlib import Path

app = FastAPI(
    title="SACSMAX API",
    description="Sistema de Automação de Contatos e Feedback",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos do frontend
frontend_path = Path("../frontend")
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")

@app.get("/", response_class=HTMLResponse)
async def root():
    """Página inicial"""
    return """
    <html>
        <head><title>SACSMAX</title></head>
        <body>
            <h1>SACSMAX Backend</h1>
            <p>API está funcionando! Acesse <a href="/docs">/docs</a> para documentação.</p>
        </body>
    </html>
    """

@app.get("/health")
async def health_check():
    """Verificação de saúde da API"""
    return {
        "status": "healthy",
        "version": "2.1.0",
        "services": {
            "database": "not_configured",
            "whatsapp": "not_configured",
            "excel": "not_configured"
        }
    }

@app.get("/api/test")
async def test_endpoint():
    """Endpoint de teste"""
    return {
        "message": "SACSMAX API funcionando!",
        "status": "success"
    }

@app.post("/api/excel/upload")
async def upload_excel_file(file: UploadFile = File(...)):
    """Upload de arquivo Excel (simulado)"""
    return {
        "message": "Arquivo recebido (modo simulação)",
        "filename": file.filename,
        "size": file.size
    }

@app.get("/api/whatsapp/status")
async def whatsapp_status():
    """Status do WhatsApp (simulado)"""
    return {
        "connected": False,
        "session_active": False,
        "message": "WhatsApp em modo simulação"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )

