-- Script SQL para criar tabelas WhatsApp no PostgreSQL
-- Permite persistência completa de chats e mensagens

-- Tabela de chats WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_chats (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'online',
    last_message TEXT,
    last_message_time TIMESTAMP,
    unread_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mensagens WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(100) UNIQUE,
    chat_phone VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    sender VARCHAR(100),
    message_type VARCHAR(20) DEFAULT 'text', -- text, media, document, etc
    direction VARCHAR(10) NOT NULL, -- sent, received
    status VARCHAR(20) DEFAULT 'received', -- received, sent, delivered, read, error
    timestamp TIMESTAMP,
    waha_data JSON, -- Dados originais do WAHA
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key para chat
    FOREIGN KEY (chat_phone) REFERENCES whatsapp_chats(phone) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_phone ON whatsapp_chats(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_last_message_time ON whatsapp_chats(last_message_time DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_phone ON whatsapp_messages(chat_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_chats_updated_at BEFORE UPDATE ON whatsapp_chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários das tabelas
COMMENT ON TABLE whatsapp_chats IS 'Chats WhatsApp - informações dos contatos e conversas';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens WhatsApp - histórico completo de mensagens';

COMMENT ON COLUMN whatsapp_chats.phone IS 'Número de telefone único (chave)';
COMMENT ON COLUMN whatsapp_chats.name IS 'Nome do contato/chat';
COMMENT ON COLUMN whatsapp_chats.last_message IS 'Última mensagem do chat';
COMMENT ON COLUMN whatsapp_chats.unread_count IS 'Número de mensagens não lidas';

COMMENT ON COLUMN whatsapp_messages.message_id IS 'ID único da mensagem do WAHA';
COMMENT ON COLUMN whatsapp_messages.chat_phone IS 'Telefone do chat (FK)';
COMMENT ON COLUMN whatsapp_messages.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN whatsapp_messages.direction IS 'Direção: sent ou received';
COMMENT ON COLUMN whatsapp_messages.waha_data IS 'Dados originais do webhook WAHA (JSON)';

-- Verificar se as tabelas foram criadas
SELECT 'Tabelas WhatsApp criadas com sucesso!' as status;

