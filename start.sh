#!/bin/bash

# Script de inicialização simplificado para Railway
echo "🚀 Iniciando SacsMax Automation..."

# Carregar variáveis de ambiente
export NODE_ENV=production
export PATH="$PATH:/usr/local/bin"

# Verificar se Node.js está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado"
    exit 1
fi

# Verificar se npm está disponível
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios necessários..."
mkdir -p uploads logs config

# Verificar permissões
chmod 755 uploads logs config

echo "🌐 Iniciando servidor..."
npm start