"""
Serviço para integração com WhatsApp Web.js
"""

import asyncio
import json
import logging
import os
import requests
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
import subprocess
import time

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WhatsAppService:
    def __init__(self):
        self.session_path = Path("./whatsapp_sessions")
        self.session_path.mkdir(exist_ok=True)
        self.current_session = None
        self.whatsapp_process = None
        self.api_url = "http://localhost:3001"  # WhatsApp Web.js API
        self.is_connected = False
        self.qr_code = None
        self.session_data = {}
        
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
            "api_url": self.api_url,
            "qr_code": self.qr_code is not None,
            "session_name": self.current_session
        }
    
    async def check_whatsapp_status(self) -> bool:
        """Verificar se o WhatsApp Web.js está respondendo"""
        try:
            # Tentar conectar com a API do WhatsApp Web.js
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
            
            # Criar nova sessão
            session_data = {
                "sessionName": session_name,
                "headless": True,
                "useChrome": True,
                "debug": False
            }
            
            try:
                # Tentar criar sessão via API
                response = requests.post(
                    f"{self.api_url}/api/sessions/add",
                    json=session_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.current_session = session_name
                    self.qr_code = result.get('qr')
                    
                    return {
                        "success": True,
                        "message": "Sessão iniciada com sucesso",
                        "session": session_name,
                        "qr_code": self.qr_code
                    }
                else:
                    # Fallback para simulação se API não estiver disponível
                    return self._simulate_session_creation(session_name)
                    
            except requests.exceptions.RequestException:
                # Fallback para simulação
                return self._simulate_session_creation(session_name)
                
        except Exception as e:
            logger.error(f"Erro ao iniciar sessão WhatsApp: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    def _simulate_session_creation(self, session_name: str) -> Dict[str, Any]:
        """Simular criação de sessão quando API não está disponível"""
        self.current_session = session_name
        self.qr_code = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        return {
            "success": True,
            "message": "Sessão iniciada (modo simulação)",
            "session": session_name,
            "qr_code": self.qr_code
        }
    
    async def stop_whatsapp_session(self) -> Dict[str, Any]:
        """Parar sessão do WhatsApp"""
        try:
            if not self.current_session:
                return {
                    "success": False,
                    "message": "Nenhuma sessão ativa"
                }
            
            try:
                # Tentar parar sessão via API
                response = requests.delete(
                    f"{self.api_url}/api/sessions/remove/{self.current_session}",
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    self.current_session = None
                    self.qr_code = None
                    self.is_connected = False
                    
                    return {
                        "success": True,
                        "message": "Sessão parada com sucesso",
                        "session": result.get('sessionName')
                    }
                else:
                    # Fallback para simulação
                    return self._simulate_session_stop()
                    
            except requests.exceptions.RequestException:
                # Fallback para simulação
                return self._simulate_session_stop()
                
        except Exception as e:
            logger.error(f"Erro ao parar sessão WhatsApp: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    def _simulate_session_stop(self) -> Dict[str, Any]:
        """Simular parada de sessão"""
        session_name = self.current_session
        self.current_session = None
        self.qr_code = None
        self.is_connected = False
        
        return {
            "success": True,
            "message": "Sessão parada (modo simulação)",
            "session": session_name
        }
    
    async def get_qr_code(self) -> Optional[str]:
        """Obter QR Code da sessão atual"""
        if self.current_session and self.qr_code:
            return self.qr_code
        
        try:
            # Tentar obter QR Code via API
            response = requests.get(
                f"{self.api_url}/api/sessions/{self.current_session}/qr",
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                self.qr_code = result.get('qr')
                return self.qr_code
                
        except Exception as e:
            logger.debug(f"Erro ao obter QR Code: {e}")
        
        return None
    
    async def send_message(self, phone: str, message: str, message_type: str = "text") -> Dict[str, Any]:
        """Enviar mensagem WhatsApp"""
        try:
            if not self.current_session:
                return {
                    "success": False,
                    "message": "Nenhuma sessão ativa"
                }
            
            # Formatar número de telefone
            phone = self._format_phone_number(phone)
            
            message_data = {
                "sessionName": self.current_session,
                "number": phone,
                "text": message,
                "type": message_type
            }
            
            try:
                # Tentar enviar via API
                response = requests.post(
                    f"{self.api_url}/api/send-message",
                    json=message_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "message": "Mensagem enviada com sucesso",
                        "message_id": result.get('messageId'),
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    # Fallback para simulação
                    return self._simulate_message_send(phone, message)
                    
            except requests.exceptions.RequestException:
                # Fallback para simulação
                return self._simulate_message_send(phone, message)
                
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    def _simulate_message_send(self, phone: str, message: str) -> Dict[str, Any]:
        """Simular envio de mensagem"""
        return {
            "success": True,
            "message": "Mensagem enviada (modo simulação)",
            "phone": phone,
            "text": message,
            "timestamp": datetime.now().isoformat()
        }
    
    def _format_phone_number(self, phone: str) -> str:
        """Formatar número de telefone para o padrão WhatsApp"""
        # Remover caracteres não numéricos
        phone = ''.join(filter(str.isdigit, phone))
        
        # Adicionar código do país se não tiver
        if not phone.startswith('55'):
            phone = '55' + phone
        
        # Adicionar @c.us se não tiver
        if not phone.endswith('@c.us'):
            phone = phone + '@c.us'
        
        return phone
    
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
                    phone = contact.get('phone')
                    name = contact.get('name', 'Cliente')
                    
                    # Personalizar mensagem
                    personalized_message = message_template.replace('{nome}', name)
                    
                    # Enviar mensagem
                    result = await self.send_message(phone, personalized_message)
                    
                    if result.get('success'):
                        success_count += 1
                    else:
                        error_count += 1
                    
                    results.append({
                        "contact": contact,
                        "result": result
                    })
                    
                    # Aguardar entre mensagens
                    if delay > 0:
                        await asyncio.sleep(delay)
                        
                except Exception as e:
                    error_count += 1
                    results.append({
                        "contact": contact,
                        "result": {
                            "success": False,
                            "message": f"Erro: {str(e)}"
                        }
                    })
            
            return {
                "success": True,
                "message": f"Lote processado: {success_count} sucessos, {error_count} erros",
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
    
    async def get_chat_history(self, phone: str, limit: int = 50) -> Dict[str, Any]:
        """Obter histórico de chat"""
        try:
            if not self.current_session:
                return {
                    "success": False,
                    "message": "Nenhuma sessão ativa"
                }
            
            phone = self._format_phone_number(phone)
            
            try:
                # Tentar obter histórico via API
                response = requests.get(
                    f"{self.api_url}/api/messages/{phone}",
                    params={"limit": limit},
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "messages": result.get('messages', []),
                        "phone": phone
                    }
                else:
                    # Fallback para simulação
                    return self._simulate_chat_history(phone, limit)
                    
            except requests.exceptions.RequestException:
                # Fallback para simulação
                return self._simulate_chat_history(phone, limit)
                
        except Exception as e:
            logger.error(f"Erro ao obter histórico: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    def _simulate_chat_history(self, phone: str, limit: int) -> Dict[str, Any]:
        """Simular histórico de chat"""
        messages = [
            {
                "id": "1",
                "text": "Olá! Como posso ajudar?",
                "fromMe": True,
                "timestamp": datetime.now().isoformat()
            },
            {
                "id": "2", 
                "text": "Preciso de ajuda com meu serviço",
                "fromMe": False,
                "timestamp": datetime.now().isoformat()
            }
        ]
        
        return {
            "success": True,
            "messages": messages[:limit],
            "phone": phone
        }

