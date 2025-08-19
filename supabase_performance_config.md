# Configurações de Performance para Railway (PostgreSQL)

## Como Aplicar as Configurações de Performance

### Método 1: Via Dashboard do Supabase
1. Acesse o dashboard do seu projeto Supabase
2. Vá para Settings → Database
3. Procure por "Database Settings" ou "Postgres Config"
4. Aplique as seguintes configurações:

```
shared_buffers = 256MB
effective_cache_size = 768MB
maintenance_work_mem = 64MB
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Método 2: Via SQL Manual (Se Permitido)
```sql
-- Execute individualmente, fora de transações
SET shared_buffers = '256MB';
SET effective_cache_size = '768MB';
SET maintenance_work_mem = '64MB';
SET work_mem = '4MB';
SET min_wal_size = '1GB';
SET max_wal_size = '4GB';
SET checkpoint_completion_target = 0.9;
SET wal_buffers = '16MB';
SET default_statistics_target = 100;
SET random_page_cost = 1.1;
SET effective_io_concurrency = 200;
```

### Método 3: Via Railway Variables
Adicione as variáveis no Railway:
```bash
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=768MB
POSTGRES_MAINTENANCE_WORK_MEM=64MB
POSTGRES_WORK_MEM=4MB
POSTGRES_MIN_WAL_SIZE=1GB
POSTGRES_MAX_WAL_SIZE=4GB
```

## Por que ALTER SYSTEM não funciona?
- ALTER SYSTEM requer superusuário
- Não pode ser executado dentro de transações
- Supabase usa configurações gerenciadas
- Railway pode ter restrições de segurança

## Configurações Alternativas para Railway
Para Railway (2 vcores, 1GB RAM), use estas configurações conservadoras:

```
shared_buffers = 256MB
effective_cache_size = 512MB
maintenance_work_mem = 64MB
work_mem = 8MB
max_connections = 50
wal_buffers = 16MB
random_page_cost = 1.1
effective_io_concurrency = 200
checkpoint_completion_target = 0.9
max_wal_size = 1GB
min_wal_size = 256MB
```

## Verificação
Após aplicar as configurações, verifique:
```sql
SHOW shared_buffers;
SHOW effective_cache_size;
SHOW work_mem;
```

## Notas Importantes
- Reinicie o banco após aplicar configurações
- Monitore o uso de memória
- Ajuste conforme necessário
- Railway pode ignorar algumas configurações