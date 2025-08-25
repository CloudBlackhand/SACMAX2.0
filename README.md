# 🚀 SacsMax - Sistema de Gestão de SAC

**Sistema completo de gestão de SAC com WhatsApp em tempo real, análise de feedback e integração com Excel.**

## ✨ **Novidades da Versão 2.1.0**

### 🔥 **WhatsApp em Tempo Real**
- **WebSocket**: Comunicação instantânea como WhatsApp Web real
- **Recebimento Automático**: Mensagens aparecem instantaneamente no chat
- **Sincronização Completa**: Todos os chats e mensagens sincronizados
- **Interface Real**: Interface idêntica ao WhatsApp Web
- **Controle Manual**: WhatsApp server iniciado via módulo Settings

### 🎯 **Como Funciona (Versão Otimizada para Railway)**

1. **🚀 Sistema Inicia**: Backend + Frontend automaticamente
2. **⚙️ Configurar WhatsApp**: Vá para módulo Settings
3. **📱 Iniciar WhatsApp**: Clique em "Iniciar WhatsApp Server"
4. **🔗 Conectar**: Escaneie o QR Code
5. **💬 Usar**: Sistema completo funcionando

## 🏗️ **Arquitetura do Sistema (Otimizada)**

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │  Backend        │
│   (JavaScript)  │                 │  (FastAPI)      │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │ HTTP API                          │ Process Control
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   WhatsApp      │                 │   WhatsApp      │
│   (Módulo)      │                 │   Server        │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │ WebSocket                         │ WhatsApp API
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   Interface     │                 │   WhatsApp      │
│   Tempo Real    │                 │   Web.js        │
└─────────────────┘                 └─────────────────┘
```

## 🚀 Início Rápido

### 1. Instalar Dependências
```bash
# Python
pip install -r requirements.txt

# Node.js (opcional - apenas para desenvolvimento local)
npm install
```

### 2. Iniciar o Sistema
```bash
# Iniciar Backend + Frontend
python railway_startup.py
```

### 3. Configurar WhatsApp
1. Acesse: http://localhost:5000
2. Vá para o módulo **Settings**
3. Clique em **"Iniciar WhatsApp Server"**
4. Escaneie o QR Code com seu WhatsApp

### 4. Usar o Sistema
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/docs
- **WhatsApp**: http://localhost:3001 (após iniciar via Settings)

## 📱 Como Usar o WhatsApp

### **Método Recomendado (Via Settings)**
1. Acesse o sistema em http://localhost:5000
2. Vá para o módulo **Settings**
3. Na seção **WhatsApp Server Control**:
   - Clique em **"Iniciar WhatsApp Server"**
   - Aguarde a mensagem de sucesso
   - Clique em **"Gerar QR Code"**
   - Escaneie o QR Code com seu WhatsApp
4. Vá para o módulo **WhatsApp** para usar

### **Método Manual (Desenvolvimento)**
```bash
# Em outro terminal
node whatsapp-server-simple.js
```

## 🔧 Arquitetura Simplificada

```
Frontend (5000) ←→ Backend (5000)
     │
     └─→ WhatsApp Server (3001) [Manual]
```

- **Frontend**: Interface do usuário
- **Backend**: API REST + Controle de processos
- **WhatsApp Server**: Iniciado manualmente via Settings

## 📊 **Módulos do Sistema**

### **1. 📱 WhatsApp (Tempo Real)**
- Conexão WebSocket em tempo real
- Interface idêntica ao WhatsApp Web
- Recebimento automático de mensagens
- Envio de mensagens
- Gestão de chats

### **2. 📁 Upload Excel**
- Processamento de planilhas
- Importação de contatos
- Validação de dados
- Relatórios de importação

### **3. 📈 Análise de Feedback**
- Análise de sentimentos
- Palavras-chave
- Relatórios automáticos
- Métricas de satisfação

### **4. 🤖 Configurar Bot**
- Configuração do bot automático
- Horários de atendimento
- Mensagens automáticas
- Integrações

### **5. 📤 Disparo de Mensagens**
- Envio em massa
- Templates personalizados
- Controle de progresso
- Relatórios de envio

### **6. 📊 Produtividade**
- Lista de serviços
- Controle por técnico
- Status de atendimento
- Logs do sistema

### **7. ⚙️ Configurações**
- Controle do WhatsApp Server
- Configurações do sistema
- Logs e monitoramento
- Backup e restauração

## 🔌 **APIs Disponíveis**

### **WhatsApp API**
```bash
# Status do WhatsApp
GET /api/whatsapp/status

# Iniciar sessão
POST /api/whatsapp/start

# Obter QR Code
GET /api/whatsapp/qr

# Enviar mensagem
POST /api/send-message

# Obter chats
GET /api/chats

# Obter mensagens
GET /api/messages/{contact_id}
```

### **WhatsApp Server Control**
```bash
# Iniciar servidor WhatsApp
POST /api/whatsapp-server/start

# Parar servidor WhatsApp
POST /api/whatsapp-server/stop

# Status do servidor
GET /api/whatsapp-server/status
```

### **Produtividade API**
```bash
# Obter contatos
GET /api/productivity/contacts

# Obter métricas
GET /api/productivity/metrics
```

### **Feedback API**
```bash
# Analisar feedback
POST /api/feedback/analyze

