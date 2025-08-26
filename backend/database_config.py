#!/usr/bin/env python3
"""
Configuração de banco de dados PostgreSQL para Railway
"""

import psycopg2
import os
import logging

logger = logging.getLogger(__name__)

def get_db_connection():
    """Obter conexão com banco PostgreSQL do Railway"""
    try:
        # Parâmetros de conexão do Railway
        connection_params = {
            'host': os.environ.get('PGHOST', 'localhost'),
            'port': os.environ.get('PGPORT', '5432'),
            'database': os.environ.get('PGDATABASE', 'railway'),
            'user': os.environ.get('PGUSER', 'postgres'),
            'password': os.environ.get('PGPASSWORD', ''),
            'sslmode': 'require' if os.environ.get('RAILWAY_ENVIRONMENT') else 'disable'
        }
        
        # Criar conexão
        conn = psycopg2.connect(**connection_params)
        logger.info("✅ Conectado ao banco PostgreSQL do Railway")
        return conn
        
    except Exception as e:
        logger.error(f"❌ Erro ao conectar ao banco: {e}")
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

