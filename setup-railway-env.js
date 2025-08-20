#!/usr/bin/env node

/**
 * Script para configurar Railway PostgreSQL - SacsMax
 * Obtém e configura a DATABASE_URL do Railway
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚂 Configurando Railway PostgreSQL...\n');

async function setupRailwayEnvironment() {
    try {
        // Verificar se Railway CLI está instalado
        console.log('📋 Verificando Railway CLI...');
        try {
            execSync('railway --version', { stdio: 'pipe' });
            console.log('   ✅ Railway CLI encontrado');
        } catch (error) {
            console.log('   ❌ Railway CLI não encontrado');
            console.log('   💡 Instale com: npm install -g @railway/cli');
            return;
        }

        // Verificar login no Railway
        console.log('\n🔐 Verificando login Railway...');
        try {
            execSync('railway whoami', { stdio: 'pipe' });
            console.log('   ✅ Logado no Railway');
        } catch (error) {
            console.log('   ❌ Não logado no Railway');
            console.log('   💡 Faça login com: railway login');
            return;
        }

        // Obter DATABASE_URL do Railway
        console.log('\n🌐 Obtendo DATABASE_URL do Railway...');
        try {
            const dbUrl = execSync('railway variables get DATABASE_URL', { 
                encoding: 'utf8',
                stdio: 'pipe' 
            }).trim();
            
            if (dbUrl) {
                console.log('   ✅ DATABASE_URL obtida do Railway');
                
                // Atualizar arquivo .env
                const envPath = path.join(__dirname, '.env');
                let envContent = '';
                
                if (fs.existsSync(envPath)) {
                    envContent = fs.readFileSync(envPath, 'utf8');
                }

                // Remover DATABASE_URL antiga se existir
                const lines = envContent.split('\n').filter(line => 
                    !line.startsWith('DATABASE_URL=') && 
                    !line.startsWith('DATABASE_PUBLIC_URL=')
                );

                // Adicionar nova DATABASE_URL
                lines.push(`DATABASE_URL=${dbUrl}`);
                lines.push(`DATABASE_PUBLIC_URL=${dbUrl}`);

                fs.writeFileSync(envPath, lines.join('\n'));
                console.log('   ✅ .env atualizado com DATABASE_URL');
                console.log(`   📄 URL: ${dbUrl.substring(0, 50)}...`);

            } else {
                console.log('   ❌ DATABASE_URL não encontrada no Railway');
                console.log('   💡 Adicione um banco de dados PostgreSQL ao projeto');
                console.log('   💡 Ou configure manualmente: railway variables set DATABASE_URL "postgresql://..."');
            }

        } catch (error) {
            console.log('   ❌ Erro ao obter DATABASE_URL:', error.message);
            console.log('   💡 Verifique se há um banco de dados PostgreSQL configurado no Railway');
        }

        // Verificar variáveis Railway
        console.log('\n📊 Variáveis Railway atuais:');
        try {
            const variables = execSync('railway variables', { 
                encoding: 'utf8',
                stdio: 'pipe' 
            });
            console.log(variables);
        } catch (error) {
            console.log('   ⚠️ Não foi possível listar variáveis');
        }

    } catch (error) {
        console.error('❌ Erro ao configurar Railway:', error.message);
    }
}

// Verificar se está em ambiente Railway
function checkRailwayEnvironment() {
    const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_SERVICE_ID;
    
    console.log('\n🔍 Verificando ambiente Railway...');
    console.log(`   Railway Environment: ${isRailway ? 'Sim' : 'Não'}`);
    console.log(`   Railway Service ID: ${process.env.RAILWAY_SERVICE_ID || 'N/A'}`);
    console.log(`   Railway Project ID: ${process.env.RAILWAY_PROJECT_ID || 'N/A'}`);
    
    return !!isRailway;
}

// Executar configuração
if (require.main === module) {
    const isRailway = checkRailwayEnvironment();
    
    if (isRailway) {
        console.log('   🚀 Executando em produção Railway');
        // Em produção, usar variáveis do Railway diretamente
    } else {
        console.log('   🏠 Executando em desenvolvimento local');
        setupRailwayEnvironment();
    }
}

module.exports = { setupRailwayEnvironment, checkRailwayEnvironment };