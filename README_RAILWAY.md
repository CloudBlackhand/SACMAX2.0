# 🚀 SacsMax 2.2 - Deploy no Railway

## 📋 **Arquitetura Multi-Processo Otimizada**

O SacsMax 2.2 foi otimizado para funcionar perfeitamente no Railway com uma arquitetura que suporta **Python + Node.js** no mesmo container.

### **🏗️ Estrutura do Sistema**

```
SacsMax 2.2
├── 🐍 Python (Backend FastAPI)
│   ├── API REST completa
│   ├── Servidor de arquivos estáticos
│   └── Integração com banco de dados
├── 📱 Node.js (WhatsApp Server)
│   ├── Servidor WebSocket
│   ├── Integração WhatsApp Web.js
│   └── API de status
└── 🌐 Frontend (HTML/CSS/JS)
    ├── Interface responsiva
    ├── Módulos modulares
    └── Comunicação em tempo real
```

## 🚀 **Deploy Automático**

### **1. Conectar ao Railway**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Conectar ao projeto
railway link
```

### **2. Configurar Variáveis de Ambiente**

No painel do Railway, configure as seguintes variáveis:

```env
# Ambiente
RAILWAY_ENVIRONMENT=production
NODE_ENV=production
PYTHON_ENV=production

# Portas
PORT=5000
WHATSAPP_PORT=3002

# Banco de dados (se necessário)
DATABASE_URL=postgresql://...

# Outras configurações
RAILWAY_ENVIRONMENT=production
```

### **3. Deploy**

```bash
# Deploy automático
railway up

# Ou via GitHub (recomendado)
git push origin main
```

## 🔧 **Configurações Específicas**

### **Arquivos de Configuração**

- **`nixpacks.toml`**: Configuração do builder (Python + Node.js)
- **`railway.json`**: Configuração do Railway
- **`railway_startup.py`**: Script de inicialização
- **`Procfile`**: Processo principal

### **Dependências**

**Python (requirements.txt):**
```
fastapi
uvicorn
requests
psycopg2-binary
python-multipart
```

**Node.js (package.json):**
```json
{
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "ws": "^8.14.2"
  }
}
```

## 📊 **Monitoramento e Health Checks**

### **Endpoints de Status**

- **Backend**: `GET /api/health`
- **WhatsApp**: `GET /api/status` (porta 3002)
- **Frontend**: `GET /` (servido pelo FastAPI)

### **Logs**

```bash
# Ver logs em tempo real
railway logs

# Ver logs específicos
railway logs --service backend
```

## 🔄 **Processos e Comunicação**

### **Inicialização**

1. **Python Backend** inicia primeiro
2. **Node.js WhatsApp** inicia automaticamente
3. **Monitoramento** verifica saúde dos processos
4. **Reinicialização automática** se necessário

### **Comunicação**

- **Backend ↔ Frontend**: HTTP/WebSocket
- **Backend ↔ WhatsApp**: HTTP (localhost:3002)
- **Frontend ↔ WhatsApp**: WebSocket (localhost:3002)

## 🛠️ **Solução de Problemas**

### **Problemas Comuns**

**1. WhatsApp não conecta:**
```bash
# Verificar se o processo está rodando
railway logs | grep "WhatsApp"

# Verificar porta
curl http://localhost:3002/api/status
```

**2. Backend não responde:**
```bash
# Verificar health check
curl http://localhost:5000/api/health

# Verificar logs
railway logs | grep "Backend"
```

**3. Dependências não instaladas:**
```bash
# Verificar build
railway logs | grep "pip install"
railway logs | grep "npm install"
```

### **Reinicialização**

```bash
# Reiniciar serviço
railway service restart

# Redeploy completo
railway up --detach
```

## 📈 **Performance e Escalabilidade**

### **Otimizações**

- **Workers**: 1 worker por container
- **Memory**: Otimizado para Railway
- **Startup**: Inicialização rápida
- **Health Checks**: Monitoramento contínuo

### **Recursos Recomendados**

- **CPU**: 1 vCPU
- **RAM**: 1GB
- **Storage**: 1GB

## 🔒 **Segurança**

### **Configurações**

- **CORS**: Configurado para produção
- **HTTPS**: Automático no Railway
- **Rate Limiting**: Implementado
- **Input Validation**: Pydantic models

## 📱 **Funcionalidades**

### **Módulos Disponíveis**

1. **📱 WhatsApp**: Tempo real
2. **📁 Excel**: Upload e processamento
3. **📊 Feedback**: Análise de sentimentos
4. **🤖 Bot**: Configuração automática
5. **📤 Mensagens**: Disparo em massa
6. **📈 Produtividade**: Métricas
7. **⚙️ Settings**: Configurações

### **APIs**

- **REST API**: FastAPI com documentação
- **WebSocket**: Comunicação em tempo real
- **File Upload**: Processamento de arquivos
- **Database**: PostgreSQL integrado

## 🎯 **Status do Deploy**

### **Verificação**

```bash
# Status geral
railway status

# Health check
curl https://your-app.railway.app/api/health

# WhatsApp status
curl https://your-app.railway.app:3002/api/status
```

### **URLs**

- **Frontend**: `https://your-app.railway.app`
- **API Docs**: `https://your-app.railway.app/docs`
- **WhatsApp**: `https://your-app.railway.app:3002`

## 🚀 **Próximos Passos**

1. **Deploy**: `railway up`
2. **Configurar**: Variáveis de ambiente
3. **Testar**: Health checks
4. **Monitorar**: Logs e performance
5. **Usar**: Sistema completo

---

## ✅ **Sistema Otimizado para Railway**

O SacsMax 2.2 está **100% otimizado** para o Railway com:

- ✅ **Arquitetura multi-processo**
- ✅ **Health checks automáticos**
- ✅ **Reinicialização automática**
- ✅ **Logs detalhados**
- ✅ **Performance otimizada**
- ✅ **Segurança configurada**

**🎉 Pronto para produção no Railway!**
