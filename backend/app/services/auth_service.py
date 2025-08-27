#!/usr/bin/env python3
"""
Serviço de Autenticação Simples
"""

import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db_manager=None):
        self.db_manager = db_manager
        
    def create_session_token(self) -> str:
        """Cria um token de sessão simples"""
        return secrets.token_urlsafe(32)
        
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Autentica usuário com senha simples"""
        try:
            if not self.db_manager:
                logger.error("DB Manager não disponível")
                return None
                
            query = """
            SELECT id, username, password, full_name, email, role
            FROM users 
            WHERE username = %s AND password = %s
            """
            
            result = self.db_manager.fetch_one(query, (username, password))
            
            if result:
                user_data = {
                    'id': result[0],
                    'username': result[1],
                    'full_name': result[3],
                    'email': result[4],
                    'role': result[5]
                }
                logger.info(f"✅ Usuário autenticado: {username}")
                return user_data
            else:
                logger.warning(f"❌ Falha na autenticação: {username}")
                return None
                
        except Exception as e:
            logger.error(f"Erro na autenticação: {e}")
            return None
            
    def create_session(self, user_id: int) -> Optional[str]:
        """Cria uma sessão para o usuário"""
        try:
            if not self.db_manager:
                return None
                
            session_token = self.create_session_token()
            expires_at = datetime.now() + timedelta(hours=24)  # 24 horas
            
            query = """
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (%s, %s, %s)
            """
            
            self.db_manager.execute_query(query, (user_id, session_token, expires_at))
            logger.info(f"✅ Sessão criada para usuário {user_id}")
            return session_token
            
        except Exception as e:
            logger.error(f"Erro ao criar sessão: {e}")
            return None
            
    def validate_session(self, session_token: str) -> Optional[Dict]:
        """Valida uma sessão"""
        try:
            if not self.db_manager:
                return None
                
            query = """
            SELECT us.user_id, u.username, u.full_name, u.role
            FROM user_sessions us
            JOIN users u ON us.user_id = u.id
            WHERE us.session_token = %s AND us.expires_at > NOW()
            """
            
            result = self.db_manager.fetch_one(query, (session_token,))
            
            if result:
                user_data = {
                    'user_id': result[0],
                    'username': result[1],
                    'full_name': result[2],
                    'role': result[3]
                }
                return user_data
            else:
                return None
                
        except Exception as e:
            logger.error(f"Erro ao validar sessão: {e}")
            return None
            
    def logout(self, session_token: str) -> bool:
        """Remove uma sessão"""
        try:
            if not self.db_manager:
                return False
                
            query = "DELETE FROM user_sessions WHERE session_token = %s"
            self.db_manager.execute_query(query, (session_token,))
            logger.info("✅ Sessão removida")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao fazer logout: {e}")
            return False
