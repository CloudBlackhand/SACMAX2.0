# SACSMAX - Sistema de Automação de Contatos e Feedback

Sistema completo para automação de envio de mensagens WhatsApp com integração de arquivos Excel, desenvolvido em Python (FastAPI) com frontend JavaScript.

## 🚀 Funcionalidades

- **Upload e processamento de arquivos Excel/CSV**
- **Integração com WhatsApp Web.js**
- **Envio de mensagens individuais e em lote**
- **Templates de mensagens personalizáveis**
- **Gerenciamento de contatos**
- **Sistema de autenticação**
- **Banco de dados PostgreSQL**
- **Deploy automatizado no Railway**

## 📁 Estrutura do Projeto

```
SacsMax/
├── frontend/                 # Interface web existente
│   ├── webInterface.js      # Interface principal
│   ├── services/           # Serviços de API
│   └── ...
├── backend/                 # Backend Python
│   ├── main.py             # Aplicação principal
│   ├── app/
│   │   ├── core/           # Configurações e banco
│   │   ├── api/routes/     # Rotas da API
│   │   └── services/       # Serviços (Excel, WhatsApp)
│   ├── whatsapp-web.js/    # Servidor WhatsApp Web.js
│   └── requirements.txt    # Dependências Python
├── excel test/             # Arquivos de teste
└── README.md
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web Python
- **SQLAlchemy** - ORM para banco de dados
- **PostgreSQL** - Banco de dados principal
- **Pandas** - Processamento de Excel
- **JWT** - Autenticação
- **Gunicorn** - Servidor WSGI

### WhatsApp Integration
- **Baileys** - Biblioteca WhatsApp Web.js
- **Express.js** - Servidor Node.js
- **Socket.io** - Comunicação em tempo real

### Deploy
- **Railway** - Plataforma de deploy
- **Docker** - Containerização

## 🚀 Deploy no Railway

### 1. Preparação do Projeto

1. **Clone o repositório:**
```bash
git clone <seu-repositorio>
cd SacsMax
```

2. **Configure as variáveis de ambiente:**
```bash
cp backend/env.example backend/.env
```

### 2. Deploy no Railway

#### Opção A: Deploy via Railway CLI

1. **Instale o Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Faça login no Railway:**
```bash
railway login
```

3. **Inicialize o projeto:**
```bash
cd backend
railway init
```

4. **Configure as variáveis de ambiente:**
```bash
railway variables set ENVIRONMENT=production
railway variables set SECRET_KEY=sua-chave-secreta-aqui
railway variables set DATABASE_URL=postgresql://...
```

5. **Deploy:**
```bash
railway up
```

#### Opção B: Deploy via GitHub

1. **Conecte seu repositório ao Railway**
2. **Configure as variáveis de ambiente no painel do Railway**
3. **Deploy automático será realizado**

### 3. Configuração do Banco de Dados

1. **Crie um banco PostgreSQL no Railway**
2. **Configure a variável `DATABASE_URL`**
3. **Execute as migrações:**
```bash
railway run python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 4. Configuração do WhatsApp Web.js

1. **Deploy do servidor WhatsApp Web.js:**
```bash
cd backend/whatsapp-web.js
railway up
```

2. **Configure a URL do WhatsApp Web.js no backend**

## 🔧 Configuração Local

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis (opcional)

### Instalação

1. **Backend Python:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

2. **WhatsApp Web.js:**
```bash
cd backend/whatsapp-web.js
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

### Execução Local

1. **Backend:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

2. **WhatsApp Web.js:**
```bash
cd backend/whatsapp-web.js
npm start
```

3. **Frontend:**
```bash
cd frontend
npm start
```

## 📱 Uso da API

### Endpoints Principais

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Informações do usuário

#### Excel
- `POST /api/excel/upload` - Upload de arquivo Excel
- `GET /api/excel/files` - Listar arquivos
- `GET /api/excel/files/{id}/contacts` - Contatos do arquivo

#### WhatsApp
- `POST /api/whatsapp/start` - Iniciar sessão
- `POST /api/whatsapp/stop` - Parar sessão
- `GET /api/whatsapp/status` - Status da conexão
- `GET /api/whatsapp/qr` - QR Code
- `POST /api/whatsapp/send` - Enviar mensagem
- `POST /api/whatsapp/send-messages` - Envio em lote

#### Contatos
- `GET /api/contacts` - Listar contatos
- `PUT /api/contacts/{id}` - Atualizar contato
- `DELETE /api/contacts/{id}` - Deletar contato

#### Templates
- `GET /api/feedback/templates` - Listar templates
- `POST /api/feedback/templates` - Criar template
- `PUT /api/feedback/templates/{id}` - Atualizar template

### Exemplo de Uso

1. **Upload de Excel:**
```bash
curl -X POST "https://seu-app.railway.app/api/excel/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@contatos.xlsx"
```

2. **Iniciar WhatsApp:**
```bash
curl -X POST "https://seu-app.railway.app/api/whatsapp/start"
```

3. **Enviar mensagem:**
```bash
curl -X POST "https://seu-app.railway.app/api/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Olá! Como vai?",
    "message_type": "text"
  }'
```

## 🔒 Variáveis de Ambiente

### Obrigatórias
- `DATABASE_URL` - URL do banco PostgreSQL
- `SECRET_KEY` - Chave secreta para JWT
- `ENVIRONMENT` - Ambiente (development/production)

### Opcionais
- `REDIS_URL` - URL do Redis (para Celery)
- `WHATSAPP_SESSION_PATH` - Caminho das sessões WhatsApp
- `UPLOAD_FOLDER` - Pasta de uploads
- `LOG_LEVEL` - Nível de log

## 📊 Monitoramento

### Health Check
- `GET /health` - Status da aplicação
- `GET /api/whatsapp/status` - Status do WhatsApp
- `GET /api/auth/health` - Status da autenticação

### Logs
```bash
railway logs
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco:**
   - Verifique a `DATABASE_URL`
   - Certifique-se de que o banco está ativo

2. **WhatsApp não conecta:**
   - Verifique se o WhatsApp Web.js está rodando
   - Confirme se o QR Code foi escaneado

3. **Erro de upload de Excel:**
   - Verifique o formato do arquivo
   - Confirme se as colunas estão corretas

4. **Problemas de CORS:**
   - Configure as origens permitidas no CORS
   - Verifique se o frontend está acessando a URL correta

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato:
- Email: suporte@sacsmax.com
- Discord: [Link do servidor]
- Documentação: [Link da documentação]

---

**SACSMAX** - Automatizando comunicação, conectando pessoas! 🚀

