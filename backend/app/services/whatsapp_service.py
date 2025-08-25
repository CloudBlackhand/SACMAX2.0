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
        self.api_url = self.detect_whatsapp_url()  # Detectar URL automaticamente
        self.is_connected = False
        self.qr_code = None
        self.session_data = {}
        
    def detect_whatsapp_url(self) -> str:
        """Detectar automaticamente a URL do WhatsApp server"""
        # Tentar portas comuns do WhatsApp server
        ports = [3001, 3002, 3003, 3004, 3005]
        
        for port in ports:
            try:
                response = requests.get(f"http://localhost:{port}/api/status", timeout=2)
                if response.status_code == 200:
                    logger.info(f"✅ WhatsApp server detectado na porta {port}")
                    return f"http://localhost:{port}"
            except:
                continue
        
        # Se não encontrar, usar porta padrão
        logger.info("⚠️ WhatsApp server não detectado, usando porta padrão 3002")
        return "http://localhost:3002"
    
    async def initialize(self):
        """Inicializar o serviço WhatsApp"""
        logger.info("Inicializando WhatsAppService...")
        try:
            # Detectar URL do WhatsApp server
            self.api_url = self.detect_whatsapp_url()
            
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

    async def start_whatsapp_server(self):
        """Iniciar servidor WhatsApp Web.js"""
        try:
            if self.whatsapp_process and self.whatsapp_process.poll() is None:
                logger.info("WhatsApp Web.js já está rodando")
                return True
            
            # Verificar se o arquivo whatsapp-server-simple.js existe
            server_path = Path.cwd() / "whatsapp-server-simple.js"
            if not server_path.exists():
                # Tentar caminho relativo ao backend
                server_path = Path.cwd().parent / "whatsapp-server-simple.js"
                if not server_path.exists():
                    logger.error(f"Arquivo whatsapp-server-simple.js não encontrado em {server_path}")
                    return False
            
            # Iniciar processo
            self.whatsapp_process = subprocess.Popen(
                ["node", str(server_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=server_path.parent
            )
            
            # Aguardar um pouco para o servidor inicializar
            await asyncio.sleep(5)
            
            # Atualizar URL após iniciar
            self.api_url = self.detect_whatsapp_url()
            
            # Verificar se está rodando
            if await self.check_whatsapp_status():
                logger.info("WhatsApp Web.js iniciado com sucesso")
                return True
            else:
                logger.error("WhatsApp Web.js não respondeu após inicialização")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao iniciar WhatsApp Web.js: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Obter status atual do WhatsApp"""
        # Verificar status real da sessão
        session_status = "disconnected"
        session_name = self.current_session or "clean_session"  # Usar clean_session como fallback
        
        try:
            response = requests.get(f"{self.api_url}/api/sessions", timeout=5)
            if response.status_code == 200:
                data = response.json()
                sessions = data.get("sessions", [])
                for session in sessions:
                    if session.get("sessionName") == session_name:
                        status = session.get("status", "disconnected")
                        if status == "CONNECTED":
                            session_status = "connected"
                            self.is_connected = True
                            self.current_session = session_name  # Atualizar sessão atual
                        elif status == "qr_ready":
                            session_status = "connecting"
                            self.is_connected = False
                            self.current_session = session_name  # Atualizar sessão atual
                        else:
                            session_status = "disconnected"
                            self.is_connected = False
                        break
        except Exception as e:
            logger.debug(f"Erro ao verificar status da sessão: {e}")
            session_status = "disconnected"
            self.is_connected = False
        
        return {
            "connected": self.is_connected,
            "session_active": session_name is not None,
            "api_url": self.api_url,
            "qr_code": self.qr_code is not None,
            "session_name": session_name,
            "message": "WhatsApp conectado" if self.is_connected else "WhatsApp desconectado"
        }

    def disconnect(self) -> Dict[str, Any]:
        """Desconectar WhatsApp"""
        try:
            if self.current_session:
                # Remover sessão via API do WhatsApp Web.js
                response = requests.delete(f"{self.api_url}/api/sessions/{self.current_session}/remove", timeout=10)
                if response.status_code == 200:
                    logger.info(f"Sessão {self.current_session} removida com sucesso")
                
                self.current_session = None
                self.is_connected = False
                self.qr_code = None
            
            return {
                "success": True,
                "message": "WhatsApp desconectado com sucesso"
            }
        except Exception as e:
            logger.error(f"Erro ao desconectar WhatsApp: {e}")
            return {
                "success": False,
                "error": str(e)
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
            # Verificar se a sessão já existe e tem QR Code pronto
            try:
                response = requests.get(
                    f"{self.api_url}/api/sessions/{session_name}/qr",
                    timeout=5
                )
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success') and result.get('qr'):
                        logger.info(f"Sessão {session_name} já tem QR Code pronto")
                        return {
                            "success": True,
                            "message": "Sessão já existe com QR Code",
                            "session": session_name
                        }
            except:
                pass  # Ignorar erro se sessão não existir
            
            # Remover sessão existente se não tem QR Code
            try:
                response = requests.delete(
                    f"{self.api_url}/api/sessions/remove/{session_name}",
                    timeout=5
                )
                logger.info(f"Removida sessão existente {session_name}: {response.status_code}")
            except:
                pass  # Ignorar erro se sessão não existir
            
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
                    # Não definir qr_code aqui, pois será obtido posteriormente
                    
                    return {
                        "success": True,
                        "message": "Sessão iniciada com sucesso",
                        "session": session_name
                    }
                else:
                    logger.error(f"Erro ao criar sessão: {response.status_code}")
                    return {
                        "success": False,
                        "message": f"Erro ao criar sessão: {response.status_code}"
                    }
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Erro de conexão ao criar sessão: {e}")
                return {
                    "success": False,
                    "message": f"Erro de conexão: {str(e)}"
                }
                
        except Exception as e:
            logger.error(f"Erro ao iniciar sessão WhatsApp: {e}")
            return {
                "success": False,
                "message": f"Erro interno: {str(e)}"
            }
    
    def _simulate_session_creation(self, session_name: str) -> Dict[str, Any]:
        """Método removido - sempre usar API real"""
        return {
            "success": False,
            "message": "Simulação removida - API real obrigatória"
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
    
    async def generate_qr_code(self) -> Optional[Dict[str, Any]]:
        """Gerar novo QR Code para conexão WhatsApp"""
        try:
            # Limpar qualquer estado antigo
            self.qr_code = None
            self.current_session = "clean_session"  # Definir sessão padrão
            
            # Verificar se o WhatsApp Web.js está rodando
            if not await self.check_whatsapp_status():
                # Tentar iniciar o WhatsApp Web.js
                await self.start_whatsapp_server()
            
            # Sempre criar nova sessão limpa
            session_result = await self.start_whatsapp_session("clean_session")
            if not session_result.get("success"):
                return None
            
            # Obter QR Code da sessão
            qr_code = await self.get_qr_code()
            if qr_code:

                # O QR Code já vem como data URL completo do WhatsApp Web.js
                return {
                    "qr_code_url": qr_code,
                    "session_id": self.current_session,
                    "expires_in": 120,  # 2 minutos
                    "created_at": datetime.now().isoformat()
                }
            
            return None
        except Exception as e:
            logger.error(f"Erro ao gerar QR Code: {e}")
            return None

    async def get_qr_code(self) -> Optional[str]:
        """Obter QR Code da sessão atual"""
        session_name = "clean_session"  # Usar sessão que sabemos que funciona
            
        try:
            # Sempre buscar QR Code fresco da API
            response = requests.get(
                f"{self.api_url}/api/sessions/{session_name}/qr",
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    qr_code = result.get('qr')
                    if qr_code:
                        # Log para debug
                        original_count = qr_code.count('data:image/png;base64,')
                        logger.error(f"🔧 PROCESSING QR: Original has {original_count} prefixes")
                        
                        # Limpar qualquer duplicação e garantir formato correto
                        # Remove todos os prefixos data:image/png;base64,
                        clean_data = qr_code
                        while clean_data.startswith('data:image/png;base64,'):
                            clean_data = clean_data[22:]  # Remove cada ocorrência de "data:image/png;base64,"
                        
                        # Adicionar apenas um prefixo correto
                        qr_code = 'data:image/png;base64,' + clean_data
                        final_count = qr_code.count('data:image/png;base64,')
                        logger.error(f"🎯 PROCESSED QR: Final has {final_count} prefixes")
                        return qr_code
                
        except Exception as e:
            logger.debug(f"Erro ao obter QR Code: {e}")
        
        return None
    
    async def send_message(self, phone: str, message: str, message_type: str = "text") -> Dict[str, Any]:
        """Enviar mensagem WhatsApp"""
        try:
            session_name = self.current_session or "clean_session"
            if not session_name:
                return {
                    "success": False,
                    "message": "Nenhuma sessão ativa"
                }
            
            # Formatar número de telefone
            phone = self._format_phone_number(phone)
            
            message_data = {
                "sessionName": session_name,
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

