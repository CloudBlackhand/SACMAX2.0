#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo problemas do Railway...\n');

// 1. Verificar e corrigir configuração do banco de dados
console.log('📊 1. Verificando configuração do banco de dados...');

const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
}

// Adicionar configurações do Railway PostgreSQL se não existirem
if (!envContent.includes('DATABASE_URL')) {
    envContent += `
# === RAILWAY POSTGRESQL ===
# Estas variáveis serão configuradas automaticamente pelo Railway
DATABASE_URL=${process.env.DATABASE_URL || ''}
DATABASE_PUBLIC_URL=${process.env.DATABASE_PUBLIC_URL || ''}
`;
}

// 2. Corrigir configuração do WhatsApp para Railway
console.log('📱 2. Corrigindo configuração do WhatsApp...');

if (!envContent.includes('PUPPETEER_EXECUTABLE_PATH')) {
    envContent += `
# === WHATSAPP RAILWAY ===
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
WHATSAPP_HEADLESS=true
`;
}

// 3. Salvar arquivo .env atualizado
fs.writeFileSync(envPath, envContent);
console.log('✅ Arquivo .env atualizado');

// 4. Verificar e corrigir Dockerfile para Railway
console.log('🐳 3. Verificando Dockerfile...');

const dockerfilePath = path.join(__dirname, 'docker', 'Dockerfile.production');
if (fs.existsSync(dockerfilePath)) {
    let dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
    
    // Adicionar instalação do Chrome se não existir
    if (!dockerfileContent.includes('google-chrome')) {
        const chromeInstall = `
# Instalar Google Chrome para WhatsApp
RUN apt-get update && apt-get install -y \\
    wget \\
    gnupg \\
    && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \\
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \\
    && apt-get update \\
    && apt-get install -y google-chrome-stable \\
    && rm -rf /var/lib/apt/lists/*

`;
        
        // Inserir após FROM
        dockerfileContent = dockerfileContent.replace(
            /FROM node:(\d+)/,
            `FROM node:$1\n${chromeInstall}`
        );
        
        fs.writeFileSync(dockerfilePath, dockerfileContent);
        console.log('✅ Dockerfile atualizado com Chrome');
    }
}

// 5. Verificar e corrigir railway.toml
console.log('🚄 4. Verificando railway.toml...');

const railwayTomlPath = path.join(__dirname, 'railway.toml');
if (fs.existsSync(railwayTomlPath)) {
    let railwayContent = fs.readFileSync(railwayTomlPath, 'utf8');
    
    // Adicionar variáveis de ambiente necessárias
    if (!railwayContent.includes('DATABASE_URL')) {
        railwayContent += `
# Configurações do banco de dados
DATABASE_URL = "\${DATABASE_URL}"
DATABASE_PUBLIC_URL = "\${DATABASE_PUBLIC_URL}"

# Configurações do WhatsApp
PUPPETEER_EXECUTABLE_PATH = "/usr/bin/google-chrome"
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true"
WHATSAPP_HEADLESS = "true"

# Configurações de performance
MAX_CONCURRENT_UPLOADS = "3"
CACHE_TTL = "3600"
DB_POOL_SIZE = "10"
`;
        
        fs.writeFileSync(railwayTomlPath, railwayContent);
        console.log('✅ railway.toml atualizado');
    }
}

// 6. Criar script de inicialização para Railway
console.log('🚀 5. Criando script de inicialização...');

const startScript = `#!/bin/bash
echo "🚀 Iniciando SacsMax no Railway..."

# Verificar se o Chrome está instalado
if [ ! -f "/usr/bin/google-chrome" ]; then
    echo "❌ Chrome não encontrado, instalando..."
    apt-get update && apt-get install -y \\
        wget \\
        gnupg \\
        && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \\
        && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \\
        && apt-get update \\
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
`;

fs.writeFileSync(path.join(__dirname, 'start-railway.sh'), startScript);
fs.chmodSync(path.join(__dirname, 'start-railway.sh'), '755');
console.log('✅ Script de inicialização criado');

// 7. Verificar e corrigir serviço de banco de dados
console.log('🗄️ 6. Verificando serviço de banco de dados...');

const supabaseServicePath = path.join(__dirname, 'backend', 'services', 'supabaseService.js');
if (fs.existsSync(supabaseServicePath)) {
    let supabaseContent = fs.readFileSync(supabaseServicePath, 'utf8');
    
    // Verificar se está usando Railway PostgreSQL
    if (supabaseContent.includes('createRailwayClient')) {
        console.log('✅ Serviço de banco configurado para Railway');
    } else {
        console.log('⚠️  Serviço de banco precisa ser atualizado para Railway');
    }
}

console.log('\n🎉 Correções aplicadas!');
console.log('\n📋 Próximos passos:');
console.log('1. Configure as variáveis de ambiente no Railway:');
console.log('   - DATABASE_URL');
console.log('   - DATABASE_PUBLIC_URL');
console.log('   - PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome');
console.log('   - WHATSAPP_HEADLESS=true');
console.log('\n2. Faça deploy no Railway:');
console.log('   railway up');
console.log('\n3. Verifique os logs:');
console.log('   railway logs');
