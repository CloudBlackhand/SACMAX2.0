#!/bin/bash
# Script de Deploy para Railway - SacsMax 2.2
# Arquitetura Multi-Processo Otimizada

set -e

echo "🚀 SacsMax - Deploy para Railway"
echo "=================================="

# Verificar se estamos no Railway
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "✅ Ambiente Railway detectado: $RAILWAY_ENVIRONMENT"
else
    echo "⚠️ Ambiente local detectado"
fi

# Instalar dependências Python
echo "📦 Instalando dependências Python..."
pip install -r requirements.txt

# Instalar dependências Node.js
echo "📦 Instalando dependências Node.js..."
npm install

# Verificar se os arquivos necessários existem
echo "🔍 Verificando arquivos..."
if [ ! -f "railway_startup.py" ]; then
    echo "❌ railway_startup.py não encontrado"
    exit 1
fi

if [ ! -f "whatsapp-server-simple.js" ]; then
    echo "❌ whatsapp-server-simple.js não encontrado"
    exit 1
fi

if [ ! -f "backend/app/app.py" ]; then
    echo "❌ backend/app/app.py não encontrado"
    exit 1
fi

echo "✅ Todos os arquivos necessários encontrados"

# Configurar permissões
echo "🔐 Configurando permissões..."
chmod +x railway_startup.py
chmod +x whatsapp-server-simple.js

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p uploads
mkdir -p whatsapp_sessions
mkdir -p backend/uploads
mkdir -p backend/whatsapp_sessions

echo "✅ Deploy configurado com sucesso!"
echo "🚀 Iniciando sistema..."

# Iniciar o sistema
exec python3 railway_startup.py
