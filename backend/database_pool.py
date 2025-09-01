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
            if 'dsn' in connection_params:
                # Usar DSN (DATABASE_URL ou DATABASE_PUBLIC_URL)
                self.pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn=self.min_connections,
                    maxconn=self.max_connections,
                    dsn=connection_params['dsn'],
                    cursor_factory=RealDictCursor
                )
            else:
                # Usar parâmetros individuais
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
        # Priorizar DATABASE_URL do Railway (conexão interna)
        database_url = os.environ.get('DATABASE_URL')
        if database_url:
            logger.info("🔗 Usando DATABASE_URL para conexão interna")
            return {'dsn': database_url}
        
        # Fallback para DATABASE_PUBLIC_URL (conexão externa)
        database_public_url = os.environ.get('DATABASE_PUBLIC_URL')
        if database_public_url:
            logger.info("🔗 Usando DATABASE_PUBLIC_URL para conexão externa")
            return {'dsn': database_public_url}
        
        # Fallback para parâmetros individuais
        if os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('PGHOST'):
            logger.info("🔗 Usando parâmetros individuais do Railway")
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
            logger.info("🔗 Usando parâmetros locais")
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
        """Obter conexão do pool com gerenciamento automático e retry"""
        conn = None
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                if not self.pool:
                    logger.info(f"Pool não existe, tentando reconectar (tentativa {retry_count + 1})")
                    self._reconnect()
                
                if self.pool:
                    try:
                        conn = self.pool.getconn()
                        if conn:
                            # Verificar se conexão está ativa
                            if not self._is_connection_alive(conn):
                                logger.warning("Conexão morta detectada, obtendo nova")
                                self.pool.putconn(conn, close=True)
                                conn = self.pool.getconn()
                            
                            if conn and self._is_connection_alive(conn):
                                yield conn
                                return
                            else:
                                raise Exception("Conexão obtida não está funcionando")
                        else:
                            raise Exception("Pool retornou conexão None")
                    except Exception as pool_error:
                        logger.error(f"Erro ao obter conexão do pool: {pool_error}")
                        raise pool_error
                else:
                    raise Exception("Pool de conexões não foi criado")
                    
            except Exception as e:
                retry_count += 1
                logger.error(f"Erro na tentativa {retry_count}: {e}")
                
                if retry_count >= max_retries:
                    logger.error(f"Falha após {max_retries} tentativas")
                    raise Exception(f"Falha ao obter conexão após {max_retries} tentativas: {e}")
                
                # Aguardar antes de tentar novamente
                import time
                time.sleep(1 * retry_count)  # Backoff exponencial
                
        finally:
            if conn and self.pool:
                try:
                    self.pool.putconn(conn)
                except Exception as e:
                    logger.error(f"Erro ao retornar conexão ao pool: {e}")
    
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
                if 'dsn' in self.connection_params:
                    # Usar DSN (DATABASE_URL ou DATABASE_PUBLIC_URL)
                    self.pool = psycopg2.pool.ThreadedConnectionPool(
                        minconn=self.min_connections,
                        maxconn=self.max_connections,
                        dsn=self.connection_params['dsn'],
                        cursor_factory=RealDictCursor
                    )
                else:
                    # Usar parâmetros individuais
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
