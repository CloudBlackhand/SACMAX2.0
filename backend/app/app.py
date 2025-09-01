#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SacsMax Backend - API completa com FastAPI e WAHA
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks, WebSocket, Query, Request
from typing import List, Dict, Any, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, Response
from pydantic import BaseModel
import uvicorn
import os
import json
import requests
from datetime import datetime, timedelta
import threading
import time
from pathlib import Path
import logging
import pandas as pd
import asyncio
from collections import defaultdict, deque

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Importações condicionais para evitar erros
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from excel_to_database import ExcelToDatabaseConverter
    from database_config import get_db_manager, init_database, close_database

    from app.services.excel_service import ExcelService
    from app.services.sentiment_analyzer import sentiment_analyzer
    from app.services.feedback_service import feedback_service
    
except ImportError as e:
    print(f" Erro de importação: {e}")
    ExcelToDatabaseConverter = None
    get_db_manager = None

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

# Sistema limpo - tudo direto no PostgreSQL
# new_messages_queue removido - usamos PostgreSQL

# Controle de mensagens já processadas (idempotência)
processed_message_ids = set()
max_processed_ids = 1000

# Rate limiting para webhooks
rate_limit_storage = defaultdict(lambda: deque(maxlen=100))

async def check_rate_limit(client_ip: str, current_time: float, max_requests: int = 100, window_seconds: int = 60) -> bool:
    """Verificar rate limit por IP"""
    try:
        requests_queue = rate_limit_storage[client_ip]
        
        # Remover requests antigos (fora da janela de tempo)
        while requests_queue and current_time - requests_queue[0] > window_seconds:
            requests_queue.popleft()
        
        # Verificar se excedeu o limite
        if len(requests_queue) >= max_requests:
            return False
        
        # Adicionar request atual
        requests_queue.append(current_time)
        return True
        
    except Exception as e:
        logger.error(f"Erro no rate limiting: {e}")
        return True  # Em caso de erro, permitir o request

# Importar serviço de persistência WhatsApp limpo
try:
    from app.services.whatsapp_persistence_service import WhatsAppPersistenceService
    from database_config import get_db_manager
    db_manager = get_db_manager()
    whatsapp_persistence = WhatsAppPersistenceService(db_manager)
    logger.info("✅ Serviço de persistência WhatsApp inicializado")
except ImportError as e:
    whatsapp_persistence = None
    logger.warning(f"⚠️ Serviço de persistência WhatsApp não disponível: {e}")

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
    # Extrair dados da estrutura WAHA
    chat_id = message_payload.get("from")
    message_text = message_payload.get("body")
    timestamp = message_payload.get("timestamp")
    from_me = message_payload.get("fromMe", False)
    
    # Extrair ID único da mensagem do WAHA
    message_id = None
    if "id" in message_payload:
        if isinstance(message_payload["id"], dict):
            message_id = message_payload["id"].get("_serialized", "")
        else:
            message_id = str(message_payload["id"])
    
    # Se não encontrou ID, criar um baseado no conteúdo
    if not message_id:
        message_id = f"{chat_id}_{message_text}_{timestamp}"
    
    # Extrair notify_name da estrutura aninhada do WAHA
    notify_name = ""
    if "_data" in message_payload:
        notify_name = message_payload["_data"].get("notifyName", "")
    if not notify_name:
        notify_name = message_payload.get("notifyName", "")
    
    # Converter timestamp se necessário
    if timestamp and isinstance(timestamp, int):
        timestamp = datetime.fromtimestamp(timestamp).isoformat()
    elif not timestamp:
        timestamp = datetime.now().isoformat()
    
    logger.info(f"🔍 Dados extraídos: chat_id={chat_id}, message_id={message_id}, message={message_text}, notify_name={notify_name}")
    
    return {
        "chat_id": chat_id,
        "message_id": message_id,
        "message_text": message_text,
        "timestamp": timestamp,
        "from_me": from_me,
        "notify_name": notify_name
    }

    

