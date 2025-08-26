#!/usr/bin/env python3
"""
Configuração do banco de dados PostgreSQL do Railway
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# URL do banco PostgreSQL do Railway (atualizada com as credenciais corretas)
DATABASE_URL = "postgresql://postgres:MbVOkkTYrVOlJXGTKiVHGVOfCjaixYdv@nozomi.proxy.rlwy.net:49949/railway"

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.cursor = None
    
    def connect(self):
        """Conecta ao banco de dados PostgreSQL"""
        try:
            self.connection = psycopg2.connect(DATABASE_URL)
            self.connection.autocommit = True
            self.cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            logger.info("✅ Conectado ao banco PostgreSQL do Railway")
            return True
        except Exception as e:
            logger.error(f"❌ Erro ao conectar ao banco: {e}")
            return False
    
    def disconnect(self):
        """Desconecta do banco de dados"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            logger.info("🔌 Desconectado do banco PostgreSQL")
    
    def execute_query(self, query, params=None):
        """Executa uma query SQL"""
        try:
            if not self.connection:
                self.connect()
            self.cursor.execute(query, params)
            return self.cursor.fetchall()
        except Exception as e:
            logger.error(f"❌ Erro ao executar query: {e}")
            return []
    
    def get_table_data(self, table_name, limit=100):
        """Obtém dados de uma tabela específica"""
        query = f"SELECT * FROM {table_name} LIMIT %s"
        return self.execute_query(query, (limit,))
    
    def get_tables(self):
        """Lista todas as tabelas do banco"""
        query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """
        return self.execute_query(query)
    
    def get_table_count(self, table_name):
        """Obtém o número de registros em uma tabela"""
        query = f"SELECT COUNT(*) as count FROM {table_name}"
        result = self.execute_query(query)
        return result[0]['count'] if result else 0

# Instância global do gerenciador de banco
db_manager = DatabaseManager()

def get_db_connection():
    """Obtém uma conexão direta com o banco de dados"""
    try:
        connection = psycopg2.connect(DATABASE_URL)
        connection.autocommit = True
        return connection
    except Exception as e:
        logger.error(f"❌ Erro ao obter conexão com banco: {e}")
        return None

def init_database():
    """Inicializa a conexão com o banco"""
    return db_manager.connect()

def close_database():
    """Fecha a conexão com o banco"""
    db_manager.disconnect()

def get_database_info():
    """Obtém informações do banco de dados"""
    try:
        tables = db_manager.get_tables()
        table_info = []
        
        for table in tables:
            table_name = table['table_name']
            count = db_manager.get_table_count(table_name)
            table_info.append({
                'name': table_name,
                'count': count
            })
        
        return {
            'connected': db_manager.connection is not None,
            'tables': table_info,
            'total_tables': len(tables)
        }
    except Exception as e:
        logger.error(f"❌ Erro ao obter informações do banco: {e}")
        return {
            'connected': False,
            'tables': [],
            'total_tables': 0,
            'error': str(e)
        }

