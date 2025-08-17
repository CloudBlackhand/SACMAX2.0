#!/bin/bash

# Script de inicialização do SacsMax Automation
# Detecta ambiente e executa apropriadamente

echo "🚀 Iniciando SacsMax Automation..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Criar diretórios necessários
mkdir -p uploads logs config wwebjs_auth

# Detectar ambiente
ENV=${NODE_ENV:-development}

echo "🌍 Ambiente: $ENV"

if [ "$ENV" = "production" ]; then
    echo "🏭 Iniciando em modo produção..."
    docker-compose -f docker-compose.yml up --build -d
else
    echo "🔧 Iniciando em modo desenvolvimento..."
    docker-compose -f docker-compose.dev.yml up --build
fi

echo "✅ SacsMax Automation iniciado!"
echo "📱 Acesse: http://localhost:3000"
echo "📊 Terminal Interface: node frontend/terminalInterface.js"