-- Schema otimizado para Supabase - Sistema de Gestão de Feedback
-- Otimizado para Railway: 2 vcores, 1GB RAM

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Upload Sessions Table (otimizado para Railway)
CREATE TABLE upload_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('client_data', 'contacts')),
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients Table (otimizado)
CREATE TABLE clients_optimized (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    additional_data JSONB DEFAULT '{}',
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Metrics Table (para análise)
CREATE TABLE client_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients_optimized(id) ON DELETE CASCADE,
    total_messages_sent INTEGER DEFAULT 0,
    last_message_date TIMESTAMP WITH TIME ZONE,
    response_rate DECIMAL(3,2) DEFAULT 0.00,
    feedback_sentiment VARCHAR(20) DEFAULT 'neutral',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id)
);

-- Sent Contacts Table (histórico de mensagens)
CREATE TABLE sent_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients_optimized(id) ON DELETE CASCADE,
    upload_session_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL,
    message_template VARCHAR(100),
    message_content TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    delivery_error TEXT,
    platform VARCHAR(20) DEFAULT 'whatsapp',
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Feedback Entries Table
CREATE TABLE feedback_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients_optimized(id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    sentiment VARCHAR(20) DEFAULT 'neutral',
    category VARCHAR(50),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes otimizados para Railway
CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_upload_sessions_created_at ON upload_sessions(created_at DESC);
CREATE INDEX idx_clients_optimized_client_key ON clients_optimized(client_key);
CREATE INDEX idx_clients_optimized_phone ON clients_optimized(phone);
CREATE INDEX idx_clients_optimized_name ON clients_optimized(name);
CREATE INDEX idx_sent_contacts_client_id ON sent_contacts(client_id);
CREATE INDEX idx_sent_contacts_sent_at ON sent_contacts(sent_at DESC);
CREATE INDEX idx_sent_contacts_delivery_status ON sent_contacts(delivery_status);
CREATE INDEX idx_feedback_entries_client_id ON feedback_entries(client_id);
CREATE INDEX idx_feedback_entries_created_at ON feedback_entries(created_at DESC);

-- Full-text search index
CREATE INDEX idx_clients_search ON clients_optimized USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(phone, '')));

-- Views para dashboard (otimizadas)
CREATE OR REPLACE VIEW contacts_sent_view AS
SELECT 
    sc.id,
    sc.client_id,
    co.name as client_name,
    co.phone as client_phone,
    sc.message_content,
    sc.sent_at,
    sc.delivery_status,
    sc.platform,
    us.filename as source_file
FROM sent_contacts sc
JOIN clients_optimized co ON sc.client_id = co.id
LEFT JOIN upload_sessions us ON sc.upload_session_id = us.id;

CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM clients_optimized) as total_contacts,
    (SELECT COUNT(*) FROM sent_contacts) as total_messages_sent,
    (SELECT COUNT(*) FROM sent_contacts WHERE delivery_status = 'delivered') as messages_delivered,
    (SELECT COUNT(*) FROM sent_contacts WHERE delivery_status = 'failed') as messages_failed,
    (SELECT COUNT(*) FROM upload_sessions WHERE status = 'completed') as total_uploads,
    (SELECT COUNT(*) FROM feedback_entries) as total_feedback;

CREATE OR REPLACE VIEW upload_history_view AS
SELECT 
    id,
    filename,
    mode,
    total_records,
    processed_records,
    failed_records,
    status,
    created_at,
    completed_at,
    ROUND(CAST((processed_records::float / NULLIF(total_records, 0)) * 100 AS numeric), 2) as completion_percentage
FROM upload_sessions
ORDER BY created_at DESC;

-- Functions para automação
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_clients_optimized_updated_at BEFORE UPDATE ON clients_optimized
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_sessions_updated_at BEFORE UPDATE ON upload_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_metrics_updated_at BEFORE UPDATE ON client_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function para limpar dados antigos (manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_data(cutoff_date TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Limpar sessões antigas (mantém últimas 30 dias)
    DELETE FROM upload_sessions 
    WHERE created_at < cutoff_date 
    AND status = 'completed';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpar logs antigos de mensagens (mantém últimos 60 dias)
    DELETE FROM sent_contacts 
    WHERE sent_at < cutoff_date;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function para busca inteligente de contatos
CREATE OR REPLACE FUNCTION search_contacts(search_term TEXT, limit_count INTEGER DEFAULT 50)
RETURNS TABLE(
    id UUID,
    client_key VARCHAR,
    name VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    last_interaction TIMESTAMP,
    total_messages INTEGER,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.client_key,
        c.name,
        c.phone,
        c.email,
        c.last_interaction,
        COALESCE(cm.total_messages_sent, 0) as total_messages,
        CASE 
            WHEN c.name ILIKE '%' || search_term || '%' THEN 1.0
            WHEN c.phone ILIKE '%' || search_term || '%' THEN 0.8
            WHEN c.email ILIKE '%' || search_term || '%' THEN 0.6
            ELSE 0.0
        END as similarity_score
    FROM clients_optimized c
    LEFT JOIN client_metrics cm ON c.id = cm.client_id
    WHERE 
        c.name ILIKE '%' || search_term || '%' OR
        c.phone ILIKE '%' || search_term || '%' OR
        c.email ILIKE '%' || search_term || '%'
    ORDER BY similarity_score DESC, c.last_interaction DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Configurações de performance para Railway (aplicadas via configuração do banco, não ALTER SYSTEM)
-- Estas configurações devem ser aplicadas manualmente no dashboard do Supabase:
-- shared_buffers = 256MB
-- effective_cache_size = 768MB
-- maintenance_work_mem = 64MB
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
-- random_page_cost = 1.1
-- effective_io_concurrency = 200
-- work_mem = 4MB
-- min_wal_size = 1GB
-- max_wal_size = 4GB

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Comentários para documentação
COMMENT ON TABLE upload_sessions IS 'Registro de uploads de planilhas com status e contadores';
COMMENT ON TABLE clients_optimized IS 'Clientes únicos otimizados para busca rápida';
COMMENT ON TABLE sent_contacts IS 'Histórico de mensagens enviadas com status de entrega';
COMMENT ON TABLE feedback_entries IS 'Feedback recebido dos clientes com análise de sentimento';