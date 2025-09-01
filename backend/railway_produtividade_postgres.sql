-- Script SQL otimizado para Railway PostgreSQL
-- Tabela de Produtividade - VION
-- Data de geracao: 2025-08-21
-- Caracteres especiais corrigidos para compatibilidade
-- Adaptado para PostgreSQL

-- Criar tabela de produtividade
CREATE TABLE IF NOT EXISTS produtividade (
    id SERIAL PRIMARY KEY,
    data DATE,
    tecnico TEXT,
    servico TEXT,
    sa TEXT,
    documento TEXT,
    nome_cliente TEXT,
    endereco TEXT,
    telefone1 TEXT,
    telefone2 TEXT,
    plano TEXT,
    status TEXT,
    obs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices para melhor performance
CREATE INDEX IF NOT EXISTS idx_produtividade_data ON produtividade(data);
CREATE INDEX IF NOT EXISTS idx_produtividade_tecnico ON produtividade(tecnico);
CREATE INDEX IF NOT EXISTS idx_produtividade_status ON produtividade(status);
CREATE INDEX IF NOT EXISTS idx_produtividade_servico ON produtividade(servico);

-- Inserir dados da produtividade (primeiros registros como exemplo)
INSERT INTO produtividade (data, tecnico, servico, sa, documento, nome_cliente, endereco, telefone1, telefone2, plano, status, obs) VALUES 
('2025-08-01', 'Izaque Eduardo Do Nascimento', 'ATIVACAO', 'SA-1196135', '115.671.916-06', 'Adriane Mendes Rocha', 'Rua Campinas 541 Cosmopolis-SP 13150140', NULL, '19999278645', NULL, 'FINALIZADO', NULL),
('2025-08-01', 'Izaque Eduardo Do Nascimento', 'ATIVACAO', 'SA-1194321', '567.747.375-87', 'Dilma Sacramento Santos Moura', 'Rua Poerio Adolpho Tavano 114 Cosmopolis-SP 13157534', NULL, '19971725757', NULL, 'FINALIZADO', NULL),
('2025-08-01', 'Izaque Eduardo Do Nascimento', 'ATIVACAO', 'SA-1198695', '611.544.083-10', 'Francimar Matias De Franca', 'Rua Monte Castelo 2650 Vila Cosmos Cosmopolis-SP', NULL, '19981896185', NULL, 'REAGENDADO', NULL),
('2025-08-01', 'Izaque Eduardo Do Nascimento', 'ATIVACAO', 'SA-1198543', '498.429.628-30', 'Sabrina Maria Da Silva', 'Rua Joao Marascalchi 161 Parque Dona Esther Cosmopolis-SP', NULL, '19996177214', NULL, 'REAGENDADO', NULL),
('2025-08-01', 'Izaque Eduardo Do Nascimento', 'ATIVACAO', 'SA-1199394', '466.459.978-17', 'Afonso Antonio Casado', 'Ida Kadow 91 Cosmopolis-SP 13150000', NULL, '19999633272', NULL, 'REAGENDADO', NULL),
('2025-08-01', 'Henrique Souza Lima', 'ATIVACAO', 'SA-1195244', '460.618.188-58', 'livia garcia dilio', 'Rua do Cobre 186 Santa Barbara DOeste-SP 13456430', NULL, '19987067938', NULL, 'FINALIZADO', NULL),
('2025-08-01', 'Henrique Souza Lima', 'ATIVACAO', 'SA-1197737', '547.327.458-73', 'Vitor henrique faray', 'Rua Aladino Selmi 555 Cosmopolis-SP 13155462', NULL, '19971595972', NULL, 'FINALIZADO', NULL),
('2025-08-01', 'Henrique Souza Lima', 'MUD END', 'SA-1191479', '180.220.826-78', 'Bryan Silveira Baroni', 'Rua Waldir de Almeida, 469 Cosmopolis-SP 13150000', NULL, '19998555739', NULL, '19971702567', NULL),
('2025-08-01', 'DANIEL', 'ATIVACAO', 'SA-1195263', '028.731.598-39', 'Claudio Bianchini', 'Rua Jose Neves Souza Junior 686 Mogi Mirim-SP 13803755', NULL, '11987413302', NULL, 'FINALIZADO', NULL),
('2025-08-01', 'DANIEL', 'MUD END', 'SA-1197552', '415.129.101-63', 'Iracema Lemos', 'R. Professor Benedito Aparecido Tavares, 189 Mogi Mirim-SP 13807527', NULL, '19987063890', NULL, 'REAGENDADO', NULL);

-- Comentarios sobre as correcoes realizadas:
-- 1. Caracteres especiais removidos: ç -> c, ã -> a, õ -> o, é -> e, etc.
-- 2. Estrutura otimizada com indices para melhor performance
-- 3. Campo id adicionado como chave primaria SERIAL (PostgreSQL)
-- 4. Campo created_at adicionado para auditoria
-- 5. Tipos de dados padronizados para PostgreSQL
-- 6. Compatibilidade com PostgreSQL (usado pelo Railway)

-- Para inserir todos os dados, execute o script completo do arquivo original
-- substituindo os caracteres especiais conforme padrao acima
