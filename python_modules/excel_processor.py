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

def extract_contacts_from_excel(file_path):
    """
    Extrai contatos de um arquivo Excel
    Identifica colunas de telefone, nome e data automaticamente
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
    """
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Caminho do arquivo não fornecido'}))
        return
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(json.dumps({'error': f'Arquivo não encontrado: {file_path}'}))
        return
    
    try:
        result = extract_contacts_from_excel(file_path)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == '__main__':
    main()