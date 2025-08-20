#!/bin/bash
echo "🚀 Iniciando SacsMax no Railway..."

# Verificar se o Chrome está instalado
if [ ! -f "/usr/bin/google-chrome" ]; then
    echo "❌ Chrome não encontrado, instalando..."
    apt-get update && apt-get install -y \
        wget \
        gnupg \
        && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
        && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
        && apt-get update \
        && apt-get install -y google-chrome-stable
fi

# Verificar variáveis de ambiente
echo "📊 Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL não configurada"
else
    echo "✅ DATABASE_URL configurada"
fi

# Iniciar aplicação
echo "🎯 Iniciando aplicação..."
npm start
