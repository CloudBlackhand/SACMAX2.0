#!/bin/bash

echo "🐳 Iniciando teste de build Docker..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado"
    exit 1
fi

# Parar containers anteriores
echo "🧹 Limpando containers anteriores..."
docker-compose down --remove-orphans 2>/dev/null || true

# Remover imagens antigas
echo "🗑️ Removendo imagens antigas..."
docker rmi sacsmax-automation:latest 2>/dev/null || true

# Build da imagem
echo "🔨 Construindo imagem Docker..."
docker build -f docker/Dockerfile -t sacsmax-automation:latest .

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    
    # Testar a imagem
    echo "🧪 Testando a imagem..."
    docker run --rm -it --name test-sacsmax sacsmax-automation:latest npm --version
    
    if [ $? -eq 0 ]; then
        echo "✅ Imagem testada com sucesso!"
    else
        echo "❌ Falha no teste da imagem"
        exit 1
    fi
else
    echo "❌ Build falhou"
    exit 1
fi

echo "🎉 Todos os testes concluídos!"