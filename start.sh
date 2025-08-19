#!/bin/sh

# Script de inicialização ultra-rápido para Railway
echo "🚀 Iniciando SacsMax Automation..."

# Configurar ambiente
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=${PORT:-3000}

# Iniciar imediatamente sem verificações complexas
cd /app
exec node backend/server.js