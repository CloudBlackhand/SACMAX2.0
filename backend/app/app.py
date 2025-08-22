#!/usr/bin/env python3
"""
SacsMax Backend - API completa com FastAPI e integração de banco de dados PostgreSQL
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
import uvicorn
import os
import json
from datetime import datetime
import threading
import time
from pathlib import Path
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importações condicionais para evitar erros
try:
    from excel_to_database import ExcelToDatabaseConverter
    from database_config import db_manager, init_database, close_database
    from feedback_analyzer import feedback_analyzer
    from app.services.whatsapp_service import WhatsAppService
    from app.services.excel_service import ExcelService
except ImportError as e:
    print(f"⚠️ Erro de importação: {e}")
    ExcelToDatabaseConverter = None
    db_manager = None
    feedback_analyzer = None
    WhatsAppService = None
    ExcelService = None

# Configuração
PORT = int(os.environ.get('BACKEND_PORT', 5000))
FRONTEND_DIR = Path(__file__).parent.parent / 'frontend'

# Criar aplicação FastAPI
app = FastAPI(
    title="SacsMax API",
    description="Sistema de Gestão de SAC com WhatsApp e Excel",
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
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

# Dados em memória (fallback se banco não estiver disponível)
contacts = []
messages = []
bot_config = {
    "name": "SacsMax Bot",
    "enabled": True,
    "welcome_message": "Olá! Como posso ajudar?",
    "working_hours": {"start": "08:00", "end": "18:00"}
}

# Instâncias dos serviços
whatsapp_service = WhatsAppService() if WhatsAppService else None
excel_service = ExcelService() if ExcelService else None

@app.get("/", response_class=HTMLResponse)
async def index():
    """Serve o frontend"""
    frontend_file = FRONTEND_DIR / "index.html"
    if frontend_file.exists():
        return FileResponse(str(frontend_file), media_type="text/html")
    return """
    <html>
        <head><title>SacsMax</title></head>
        <body>
            <h1>SacsMax Backend</h1>
            <p>API está funcionando! Acesse <a href="/docs">/docs</a> para documentação.</p>
        </body>
    </html>
    """

@app.get("/api/health")
async def health():
    """Endpoint de saúde"""
    db_status = "connected" if db_manager and db_manager.connection else "disconnected"
    whatsapp_status = whatsapp_service.get_status() if whatsapp_service else "not_available"
    excel_status = "ready" if excel_service else "not_available"
    
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "SacsMax Backend",
        "database": db_status,
        "whatsapp": whatsapp_status,
        "excel": excel_status,
        "version": "2.1.0"
    }

@app.get("/api/stats")
async def get_stats():
    """Estatísticas do sistema"""
    if db_manager and db_manager.connection:
        try:
            # Estatísticas do banco PostgreSQL
            tables = db_manager.get_tables()
            total_records = 0
            
            for table in tables:
                count = db_manager.get_table_count(table['table_name'])
                total_records += count
            
            return {
                "total_tables": len(tables),
                "total_records": total_records,
                "tables": [t['table_name'] for t in tables],
                "database": "postgresql"
            }
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
    
    # Fallback para dados em memória
    return {
        "total_contacts": len(contacts),
        "total_messages": len(messages),
        "online_contacts": len([c for c in contacts if c.get('status') == 'online']),
        "unread_messages": len([m for m in messages if not m.get('read')]),
        "database": "memory"
    }

@app.get("/api/database/tables")
async def get_tables():
    """Lista todas as tabelas do banco"""
    if not db_manager or not db_manager.connection:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    try:
        tables = db_manager.get_tables()
        table_info = []
        
        for table in tables:
            table_name = table['table_name']
            count = db_manager.get_table_count(table_name)
            table_info.append({
                "name": table_name,
                "count": count
            })
        
        return {
            "tables": table_info,
            "total_tables": len(tables)
        }
    except Exception as e:
        logger.error(f"Erro ao obter tabelas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contacts")
async def get_contacts():
    """Listar contatos"""
    if db_manager and db_manager.connection:
        try:
            # Buscar contatos do banco
            query = "SELECT * FROM contacts LIMIT 100"
            result = db_manager.execute_query(query)
            return {"contacts": result}
        except Exception as e:
            logger.error(f"Erro ao buscar contatos: {e}")
    
    # Fallback para dados em memória
    return {"contacts": contacts}

@app.post("/api/contacts")
async def create_contact(contact: dict):
    """Criar novo contato"""
    contact['id'] = len(contacts) + 1
    contact['created_at'] = datetime.now().isoformat()
    contacts.append(contact)
    return contact

@app.get("/api/messages")
async def get_messages(contact_id: int = None):
    """Listar mensagens"""
    if contact_id:
        filtered_messages = [m for m in messages if m.get('contact_id') == contact_id]
        return {"messages": filtered_messages}
    return {"messages": messages}

@app.post("/api/messages")
async def create_message(message: dict):
    """Criar nova mensagem"""
    message['id'] = len(messages) + 1
    message['timestamp'] = datetime.now().isoformat()
    message['read'] = False
    messages.append(message)
    return message

@app.get("/api/bot/config")
async def get_bot_config():
    """Obter configuração do bot"""
    return bot_config

@app.put("/api/bot/config")
async def update_bot_config(config: dict):
    """Atualizar configuração do bot"""
    bot_config.update(config)
    return bot_config

# Endpoints do WhatsApp
@app.get("/api/whatsapp/status")
async def get_whatsapp_status():
    """Status do WhatsApp"""
    if not whatsapp_service:
        return {
            "connected": False,
            "session_active": False,
            "message": "WhatsApp service não disponível"
        }
    
    return whatsapp_service.get_status()

@app.post("/api/whatsapp/start")
async def start_whatsapp_session(session_name: str = "default"):
    """Iniciar sessão do WhatsApp"""
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service não disponível")
    
    try:
        result = await whatsapp_service.start_whatsapp_session(session_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/stop")
async def stop_whatsapp_session():
    """Parar sessão do WhatsApp"""
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service não disponível")
    
    try:
        result = await whatsapp_service.stop_whatsapp_session()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/whatsapp/qr")
async def get_qr_code():
    """Obter QR Code da sessão atual"""
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service não disponível")
    
    try:
        qr_code = await whatsapp_service.get_qr_code()
        if qr_code:
            return {"qr_code": qr_code}
        else:
            return {"message": "QR Code não disponível"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/send")
async def send_whatsapp_message(message: dict):
    """Enviar mensagem WhatsApp"""
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service não disponível")
    
    try:
        phone = message.get('phone')
        text = message.get('message')
        message_type = message.get('type', 'text')
        
        if not phone or not text:
            raise HTTPException(status_code=400, detail="Phone e message são obrigatórios")
        
        result = await whatsapp_service.send_message(phone, text, message_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/bulk")
async def send_bulk_messages(request: dict):
    """Enviar mensagens em lote"""
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service não disponível")
    
    try:
        contacts = request.get('contacts', [])
        message_template = request.get('message_template', '')
        delay = request.get('delay', 2)
        
        if not contacts or not message_template:
            raise HTTPException(status_code=400, detail="Contacts e message_template são obrigatórios")
        
        result = await whatsapp_service.send_bulk_messages(contacts, message_template, delay)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoints do Excel
@app.post("/api/excel/upload")
async def upload_excel(file: UploadFile = File(...)):
    """Upload de arquivo Excel"""
    if not excel_service:
        raise HTTPException(status_code=503, detail="Excel service não disponível")
    
    try:
        # Validar arquivo
        excel_service.validate_file(file)
        
        # Salvar arquivo
        file_path = await excel_service.save_uploaded_file(file)
        
        # Processar arquivo
        result = excel_service.process_excel_for_contacts(file_path)
        
        return {
            "status": "success",
            "message": "Arquivo processado com sucesso",
            "filename": file.filename,
            "file_path": file_path,
            "result": result
        }
    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/excel/files")
async def list_excel_files():
    """Listar arquivos Excel enviados"""
    if not excel_service:
        raise HTTPException(status_code=503, detail="Excel service não disponível")
    
    try:
        files = excel_service.list_uploaded_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/excel/files/{filename}")
async def delete_excel_file(filename: str):
    """Deletar arquivo Excel"""
    if not excel_service:
        raise HTTPException(status_code=503, detail="Excel service não disponível")
    
    try:
        success = excel_service.delete_file(filename)
        if success:
            return {"message": "Arquivo deletado com sucesso"}
        else:
            raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/excel/export")
async def export_contacts_to_excel(contacts: list):
    """Exportar contatos para Excel"""
    if not excel_service:
        raise HTTPException(status_code=503, detail="Excel service não disponível")
    
    try:
        file_path = excel_service.export_contacts_to_excel(contacts)
        return {
            "status": "success",
            "message": "Contatos exportados com sucesso",
            "file_path": file_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Event handlers para inicialização e encerramento
@app.on_event("startup")
async def startup_event():
    """Inicializar aplicação"""
    logger.info("🚀 Iniciando SacsMax Backend...")
    
    # Inicializar banco de dados
    if db_manager:
        init_database()
    
    # Inicializar serviços
    if whatsapp_service:
        await whatsapp_service.initialize()
    
    if excel_service:
        await excel_service.initialize()
    
    logger.info(f"✅ Backend iniciado na porta {PORT}")

@app.on_event("shutdown")
async def shutdown_event():
    """Encerrar aplicação"""
    logger.info("🛑 Encerrando SacsMax Backend...")
    
    # Fechar conexão com banco
    if db_manager:
        close_database()
    
    # Limpar serviços
    if whatsapp_service:
        await whatsapp_service.cleanup()
    
    if excel_service:
        await excel_service.cleanup()
    
    logger.info("✅ Backend encerrado")

# Garantir que a aplicação seja exportada corretamente
__all__ = ["app"]

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=PORT,
        reload=False,
        log_level="info"
    )
