-- Schema otimizado para Supabase com performance para Railway (2 vcores, 1GB RAM)
-- Foco em eficiência de memória e queries rápidas

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca textual eficiente

-- Tabela de sessões de upload otimizada
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER DEFAULT 0,
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('client_data', 'contacts')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_records INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes otimizada
CREATE TABLE IF NOT EXISTS clients_optimized (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_key VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(500) NOT NULL,
    phone_normalized VARCHAR(20),
    email VARCHAR(255),
    source VARCHAR(50) DEFAULT 'spreadsheet',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de métricas do cliente
CREATE TABLE IF NOT EXISTS client_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients_optimized(id) ON DELETE CASCADE,
    date_record DATE NOT NULL,
    upload_session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
    sheet_name VARCHAR(100),
    row_number INTEGER,
    data_hash VARCHAR(64),
    metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, date_record, upload_session_id)
);

-- Tabela de contatos enviados
CREATE TABLE IF NOT EXISTS sent_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients_optimized(id) ON DELETE CASCADE,
    upload_session_id UUID REFERENCES upload_sessions(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(500),
    message_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    message_content TEXT,
    delivery_response JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de feedback
CREATE TABLE IF NOT EXISTS feedback_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients_optimized(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    feedback_text TEXT,
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    category VARCHAR(50),
    confidence_score DECIMAL(3,2),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices otimizados para performance
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_created ON upload_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clients_key ON clients_optimized(client_key);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients_optimized(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON clients_optimized USING gin(display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_client_metrics_client ON client_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_client_metrics_date ON client_metrics(date_record);
CREATE INDEX IF NOT EXISTS idx_client_metrics_session ON client_metrics(upload_session_id);

CREATE INDEX IF NOT EXISTS idx_sent_contacts_client ON sent_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_sent_contacts_phone ON sent_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_sent_contacts_status ON sent_contacts(delivery_status);
CREATE INDEX IF NOT EXISTS idx_sent_contacts_created ON sent_contacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_client ON feedback_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_feedback_phone ON feedback_entries(phone);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback_entries(sentiment);

-- Coluna de busca full-text
ALTER TABLE clients_optimized 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    to_tsvector('portuguese', 
        coalesce(display_name, '') || ' ' || 
        coalesce(phone_normalized, '') || ' ' || 
        coalesce(email, '')
    )
) STORED;

CREATE INDEX IF NOT EXISTS idx_clients_search ON clients_optimized USING gin(search_vector);

-- View otimizada para visualização de contatos enviados
CREATE OR REPLACE VIEW contacts_sent_view AS
SELECT 
    sc.id,
    sc.phone,
    sc.name,
    sc.message_sent,
    sc.sent_at,
    sc.delivery_status,
    sc.message_content,
    sc.created_at,
    co.display_name,
    co.phone_normalized,
    us.file_name,
    us.created_at as upload_date,
    us.status as upload_status
FROM sent_contacts sc
JOIN clients_optimized co ON sc.client_id = co.id
LEFT JOIN upload_sessions us ON sc.upload_session_id = us.id
ORDER BY sc.created_at DESC;

-- View para dashboard stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM clients_optimized) as total_clients,
    (SELECT COUNT(*) FROM sent_contacts WHERE message_sent = true) as total_sent,
    (SELECT COUNT(*) FROM sent_contacts WHERE delivery_status = 'delivered') as total_delivered,
    (SELECT COUNT(*) FROM feedback_entries) as total_feedback,
    (SELECT COUNT(*) FROM upload_sessions WHERE status = 'completed') as successful_uploads,
    (SELECT COUNT(*) FROM upload_sessions WHERE created_at >= NOW() - INTERVAL '30 days') as uploads_30_days;

-- View para histórico de uploads com contatos
CREATE OR REPLACE VIEW upload_history_view AS
SELECT 
    us.id,
    us.file_name,
    us.mode,
    us.status,
    us.processed_records,
    ROUND(us.processing_time_ms::numeric/1000, 2) as processing_time_seconds,
    us.created_at,
    COUNT(sc.id) as total_contacts,
    COUNT(CASE WHEN sc.message_sent = true THEN 1 END) as sent_contacts,
    COUNT(CASE WHEN sc.delivery_status = 'delivered' THEN 1 END) as delivered_contacts
FROM upload_sessions us
LEFT JOIN sent_contacts sc ON us.id = sc.upload_session_id
GROUP BY us.id, us.file_name, us.mode, us.status, us.processed_records, us.processing_time_ms, us.created_at
ORDER BY us.created_at DESC;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualização automática
CREATE TRIGGER update_upload_sessions_updated_at BEFORE UPDATE ON upload_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_optimized_updated_at BEFORE UPDATE ON clients_optimized
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_metrics_updated_at BEFORE UPDATE ON client_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sent_contacts_updated_at BEFORE UPDATE ON sent_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_entries_updated_at BEFORE UPDATE ON feedback_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar dados antigos (otimizada para memória)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS VOID AS $$
BEGIN
    -- Limpar sessões antigas completas
    DELETE FROM upload_sessions 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND status = 'completed';
    
    -- Limpar métricas antigas mantendo clientes
    DELETE FROM client_metrics 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Limpar feedback antigo
    DELETE FROM feedback_entries 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    -- Limpar contatos enviados antigos
    DELETE FROM sent_contacts 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND delivery_status = 'delivered';
END;
$$ LANGUAGE plpgsql;

-- Função para busca inteligente de contatos
CREATE OR REPLACE FUNCTION search_contacts(search_term TEXT)
RETURNS TABLE(
    id UUID,
    display_name VARCHAR(500),
    phone VARCHAR(20),
    email VARCHAR(255),
    last_sent TIMESTAMP WITH TIME ZONE,
    total_sent INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.display_name,
        c.phone_normalized,
        c.email,
        MAX(sc.sent_at) as last_sent,
        COUNT(sc.id) as total_sent
    FROM clients_optimized c
    LEFT JOIN sent_contacts sc ON c.id = sc.client_id
    WHERE 
        c.search_vector @@ plainto_tsquery('portuguese', search_term)
        OR c.phone_normalized ILIKE '%' || search_term || '%'
    GROUP BY c.id, c.display_name, c.phone_normalized, c.email
    ORDER BY last_sent DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Configuração de performance para Railway (2 vcores, 1GB RAM)
-- Configurações conservadoras para uso eficiente de memória
-- APLICAR MANUALMENTE no dashboard do Supabase ou via configuração do projeto:
-- shared_buffers = 256MB
-- effective_cache_size = 512MB
-- maintenance_work_mem = 64MB
-- work_mem = 8MB
-- max_connections = 50
-- wal_buffers = 16MB
-- random_page_cost = 1.1
-- effective_io_concurrency = 200
-- checkpoint_completion_target = 0.9
-- max_wal_size = 1GB
-- min_wal_size = 256MB