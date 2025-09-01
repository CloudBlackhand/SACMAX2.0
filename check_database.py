#!/usr/bin/env python3
"""
Script para verificar o banco de dados PostgreSQL
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor

def check_database():
    """Verificar banco de dados"""
    try:
        # Tentar DATABASE_URL primeiro, depois DATABASE_PUBLIC_URL
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            database_url = os.environ.get('DATABASE_PUBLIC_URL')
        
        if not database_url:
            # Usar URL hardcoded do Railway (que vimos nas variáveis)
            database_url = "postgresql://postgres:MbVOkkTYrVOlJXGTKiVHGVOfCjaixYdv@nozomi.proxy.rlwy.net:49949/railway"
            print("🔗 Usando URL do Railway PostgreSQL")
        
        print(f"🔗 Conectando via: {database_url[:50]}...")
        
        # Conectar ao banco
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("✅ Conectado ao banco PostgreSQL")
        
        # Verificar tabelas
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"\n📋 Tabelas encontradas ({len(tables)}):")
        for table in tables:
            print(f"  - {table['table_name']}")
        
        # Verificar se tabela produtividade existe
        produtividade_exists = any(table['table_name'] == 'produtividade' for table in tables)
        
        if produtividade_exists:
            print("\n✅ Tabela 'produtividade' encontrada!")
            
            # Verificar estrutura da tabela
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'produtividade'
                ORDER BY ordinal_position
            """)
            
            columns = cursor.fetchall()
            print(f"\n📊 Estrutura da tabela 'produtividade' ({len(columns)} colunas):")
            for col in columns:
                nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
                print(f"  - {col['column_name']}: {col['data_type']} ({nullable})")
            
            # Verificar quantidade de registros
            cursor.execute("SELECT COUNT(*) as total FROM produtividade")
            count_result = cursor.fetchone()
            total_records = count_result['total']
            
            print(f"\n📈 Total de registros na tabela 'produtividade': {total_records}")
            
            if total_records > 0:
                # Mostrar alguns registros de exemplo
                cursor.execute("SELECT * FROM produtividade LIMIT 3")
                sample_records = cursor.fetchall()
                
                print(f"\n📝 Exemplo de registros (primeiros 3):")
                for i, record in enumerate(sample_records, 1):
                    print(f"\n  Registro {i}:")
                    for key, value in record.items():
                        print(f"    {key}: {value}")
            else:
                print("\n⚠️ Tabela 'produtividade' está vazia!")
        else:
            print("\n❌ Tabela 'produtividade' NÃO encontrada!")
            print("💡 Execute o script create_table.py para criar a tabela")
        
        cursor.close()
        conn.close()
        print("\n✅ Verificação concluída")
        
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")

if __name__ == "__main__":
    check_database()
