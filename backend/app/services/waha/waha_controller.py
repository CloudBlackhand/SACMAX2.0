#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WAHA Controller - Rotas para integração com WAHA
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.waha.waha_service import WahaService
import os

router = APIRouter()
WAHA_URL = os.environ.get("WAHA_URL", "https://waha-production-1c76.up.railway.app")
waha_service = WahaService(waha_url=WAHA_URL)

class WahaMessageRequest(BaseModel):
    session_name: str = "default"
    chat_id: str
    message: str

class WahaSessionRequest(BaseModel):
    session_name: str = "default"
    auth_method: str = "qr"  # or "code"
    phone_number: Optional[str] = None

@router.get("/waha/status")
async def get_waha_status():
    """Obter status do WAHA"""
    result = await waha_service.check_waha_status()
    return result

@router.post("/waha/sessions")
async def create_waha_session(request: WahaSessionRequest):
    """Criar sessão WAHA"""
    result = await waha_service.create_session(request.session_name)
    return result

@router.get("/waha/screenshot")
async def get_waha_screenshot(session_name: str = "default"):
    """Obter screenshot da sessão WAHA"""
    screenshot = await waha_service.get_screenshot(session_name)
    if screenshot:
        from fastapi.responses import Response
        return Response(content=screenshot, media_type="image/png")
    else:
        raise HTTPException(status_code=404, detail="Screenshot não disponível")

@router.post("/waha/send-message")
async def send_waha_message(request: WahaMessageRequest):
    """Enviar mensagem via WAHA"""
    result = await waha_service.send_text_message(
        request.chat_id, 
        request.message, 
        request.session_name
    )
    return result

@router.get("/waha/contacts")
async def get_waha_contacts(session_name: str = "default"):
    """Obter contatos do WAHA"""
    result = await waha_service.get_contacts(session_name)
    return result

@router.delete("/waha/sessions/{session_name}")
async def delete_waha_session(session_name: str):
    """Deletar sessão WAHA"""
    # Implementar quando necessário
    return {"message": "Sessão deletada", "session": session_name}