# NOVO: Funções para persistência de mensagens WhatsApp (PostgreSQL + Memoria)
def save_whatsapp_message(phone, message_data):
    """Salvar mensagem WhatsApp apenas no PostgreSQL (sistema limpo)"""
    try:
        # Normalizar telefone
        phone = str(phone).strip()
        if not phone:
            logger.warning("⚠️ Telefone vazio, ignorando mensagem")
            return False
        
        # Verificar se o serviço está disponível
        if not whatsapp_persistence:
            logger.error("❌ Serviço de persistência não disponível")
            return False
        
        # Criar estrutura de mensagem limpa para PostgreSQL
        message = {
            "message_id": message_data.get("message_id") or f"{phone}_{int(datetime.now().timestamp())}",
            "chat_phone": phone,
            "content": message_data.get("message_text", ""),
            "sender": message_data.get("notify_name", phone),
            "message_type": "text",
            "direction": "sent" if message_data.get("from_me", False) else "received",
            "status": "received",
            "timestamp": datetime.now(),
            "waha_data": message_data
        }
        
        # Salvar no PostgreSQL
        success = whatsapp_persistence.save_message(message)
        if success:
            logger.info(f"✅ Mensagem salva: {phone} - {message['content'][:50]}...")
            return True
        else:
            logger.error(f"❌ Falha ao salvar mensagem: {phone}")
            return False
        
    except Exception as e:
        logger.error(f"❌ Erro ao salvar mensagem WhatsApp: {e}")
        return False







async def process_message_async(message_data):
    """Processar mensagem de forma assíncrona"""
    try:
        logger.info(f"🔄 Processando mensagem assincronamente: {message_data['phone']}")
        
        # Salvar no banco se disponível
        if waha_service:
            try:
                await waha_service._save_message_as_feedback(
                    message_data["phone"], message_data["message"], "received", 
                    contact_info=None, timestamp=message_data["timestamp"]
                )
                logger.info(f"✅ Mensagem salva no banco: {message_data['phone']}")
            except Exception as e:
                logger.error(f"❌ Erro ao salvar mensagem no banco: {e}")
                # Implementar retry se necessário
                if message_data["retry_count"] < 3:
                    message_data["retry_count"] += 1
                    logger.info(f"🔄 Tentativa {message_data['retry_count']} de salvar mensagem")
                    await asyncio.sleep(5)  # Aguardar 5 segundos antes de tentar novamente
                    await process_message_async(message_data)
        
        # Marcar como processada
        message_data["processed"] = True
        logger.info(f"✅ Mensagem processada com sucesso: {message_data['phone']}")
        
    except Exception as e:
        logger.error(f"❌ Erro no processamento assíncrono: {e}")
        message_data["processed"] = False

@app.post("/webhook/waha")
async def webhook_handler(request: Request):
    """Webhook do WAHA - Captura TODAS as mensagens automaticamente"""
    
    try:
        # Rate limiting básico por IP
        client_ip = request.client.host
        current_time = time.time()
        
        # Verificar rate limit (máximo 100 requests por minuto por IP)
        if not await check_rate_limit(client_ip, current_time):
            logger.warning(f"⚠️ Rate limit excedido para IP: {client_ip}")
            return JSONResponse(
                content={"status": "error", "message": "Rate limit exceeded"}, 
                status_code=429
            )
        
        # Log do webhook recebido
        logger.info("📱 Webhook WAHA recebido")
        
        # Verificar autenticação (opcional - pode ser habilitada via env)
        webhook_secret = os.getenv("WEBHOOK_SECRET")
        if webhook_secret:
            auth_header = request.headers.get("authorization")
            if not auth_header or auth_header != f"Bearer {webhook_secret}":
                logger.warning("⚠️ Webhook sem autenticação válida")
                return JSONResponse(
                    content={"status": "error", "message": "Unauthorized"}, 
                    status_code=401
                )
        
        # Obter dados do webhook com timeout
        try:
            webhook_data = await asyncio.wait_for(request.json(), timeout=10.0)
            logger.info(f"📱 Webhook recebido do tipo: {webhook_data.get('event', 'unknown')}")
        except asyncio.TimeoutError:
            logger.error("⏰ Timeout ao ler dados do webhook")
            return JSONResponse(
                content={"status": "error", "message": "Request timeout"}, 
                status_code=408
            )
        except Exception as json_error:
            logger.error(f"❌ Erro ao processar JSON do webhook: {json_error}")
            return JSONResponse(
                content={"status": "error", "message": "Invalid JSON"}, 
                status_code=400
            )
        
        # Processar webhook de forma assíncrona (não bloquear resposta)
        asyncio.create_task(process_webhook_async(webhook_data))
        
        # Retornar resposta imediata
        return JSONResponse(content={"status": "success", "message": "Webhook received"})
        
    except Exception as e:
        logger.error(f"❌ Erro no webhook: {e}")
        return JSONResponse(
            content={"status": "error", "message": "Internal server error"}, 
            status_code=500
        )

