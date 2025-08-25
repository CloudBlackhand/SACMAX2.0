#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para conectar ao PostgreSQL do Railway e executar script SQL
Deploy da tabela de produtividade no Railway
"""

import os
import psycopg2
import re
from datetime import datetime

def corrigir_caracteres_especiais(texto):
    """Corrige caracteres especiais para compatibilidade com banco de dados"""
    substituicoes = {
        'ç': 'c', 'Ç': 'C',
        'ã': 'a', 'Ã': 'A',
        'õ': 'o', 'Õ': 'O',
        'á': 'a', 'Á': 'A',
        'à': 'a', 'À': 'A',
        'â': 'a', 'Â': 'A',
        'é': 'e', 'É': 'E',
        'è': 'e', 'È': 'E',
        'ê': 'e', 'Ê': 'E',
        'í': 'i', 'Í': 'I',
        'ì': 'i', 'Ì': 'I',
        'î': 'i', 'Î': 'I',
        'ó': 'o', 'Ó': 'O',
        'ò': 'o', 'Ò': 'O',
        'ô': 'o', 'Ô': 'O',
        'ú': 'u', 'Ú': 'U',
        'ù': 'u', 'Ù': 'U',
        'û': 'u', 'Û': 'U',
        'ñ': 'n', 'Ñ': 'N',
        'ü': 'u', 'Ü': 'U',
        'º': 'o', 'ª': 'a',
        '°': 'o',
        '–': '-', '—': '-',
        '"': '"', '"': '"',
        ''': "'", ''': "'",
        '…': '...',
        '®': '(R)',
        '©': '(C)',
        '™': '(TM)'
    }
    
    for especial, normal in substituicoes.items():
        texto = texto.replace(especial, normal)
    
    return texto

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

def criar_tabela_produtividade(conn):
    """Cria a tabela de produtividade no PostgreSQL"""
    try:
        cursor = conn.cursor()
        
        # Verificar se a tabela já existe
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'produtividade'
            );
        """)
        
        tabela_existe = cursor.fetchone()[0]
        
        if tabela_existe:
            print("ℹ️ Tabela produtividade já existe. Verificando estrutura...")
            
            # Verificar se as colunas necessárias existem
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'produtividade' 
                AND table_schema = 'public';
            """)
            
            colunas_existentes = [row[0] for row in cursor.fetchall()]
            print(f"Colunas existentes: {colunas_existentes}")
            
            # Se a tabela já tem a estrutura correta, apenas criar índices
            colunas_necessarias = ['data', 'tecnico', 'serviÇo', 'sa', 'documento', 'nome_cliente', 'endereÇo', 'telefone1', 'telefone2', 'plano', 'status', 'obs']
            
            if all(col in colunas_existentes for col in colunas_necessarias):
                print("✅ Estrutura da tabela está correta!")
            else:
                print("⚠️ Estrutura da tabela precisa ser atualizada...")
                # Aqui você pode adicionar lógica para alterar a tabela se necessário
                return False
        else:
            print("📋 Criando nova tabela produtividade...")
            # Script para criar a tabela
            create_table_sql = """
            CREATE TABLE produtividade (
                id SERIAL PRIMARY KEY,
                data DATE,
                tecnico TEXT,
                servico TEXT,
                sa TEXT,
                documento TEXT,
                nome_cliente TEXT,
                endereco TEXT,
                telefone1 TEXT,
                telefone2 TEXT,
                plano TEXT,
                status TEXT,
                obs TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
            
            cursor.execute(create_table_sql)
            print("✅ Tabela produtividade criada com sucesso!")
        
        # Criar índices (se não existirem)
        indices_sql = [
            "CREATE INDEX IF NOT EXISTS idx_produtividade_data ON produtividade(data);",
            "CREATE INDEX IF NOT EXISTS idx_produtividade_tecnico ON produtividade(tecnico);",
            "CREATE INDEX IF NOT EXISTS idx_produtividade_status ON produtividade(status);",
            "CREATE INDEX IF NOT EXISTS idx_produtividade_servico ON produtividade(\"serviÇo\");"
        ]
        
        for index_sql in indices_sql:
            cursor.execute(index_sql)
        
        conn.commit()
        print("✅ Índices criados/verificados com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao criar/verificar tabela: {e}")
        conn.rollback()
        return False

def processar_e_inserir_dados(conn, arquivo_sql):
    """Processa o arquivo SQL original e insere os dados"""
    try:
        with open(arquivo_sql, 'r', encoding='utf-8') as f:
            conteudo = f.read()
        
        # Extrair apenas a tabela de produtividade
        padrao_produtividade = r'-- Tabela: PRODUTIVIDADE.*?-- Fim da tabela produtividade'
        match = re.search(padrao_produtividade, conteudo, re.DOTALL | re.IGNORECASE)
        
        if not match:
            print("❌ Tabela de produtividade não encontrada no arquivo!")
            return False
        
        tabela_produtividade = match.group(0)
        
        # Corrigir caracteres especiais
        tabela_corrigida = corrigir_caracteres_especiais(tabela_produtividade)
        
        # Extrair INSERTs
        inserts = re.findall(r'INSERT INTO produtividade.*?;', tabela_corrigida, re.DOTALL | re.IGNORECASE)
        
        cursor = conn.cursor()
        registros_inseridos = 0
        
        # Verificar se já existem dados na tabela
        cursor.execute("SELECT COUNT(*) FROM produtividade;")
        total_existente = cursor.fetchone()[0]
        
        if total_existente > 0:
            print(f"ℹ️ Tabela já possui {total_existente} registros.")
            resposta = input("Deseja continuar e adicionar mais registros? (s/n): ")
            if resposta.lower() != 's':
                print("Operação cancelada pelo usuário.")
                return True
        
        for insert in inserts:
            # Manter os nomes de colunas originais da tabela existente
            insert = insert.replace('servico', 'serviÇo')
            insert = insert.replace('endereco', 'endereÇo')
            
            # Remover aspas desnecessárias e corrigir formatos
            insert = re.sub(r"'([^']*)'", lambda m: f"'{corrigir_caracteres_especiais(m.group(1))}'", insert)
            
            # Corrigir formato da data para PostgreSQL (remover parte do tempo)
            insert = re.sub(r"'(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}:\d{2}'", r"'\1'", insert)
            
            try:
                cursor.execute(insert)
                registros_inseridos += 1
                
                if registros_inseridos % 100 == 0:
                    print(f"📊 Processados {registros_inseridos} registros...")
                    
            except Exception as e:
                print(f"⚠️ Erro ao inserir registro {registros_inseridos + 1}: {e}")
                continue
        
        conn.commit()
        print(f"✅ {registros_inseridos} registros inseridos com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao processar dados: {e}")
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
        cursor.execute("SELECT DISTINCT tecnico FROM produtividade LIMIT 10;")
        tecnicos = [row[0] for row in cursor.fetchall()]
        
        # Verificar status únicos
        cursor.execute("SELECT DISTINCT status FROM produtividade;")
        status = [row[0] for row in cursor.fetchall()]
        
        print(f"\n📊 Verificação dos dados:")
        print(f"   Total de registros: {total}")
        print(f"   Técnicos únicos: {len(tecnicos)}")
        print(f"   Status únicos: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro ao verificar dados: {e}")
        return False

def main():
    """Função principal"""
    print("🚀 Iniciando deploy da tabela de produtividade no Railway...")
    
    # Conectar ao PostgreSQL
    conn = conectar_railway_postgres()
    if not conn:
        return
    
    try:
        # Criar tabela
        if not criar_tabela_produtividade(conn):
            return
        
        # Processar e inserir dados
        arquivo_sql = 'operacoes_vion_complete.sql'
        if os.path.exists(arquivo_sql):
            if not processar_e_inserir_dados(conn, arquivo_sql):
                return
        else:
            print(f"⚠️ Arquivo {arquivo_sql} não encontrado. Usando dados de exemplo...")
            # Aqui você pode adicionar dados de exemplo se necessário
        
        # Verificar dados
        verificar_dados(conn)
        
        print("\n🎉 Deploy concluído com sucesso!")
        print("📋 A tabela produtividade está pronta para uso no Railway.")
        
    except Exception as e:
        print(f"❌ Erro durante o deploy: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
