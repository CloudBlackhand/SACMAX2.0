#!/usr/bin/env python3
"""
Módulo Python minimalista para processamento de arquivos Excel
Identifica automaticamente colunas de data e extrai dados para envio de mensagens
"""

import pandas as pd
import json
import sys
import os
from datetime import datetime
import re

def find_date_column(df):
    """
    Identifica automaticamente a coluna de data em um DataFrame
    Procura por variações comuns de nomes de coluna de data
    """
    date_patterns = [
        r'data', r'date', r'timestamp', r'time', r'horário',
        r'criado', r'created', r'atualizado', r'updated',
        r'envio', r'send', r'agendamento', r'schedule'
    ]
    
    for col in df.columns:
        col_lower = str(col).lower().strip()
        for pattern in date_patterns:
            if re.search(pattern, col_lower):
                return col
    
    # Se não encontrar por nome, procurar por colunas com valores de data
    for col in df.columns:
        try:
            # Tentar converter os primeiros valores para datetime
            sample = df[col].dropna().iloc[:5]
            pd.to_datetime(sample, errors='raise')
            return col
        except (ValueError, TypeError):
            continue
    
    return None

def extract_client_data_by_date(file_path):
    """
    Extrai dados organizados por cliente, incluindo todas as informações associadas
    para cada data encontrada na coluna de data
    """
    try:
        excel_file = pd.ExcelFile(file_path)
        client_data_by_date = {}
        sheets_info = []
        
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            if df.empty:
                continue
                
            date_column = find_date_column(df)
            if not date_column:
                continue
                
            # Identificar colunas de identificação do cliente
            client_columns = []
            for col in df.columns:
                col_lower = str(col).lower().strip()
                if any(pattern in col_lower for pattern in ['cliente', 'customer', 'nome', 'name', 'id', 'código', 'codigo']):
                    client_columns.append(col)
            
            if not client_columns:
                # Usar a primeira coluna como identificador se não encontrar
                client_columns = [df.columns[0]]
            
            # Processar cada linha
            for idx, row in df.iterrows():
                if date_column not in df.columns or pd.isna(row[date_column]):
                    continue
                    
                try:
                    date_value = pd.to_datetime(row[date_column])
                    date_key = date_value.strftime('%Y-%m-%d')
                except:
                    date_key = str(row[date_column])
                
                # Identificar o cliente
                client_id = None
                client_name = None
                for col in client_columns:
                    if col in df.columns and pd.notna(row[col]):
                        client_id = str(row[col]).strip()
                        client_name = str(row[col]).strip()
                        break
                
                if not client_id:
                    continue
                
                # Criar estrutura do cliente se não existir
                if date_key not in client_data_by_date:
                    client_data_by_date[date_key] = {}
                
                if client_id not in client_data_by_date[date_key]:
                    client_data_by_date[date_key][client_id] = {
                        'client_id': client_id,
                        'client_name': client_name or client_id,
                        'sheet': sheet_name,
                        'data': []
                    }
                
                # Coletar todos os dados da linha
                row_data = {}
                for col in df.columns:
                    if col != date_column:
                        value = row[col]
                        if pd.notna(value):
                            row_data[str(col)] = str(value)
                
                client_data_by_date[date_key][client_id]['data'].append({
                    'row': idx + 2,
                    'data': row_data
                })
            
            sheets_info.append({
                'name': sheet_name,
                'total_rows': len(df),
                'date_column': date_column,
                'client_columns': client_columns
            })
        
        return {
            'client_data_by_date': client_data_by_date,
            'sheets': sheets_info,
            'total_dates': len(client_data_by_date),
            'file_processed': os.path.basename(file_path)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'client_data_by_date': {},
            'sheets': []
        }

