#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simples para criar a tabela produtividade no Railway
"""

import psycopg2
from database_config import get_db_connection

def criar_tabela_produtividade():
    """Cria a tabela produtividade no PostgreSQL"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Ler o arquivo SQL
        with open('create_produtividade_table.sql', 'r', encoding='utf-8') as f:
            sql = f.read()
        
        # Executar o SQL
        cursor.execute(sql)
        conn.commit()
        
        print("✅ Tabela produtividade criada com sucesso!")
        
        # Verificar se foi criada
        cursor.execute("SELECT COUNT(*) FROM produtividade")
        count = cursor.fetchone()[0]
        print(f"📊 Registros na tabela: {count}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Erro ao criar tabela: {e}")

if __name__ == "__main__":
    print("🚀 Criando tabela produtividade no Railway...")
    criar_tabela_produtividade()
