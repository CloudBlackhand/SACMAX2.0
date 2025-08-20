# 🚀 Deploy SacsMax no Railway

## Configuração Automática

O SacsMax está configurado para deploy automático no Railway. O sistema detectará automaticamente:

- ✅ **Python 3.11+** (via `runtime.txt`)
- ✅ **Dependências Python** (via `requirements.txt`)
- ✅ **Dependências Node.js** (via `frontend/package.json`)
- ✅ **Comando de inicialização** (via `railway.json`)

## Passos para Deploy

### 1. Conectar ao Railway

1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha seu repositório SacsMax

### 2. Configuração Automática

O Railway detectará automaticamente:
- **Builder**: NIXPACKS (Python + Node.js)
- **Start Command**: `python railway_startup.py`
- **Port**: Configurado via variável `PORT`

### 3. Variáveis de Ambiente (Opcional)

Configure no painel do Railway:

```bash
PORT=3000                    # Porta principal
NODE_ENV=production          # Ambiente Node.js
FLASK_ENV=production         # Ambiente Flask
```

### 4. Deploy

1. O Railway fará o build automaticamente
2. Instalará dependências Python e Node.js
3. Executará `python railway_startup.py`
4. Sistema estará disponível na URL fornecida

## Estrutura do Deploy

```
SacsMax/
├── railway_startup.py      # 🚀 Arquivo principal
├── requirements.txt        # 📦 Dependências Python
├── railway.json           # ⚙️ Configuração Railway
├── Procfile              # 🔧 Configuração Heroku/Railway
├── runtime.txt           # 🐍 Versão Python
├── frontend/             # 🌐 Frontend JavaScript
│   ├── index.html        # 📄 Página inicial
│   ├── main.js           # 🎯 Aplicação principal
│   ├── package.json      # 📦 Dependências Node.js
│   └── modules/          # 📁 Módulos da aplicação
└── backend/              # 🔧 Backend Python (criado automaticamente)
    ├── app.py            # 🐍 API Flask
    └── requirements.txt  # 📦 Dependências backend
```

## O que o `railway_startup.py` faz

1. **Verifica dependências** Python e Node.js
2. **Instala dependências** do frontend (`npm install`)
3. **Cria backend** se não existir
4. **Inicia servidor backend** (porta +1)
5. **Inicia servidor frontend** (porta principal)
6. **Configura CORS** e roteamento
7. **Monitora processos** e reinicia se necessário

## Acesso ao Sistema

Após o deploy:

- **Frontend**: `https://seu-app.railway.app`
- **Backend API**: `https://seu-app.railway.app:3001`
- **Health Check**: `https://seu-app.railway.app:3001/api/health`

## Módulos Disponíveis

- 🏠 **Dashboard** - Estatísticas e métricas
- 📁 **Upload Excel** - Processamento de planilhas
- 💬 **WhatsApp** - Interface de chat
- 🤖 **Configurar Bot** - Automação de respostas
- 👥 **Contatos** - Gestão de contatos
- 📤 **Disparo de Mensagens** - Envio filtrado por data
- ⚙️ **Configurações** - Configurações do sistema

## Troubleshooting

### Problemas Comuns

1. **Build falha**
   - Verifique se todas as dependências estão em `requirements.txt`
   - Confirme se o Node.js está configurado corretamente

2. **Porta em uso**
   - O Railway gerencia portas automaticamente
   - Use a variável `PORT` se necessário

3. **Módulos não carregam**
   - Verifique se todos os arquivos `.js` estão no diretório `frontend/modules/`
   - Confirme se o `main.js` está importando corretamente

### Logs

Acesse os logs no painel do Railway:
- **Build logs**: Durante o deploy
- **Runtime logs**: Durante a execução
- **Application logs**: Logs da aplicação

## Monitoramento

O sistema inclui:
- ✅ **Health checks** automáticos
- ✅ **Heartbeat** do backend
- ✅ **Logs** detalhados
- ✅ **Restart automático** em caso de falha

## Suporte

Para problemas específicos do Railway:
- 📧 **Email**: support@railway.app
- 📖 **Documentação**: [docs.railway.app](https://docs.railway.app)
- 💬 **Discord**: [Railway Discord](https://discord.gg/railway)

---

**SacsMax** - Sistema pronto para produção no Railway! 🚀
