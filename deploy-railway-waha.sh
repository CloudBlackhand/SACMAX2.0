#!/bin/bash

# Script de Deploy para Railway com WAHA
echo "🚀 Deploy SacsMax + WAHA no Railway"
echo "=================================="

# Verificar se está no diretório correto
if [ ! -f "railway_startup.py" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não encontrado"
    echo "📦 Instale: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI encontrado"

# Fazer login no Railway (se necessário)
echo "🔐 Verificando login no Railway..."
if ! railway whoami &> /dev/null; then
    echo "📝 Fazendo login no Railway..."
    railway login
fi

echo "✅ Logado no Railway"

# Criar projeto (se não existir)
echo "🏗️ Verificando projeto Railway..."
if ! railway project &> /dev/null; then
    echo "📦 Criando novo projeto Railway..."
    railway project create
fi

echo "✅ Projeto Railway configurado"

# Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
railway variables set RAILWAY_ENVIRONMENT=production
railway variables set NODE_ENV=production
railway variables set WAHA_URL=http://waha:3000

echo "✅ Variáveis de ambiente configuradas"

# Deploy
echo "🚀 Iniciando deploy..."
railway up

echo "✅ Deploy concluído!"
echo ""
echo "🌐 URLs do sistema:"
echo "Frontend: $(railway domain)"
echo "API Docs: $(railway domain)/docs"
echo ""
echo "📱 Para configurar WAHA:"
echo "1. Acesse o frontend"
echo "2. Vá em Settings"
echo "3. Configure WAHA"
echo ""
echo "🎉 Sistema pronto para uso!"
