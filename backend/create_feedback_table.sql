-- Tabela de Feedbacks para análise de sentimentos
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
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feedbacks_sentiment ON feedbacks(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedbacks_timestamp ON feedbacks(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedbacks_contact_phone ON feedbacks(contact_phone);

-- Comentários da tabela
COMMENT ON TABLE feedbacks IS 'Tabela para armazenar feedbacks analisados dos clientes';
COMMENT ON COLUMN feedbacks.feedback_id IS 'ID único do feedback';
COMMENT ON COLUMN feedbacks.contact_name IS 'Nome do contato';
COMMENT ON COLUMN feedbacks.contact_phone IS 'Telefone do contato';
COMMENT ON COLUMN feedbacks.text IS 'Texto da mensagem limpo';
COMMENT ON COLUMN feedbacks.sentiment IS 'Sentimento: positive, negative, neutral';
COMMENT ON COLUMN feedbacks.score IS 'Score de confiança da análise (0-1)';
COMMENT ON COLUMN feedbacks.keywords IS 'Palavras-chave extraídas (JSON)';
COMMENT ON COLUMN feedbacks.timestamp IS 'Timestamp da mensagem original';
COMMENT ON COLUMN feedbacks.analyzed_at IS 'Timestamp da análise';
COMMENT ON COLUMN feedbacks.created_at IS 'Timestamp de criação do registro';

-- Verificar se a tabela foi criada
SELECT 'Tabela feedbacks criada com sucesso!' as status;
