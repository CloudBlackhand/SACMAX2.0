"""
Rotas para integração com WhatsApp
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

# Importação condicional
try:
    from app.core.database import get_db, WhatsAppSession
    from app.services.whatsapp_service import WhatsAppService
    whatsapp_service = WhatsAppService()
except ImportError:
    # Versão simplificada se não conseguir importar
    get_db = None
    WhatsAppSession = None
    whatsapp_service = None

router = APIRouter()

class MessageRequest(BaseModel):
    phone: str
    message: str
    message_type: str = "text"

class BulkMessageRequest(BaseModel):
    contacts: List[Dict[str, Any]]
    message_template: str
    delay: int = 2

@router.post("/start")
async def start_whatsapp_session(
    session_name: str = "default",
    db: Session = Depends(get_db) if get_db else None
):
    """
    Iniciar sessão do WhatsApp
    """
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service not available")
    
    try:
        result = await whatsapp_service.start_whatsapp_session(session_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_whatsapp_session(db: Session = Depends(get_db) if get_db else None):
    """
    Parar sessão do WhatsApp
    """
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service not available")
    
    try:
        result = await whatsapp_service.stop_whatsapp_session()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_whatsapp_status(db: Session = Depends(get_db) if get_db else None):
    """
    Obter status do WhatsApp
    """
    if not whatsapp_service:
        return {
            "success": True,
            "data": {
                "status": "disconnected",
                "session_active": False,
                "message": "WhatsApp service not available"
            }
        }
    
    try:
        status = whatsapp_service.get_status()
        return {
            "success": True,
            "data": {
                "status": "connected" if status.get("connected") else "disconnected",
                "session_active": status.get("session_active", False),
                "message": status.get("message", "")
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.post("/qr-code")
async def generate_qr_code(db: Session = Depends(get_db) if get_db else None):
    """
    Gerar novo QR Code para conexão WhatsApp
    """
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service not available")
    
    try:
        qr_data = await whatsapp_service.generate_qr_code()
        if qr_data:
            return {
                "success": True,
                "data": {
                    "qr_code_url": qr_data.get("qr_code_url"),
                    "session_id": qr_data.get("session_id"),
                    "expires_in": qr_data.get("expires_in", 120),  # 2 minutos
                    "created_at": qr_data.get("created_at")
                }
            }
        else:
            return {
                "success": False,
                "error": "Não foi possível gerar o QR Code"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/qr")
async def get_qr_code(db: Session = Depends(get_db) if get_db else None):
    """
    Obter QR Code da sessão atual
    """
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service not available")
    
    try:
        qr_code = await whatsapp_service.get_qr_code()
        if qr_code:
            return {"qr_code": qr_code}
        else:
            return {"message": "QR Code não disponível"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send")
async def send_message(
    message: MessageRequest,
    db: Session = Depends(get_db) if get_db else None
):
    """
    Enviar mensagem individual
    """
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service not available")
    
    try:
        result = await whatsapp_service.send_message(
            message.phone,
            message.message,
            message.message_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-messages")
async def send_bulk_messages(
    request: BulkMessageRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db) if get_db else None
):
    """
    Enviar mensagens em lote
    """
    if not whatsapp_service:
        raise HTTPException(status_code=503, detail="WhatsApp service not available")
    
    try:
        result = await whatsapp_service.send_bulk_messages(
            request.contacts,
            request.message_template,
            request.delay
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_whatsapp_sessions(db: Session = Depends(get_db) if get_db else None):
    """
    Listar sessões do WhatsApp
    """
    if not db or not WhatsAppSession:
        return {"sessions": []}
    
    try:
        sessions = db.query(WhatsAppSession).all()
        return {
            "sessions": [
                {
                    "id": session.id,
                    "session_id": session.session_id,
                    "status": session.status,
                    "phone_number": session.phone_number,
                    "created_at": session.created_at.isoformat(),
                    "updated_at": session.updated_at.isoformat()
                }
                for session in sessions
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

