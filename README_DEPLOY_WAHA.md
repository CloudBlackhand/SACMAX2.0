# 🚀 Deploy SacsMax + WAHA no Railway

**Guia completo para deploy do sistema SacsMax com WAHA no Railway**

## 📋 Pré-requisitos

- Conta no [Railway.app](https://railway.app)
- Railway CLI instalado: `npm install -g @railway/cli`
- Git configurado
- Banco PostgreSQL (Railway fornece)

## 🛠️ Deploy Rápido

### 1. Clone e Prepare
```bash
git clone https://github.com/seu-usuario/SACMAX2.0.git
cd SACMAX2.0
```

### 2. Deploy Automático
```bash
# Tornar script executável
chmod +x deploy-railway-waha.sh

# Executar deploy
./deploy-railway-waha.sh
```

### 3. Deploy Manual
```bash
# Login no Railway
railway login

# Criar projeto
railway project create

# Configurar variáveis
railway variables set RAILWAY_ENVIRONMENT=production
railway variables set WAHA_URL=http://waha:3000

# Deploy
railway up
```

## 🐳 Deploy com Docker Compose (Local)

### 1. Configurar Banco
```bash
# Criar arquivo .env
echo "DATABASE_URL=postgresql://user:pass@localhost/sacsmax" > .env
```

### 2. Iniciar Sistema
```bash
# Iniciar com Docker Compose
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### 3. Acessar Sistema
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/docs
- **WAHA**: http://localhost:3000

## 📱 Configurando WAHA

### 1. Acesse o Frontend
Abra a URL do Railway no navegador

### 2. Vá em Settings
Clique no ícone ⚙️ (Configurações)

### 3. Configure WAHA
- Clique em **"Conectar WAHA"**
- Configure a sessão (padrão: "sacsmax")
- Use o screenshot para verificar status

### 4. Autenticação WhatsApp
O WAHA oferece múltiplas opções:

#### Opção A: Código SMS
- Digite seu número: `5511999999999`
- Receba código via SMS
- Digite o código no WAHA

#### Opção B: Código Telegram
- Configure bot do Telegram
- Receba código via Telegram
- Digite o código no WAHA

#### Opção C: Link Direto
- Use link direto do WhatsApp
- Sem necessidade de código

## 🔧 Configurações do Railway

### Variáveis de Ambiente
```env
RAILWAY_ENVIRONMENT=production
NODE_ENV=production
WAHA_URL=http://waha:3000
DATABASE_URL=postgresql://...
```

### Health Check
- **Path**: `/api/health`
- **Timeout**: 300s
- **Interval**: 30s

## 📊 Monitoramento

### Logs do Sistema
```bash
# Ver logs do Railway
railway logs

# Ver logs específicos
railway logs --service sacmax
```

### Status dos Serviços
- **Backend**: `/api/health`
- **WAHA**: `/api/waha/status`
- **Database**: `/api/database/test`

## 🚨 Troubleshooting

### Problema: WAHA não conecta
```bash
# Verificar se WAHA está rodando
curl http://localhost:3000/api/status

# Verificar logs do WAHA
docker-compose logs waha
```

### Problema: Banco não conecta
```bash
# Verificar DATABASE_URL
railway variables

# Testar conexão
curl $(railway domain)/api/database/test
```

### Problema: Frontend não carrega
```bash
# Verificar se arquivos estáticos existem
ls -la frontend/

# Verificar logs do backend
railway logs --service sacmax
```

## 🔄 Atualizações

### Deploy de Atualizações
```bash
# Fazer commit das mudanças
git add .
git commit -m "Atualização do sistema"
git push

# Deploy automático no Railway
railway up
```

### Rollback
```bash
# Voltar para versão anterior
railway rollback
```

## 📞 Suporte

### Logs Úteis
- **Backend**: `railway logs --service sacmax`
- **WAHA**: `docker-compose logs waha`
- **Database**: Verificar DATABASE_URL

### Comandos de Debug
```bash
# Status geral
railway status

# Variáveis de ambiente
railway variables

# Logs em tempo real
railway logs --follow
```

## 🎉 Sistema Pronto!

Após o deploy, seu sistema estará disponível em:
- **Frontend**: URL do Railway
- **API**: URL + `/docs`
- **WAHA**: Integrado automaticamente

**🚀 Sistema SacsMax + WAHA funcionando no Railway!**


