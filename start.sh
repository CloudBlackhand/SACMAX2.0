#!/bin/bash

# Script de inicialização robusta para Railway
# Garante que o sistema está pronto antes de iniciar

echo "🚀 Iniciando SacsMax Automation..."
echo "📊 Verificando integridade do sistema..."

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

# Executar verificação de saúde
echo "🔍 Executando verificação de saúde..."
node -e "
const systemHealth = require('./backend/utils/systemHealth');
systemHealth.logHealthStatus().then(report => {
    if (report.summary.status === 'healthy') {
        console.log('✅ Sistema pronto para iniciar');
        process.exit(0);
    } else {
        console.log('⚠️  Sistema com problemas:', JSON.stringify(report, null, 2));
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Erro na verificação:', err);
    process.exit(1);
});
"

if [ $? -eq 0 ]; then
    echo "🎉 Sistema verificado com sucesso!"
    echo "🌐 Iniciando servidor..."
    npm start
else
    echo "❌ Sistema não está pronto. Verifique os logs."
    exit 1
fi