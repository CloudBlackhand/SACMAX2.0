# 🚀 SacsMax - Sistema de Gestão de SAC

**Sistema completo de gestão de SAC com WhatsApp em tempo real, análise de feedback e integração com Excel.**

## ✨ **Novidades da Versão 2.1.0**

### 🔥 **WhatsApp em Tempo Real**
- **WAHA Integration**: Comunicação via WhatsApp HTTP API
- **Recebimento Automático**: Mensagens aparecem instantaneamente no chat
- **Sincronização Completa**: Todos os chats e mensagens sincronizados
- **Interface Real**: Interface idêntica ao WhatsApp Web
- **Controle Manual**: WAHA iniciado via Docker

### 🎯 **Como Funciona (Versão Otimizada para Railway)**

1. **🚀 Sistema Inicia**: Backend + Frontend automaticamente
2. **🐳 WAHA via Docker**: Container WAHA rodando separadamente
3. **⚙️ Configurar WhatsApp**: Vá para módulo Settings
4. **🔗 Conectar**: Configure WAHA e autentique
5. **💬 Usar**: Sistema completo funcionando

## 🏗️ **Arquitetura do Sistema (Otimizada)**

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │  Backend        │
│   (JavaScript)  │                 │  (FastAPI)      │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │ HTTP API                          │ HTTP API
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│   WAHA          │                 │   WAHA          │
│   (Docker)      │                 │   Service       │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │ WhatsApp API                      │ WhatsApp API
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
```

### 2. Iniciar o Sistema
```bash
# Iniciar Backend + Frontend
python railway_startup.py
```

### 3. Configurar WAHA
1. Acesse: http://localhost:5000
2. Vá para o módulo **Settings**
3. Configure **WAHA** via Docker
4. Autentique seu WhatsApp

### 4. Usar o Sistema
- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/docs
- **WAHA**: http://localhost:3000 (via Docker)

## 📱 Como Usar o WhatsApp

### **Método Recomendado (Via Docker)**
1. Acesse o sistema em http://localhost:5000
2. Vá para o módulo **Settings**
3. Na seção **WAHA Configuration**:
   - Configure WAHA via Docker
   - Autentique seu WhatsApp
   - Teste a conexão
4. Vá para o módulo **WhatsApp** para usar

### **Método Docker Compose**
```bash
# Iniciar sistema completo
docker-compose up -d
```

## 🔧 Arquitetura Simplificada

```
Frontend (5000) ←→ Backend (5000) ←→ WAHA (3000) [Docker]
```

- **Frontend**: Interface do usuário
- **Backend**: API REST + Controle de processos
- **WAHA**: Container Docker para WhatsApp

## 📊 **Módulos do Sistema**

### **1. 📱 WhatsApp (Tempo Real)**
- Conexão WAHA em tempo real
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
- Controle do WAHA
- Configurações do sistema
- Logs e monitoramento
- Backup e restauração

## 🔌 **APIs Disponíveis**

### **WAHA API**
```bash
# Status do WAHA
GET /api/waha/status

# Criar sessão
POST /api/waha/sessions

# Screenshot
GET /api/waha/screenshot

# Enviar mensagem
POST /api/waha/send-message

# Obter contatos
GET /api/waha/contacts
```

### **WhatsApp API**
```bash
# Status do WhatsApp
GET /api/whatsapp/status

# Obter chats
GET /api/whatsapp/chats

# Obter mensagens
GET /api/whatsapp/messages/{contact_id}
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
├── docker-compose.yml      # Configuração Docker
├── railway_startup.py      # Script de inicialização
├── Procfile               # Configuração Railway
└── README.md              # Documentação
```

### **Tecnologias Utilizadas**
- **Frontend**: JavaScript puro, HTML5, CSS3
- **Backend**: FastAPI (Python)
- **WhatsApp**: WAHA (Docker)
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

# Verificar WAHA
GET /api/waha/status

# Verificar banco de dados
GET /api/stats
```

### **Logs**
- **Backend**: Logs detalhados no console
- **WAHA**: Logs de conexão e mensagens
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
WAHA_URL=http://waha:3000
```

### **3. Deploy Automático**
- O Railway detectará automaticamente as configurações
- Build e deploy automático a cada push
- URLs geradas automaticamente

### **4. Acessar Sistema**
- **Frontend**: URL gerada pelo Railway
- **API**: URL + /docs para documentação
- **WAHA**: Configurar via Settings

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

**WAHA não conecta:**
1. Verifique se o container WAHA está rodando
2. Verifique se a autenticação foi feita
3. Aguarde alguns segundos para conexão
4. Verifique logs do WAHA

**Mensagens não aparecem:**
1. Verifique conexão WAHA
2. Recarregue a página
3. Verifique logs do frontend

**Erro de banco de dados:**
1. Verifique DATABASE_URL
2. Verifique conexão com PostgreSQL
3. Verifique logs do backend

**WAHA não inicia:**
1. Verifique se o Docker está rodando
2. Verifique se o docker-compose.yml está correto
3. Verifique logs do Docker
4. Tente reiniciar: `docker-compose restart`

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
- [ ] WAHA configurado via Docker
- [ ] WhatsApp autenticado
- [ ] Conexão estabelecida
- [ ] Sistema funcionando!

**🎯 Sistema otimizado para Railway - WAHA via Docker!**

