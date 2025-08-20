#!/usr/bin/env node

/**
 * Configuração Rápida Railway PostgreSQL - SacsMax
 * Script para configurar DATABASE_URL corretamente
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚂 Configuração Rápida Railway PostgreSQL\n');

// Verificar se Railway CLI está disponível
function checkRailwayCLI() {
    try {
        const version = execSync('railway --version', { encoding: 'utf8' }).trim();
        console.log(`✅ Railway CLI: ${version}`);
        return true;
    } catch (error) {
        console.log('❌ Railway CLI não encontrado');
        console.log('📥 Instale com: npm install -g @railway/cli');
        return false;
    }
}

// Verificar login
function checkLogin() {
    try {
        const user = execSync('railway whoami', { encoding: 'utf8' }).trim();
        console.log(`✅ Logado como: ${user}`);
        return true;
    } catch (error) {
        console.log('❌ Não está logado no Railway');
        console.log('🔐 Faça login: railway login');
        return false;
    }
}

// Obter DATABASE_URL do Railway
function getDatabaseURL() {
    try {
        const dbUrl = execSync('railway variables get DATABASE_URL', { encoding: 'utf8' }).trim();
        if (dbUrl && dbUrl !== 'undefined') {
            console.log(`✅ DATABASE_URL encontrada: ${dbUrl.substring(0, 50)}...`);
            return dbUrl;
        } else {
            console.log('❌ DATABASE_URL não configurada');
            return null;
        }
    } catch (error) {
        console.log('❌ Erro ao obter DATABASE_URL');
        return null;
    }
}

// Configurar .env com DATABASE_URL
function setupEnvFile(databaseUrl) {
    const envPath = path.join(__dirname, '.env');
    
    try {
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Remover DATABASE_URL antigas
        let lines = envContent.split('\n').filter(line => 
            !line.startsWith('DATABASE_URL=') && 
            !line.startsWith('DATABASE_PUBLIC_URL=')
        );

        // Adicionar novas DATABASE_URL
        lines.push(`DATABASE_URL=${databaseUrl}`);
        lines.push(`DATABASE_PUBLIC_URL=${databaseUrl}`);

        // Garantir que NODE_ENV e PORT estão corretos
        if (!lines.find(line => line.startsWith('NODE_ENV='))) {
            lines.push('NODE_ENV=production');
        }
        if (!lines.find(line => line.startsWith('PORT='))) {
            lines.push('PORT=3001');
        }

        fs.writeFileSync(envPath, lines.join('\n'));
        console.log('✅ Arquivo .env atualizado com DATABASE_URL');
        return true;
    } catch (error) {
        console.log('❌ Erro ao atualizar .env:', error.message);
        return false;
    }
}

// Verificar se há PostgreSQL no projeto
function checkPostgreSQLService() {
    try {
        const services = execSync('railway services', { encoding: 'utf8' });
        if (services.includes('postgresql') || services.includes('postgres')) {
            console.log('✅ PostgreSQL encontrado no projeto');
            return true;
        } else {
            console.log('❌ PostgreSQL não encontrado no projeto');
            console.log('💡 Adicione um banco de dados PostgreSQL no Railway Dashboard');
            return false;
        }
    } catch (error) {
        console.log('⚠️ Não foi possível verificar serviços');
        return false;
    }
}

// Função principal
async function main() {
    console.log('🔍 Verificando configuração Railway...\n');

    if (!checkRailwayCLI()) {
        process.exit(1);
    }

    if (!checkLogin()) {
        process.exit(1);
    }

    if (!checkPostgreSQLService()) {
        console.log('\n📋 Para adicionar PostgreSQL:');
        console.log('   1. Vá para railway.app/dashboard');
        console.log('   2. Selecione seu projeto');
        console.log('   3. Clique em "New" → "Database" → "PostgreSQL"');
        console.log('   4. Aguarde a criação');
        process.exit(1);
    }

    const databaseUrl = getDatabaseURL();
    if (!databaseUrl) {
        console.log('\n❌ DATABASE_URL não encontrada');
        console.log('💡 Verifique se o PostgreSQL está conectado ao projeto');
        process.exit(1);
    }

    if (setupEnvFile(databaseUrl)) {
        console.log('\n🎉 Configuração concluída!');
        console.log('\n📊 Próximos passos:');
        console.log('   1. Teste local: node test-railway-connection.js');
        console.log('   2. Configure banco: node setup-railway-db.js');
        console.log('   3. Deploy: railway up');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    checkRailwayCLI,
    checkLogin,
    getDatabaseURL,
    setupEnvFile
};