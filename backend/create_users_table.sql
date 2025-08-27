-- Atualizar usuários existentes com senhas simples
UPDATE users SET 
    password_hash = 'admin123',
    perms = 'admin'
WHERE username = 'admin';

UPDATE users SET 
    password_hash = 'user123',
    perms = 'user'
WHERE username = 'user';

UPDATE users SET 
    password_hash = 'manager123',
    perms = 'manager'
WHERE username = 'manager';

-- Inserir usuários se não existirem
INSERT INTO users (username, password_hash, full_name, email, perms) VALUES
('admin', 'admin123', 'Administrador', 'admin@sacmax.com', 'admin'),
('user', 'user123', 'Usuário Padrão', 'user@sacmax.com', 'user'),
('manager', 'manager123', 'Gerente', 'manager@sacmax.com', 'manager')
ON CONFLICT (username) DO NOTHING;

-- Verificar usuários
SELECT username, perms FROM users;

SELECT 'Usuários atualizados com sucesso!' as status;
