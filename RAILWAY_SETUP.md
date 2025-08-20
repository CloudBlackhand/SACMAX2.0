# 🚂 Configuração Railway PostgreSQL - SacsMax

## 📋 Pré-requisitos

1. **Railway CLI instalado**
   ```bash
   npm install -g @railway/cli
   ```

2. **Conta Railway ativa**
   - Acesse [railway.app](https://railway.app)
   - Crie uma conta ou faça login

3. **Projeto Railway criado**
   - Crie um novo projeto no Railway Dashboard
   - Ou conecte este repositório ao Railway

## 🔧 Configuração Passo a Passo

### 1. Login Railway
```bash
railway login
```

### 2. Link do Projeto
```bash
# No diretório raiz do projeto
railway link
# Selecione seu projeto Railway
```

### 3. Adicionar PostgreSQL
```bash
# Via Railway Dashboard:
# 1. Vá para seu projeto
# 2. Clique em "New" → "Database" → "PostgreSQL"
# 3. Aguarde a criação

# Ou via CLI:
railway add --database
```

### 4. Verificar DATABASE_URL
```bash
railway variables get DATABASE_URL
```

### 5. Configurar Variáveis no Railway
```bash
# Configure todas as variáveis necessárias
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set WHATSAPP_HEADLESS=true
railway variables set MAX_FILE_SIZE=10485760
railway variables set JWT_SECRET=sua-chave-secreta
railway variables set FRONTEND_URL=https://seu-dominio.vercel.app
railway variables set CORS_ORIGIN=https://seu-dominio.vercel.app
```

### 6. Deploy Automático
```bash
# Deploy para Railway
railway up
```

## 📊 Verificação

Após a configuração, teste a conexão:

```bash
# Testar conexão Railway
node test-railway-connection.js

# Verificar variáveis
railway variables

# Logs do deploy
railway logs
```

## 🎯 Estrutura do Railway PostgreSQL

### Tabelas Criadas Automaticamente
- `feedback_responses` - Armazena feedbacks de clientes
- `excel_data` - Armazena dados de planilhas Excel
- `campaigns` - Armazena campanhas WhatsApp
- `whatsapp_sessions` - Armazena sessões WhatsApp

### Configuração Railway.toml
```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"
startCommand = "npm start"

[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[variables]
NODE_ENV = "production"
PORT = "3001"
```

## 🚨 Solução de Problemas

### DATABASE_URL não encontrada
```bash
# Verificar serviços do Railway
railway status

# Listar serviços
railway services

# Adicionar PostgreSQL manualmente
railway add --database postgresql
```

### Erro de conexão
```bash
# Verificar logs detalhados
railway logs --follow

# Testar conexão local
railway run node setup-railway-env.js
```

### Variáveis não carregando
```bash
# Verificar todas as variáveis
railway variables

# Redefinir variável
railway variables set DATABASE_URL="postgresql://..."
```

## 🔄 Fluxo de Deploy

1. **Desenvolvimento Local**
   ```bash
   npm install
   npm run dev
   ```

2. **Preparar para Produção**
   ```bash
   npm run build
   node setup-railway-db.js
   ```

3. **Deploy para Railway**
   ```bash
   railway up
   ```

4. **Verificar Deploy**
   ```bash
   railway logs
   railway status
   ```

## 📈 Monitoramento

### Railway Dashboard
- Acesse [railway.app/dashboard](https://railway.app/dashboard)
- Monitore uso de CPU, memória e banco de dados
- Configure alertas de uso

### Health Checks
```bash
# Verificar saúde do sistema
node test-railway-connection.js

# Verificar banco de dados
railway run node setup-railway-db.js
```

## 🔐 Segurança

- **Nunca commite credenciais**
- **Use Railway Variables para secrets**
- **Configure CORS apropriadamente**
- **Use HTTPS em produção**

## 🎯 Próximos Passos

1. Configure o domínio customizado no Railway
2. Configure SSL/TLS automático
3. Configure backup do banco de dados
4. Configure monitoramento de erros
5. Configure CI/CD com GitHub Actions

## 📞 Suporte

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Railway Status: [status.railway.app](https://status.railway.app)