# Salvar feedback
POST /api/feedback/save

# Listar feedbacks
GET /api/feedback/list

# Estatísticas
GET /api/feedback/stats
```

## 🛠️ **Desenvolvimento**

### **Estrutura do Projeto**
```
sacsmax/
├── frontend/                 # Interface web
│   ├── index.html           # Página principal
│   ├── main.js              # Aplicação principal
│   └── modules/             # Módulos do sistema
│       ├── whatsapp.js      # WhatsApp (tempo real)
│       ├── excel.js         # Upload Excel
│       ├── feedback.js      # Análise de feedback
│       ├── bot.js           # Configurar Bot
│       ├── messages.js      # Disparo de Mensagens
│       ├── produtividade.js # Produtividade
│       └── settings.js      # Configurações
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── app.py          # Aplicação principal
│   │   └── services/       # Serviços
│   ├── database_config.py  # Configuração do banco
│   └── requirements.txt    # Dependências Python
├── whatsapp-server-simple.js # Servidor WhatsApp
├── railway_startup.py      # Script de inicialização
├── Procfile               # Configuração Railway
└── README.md              # Documentação
```

### **Tecnologias Utilizadas**
- **Frontend**: JavaScript puro, HTML5, CSS3
- **Backend**: FastAPI (Python)
- **WhatsApp**: whatsapp-web.js (Node.js)
- **WebSocket**: ws (Node.js)
- **Banco**: PostgreSQL
- **Deploy**: Railway

## 🔒 **Segurança**

### **Medidas Implementadas**
- ✅ **CORS**: Configurado para produção
- ✅ **Validação**: Validação de entrada em todas as APIs
- ✅ **Sanitização**: Dados sanitizados antes do processamento
- ✅ **Rate Limiting**: Proteção contra spam
- ✅ **HTTPS**: Suporte a HTTPS no Railway

### **Boas Práticas**
- 🔐 **Variáveis de Ambiente**: Credenciais em variáveis
- 🛡️ **Validação**: Validação rigorosa de dados
- 📝 **Logs**: Logs detalhados para auditoria
- 🔄 **Backup**: Backup automático do banco

## 📈 **Monitoramento**

### **Health Checks**
```bash
# Verificar status geral
GET /api/health

# Verificar WhatsApp
GET /api/whatsapp/status

# Verificar servidor WhatsApp
GET /api/whatsapp-server/status

# Verificar banco de dados
GET /api/stats
```

### **Logs**
- **Backend**: Logs detalhados no console
- **WhatsApp**: Logs de conexão e mensagens
- **Frontend**: Logs de erro no console do navegador

## 🚀 **Deploy no Railway**

### **1. Conectar Repositório**
1. Acesse [Railway.app](https://railway.app)
2. Conecte seu repositório GitHub
3. Selecione o repositório SacsMax

### **2. Configurar Variáveis**
```env
DATABASE_URL=postgresql://...
NODE_ENV=production
PYTHON_ENV=production
```

### **3. Deploy Automático**
- O Railway detectará automaticamente as configurações
- Build e deploy automático a cada push
- URLs geradas automaticamente

### **4. Acessar Sistema**
- **Frontend**: URL gerada pelo Railway
- **API**: URL + /docs para documentação
- **WhatsApp**: Conectar via Settings → WhatsApp Server Control

## 🤝 **Contribuição**

### **Como Contribuir**
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### **Padrões de Código**
- **JavaScript**: ESLint + Prettier
- **Python**: Black + Flake8
- **Commits**: Conventional Commits
- **Documentação**: JSDoc + Type Hints

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 **Suporte**

### **Problemas Comuns**

**WhatsApp não conecta:**
1. Verifique se o WhatsApp Server foi iniciado via Settings
2. Verifique se o QR Code foi escaneado
3. Aguarde alguns segundos para conexão
4. Verifique logs do servidor WhatsApp

**Mensagens não aparecem:**
1. Verifique conexão WebSocket
2. Recarregue a página
3. Verifique logs do frontend

**Erro de banco de dados:**
1. Verifique DATABASE_URL
2. Verifique conexão com PostgreSQL
3. Verifique logs do backend

**WhatsApp Server não inicia:**
1. Verifique se o Node.js está instalado
2. Verifique se o arquivo whatsapp-server-simple.js existe
3. Verifique logs do backend
4. Tente iniciar manualmente: `node whatsapp-server-simple.js`

### **Contato**
- **Email**: suporte@sacsmax.com
- **GitHub**: [Issues](https://github.com/seu-usuario/sacsmax/issues)
- **Documentação**: [Wiki](https://github.com/seu-usuario/sacsmax/wiki)

---

## 🎉 **Pronto para Usar!**

O SacsMax está pronto para revolucionar seu atendimento ao cliente com WhatsApp em tempo real!

**🚀 Deploy agora no Railway e comece a usar!**

### **📋 Checklist de Inicialização**
- [ ] Sistema iniciado (Backend + Frontend)
- [ ] WhatsApp Server iniciado via Settings
- [ ] QR Code escaneado
- [ ] Conexão estabelecida
- [ ] Sistema funcionando!

**🎯 Sistema otimizado para Railway - Sem conflitos de processos!**

