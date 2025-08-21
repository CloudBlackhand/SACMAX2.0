# Deploy no Railway - Tabela de Produtividade VION

## Arquivos Gerados

1. **`railway_produtividade_completo.sql`** - Arquivo SQL completo com 1299 registros processados
2. **`railway_produtividade.sql`** - Versão de exemplo com 10 registros
3. **`process_sql_for_railway.py`** - Script para processar arquivos SQL

## Correções Realizadas

### Caracteres Especiais Corrigidos
- `ç` → `c`
- `ã` → `a`
- `õ` → `o`
- `á` → `a`
- `à` → `a`
- `â` → `a`
- `é` → `e`
- `è` → `e`
- `ê` → `e`
- `í` → `i`
- `ì` → `i`
- `î` → `i`
- `ó` → `o`
- `ò` → `o`
- `ô` → `o`
- `ú` → `u`
- `ù` → `u`
- `û` → `u`
- `ñ` → `n`
- `ü` → `u`

### Estrutura Otimizada
- ✅ Campo `id` como chave primária
- ✅ Campo `created_at` para auditoria
- ✅ Índices para melhor performance
- ✅ Tipos de dados padronizados
- ✅ Compatibilidade com SQLite (Railway)

## Como Usar no Railway

### Opção 1: Via Interface Web
1. Acesse o Railway Dashboard
2. Vá para seu projeto
3. Clique em "Database" → "Connect"
4. Use o arquivo `railway_produtividade_completo.sql`

### Opção 2: Via CLI
```bash
# Conectar ao banco
railway connect

# Executar o script
sqlite3 database.db < railway_produtividade_completo.sql
```

### Opção 3: Via Código Python
```python
import sqlite3

# Conectar ao banco
conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Executar o script
with open('railway_produtividade_completo.sql', 'r') as f:
    script = f.read()
    cursor.executescript(script)

conn.commit()
conn.close()
```

## Estrutura da Tabela

```sql
CREATE TABLE produtividade (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
```

## Índices Criados
- `idx_produtividade_data` - Para consultas por data
- `idx_produtividade_tecnico` - Para consultas por técnico
- `idx_produtividade_status` - Para consultas por status
- `idx_produtividade_servico` - Para consultas por serviço

## Dados Incluídos
- **Total de registros**: 1299
- **Período**: Agosto 2025
- **Tipos de serviço**: ATIVAÇÃO, MUD END
- **Status**: FINALIZADO, REAGENDADO, CA VENCIDO, etc.

## Verificação
Após executar o script, verifique se os dados foram inseridos:

```sql
SELECT COUNT(*) FROM produtividade;
SELECT DISTINCT tecnico FROM produtividade;
SELECT DISTINCT status FROM produtividade;
```

## Problemas Comuns

### Erro de Codificação
Se houver problemas de codificação, use:
```bash
# Verificar codificação
file -i railway_produtividade_completo.sql

# Converter para UTF-8 se necessário
iconv -f ISO-8859-1 -t UTF-8 railway_produtividade_completo.sql > railway_utf8.sql
```

### Erro de Tamanho
Se o arquivo for muito grande, divida em partes:
```bash
# Dividir em arquivos menores
split -l 100 railway_produtividade_completo.sql railway_part_
```

## Suporte
Para dúvidas ou problemas, verifique:
1. Logs do Railway
2. Compatibilidade do SQLite
3. Permissões do banco de dados

---
**Arquivo gerado automaticamente em**: 2025-08-21 08:57:09
**Versão**: 1.0
**Compatível com**: Railway, SQLite
