#!/usr/bin/env python3
"""
Configuração de banco de dados PostgreSQL para Railway
"""

import psycopg2
import os
import logging
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Gerenciador de conexão com banco de dados"""
    
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def connect(self):
        """Conectar ao banco de dados"""
        try:
            self.connection = get_db_connection()
            self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            logger.info("✅ DatabaseManager conectado com sucesso")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao conectar DatabaseManager: {e}")
            return False
    
    def disconnect(self):
        """Desconectar do banco de dados"""
        try:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
            logger.info("🔌 DatabaseManager desconectado")
        except Exception as e:
            logger.error(f"❌ Erro ao desconectar DatabaseManager: {e}")
    
    def is_connected(self):
        """Verificar se está conectado"""
        try:
            if self.connection and not self.connection.closed:
                # Testar conexão
                self.cursor.execute("SELECT 1")
                return True
            return False
        except Exception:
            return False
    
    def execute_query(self, query, params=None):
        """Executar query"""
        try:
            if not self.connection or self.connection.closed:
                self.connect()
            
            self.cursor.execute(query, params)
            
            if query.strip().upper().startswith('SELECT'):
                return self.cursor.fetchall()
            else:
                self.connection.commit()
                return True
        except Exception as e:
            logger.error(f"❌ Erro ao executar query: {e}")
            raise e
    
    def fetch_all(self, query, params=None):
        """Buscar todos os resultados"""
        try:
            if not self.connection or self.connection.closed:
                self.connect()
            
            self.cursor.execute(query, params)
            return self.cursor.fetchall()
        except Exception as e:
            logger.error(f"❌ Erro ao buscar dados: {e}")
            raise e

def get_db_connection():
    """Obter conexão com banco PostgreSQL do Railway"""
    try:
        # Priorizar DATABASE_URL do Railway (conexão interna)
        database_url = os.environ.get('DATABASE_URL')
        if database_url:
            conn = psycopg2.connect(database_url)
            logger.info("✅ Conectado ao banco PostgreSQL do Railway via DATABASE_URL")
            return conn
        
        # Fallback para DATABASE_PUBLIC_URL (conexão externa)
        database_public_url = os.environ.get('DATABASE_PUBLIC_URL')
        if database_public_url:
            conn = psycopg2.connect(database_public_url)
            logger.info("✅ Conectado ao banco PostgreSQL do Railway via DATABASE_PUBLIC_URL")
            return conn
        
        # Fallback para parâmetros individuais
        connection_params = {
            'host': os.environ.get('PGHOST', 'localhost'),
            'port': os.environ.get('PGPORT', '5432'),
            'database': os.environ.get('PGDATABASE', 'railway'),
            'user': os.environ.get('PGUSER', 'postgres'),
            'password': os.environ.get('PGPASSWORD', ''),
            'sslmode': 'require' if os.environ.get('RAILWAY_ENVIRONMENT') else 'disable'
        }
        
        conn = psycopg2.connect(**connection_params)
        logger.info("✅ Conectado ao banco PostgreSQL via parâmetros individuais")
        return conn
        
    except Exception as e:
        # Fallback para URL hardcoded do Railway (desenvolvimento local)
        try:
            railway_url = "postgresql://postgres:MbVOkkTYrVOlJXGTKiVHGVOfCjaixYdv@nozomi.proxy.rlwy.net:49949/railway"
            conn = psycopg2.connect(railway_url)
            logger.info("✅ Conectado ao banco PostgreSQL do Railway via URL hardcoded")
            return conn
        except Exception as e2:
            logger.error(f"❌ Erro ao conectar ao banco: {e}")
            logger.error(f"❌ Erro no fallback: {e2}")
            raise e

def test_connection():
    """Testar conexão com banco"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result[0] == 1
    except Exception as e:
        logger.error(f"❌ Teste de conexão falhou: {e}")
        return False

def init_database():
    """Inicializar banco de dados"""
    db_manager = DatabaseManager()
    if db_manager.connect():
        return db_manager
    return None

def close_database(db_manager):
    """Fechar conexão com banco de dados"""
    if db_manager:
        db_manager.disconnect()

# Instância global do db_manager (será inicializada quando necessário)
db_manager = None

def get_db_manager():
    """Obter instância do db_manager, inicializando se necessário"""
    global db_manager
    if db_manager is None:
        db_manager = init_database()
    return db_manager

