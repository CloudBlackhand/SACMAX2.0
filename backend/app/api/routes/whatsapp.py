"""
Rotas para integração com WhatsApp usando WAHA
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import os

# Importações do sistema
from app.services.waha.waha_service import WahaService
from app.core.database import get_db_manager

router = APIRouter()

# Modelos Pydantic
class MessageRequest(BaseModel):
    phone: str
    message: str
    message_type: str = "text"

class BulkMessageRequest(BaseModel):
    contacts: List[Dict[str, Any]]
    message_template: str
    delay: int = 2

class ChatHistoryRequest(BaseModel):
    chat_id: str
    limit: int = 100

# Inicializar serviço WAHA
waha_service = None

def get_waha_service():
    global waha_service
    if waha_service is None:
        db_manager = get_db_manager()
        waha_url = os.getenv("WAHA_URL", "http://localhost:3000")
        waha_service = WahaService(waha_url, db_manager)
    return waha_service

@router.get("/status")
async def get_whatsapp_status():
    """Obter status do WAHA"""
    try:
        service = get_waha_service()
        status = await service.check_waha_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/session/create")
async def create_session(session_name: str = "sacsmax"):
    """Criar sessão WAHA"""
    try:
        service = get_waha_service()
        result = await service.create_session(session_name)
        return {
            "success": result.get("status") == "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/screenshot")
async def get_screenshot(session_name: str = "sacsmax"):
    """Obter screenshot da sessão"""
    try:
        service = get_waha_service()
        screenshot = await service.get_screenshot(session_name)
        if screenshot:
            from fastapi.responses import Response
            return Response(content=screenshot, media_type="image/png")
        else:
            raise HTTPException(status_code=404, detail="Screenshot não disponível")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contacts")
async def get_contacts(session_name: str = "sacsmax"):
    """Obter contatos do WhatsApp"""
    try:
        service = get_waha_service()
        result = await service.get_contacts(session_name)
        return {
            "success": result.get("status") == "success",
            "data": result.get("data", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chats")
async def get_chats(session_name: str = "sacsmax"):
    """Obter chats/conversas"""
    try:
        service = get_waha_service()
        result = await service.get_chats(session_name)
        return {
            "success": result.get("status") == "success",
            "data": result.get("data", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messages/{chat_id}")
async def get_messages(chat_id: str, limit: int = 50, session_name: str = "sacsmax"):
    """Obter mensagens de um chat específico"""
    try:
        service = get_waha_service()
        result = await service.get_messages(chat_id, limit, session_name)
        return {
            "success": result.get("status") == "success",
            "data": result.get("data", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send")
async def send_message(request: MessageRequest, session_name: str = "sacsmax"):
    """Enviar mensagem individual"""
    try:
        service = get_waha_service()
        result = await service.send_text_message(request.phone, request.message, session_name)
        return {
            "success": result.get("status") == "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send/bulk")
async def send_bulk_messages(request: BulkMessageRequest, session_name: str = "sacsmax"):
    """Enviar mensagens em massa"""
    try:
        service = get_waha_service()
        result = await service.send_bulk_messages(
            request.contacts, 
            request.message_template, 
            request.delay
        )
        return {
            "success": result.get("status") == "success",
            "data": result.get("data", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history/{chat_id}")
async def get_chat_history(chat_id: str, limit: int = 100):
    """Obter histórico completo de um chat (WAHA + banco)"""
    try:
        service = get_waha_service()
        result = await service.get_chat_history(chat_id, limit)
        return {
            "success": result.get("status") == "success",
            "data": result.get("data", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/contact/{phone}")
async def get_contact_info(phone: str):
    """Buscar informações do contato na tabela de produtividade"""
    try:
        service = get_waha_service()
        contact_info = await service.get_contact_from_produtividade(phone)
        return {
            "success": True,
            "data": contact_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/produtividade/contacts")
async def get_produtividade_contacts():
    """Obter contatos da tabela de produtividade para disparo"""
    try:
        db_manager = get_db_manager()
        if not db_manager:
            raise HTTPException(status_code=503, detail="Database não disponível")
        
        query = """
        SELECT DISTINCT 
            nome_cliente, telefone1, telefone2, plano, status
        FROM produtividade 
        WHERE telefone1 IS NOT NULL OR telefone2 IS NOT NULL
        ORDER BY nome_cliente
        """
        
        results = db_manager.fetch_all(query)
        
        contacts = []
        for row in results:
            contact = {
                "nome_cliente": row[0] or "Sem nome",
                "telefone1": row[1] or "",
                "telefone2": row[2] or "",
                "plano": row[3] or "",
                "status": row[4] or ""
            }
            contacts.append(contact)
        
        return {
            "success": True,
            "data": contacts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

