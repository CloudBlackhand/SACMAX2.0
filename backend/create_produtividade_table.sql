-- Script SQL para criar tabela de produtividade
-- Baseado na estrutura da planilha OPERAÇÕES VION.xlsx

CREATE TABLE IF NOT EXISTS produtividade (
    id SERIAL,
    data DATE,
    tecnico TEXT,
    servico TEXT,
    sa TEXT PRIMARY KEY,
    documento TEXT,
    nome_cliente TEXT,
    endereco TEXT,
    telefone1 TEXT,
    telefone2 TEXT,
    plano TEXT,
    status TEXT,
    obs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtividade_data ON produtividade(data);
CREATE INDEX IF NOT EXISTS idx_produtividade_tecnico ON produtividade(tecnico);
CREATE INDEX IF NOT EXISTS idx_produtividade_status ON produtividade(status);
CREATE INDEX IF NOT EXISTS idx_produtividade_servico ON produtividade(servico);
