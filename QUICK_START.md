# 🚀 SACSMAX - Início Rápido

## Deploy Rápido no Railway

### 1. Pré-requisitos
- Conta no Railway (https://railway.app)
- Railway CLI instalado: `npm install -g @railway/cli`
- Git configurado

### 2. Deploy Automatizado (Recomendado)

```bash
# Clone o repositório
git clone <seu-repositorio>
cd SacsMax

# Execute o script de deploy
./deploy.sh
```

O script irá:
- ✅ Verificar a estrutura do projeto
- ✅ Fazer deploy do backend Python
- ✅ Fazer deploy do WhatsApp Web.js
- ✅ Configurar variáveis de ambiente
- ✅ Criar tabelas do banco de dados

### 3. Deploy Manual

#### Backend Python
```bash
cd backend
railway init
railway variables set ENVIRONMENT=production
railway variables set SECRET_KEY=sua-chave-secreta
railway variables set DATABASE_URL=postgresql://...
railway up
```

#### WhatsApp Web.js
```bash
cd backend/whatsapp-web.js
railway init
railway up
```

### 4. Configuração do Banco

1. Crie um banco PostgreSQL no Railway
2. Configure a variável `DATABASE_URL`
3. Execute as migrações:
```bash
cd backend
railway run python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

## 🧪 Teste Rápido

### 1. Verificar se está funcionando
```bash
# Health check
curl https://seu-app.railway.app/health

# Documentação da API
curl https://seu-app.railway.app/docs
```

### 2. Testar upload de Excel
```bash
curl -X POST "https://seu-app.railway.app/api/excel/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@excel\ test/Rota\ LAS.xlsx"
```

### 3. Testar WhatsApp
```bash
# Iniciar sessão
curl -X POST "https://seu-app.railway.app/api/whatsapp/start"

# Obter QR Code
curl "https://seu-app.railway.app/api/whatsapp/qr"
```

## 🔧 Configuração Local

### Docker Compose (Mais fácil)
```bash
docker-compose up -d
```

### Manual
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# WhatsApp Web.js
cd backend/whatsapp-web.js
npm install
npm start

# Frontend
cd frontend
npm install
npm start
```

## 📱 Uso Básico

1. **Upload de Excel**: Envie arquivos Excel/CSV com contatos
2. **Conectar WhatsApp**: Escaneie o QR Code
3. **Criar Template**: Configure mensagens personalizadas
4. **Enviar Mensagens**: Envie individual ou em lote

## 🆘 Problemas Comuns

### Erro de conexão com banco
- Verifique se `DATABASE_URL` está configurada
- Confirme se o banco PostgreSQL está ativo

### WhatsApp não conecta
- Verifique se o WhatsApp Web.js está rodando
- Confirme se o QR Code foi escaneado

### Erro de CORS
- Configure as origens permitidas no backend
- Verifique se o frontend está acessando a URL correta

## 📞 Suporte

- 📧 Email: suporte@sacsmax.com
- 📖 Documentação: [Link da documentação]
- 🐛 Issues: [Link do GitHub]

---

**SACSMAX** - Automatizando comunicação, conectando pessoas! 🚀

