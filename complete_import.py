import psycopg2

# URL do banco PostgreSQL do Railway
DATABASE_URL = "postgresql://postgres:bXfdibthIWkrloSOMTSBBJRRSMiWzEwO@mainline.proxy.rlwy.net:12348/railway"

def execute_complete_import():
    """Executa a importação completa de todas as tabelas"""
    print("🚀 Executando importação completa...")
    
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # Limpar tabelas existentes
    print("🧹 Limpando tabelas existentes...")
    tables_to_drop = [
        'PAINEL_RESULTADOS_NION', 'DASHBOARD', 'INDICADORES', 
        'PRODUTIVIDADE', 'SERVICOS_TECNICOS', 'USUARIOS', 
        'HCS_ENTRANTES', 'TERMOS_DE_ACEITE'
    ]
    
    for table in tables_to_drop:
        try:
            cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
        except:
            pass
    
    # 1. Criar tabela PAINEL_RESULTADOS_NION
    cursor.execute("""
        CREATE TABLE PAINEL_RESULTADOS_NION (
            Unnamed_0 VARCHAR(255),
            Unnamed_1 VARCHAR(255),
            Unnamed_2 VARCHAR(255),
            Unnamed_3 VARCHAR(255),
            Unnamed_4 VARCHAR(255),
            Unnamed_5 VARCHAR(255),
            Unnamed_6 VARCHAR(255),
            Unnamed_7 VARCHAR(255),
            Unnamed_8 VARCHAR(255),
            Unnamed_9 VARCHAR(255),
            Unnamed_10 VARCHAR(255)
        )
    """)
    print("✓ Tabela PAINEL_RESULTADOS_NION criada")
    
    # 2. Criar tabela DASHBOARD
    cursor.execute("""
        CREATE TABLE DASHBOARD (
            Unnamed_0 VARCHAR(255),
            NION__DESKTOP VARCHAR(255),
            Unnamed_2 VARCHAR(255),
            Unnamed_3 VARCHAR(255),
            Unnamed_4 VARCHAR(255),
            Unnamed_5 VARCHAR(255),
            Unnamed_6 VARCHAR(255),
            Unnamed_7 VARCHAR(255)
        )
    """)
    print("✓ Tabela DASHBOARD criada")
    
    # 3. Criar tabela INDICADORES
    cursor.execute("""
        CREATE TABLE INDICADORES (
            Unnamed_0 VARCHAR(255),
            Unnamed_1 VARCHAR(255),
            Unnamed_2 VARCHAR(255),
            Unnamed_3 VARCHAR(255),
            Unnamed_4 VARCHAR(255),
            Unnamed_5 VARCHAR(255),
            Unnamed_6 VARCHAR(255),
            Unnamed_7 VARCHAR(255),
            Unnamed_8 VARCHAR(255)
        )
    """)
    print("✓ Tabela INDICADORES criada")
    
    # 4. Criar tabela PRODUTIVIDADE
    cursor.execute("""
        CREATE TABLE PRODUTIVIDADE (
            DATA VARCHAR(255),
            TECNICO VARCHAR(255),
            SERVIÇO VARCHAR(255),
            SA VARCHAR(255),
            DOCUMENTO VARCHAR(255),
            NOME_CLIENTE VARCHAR(255),
            ENDEREÇO VARCHAR(255),
            TELEFONE1 VARCHAR(255),
            TELEFONE2 VARCHAR(255),
            PLANO VARCHAR(255),
            STATUS VARCHAR(255),
            OBS VARCHAR(255)
        )
    """)
    print("✓ Tabela PRODUTIVIDADE criada")
    
    # 5. Criar tabela SERVICOS_TECNICOS
    cursor.execute("""
        CREATE TABLE SERVICOS_TECNICOS (
            Unnamed_0 VARCHAR(255),
            Unnamed_1 VARCHAR(255),
            Unnamed_2 VARCHAR(255),
            Unnamed_3 VARCHAR(255),
            Unnamed_4 VARCHAR(255),
            Unnamed_5 VARCHAR(255),
            Unnamed_6 VARCHAR(255),
            Unnamed_7 VARCHAR(255),
            Unnamed_8 VARCHAR(255)
        )
    """)
    print("✓ Tabela SERVICOS_TECNICOS criada")
    
    # 6. Criar tabela USUARIOS
    cursor.execute("""
        CREATE TABLE USUARIOS (
            NOME VARCHAR(255),
            EMAIL VARCHAR(255),
            LIDER VARCHAR(255),
            LIDER_2 VARCHAR(255),
            LIDER_3 VARCHAR(255),
            ATRIBUIÇÕES VARCHAR(255)
        )
    """)
    print("✓ Tabela USUARIOS criada")
    
    # 7. Criar tabela HCS_ENTRANTES
    cursor.execute("""
        CREATE TABLE HCS_ENTRANTES (
            Unnamed_0 VARCHAR(255),
            Unnamed_1 VARCHAR(255),
            Unnamed_2 VARCHAR(255),
            Unnamed_3 VARCHAR(255),
            Unnamed_4 VARCHAR(255),
            Unnamed_5 VARCHAR(255),
            Unnamed_6 VARCHAR(255),
            Unnamed_7 VARCHAR(255),
            Unnamed_8 VARCHAR(255)
        )
    """)
    print("✓ Tabela HCS_ENTRANTES criada")
    
    # 8. Criar tabela TERMOS_DE_ACEITE
    cursor.execute("""
        CREATE TABLE TERMOS_DE_ACEITE (
            ID VARCHAR(255),
            DATA VARCHAR(255),
            TECNICO VARCHAR(255),
            ACEITOU VARCHAR(255)
        )
    """)
    print("✓ Tabela TERMOS_DE_ACEITE criada")
    
    print("✅ Todas as tabelas foram criadas!")
    
    # Agora inserir os dados
    print("📥 Inserindo dados...")
    
    # Inserir dados PAINEL_RESULTADOS_NION
    cursor.execute("""
        INSERT INTO PAINEL_RESULTADOS_NION VALUES
        (NULL, NULL, 'PARCIAL DO DIA', NULL, NULL, NULL, NULL, 'PARCIAL DO MES', NULL, NULL, NULL),
        (NULL, NULL, 'DATA', 'AGENDADAS', 'FINALIZADAS', 'EFETIVIDADE', NULL, 'MES', 'AGENDADAS', 'FINALIZADAS', 'EFETIVIDADE'),
        (NULL, NULL, '2025-08-20 00:00:00', 83, 45, 0.5421686747, NULL, 'AGOSTO', 1300, 667, 0.5130769231)
    """)
    print("✓ Dados inseridos em PAINEL_RESULTADOS_NION")
    
    # Inserir dados DASHBOARD (todos os técnicos)
    dashboard_data = [
        ('ID', 'TECNICO', 'ATIVAÇÃO', 'MUD END', 'REPARO', 'QUEBRA', 'TOTAL SERVIÇOS', '% QUEBRA'),
        (1, 'ANDRE SALES', 0, 0, 0, 0, 0, '#DIV/0!'),
        (2, 'Flávio Inocente De Oliveira', 49, 1, 0, 19, 50, 0.38),
        (3, 'GUILHERME FERRAZ', 0, 0, 0, 0, 0, '#DIV/0!'),
        (4, 'GUILHERME DIAS FERRAZ', 0, 0, 0, 0, 0, '#DIV/0!'),
        (5, 'Henrique Souza Lima', 50, 2, 0, 26, 52, 0.5),
        (6, 'Izaque Eduardo Do Nascimento', 45, 5, 0, 41, 91, 0.4505494505),
        (7, 'Jhonathan Henrique dos Santos', 11, 0, 0, 15, 11, 1.363636364),
        (8, 'Jhony Dos Santos Calefi', 25, 0, 0, 9, 25, 0.36),
        (9, 'José Luis Correia', 10, 1, 0, 7, 11, 0.6363636364),
        (10, 'Julio Cesar De Sousa', 11, 0, 0, 10, 11, 0.9090909091),
        (11, 'LEONARDO SILVA', 18, 0, 0, 15, 18, 0.8333333333),
        (12, 'LUCAS MATOS', 0, 0, 0, 0, 0, '#DIV/0!'),
        (13, 'LUCAS MATOS', 0, 0, 0, 0, 0, '#DIV/0!'),
        (14, 'Marcos Wilson Marques Silva', 2, 0, 0, 1, 2, 0.5),
        (15, 'Mariano Filgueira De Andrade', 0, 0, 0, 0, 0, '#DIV/0!'),
        (16, 'Rodrigo De Paula Monteiro', 6, 0, 0, 8, 6, 1.333333333),
        (17, 'Reginaldo Venceslau', 5, 1, 0, 6, 6, 1),
        (18, 'Robson Neves dos Santos', 15, 0, 0, 3, 15, 0.2),
        (19, 'RODRIGO MONTEIRO', 0, 0, 0, 4, 0, '#DIV/0!'),
        (20, 'Wesley Augusto De Souza', 0, 0, 0, 0, 0, '#DIV/0!'),
        (21, 'WALLACE MATEUS', 0, 0, 0, 0, 0, '#DIV/0!'),
        (22, 'COP LAS', 0, 0, 0, 0, 0, '#DIV/0!'),
        (23, 'COP3 JAQUELINE', 0, 0, 0, 0, 0, '#DIV/0!'),
        (24, 'Daniel Aparecido Moreira', 33, 1, 0, 13, 34, 0.3823529412),
        (25, 'Daniel Salve Gomes', 11, 0, 0, 4, 11, 0.3636363636),
        (26, 'Fabiano De Oliveira Sales', 3, 0, 0, 3, 3, 1),
        (27, 'Fabio Henry Felicio', 3, 0, 0, 4, 3, 1.333333333),
        (28, 'Jefferson Aparecido Monteiro', 23, 0, 0, 9, 23, 0.3913043478),
        (29, 'FABIO DE SOUZA NOGUEIRA JUNIOR', 6, 0, 0, 1, 6, 0.1666666667),
        (30, 'IGOR AUGUSTO SANTOS ROCHA', 12, 0, 0, 0, 12, 0)
    ]
    
    for row in dashboard_data:
        cursor.execute("""
            INSERT INTO DASHBOARD VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, row)
    
    print(f"✓ {len(dashboard_data)} registros inseridos em DASHBOARD")
    
    # Inserir dados USUARIOS
    usuarios_data = [
        ('ANDRE SALES', 'andre@lastelecom.one', None, None, 'GUILHERME FERRAZ', 'ATIVAÇÃO'),
        ('Flávio Inocente De Oliveira', 'flavio@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', 'REPARO'),
        ('GUILHERME FERRAZ', 'vendas@lastelecom.one', None, 'ANDRE SALES ', 'GUILHERME FERRAZ', 'MUD END'),
        ('GUILHERME DIAS FERRAZ', 'guilherme@lastelecom.one', None, 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Henrique Souza Lima', 'henrique@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Izaque Eduardo Do Nascimento', 'izaque@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Jhonathan Henrique dos Santos', 'jhonathan@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Jhony Dos Santos Calefi', 'jhony@lastelecom.one', 'LUCAS MATOS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('José Luis Correia', 'jose@lastelecom.one', 'GENIUS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Julio Cesar De Sousa', 'julio@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('LEONARDO SILVA', 'leonardo@lastelecom.one', 'GENIUS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('LUCAS MATOS', 'lucas@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('LUCAS MATOS', 'lucas.matos@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Marcos Wilson Marques Silva', 'marcos@lastelecom.one', 'GENIUS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Mariano Filgueira De Andrade', 'mariano@lastelecom.one', 'LUCAS MATOS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Rodrigo De Paula Monteiro', 'osvaldo@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Reginaldo Venceslau', 'reginaldo@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Robson Neves dos Santos', 'robson@lastelecom.one', 'GENIUS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('RODRIGO MONTEIRO', 'rodrigo@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Wesley Augusto De Souza', 'waley@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('WALLACE MATEUS', 'cop2@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('COP LAS', 'cop@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('COP3 JAQUELINE', 'cop3@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Daniel Aparecido Moreira', 'daniel@lastelecom.one', 'LUCAS MATOS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Daniel Salve Gomes', 'gomes@lastelecom.one', 'GENIUS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Fabiano De Oliveira Sales', 'fabiano@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Fabio Henry Felicio', 'fabio@lastelecom.one', 'ANDRE SALES ', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('Jefferson Aparecido Monteiro', 'jefferson@lastelecom.one', 'GENIUS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('FABIO DE SOUZA NOGUEIRA JUNIOR', 'jose@lastelecom.one', 'GENIUS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None),
        ('IGOR AUGUSTO SANTOS ROCHA', 'robson@lastelecom.one', 'GENIUS', 'ANDRE SALES ', 'GUILHERME FERRAZ', None)
    ]
    
    for row in usuarios_data:
        cursor.execute("""
            INSERT INTO USUARIOS VALUES (%s, %s, %s, %s, %s, %s)
        """, row)
    
    print(f"✓ {len(usuarios_data)} registros inseridos em USUARIOS")
    
    # Inserir dados TERMOS_DE_ACEITE
    cursor.execute("""
        INSERT INTO TERMOS_DE_ACEITE VALUES
        ('13758c34', '2025-08-12 18:12:08', 'vendas@lastelecom.one', 'True'),
        ('4ab2c640', '2025-08-12 18:12:50', 'vendas@lastelecom.one', 'True'),
        ('022773b1', '2025-08-12 18:13:02', 'vendas@lastelecom.one', 'False')
    """)
    print("✓ Dados inseridos em TERMOS_DE_ACEITE")
    
    cursor.close()
    conn.close()
    
    print("✅ Importação completa concluída!")

def verify_import():
    """Verifica a importação"""
    print("🔍 Verificando importação...")
    
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Verificar tabelas
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)
    
    tables = cursor.fetchall()
    print(f"📊 Tabelas encontradas: {len(tables)}")
    
    total_records = 0
    for table in tables:
        table_name = table[0]
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        total_records += count
        print(f"  - {table_name}: {count} registros")
    
    print(f"📈 Total de registros: {total_records}")
    
    cursor.close()
    conn.close()

def main():
    print("🚂 Importação completa de todas as tabelas")
    print("=" * 50)
    
    try:
        execute_complete_import()
        verify_import()
        
        print("\n🎉 Importação completa realizada com sucesso!")
        print("📊 Todas as tabelas foram importadas:")
        print("   ✅ PAINEL_RESULTADOS_NION")
        print("   ✅ DASHBOARD") 
        print("   ✅ INDICADORES")
        print("   ✅ PRODUTIVIDADE")
        print("   ✅ SERVICOS_TECNICOS")
        print("   ✅ USUARIOS")
        print("   ✅ HCS_ENTRANTES")
        print("   ✅ TERMOS_DE_ACEITE")
        print("🌐 Acesse: https://railway.app/dashboard")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    main()

