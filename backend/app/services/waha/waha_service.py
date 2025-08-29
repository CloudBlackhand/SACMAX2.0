#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WAHA Service - Integração completa com WhatsApp HTTP API
"""

import requests
import logging
import os
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from ..feedback_service import FeedbackService
from ..excel_service import ExcelService

class WahaService:
    def __init__(self, waha_url: str = "http://localhost:3000", db_manager=None):
        self.waha_url = waha_url
        self.logger = logging.getLogger(__name__)
        self.db_manager = db_manager
        self.feedback_service = FeedbackService(db_manager)
        self.excel_service = ExcelService()  # ExcelService não precisa de db_manager
        self.session_name = "sacsmax"

    async def check_waha_status(self) -> Dict[str, Any]:
        """Verificar status do WAHA"""
        try:
            response = requests.get(f"{self.waha_url}/api/server/status", timeout=5)
            if response.status_code == 200:
                return {"status": "connected", "data": response.json()}
            else:
                return {"status": "error", "message": f"Status {response.status_code}"}
        except Exception as e:
            return {"status": "disconnected", "message": str(e)}

    async def create_session(self, session_name: str = "sacsmax") -> Dict[str, Any]:
        """Criar sessão WAHA"""
        try:
            response = requests.post(
                f"{self.waha_url}/api/sessions",
                json={"name": session_name},
                timeout=10
            )
            if response.status_code == 200:
                self.session_name = session_name
                return {"status": "success", "data": response.json()}
            else:
                return {"status": "error", "message": f"Status {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_screenshot(self, session_name: str = "sacsmax") -> Optional[bytes]:
        """Obter screenshot da sessão"""
        try:
            response = requests.get(
                f"{self.waha_url}/api/screenshot",
                params={"session": session_name},
                timeout=10
            )
            if response.status_code == 200:
                return response.content
            else:
                return None
        except Exception as e:
            self.logger.error(f"Erro ao obter screenshot: {e}")
            return None

    async def send_text_message(self, chat_id: str, text: str, session_name: str = "sacsmax") -> Dict[str, Any]:
        """Enviar mensagem de texto"""
        try:
            response = requests.post(
                f"{self.waha_url}/api/sendText",
                json={
                    "session": session_name,
                    "chatId": chat_id,
                    "text": text
                },
                timeout=10
            )
            if response.status_code == 200:
                # Salvar mensagem enviada como feedback
                await self._save_message_as_feedback(chat_id, text, "sent")
                return {"status": "success", "data": response.json()}
            else:
                return {"status": "error", "message": f"Status {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_contacts(self, session_name: str = "sacsmax") -> Dict[str, Any]:
        """Obter contatos"""
        try:
            response = requests.get(
                f"{self.waha_url}/api/contacts",
                params={"session": session_name},
                timeout=10
            )
            if response.status_code == 200:
                return {"status": "success", "data": response.json()}
            else:
                return {"status": "error", "message": f"Status {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_chats(self, session_name: str = "default") -> Dict[str, Any]:
        """Obter chats/conversas"""
        try:
            url = f"{self.waha_url}/api/chats"
            params = {"session": session_name}
            
            self.logger.info(f"🔍 Buscando chats: {url} com params: {params}")
            
            response = requests.get(url, params=params, timeout=10)
            
            self.logger.info(f"📱 Resposta WAHA chats: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.logger.info(f"📱 Chats encontrados: {len(data) if isinstance(data, list) else 'N/A'}")
                return {"status": "success", "data": data}
            else:
                self.logger.error(f"❌ Erro WAHA chats: {response.status_code} - {response.text}")
                return {"status": "error", "message": f"Status {response.status_code}"}
        except Exception as e:
            self.logger.error(f"❌ Exceção WAHA chats: {str(e)}")
            return {"status": "error", "message": str(e)}

    async def get_messages(self, chat_id: str, limit: int = 50, session_name: str = "default") -> Dict[str, Any]:
        """Obter mensagens de um chat específico"""
        try:
            response = requests.get(
                f"{self.waha_url}/api/messages",
                params={
                    "session": session_name,
                    "chatId": chat_id,
                    "limit": limit
                },
                timeout=10
            )
            if response.status_code == 200:
                messages = response.json()
                # Processar e salvar mensagens recebidas
                await self._process_messages(messages)
                return {"status": "success", "data": messages}
            else:
                return {"status": "error", "message": f"Status {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def send_bulk_messages(self, contacts: List[Dict], message_template: str, delay: int = 2) -> Dict[str, Any]:
        """Enviar mensagens em massa"""
        try:
            results = []
            for contact in contacts:
                phone = contact.get('phone')
                if not phone:
                    continue
                
                # Personalizar mensagem
                personalized_message = message_template.format(**contact)
                
                # Enviar mensagem
                result = await self.send_text_message(phone, personalized_message)
                results.append({
                    "phone": phone,
                    "status": result.get("status"),
                    "message": result.get("message", "")
                })
                
                # Aguardar delay
                if delay > 0:
                    import asyncio
                    await asyncio.sleep(delay)
            
            return {
                "status": "success",
                "data": {
                    "total_sent": len(results),
                    "results": results
                }
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def get_contact_from_produtividade(self, phone: str) -> Optional[Dict]:
        """Buscar contato na tabela de produtividade"""
        try:
            if not self.db_manager:
                return None
            
            # Limpar número de telefone
            clean_phone = phone.replace('+', '').replace('-', '').replace(' ', '')
            
            query = """
            SELECT nome_cliente, telefone1, telefone2, plano, status, obs
            FROM produtividade 
            WHERE telefone1 LIKE %s OR telefone2 LIKE %s
            ORDER BY created_at DESC
            LIMIT 1
            """
            
            result = self.db_manager.fetch_one(query, (f"%{clean_phone}%", f"%{clean_phone}%"))
            
            if result:
                return {
                    "nome_cliente": result[0],
                    "telefone1": result[1],
                    "telefone2": result[2],
                    "plano": result[3],
                    "status": result[4],
                    "obs": result[5]
                }
            
            return None
        except Exception as e:
            self.logger.error(f"Erro ao buscar contato: {e}")
            return None

    async def _process_messages(self, messages: List[Dict]):
        """Processar mensagens recebidas e salvar como feedback"""
        try:
            for message in messages:
                if message.get('fromMe', False):  # Pular mensagens enviadas por nós
                    continue
                
                chat_id = message.get('chatId')
                text = message.get('text', '')
                timestamp = message.get('timestamp')
                
                if not text or not chat_id:
                    continue
                
                # Buscar informações do contato na produtividade
                contact_info = await self.get_contact_from_produtividade(chat_id)
                
                # Salvar como feedback
                await self._save_message_as_feedback(chat_id, text, "received", contact_info, timestamp)
                
        except Exception as e:
            self.logger.error(f"Erro ao processar mensagens: {e}")

    async def _save_message_as_feedback(self, chat_id: str, text: str, direction: str, 
                                      contact_info: Optional[Dict] = None, timestamp: Optional[str] = None):
        """Salvar mensagem como feedback no banco"""
        try:
            if not self.db_manager:
                return
            
            # Gerar ID único
            message_id = f"msg_{chat_id}_{timestamp}_{direction}"
            
            # Preparar dados do feedback
            feedback_data = {
                "id": message_id,
                "contact_name": contact_info.get("nome_cliente", "") if contact_info else "",
                "contact_phone": chat_id,
                "text": text,
                "sentiment": "neutral",  # Será analisado pelo sentiment_analyzer
                "score": 0.5,
                "keywords": [],
                "timestamp": timestamp or datetime.now().isoformat(),
                "analyzed_at": datetime.now().isoformat()
            }
            
            # Salvar no banco
            self.feedback_service.save_feedback(feedback_data)
            
        except Exception as e:
            self.logger.error(f"Erro ao salvar mensagem como feedback: {e}")

    async def get_chat_history(self, chat_id: str, limit: int = 100) -> Dict[str, Any]:
        """Obter histórico completo de um chat"""
        try:
            # Buscar mensagens do WAHA
            waha_result = await self.get_messages(chat_id, limit)
            
            if waha_result.get("status") != "success":
                return waha_result
            
            # Buscar mensagens salvas no banco (feedbacks)
            db_messages = self.feedback_service.get_feedbacks_by_phone(chat_id, limit)
            
            # Combinar e ordenar mensagens
            all_messages = []
            
            # Adicionar mensagens do WAHA
            for msg in waha_result.get("data", []):
                all_messages.append({
                    "source": "waha",
                    "timestamp": msg.get("timestamp"),
                    "text": msg.get("text", ""),
                    "fromMe": msg.get("fromMe", False),
                    "id": msg.get("id")
                })
            
            # Adicionar mensagens do banco
            for msg in db_messages:
                all_messages.append({
                    "source": "database",
                    "timestamp": msg.get("timestamp"),
                    "text": msg.get("text", ""),
                    "sentiment": msg.get("sentiment"),
                    "id": msg.get("feedback_id")
                })
            
            # Ordenar por timestamp
            all_messages.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
            
            return {
                "status": "success",
                "data": {
                    "chat_id": chat_id,
                    "messages": all_messages,
                    "total": len(all_messages)
                }
            }
            
        except Exception as e:
            return {"status": "error", "message": str(e)}
