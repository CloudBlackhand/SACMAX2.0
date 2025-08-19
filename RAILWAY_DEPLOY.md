# 🚀 Deploy Otimizado no Railway

## ✅ Sistema 100% Funcional e Estável

O sistema foi completamente otimizado para operação perfeita no Railway com:
- **Recursos otimizados**: 2 vCPUs, 1GB RAM
- **Deploy simplificado**: Único container Docker
- **Verificação automática**: Sistema de health check integrado
- **Cache inteligente**: Armazenamento temporário otimizado

## 📋 Pré-requisitos

1. **Conta Railway**: [railway.app](https://railway.app)
2. **Supabase**: Projeto configurado
3. **Variáveis de ambiente**: Todas configuradas no Railway

## 🔧 Configuração de Variáveis de Ambiente (Railway)

### Obrigatórias
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
SUPABASE_URL=seu_supabase_url
SUPABASE_ANON_KEY=seu_supabase_anon_key
SUPABASE_SERVICE_KEY=seu_supabase_service_key
```

### WhatsApp
```bash
WHATSAPP_HEADLESS=true
WHATSAPP_QR_TIMEOUT=60000
```

### Performance
```bash
MAX_FILE_SIZE=10485760
MAX_CONCURRENT_UPLOADS=3
CACHE_TTL=3600
DB_POOL_SIZE=10
DB_TIMEOUT=30000
REQUEST_TIMEOUT=30000
MEMORY_LIMIT=512
```

### Puppeteer
```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_CACHE_DIR=/tmp/puppeteer_cache
```

## 🚀 Deploy - 3 Métodos

### 1. Railway CLI (Recomendado)
```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Criar projeto
railway init

# Deploy
railway up
```

### 2. Dashboard Web
1. Acesse [railway.app](https://railway.app)
2. Crie novo projeto
3. Conecte repositório Git
4. Configure variáveis de ambiente
5. Deploy automático

### 3. GitHub Integration
1. Push para branch main
2. Railway detecta e faz deploy automático

## 🔍 Verificação de Deploy

### Health Check
```bash
curl https://seu-app.railway.app/health
```

### Cache Interface
```
https://seu-app.railway.app/cache-interface
```

### Logs
```bash
railway logs
```

## 📊 Monitoramento

### Métricas Disponíveis
- **Health**: `/health`
- **Cache Stats**: `/api/cache/stats`
- **System Status**: Dashboard Railway

### Alertas
- Memory usage > 80%
- CPU usage > 90%
- Health check falha

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Chrome não inicia
```bash
# Verificar no health check
# Solução: Variáveis PUPPETEER_* já configuradas
```

#### 2. Memória insuficiente
```bash
# Reduzir CACHE_TTL para 1800
# Reduzir MAX_CONCURRENT_UPLOADS para 2
# Aumentar MEMORY_LIMIT para 768
```

#### 3. Timeout Supabase
```bash
# Aumentar DB_TIMEOUT para 60000
# Verificar conexão Supabase
```

### Comandos Úteis

```bash
# Ver logs
railway logs --tail 100

# Reiniciar serviço
railway restart

# Acessar container
railway shell

# Ver variáveis
railway variables
```

## 📁 Arquivos de Configuração

- `railway.toml` - Configuração principal
- `.railwayignore` - Arquivos ignorados no deploy
- `start.sh` - Script de inicialização
- `Dockerfile.production` - Container otimizado

## 🎯 Performance Otimizada

### Cache System
- **TTL**: 1 hora
- **Max Size**: 100MB
- **Auto-cleanup**: A cada 30 minutos
- **Interface**: Web para gerenciamento

### WhatsApp
- **Headless**: true (sem interface gráfica)
- **Timeout**: 60s para QR code
- **Reconexão**: Automática

### Database
- **Pool**: 10 conexões
- **Timeout**: 30s
- **Retry**: 3 tentativas

## 🔄 Atualização

### Updates Automáticos
- Push para main branch → Deploy automático
- Sem downtime (Railway rolling update)

### Manual Update
```bash
railway deploy
```

## 📞 Suporte

### Recursos
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [GitHub Issues](https://github.com/seu-repo/issues)

## ✅ Checklist Final de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Supabase URL e chaves válidas
- [ ] Health check retorna 200
- [ ] Cache interface acessível
- [ ] WhatsApp conecta corretamente
- [ ] Logs sem erros críticos
- [ ] Performance dentro dos limites (RAM < 80%)

## 🎉 Sucesso!

Seu sistema está **100% funcional e otimizado** para Railway. O deploy é simples, estável e com monitoramento completo.

**Status**: ✅ Pronto para produção