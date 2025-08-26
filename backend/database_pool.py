#!/usr/bin/env python3
"""
Pool de Conexões PostgreSQL para SacsMax
Mantém conexões persistentes para alta responsividade
"""

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
import os
import logging
import threading
import time
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class DatabasePool:
    """Pool de conexões PostgreSQL com reconexão automática"""
    
    def __init__(self, min_connections=5, max_connections=20):
        self.min_connections = min_connections
        self.max_connections = max_connections
        self.pool = None
        self.connection_params = None
        self.lock = threading.Lock()
        self.last_health_check = 0
        self.health_check_interval = 30  # segundos
        
    def initialize(self, connection_params):
        """Inicializar pool de conexões"""
        try:
            self.connection_params = connection_params
            
            # Criar pool de conexões
            self.pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=self.min_connections,
                maxconn=self.max_connections,
                **connection_params,
                cursor_factory=RealDictCursor
            )
            
            logger.info(f"✅ Pool de conexões PostgreSQL inicializado ({self.min_connections}-{self.max_connections} conexões)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar pool de conexões: {e}")
            return False
    
    def get_connection_params(self):
        """Obter parâmetros de conexão do Railway"""
        # Verificar se estamos no Railway
        if os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('PGHOST'):
            return {
                'host': os.environ.get('PGHOST', 'localhost'),
                'port': os.environ.get('PGPORT', '5432'),
                'database': os.environ.get('PGDATABASE', 'railway'),
                'user': os.environ.get('PGUSER', 'postgres'),
                'password': os.environ.get('PGPASSWORD', ''),
                'sslmode': 'require'
            }
        else:
            # Fallback para desenvolvimento local
            return {
                'host': 'localhost',
                'port': '5432',
                'database': 'railway',
                'user': 'postgres',
                'password': '',
                'sslmode': 'disable'
            }
    
    @contextmanager
    def get_connection(self):
        """Obter conexão do pool com gerenciamento automático"""
        conn = None
        try:
            if not self.pool:
                # Tentar reconectar se pool não existe
                self._reconnect()
            
            if self.pool:
                conn = self.pool.getconn()
                if conn:
                    # Verificar se conexão está ativa
                    if not self._is_connection_alive(conn):
                        self.pool.putconn(conn, close=True)
                        conn = self.pool.getconn()
                    
                    yield conn
                else:
                    raise Exception("Não foi possível obter conexão do pool")
            else:
                raise Exception("Pool de conexões não disponível")
                
        except Exception as e:
            logger.error(f"Erro ao obter conexão: {e}")
            # Tentar reconectar
            self._reconnect()
            raise e
        finally:
            if conn and self.pool:
                self.pool.putconn(conn)
    
    def _is_connection_alive(self, conn):
        """Verificar se conexão está ativa"""
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            return True
        except:
            return False
    
    def _reconnect(self):
        """Reconectar pool de conexões"""
        with self.lock:
            try:
                logger.info("🔄 Reconectando pool de conexões...")
                
                # Fechar pool existente
                if self.pool:
                    self.pool.closeall()
                
                # Obter parâmetros de conexão
                if not self.connection_params:
                    self.connection_params = self.get_connection_params()
                
                # Recriar pool
                self.pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=self.min_connections,
                    maxconn=self.max_connections,
                    **self.connection_params,
                    cursor_factory=RealDictCursor
                )
                
                logger.info("✅ Pool de conexões reconectado com sucesso")
                
            except Exception as e:
                logger.error(f"❌ Erro ao reconectar pool: {e}")
                self.pool = None
    
    def health_check(self):
        """Verificar saúde do pool de conexões"""
        current_time = time.time()
        
        # Verificar apenas a cada intervalo
        if current_time - self.last_health_check < self.health_check_interval:
            return True
        
        self.last_health_check = current_time
        
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT 1")
                cursor.fetchone()
                cursor.close()
                return True
        except Exception as e:
            logger.warning(f"⚠️ Health check falhou: {e}")
            self._reconnect()
            return False
    
    def execute_query(self, query, params=None):
        """Executar query com conexão do pool"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(query, params)
                
                if query.strip().upper().startswith('SELECT'):
                    result = cursor.fetchall()
                    cursor.close()
                    return result
                else:
                    conn.commit()
                    cursor.close()
                    return True
                    
        except Exception as e:
            logger.error(f"Erro ao executar query: {e}")
            raise e
    
    def execute_many(self, query, params_list):
        """Executar múltiplas queries com conexão do pool"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.executemany(query, params_list)
                conn.commit()
                cursor.close()
                return True
        except Exception as e:
            logger.error(f"Erro ao executar múltiplas queries: {e}")
            raise e
    
    def close(self):
        """Fechar pool de conexões"""
        if self.pool:
            self.pool.closeall()
            logger.info("🔌 Pool de conexões fechado")

# Instância global do pool
db_pool = DatabasePool()

def get_db_pool():
    """Obter instância global do pool"""
    return db_pool

def init_database_pool():
    """Inicializar pool de conexões"""
    connection_params = db_pool.get_connection_params()
    return db_pool.initialize(connection_params)

def close_database_pool():
    """Fechar pool de conexões"""
    db_pool.close()