async def process_webhook_async(webhook_data: Dict[str, Any]):
    """Processar webhook de forma assíncrona"""
    try:
        # Processar TODOS os tipos de eventos de mensagem
        messages_processed = 0
        
        # 1. Eventos de mensagem direta
        if webhook_data.get("event") == "message" or webhook_data.get("event") == "message.any":
            payload = webhook_data.get("payload", {})
            message_data = process_received_message(payload)
            if message_data and message_data["chat_id"] and message_data["message_text"]:
                success = await process_and_save_message(message_data)
                if success:
                    messages_processed += 1
        
        # 2. Eventos engine com múltiplas mensagens
        elif webhook_data.get("event") == "engine.event":
            payload = webhook_data.get("payload", {})
            
            # Processar unread_count (última mensagem)
            if payload.get("event") == "unread_count":
                data = payload.get("data", {})
                last_message = data.get("lastMessage")
                if last_message:
                    logger.info(f"🔍 Processando lastMessage: {last_message}")
                    message_data = process_received_message(last_message)
                    if message_data and message_data["chat_id"] and message_data["message_text"]:
                        success = await process_and_save_message(message_data)
                        if success:
                            messages_processed += 1
            
            # Processar outras mensagens no payload se existirem
            if "messages" in payload.get("data", {}):
                for msg in payload["data"]["messages"]:
                    message_data = process_received_message(msg)
                    if message_data and message_data["chat_id"] and message_data["message_text"]:
                        success = await process_and_save_message(message_data)
                        if success:
                            messages_processed += 1
        
        # 3. Processar mensagens em lote se existirem
        if "messages" in webhook_data:
            for msg in webhook_data["messages"]:
                message_data = process_received_message(msg)
                if message_data and message_data["chat_id"] and message_data["message_text"]:
                    success = await process_and_save_message(message_data)
                    if success:
                        messages_processed += 1
        
        # 4. Processar mensagem única se existir
        if "message" in webhook_data:
            message_data = process_received_message(webhook_data["message"])
            if message_data and message_data["chat_id"] and message_data["message_text"]:
                success = await process_and_save_message(message_data)
                if success:
                    messages_processed += 1
        
        logger.info(f"✅ Webhook processado: {messages_processed} mensagens salvas")
        
    except Exception as e:
        logger.error(f"❌ Erro no processamento assíncrono do webhook: {e}")
        # Não retornar erro aqui pois é processamento assíncrono

async def process_and_save_message(message_data):
    """Processar e salvar uma mensagem individual - DIRETO NO POSTGRESQL"""
    try:
        # Verificar se é mensagem válida (não vazia e não de nós mesmos)
        if not message_data["chat_id"] or not message_data["message_text"] or message_data.get("from_me", False):
            logger.warning(f"⚠️ Mensagem inválida ignorada: {message_data}")
            return False
        
        logger.info(f"📱 SALVANDO mensagem de {message_data['chat_id']} ({message_data['notify_name']}): {message_data['message_text']}")
        
        # SALVAR MENSAGEM DIRETAMENTE NO POSTGRESQL
        save_success = save_whatsapp_message(message_data["chat_id"], message_data)
        
        if save_success:
            logger.info(f"✅ MENSAGEM SALVA NO POSTGRESQL: {message_data['notify_name'] or message_data['chat_id']}")
            return True
        else:
            logger.error(f"❌ FALHA AO SALVAR: {message_data['chat_id']}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Erro ao processar mensagem: {e}")
        return False