def extract_contacts_from_excel(file_path):
    """
    Extrai contatos de um arquivo Excel
    Identifica colunas de telefone, nome e data automaticamente
    Agrupa dados por cliente baseado na coluna 'data'
    """
    try:
        # Ler todas as abas do Excel
        excel_file = pd.ExcelFile(file_path)
        all_contacts = []
        sheets_info = []
        
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            if df.empty:
                continue
            
            # Identificar colunas importantes
            phone_columns = []
            name_columns = []
            date_column = find_date_column(df)
            
            # Procurar colunas de telefone
            phone_patterns = [
                r'telefone', r'phone', r'celular', r'mobile', r'whatsapp',
                r'contato', r'contact', r'número', r'number'
            ]
            
            for col in df.columns:
                col_lower = str(col).lower().strip()
                for pattern in phone_patterns:
                    if re.search(pattern, col_lower):
                        phone_columns.append(col)
                        break
                
                # Colunas de nome
                if any(pattern in col_lower for pattern in ['nome', 'name', 'cliente', 'customer']):
                    name_columns.append(col)
            
            # Se não encontrar colunas específicas, usar primeiras colunas
            if not phone_columns:
                # Procurar colunas com valores numéricos ou telefone-like
                for col in df.columns:
                    if df[col].dtype in ['int64', 'float64'] or str(col).lower().find('tel') != -1:
                        phone_columns.append(col)
                        break
                else:
                    phone_columns = [df.columns[0]] if len(df.columns) > 0 else []
            
            if not name_columns:
                name_columns = [df.columns[1]] if len(df.columns) > 1 else [df.columns[0]]
            
            # Extrair dados de cada linha
            sheet_contacts = []
            for idx, row in df.iterrows():
                contact = {
                    'row': idx + 2,  # +2 para compensar índice 0 e header
                    'sheet': sheet_name,
                    'phone': '',
                    'name': '',
                    'date': None,
                    'additional_data': {}
                }
                
                # Extrair telefone
                for phone_col in phone_columns:
                    if phone_col in df.columns and pd.notna(row[phone_col]):
                        phone = str(row[phone_col]).strip()
                        # Limpar e formatar telefone
                        phone = re.sub(r'[^\d]', '', phone)
                        if len(phone) >= 8:  # Validar tamanho mínimo
                            contact['phone'] = phone
                            break
                
                # Extrair nome
                for name_col in name_columns:
                    if name_col in df.columns and pd.notna(row[name_col]):
                        contact['name'] = str(row[name_col]).strip()
                        break
                
                # Extrair data
                if date_column and date_column in df.columns and pd.notna(row[date_column]):
                    try:
                        date_value = pd.to_datetime(row[date_column])
                        contact['date'] = date_value.isoformat()
                    except:
                        contact['date'] = str(row[date_column])
                
                # Armazenar dados adicionais
                for col in df.columns:
                    if col not in phone_columns and col not in name_columns and col != date_column:
                        value = row[col]
                        if pd.notna(value):
                            contact['additional_data'][str(col)] = str(value)
                
                if contact['phone']:  # Apenas incluir se tiver telefone
                    sheet_contacts.append(contact)
            
            all_contacts.extend(sheet_contacts)
            
            sheets_info.append({
                'name': sheet_name,
                'total_rows': len(df),
                'contacts_found': len(sheet_contacts),
                'date_column': date_column,
                'phone_columns': phone_columns,
                'name_columns': name_columns
            })
        
        return {
            'contacts': all_contacts,
            'sheets': sheets_info,
            'total_contacts': len(all_contacts),
            'file_processed': os.path.basename(file_path)
        }
        
    except Exception as e:
        return {
            'error': str(e),
            'contacts': [],
            'sheets': []
        }

def main():
    """
    Função principal para uso via linha de comando
    Aceita modo de processamento: 'contacts' ou 'client_data'
    """
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Caminho do arquivo não fornecido'}))
        return
    
    file_path = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else 'contacts'
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'Arquivo não encontrado: {file_path}'}))
        return
    
    try:
        if mode == 'client_data':
            result = extract_client_data_by_date(file_path)
        else:
            result = extract_contacts_from_excel(file_path)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python excel_processor.py <arquivo.xlsx> [mode: client_data|contacts]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    mode = sys.argv[2] if len(sys.argv) > 2 else 'contacts'
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'Arquivo não encontrado: {file_path}'}))
        sys.exit(1)
    
    try:
        if mode == 'client_data':
            result = extract_client_data_by_date(file_path)
        else:
            result = extract_contacts_from_excel(file_path)
        
        # Salvar resultado no Supabase automaticamente
        try:
            import requests
            
            # Determinar URL do servidor baseado no diretório atual
            server_url = "http://localhost:3000"
            
            # Fazer upload para o Supabase
            upload_response = requests.post(
                f"{server_url}/api/supabase/save-data",
                json={
                    'spreadsheetData': result,
                    'fileName': os.path.basename(file_path),
                    'mode': mode
                },
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if upload_response.status_code == 200:
                upload_result = upload_response.json()
                print(f"✅ Dados salvos no Supabase: {upload_result.get('message', 'Sucesso')}")
            else:
                print(f"⚠️ Erro ao salvar no Supabase: {upload_response.text}")
                
        except Exception as e:
            print(f"⚠️ Não foi possível salvar no Supabase: {e}")
            
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))