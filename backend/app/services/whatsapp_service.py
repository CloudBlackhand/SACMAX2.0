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

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self):
        self.session_path = Path("./whatsapp_sessions")
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
            # Simular verificação - em produção, faria uma requisição HTTP
            self.is_connected = False
            return False
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
            
            # Simular criação de sessão
            self.current_session = session_name
            
            return {
                "success": True,
                "message": "Sessão iniciada com sucesso (modo simulação)",
                "session": session_name,
                "qr_code": None
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
            
            session_name = self.current_session
            self.current_session = None
            self.is_connected = False
            
            return {
                "success": True,
                "message": "Sessão parada com sucesso",
                "session": session_name
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
            
            # Simular QR Code
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            
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
            
            # Simular envio de mensagem
            return {
                "success": True,
                "message": "Mensagem enviada com sucesso (modo simulação)",
                "message_id": f"sim_{datetime.now().timestamp()}"
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
                    
                    # Simular envio de mensagem
                    result = await self.send_message(contact['phone'], message)
                    
                    if result['success']:
                        success_count += 1
                    else:
                        error_count += 1
                    
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
                "message": f"Processamento concluído: {success_count} sucessos, {error_count} erros (modo simulação)",
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

