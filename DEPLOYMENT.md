# SACSMAX - Guia de Deploy e Configuração

## 🚀 Deploy no Railway

### 1. Preparação do Ambiente

#### Variáveis de Ambiente Necessárias
Configure as seguintes variáveis no Railway:

```bash
# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-super-secret-key
WHATSAPP_SESSION_NAME=sacsmax-session
CORS_ORIGIN=https://your-domain.com

# Frontend (se separado)
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_SOCKET_URL=https://your-api-domain.com
```

### 2. Deploy com Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Selecionar projeto
railway link

# Deploy
node scripts/deploy-railway.js deploy

# Verificar status
railway status
```

### 3. Deploy com Git Push

```bash
# Adicionar remote do Railway
git remote add railway https://railway.app/project/your-project-id

# Push para deploy
git push railway main
```

## 🐳 Deploy com Docker

### Opção 1: Docker Compose

```bash
# Build e start
docker-compose up --build

# Modo detached
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Opção 2: Docker Individual

```bash
# Build backend
docker build -f Dockerfile.production -t sacsmax-backend .

# Build frontend
docker build -f frontend/Dockerfile -t sacsmax-frontend .

# Rodar containers
docker run -p 3000:3000 sacsmax-backend
docker run -p 8080:80 sacsmax-frontend
```

## 📁 Estrutura do Projeto Refatorado

```
SacsMax/
├── backend/                 # API Backend
├── frontend/               # Interface Web
│   ├── services/          # Serviços HTTP
│   │   ├── apiService.js    # API centralizada
│   │   └── networkService.js # Verificação de rede
│   ├── modules/           # Módulos da interface
│   │   ├── upload.js        # Upload de arquivos
│   │   ├── botControl.js    # Controle do WhatsApp
│   │   ├── feedbackUI.js    # Interface de feedback
│   │   └── whatsappIntegration.js # Integração WhatsApp
│   ├── utils/             # Utilitários
│   │   └── formatters.js    # Funções auxiliares
│   ├── styles/            # Estilos CSS
│   │   └── main.css         # Estilos principais
│   ├── config/            # Configurações
│   │   └── environment.js   # Variáveis de ambiente
│   └── webInterface-refactored.js # Interface principal
├── test/                  # Testes
│   └── mocks/
│       └── apiMock.js       # Mocks para testes
├── scripts/               # Scripts de deploy
│   └── deploy-railway.js    # Deploy automatizado
├── docker-compose.yml     # Configuração Docker
├── railway.toml          # Configuração Railway
└── .env.example          # Exemplo de variáveis
```

## 🔧 Scripts Disponíveis

### Frontend
```bash
cd frontend
npm install
npm start          # Desenvolvimento local
npm run build      # Build otimizado
npm test          # Executar testes
```

### Backend
```bash
npm start          # Produção
npm run dev        # Desenvolvimento
npm test          # Testes
```

## 📊 Health Checks

### Backend Health Check
```bash
curl https://your-domain.com/health
```

### Frontend Health Check
```bash
curl https://your-frontend-domain.com/health
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão WhatsApp**
   - Verifique WHATSAPP_SESSION_NAME
   - Verifique permissões de arquivo
   - Verifique logs: railway logs

2. **Erro Supabase**
   - Verifique SUPABASE_URL e chaves
   - Verifique permissões do banco
   - Verifique conectividade

3. **Erro de CORS**
   - Configure CORS_ORIGIN corretamente
   - Verifique domínios permitidos

4. **Erro de rede**
   - Use networkService.js para diagnóstico
   - Verifique variáveis de ambiente
   - Teste conectividade local

### Logs e Monitoramento

```bash
# Railway logs
railway logs

# Docker logs
docker-compose logs -f

# Verificar status
railway status
```

## 🔐 Segurança

### Práticas Recomendadas

1. **Variáveis de ambiente**: Nunca commit .env
2. **JWT**: Use chaves fortes e rotacione regularmente
3. **CORS**: Configure domínios específicos
4. **HTTPS**: Use sempre HTTPS em produção
5. **Rate limiting**: Configure limites de requisição

### Atualização de Segurança

```bash
# Atualizar dependências
npm audit fix
npm update

# Verificar vulnerabilidades
npm audit
```

## 📞 Suporte

Para problemas de deploy:
1. Verifique logs detalhados
2. Consulte documentação do Railway
3. Abra issue no GitHub
4. Contate suporte técnico

## 🔄 Atualização Automática

O Railway faz deploy automático em:
- Push para branch main
- Alterações no railway.toml
- Atualização de variáveis de ambiente

Para desabilitar:
```bash
railway deploy --disable-git-auto-deploy
```