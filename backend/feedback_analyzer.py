#!/usr/bin/env python3
"""
Analisador de Feedback - Backend para análise de sentimentos
"""

import re
import json
from datetime import datetime
from typing import Dict, List, Tuple

class FeedbackAnalyzer:
    def __init__(self):
        # Palavras-chave para análise de sentimento
        self.positive_words = [
            'excelente', 'ótimo', 'bom', 'muito bom', 'perfeito', 'satisfeito',
            'gostei', 'recomendo', 'profissional', 'rápido', 'eficiente',
            'atendimento', 'resolvido', 'funcionou', 'obrigado', 'obrigada',
            'parabéns', 'sucesso', 'qualidade', 'confiança', 'segurança'
        ]
        
        self.negative_words = [
            'ruim', 'péssimo', 'horrível', 'terrível', 'insatisfeito',
            'não gostei', 'problema', 'erro', 'falha', 'demora',
            'lento', 'ineficiente', 'mal atendimento', 'não funcionou',
            'decepcionado', 'frustrado', 'irritado', 'chateado', 'reclamação'
        ]
        
        self.neutral_words = [
            'adequado', 'normal', 'regular', 'aceitável', 'satisfatório',
            'ok', 'tudo bem', 'funciona', 'resolvido', 'concluído'
        ]
        
        # Emojis para remoção
        self.emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags (iOS)
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+", flags=re.UNICODE
        )

    def clean_text(self, text: str) -> str:
        """Remove emojis e caracteres especiais do texto"""
        if not text:
            return ""
        
        # Remove emojis
        text = self.emoji_pattern.sub('', text)
        
        # Remove caracteres especiais excessivos
        text = re.sub(r'[^\w\s\.\,\!\?\-]', '', text)
        
        # Remove espaços múltiplos
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()

    def analyze_sentiment(self, text: str) -> Tuple[str, float, List[str]]:
        """
        Analisa o sentimento do texto
        Retorna: (sentimento, score, palavras_chave)
        """
        if not text:
            return 'neutral', 0.0, []
        
        # Limpa o texto
        clean_text = self.clean_text(text.lower())
        
        # Conta palavras positivas e negativas
        positive_count = sum(1 for word in self.positive_words if word in clean_text)
        negative_count = sum(1 for word in self.negative_words if word in clean_text)
        neutral_count = sum(1 for word in self.neutral_words if word in clean_text)
        
        # Calcula score
        total_words = len(clean_text.split())
        if total_words == 0:
            return 'neutral', 0.0, []
        
        positive_score = positive_count / total_words
        negative_score = negative_count / total_words
        neutral_score = neutral_count / total_words
        
        # Determina sentimento
        if positive_score > negative_score and positive_score > 0.1:
            sentiment = 'positive'
            score = positive_score
        elif negative_score > positive_score and negative_score > 0.1:
            sentiment = 'negative'
            score = negative_score
        else:
            sentiment = 'neutral'
            score = neutral_score
        
        # Extrai palavras-chave
        keywords = self.extract_keywords(clean_text)
        
        return sentiment, score, keywords

    def extract_keywords(self, text: str) -> List[str]:
        """Extrai palavras-chave relevantes do texto"""
        keywords = []
        
        # Palavras-chave técnicas
        tech_keywords = [
            'internet', 'wi-fi', 'rede', 'conexão', 'velocidade',
            'roteador', 'modem', 'cabo', 'fibra', 'instalação',
            'manutenção', 'reparo', 'técnico', 'atendimento',
            'suporte', 'problema', 'solução', 'configuração'
        ]
        
        # Palavras-chave de qualidade
        quality_keywords = [
            'rápido', 'lento', 'eficiente', 'profissional',
            'qualidade', 'satisfeito', 'insatisfeito', 'bom', 'ruim'
        ]
        
        # Busca palavras-chave no texto
        for keyword in tech_keywords + quality_keywords:
            if keyword in text:
                keywords.append(keyword)
        
        return keywords[:5]  # Limita a 5 palavras-chave

    def process_message(self, message_data: Dict) -> Dict:
        """
        Processa uma mensagem e retorna análise de feedback
        """
        text = message_data.get('text', '')
        contact_id = message_data.get('contact_id')
        contact_name = message_data.get('contact_name', 'Cliente')
        contact_phone = message_data.get('contact_phone', '')
        timestamp = message_data.get('timestamp', datetime.now().isoformat())
        
        # Analisa sentimento
        sentiment, score, keywords = self.analyze_sentiment(text)
        
        # Cria feedback
        feedback = {
            'id': f"fb_{contact_id}_{int(datetime.now().timestamp())}",
            'contact_id': contact_id,
            'contact_name': contact_name,
            'contact_phone': contact_phone,
            'text': self.clean_text(text),
            'original_text': text,
            'sentiment': sentiment,
            'score': score,
            'keywords': keywords,
            'date': timestamp,
            'processed_at': datetime.now().isoformat()
        }
        
        return feedback

    def batch_analyze(self, messages: List[Dict]) -> List[Dict]:
        """Analisa múltiplas mensagens em lote"""
        feedbacks = []
        
        for message in messages:
            feedback = self.process_message(message)
            if feedback['sentiment'] != 'neutral' or len(feedback['keywords']) > 0:
                feedbacks.append(feedback)
        
        return feedbacks

    def get_sentiment_stats(self, feedbacks: List[Dict]) -> Dict:
        """Calcula estatísticas dos feedbacks"""
        total = len(feedbacks)
        if total == 0:
            return {
                'total': 0,
                'positive': 0,
                'negative': 0,
                'neutral': 0,
                'positive_percent': 0,
                'negative_percent': 0,
                'neutral_percent': 0
            }
        
        positive = len([f for f in feedbacks if f['sentiment'] == 'positive'])
        negative = len([f for f in feedbacks if f['sentiment'] == 'negative'])
        neutral = len([f for f in feedbacks if f['sentiment'] == 'neutral'])
        
        return {
            'total': total,
            'positive': positive,
            'negative': negative,
            'neutral': neutral,
            'positive_percent': round((positive / total) * 100, 1),
            'negative_percent': round((negative / total) * 100, 1),
            'neutral_percent': round((neutral / total) * 100, 1)
        }

# Instância global
feedback_analyzer = FeedbackAnalyzer()
