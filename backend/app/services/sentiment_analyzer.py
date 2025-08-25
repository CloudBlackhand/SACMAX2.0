#!/usr/bin/env python3
"""
Analisador de Sentimentos - Módulo dedicado para análise de feedback
Sistema independente e melhorável para catalogação de mensagens
"""

import re
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    def __init__(self):
        # Palavras-chave para análise de sentimento (melhoráveis com o tempo)
        self.positive_words = [
            'excelente', 'ótimo', 'bom', 'muito bom', 'perfeito', 'satisfeito',
            'gostei', 'recomendo', 'profissional', 'rápido', 'eficiente',
            'atendimento', 'resolvido', 'funcionou', 'obrigado', 'obrigada',
            'parabéns', 'sucesso', 'qualidade', 'confiança', 'segurança',
            'maravilhoso', 'fantástico', 'incrível', 'espetacular', 'top',
            'show', 'demais', 'muito bem', 'perfeito', 'satisfeito',
            'feliz', 'contento', 'agradecido', 'gratidão', 'recomendação'
        ]
        
        self.negative_words = [
            'ruim', 'péssimo', 'horrível', 'terrível', 'insatisfeito',
            'não gostei', 'problema', 'erro', 'falha', 'demora',
            'lento', 'ineficiente', 'mal atendimento', 'não funcionou',
            'decepcionado', 'frustrado', 'irritado', 'chateado', 'reclamação',
            'pessimo', 'horrivel', 'terrivel', 'insatisfeito', 'nao gostei',
            'problemas', 'erros', 'falhas', 'demoras', 'lento',
            'ineficiente', 'mal atendimento', 'nao funcionou', 'decepcionado',
            'frustrado', 'irritado', 'chateado', 'reclamacao', 'pior',
            'inaceitável', 'inaceitavel', 'inadmissível', 'inadmissivel'
        ]
        
        self.neutral_words = [
            'adequado', 'normal', 'regular', 'aceitável', 'satisfatório',
            'ok', 'tudo bem', 'funciona', 'resolvido', 'concluído',
            'adequado', 'normal', 'regular', 'aceitavel', 'satisfatorio',
            'ok', 'tudo bem', 'funciona', 'resolvido', 'concluido',
            'básico', 'basico', 'padrão', 'padrao', 'comum'
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

    def extract_keywords(self, text: str) -> List[str]:
        """Extrai palavras-chave relevantes do texto"""
        if not text:
            return []
        
        # Palavras comuns para remover
        stop_words = {
            'a', 'o', 'e', 'é', 'de', 'do', 'da', 'em', 'um', 'para', 'com',
            'não', 'nao', 'uma', 'os', 'as', 'se', 'que', 'por', 'mais',
            'as', 'como', 'mas', 'foi', 'ele', 'das', 'tem', 'à', 'seu',
            'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está',
            'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela',
            'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus',
            'suas', 'meu', 'minha', 'teu', 'tua', 'nosso', 'nossa', 'deles',
            'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles',
            'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão',
            'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos',
            'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos',
            'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver',
            'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve',
            'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos',
            'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver',
            'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos',
            'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos',
            'são', 'era', 'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram',
            'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos',
            'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos',
            'serão', 'seria', 'seríamos', 'seriam', 'tenho', 'tem', 'temos',
            'têm', 'tinha', 'tínhamos', 'tinham', 'tive', 'teve', 'tivemos',
            'tiveram', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham',
            'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem',
            'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam'
        }
        
        # Divide o texto em palavras
        words = text.lower().split()
        
        # Filtra palavras relevantes
        keywords = []
        for word in words:
            if (len(word) > 2 and 
                word not in stop_words and
                word in self.positive_words + self.negative_words + self.neutral_words):
                keywords.append(word)
        
        return list(set(keywords))[:10]  # Máximo 10 palavras-chave

    def analyze_sentiment(self, text: str) -> Tuple[str, float, List[str]]:
        """
        Analisa o sentimento do texto
        Retorna: (sentimento, score, palavras_chave)
        """
        if not text:
            return 'neutral', 0.0, []
        
        try:
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
            
            # Determina sentimento com threshold
            if positive_score > negative_score and positive_score > 0.05:
                sentiment = 'positive'
                score = positive_score
            elif negative_score > positive_score and negative_score > 0.05:
                sentiment = 'negative'
                score = negative_score
            else:
                sentiment = 'neutral'
                score = neutral_score
            
            # Extrai palavras-chave
            keywords = self.extract_keywords(clean_text)
            
            logger.info(f"Análise de sentimento: {sentiment} (score: {score:.3f}) para texto: {text[:50]}...")
            
            return sentiment, score, keywords
            
        except Exception as e:
            logger.error(f"Erro na análise de sentimento: {e}")
            return 'neutral', 0.0, []

    def analyze_message(self, message_data: Dict) -> Dict:
        """
        Analisa uma mensagem completa e retorna dados estruturados
        """
        try:
            text = message_data.get('text', '')
            contact_name = message_data.get('contact_name', 'Cliente')
            contact_phone = message_data.get('contact_phone', '')
            timestamp = message_data.get('timestamp', datetime.now().isoformat())
            
            # Analisa sentimento
            sentiment, score, keywords = self.analyze_sentiment(text)
            
            # Cria resultado estruturado
            result = {
                'id': f"feedback_{int(datetime.now().timestamp())}",
                'contact_name': contact_name,
                'contact_phone': contact_phone,
                'text': text,
                'sentiment': sentiment,
                'score': score,
                'keywords': keywords,
                'timestamp': timestamp,
                'analyzed_at': datetime.now().isoformat()
            }
            
            logger.info(f"Feedback analisado: {contact_name} - {sentiment}")
            return result
            
        except Exception as e:
            logger.error(f"Erro ao analisar mensagem: {e}")
            return {}

# Instância global do analisador
sentiment_analyzer = SentimentAnalyzer()

