#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SacsMax Backend - API completa com FastAPI e WAHA
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks, WebSocket, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, Response
from pydantic import BaseModel
import uvicorn
import os
import json
import requests
from datetime import datetime
import threading
import time
from pathlib import Path
import logging
import pandas as pd

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importações condicionais para evitar erros
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from excel_to_database import ExcelToDatabaseConverter
    from database_config import get_db_manager, init_database, close_database
    from feedback_analyzer import feedback_analyzer
    from app.services.excel_service import ExcelService
    from app.services.sentiment_analyzer import sentiment_analyzer
    from app.services.feedback_service import feedback_service
    
except ImportError as e:
    print(f" Erro de importação: {e}")
    ExcelToDatabaseConverter = None
    get_db_manager = None
    feedback_analyzer = None
    ExcelService = None
    sentiment_analyzer = None
    feedback_service = None

# Modelos Pydantic
class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str

# Configuração
PORT = int(os.environ.get("BACKEND_PORT", 5000))
FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend"

# Criar aplicação FastAPI
app = FastAPI(
    title="SacsMax API",
    description="Sistema de Gestão de SAC com WAHA",
    version="3.0.0",
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

# Servir arquivos estáticos do frontend (removido para evitar conflitos)

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
excel_service = ExcelService() if ExcelService else None

# ===== WAHA INTEGRATION =====

# Importar controlador WAHA e rotas do WhatsApp
try:
    from app.services.waha.waha_controller import router as waha_router
    from app.services.waha.waha_service import WahaService
    from app.api.routes.whatsapp import router as whatsapp_router
    
    # Incluir rotas do WAHA
    app.include_router(waha_router)
    
    # Incluir rotas do WhatsApp
    app.include_router(whatsapp_router, prefix="/api/whatsapp")
    
    # Instanciar serviço WAHA
    waha_url = os.getenv("WAHA_URL", "https://waha-production-1c76.up.railway.app")
    waha_service = WahaService(waha_url)
    
    logger.info("✅ WAHA e WhatsApp integrados com sucesso!")
except ImportError as e:
    logger.warning(f"⚠️ WAHA/WhatsApp não disponível: {e}")
    waha_service = None

# Armazenamento temporário para mensagens recebidas
new_messages_queue = []
max_queue_size = 1000

# Endpoints de compatibilidade WAHA
@app.get("/api/waha/status")
async def waha_status():
    """Status do WAHA - Compatibilidade"""
    if waha_service:
        try:
            result = await waha_service.check_waha_status()
            return JSONResponse(content=result)
        except Exception as e:
            logger.error(f"Erro ao verificar status do WAHA: {e}")
            return JSONResponse(content={"status": "error", "message": str(e)}, status_code=503)
    else:
        return JSONResponse(content={"status": "error", "message": "WAHA não disponível"}, status_code=503)

@app.post("/api/waha/sessions")
async def waha_create_session(session_name: str = "default"):
    """Criar sessão WAHA - Compatibilidade"""
    if waha_service:
        try:
            result = await waha_service.create_session(session_name)
            return JSONResponse(content=result)
        except Exception as e:
            logger.error(f"Erro ao criar sessão WAHA: {e}")
            return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
    else:
        return JSONResponse(content={"status": "error", "message": "WAHA não disponível"}, status_code=503)

@app.get("/api/waha/screenshot")
async def waha_screenshot(session: str = "default"):
    """Screenshot WAHA - Compatibilidade"""
    if waha_service:
        try:
            screenshot = await waha_service.get_screenshot(session)
            if screenshot:
                return Response(content=screenshot, media_type="image/png")
            else:
                return JSONResponse(content={"status": "error", "message": "Screenshot não disponível"}, status_code=404)
        except Exception as e:
            logger.error(f"Erro ao obter screenshot WAHA: {e}")
            return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
    else:
        return JSONResponse(content={"status": "error", "message": "WAHA não disponível"}, status_code=503)

@app.post("/api/waha/send-message")
async def waha_send_message(chat_id: str, text: str, session: str = "default"):
    """Enviar mensagem WAHA - Compatibilidade"""
    if waha_service:
        try:
            result = await waha_service.send_text_message(chat_id, text, session)
            return JSONResponse(content=result)
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem WAHA: {e}")
            return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
    else:
        return JSONResponse(content={"status": "error", "message": "WAHA não disponível"}, status_code=503)

@app.get("/api/waha/contacts")
async def waha_contacts(session: str = "default"):
    """Contatos WAHA - Compatibilidade"""
    if waha_service:
        try:
            result = await waha_service.get_contacts(session)
            return JSONResponse(content=result)
        except Exception as e:
            logger.error(f"Erro ao obter contatos WAHA: {e}")
            return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
    else:
        return JSONResponse(content={"status": "error", "message": "WAHA não disponível"}, status_code=503)

# ===== ENDPOINTS BÁSICOS =====

@app.get("/")
async def root():
    """Página inicial"""
    try:
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        else:
            return HTMLResponse(content="""
    <html>
                <head><title>SacsMax - Sistema de Gestão de SAC</title></head>
        <body>
                    <h1>🚀 SacsMax - Sistema de Gestão de SAC</h1>
                    <p>Sistema funcionando com WAHA!</p>
                    <p><a href="/docs">📚 API Documentation</a></p>
        </body>
    </html>
            """)
    except Exception as e:
        return HTMLResponse(content=f"<h1>Erro: {e}</h1>")

def process_received_message(message_payload):
    """Helper function to process message data from different event types"""
    chat_id = message_payload.get("from")
    message_text = message_payload.get("body")
    timestamp = message_payload.get("timestamp")
    from_me = message_payload.get("fromMe", False)
    notify_name = message_payload.get("_data", {}).get("notifyName", "") or message_payload.get("notifyName", "")
    
    return {
        "chat_id": chat_id,
        "message_text": message_text,
        "timestamp": timestamp or datetime.now().isoformat(),
        "from_me": from_me,
        "notify_name": notify_name
    }

@app.post("/")
async def webhook_handler(request: Request):
    """Webhook do WAHA para receber mensagens"""
    global new_messages_queue
    
    try:
        # Log do webhook recebido
        logger.info("📱 Webhook WAHA recebido")
        
        # Obter dados do webhook
        webhook_data = await request.json()
        logger.info(f"📱 Dados do webhook: {webhook_data}")
        
        message_data = None
        
        # Processar eventos de mensagem direta
        if webhook_data.get("event") == "message" or webhook_data.get("event") == "message.any":
            payload = webhook_data.get("payload", {})
            message_data = process_received_message(payload)
        
        # Processar eventos engine com unread_count (contém lastMessage)
        elif webhook_data.get("event") == "engine.event":
            payload = webhook_data.get("payload", {})
            if payload.get("event") == "unread_count":
                # O lastMessage está em payload.data.lastMessage
                data = payload.get("data", {})
                last_message = data.get("lastMessage")
                if last_message:
                    logger.info(f"🔍 Processando lastMessage: {last_message}")
                    message_data = process_received_message(last_message)
        
        # Processar a mensagem se encontrada
        if message_data and message_data["chat_id"] and message_data["message_text"] and not message_data["from_me"]:
            try:
                logger.info(f"📱 Mensagem recebida de {message_data['chat_id']} ({message_data['notify_name']}): {message_data['message_text']}")
                
                # Criar objeto da mensagem
                new_message = {
                    "phone": message_data["chat_id"],
                    "message": message_data["message_text"],
                    "senderName": message_data["notify_name"] or message_data["chat_id"],
                    "timestamp": message_data["timestamp"],
                    "received_at": datetime.now().isoformat()
                }
                
                # Adicionar à fila de mensagens
                new_messages_queue.append(new_message)
                
                # Manter tamanho da fila controlado
                if len(new_messages_queue) > max_queue_size:
                    new_messages_queue = new_messages_queue[-max_queue_size:]
                
                logger.info(f"✅ Mensagem adicionada à fila: {message_data['notify_name'] or message_data['chat_id']}")
                
                # Salvar no banco se disponível
                if waha_service:
                    try:
                        await waha_service._save_message_as_feedback(
                            message_data["chat_id"], message_data["message_text"], "received", 
                            contact_info=None, timestamp=message_data["timestamp"]
                        )
                    except Exception as e:
                        logger.error(f"Erro ao salvar mensagem no banco: {e}")
                        
            except Exception as msg_error:
                logger.error(f"❌ Erro ao processar mensagem: {msg_error}")
        
        return {"status": "success", "message": "Webhook processado"}
    except Exception as e:
        logger.error(f"❌ Erro no webhook: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/api/whatsapp/new-messages")
async def get_new_messages(since: str = None):
    """Endpoint para o frontend buscar novas mensagens recebidas"""
    global new_messages_queue
    
    try:
        # Se since foi fornecido, filtrar mensagens mais recentes
        if since:
            try:
                since_time = datetime.fromisoformat(since.replace('Z', '+00:00'))
                filtered_messages = [
                    msg for msg in new_messages_queue 
                    if datetime.fromisoformat(msg["received_at"].replace('Z', '+00:00')) > since_time
                ]
            except:
                filtered_messages = new_messages_queue
        else:
            filtered_messages = new_messages_queue
        
        return {
            "success": True,
            "count": len(filtered_messages),
            "data": filtered_messages
        }
    except Exception as e:
        logger.error(f"Erro ao buscar novas mensagens: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@app.get("/health")
async def health_check():
    """Verificação de saúde da API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "3.0.0",
        "waha_available": waha_service is not None
    }

@app.get("/api/health")
async def api_health():
    """Verificação de saúde da API (compatibilidade)"""
    return await health_check()

@app.get("/api/database/test")
async def test_database():
    """Testar conexão com banco de dados"""
    try:
        if get_db_manager:
            db_manager = get_db_manager()
            if db_manager and db_manager.is_connected():
                # Testar conexão
                result = db_manager.execute_query("SELECT 1 as test")
                if result:
                    return {
                        "status": "connected",
                        "message": "Banco de dados conectado com sucesso",
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    return {
                        "status": "error",
                        "message": "Falha no teste de conexão",
                        "timestamp": datetime.now().isoformat()
                    }
            else:
                return {
                    "status": "disconnected",
                    "message": "Banco de dados não está conectado",
                    "timestamp": datetime.now().isoformat()
                }
        else:
            return {
                "status": "error",
                "message": "Módulo de banco de dados não disponível",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Erro ao testar banco de dados: {e}")
        return {
            "status": "error",
            "message": f"Erro na conexão: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

# ===== ROTAS PARA ARQUIVOS ESTÁTICOS =====
# (Movida para o final para não interceptar rotas da API)

# ===== ENDPOINTS DE CONTATOS =====

@app.get("/api/contacts")
async def get_contacts():
    """Listar contatos"""
    try:
        if get_db_manager:
            db_manager = get_db_manager()
            if db_manager and db_manager.is_connected():
                # Buscar do banco de dados
                query = "SELECT * FROM contacts ORDER BY name"
                contacts = db_manager.execute_query(query)
                return {"contacts": contacts}
            else:
                # Dados em memória
                return {"contacts": contacts}
        else:
            return {"contacts": contacts}
    except Exception as e:
        logger.error(f"Erro ao buscar contatos: {e}")
        return {"contacts": contacts}

@app.post("/api/contacts")
async def create_contact(contact: dict):
    """Criar novo contato"""
    try:
        if db_manager and db_manager.is_connected():
            # Salvar no banco de dados
            query = """
            INSERT INTO contacts (name, email, phone, company, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            """
            db_manager.execute_query(query, (
                contact.get("name"),
                contact.get("email"),
                contact.get("phone"),
                contact.get("company")
            ))
            return {"message": "Contato criado com sucesso"}
        else:
            # Salvar em memória
            contact["id"] = len(contacts) + 1
            contact["created_at"] = datetime.now().isoformat()
            contacts.append(contact)
            return {"message": "Contato criado com sucesso"}
    except Exception as e:
        logger.error(f"Erro ao criar contato: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== ENDPOINTS DE MENSAGENS =====

@app.get("/api/messages")
async def get_messages():
    """Listar mensagens"""
    try:
        if db_manager and db_manager.is_connected():
            # Buscar do banco de dados
            query = "SELECT * FROM messages ORDER BY created_at DESC"
            messages = db_manager.execute_query(query)
            return {"messages": messages}
        else:
            # Dados em memória
            return {"messages": messages}
    except Exception as e:
        logger.error(f"Erro ao buscar mensagens: {e}")
        return {"messages": messages}

@app.post("/api/messages")
async def create_message(message: dict):
    """Criar nova mensagem"""
    try:
        if db_manager and db_manager.is_connected():
            # Salvar no banco de dados
            query = """
            INSERT INTO messages (contact_id, content, type, created_at)
            VALUES (%s, %s, %s, NOW())
            """
            db_manager.execute_query(query, (
                message.get("contact_id"),
                message.get("content"),
                message.get("type", "text")
            ))
            return {"message": "Mensagem criada com sucesso"}
        else:
            # Salvar em memória
            message["id"] = len(messages) + 1
            message["created_at"] = datetime.now().isoformat()
            messages.append(message)
            return {"message": "Mensagem criada com sucesso"}
    except Exception as e:
        logger.error(f"Erro ao criar mensagem: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== ENDPOINTS DE PRODUTIVIDADE =====

@app.get("/api/productivity/contacts")
async def get_productivity_contacts(optimized: bool = False):
    """Listar contatos de produtividade"""
    try:
        if get_db_manager:
            db_manager = get_db_manager()
            if db_manager and db_manager.is_connected():
                # Buscar da tabela produtividade
                if optimized:
                    # Query otimizada para performance
                    query = """
                    SELECT 
                        id, nome_cliente, tecnico, sa, servico, telefone1, telefone2,
                        data, status, obs as observacoes, created_at, updated_at
                    FROM produtividade 
                    ORDER BY data DESC, created_at DESC
                    """
                else:
                    # Query completa
                    query = "SELECT * FROM produtividade ORDER BY data DESC, created_at DESC"
                
                contacts = db_manager.execute_query(query)
                
                # Converter para formato esperado pelo frontend
                formatted_contacts = []
                for contact in contacts:
                    formatted_contact = {
                        "id": contact.get("id"),
                        "nome_cliente": contact.get("nome_cliente", ""),
                        "tecnico": contact.get("tecnico", ""),
                        "sa": contact.get("sa", ""),
                        "servico": contact.get("servico", ""),
                        "telefone1": contact.get("telefone1", ""),
                        "telefone2": contact.get("telefone2", ""),
                        "data": contact.get("data"),
                        "status": contact.get("status", ""),
                        "observacoes": contact.get("obs", ""),
                        "created_at": contact.get("created_at"),
                        "updated_at": contact.get("updated_at")
                    }
                    formatted_contacts.append(formatted_contact)
                
                return {
                    "success": True,
                    "contacts": formatted_contacts,
                    "total": len(formatted_contacts),
                    "timestamp": datetime.now().isoformat()
                }
            else:
                # Dados em memória (fallback)
                return {
                    "success": True,
                    "contacts": [],
                    "total": 0,
                    "timestamp": datetime.now().isoformat(),
                    "message": "Banco de dados não conectado"
                }
        else:
            return {
                "success": False,
                "contacts": [],
                "total": 0,
                "error": "Módulo de banco de dados não disponível",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Erro ao buscar contatos de produtividade: {e}")
        return {
            "success": False,
            "contacts": [],
            "total": 0,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ===== ENDPOINTS DE CONFIGURAÇÃO DO BOT =====

@app.get("/api/bot/config")
async def get_bot_config():
    """Obter configuração do bot"""
    return bot_config

@app.post("/api/bot/config")
async def update_bot_config(config: dict):
    """Atualizar configuração do bot"""
    global bot_config
    bot_config.update(config)
    return {"message": "Configuração atualizada com sucesso"}

# ===== ENDPOINTS DE UPLOAD =====

@app.post("/api/upload/excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload de arquivo Excel"""
    try:
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Apenas arquivos Excel são aceitos")
        
        # Salvar arquivo
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Processar com ExcelService se disponível
        if excel_service:
            result = excel_service.process_file(str(file_path))
            return {"message": "Arquivo processado com sucesso", "result": result}
        else:
            return {"message": "Arquivo salvo com sucesso", "filename": file.filename}
            
    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== EVENTOS DE INICIALIZAÇÃO E FINALIZAÇÃO =====

@app.on_event("startup")
async def startup_event():
    """Evento de inicialização"""
    logger.info("🚀 SacsMax Backend iniciando...")
    
    # Inicializar banco de dados se disponível
    if get_db_manager:
        try:
            db_manager = get_db_manager()
            if db_manager and db_manager.connect():
                logger.info("✅ Banco de dados conectado")
                
                # Testar conexão
                result = db_manager.execute_query("SELECT 1 as test")
                if result:
                    logger.info("✅ Teste de conexão com banco bem-sucedido")
                else:
                    logger.warning("⚠️ Teste de conexão falhou")
            else:
                logger.warning("⚠️ Não foi possível conectar ao banco")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao inicializar banco: {e}")
    else:
        logger.warning("⚠️ get_db_manager não disponível")

@app.on_event("shutdown")
async def shutdown_event():
    """Evento de finalização"""
    logger.info("🛑 SacsMax Backend parando...")
    
    # Fechar conexões do banco
    if get_db_manager:
        try:
            db_manager = get_db_manager()
            if db_manager:
                close_database(db_manager)
                logger.info("✅ Conexões do banco fechadas")
        except Exception as e:
            logger.warning(f"⚠️ Erro ao fechar banco: {e}")
    
# ===== ROTAS PARA ARQUIVOS ESTÁTICOS =====

@app.get("/{file_path:path}")
async def serve_static_files(file_path: str):
    """Servir arquivos estáticos do frontend"""
    try:
        # Não interceptar rotas da API
        if file_path.startswith('api/'):
            raise HTTPException(status_code=404, detail="Endpoint não encontrado")
        
        # Verificar se é um arquivo JavaScript ou HTML
        if file_path.endswith(('.js', '.html', '.css', '.png', '.jpg', '.ico')):
            file_path_obj = FRONTEND_DIR / file_path
            if file_path_obj.exists():
                return FileResponse(str(file_path_obj))
        
        # Se não for arquivo estático, servir index.html
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    except Exception as e:
        logger.error(f"Erro ao servir arquivo estático: {e}")
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

# ===== EXECUÇÃO DIRETA =====
    
if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=PORT,
        reload=True
    )
