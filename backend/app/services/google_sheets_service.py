import os
import json
from typing import List, Dict, Any
import requests
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import pickle

class GoogleSheetsService:
    def __init__(self):
        self.SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
        self.creds = None
        self.service = None
        self.token_path = 'token.pickle'
        self.credentials_path = 'credentials.json'
        self.user_token_path = 'user_token.pickle'
        
    def authenticate(self, use_user_auth=False):
        """Autentica com a API do Google Sheets"""
        try:
            token_file = self.user_token_path if use_user_auth else self.token_path
            
            # Carrega credenciais salvas
            if os.path.exists(token_file):
                with open(token_file, 'rb') as token:
                    self.creds = pickle.load(token)
            
            # Se não há credenciais válidas, solicita nova autenticação
            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                else:
                    # Fluxo de autenticação OAuth2
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, self.SCOPES)
                    
                    if use_user_auth:
                        print("🔐 Autenticação com sua conta Google")
                        print("1. Uma janela do navegador será aberta")
                        print("2. Faça login com sua conta Google")
                        print("3. Autorize o acesso à planilha")
                        print("4. Copie o código de autorização")
                        
                        # Abre o navegador para autenticação
                        auth_url, _ = flow.authorization_url(prompt='consent')
                        print(f"\n🌐 Abra este link no navegador: {auth_url}")
                        
                        # Solicita código manualmente
                        auth_code = input("\n📋 Cole o código de autorização: ").strip()
                        
                        # Troca o código por credenciais
                        flow.fetch_token(code=auth_code)
                        self.creds = flow.credentials
                    else:
                        self.creds = flow.run_local_server(port=0)
                
                # Salva credenciais para próximo uso
                with open(token_file, 'wb') as token:
                    pickle.dump(self.creds, token)
            
            # Constrói o serviço
            self.service = build('sheets', 'v4', credentials=self.creds)
            return True
            
        except Exception as e:
            print(f"Erro na autenticação: {e}")
            return False
    
    def authenticate_user(self):
        """Autentica com a conta do usuário"""
        return self.authenticate(use_user_auth=True)
    
    def read_spreadsheet(self, spreadsheet_id: str, range_name: str = 'A:Z') -> List[Dict[str, Any]]:
        """Lê dados de uma planilha do Google Sheets"""
        try:
            if not self.service:
                if not self.authenticate():
                    return []
            
            # Faz a requisição para a API
            result = self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=range_name
            ).execute()
            
            values = result.get('values', [])
            
            if not values:
                return []
            
            # Primeira linha são os cabeçalhos
            headers = values[0]
            
            # Converte para lista de dicionários
            data = []
            for row in values[1:]:
                # Garante que a linha tenha o mesmo número de colunas que os cabeçalhos
                while len(row) < len(headers):
                    row.append('')
                
                row_dict = {}
                for i, header in enumerate(headers):
                    row_dict[header] = row[i] if i < len(row) else ''
                
                data.append(row_dict)
            
            return data
            
        except Exception as e:
            print(f"Erro ao ler planilha: {e}")
            return []
    
    def get_spreadsheet_info(self, spreadsheet_id: str) -> Dict[str, Any]:
        """Obtém informações sobre a planilha"""
        try:
            if not self.service:
                if not self.authenticate():
                    return {}
            
            # Obtém metadados da planilha
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=spreadsheet_id
            ).execute()
            
            return {
                'title': spreadsheet.get('properties', {}).get('title', ''),
                'sheets': [sheet.get('properties', {}).get('title', '') 
                          for sheet in spreadsheet.get('sheets', [])],
                'spreadsheetId': spreadsheet_id
            }
            
        except Exception as e:
            print(f"Erro ao obter informações da planilha: {e}")
            return {}
    
    def extract_spreadsheet_id(self, url: str) -> str:
        """Extrai o ID da planilha de uma URL do Google Sheets"""
        try:
            # Remove prefixos comuns
            url = url.replace('https://docs.google.com/spreadsheets/d/', '')
            url = url.replace('/edit', '')
            url = url.replace('/view', '')
            
            # Remove parâmetros de query
            if '?' in url:
                url = url.split('?')[0]
            
            # Remove gid se presente
            if '#gid=' in url:
                url = url.split('#gid=')[0]
            
            return url.strip()
            
        except Exception as e:
            print(f"Erro ao extrair ID da planilha: {e}")
            return url

# Função auxiliar para processar dados da planilha
def process_spreadsheet_data(data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Processa dados da planilha para o formato do sistema"""
    if not data:
        return {
            'total_records': 0,
            'columns': [],
            'sample_data': [],
            'processed_data': []
        }
    
    # Obtém colunas
    columns = list(data[0].keys()) if data else []
    
    # Processa dados
    processed_data = []
    for row in data:
        processed_row = {
            'id': len(processed_data) + 1,
            'data': row,
            'status': 'pending',
            'processed_at': None
        }
        processed_data.append(processed_row)
    
    return {
        'total_records': len(data),
        'columns': columns,
        'sample_data': data[:5],  # Primeiras 5 linhas como exemplo
        'processed_data': processed_data
    }
