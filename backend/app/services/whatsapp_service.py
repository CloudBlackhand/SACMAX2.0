"""
Serviço para integração com WhatsApp Web.js
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import subprocess
import time
import requests

from app.core.config import settings
from app.core.database import SessionLocal, WhatsAppSession, Contact, Message

logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self):
        self.session_path = Path(settings.whatsapp_session_path)
        self.session_path.mkdir(exist_ok=True)
        self.current_session = None
        self.whatsapp_process = None
        self.api_url = "http://localhost:3000"  # WhatsApp Web.js API
        self.is_connected = False
        
    async def initialize(self):
        """Inicializar o serviço WhatsApp"""
        logger.info("Inicializando WhatsAppService...")
        try:
            # Verificar se o WhatsApp Web.js está rodando
            await self.check_whatsapp_status()
        except Exception as e:
            logger.warning(f"Não foi possível conectar ao WhatsApp Web.js: {e}")
    
    async def cleanup(self):
        """Limpeza do serviço"""
        logger.info("Limpando WhatsAppService...")
        if self.whatsapp_process:
            try:
                self.whatsapp_process.terminate()
                await asyncio.sleep(2)
                if self.whatsapp_process.poll() is None:
                    self.whatsapp_process.kill()
            except Exception as e:
                logger.error(f"Erro ao encerrar processo WhatsApp: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status atual do WhatsApp"""
        return {
            "connected": self.is_connected,
            "session_active": self.current_session is not None,
            "api_url": self.api_url
        }
    
    async def check_whatsapp_status(self) -> bool:
        """Verificar se o WhatsApp Web.js está respondendo"""
        try:
            response = requests.get(f"{self.api_url}/api/sessions", timeout=5)
            if response.status_code == 200:
                self.is_connected = True
                return True
        except Exception as e:
            logger.debug(f"WhatsApp Web.js não está respondendo: {e}")
            self.is_connected = False
        return False
    
    async def start_whatsapp_session(self, session_name: str = "default") -> Dict[str, Any]:
        """Iniciar nova sessão do WhatsApp"""
        try:
            # Verificar se já existe uma sessão ativa
            if self.current_session:
                return {
                    "success": False,
                    "message": "Já existe uma sessão ativa",
                    "session": self.current_session
                }
            
            # Criar sessão no WhatsApp Web.js
            session_data = {
                "session": session_name,
                "config": {
                    "headless": settings.whatsapp_headless,
                    "timeout": settings.whatsapp_timeout * 1000,
                    "sessionDataPath": str(self.session_path / f"{session_name}.json")
                }
            }
            
            response = requests.post(
                f"{self.api_url}/api/sessions/add",
                json=session_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.current_session = session_name
                    
                    # Salvar no banco
                    await self.save_session_to_db(session_name, "connecting")
                    
                    return {
                        "success": True,
                        "message": "Sessão iniciada com sucesso",
                        "session": session_name,
                        "qr_code": result.get("data", {}).get("qr")
                    }
                else:
                    return {
                        "success": False,
                        "message": result.get("message", "Erro ao iniciar sessão")
                    }
            else:
                return {
                    "success": False,
                    "message": "Erro ao conectar com WhatsApp Web.js"
                }
                
        except Exception as e:
            logger.error(f"Erro ao iniciar sessão WhatsApp: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    async def stop_whatsapp_session(self) -> Dict[str, Any]:
        """Parar sessão do WhatsApp"""
        try:
            if not self.current_session:
                return {
                    "success": False,
                    "message": "Nenhuma sessão ativa"
                }
            
            # Parar sessão no WhatsApp Web.js
            response = requests.delete(
                f"{self.api_url}/api/sessions/remove/{self.current_session}",
                timeout=10
            )
            
            if response.status_code == 200:
                # Atualizar banco
                await self.update_session_status(self.current_session, "disconnected")
                
                session_name = self.current_session
                self.current_session = None
                self.is_connected = False
                
                return {
                    "success": True,
                    "message": "Sessão parada com sucesso",
                    "session": session_name
                }
            else:
                return {
                    "success": False,
                    "message": "Erro ao parar sessão"
                }
                
        except Exception as e:
            logger.error(f"Erro ao parar sessão WhatsApp: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    async def get_qr_code(self) -> Optional[str]:
        """Obter QR Code da sessão atual"""
        try:
            if not self.current_session:
                return None
            
            response = requests.get(
                f"{self.api_url}/api/sessions/{self.current_session}/qr",
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("data", {}).get("qr")
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao obter QR Code: {e}")
            return None
    
    async def send_message(self, phone: str, message: str, message_type: str = "text") -> Dict[str, Any]:
        """Enviar mensagem para um contato"""
        try:
            if not self.current_session:
                return {
                    "success": False,
                    "message": "Nenhuma sessão ativa"
                }
            
            # Preparar dados da mensagem
            message_data = {
                "session": self.current_session,
                "data": {
                    "number": phone,
                    "message": message,
                    "type": message_type
                }
            }
            
            response = requests.post(
                f"{self.api_url}/api/send",
                json=message_data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    # Salvar mensagem no banco
                    await self.save_message_to_db(phone, message, message_type, "sent")
                    
                    return {
                        "success": True,
                        "message": "Mensagem enviada com sucesso",
                        "message_id": result.get("data", {}).get("id")
                    }
                else:
                    return {
                        "success": False,
                        "message": result.get("message", "Erro ao enviar mensagem")
                    }
            else:
                return {
                    "success": False,
                    "message": "Erro ao conectar com WhatsApp Web.js"
                }
                
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    async def send_bulk_messages(self, contacts: List[Dict[str, Any]], message_template: str, delay: int = 2) -> Dict[str, Any]:
        """Enviar mensagens em lote"""
        try:
            if not self.current_session:
                return {
                    "success": False,
                    "message": "Nenhuma sessão ativa"
                }
            
            results = []
            success_count = 0
            error_count = 0
            
            for contact in contacts:
                try:
                    # Substituir variáveis no template
                    message = message_template
                    if contact.get('name'):
                        message = message.replace('{nome}', contact['name'])
                    if contact.get('company'):
                        message = message.replace('{empresa}', contact['company'])
                    if contact.get('position'):
                        message = message.replace('{cargo}', contact['position'])
                    
                    # Enviar mensagem
                    result = await self.send_message(contact['phone'], message)
                    
                    if result['success']:
                        success_count += 1
                        # Atualizar status do contato
                        await self.update_contact_status(contact['id'], 'sent')
                    else:
                        error_count += 1
                        await self.update_contact_status(contact['id'], 'failed')
                    
                    results.append({
                        "contact": contact,
                        "result": result
                    })
                    
                    # Aguardar delay entre mensagens
                    if delay > 0:
                        await asyncio.sleep(delay)
                        
                except Exception as e:
                    error_count += 1
                    logger.error(f"Erro ao enviar mensagem para {contact.get('phone')}: {e}")
                    results.append({
                        "contact": contact,
                        "result": {"success": False, "message": str(e)}
                    })
            
            return {
                "success": True,
                "message": f"Processamento concluído: {success_count} sucessos, {error_count} erros",
                "total": len(contacts),
                "success_count": success_count,
                "error_count": error_count,
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Erro no envio em lote: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    async def save_session_to_db(self, session_name: str, status: str):
        """Salvar sessão no banco de dados"""
        db = SessionLocal()
        try:
            session = WhatsAppSession(
                session_id=session_name,
                status=status
            )
            db.add(session)
            db.commit()
        except Exception as e:
            logger.error(f"Erro ao salvar sessão no banco: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def update_session_status(self, session_name: str, status: str):
        """Atualizar status da sessão no banco"""
        db = SessionLocal()
        try:
            session = db.query(WhatsAppSession).filter(
                WhatsAppSession.session_id == session_name
            ).first()
            
            if session:
                session.status = status
                session.updated_at = datetime.now()
                db.commit()
        except Exception as e:
            logger.error(f"Erro ao atualizar sessão no banco: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def save_message_to_db(self, phone: str, content: str, message_type: str, status: str):
        """Salvar mensagem no banco de dados"""
        db = SessionLocal()
        try:
            # Encontrar contato pelo telefone
            contact = db.query(Contact).filter(Contact.phone == phone).first()
            
            if contact:
                message = Message(
                    contact_id=contact.id,
                    content=content,
                    message_type=message_type,
                    status=status,
                    sent_at=datetime.now()
                )
                db.add(message)
                db.commit()
        except Exception as e:
            logger.error(f"Erro ao salvar mensagem no banco: {e}")
            db.rollback()
        finally:
            db.close()
    
    async def update_contact_status(self, contact_id: int, status: str):
        """Atualizar status do contato"""
        db = SessionLocal()
        try:
            contact = db.query(Contact).filter(Contact.id == contact_id).first()
            if contact:
                contact.status = status
                contact.updated_at = datetime.now()
                db.commit()
        except Exception as e:
            logger.error(f"Erro ao atualizar contato no banco: {e}")
            db.rollback()
        finally:
            db.close()