@app.get("/api/whatsapp/new-messages")
async def get_new_messages(since: str = None):
    """Buscar novas mensagens do PostgreSQL (sistema limpo)"""
    try:
        if not whatsapp_persistence:
            return {
                "success": False,
                "error": "Serviço de persistência não disponível"
            }
        
        logger.info(f"📡 Buscando novas mensagens do PostgreSQL. Since: {since}")
        
        # Buscar mensagens recentes do PostgreSQL
        # Se since não fornecido, buscar últimas mensagens da última hora
        if not since:
            since_time = datetime.now() - timedelta(hours=1)
            since = since_time.isoformat()
        
        # Buscar de todos os chats
        all_messages = []
        chats = whatsapp_persistence.get_chats(limit=50)
        
        for chat in chats:
            phone = chat.get("phone")
            if phone:
                messages = whatsapp_persistence.get_messages(phone=phone, limit=5, since=since)
                for msg in messages:
                    # Formatar para compatibilidade com frontend
                    formatted_msg = {
                        "id": msg.get("id") or msg.get("message_id"),
                        "phone": msg.get("chat_phone", phone),
                        "message": msg.get("content"),
                        "senderName": msg.get("sender"),
                        "timestamp": msg.get("timestamp"),
                        "received_at": msg.get("created_at"),
                        "processed": False,
                        "retry_count": 0
                    }
                    all_messages.append(formatted_msg)
        
        # Ordenar por timestamp (mais recentes primeiro)
        all_messages.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        logger.info(f"📡 Retornando {len(all_messages)} mensagens do PostgreSQL")
        
        return {
            "success": True,
            "count": len(all_messages),
            "data": all_messages
        }
    except Exception as e:
        logger.error(f"❌ Erro ao buscar novas mensagens: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": []
        }

@app.post("/api/whatsapp/confirm-messages")
async def confirm_messages_processed(message_ids: List[str] = None):
    """Endpoint para o frontend confirmar que processou as mensagens (PostgreSQL)"""
    try:
        # No sistema PostgreSQL, não precisamos confirmar mensagens
        # Elas já estão persistidas permanentemente
        logger.info(f"✅ Confirmação de mensagens recebida (PostgreSQL - não necessária)")
        
        return {
            "success": True,
            "message": "Mensagens já persistidas no PostgreSQL"
        }
    except Exception as e:
        logger.error(f"❌ Erro ao confirmar mensagens: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/health")
