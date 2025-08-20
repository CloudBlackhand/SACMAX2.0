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

from app.core.config import settings
from app.api.routes import excel, whatsapp, feedback, contacts, auth
from app.core.database import engine, Base
from app.services.whatsapp_service import WhatsAppService
from app.services.excel_service import ExcelService

# Criar tabelas do banco
Base.metadata.create_all(bind=engine)

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
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos do frontend
frontend_path = Path("../frontend")
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")

# Incluir rotas da API
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(excel.router, prefix="/api/excel", tags=["Excel"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["Feedback"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contatos"])

# Instâncias globais dos serviços
whatsapp_service = WhatsAppService()
excel_service = ExcelService()

@app.get("/", response_class=HTMLResponse)
async def root():
    """Página inicial - redireciona para o frontend"""
    frontend_file = frontend_path / "webInterface.js"
    if frontend_file.exists():
        return FileResponse(str(frontend_file), media_type="text/html")
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
            "database": "connected",
            "whatsapp": whatsapp_service.get_status(),
            "excel": "ready"
        }
    }

@app.on_event("startup")
async def startup_event():
    """Evento de inicialização da aplicação"""
    print("🚀 SACSMAX Backend iniciando...")
    
    # Inicializar serviços
    await whatsapp_service.initialize()
    await excel_service.initialize()
    
    print("✅ SACSMAX Backend iniciado com sucesso!")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento de encerramento da aplicação"""
    print("🛑 Encerrando SACSMAX Backend...")
    await whatsapp_service.cleanup()
    print("✅ SACSMAX Backend encerrado!")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )

