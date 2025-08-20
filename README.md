# SacsMax - Sistema de Gestão de SAC 🚀

Sistema completo de gestão de SAC com interface WhatsApp, bot automático e gerenciamento de contatos.

## 🎯 Características

- **Frontend Puro JavaScript**: Interface moderna sem arquivos HTML estáticos
- **Backend Python**: API REST com Flask
- **WhatsApp Clone**: Interface familiar para comunicação
- **Bot Automático**: Configuração de respostas automáticas
- **Upload de Excel**: Processamento de planilhas
- **Gestão de Contatos**: CRUD completo de contatos
- **Dashboard**: Estatísticas e métricas em tempo real
- **Configurações**: Sistema completo de configurações

## 🏗️ Arquitetura

```
SacsMax/
├── railway_startup.py      # Arquivo principal para Railway
├── requirements.txt        # Dependências Python
├── railway.json           # Configuração Railway
├── Procfile              # Configuração Heroku/Railway
├── runtime.txt           # Versão Python
├── frontend/             # Frontend JavaScript
│   ├── index.html        # Página inicial
│   ├── main.js           # Aplicação principal
│   ├── package.json      # Dependências Node.js
│   └── modules/          # Módulos da aplicação
│       ├── dashboard.js
│       ├── excel.js
│       ├── whatsapp.js
│       ├── bot.js
│       ├── contacts.js
│       └── settings.js
└── backend/              # Backend Python (criado automaticamente)
    ├── app.py            # API Flask
    └── requirements.txt  # Dependências backend
```

## 🚀 Deploy no Railway

### 1. Preparação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd SacsMax

# Teste local (opcional)
python test_startup.py
```

### 2. Deploy Automático

1. Conecte seu repositório ao Railway
2. O Railway detectará automaticamente:
   - `railway.json` para configuração
   - `requirements.txt` para dependências Python
   - `frontend/package.json` para dependências Node.js

### 3. Comando de Inicialização

O Railway executará automaticamente:
```bash
python railway_startup.py
```

Este comando irá:
- ✅ Verificar dependências Python
- ✅ Instalar dependências Node.js
- ✅ Criar backend se não existir
- ✅ Iniciar servidor backend (porta +1)
- ✅ Iniciar servidor frontend (porta principal)
- ✅ Configurar CORS e roteamento

## 🛠️ Desenvolvimento Local

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- npm 8+

### Instalação

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd SacsMax

# 2. Instale dependências Python
pip install -r requirements.txt

# 3. Instale dependências Node.js
cd frontend
npm install
cd ..

# 4. Execute o teste
python test_startup.py

# 5. Inicie o sistema
python railway_startup.py
```

### Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📱 Módulos Disponíveis

### 🏠 Dashboard
- Estatísticas em tempo real
- Gráficos de atividade
- Métricas de performance

### 📊 Excel Upload
- Upload drag & drop
- Validação de arquivos
- Mapeamento de colunas
- Preview de dados
- Histórico de uploads

### 💬 WhatsApp Clone
- Interface familiar
- Lista de contatos
- Chat em tempo real
- Status de conexão
- Configurações de auto-resposta

### 🤖 Bot Configuration
- Configuração de nome
- Mensagens de boas-vindas
- Horário de funcionamento
- Respostas automáticas por palavra-chave
- Teste em tempo real

### 👥 Gestão de Contatos
- CRUD completo
- Busca e filtros
- Ações em lote
- Exportação CSV
- Histórico de atividades

### ⚙️ Configurações
- Configurações gerais
- Notificações
- Segurança
- Integrações
- Backup e restauração

## 🔧 Configuração

### Variáveis de Ambiente

```bash
PORT=3000                    # Porta principal (frontend)
BACKEND_PORT=3001           # Porta do backend
NODE_ENV=production         # Ambiente Node.js
FLASK_ENV=production        # Ambiente Flask
```

### Personalização

1. **Tema**: Edite `frontend/modules/settings.js`
2. **API**: Modifique `backend/app.py`
3. **Módulos**: Adicione novos em `frontend/modules/`

## 📊 API Endpoints

### Backend (Porta +1)

- `GET /api/health` - Status do sistema
- `GET /api/stats` - Estatísticas
- `GET /api/contacts` - Listar contatos
- `POST /api/contacts` - Criar contato
- `GET /api/messages` - Listar mensagens
- `POST /api/messages` - Enviar mensagem
- `GET /api/bot/config` - Configuração do bot
- `PUT /api/bot/config` - Atualizar bot
- `POST /api/excel/upload` - Upload Excel

## 🔒 Segurança

- CORS configurado
- Validação de entrada
- Sanitização de dados
- Rate limiting (em produção)

## 📈 Performance

- Frontend otimizado
- Lazy loading de módulos
- Cache local (localStorage)
- Compressão de assets

## 🐛 Troubleshooting

### Problemas Comuns

1. **Porta em uso**
   ```bash
   # Verifique portas
   lsof -i :3000
   lsof -i :3001
   ```

2. **Dependências faltando**
   ```bash
   # Reinstale dependências
   pip install -r requirements.txt
   cd frontend && npm install
   ```

3. **Backend não inicia**
   ```bash
   # Verifique logs
   python railway_startup.py
   ```

### Logs

- **Frontend**: Console do navegador
- **Backend**: Terminal/Logs Railway
- **Sistema**: `python railway_startup.py`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

- **Issues**: GitHub Issues
- **Documentação**: Este README
- **Email**: suporte@sacsmax.com

---

**SacsMax** - Transformando a gestão de SAC! 🚀

