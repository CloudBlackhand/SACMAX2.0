#!/bin/bash

echo "🚀 Iniciando deploy do SacsMax no Railway..."

# Verificar se estamos conectados ao Railway
echo "📋 Verificando status do Railway..."
railway status

# Tentar fazer o deploy
echo "📤 Fazendo deploy..."
railway up

# Se falhar, tentar alternativas
if [ $? -ne 0 ]; then
    echo "⚠️ Deploy falhou, tentando alternativas..."
    
    # Tentar deploy via GitHub
    echo "🔄 Tentando deploy via GitHub..."
    git add .
    git commit -m "Deploy automático - SacsMax 2.1.0"
    git push origin main
    
    # Aguardar um pouco
    sleep 10
    
    # Verificar logs
    echo "📋 Verificando logs..."
    railway logs
fi

echo "✅ Deploy concluído!"
