#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WhatsApp Persistence Service - Gerencia persistência de chats e mensagens no PostgreSQL
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
try:
    from database_config import get_db_manager
except ImportError:
    get_db_manager = None

logger = logging.getLogger(__name__)

class WhatsAppPersistenceService:
    """
    Serviço para persistir chats e mensagens WhatsApp no PostgreSQL
    
    REGRA IMPORTANTE: 
    - Mensagens WhatsApp são mantidas apenas por 15 dias
    - Após 15 dias, mensagens são automaticamente removidas
    - Limpeza automática executa diariamente às 3:00 AM
    - Chats órfãos (sem mensagens) também são removidos
    
    Substitui o storage em memória por armazenamento permanente
    """
    
    def __init__(self, db_manager=None):
        self.db_manager = db_manager or get_db_manager()
        self.ensure_tables_exist()
    
    def ensure_tables_exist(self):
        """Garante que as tabelas WhatsApp existem no banco"""
        try:
            if not self.db_manager:
                logger.warning("DB Manager não disponível")
                return False
            
            # Executar script de criação das tabelas
            create_script = """
            -- Tabela de chats WhatsApp
            CREATE TABLE IF NOT EXISTS whatsapp_chats (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(100),
                avatar_url TEXT,
                status VARCHAR(20) DEFAULT 'online',
                last_message TEXT,
                last_message_time TIMESTAMP,
                unread_count INTEGER DEFAULT 0,
                is_pinned BOOLEAN DEFAULT FALSE,
                is_muted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Tabela de mensagens WhatsApp
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id SERIAL PRIMARY KEY,
                message_id VARCHAR(100) UNIQUE,
                chat_phone VARCHAR(20) NOT NULL,
                content TEXT NOT NULL,
                sender VARCHAR(100),
                message_type VARCHAR(20) DEFAULT 'text',
                direction VARCHAR(10) NOT NULL,
                status VARCHAR(20) DEFAULT 'received',
                timestamp TIMESTAMP,
                waha_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Índices para performance
            CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_phone ON whatsapp_chats(phone);
            CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_last_message_time ON whatsapp_chats(last_message_time DESC);
            CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_phone ON whatsapp_messages(chat_phone);
            CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
            """
            
            # Executar comandos separadamente para evitar problemas
            commands = create_script.split(';')
            for cmd in commands:
                cmd = cmd.strip()
                if cmd and not cmd.startswith('--'):
                    self.db_manager.execute_query(cmd)
            
            logger.info("✅ Tabelas WhatsApp verificadas/criadas")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao criar tabelas WhatsApp: {e}")
            return False
    
    def save_chat(self, phone: str, chat_data: Dict) -> bool:
        """
        Salva ou atualiza um chat no banco PostgreSQL
        """
        try:
            if not self.db_manager:
                logger.warning("DB Manager não disponível para salvar chat")
                return False
            
            # Normalizar telefone
            phone = str(phone).strip()
            if not phone:
                logger.warning("Telefone vazio, não salvando chat")
                return False
            
            # Preparar dados do chat
            name = chat_data.get('name', phone)
            status = chat_data.get('status', 'online')
            last_message = chat_data.get('last_message', '')
            last_message_time = chat_data.get('last_message_time')
            unread_count = chat_data.get('unread_count', 0)
            is_pinned = chat_data.get('is_pinned', False)
            is_muted = chat_data.get('is_muted', False)
            
            # Converter timestamp se necessário
            if isinstance(last_message_time, str):
                try:
                    last_message_time = datetime.fromisoformat(last_message_time.replace('Z', '+00:00'))
                except:
                    last_message_time = datetime.now()
            elif not last_message_time:
                last_message_time = datetime.now()
            
            # Query UPSERT (INSERT ou UPDATE) - sem avatar_url
            upsert_query = """
                INSERT INTO whatsapp_chats (
                    phone, name, status, last_message, 
                    last_message_time, unread_count, is_pinned, is_muted, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (phone) DO UPDATE SET
                    name = EXCLUDED.name,
                    status = EXCLUDED.status,
                    last_message = EXCLUDED.last_message,
                    last_message_time = EXCLUDED.last_message_time,
                    unread_count = EXCLUDED.unread_count,
                    is_pinned = EXCLUDED.is_pinned,
                    is_muted = EXCLUDED.is_muted,
                    updated_at = CURRENT_TIMESTAMP
            """
            
            values = (
                phone, name, status, last_message,
                last_message_time, unread_count, is_pinned, is_muted
            )
            
            self.db_manager.execute_query(upsert_query, values)
            logger.info(f"✅ Chat salvo no PostgreSQL: {phone} ({name})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar chat {phone}: {e}")
            return False
    
    def save_message(self, message_data: Dict) -> bool:
        """
        Salva uma mensagem no banco PostgreSQL
        """
        try:
            if not self.db_manager:
                logger.warning("DB Manager não disponível para salvar mensagem")
                return False
            
            # Extrair dados da mensagem
            message_id = message_data.get('id') or message_data.get('message_id')
            chat_phone = message_data.get('phone') or message_data.get('chat_id')
            content = message_data.get('content') or message_data.get('message_text') or message_data.get('text', '')
            sender = message_data.get('sender') or message_data.get('notify_name') or chat_phone
            message_type = message_data.get('type', 'text')
            direction = 'sent' if message_data.get('from_me', False) else 'received'
            status = message_data.get('status', 'received')
            timestamp = message_data.get('timestamp')
            waha_data = message_data.get('waha_data', {})
            
            # Validações
            if not message_id or not chat_phone or not content:
                error_msg = f"Dados insuficientes para salvar mensagem - ID: {message_id}, Phone: {chat_phone}, Content: {bool(content)}"
                logger.error(error_msg)
                
                # Salvar erro para análise posterior (síncrono)
                self._save_failed_message_sync(message_data, error_msg)
                return False
            
            # Converter timestamp
            if isinstance(timestamp, str):
                try:
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                except:
                    timestamp = datetime.now()
            elif not timestamp:
                timestamp = datetime.now()
            
            # Garantir que o chat existe
            self.save_chat(chat_phone, {
                'name': sender,
                'last_message': content,
                'last_message_time': timestamp,
                'unread_count': 1 if direction == 'received' else 0
            })
            
            # Query INSERT com ON CONFLICT
            insert_query = """
                INSERT INTO whatsapp_messages (
                    message_id, chat_phone, content, sender, message_type,
                    direction, status, timestamp, waha_data, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (message_id) DO UPDATE SET
                    content = EXCLUDED.content,
                    sender = EXCLUDED.sender,
                    status = EXCLUDED.status,
                    updated_at = CURRENT_TIMESTAMP
            """
            
            values = (
                message_id, chat_phone, content, sender, message_type,
                direction, status, timestamp, json.dumps(waha_data)
            )
            
            self.db_manager.execute_query(insert_query, values)
            logger.info(f"✅ Mensagem salva no PostgreSQL: {chat_phone} - {content[:50]}...")
            
            # Atualizar informações do chat
            self.update_chat_last_message(chat_phone, content, timestamp, direction)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar mensagem: {e}")
            return False
    
    def update_chat_last_message(self, phone: str, message: str, timestamp: datetime, direction: str):
        """Atualiza última mensagem e contadores do chat"""
        try:
            if direction == 'received':
                # Incrementar unread_count para mensagens recebidas
                update_query = """
                    UPDATE whatsapp_chats 
                    SET last_message = %s, 
                        last_message_time = %s, 
                        unread_count = unread_count + 1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE phone = %s
                """
            else:
                # Não incrementar para mensagens enviadas
                update_query = """
                    UPDATE whatsapp_chats 
                    SET last_message = %s, 
                        last_message_time = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE phone = %s
                """
            
            self.db_manager.execute_query(update_query, (message, timestamp, phone))
            
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar última mensagem: {e}")
    
    def get_chats(self, limit: int = 100) -> List[Dict]:
        """
        Busca chats do banco PostgreSQL
        """
        try:
            if not self.db_manager:
                logger.warning("DB Manager não disponível para buscar chats")
                return []
            
            query = """
                 SELECT phone, name, last_message, last_message_time, 
                        unread_count, created_at, updated_at
                 FROM whatsapp_chats 
                 ORDER BY last_message_time DESC NULLS LAST
                 LIMIT %s
             """
            
            results = self.db_manager.fetch_all(query, (limit,))
            
            chats = []
            for row in results:
                chat = {
                    'phone': row[0],
                    'name': row[1] or row[0],  # Fallback para phone se name for None
                    'last_message': row[2] or 'Nova conversa',
                    'last_message_time': row[3].isoformat() if row[3] else datetime.now().isoformat(),
                    'unread_count': row[4] or 0,
                    'created_at': row[5].isoformat() if row[5] else None,
                    'updated_at': row[6].isoformat() if row[6] else None
                }
                chats.append(chat)
            
            logger.info(f"✅ {len(chats)} chats carregados do PostgreSQL")
            return chats
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar chats: {e}")
            return []
    
    def get_messages(self, phone: str, limit: int = 100, since: str = None) -> List[Dict]:
        """
        Busca mensagens de um chat específico
        """
        try:
            if not self.db_manager:
                logger.warning("DB Manager não disponível para buscar mensagens")
                return []
            
            # Base query
            query = """
                SELECT message_id, chat_phone, content, sender, message_type,
                       direction, status, timestamp, waha_data, created_at
                FROM whatsapp_messages 
                WHERE chat_phone = %s
            """
            params = [phone]
            
            # Filtro por data se fornecido
            if since:
                try:
                    since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
                    query += " AND timestamp > %s"
                    params.append(since_dt)
                except:
                    logger.warning(f"Formato de data inválido: {since}")
            
            query += " ORDER BY timestamp ASC LIMIT %s"
            params.append(limit)
            
            results = self.db_manager.fetch_all(query, params)
            
            messages = []
            for row in results:
                message = {
                    'id': row[0],
                    'phone': row[1],
                    'content': row[2],
                    'sender': row[3],
                    'type': row[4],
                    'direction': row[5],
                    'status': row[6],
                    'timestamp': row[7].isoformat() if row[7] else None,
                    'waha_data': json.loads(row[8]) if row[8] else {},
                    'created_at': row[9].isoformat() if row[9] else None
                }
                messages.append(message)
            
            logger.info(f"✅ {len(messages)} mensagens carregadas para {phone}")
            return messages
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar mensagens para {phone}: {e}")
            return []
    
    def mark_chat_as_read(self, phone: str) -> bool:
        """
        Marca um chat como lido (zera unread_count)
        """
        try:
            if not self.db_manager:
                return False
            
            update_query = """
                UPDATE whatsapp_chats 
                SET unread_count = 0, updated_at = CURRENT_TIMESTAMP
                WHERE phone = %s
            """
            
            self.db_manager.execute_query(update_query, (phone,))
            logger.info(f"✅ Chat {phone} marcado como lido")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao marcar chat como lido: {e}")
            return False
    
    def cleanup_old_messages(self, days: int = 15) -> int:
        """
        Remove mensagens antigas (mais de X dias)
        LEMBRETE: WhatsApp só deve manter mensagens dos últimos 15 dias!
        """
        try:
            if not self.db_manager:
                logger.warning("🧹 Limpeza cancelada: DB Manager não disponível")
                return 0
            
            cutoff_date = datetime.now() - timedelta(days=days)
            logger.info(f"🧹 Iniciando limpeza automática WhatsApp: removendo mensagens anteriores a {cutoff_date.strftime('%d/%m/%Y %H:%M')}")
            
            # Contar mensagens que serão removidas
            count_query = """
                SELECT COUNT(*) FROM whatsapp_messages 
                WHERE timestamp < %s
            """
            count_result = self.db_manager.fetch_all(count_query, (cutoff_date,))
            count = count_result[0][0] if count_result else 0
            
            # Contar chats que serão afetados
            chats_query = """
                SELECT COUNT(DISTINCT chat_phone) FROM whatsapp_messages 
                WHERE timestamp < %s
            """
            chats_result = self.db_manager.fetch_all(chats_query, (cutoff_date,))
            affected_chats = chats_result[0][0] if chats_result else 0
            
            if count > 0:
                logger.info(f"🧹 Encontradas {count} mensagens antigas em {affected_chats} chats para remoção")
                
                # Remover mensagens antigas
                delete_query = """
                    DELETE FROM whatsapp_messages 
                    WHERE timestamp < %s
                """
                self.db_manager.execute_query(delete_query, (cutoff_date,))
                logger.info(f"🗑️ {count} mensagens antigas removidas do PostgreSQL")
                
                # Contar chats órfãos (sem mensagens)
                orphan_chats_query = """
                    SELECT COUNT(*) FROM whatsapp_chats 
                    WHERE phone NOT IN (
                        SELECT DISTINCT chat_phone FROM whatsapp_messages
                    )
                """
                orphan_result = self.db_manager.fetch_all(orphan_chats_query)
                orphan_count = orphan_result[0][0] if orphan_result else 0
                
                if orphan_count > 0:
                    # Remover chats sem mensagens
                    cleanup_chats_query = """
                        DELETE FROM whatsapp_chats 
                        WHERE phone NOT IN (
                            SELECT DISTINCT chat_phone FROM whatsapp_messages
                        )
                    """
                    self.db_manager.execute_query(cleanup_chats_query)
                    logger.info(f"🗑️ {orphan_count} chats órfãos removidos do PostgreSQL")
                
                logger.info(f"✅ Limpeza concluída: {count} mensagens + {orphan_count} chats removidos (>{days} dias)")
            else:
                logger.info(f"✅ Limpeza desnecessária: nenhuma mensagem com mais de {days} dias encontrada")
            
            return count
            
        except Exception as e:
            logger.error(f"❌ Erro na limpeza automática WhatsApp: {e}")
            return 0
    
    def get_stats(self) -> Dict:
        """
        Retorna estatísticas do sistema
        """
        try:
            if not self.db_manager:
                return {'total_chats': 0, 'total_messages': 0}
            
            # Contar chats
            chats_query = "SELECT COUNT(*) FROM whatsapp_chats"
            chats_result = self.db_manager.fetch_all(chats_query)
            total_chats = chats_result[0][0] if chats_result else 0
            
            # Contar mensagens
            messages_query = "SELECT COUNT(*) FROM whatsapp_messages"
            messages_result = self.db_manager.fetch_all(messages_query)
            total_messages = messages_result[0][0] if messages_result else 0
            
            # Mensagens por direção
            direction_query = """
                SELECT direction, COUNT(*) 
                FROM whatsapp_messages 
                GROUP BY direction
            """
            direction_result = self.db_manager.fetch_all(direction_query)
            direction_stats = {row[0]: row[1] for row in direction_result}
            
            return {
                'total_chats': total_chats,
                'total_messages': total_messages,
                'messages_sent': direction_stats.get('sent', 0),
                'messages_received': direction_stats.get('received', 0),
                'last_update': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter estatísticas: {e}")
            return {'total_chats': 0, 'total_messages': 0, 'error': str(e)}

    def _save_failed_message_sync(self, message_data: Dict, error_msg: str):
        """Salvar mensagem que falhou para análise posterior (versão síncrona)"""
        try:
            if not self.db_manager:
                return
            
            # Criar tabela de mensagens falhadas se não existir
            create_failed_table = """
                CREATE TABLE IF NOT EXISTS whatsapp_failed_messages (
                    id SERIAL PRIMARY KEY,
                    message_data JSON NOT NULL,
                    error_message TEXT NOT NULL,
                    failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    retry_count INTEGER DEFAULT 0
                )
            """
            self.db_manager.execute_query(create_failed_table)
            
            # Inserir mensagem falhada
            insert_query = """
                INSERT INTO whatsapp_failed_messages (message_data, error_message)
                VALUES (%s, %s)
            """
            self.db_manager.execute_query(
                insert_query, 
                (json.dumps(message_data), error_msg)
            )
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar mensagem falhada: {e}")

    async def _save_failed_message(self, message_data: Dict, error_msg: str):
        """Salvar mensagem que falhou para análise posterior (versão assíncrona)"""
        self._save_failed_message_sync(message_data, error_msg)

    def retry_failed_messages(self, limit: int = 10) -> int:
        """Tentar reprocessar mensagens que falharam"""
        try:
            if not self.db_manager:
                return 0
            
            # Buscar mensagens falhadas
            query = """
                SELECT id, message_data 
                FROM whatsapp_failed_messages 
                WHERE retry_count < 3 
                ORDER BY failed_at ASC 
                LIMIT %s
            """
            failed_messages = self.db_manager.fetch_all(query, (limit,))
            
            retry_count = 0
            for row in failed_messages:
                failed_id, message_data_json = row
                
                try:
                    message_data = json.loads(message_data_json)
                    success = self.save_message(message_data)
                    
                    if success:
                        # Remover da tabela de falhadas
                        self.db_manager.execute_query(
                            "DELETE FROM whatsapp_failed_messages WHERE id = %s",
                            (failed_id,)
                        )
                        retry_count += 1
                    else:
                        # Incrementar contador de retry
                        self.db_manager.execute_query(
                            "UPDATE whatsapp_failed_messages SET retry_count = retry_count + 1 WHERE id = %s",
                            (failed_id,)
                        )
                        
                except Exception as e:
                    logger.error(f"❌ Erro ao reprocessar mensagem {failed_id}: {e}")
            
            return retry_count
            
        except Exception as e:
            logger.error(f"❌ Erro ao reprocessar mensagens falhadas: {e}")
            return 0

# Instância global do serviço
whatsapp_persistence = WhatsAppPersistenceService()
