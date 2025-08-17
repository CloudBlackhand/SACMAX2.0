const logger = require('../utils/logger');

class FeedbackClassifier {
    constructor() {
        // Palavras-chave para classificação
        this.positiveKeywords = [
            'obrigado', 'obrigada', 'muito obrigado', 'valeu', 'top', 'excelente',
            'ótimo', 'maravilhoso', 'perfeito', 'bom', 'muito bom', 'adorei',
            'gostei', 'sensacional', 'incrível', 'fantástico', 'parabéns',
            'recomendo', 'indico', 'nota 10', 'nota10', '5 estrelas', 'cinco estrelas',
            'muito satisfeito', 'muito satisfeita', 'atendimento excelente',
            'serviço excelente', 'qualidade', 'rapidez', 'eficiência', 'profissional'
        ];

        this.negativeKeywords = [
            'ruim', 'péssimo', 'horrível', 'terrível', 'lamentável', 'decepcionante',
            'frustrado', 'frustrada', 'insatisfeito', 'insatisfeita', 'irritado',
            'irritada', 'chateado', 'chateada', 'problema', 'problemas', 'defeito',
            'defeitos', 'erro', 'erros', 'falha', 'falhou', 'demora', 'lento',
            'péssimo atendimento', 'não recomendo', 'não indico', 'pior', 'piorou',
            'piorou muito', 'péssima experiência', 'experiência ruim', 'fraco'
        ];

        this.neutralKeywords = [
            'ok', 'entendi', 'certo', 'tudo bem', 'tranquilo', 'blz', 'beleza',
            'normal', 'regular', 'mais ou menos', 'razoável', 'mediano'
        ];
    }

    async classify(messages) {
        try {
            if (!Array.isArray(messages)) {
                throw new Error('Messages deve ser um array');
            }

            const results = messages.map(message => this.classifySingleMessage(message));
            
            logger.info('Feedback classificado', {
                totalMessages: messages.length,
                positive: results.filter(r => r.classification === 'positive').length,
                negative: results.filter(r => r.classification === 'negative').length,
                neutral: results.filter(r => r.classification === 'neutral').length
            });

            return results;

        } catch (error) {
            logger.error('Erro ao classificar feedback', error);
            throw error;
        }
    }

    classifySingleMessage(message) {
        const text = this.normalizeText(message.text || message.body || message.message || '');
        
        if (!text) {
            return {
                original: message,
                classification: 'neutral',
                confidence: 0,
                reason: 'mensagem vazia'
            };
        }

        const positiveScore = this.calculateScore(text, this.positiveKeywords);
        const negativeScore = this.calculateScore(text, this.negativeKeywords);
        const neutralScore = this.calculateScore(text, this.neutralKeywords);

        let classification = 'neutral';
        let confidence = 0;
        let reason = '';

        // Determinar classificação baseada nos scores
        if (positiveScore > negativeScore && positiveScore > neutralScore) {
            classification = 'positive';
            confidence = Math.min(positiveScore / 10, 1);
            reason = 'keywords positivos encontrados';
        } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
            classification = 'negative';
            confidence = Math.min(negativeScore / 10, 1);
            reason = 'keywords negativos encontrados';
        } else if (neutralScore >= positiveScore && neutralScore >= negativeScore) {
            classification = 'neutral';
            confidence = Math.min(neutralScore / 10, 0.8);
            reason = 'mensagem neutra ou ausência de sentimentos fortes';
        } else {
            classification = 'neutral';
            confidence = 0.5;
            reason = 'inconclusivo';
        }

        // Ajustar confiança baseada na presença de negações
        if (this.containsNegation(text)) {
            confidence *= 0.7;
            if (classification === 'positive') {
                classification = 'negative';
                reason = 'negação encontrada em mensagem positiva';
            } else if (classification === 'negative') {
                classification = 'positive';
                reason = 'negação encontrada em mensagem negativa';
            }
        }

        return {
            original: message,
            classification,
            confidence: Math.round(confidence * 100) / 100,
            reason,
            scores: {
                positive: positiveScore,
                negative: negativeScore,
                neutral: neutralScore
            },
            text: text.substring(0, 200) // Limitar texto para logs
        };
    }

    calculateScore(text, keywords) {
        let score = 0;
        const lowerText = text.toLowerCase();
        
        keywords.forEach(keyword => {
            const matches = (lowerText.match(new RegExp(keyword, 'gi')) || []);
            score += matches.length * this.getKeywordWeight(keyword);
        });

        return score;
    }

    getKeywordWeight(keyword) {
        // Palavras mais específicas têm maior peso
        if (keyword.length > 8) return 2;
        if (keyword.length > 5) return 1.5;
        return 1;
    }

    containsNegation(text) {
        const negations = [
            'não', 'nao', 'nunca', 'jamais', 'nenhum', 'nenhuma', 'nada',
            'nenhum', 'nenhuma', 'nem', 'nenhum dos', 'nenhuma das'
        ];
        
        const lowerText = text.toLowerCase();
        return negations.some(negation => lowerText.includes(negation));
    }

    normalizeText(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^\w\s]/g, ' ') // Remover caracteres especiais
            .replace(/\s+/g, ' ') // Normalizar espaços
            .trim();
    }

    async getClassificationStats(classifications) {
        const stats = {
            total: classifications.length,
            positive: 0,
            negative: 0,
            neutral: 0,
            averageConfidence: 0
        };

        classifications.forEach(result => {
            stats[result.classification]++;
            stats.averageConfidence += result.confidence;
        });

        if (stats.total > 0) {
            stats.averageConfidence = Math.round((stats.averageConfidence / stats.total) * 100) / 100;
        }

        return stats;
    }

    async exportResults(classifications, format = 'json') {
        const stats = await this.getClassificationStats(classifications);
        
        const exportData = {
            timestamp: new Date().toISOString(),
            statistics: stats,
            classifications: classifications.map(c => ({
                id: c.original.id || Date.now() + Math.random(),
                classification: c.classification,
                confidence: c.confidence,
                text: c.text,
                timestamp: c.original.timestamp || new Date().toISOString()
            }))
        };

        return exportData;
    }
}

module.exports = FeedbackClassifier;