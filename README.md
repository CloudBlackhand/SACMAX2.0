# SacsMax Automation

Sistema robusto e eficiente para automação de comunicação e análise de dados, com integração WhatsApp e processamento de planilhas Excel.

## 🚀 Funcionalidades

- **Processamento de Planilhas Excel**: Leitura e processamento de arquivos `.xlsx` e `.xls`
- **Integração WhatsApp**: Envio automatizado de mensagens via `whatsapp-web.js`
- **Classificação de Feedback**: Análise automática de feedback (positivo/negativo/neutro)
- **Interface Terminal**: Interface de linha de comando para fácil uso
- **Dockerização**: Container completo para fácil implantação
- **Deploy Railway**: Pronto para deploy na plataforma Railway

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **Python** 3.8+
- **Docker** e **Docker Compose**
- **WhatsApp Web** (para autenticação inicial)

## 🛠️ Instalação Local

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd SacsMax
```

### 2. Instale as dependências
```bash
# Dependências Node.js
npm install

# Dependências Python (opcional - já incluídas no Docker)
pip install -r python_modules/requirements.txt
```

### 3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 4. Execute o sistema

#### Modo Desenvolvimento
```bash
# Com Docker
npm run docker:dev

# Localmente
npm run dev
```

#### Modo Produção
```bash
# Com Docker
npm run docker:prod

# Localmente
npm start
```

## 🐳 Docker

### Pré-requisitos
- [Docker Desktop instalado](INSTALL_DOCKER.md)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Build da Imagem Docker

#### Scripts Disponíveis
```bash
# Build de produção otimizado
npm run docker:build:prod

# Build de desenvolvimento
npm run docker:build:dev

# Build simples
npm run docker:build

# Testar build (Windows)
npm run docker:test:win

# Testar build (Linux/Mac)
npm run docker:test
```

#### Build Manual
```bash
# Produção otimizada
docker build -f docker/Dockerfile.production -t sacsmax-automation:prod .

# Desenvolvimento com hot reload
docker build -f docker/Dockerfile.dev -t sacsmax-automation:dev .

# Build simples
docker build -f docker/Dockerfile -t sacsmax-automation .
```

### Execução com Docker

#### Docker Compose
```bash
# Desenvolvimento com volumes e hot reload
npm run docker:dev

# Produção
npm run docker:prod

# Parar containers
npm run docker:stop
```

#### Docker Run
```bash
# Produção
docker run -p 3000:3000 sacsmax-automation:prod

# Desenvolvimento
docker run -p 3000:3000 -v $(pwd):/app sacsmax-automation:dev
```

### Opção 1: Scripts de inicialização (legado)
```bash
# Windows PowerShell
.\docker\start.ps1

# Linux/Mac
./docker/start.sh
```

### Opção 2: Docker Compose manual (legado)
```bash
# Desenvolvimento
docker-compose -f docker-compose.dev.yml up --build

# Produção
docker-compose -f docker/docker-compose.yml up --build -d
```

### Solução de Problemas
Se encontrar erros durante o build:
1. Consulte [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)
2. Verifique [INSTALL_DOCKER.md](INSTALL_DOCKER.md)
3. Use os scripts de teste para diagnóstico

## 🚄 Deploy na Railway

### 1. Instale a CLI do Railway
```bash
npm install -g @railway/cli
```

### 2. Faça login
```bash
railway login
```

### 3. Deploy
```bash
railway up
```

### 4. Configure as variáveis de ambiente
Acesse o dashboard da Railway e configure as variáveis de ambiente conforme necessário.

## 📱 Uso

### Interface Terminal
```bash
npm run terminal
```

Opções disponíveis:
1. Processar planilha Excel
2. Verificar status do WhatsApp
3. Enviar mensagens
4. Classificar feedback
5. Ver estatísticas
6. Configurar API URL

### API REST

#### Upload de planilha
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@planilha.xlsx"
```

#### Enviar mensagem WhatsApp
```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{"number": "5511999999999", "message": "Olá!"}'
```

#### Classificar feedback
```bash
curl -X POST http://localhost:3000/api/feedback/classify \
  -H "Content-Type: application/json" \
  -d '{"feedback": "Ótimo atendimento!"}'
```

## 📁 Estrutura do Projeto

```
SacsMax/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── services/
│   │   ├── whatsappService.js # Integração WhatsApp
│   │   ├── excelProcessor.js  # Processamento Excel
│   │   └── feedbackClassifier.js # Classificação de feedback
│   └── utils/
│       └── logger.js          # Sistema de logs
├── frontend/
│   └── terminalInterface.js   # Interface terminal
├── python_modules/
│   ├── excel_processor.py     # Processador Excel Python
│   └── requirements.txt       # Dependências Python
├── docker/
│   ├── Dockerfile            # Imagem Docker
│   ├── start.sh             # Script Linux/Mac
│   └── start.ps1            # Script Windows
├── uploads/                   # Arquivos enviados
├── logs/                      # Arquivos de log
├── config/                    # Configurações
├── .env                      # Variáveis de ambiente
├── railway.toml              # Config Railway
└── docker-compose.dev.yml    # Compose desenvolvimento
```

## 🔧 Configuração

### Variáveis de ambiente principais:

```env
# Servidor
NODE_ENV=development
PORT=3000
HOST=localhost

# WhatsApp
WHATSAPP_SESSION_NAME=sacsmax-session
WHATSAPP_HEADLESS=false
WHATSAPP_QR_TIMEOUT=60000

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Python
PYTHON_PATH=python
EXCEL_PROCESSOR_PATH=./python_modules/excel_processor.py
```

## 🐛 Solução de Problemas

### WhatsApp não conecta
1. Verifique se o QR code foi escaneado
2. Limpe a sessão: `rm -rf wwebjs_auth`
3. Reinicie o serviço

### Docker não inicia
1. Verifique se o Docker está rodando
2. Verifique portas: `docker ps`
3. Verifique logs: `docker logs <container-id>`

### Railway deploy falha
1. Verifique railway.toml
2. Configure variáveis de ambiente no dashboard
3. Verifique logs: `railway logs`

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.