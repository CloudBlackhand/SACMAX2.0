-- Tabela de usuários simples
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir usuários de teste
INSERT INTO users (username, password, full_name, email, role) VALUES
('admin', 'admin123', 'Administrador', 'admin@sacmax.com', 'admin'),
('user', 'user123', 'Usuário Padrão', 'user@sacmax.com', 'user'),
('manager', 'manager123', 'Gerente', 'manager@sacmax.com', 'manager')
ON CONFLICT (username) DO NOTHING;

-- Tabela de sessões simples
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_token VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Verificar se as tabelas foram criadas
SELECT 'Tabelas de usuários criadas com sucesso!' as status;
