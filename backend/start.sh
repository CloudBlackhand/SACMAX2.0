#!/bin/bash

# Script de inicialização para SACSMAX Backend
# Railway Deployment Script

echo "🚀 Iniciando SACSMAX Backend..."

# Verificar se estamos no Railway
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
    echo "📦 Ambiente Railway detectado: $RAILWAY_ENVIRONMENT"
    
    # Criar diretórios necessários
    mkdir -p uploads logs whatsapp_sessions
    
    # Verificar se o banco está configurado
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL não configurada"
        exit 1
    fi
    
    echo "✅ Configurações verificadas"
    
    # Executar migrações se necessário
    echo "🗄️ Verificando banco de dados..."
    python -c "
from app.core.database import Base, engine
try:
    Base.metadata.create_all(bind=engine)
    print('✅ Tabelas criadas/verificadas com sucesso')
except Exception as e:
    print(f'❌ Erro ao criar tabelas: {e}')
    exit(1)
"
    
    if [ $? -ne 0 ]; then
        echo "❌ Falha ao configurar banco de dados"
        exit 1
    fi
    
    # Iniciar aplicação
    echo "🌐 Iniciando servidor..."
    exec gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120
    
else
    echo "🖥️ Ambiente local detectado"
    
    # Criar diretórios necessários
    mkdir -p uploads logs whatsapp_sessions
    
    # Verificar se .env existe
    if [ ! -f ".env" ]; then
        echo "⚠️ Arquivo .env não encontrado, copiando exemplo..."
        cp env.example .env
        echo "📝 Configure as variáveis no arquivo .env"
    fi
    
    # Iniciar em modo desenvolvimento
    echo "🔧 Iniciando em modo desenvolvimento..."
    exec uvicorn main:app --reload --host 0.0.0.0 --port 8000
fi

