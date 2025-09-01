import pandas as pd
import psycopg2
import os
from typing import Dict, List, Any
import re
from datetime import datetime
import logging
from database_config import get_db_connection

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ExcelToDatabaseConverter:
    def __init__(self, excel_file_path: str):
        self.excel_file_path = excel_file_path
        self.connection = None
        self.sheet_data = {}
        
    def connect_database(self):
        """Conecta ao banco de dados PostgreSQL do Railway"""
        try:
            self.connection = get_db_connection()
            logger.info("Conectado ao banco de dados PostgreSQL do Railway")
            return True
        except Exception as e:
            logger.error(f"Erro ao conectar ao banco de dados: {e}")
            return False
    
    def clean_column_name(self, column_name: str) -> str:
        """Limpa e padroniza nomes de colunas para SQL"""
        if pd.isna(column_name) or column_name == '':
            return 'coluna_vazia'
        
        # Converter para string e remover espaços extras
        clean_name = str(column_name).strip()
        
        # Substituir caracteres especiais por underscore
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', clean_name)
        
        # Remover underscores múltiplos
        clean_name = re.sub(r'_+', '_', clean_name)
        
        # Remover underscore no início e fim
        clean_name = clean_name.strip('_')
        
        # Se ficar vazio, usar nome padrão
        if not clean_name:
            clean_name = 'coluna_sem_nome'
        
        # Garantir que não comece com número
        if clean_name[0].isdigit():
            clean_name = 'col_' + clean_name
            
        return clean_name.lower()
    
    def clean_table_name(self, sheet_name: str) -> str:
        """Limpa e padroniza nomes de tabelas para SQL"""
        # Converter para string e remover espaços extras
        clean_name = str(sheet_name).strip()
        
        # Substituir caracteres especiais por underscore
        clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', clean_name)
        
        # Remover underscores múltiplos
        clean_name = re.sub(r'_+', '_', clean_name)
        
        # Remover underscore no início e fim
        clean_name = clean_name.strip('_')
        
        # Se ficar vazio, usar nome padrão
        if not clean_name:
            clean_name = 'tabela_sem_nome'
        
        # Garantir que não comece com número
        if clean_name[0].isdigit():
            clean_name = 'tab_' + clean_name
            
        return clean_name.lower()
    
    def detect_column_type(self, series: pd.Series) -> str:
        """Detecta o tipo de dados mais apropriado para uma coluna"""
        # Remover valores nulos para análise
        non_null_series = series.dropna()
        
        if len(non_null_series) == 0:
            return 'TEXT'
        
        # Verificar se é numérico
        if pd.api.types.is_numeric_dtype(non_null_series):
            # Verificar se são todos inteiros
            if pd.api.types.is_integer_dtype(non_null_series):
                return 'INTEGER'
            else:
                return 'REAL'
        
        # Verificar se é data/datetime
        if pd.api.types.is_datetime64_any_dtype(non_null_series):
            return 'DATETIME'
        
        # Verificar se pode ser convertido para data
        try:
            pd.to_datetime(non_null_series.head(10))
            return 'DATETIME'
        except:
            pass
        
        # Verificar se é booleano
        if pd.api.types.is_bool_dtype(non_null_series):
            return 'BOOLEAN'
        
        # Por padrão, usar TEXT
        return 'TEXT'
    
    def read_excel_sheets(self) -> bool:
        """Lê todas as abas do arquivo Excel"""
        try:
            logger.info(f"Lendo arquivo Excel: {self.excel_file_path}")
            
            # Ler todas as abas do Excel
            excel_file = pd.ExcelFile(self.excel_file_path)
            logger.info(f"Encontradas {len(excel_file.sheet_names)} abas: {excel_file.sheet_names}")
            
            for sheet_name in excel_file.sheet_names:
                logger.info(f"Processando aba: {sheet_name}")
                
                # Ler a aba
                df = pd.read_excel(self.excel_file_path, sheet_name=sheet_name)
                
                # Pular abas vazias
                if df.empty:
                    logger.warning(f"Aba '{sheet_name}' está vazia, pulando...")
                    continue
                
                # Limpar nomes das colunas
                original_columns = df.columns.tolist()
                clean_columns = [self.clean_column_name(col) for col in original_columns]
                
                # Verificar duplicatas e renomear se necessário
                final_columns = []
                column_counts = {}
                
                for col in clean_columns:
                    if col in column_counts:
                        column_counts[col] += 1
                        final_columns.append(f"{col}_{column_counts[col]}")
                    else:
                        column_counts[col] = 0
                        final_columns.append(col)
                
                df.columns = final_columns
                
                # Armazenar informações da aba
                table_name = self.clean_table_name(sheet_name)
                self.sheet_data[table_name] = {
                    'dataframe': df,
                    'original_name': sheet_name,
                    'original_columns': original_columns,
                    'clean_columns': final_columns
                }
                
                logger.info(f"Aba '{sheet_name}' processada: {len(df)} linhas, {len(df.columns)} colunas")
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao ler arquivo Excel: {e}")
            return False
    
    def create_tables(self) -> bool:
        """Cria as tabelas no banco de dados"""
        try:
            cursor = self.connection.cursor()
            
            for table_name, sheet_info in self.sheet_data.items():
                df = sheet_info['dataframe']
                
                logger.info(f"Criando tabela: {table_name}")
                
                # Detectar tipos de colunas
                column_definitions = []
                for col in df.columns:
                    col_type = self.detect_column_type(df[col])
                    column_definitions.append(f"{col} {col_type}")
                
                # Criar comando CREATE TABLE
                create_table_sql = f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    {', '.join(column_definitions)}
                )
                """
                
                # Executar comando
                cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
                cursor.execute(create_table_sql)
                
                logger.info(f"Tabela '{table_name}' criada com sucesso")
            
            self.connection.commit()
            return True
            
        except Exception as e:
            logger.error(f"Erro ao criar tabelas: {e}")
            return False
    
    def insert_data(self) -> bool:
        """Insere os dados nas tabelas"""
        try:
            for table_name, sheet_info in self.sheet_data.items():
                df = sheet_info['dataframe']
                
                logger.info(f"Inserindo dados na tabela: {table_name}")
                
                # Preparar dados para inserção
                df_clean = df.copy()
                
                # Converter valores NaN para None (NULL no SQL)
                df_clean = df_clean.where(pd.notnull(df_clean), None)
                
                # Inserir dados usando pandas to_sql
                df_clean.to_sql(table_name, self.connection, if_exists='append', index=False)
                
                logger.info(f"Inseridos {len(df_clean)} registros na tabela '{table_name}'")
            
            self.connection.commit()
            return True
            
        except Exception as e:
            logger.error(f"Erro ao inserir dados: {e}")
            return False
    
    def generate_sql_script(self, output_file: str = None) -> str:
        """Gera um script SQL com todas as tabelas e dados"""
        if not output_file:
            output_file = f"database_script_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
        
        try:
            sql_script = []
            sql_script.append(f"-- Script SQL gerado automaticamente")
            sql_script.append(f"-- Arquivo Excel: {os.path.basename(self.excel_file_path)}")
            sql_script.append(f"-- Data de geração: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            sql_script.append(f"-- Total de tabelas: {len(self.sheet_data)}")
            sql_script.append("")
            
            for table_name, sheet_info in self.sheet_data.items():
                df = sheet_info['dataframe']
                original_name = sheet_info['original_name']
                
                sql_script.append(f"-- Tabela: {original_name} -> {table_name}")
                
                # CREATE TABLE
                column_definitions = []
                for col in df.columns:
                    col_type = self.detect_column_type(df[col])
                    column_definitions.append(f"    {col} {col_type}")
                
                create_table_sql = f"""CREATE TABLE {table_name} (
{', '.join(column_definitions)}
);"""
                
                sql_script.append(create_table_sql)
                sql_script.append("")
                
                # INSERT statements
                for _, row in df.iterrows():
                    values = []
                    for value in row:
                        if pd.isna(value):
                            values.append('NULL')
                        elif isinstance(value, str):
                            # Escapar aspas simples
                            escaped_value = value.replace("'", "''")
                            values.append(f"'{escaped_value}'")
                        else:
                            values.append(str(value))
                    
                    insert_sql = f"INSERT INTO {table_name} ({', '.join(df.columns)}) VALUES ({', '.join(values)});"
                    sql_script.append(insert_sql)
                
                sql_script.append("")
                sql_script.append(f"-- Fim da tabela {table_name}")
                sql_script.append("")
            
            # Salvar script
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write('\n'.join(sql_script))
            
            logger.info(f"Script SQL gerado: {output_file}")
            return output_file
            
        except Exception as e:
            logger.error(f"Erro ao gerar script SQL: {e}")
            return None
    
    def get_database_summary(self) -> Dict[str, Any]:
        """Retorna um resumo do banco de dados criado"""
        summary = {
            'excel_file': self.excel_file_path,
            'total_tables': len(self.sheet_data),
            'tables': {}
        }
        
        for table_name, sheet_info in self.sheet_data.items():
            df = sheet_info['dataframe']
            summary['tables'][table_name] = {
                'original_name': sheet_info['original_name'],
                'rows': len(df),
                'columns': len(df.columns),
                'column_names': df.columns.tolist()
            }
        
        return summary
    
    def process_produtividade_sheet(self, excel_file) -> Dict[str, Any]:
        """Processa especificamente a aba PRODUTIVIDADE da planilha OPERAÇÕES VION.xlsx"""
        try:
            logger.info("Processando aba PRODUTIVIDADE")
            
            # Tentar diferentes nomes de aba
            sheet_names = ['PRODUTIVIDADE', 'Produtividade', 'produtividade', 'PRODUTIVIDADE(1)']
            df = None
            sheet_name_used = None
            
            for sheet_name in sheet_names:
                try:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name)
                    sheet_name_used = sheet_name
                    logger.info(f"Aba '{sheet_name}' carregada com {len(df)} registros")
                    break
                except:
                    continue
            
            if df is None:
                # Se não encontrou, tentar ler a primeira aba
                df = pd.read_excel(excel_file, sheet_name=0)
                sheet_name_used = excel_file.sheet_names[0]
                logger.info(f"Usando primeira aba '{sheet_name_used}' com {len(df)} registros")
            
            # Limpar dados
            df = df.dropna(how='all')  # Remover linhas vazias
            df = df.fillna('')  # Preencher valores NaN
            
            # Mapear colunas da planilha para a tabela (mais flexível)
            column_mapping = {
                'DATA': 'data',
                'TECNICO': 'tecnico',
                'SERVIÇO': 'servico',
                'S.A': 'sa',
                'SA': 'sa',
                'DOCUMENTO': 'documento',
                'NOME CLIENTE': 'nome_cliente',
                'NOME_CLIENTE': 'nome_cliente',
                'ENDEREÇO': 'endereco',
                'ENDERECO': 'endereco',
                'TELEFONE1': 'telefone1',
                'TELEFONE2': 'telefone2',
                'PLANO': 'plano',
                'STATUS': 'status',
                'OBS': 'obs',
                'OBSERVAÇÕES': 'obs'
            }
            
            # Renomear colunas
            df_renamed = df.rename(columns=column_mapping)
            
            # Selecionar apenas as colunas que existem na tabela
            table_columns = ['data', 'tecnico', 'servico', 'sa', 'documento', 'nome_cliente', 
                           'endereco', 'telefone1', 'telefone2', 'plano', 'status', 'obs']
            
            # Filtrar apenas colunas que existem
            available_columns = [col for col in table_columns if col in df_renamed.columns]
            df_final = df_renamed[available_columns]
            
            logger.info(f"Colunas disponíveis: {available_columns}")
            logger.info(f"Colunas da planilha: {df.columns.tolist()}")
            
            # Verificar se a tabela produtividade existe, se não, criar
            cursor = self.connection.cursor()
            
            # Criar tabela se não existir
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS produtividade (
                id SERIAL PRIMARY KEY,
                data DATE,
                tecnico VARCHAR(255),
                servico VARCHAR(255),
                sa VARCHAR(255) UNIQUE,
                documento VARCHAR(255),
                nome_cliente VARCHAR(255),
                endereco TEXT,
                telefone1 VARCHAR(50),
                telefone2 VARCHAR(50),
                plano VARCHAR(255),
                status VARCHAR(255),
                obs TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            
            cursor.execute(create_table_sql)
            self.connection.commit()
            logger.info("✅ Tabela produtividade criada/verificada")
            
            # Preparar query de UPSERT (INSERT ou UPDATE)
            columns_str = ', '.join(available_columns)
            placeholders = ', '.join(['%s'] * len(available_columns))
            
            # Query para PostgreSQL usando ON CONFLICT
            upsert_query = f"""
                INSERT INTO produtividade ({columns_str}, updated_at) 
                VALUES ({placeholders}, CURRENT_TIMESTAMP)
                ON CONFLICT (sa) DO UPDATE SET
                    data = EXCLUDED.data,
                    tecnico = EXCLUDED.tecnico,
                    servico = EXCLUDED.servico,
                    documento = EXCLUDED.documento,
                    nome_cliente = EXCLUDED.nome_cliente,
                    endereco = EXCLUDED.endereco,
                    telefone1 = EXCLUDED.telefone1,
                    telefone2 = EXCLUDED.telefone2,
                    plano = EXCLUDED.plano,
                    status = EXCLUDED.status,
                    obs = EXCLUDED.obs,
                    updated_at = CURRENT_TIMESTAMP
            """
            
            # Converter DataFrame para lista de tuplas
            records = df_final.to_dict('records')
            records_to_upsert = []
            
            for record in records:
                row = []
                for col in available_columns:
                    value = record.get(col, '')
                    # Converter data se necessário
                    if col == 'data' and value:
                        try:
                            if isinstance(value, str):
                                value = pd.to_datetime(value).date()
                            elif hasattr(value, 'date'):
                                value = value.date()
                        except:
                            value = None
                    row.append(value)
                records_to_upsert.append(tuple(row))
            
            # Executar UPSERT
            cursor.executemany(upsert_query, records_to_upsert)
            self.connection.commit()
            
            records_processed = len(records_to_upsert)
            logger.info(f"✅ {records_processed} registros processados (INSERT/UPDATE) na tabela produtividade")
            
            cursor.close()
            
            return {
                "sheet_name": sheet_name_used,
                "records_processed": records_processed,
                "columns_mapped": available_columns,
                "operation": "UPSERT",
                "primary_key": "sa",
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar aba PRODUTIVIDADE: {e}")
            return {
                "sheet_name": "PRODUTIVIDADE",
                "error": str(e),
                "success": False
            }
    
    def process_excel_to_database(self) -> bool:
        """Processo completo: Excel -> Banco de Dados"""
        logger.info("Iniciando conversão Excel para Banco de Dados")
        
        # Conectar ao banco
        if not self.connect_database():
            return False
        
        # Ler Excel
        if not self.read_excel_sheets():
            return False
        
        # Criar tabelas
        if not self.create_tables():
            return False
        
        # Inserir dados
        if not self.insert_data():
            return False
        
        logger.info("Conversão concluída com sucesso!")
        return True
    
    def close_connection(self):
        """Fecha a conexão com o banco de dados"""
        if self.connection:
            self.connection.close()
            logger.info("Conexão com banco de dados fechada")

def main():
    # Configurações
    excel_file = "../excel test/OPERAÇÕES VION.xlsx"
    
    # Verificar se o arquivo Excel existe
    if not os.path.exists(excel_file):
        logger.error(f"Arquivo Excel não encontrado: {excel_file}")
        return
    
    # Criar conversor
    converter = ExcelToDatabaseConverter(excel_file)
    
    try:
        # Conectar ao banco de dados
        if not converter.connect_database():
            print("❌ Erro ao conectar ao banco de dados")
            return
        
        # Ler o arquivo Excel
        excel_file_obj = pd.ExcelFile(excel_file)
        
        # Processar a aba PRODUTIVIDADE
        result = converter.process_produtividade_sheet(excel_file_obj)
        
        if result["success"]:
            print("\n" + "="*60)
            print("🎉 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
            print("="*60)
            print(f"📁 Arquivo Excel: {os.path.basename(excel_file)}")
            print(f"📋 Aba processada: {result['sheet_name']}")
            print(f"📊 Registros processados: {result['records_processed']}")
            print(f"🔑 Chave primária: {result['primary_key']}")
            print(f"🔄 Operação: {result['operation']}")
            print(f"🏷️  Colunas mapeadas: {', '.join(result['columns_mapped'])}")
            print("\n✅ Dados da planilha OPERAÇÕES VION.xlsx processados (INSERT/UPDATE)!")
            print("✅ Tabela produtividade atualizada com sucesso!")
            
        else:
            print(f"❌ Erro durante a importação: {result.get('error', 'Erro desconhecido')}")
            
    except Exception as e:
        logger.error(f"Erro geral: {e}")
    
    finally:
        converter.close_connection()

if __name__ == "__main__":
    main()