-- Schema do banco de dados para gestão de feedback de clientes
-- Extensão do schema existente do Supabase

-- Tabela de feedback de clientes
CREATE TABLE IF NOT EXISTS customer_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    category VARCHAR(20) CHECK (category IN ('positive', 'negative', 'neutral')) DEFAULT 'neutral',
    sentiment_score DECIMAL(3,2) DEFAULT 0.0,
    source VARCHAR(50) DEFAULT 'whatsapp',
    is_manual BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para feedback
CREATE INDEX IF NOT EXISTS idx_feedback_client_id ON customer_feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON customer_feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON customer_feedback(created_at DESC);

-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(20) CHECK (category IN ('positive', 'negative', 'neutral', 'welcome', 'follow_up')) NOT NULL,
    template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas de feedback
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    feedback_id UUID NOT NULL REFERENCES customer_feedback(id) ON DELETE CASCADE,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    response_message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de chats ativos
CREATE TABLE IF NOT EXISTS active_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'waiting')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens de chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES active_chats(id) ON DELETE CASCADE,
    sender VARCHAR(20) CHECK (sender IN ('client', 'system', 'agent')) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de campanhas de mensagens em massa
CREATE TABLE IF NOT EXISTS mass_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,
    target_filter JSONB DEFAULT '{}',
    total_contacts INTEGER DEFAULT 0,
    sent_contacts INTEGER DEFAULT 0,
    failed_contacts INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contatos de campanhas
CREATE TABLE IF NOT EXISTS campaign_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES mass_campaigns(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sent_at ON chat_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_chats_client_id ON active_chats(client_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback_id ON feedback_responses(feedback_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_id ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_client_id ON campaign_contacts(client_id);

-- Triggers para atualização automática
CREATE TRIGGER IF NOT EXISTS update_customer_feedback_updated_at BEFORE UPDATE ON customer_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_active_chats_updated_at BEFORE UPDATE ON active_chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_mass_campaigns_updated_at BEFORE UPDATE ON mass_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais de templates
INSERT INTO message_templates (name, category, template, variables) VALUES
('positive_response', 'positive', 'Olá {{client_name}}! Agradecemos muito pelo seu feedback positivo. Ficamos felizes em saber que você está satisfeito com nossos serviços. Continuaremos trabalhando para manter esse padrão de excelência!', '["client_name"]'),
('negative_response', 'negative', 'Olá {{client_name}}. Lamentamos muito saber sobre sua experiência. Gostaríamos de entender melhor o que aconteceu e como podemos melhorar. Por favor, entre em contato conosco para que possamos resolver sua situação.', '["client_name"]'),
('neutral_response', 'neutral', 'Olá {{client_name}}! Agradecemos seu feedback. Sua opinião é muito importante para continuarmos melhorando nossos serviços.', '["client_name"]'),
('welcome_message', 'welcome', 'Bem-vindo(a) {{client_name}}! Estamos aqui para ajudar. Caso tenha qualquer dúvida ou feedback, não hesite em nos contatar.', '["client_name"]'),
('follow_up_message', 'follow_up', 'Olá {{client_name}}! Esperamos que esteja tudo bem. Estamos apenas verificando se você precisa de alguma assistência adicional.', '["client_name"]');