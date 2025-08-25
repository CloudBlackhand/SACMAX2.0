#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simples para testar conexão com Railway PostgreSQL
e inserir alguns registros de exemplo na tabela produtividade
"""

import os
import psycopg2
from datetime import datetime

def conectar_railway_postgres():
    """Conecta ao PostgreSQL do Railway usando variáveis de ambiente"""
    try:
        # Usar a URL pública do Railway
        database_url = os.getenv('DATABASE_PUBLIC_URL')
        if database_url:
            conn = psycopg2.connect(database_url)
        else:
            # Fallback para variáveis individuais
            conn = psycopg2.connect(
                host=os.getenv('PGHOST', 'postgres.railway.internal'),
                port=os.getenv('PGPORT', '5432'),
                database=os.getenv('PGDATABASE', 'railway'),
                user=os.getenv('PGUSER', 'postgres'),
                password=os.getenv('PGPASSWORD', '')
            )
        print("✅ Conectado ao PostgreSQL do Railway com sucesso!")
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar ao PostgreSQL: {e}")
        return None

def inserir_dados_exemplo(conn):
    """Insere alguns registros de exemplo na tabela produtividade"""
    try:
        cursor = conn.cursor()
        
        # Dados de exemplo
        dados_exemplo = [
            ('2025-08-01', 'Izaque Eduardo Do Nascimento', 'ATIVACAO', 'SA-1196135', '115.671.916-06', 'Adriane Mendes Rocha', 'Rua Campinas 541 Cosmopolis-SP 13150140', None, '19999278645', None, 'FINALIZADO', None),
            ('2025-08-01', 'Izaque Eduardo Do Nascimento', 'ATIVACAO', 'SA-1194321', '567.747.375-87', 'Dilma Sacramento Santos Moura', 'Rua Poerio Adolpho Tavano 114 Cosmopolis-SP 13157534', None, '19971725757', None, 'FINALIZADO', None),
            ('2025-08-01', 'Henrique Souza Lima', 'ATIVACAO', 'SA-1195244', '460.618.188-58', 'livia garcia dilio', 'Rua do Cobre 186 Santa Barbara DOeste-SP 13456430', None, '19987067938', None, 'FINALIZADO', None),
            ('2025-08-01', 'Henrique Souza Lima', 'ATIVACAO', 'SA-1197737', '547.327.458-73', 'Vitor henrique faray', 'Rua Aladino Selmi 555 Cosmopolis-SP 13155462', None, '19971595972', None, 'FINALIZADO', None),
            ('2025-08-01', 'DANIEL', 'ATIVACAO', 'SA-1195263', '028.731.598-39', 'Claudio Bianchini', 'Rua Jose Neves Souza Junior 686 Mogi Mirim-SP 13803755', None, '11987413302', None, 'FINALIZADO', None)
        ]
        
        # Inserir dados
        for dados in dados_exemplo:
            cursor.execute("""
                INSERT INTO produtividade (data, tecnico, "serviÇo", sa, documento, nome_cliente, "endereÇo", telefone1, telefone2, plano, status, obs)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, dados)
        
        conn.commit()
        print(f"✅ {len(dados_exemplo)} registros de exemplo inseridos com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao inserir dados: {e}")
        conn.rollback()
        return False

def verificar_dados(conn):
    """Verifica se os dados foram inseridos corretamente"""
    try:
        cursor = conn.cursor()
        
        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM produtividade;")
        total = cursor.fetchone()[0]
        
        # Verificar técnicos únicos
        cursor.execute("SELECT DISTINCT tecnico FROM produtividade LIMIT 5;")
        tecnicos = [row[0] for row in cursor.fetchall()]
        
        # Verificar status únicos
        cursor.execute("SELECT DISTINCT status FROM produtividade;")
        status = [row[0] for row in cursor.fetchall()]
        
        print(f"\n📊 Verificação dos dados:")
        print(f"   Total de registros: {total}")
        print(f"   Técnicos únicos: {len(tecnicos)}")
        print(f"   Status únicos: {status}")
        
        # Mostrar alguns registros
        cursor.execute("SELECT tecnico, \"serviÇo\", status FROM produtividade LIMIT 3;")
        registros = cursor.fetchall()
        print(f"\n📋 Primeiros registros:")
        for reg in registros:
            print(f"   - {reg[0]} | {reg[1]} | {reg[2]}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar dados: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Testando conexão com Railway PostgreSQL...")
    
    # Conectar ao PostgreSQL
    conn = conectar_railway_postgres()
    if not conn:
        return
    
    try:
        # Inserir dados de exemplo
        if not inserir_dados_exemplo(conn):
            return
        
        # Verificar dados
        verificar_dados(conn)
        
        print("\n🎉 Teste concluído com sucesso!")
        print("📋 A tabela produtividade está funcionando no Railway.")
        
    except Exception as e:
        print(f"❌ Erro durante o teste: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
