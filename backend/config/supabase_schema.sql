-- Schema do banco de dados para integração com Supabase
-- Criar tabelas para armazenar dados de clientes e planilhas

-- Tabela de uploads de planilhas
CREATE TABLE IF NOT EXISTS spreadsheet_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    mode VARCHAR(50) NOT NULL CHECK (mode IN ('client_data', 'contacts')),
    total_records INTEGER DEFAULT 0,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id VARCHAR(255) NOT NULL,
    client_name VARCHAR(500) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    additional_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id)
);

-- Índice para busca rápida por client_id
CREATE INDEX IF NOT EXISTS idx_clients_client_id ON clients(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);

-- Tabela de dados de clientes por data
CREATE TABLE IF NOT EXISTS client_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    upload_id UUID NOT NULL REFERENCES spreadsheet_uploads(id) ON DELETE CASCADE,
    date_key DATE NOT NULL,
    sheet_name VARCHAR(100),
    row_number INTEGER,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_client_data_client_id ON client_data(client_id);
CREATE INDEX IF NOT EXISTS idx_client_data_date_key ON client_data(date_key);
CREATE INDEX IF NOT EXISTS idx_client_data_upload_id ON client_data(upload_id);

-- Tabela de contatos (modo contacts)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES spreadsheet_uploads(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(500),
    sheet_name VARCHAR(100),
    row_number INTEGER,
    date_value TIMESTAMP WITH TIME ZONE,
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para contatos
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_upload_id ON contacts(upload_id);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);

-- Tabela de logs de processamento
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    upload_id UUID REFERENCES spreadsheet_uploads(id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL,
    message TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualização automática do updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spreadsheet_uploads_updated_at BEFORE UPDATE ON spreadsheet_uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_data_updated_at BEFORE UPDATE ON client_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();