async def health_check():
    """Verificação de saúde da API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "3.0.0",
        "waha_available": waha_service is not None,
        "postgresql_storage": "active",
        "memory_storage": "disabled"
    }

@app.get("/api/whatsapp/status")
async def whatsapp_status():
    """Status detalhado do sistema WhatsApp"""
    try:
        waha_status = "disconnected"
        if waha_service:
            status_result = await waha_service.check_waha_status()
            waha_status = status_result.get("status", "unknown")
        
        return {
            "success": True,
            "data": {
                "waha_status": waha_status,
                "postgresql_storage": {
                    "status": "active",
                    "persistence_service": whatsapp_persistence is not None
                },
                "system": {
                    "version": "3.0.0",
                    "uptime": "running",
                    "last_webhook": datetime.now().isoformat()
                }
            }
        }
    except Exception as e:
        logger.error(f"❌ Erro ao obter status: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# NOVO: Endpoints para persistência de mensagens WhatsApp
@app.get("/api/whatsapp/chats")
async def get_whatsapp_chats():
    """Buscar todos os chats salvos no PostgreSQL (sistema limpo)"""
    try:
        if not whatsapp_persistence:
            logger.error("❌ Serviço de persistência não disponível")
            return {
                "success": False,
                "error": "Serviço de persistência não disponível"
            }
        
        # Buscar chats do PostgreSQL
        chats = whatsapp_persistence.get_chats(limit=200)
        logger.info(f"✅ {len(chats)} chats carregados do PostgreSQL")
        
        return {
            "success": True,
            "data": {
                "chats": chats,
                "total_chats": len(chats),
                "source": "postgresql"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar chats: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/whatsapp/messages/{phone}")
async def get_whatsapp_chat_messages(phone: str, limit: int = 100, since: str = None, include_sent: bool = True):
    """Buscar mensagens de um chat específico do PostgreSQL (sistema limpo)"""
    try:
        if not whatsapp_persistence:
            logger.error("❌ Serviço de persistência não disponível")
            return {
                "success": False,
                "error": "Serviço de persistência não disponível"
            }
        
        # Buscar mensagens do PostgreSQL
        messages = whatsapp_persistence.get_messages(phone=phone, limit=limit, since=since)
        logger.info(f"✅ {len(messages)} mensagens carregadas para {phone}")
        
        # Formatar mensagens para o frontend (compatibilidade completa)
        formatted_messages = []
        for msg in messages:
            formatted_msg = {
                "id": msg.get("id") or msg.get("message_id"),
                "phone": msg.get("chat_phone", phone),
                "content": msg.get("content"),
                "text": msg.get("content"),  # Alias para compatibilidade
                "sender": msg.get("sender"),
                "timestamp": msg.get("timestamp"),
                "type": msg.get("direction", "received"),  # received/sent para frontend
                "direction": msg.get("direction", "received"),  # Manter original
                "status": msg.get("status", "received"),
                "created_at": msg.get("created_at"),
                "originalTimestamp": msg.get("timestamp")  # Para compatibilidade
            }
            formatted_messages.append(formatted_msg)
        
        return {
            "success": True,
            "data": {
                "messages": formatted_messages,
                "total": len(formatted_messages),
                "phone": phone,
                "source": "postgresql"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar mensagens do chat {phone}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/whatsapp/create-chat")
async def create_whatsapp_chat(request: Request):
    """Criar chat WhatsApp manualmente (PostgreSQL)"""
    try:
        data = await request.json()
        phone = data.get("phone")
        name = data.get("name", phone)
        
        if not phone:
            return {
                "success": False,
                "error": "Telefone é obrigatório"
            }
        
        # Verificar se o serviço está disponível
        if not whatsapp_persistence:
            return {
                "success": False,
                "error": "Serviço de persistência não disponível"
            }
        
        # Criar chat no PostgreSQL
        chat_data = {
                "phone": phone,
                "name": name,
                "last_message": "Chat criado",
            "last_message_time": datetime.now(),
            "unread_count": 0
        }
        
        success = whatsapp_persistence.save_chat(phone, chat_data)
        
        if success:
            logger.info(f"✅ Chat criado no PostgreSQL: {phone} ({name})")
            return {
                "success": True,
                "message": "Chat criado com sucesso",
                "chat": {
                    "phone": phone,
                    "name": name,
                    "last_message": "Chat criado",
                    "last_message_time": datetime.now().isoformat(),
                    "unread_count": 0
                }
            }
        else:
            return {
                "success": False,
                "error": "Erro ao criar chat"
            }
            
    except Exception as e:
        logger.error(f"❌ Erro ao criar chat: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/whatsapp/mark-read")
async def mark_chat_as_read(request: Request):
    """Marcar chat como lido (zerar unread_count)"""
    try:
        data = await request.json()
        phone = data.get("phone")
        
        if not phone:
            return {
                "success": False,
                "error": "Telefone é obrigatório"
            }
        
        # Marcar como lido no PostgreSQL
        if whatsapp_persistence:
            success = whatsapp_persistence.mark_chat_as_read(phone)
            if success:
                logger.info(f"✅ Chat {phone} marcado como lido no PostgreSQL")
            else:
                logger.warning(f"⚠️ Falha ao marcar chat {phone} como lido")
            
            return {
                "success": True,
                "message": "Chat marcado como lido"
            }
        else:
            return {
                "success": False,
                "error": "Chat não encontrado"
            }
            
    except Exception as e:
        logger.error(f"❌ Erro ao marcar chat como lido: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/whatsapp/send")
async def send_whatsapp_message(request: Request):
    """Enviar mensagem WhatsApp e salvar no storage"""
    try:
        data = await request.json()
        phone = data.get("phone")
        message = data.get("message")
        message_type = data.get("message_type", "text")
        
        if not phone or not message:
            return {
                "success": False,
                "error": "Telefone e mensagem são obrigatórios"
            }
        
        # Criar dados da mensagem enviada
        sent_message_data = {
            "message_id": f"sent_{phone}_{int(datetime.now().timestamp())}",
            "chat_id": phone,
            "message_text": message,
            "notify_name": "Você",
            "timestamp": datetime.now().isoformat(),
            "from_me": True
        }
        
        # Enviar via WAHA se disponível
        waha_success = False
        if waha_service:
            try:
                result = await waha_service.send_text_message(phone, message, "default")
                waha_success = result.get("success", False)
                
                if waha_success:
                    logger.info(f"✅ Mensagem enviada via WAHA: {phone}")
                else:
                    logger.error(f"❌ Erro ao enviar via WAHA: {result.get('error', 'Erro desconhecido')}")
                    
            except Exception as e:
                logger.error(f"❌ Erro ao enviar via WAHA: {e}")
        
        # SEMPRE salvar mensagem enviada no storage (independente do WAHA)
        save_success = save_whatsapp_message(phone, sent_message_data)
        
        if save_success:
            logger.info(f"✅ Mensagem enviada salva no storage: {phone}")
            
            return {
                "success": True,
                "message": "Mensagem enviada e salva com sucesso",
                "waha_success": waha_success,
                "storage_saved": True,
                "message_id": sent_message_data["message_id"]
            }
        else:
            return {
                "success": False,
                "error": "Erro ao salvar mensagem no storage",
                "waha_success": waha_success
            }
            
    except Exception as e:
        logger.error(f"❌ Erro ao enviar mensagem: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/whatsapp/cleanup")
async def cleanup_whatsapp_messages():
    """Limpar mensagens antigas do PostgreSQL - REGRA: apenas últimos 15 dias!"""
    try:
        if not whatsapp_persistence:
            return {
                "success": False,
                "error": "Serviço de persistência não disponível"
            }
        
        logger.info("🧹 Limpeza manual WhatsApp iniciada via API")
        
        # Executar limpeza no PostgreSQL (15 dias)
        removed_count = whatsapp_persistence.cleanup_old_messages(days=15)
        
        # Obter estatísticas pós-limpeza
        stats = whatsapp_persistence.get_stats()
        
        logger.info(f"✅ Limpeza manual concluída: {removed_count} mensagens removidas")
        
        return {
            "success": True,
            "message": f"Limpeza executada com sucesso - Regra: últimos 15 dias apenas",
            "details": {
                "removed_messages": removed_count,
                "retention_days": 15,
                "cleanup_rule": "Mensagens com mais de 15 dias são automaticamente removidas",
                "current_stats": stats
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Erro na limpeza manual PostgreSQL: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/whatsapp/clear-cache")
async def clear_processed_cache():
    """Limpar cache de mensagens processadas (PostgreSQL)"""
    try:
        global processed_message_ids
        
        # Limpar apenas o cache de IDs processados
        processed_message_ids.clear()
        
        logger.info("🧹 Cache de IDs processados limpo")
        
        return {
            "success": True,
            "message": "Cache limpo com sucesso",
            "cleared": {
                "processed_ids": 0,
                "message_queue": 0
            }
        }
    except Exception as e:
        logger.error(f"❌ Erro ao limpar cache: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/api/whatsapp/stats")
async def get_whatsapp_stats():
    """Obter estatísticas completas do sistema PostgreSQL"""
    try:
        if not whatsapp_persistence:
            return {
                "success": False,
                "error": "Serviço de persistência não disponível"
            }
        
        # Obter estatísticas do PostgreSQL
        stats = whatsapp_persistence.get_stats()
        
        return {
            "success": True,
            "data": {
                "postgresql_storage": stats,
                "system": {
                    "webhook_active": True,
                    "persistence_enabled": True,
                    "storage_type": "postgresql",
                    "memory_storage": "disabled"
                }
            }
        }
    except Exception as e:
        logger.error(f"❌ Erro ao obter estatísticas: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/whatsapp/retry-failed")
async def retry_failed_messages():
    """Tentar reprocessar mensagens que falharam"""
    try:
        if not whatsapp_persistence:
            return {
                "success": False,
                "error": "Serviço de persistência não disponível"
            }
        
        # Tentar reprocessar mensagens falhadas
        retry_count = whatsapp_persistence.retry_failed_messages(limit=20)
        
        return {
            "success": True,
            "message": f"Reprocessamento concluído",
            "details": {
                "messages_reprocessed": retry_count,
                "timestamp": datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao reprocessar mensagens: {e}")
        return {
            "success": False,
            "error": str(e)
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

@app.post("/api/database/setup-whatsapp")
async def setup_whatsapp_tables():
    """Criar tabelas WhatsApp no PostgreSQL"""
    try:
        if not whatsapp_persistence:
            return {
                "status": "error",
                "message": "Serviço de persistência WhatsApp não disponível"
            }
        
        # Garantir que as tabelas existem
        success = whatsapp_persistence.ensure_tables_exist()
        
        if success:
            return {
                "status": "success",
                "message": "Tabelas WhatsApp criadas/verificadas com sucesso",
                "timestamp": datetime.now().isoformat()
            }
        else:
            return {
                "status": "error",
                "message": "Erro ao criar tabelas WhatsApp",
                "timestamp": datetime.now().isoformat()
            }
    except Exception as e:
        logger.error(f"Erro ao configurar tabelas WhatsApp: {e}")
        return {
            "status": "error",
            "message": f"Erro: {str(e)}",
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
    
    # NOVO: Inicializar sistema de persistência WhatsApp
    try:
        # Executar limpeza automática na inicialização
        if whatsapp_persistence:
            whatsapp_persistence.cleanup_old_messages(days=15)
        logger.info("✅ Sistema de persistência WhatsApp inicializado")
    except Exception as e:
        logger.warning(f"⚠️ Erro ao inicializar persistência WhatsApp: {e}")
    
    # Configurar limpeza automática inteligente (diária às 3:00 AM)
    import asyncio
    from datetime import time as time_module
    
    async def smart_periodic_cleanup():
        """
        Limpeza inteligente: executa uma vez por dia às 3:00 AM
        Remove mensagens WhatsApp com mais de 15 dias automaticamente
        """
        while True:
            try:
                now = datetime.now()
                target_time = now.replace(hour=3, minute=0, second=0, microsecond=0)
                
                # Se já passou das 3:00 hoje, agendar para amanhã
                if now >= target_time:
                    target_time += timedelta(days=1)
                
                # Calcular tempo até a próxima limpeza
                sleep_seconds = (target_time - now).total_seconds()
                logger.info(f"🗓️ Próxima limpeza automática WhatsApp agendada para: {target_time.strftime('%d/%m/%Y às %H:%M')}")
                
                await asyncio.sleep(sleep_seconds)
                
                # Executar limpeza
                if whatsapp_persistence:
                    logger.info("⏰ Executando limpeza automática diária WhatsApp (3:00 AM)")
                    removed_count = whatsapp_persistence.cleanup_old_messages(days=15)
                    logger.info(f"🎯 Limpeza diária concluída: {removed_count} mensagens antigas removidas")
                else:
                    logger.warning("⚠️ Limpeza cancelada: serviço de persistência não disponível")
                    
            except Exception as e:
                logger.error(f"❌ Erro na limpeza automática diária: {e}")
                # Em caso de erro, aguardar 1 hora antes de tentar novamente
                await asyncio.sleep(3600)
    
    # Iniciar tarefa de limpeza inteligente
    asyncio.create_task(smart_periodic_cleanup())
    logger.info("✅ Limpeza automática diária configurada (3:00 AM)")

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
