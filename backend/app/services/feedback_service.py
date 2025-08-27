#!/usr/bin/env python3
"""
Serviço de Feedback - Gerencia feedbacks no banco de dados
"""

import json
from datetime import datetime
from typing import List, Dict, Optional
import logging
from .sentiment_analyzer import sentiment_analyzer

logger = logging.getLogger(__name__)

class FeedbackService:
    def __init__(self, db_manager=None):
        self.db_manager = db_manager
        self.table_name = 'feedbacks'
        
    def create_feedback_table(self):
        """Cria a tabela de feedbacks se não existir"""
        try:
            if not self.db_manager:
                logger.warning("DB Manager não disponível, usando fallback")
                return False
                
            query = """
            CREATE TABLE IF NOT EXISTS feedbacks (
                id SERIAL PRIMARY KEY,
                feedback_id VARCHAR(50) UNIQUE,
                contact_name VARCHAR(100),
                contact_phone VARCHAR(20),
                text TEXT,
                sentiment VARCHAR(20),
                score DECIMAL(5,4),
                keywords JSON,
                timestamp TIMESTAMP,
                analyzed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            
            self.db_manager.execute_query(query)
            logger.info("Tabela de feedbacks criada/verificada")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao criar tabela de feedbacks: {e}")
            return False

    def save_feedback(self, feedback_data: Dict) -> bool:
        """Salva um feedback no banco de dados"""
        try:
            if not self.db_manager:
                logger.warning("DB Manager não disponível, usando fallback")
                return False
                
            # Garante que a tabela existe
            self.create_feedback_table()
            
            query = """
            INSERT INTO feedbacks (
                feedback_id, contact_name, contact_phone, text, 
                sentiment, score, keywords, timestamp, analyzed_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (feedback_id) DO UPDATE SET
                contact_name = EXCLUDED.contact_name,
                contact_phone = EXCLUDED.contact_phone,
                text = EXCLUDED.text,
                sentiment = EXCLUDED.sentiment,
                score = EXCLUDED.score,
                keywords = EXCLUDED.keywords,
                timestamp = EXCLUDED.timestamp,
                analyzed_at = EXCLUDED.analyzed_at
            """
            
            values = (
                feedback_data.get('id'),
                feedback_data.get('contact_name'),
                feedback_data.get('contact_phone'),
                feedback_data.get('text'),
                feedback_data.get('sentiment'),
                feedback_data.get('score'),
                json.dumps(feedback_data.get('keywords', [])),
                feedback_data.get('timestamp'),
                feedback_data.get('analyzed_at')
            )
            
            self.db_manager.execute_query(query, values)
            logger.info(f"Feedback salvo: {feedback_data.get('id')}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao salvar feedback: {e}")
            return False

    def get_all_feedbacks(self, limit: int = 100) -> List[Dict]:
        """Busca todos os feedbacks do banco"""
        try:
            if not self.db_manager:
                logger.warning("DB Manager não disponível, retornando lista vazia")
                return []
                
            query = """
            SELECT 
                feedback_id, contact_name, contact_phone, text,
                sentiment, score, keywords, timestamp, analyzed_at
            FROM feedbacks 
            ORDER BY timestamp DESC 
            LIMIT %s
            """
            
            results = self.db_manager.fetch_all(query, (limit,))
            
            feedbacks = []
            for row in results:
                feedback = {
                    'id': row[0],
                    'contact_name': row[1],
                    'contact_phone': row[2],
                    'text': row[3],
                    'sentiment': row[4],
                    'score': float(row[5]) if row[5] else 0.0,
                    'keywords': json.loads(row[6]) if row[6] else [],
                    'timestamp': row[7].isoformat() if row[7] else None,
                    'analyzed_at': row[8].isoformat() if row[8] else None
                }
                feedbacks.append(feedback)
            
            logger.info(f"Retornados {len(feedbacks)} feedbacks")
            return feedbacks
            
        except Exception as e:
            logger.error(f"Erro ao buscar feedbacks: {e}")
            return []

    def get_feedbacks_by_sentiment(self, sentiment: str, limit: int = 50, days: int = None) -> List[Dict]:
        """Busca feedbacks por sentimento e período"""
        try:
            if not self.db_manager:
                return []
            
            if days:
                query = """
                SELECT 
                    feedback_id, contact_name, contact_phone, text,
                    sentiment, score, keywords, timestamp, analyzed_at
                FROM feedbacks 
                WHERE sentiment = %s AND timestamp >= NOW() - INTERVAL '%s days'
                ORDER BY timestamp DESC 
                LIMIT %s
                """
                results = self.db_manager.fetch_all(query, (sentiment, days, limit))
            else:
                query = """
                SELECT 
                    feedback_id, contact_name, contact_phone, text,
                    sentiment, score, keywords, timestamp, analyzed_at
                FROM feedbacks 
                WHERE sentiment = %s
                ORDER BY timestamp DESC 
                LIMIT %s
                """
                results = self.db_manager.fetch_all(query, (sentiment, limit))
            
            feedbacks = []
            for row in results:
                feedback = {
                    'id': row[0],
                    'contact_name': row[1],
                    'contact_phone': row[2],
                    'text': row[3],
                    'sentiment': row[4],
                    'score': float(row[5]) if row[5] else 0.0,
                    'keywords': json.loads(row[6]) if row[6] else [],
                    'timestamp': row[7].isoformat() if row[7] else None,
                    'analyzed_at': row[8].isoformat() if row[8] else None
                }
                feedbacks.append(feedback)
            
            return feedbacks
            
        except Exception as e:
            logger.error(f"Erro ao buscar feedbacks por sentimento: {e}")
            return []

    def get_feedbacks_by_date_range(self, days: int, limit: int = 100) -> List[Dict]:
        """Busca feedbacks por período de dias"""
        try:
            if not self.db_manager:
                return []
                
            query = """
            SELECT 
                feedback_id, contact_name, contact_phone, text,
                sentiment, score, keywords, timestamp, analyzed_at
            FROM feedbacks 
            WHERE timestamp >= NOW() - INTERVAL '%s days'
            ORDER BY timestamp DESC 
            LIMIT %s
            """
            
            results = self.db_manager.fetch_all(query, (days, limit))
            
            feedbacks = []
            for row in results:
                feedback = {
                    'id': row[0],
                    'contact_name': row[1],
                    'contact_phone': row[2],
                    'text': row[3],
                    'sentiment': row[4],
                    'score': float(row[5]) if row[5] else 0.0,
                    'keywords': json.loads(row[6]) if row[6] else [],
                    'timestamp': row[7].isoformat() if row[7] else None,
                    'analyzed_at': row[8].isoformat() if row[8] else None
                }
                feedbacks.append(feedback)
            
            return feedbacks
            
        except Exception as e:
            logger.error(f"Erro ao buscar feedbacks por período: {e}")
            return []

    def get_feedback_stats_by_date(self, days: int = None) -> Dict:
        """Retorna estatísticas dos feedbacks por período"""
        try:
            if not self.db_manager:
                return {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}
            
            if days:
                query = """
                SELECT 
                    sentiment,
                    COUNT(*) as count
                FROM feedbacks 
                WHERE timestamp >= NOW() - INTERVAL '%s days'
                GROUP BY sentiment
                """
                results = self.db_manager.fetch_all(query, (days,))
            else:
                query = """
                SELECT 
                    sentiment,
                    COUNT(*) as count
                FROM feedbacks 
                GROUP BY sentiment
                """
                results = self.db_manager.fetch_all(query)
            
            stats = {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}
            
            for row in results:
                sentiment = row[0]
                count = row[1]
                stats[sentiment] = count
                stats['total'] += count
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas por período: {e}")
            return {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}

    def get_feedback_stats(self) -> Dict:
        """Retorna estatísticas dos feedbacks"""
        try:
            if not self.db_manager:
                return {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}
                
            query = """
            SELECT 
                sentiment,
                COUNT(*) as count
            FROM feedbacks 
            GROUP BY sentiment
            """
            
            results = self.db_manager.fetch_all(query)
            
            stats = {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}
            
            for row in results:
                sentiment = row[0]
                count = row[1]
                stats[sentiment] = count
                stats['total'] += count
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas: {e}")
            return {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0}

    def analyze_and_save_message(self, message_data: Dict) -> Dict:
        """Analisa uma mensagem e salva como feedback"""
        try:
            # Analisa a mensagem
            feedback_data = sentiment_analyzer.analyze_message(message_data)
            
            if not feedback_data:
                logger.error("Falha na análise da mensagem")
                return {}
            
            # Salva no banco
            success = self.save_feedback(feedback_data)
            
            if success:
                logger.info(f"Feedback analisado e salvo: {feedback_data.get('id')}")
                return feedback_data
            else:
                logger.error("Falha ao salvar feedback")
                return feedback_data  # Retorna mesmo sem salvar
                
        except Exception as e:
            logger.error(f"Erro ao analisar e salvar mensagem: {e}")
            return {}

# Instância global do serviço
feedback_service = FeedbackService()

