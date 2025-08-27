#!/bin/bash

# Script de inicialização para SacsMax
# Gerencia backend Python e servidor WhatsApp Node.js

set -e

echo "🚀 Iniciando SacsMax - Sistema de Gestão de SAC"
echo "================================================"

# Verificar variáveis de ambiente
PORT=${PORT:-8000}
RAILWAY_ENVIRONMENT=${RAILWAY_ENVIRONMENT:-production}

echo "🌍 Ambiente: $RAILWAY_ENVIRONMENT"
echo "🔌 Porta: $PORT"

# Função para verificar se um processo está rodando
check_process() {
    if pgrep -f "$1" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Função para iniciar o servidor WhatsApp
start_whatsapp_server() {
    echo "📱 Iniciando servidor WhatsApp (pausado)..."
    cd /app
    node whatsapp-server-simple.js &
    WHATSAPP_PID=$!
    echo "✅ WhatsApp Server iniciado (PID: $WHATSAPP_PID)"
    echo "📱 Status: Pausado - Ative via Settings quando necessário"
}

# Função para iniciar o backend Python
start_backend() {
    echo "🐍 Iniciando backend Python..."
    cd /app
    python3 railway_startup.py &
    BACKEND_PID=$!
    echo "✅ Backend Python iniciado (PID: $BACKEND_PID)"
}

# Função para verificar saúde dos serviços
check_health() {
    echo "🔍 Verificando saúde dos serviços..."
    
    # Aguardar um pouco para os serviços iniciarem
    sleep 10
    
    # Verificar backend
    if curl -f http://localhost:$PORT/api/health > /dev/null 2>&1; then
        echo "✅ Backend: OK"
    else
        echo "❌ Backend: Falha"
        return 1
    fi
    
    # Verificar WhatsApp server
    if curl -f http://localhost:3002/api/status > /dev/null 2>&1; then
        echo "✅ WhatsApp Server: OK"
    else
        echo "⚠️ WhatsApp Server: Não respondeu"
    fi
    
    return 0
}

# Função para limpar processos
cleanup() {
    echo "🛑 Parando serviços..."
    
    if [ ! -z "$WHATSAPP_PID" ]; then
        kill $WHATSAPP_PID 2>/dev/null || true
        echo "✅ WhatsApp Server parado"
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "✅ Backend parado"
    fi
    
    exit 0
}

# Configurar trap para limpeza (usando bash)
trap cleanup SIGTERM SIGINT EXIT

# Iniciar serviços
start_whatsapp_server
start_backend

# Verificar saúde
if check_health; then
    echo ""
    echo "🎉 Sistema SacsMax iniciado com sucesso!"
    echo "🌐 Frontend: http://localhost:$PORT"
    echo "🔧 Backend API: http://localhost:$PORT/docs"
    echo "📱 WhatsApp: http://localhost:3002"
    echo ""
    echo "💡 Sistema pronto para uso!"
else
    echo "❌ Falha ao verificar saúde dos serviços"
    cleanup
fi

# Manter o container rodando
wait
