# SacsMax - Deploy no Railway

## 🚀 Configuração para Railway

Este projeto está configurado para funcionar no Railway com **Node.js** e **Python** em um único container.

### 📋 Pré-requisitos

- Conta no Railway
- Projeto configurado no Railway
- Variáveis de ambiente configuradas

### 🔧 Configuração

#### 1. Variáveis de Ambiente

Configure as seguintes variáveis no Railway:

```bash
# Ambiente
RAILWAY_ENVIRONMENT=production
NODE_ENV=production

# Banco de Dados
DATABASE_URL=sua_url_do_postgres
DB_HOST=seu_host
DB_PORT=5432
DB_NAME=seu_banco
DB_USER=seu_usuario
DB_PASSWORD=sua_senha

# WhatsApp
WHATSAPP_PORT=3002

# Outras configurações
PORT=8000
```

#### 2. Deploy

O Railway detectará automaticamente o `Dockerfile` e fará o deploy.

### 🏗️ Estrutura do Deploy

- **Dockerfile**: Configuração principal com Node.js 18 + Python 3
- **docker-entrypoint.sh**: Script de inicialização que gerencia ambos os serviços
- **railway_startup.py**: Script Python para inicializar o backend
- **whatsapp-server-simple.js**: Servidor Node.js para WhatsApp

### 🔍 Health Checks

- **Backend**: `GET /api/health`
- **WhatsApp**: `GET /api/status`

### 📊 Monitoramento

O sistema inclui logs detalhados para monitoramento:

```bash
# Logs do Backend
tail -f backend.log

# Logs do WhatsApp
tail -f whatsapp.log

# Logs do Frontend
tail -f frontend.log
```

### 🛠️ Troubleshooting

#### Problema: Build falha
```bash
# Verificar logs do build
railway logs --build

# Verificar Dockerfile
docker build -t sacsmax .
```

#### Problema: Serviços não iniciam
```bash
# Verificar logs
railway logs

# Verificar health checks
curl https://seu-app.railway.app/api/health
curl https://seu-app.railway.app/api/status
```

#### Problema: Portas conflitantes
- Backend: Porta 8000 (configurada via PORT)
- WhatsApp: Porta 3002 (configurada via WHATSAPP_PORT)

### 🔄 Atualizações

Para atualizar o sistema:

1. Faça push das alterações para o repositório
2. O Railway fará deploy automático
3. Verifique os logs para confirmar sucesso

### 📱 WhatsApp Integration

O servidor WhatsApp está configurado para:
- Aceitar conexões WebSocket
- Processar mensagens em tempo real
- Integrar com o backend Python
- Funcionar em ambiente containerizado

### 🎯 Pontos Importantes

1. **Não é necessário dividir em volumes separados** - Tudo funciona em um container
2. **Dockerfile personalizado** resolve problemas do Nixpacks
3. **Script de inicialização** gerencia ambos os serviços
4. **Health checks** garantem monitoramento adequado

### 📞 Suporte

Para problemas específicos do Railway:
- Verifique os logs: `railway logs`
- Teste localmente: `docker-compose up`
- Consulte a documentação do Railway
