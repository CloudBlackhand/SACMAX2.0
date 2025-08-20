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

# Importações condicionais para evitar erros
try:
    from app.core.config import settings
    from app.api.routes import excel, whatsapp, feedback, contacts, auth
    from app.core.database import engine, Base
    from app.services.whatsapp_service import WhatsAppService
    from app.services.excel_service import ExcelService
except ImportError as e:
    print(f"⚠️ Erro de importação: {e}")
    # Criar versões simplificadas para evitar erros
    settings = None
    excel = None
    whatsapp = None
    feedback = None
    contacts = None
    auth = None
    engine = None
    Base = None
    WhatsAppService = None
    ExcelService = None

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

# Incluir rotas da API apenas se os módulos existirem
if auth:
    app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
if excel:
    app.include_router(excel.router, prefix="/api/excel", tags=["Excel"])
if whatsapp:
    app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["WhatsApp"])
if feedback:
    app.include_router(feedback.router, prefix="/api/feedback", tags=["Feedback"])
if contacts:
    app.include_router(contacts.router, prefix="/api/contacts", tags=["Contatos"])

# Instâncias globais dos serviços
whatsapp_service = WhatsAppService() if WhatsAppService else None
excel_service = ExcelService() if ExcelService else None

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
            "database": "connected" if engine else "not_configured",
            "whatsapp": whatsapp_service.get_status() if whatsapp_service else "not_configured",
            "excel": "ready" if excel_service else "not_configured"
        }
    }

@app.on_event("startup")
async def startup_event():
    """Evento de inicialização da aplicação"""
    print("🚀 SACSMAX Backend iniciando...")
    
    # Inicializar serviços apenas se existirem
    if whatsapp_service:
        try:
            await whatsapp_service.initialize()
        except Exception as e:
            print(f"⚠️ Erro ao inicializar WhatsApp: {e}")
    
    if excel_service:
        try:
            await excel_service.initialize()
        except Exception as e:
            print(f"⚠️ Erro ao inicializar Excel: {e}")
    
    print("✅ SACSMAX Backend iniciado com sucesso!")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento de encerramento da aplicação"""
    print("🛑 Encerrando SACSMAX Backend...")
    if whatsapp_service:
        try:
            await whatsapp_service.cleanup()
        except Exception as e:
            print(f"⚠️ Erro ao limpar WhatsApp: {e}")
    print("✅ SACSMAX Backend encerrado!")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )

