#!/bin/bash

# Script de Deploy Automatizado para SACSMAX
# Railway Deployment Script

set -e

echo "🚀 SACSMAX - Deploy Automatizado"
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    error "Railway CLI não está instalado!"
    echo "Instale com: npm install -g @railway/cli"
    exit 1
fi

# Verificar se está logado no Railway
if ! railway whoami &> /dev/null; then
    error "Não está logado no Railway!"
    echo "Faça login com: railway login"
    exit 1
fi

log "Verificando estrutura do projeto..."

# Verificar se os arquivos necessários existem
required_files=(
    "backend/main.py"
    "backend/requirements.txt"
    "backend/start.sh"
    "backend/whatsapp-web.js/server.js"
    "backend/whatsapp-web.js/package.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        error "Arquivo não encontrado: $file"
        exit 1
    fi
done

log "Estrutura do projeto verificada!"

# Perguntar se quer fazer deploy do backend
echo
read -p "Deseja fazer deploy do BACKEND? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Iniciando deploy do BACKEND..."
    
    cd backend
    
    # Verificar se já existe projeto Railway
    if [ ! -f ".railway" ]; then
        log "Inicializando projeto Railway..."
        railway init
    fi
    
    # Configurar variáveis de ambiente
    log "Configurando variáveis de ambiente..."
    
    # Gerar chave secreta se não existir
    if [ -z "$SECRET_KEY" ]; then
        SECRET_KEY=$(openssl rand -hex 32)
        log "Chave secreta gerada automaticamente"
    fi
    
    # Configurar variáveis
    railway variables set ENVIRONMENT=production
    railway variables set SECRET_KEY="$SECRET_KEY"
    railway variables set LOG_LEVEL=INFO
    
    # Verificar se DATABASE_URL está configurada
    if [ -z "$DATABASE_URL" ]; then
        warn "DATABASE_URL não configurada!"
        echo "Configure manualmente no painel do Railway:"
        echo "railway variables set DATABASE_URL=postgresql://..."
    fi
    
    # Fazer deploy
    log "Fazendo deploy do backend..."
    railway up
    
    cd ..
    
    log "✅ Backend deployado com sucesso!"
else
    warn "Deploy do backend pulado."
fi

# Perguntar se quer fazer deploy do WhatsApp Web.js
echo
read -p "Deseja fazer deploy do WHATSAPP WEB.JS? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Iniciando deploy do WHATSAPP WEB.JS..."
    
    cd backend/whatsapp-web.js
    
    # Verificar se já existe projeto Railway
    if [ ! -f ".railway" ]; then
        log "Inicializando projeto Railway para WhatsApp..."
        railway init
    fi
    
    # Fazer deploy
    log "Fazendo deploy do WhatsApp Web.js..."
    railway up
    
    cd ../..
    
    log "✅ WhatsApp Web.js deployado com sucesso!"
else
    warn "Deploy do WhatsApp Web.js pulado."
fi

# Perguntar se quer configurar banco de dados
echo
read -p "Deseja configurar o BANCO DE DADOS? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Configurando banco de dados..."
    
    cd backend
    
    # Executar migrações
    log "Executando migrações..."
    railway run python -c "
from app.core.database import Base, engine
try:
    Base.metadata.create_all(bind=engine)
    print('✅ Tabelas criadas com sucesso!')
except Exception as e:
    print(f'❌ Erro: {e}')
    exit(1)
"
    
    cd ..
    
    log "✅ Banco de dados configurado!"
else
    warn "Configuração do banco pulada."
fi

# Mostrar informações finais
echo
log "🎉 Deploy concluído!"
echo
echo "📋 Próximos passos:"
echo "1. Configure a DATABASE_URL no Railway se ainda não fez"
echo "2. Acesse a documentação da API: https://seu-app.railway.app/docs"
echo "3. Teste o health check: https://seu-app.railway.app/health"
echo "4. Configure o frontend para apontar para a nova API"
echo
echo "🔗 URLs dos serviços:"
railway status 2>/dev/null || echo "Execute 'railway status' para ver as URLs"
echo
echo "📚 Documentação: https://github.com/seu-usuario/sacsmax"
echo
log "SACSMAX está pronto para uso! 🚀"

