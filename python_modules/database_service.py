#!/usr/bin/env python3
"""
Serviço Python para gerenciamento do banco de dados Railway PostgreSQL
Substitui o Supabase e gerencia todas as operações de banco
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import logging
from typing import Dict, List, Optional, Any
import pandas as pd
from textblob import TextBlob
import re

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RailwayDatabaseService:
    def __init__(self):
        self.connection_string = os.getenv('DATABASE_URL') or os.getenv('DATABASE_PUBLIC_URL')
        self.connection = None
        self.setup_database()
    
    def get_connection(self):
        """Obter conexão com o banco de dados"""
        if not self.connection_string:
            raise Exception("DATABASE_URL não configurada")
        
        try:
            if not self.connection or self.connection.closed:
                self.connection = psycopg2.connect(self.connection_string)
            return self.connection
        except Exception as e:
            logger.error(f"Erro ao conectar ao banco: {e}")
            raise
    
    def setup_database(self):
        """Criar tabelas se não existirem"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Tabela de clientes
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS clients (
                    id SERIAL PRIMARY KEY,
                    client_id VARCHAR(255) UNIQUE NOT NULL,
                    client_name VARCHAR(500) NOT NULL,
                    phone VARCHAR(20),
                    sheet_name VARCHAR(255),
                    last_upload_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Tabela de dados de planilhas
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS spreadsheet_data (
                    id SERIAL PRIMARY KEY,
                    upload_id VARCHAR(255) NOT NULL,
                    client_id INTEGER REFERENCES clients(id),
                    date DATE,
                    sheet_name VARCHAR(255),
                    data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Tabela de histórico de uploads
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS upload_history (
                    id SERIAL PRIMARY KEY,
                    upload_id VARCHAR(255) UNIQUE NOT NULL,
                    file_name VARCHAR(500) NOT NULL,
                    mode VARCHAR(50) NOT NULL,
                    total_records INTEGER DEFAULT 0,
                    status VARCHAR(50) DEFAULT 'completed',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Tabela de feedback
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS feedback (
                    id SERIAL PRIMARY KEY,
                    client_id INTEGER REFERENCES clients(id),
                    message_text TEXT NOT NULL,
                    sentiment VARCHAR(20) NOT NULL,
                    confidence FLOAT NOT NULL,
                    score FLOAT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            cursor.close()
            logger.info("Tabelas criadas/verificadas com sucesso")
            
        except Exception as e:
            logger.error(f"Erro ao configurar banco: {e}")
            raise
    
    def save_spreadsheet_data(self, spreadsheet_data: Dict, file_name: str, mode: str = 'contacts') -> Dict:
        """Salvar dados de planilha no banco"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Criar registro de upload
            upload_id = f"upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hash(file_name)}"
            cursor.execute("""
                INSERT INTO upload_history (upload_id, file_name, mode, total_records)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (upload_id, file_name, mode, 0))
            
            upload_record_id = cursor.fetchone()[0]
            total_records = 0
            
            if mode == 'contacts':
                # Processar contatos
                contacts = spreadsheet_data.get('contacts', [])
                for contact in contacts:
                    # Salvar/atualizar cliente
                    client_id = self._upsert_client(contact, upload_id)
                    
                    # Salvar dados da planilha
                    cursor.execute("""
                        INSERT INTO spreadsheet_data (upload_id, client_id, sheet_name, data)
                        VALUES (%s, %s, %s, %s)
                    """, (upload_id, client_id, contact.get('sheet_name', ''), json.dumps(contact)))
                    
                    total_records += 1
            
            elif mode == 'client_data':
                # Processar dados organizados por cliente e data
                client_data_by_date = spreadsheet_data.get('client_data_by_date', {})
                for date, clients in client_data_by_date.items():
                    for client_id, client_info in clients.items():
                        # Salvar/atualizar cliente
                        db_client_id = self._upsert_client({
                            'client_id': client_id,
                            'client_name': client_info.get('client_name', ''),
                            'phone': self._extract_phone_from_data(client_info.get('data', {})),
                            'sheet_name': client_info.get('sheet', '')
                        }, upload_id)
                        
                        # Salvar dados da planilha
                        cursor.execute("""
                            INSERT INTO spreadsheet_data (upload_id, client_id, date, sheet_name, data)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (upload_id, db_client_id, date, client_info.get('sheet', ''), json.dumps(client_info)))
                        
                        total_records += 1
            
            # Atualizar total de registros
            cursor.execute("""
                UPDATE upload_history SET total_records = %s WHERE id = %s
            """, (total_records, upload_record_id))
            
            conn.commit()
            cursor.close()
            
            logger.info(f"Dados salvos: {total_records} registros")
            return {
                'total_records': total_records,
                'upload_id': upload_id,
                'message': f'Dados salvos com sucesso: {total_records} registros'
            }
            
        except Exception as e:
            logger.error(f"Erro ao salvar dados: {e}")
            if conn:
                conn.rollback()
            raise
    
    def _upsert_client(self, client_data: Dict, upload_id: str) -> int:
        """Salvar ou atualizar cliente"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Verificar se cliente existe
            cursor.execute("""
                SELECT id FROM clients WHERE client_id = %s
            """, (client_data['client_id'],))
            
            existing = cursor.fetchone()
            
            if existing:
                # Atualizar cliente existente
                cursor.execute("""
                    UPDATE clients SET 
                        client_name = %s,
                        phone = %s,
                        sheet_name = %s,
                        last_upload_id = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id
                """, (
                    client_data['client_name'],
                    client_data.get('phone'),
                    client_data.get('sheet_name'),
                    upload_id,
                    existing[0]
                ))
                return existing[0]
            else:
                # Criar novo cliente
                cursor.execute("""
                    INSERT INTO clients (client_id, client_name, phone, sheet_name, last_upload_id)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    client_data['client_id'],
                    client_data['client_name'],
                    client_data.get('phone'),
                    client_data.get('sheet_name'),
                    upload_id
                ))
                return cursor.fetchone()[0]
                
        finally:
            cursor.close()
    
    def _extract_phone_from_data(self, data: Dict) -> Optional[str]:
        """Extrair telefone dos dados"""
        phone_fields = ['phone', 'telefone', 'celular', 'mobile', 'whatsapp']
        for field in phone_fields:
            if field in data and data[field]:
                phone = str(data[field]).strip()
                # Limpar telefone
                phone = re.sub(r'[^\d+]', '', phone)
                if phone and len(phone) >= 10:
                    return phone
        return None
    
    def get_all_clients(self) -> List[Dict]:
        """Obter todos os clientes"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM clients ORDER BY created_at DESC
            """)
            
            clients = cursor.fetchall()
            cursor.close()
            
            return [dict(client) for client in clients]
            
        except Exception as e:
            logger.error(f"Erro ao obter clientes: {e}")
            return []
    
    def get_client_data(self, client_id: int) -> List[Dict]:
        """Obter dados de um cliente específico"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT sd.*, c.client_name 
                FROM spreadsheet_data sd
                JOIN clients c ON sd.client_id = c.id
                WHERE c.id = %s
                ORDER BY sd.created_at DESC
            """, (client_id,))
            
            data = cursor.fetchall()
            cursor.close()
            
            return [dict(row) for row in data]
            
        except Exception as e:
            logger.error(f"Erro ao obter dados do cliente: {e}")
            return []
    
    def get_upload_history(self) -> List[Dict]:
        """Obter histórico de uploads"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            cursor.execute("""
                SELECT * FROM upload_history ORDER BY created_at DESC
            """)
            
            history = cursor.fetchall()
            cursor.close()
            
            return [dict(row) for row in history]
            
        except Exception as e:
            logger.error(f"Erro ao obter histórico: {e}")
            return []
    
    def delete_client(self, client_id: int) -> Dict:
        """Deletar cliente e seus dados"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Deletar dados relacionados
            cursor.execute("DELETE FROM spreadsheet_data WHERE client_id = %s", (client_id,))
            cursor.execute("DELETE FROM feedback WHERE client_id = %s", (client_id,))
            cursor.execute("DELETE FROM clients WHERE id = %s", (client_id,))
            
            conn.commit()
            cursor.close()
            
            return {'success': True, 'message': 'Cliente deletado com sucesso'}
            
        except Exception as e:
            logger.error(f"Erro ao deletar cliente: {e}")
            if conn:
                conn.rollback()
            return {'success': False, 'error': str(e)}
    
    def classify_feedback(self, text: str) -> Dict:
        """Classificar sentimento do texto usando TextBlob"""
        try:
            # Usar TextBlob para análise de sentimento
            blob = TextBlob(text)
            sentiment_score = blob.sentiment.polarity
            
            # Determinar sentimento
            if sentiment_score > 0.1:
                sentiment = 'positive'
                confidence = min(abs(sentiment_score) * 2, 1.0)
            elif sentiment_score < -0.1:
                sentiment = 'negative'
                confidence = min(abs(sentiment_score) * 2, 1.0)
            else:
                sentiment = 'neutral'
                confidence = 0.5
            
            return {
                'sentiment': sentiment,
                'confidence': confidence,
                'score': sentiment_score
            }
            
        except Exception as e:
            logger.error(f"Erro ao classificar feedback: {e}")
            return {
                'sentiment': 'neutral',
                'confidence': 0.0,
                'score': 0.0
            }
    
    def save_feedback(self, client_id: int, message_text: str, sentiment: str, confidence: float, score: float) -> Dict:
        """Salvar feedback no banco"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO feedback (client_id, message_text, sentiment, confidence, score)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (client_id, message_text, sentiment, confidence, score))
            
            feedback_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            
            return {'success': True, 'feedback_id': feedback_id}
            
        except Exception as e:
            logger.error(f"Erro ao salvar feedback: {e}")
            if conn:
                conn.rollback()
            return {'success': False, 'error': str(e)}

# Função para uso via linha de comando
def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python database_service.py <comando> [args...]")
        print("Comandos: setup, save_data, get_clients, classify_feedback")
        return
    
    service = RailwayDatabaseService()
    command = sys.argv[1]
    
    if command == 'setup':
        print("Banco de dados configurado com sucesso!")
    
    elif command == 'save_data':
        if len(sys.argv) < 4:
            print("Uso: python database_service.py save_data <arquivo> <modo>")
            return
        
        file_path = sys.argv[2]
        mode = sys.argv[3]
        
        # Ler dados do arquivo
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        result = service.save_spreadsheet_data(data, file_path, mode)
        print(json.dumps(result, indent=2))
    
    elif command == 'get_clients':
        clients = service.get_all_clients()
        print(json.dumps(clients, indent=2, default=str))
    
    elif command == 'classify_feedback':
        if len(sys.argv) < 3:
            print("Uso: python database_service.py classify_feedback <texto>")
            return
        
        text = sys.argv[2]
        result = service.classify_feedback(text)
        print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
