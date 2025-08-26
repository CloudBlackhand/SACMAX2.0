#!/bin/bash

# Script de teste para deploy Railway
echo "🧪 Testando configuração do Railway..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado"
    exit 1
fi

echo "✅ Docker encontrado"

# Verificar se os arquivos necessários existem
required_files=(
    "Dockerfile"
    "docker-entrypoint.sh"
    "railway_startup.py"
    "whatsapp-server-simple.js"
    "requirements.txt"
    "package.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo $file não encontrado"
        exit 1
    fi
    echo "✅ $file encontrado"
done

# Testar build do Docker
echo "🔨 Testando build do Docker..."
if docker build -t sacsmax-test .; then
    echo "✅ Build do Docker bem-sucedido"
else
    echo "❌ Falha no build do Docker"
    exit 1
fi

# Testar execução do container
echo "🚀 Testando execução do container..."
docker run -d --name sacsmax-test-container -p 8000:8000 -p 3002:3002 \
    -e RAILWAY_ENVIRONMENT=test \
    -e PORT=8000 \
    -e WHATSAPP_PORT=3002 \
    sacsmax-test

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 30

# Testar health checks
echo "🔍 Testando health checks..."

# Testar backend
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ Backend health check: OK"
else
    echo "❌ Backend health check: FALHOU"
fi

# Testar WhatsApp server
if curl -f http://localhost:3002/api/status > /dev/null 2>&1; then
    echo "✅ WhatsApp server health check: OK"
else
    echo "❌ WhatsApp server health check: FALHOU"
fi

# Parar e remover container
echo "🛑 Parando container de teste..."
docker stop sacsmax-test-container
docker rm sacsmax-test-container

echo "🎉 Teste concluído!"
echo "💡 Se todos os testes passaram, o deploy no Railway deve funcionar"
