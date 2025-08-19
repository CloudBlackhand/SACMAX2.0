# Configuração do Supabase - Integração com Sistema de Processamento de Planilhas

## 📋 Visão Geral
Este documento descreve como configurar a integração com o Supabase para armazenamento persistente dos dados dos clientes extraídos das planilhas Excel.

## 🔑 Credenciais Configuradas
As seguintes chaves já foram configuradas no sistema:

- **URL do Supabase:** `https://pjkxgtygxxslxvyafzvn.supabase.co`
- **Chave Anônima:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqa3hndHlneHNseHZ5YWZ6dmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNzc2NjksImV4cCI6MjA3MDc1MzY2OX0.gPVasCXxz92xRto236qb4j42P4xog15TWYJVa0IixP8`
- **Chave de Serviço:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqa3hndHlneHNseHZ5YWZ6dmtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE3NzY2OSwiZXhwIjoyMDcwNzUzNjY5fQ.YxZinJa8jiNtCqKfDTUSl6P7d1eJmqqAGQuJSwPL3MM`

## 🗄️ Schema do Banco de Dados
Execute o arquivo `supabase_schema.sql` no seu projeto Supabase para criar as tabelas necessárias.

### Tabelas Criadas:

1. **spreadsheet_uploads** - Registro de uploads de planilhas
2. **clients** - Informações básicas dos clientes
3. **client_data** - Dados detalhados por cliente e data
4. **contacts** - Contatos extraídos (modo contacts)
5. **processing_logs** - Logs de processamento

## 🚀 Como Usar

### 1. Configuração Inicial no Supabase
1. Acesse seu projeto no Supabase
2. Vá para SQL Editor
3. Cole o conteúdo de `supabase_schema.sql` e execute

### 2. Testar a Integração

#### Via API REST:
```bash
# Salvar dados de uma planilha
curl -X POST http://localhost:3000/api/supabase/save-data \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetData": {...},
    "fileName": "minha_planilha.xlsx",
    "mode": "client_data"
  }'

# Buscar todos os clientes
curl http://localhost:3000/api/supabase/clients

# Buscar histórico de uploads
curl http://localhost:3000/api/supabase/upload-history
```

#### Via Interface Web:
1. Faça upload de uma planilha Excel através da interface
2. Os dados serão automaticamente salvos no Supabase
3. Use os endpoints disponíveis para consultar os dados

### 3. Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/supabase/save-data` | POST | Salvar dados da planilha |
| `/api/supabase/clients` | GET | Buscar todos os clientes |
| `/api/supabase/clients/:id/data` | GET | Buscar dados de um cliente específico |
| `/api/supabase/upload-history` | GET | Buscar histórico de uploads |
| `/api/supabase/clients/:id` | DELETE | Deletar um cliente |

## 📊 Modos de Processamento

### Modo `client_data` (Recomendado)
- Organiza dados por cliente e data
- Previne duplicação através de upsert
- Mantém histórico completo

### Modo `contacts`
- Extrai contatos individuais
- Útil para campanhas de marketing
- Mantém estrutura simples de telefones e nomes

## 🔍 Prevenção de Duplicação
O sistema implementa:
- **Upsert** para clientes baseado em `client_id`
- Verificação de uploads duplicados por nome de arquivo
- Merge de dados quando cliente já existe

## 🛠️ Troubleshooting

### Erro de Conexão
```bash
# Verificar se o servidor está rodando
npm start

# Verificar logs
npm run dev
```

### Erro de Permissão no Supabase
1. Verifique as políticas de RLS (Row Level Security)
2. Certifique-se de que as chaves estão corretas
3. Verifique as configurações de CORS

### Dados não aparecendo
1. Verifique o console do navegador
2. Confirme que as tabelas foram criadas
3. Verifique os logs do servidor

## 📈 Estatísticas e Monitoramento
Acesse `/api/supabase/upload-history` para ver:
- Total de uploads processados
- Número de registros por arquivo
- Datas de processamento
- Modos de processamento utilizados

## 🔄 Backup e Migração
Os dados são automaticamente persistidos no Supabase, eliminando a necessidade de backup local. Para migração:
1. Exporte dados via API REST
2. Importe em novo projeto Supabase
3. Atualize as chaves de configuração

## 📞 Suporte
Em caso de dúvidas, verifique:
1. Logs do servidor (`logs/`)
2. Console do navegador
3. Dashboard do Supabase