# 🚀 SacsMax com WAHA

**Sistema de Gestão de SAC integrado com WAHA (WhatsApp HTTP API)**

## 📋 Visão Geral

O SacsMax agora usa o **WAHA** como solução de WhatsApp, eliminando a necessidade de QR Codes e oferecendo uma API robusta e confiável.

### ✨ Benefícios do WAHA

- **Sem QR Code** - Autenticação via código SMS/Telegram
- **API REST** - Interface simples e documentada
- **Múltiplas sessões** - Suporte a vários números
- **Docker ready** - Fácil deploy no Railway
- **Estável** - Sem dependências problemáticas

## 🛠️ Instalação

### Opção 1: Docker (Recomendado)

```bash
# Clonar repositório
git clone https://github.com/CloudBlackhand/SACMAX2.0.git
cd SACMAX2.0

# Iniciar com Docker
docker-compose up -d
```

### Opção 2: Desenvolvimento Local

```bash
# Instalar dependências Python
pip install -r requirements.txt

# Iniciar backend
python railway_startup.py

# Em outro terminal, iniciar WAHA
docker run -d -p 3000:3000 devlikeapro/waha:latest
```

## 🌐 Acessos

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/docs
- **WAHA API**: http://localhost:3000

## 📱 Configurando WAHA

### 1. Acesse o Frontend
Abra http://localhost:5000 no navegador

### 2. Vá em Settings
Clique no ícone ⚙️ (Configurações)

### 3. Aba WAHA
- Clique em **"Conectar WAHA"**
- Configure a sessão (padrão: "sacsmax")
- Use o screenshot para verificar status

### 4. Autenticação
O WAHA oferece múltiplas opções de autenticação:

#### Opção A: Código SMS
- Digite seu número no formato: `5511999999999`
- Receba código via SMS
- Digite o código no WAHA

#### Opção B: Código Telegram
- Configure bot do Telegram
- Receba código via Telegram
- Digite o código no WAHA

#### Opção C: Link Direto
- Use link direto do WhatsApp
- Sem necessidade de código

## 🔧 APIs Disponíveis

### WAHA Direto (Porta 3000)
```bash
# Status
GET http://localhost:3000/api/status

# Criar sessão
POST http://localhost:3000/api/sessions
{"name": "sacsmax"}

# Screenshot
GET http://localhost:3000/api/screenshot?session=sacsmax

# Enviar mensagem
POST http://localhost:3000/api/sendText
{
  "session": "sacsmax",
  "chatId": "5511999999999",
  "text": "Olá!"
}
```

### Backend SacsMax (Porta 5000)
```bash
# Status WAHA
GET http://localhost:5000/api/waha/status

# Criar sessão WAHA
POST http://localhost:5000/api/waha/sessions

# Screenshot WAHA
GET http://localhost:5000/api/waha/screenshot

# Enviar mensagem WAHA
POST http://localhost:5000/api/waha/send-message
```

## 🧪 Testes

```bash
# Testar sistema
python test_waha.py

# Testar APIs
curl http://localhost:3000/api/status
curl http://localhost:5000/health
```

## 🚀 Deploy no Railway

O sistema está configurado para deploy automático no Railway:

1. **Conecte o repositório** no Railway
2. **Configure as variáveis de ambiente**:
   - `PORT`: 8000
   - `RAILWAY_ENVIRONMENT`: production
3. **Deploy automático** - O Railway detectará o `docker-compose.yml`

## 📁 Estrutura do Projeto

```
📁 SACMAX2.0/
├── 📁 backend/
│   ├── 📁 app/services/waha/     # Serviços WAHA
│   └── app.py                    # Backend principal
├── 📁 frontend/
│   └── 📁 modules/
│       └── settings.js           # Interface WAHA
├── docker-compose.yml            # WAHA + Backend
├── railway_startup.py            # Script de inicialização
└── test_waha.py                  # Testes
```

## 🔍 Troubleshooting

### WAHA não conecta
```bash
# Verificar se está rodando
docker ps | grep waha

# Ver logs
docker logs sacsmax-waha

# Reiniciar
docker-compose restart waha
```

### Backend não responde
```bash
# Verificar logs
docker logs sacsmax-backend

# Verificar saúde
curl http://localhost:5000/health
```

### Problemas de autenticação
1. Verifique se o número está no formato correto
2. Tente código SMS em vez de Telegram
3. Use link direto se disponível
4. Verifique logs do WAHA

## 📞 Suporte

- **Issues**: GitHub Issues
- **Documentação**: WAHA Docs
- **Telegram**: @devlikeapro

## 🎯 Próximos Passos

- [ ] Integração com banco de dados
- [ ] Interface de mensagens
- [ ] Bot automático
- [ ] Relatórios e analytics

---

**🎉 Sistema SacsMax com WAHA funcionando perfeitamente!**
