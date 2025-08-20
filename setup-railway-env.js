#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚄 Configurando ambiente Railway...\n');

async function setupRailway() {
    try {
        // 1. Verificar se Railway CLI está instalado
        console.log('📋 1. Verificando Railway CLI...');
        try {
            execSync('railway --version', { stdio: 'pipe' });
            console.log('   ✅ Railway CLI instalado');
        } catch (error) {
            console.log('   ❌ Railway CLI não encontrado');
            console.log('   📥 Instalando Railway CLI...');
            execSync('curl -fsSL https://railway.app/install.sh | sh', { stdio: 'inherit' });
        }

        // 2. Verificar login no Railway
        console.log('\n🔐 2. Verificando login no Railway...');
        try {
            execSync('railway whoami', { stdio: 'pipe' });
            console.log('   ✅ Logado no Railway');
        } catch (error) {
            console.log('   ❌ Não logado no Railway');
            console.log('   🔑 Execute: railway login');
            console.log('   💡 Depois execute este script novamente');
            return;
        }

        // 3. Verificar projeto Railway
        console.log('\n📁 3. Verificando projeto Railway...');
        try {
            const projectInfo = execSync('railway status', { encoding: 'utf8' });
            console.log('   ✅ Projeto Railway encontrado');
            console.log('   📊 Status:', projectInfo.trim());
        } catch (error) {
            console.log('   ❌ Projeto não encontrado');
            console.log('   🔗 Execute: railway link');
            return;
        }

        // 4. Configurar variáveis de ambiente
        console.log('\n⚙️ 4. Configurando variáveis de ambiente...');
        
        const envVars = {
            'NODE_ENV': 'production',
            'PORT': '3000',
            'HOST': '0.0.0.0',
            'PUPPETEER_EXECUTABLE_PATH': '/usr/bin/google-chrome',
            'PUPPETEER_SKIP_CHROMIUM_DOWNLOAD': 'true',
            'WHATSAPP_HEADLESS': 'true',
            'WHATSAPP_QR_TIMEOUT': '60000',
            'MAX_FILE_SIZE': '10485760',
            'LOG_LEVEL': 'info',
            'MAX_CONCURRENT_UPLOADS': '3',
            'CACHE_TTL': '3600',
            'DB_POOL_SIZE': '10'
        };

        for (const [key, value] of Object.entries(envVars)) {
            try {
                execSync(`railway variables set ${key} "${value}"`, { stdio: 'pipe' });
                console.log(`   ✅ ${key}: ${value}`);
            } catch (error) {
                console.log(`   ⚠️  ${key}: Erro ao configurar`);
            }
        }

        // 5. Verificar banco de dados PostgreSQL
        console.log('\n🗄️ 5. Verificando banco de dados PostgreSQL...');
        try {
            const dbInfo = execSync('railway service list', { encoding: 'utf8' });
            if (dbInfo.includes('Postgres')) {
                console.log('   ✅ PostgreSQL encontrado');
                
                // Obter DATABASE_URL
                try {
                    const dbUrl = execSync('railway variables get DATABASE_URL', { encoding: 'utf8' });
                    console.log('   ✅ DATABASE_URL configurada');
                } catch (error) {
                    console.log('   ⚠️  DATABASE_URL não configurada automaticamente');
                    console.log('   🔗 Configure manualmente no dashboard do Railway');
                }
            } else {
                console.log('   ❌ PostgreSQL não encontrado');
                console.log('   🗄️  Crie um serviço PostgreSQL no Railway');
            }
        } catch (error) {
            console.log('   ❌ Erro ao verificar banco de dados');
        }

        // 6. Atualizar railway.toml
        console.log('\n📄 6. Atualizando railway.toml...');
        const railwayTomlPath = path.join(__dirname, 'railway.toml');
        if (fs.existsSync(railwayTomlPath)) {
            let content = fs.readFileSync(railwayTomlPath, 'utf8');
            
            // Adicionar configurações se não existirem
            if (!content.includes('DATABASE_URL')) {
                content += `
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
REQUEST_TIMEOUT = "30000"
MEMORY_LIMIT = "512"
`;
                fs.writeFileSync(railwayTomlPath, content);
                console.log('   ✅ railway.toml atualizado');
            } else {
                console.log('   ✅ railway.toml já configurado');
            }
        }

        // 7. Verificar Dockerfile
        console.log('\n🐳 7. Verificando Dockerfile...');
        const dockerfilePath = path.join(__dirname, 'docker', 'Dockerfile.production');
        if (fs.existsSync(dockerfilePath)) {
            let content = fs.readFileSync(dockerfilePath, 'utf8');
            
            if (!content.includes('google-chrome')) {
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
                
                content = content.replace(/FROM node:(\d+)/, `FROM node:$1\n${chromeInstall}`);
                fs.writeFileSync(dockerfilePath, content);
                console.log('   ✅ Dockerfile atualizado com Chrome');
            } else {
                console.log('   ✅ Dockerfile já tem Chrome');
            }
        }

        // 8. Preparar para deploy
        console.log('\n🚀 8. Preparando para deploy...');
        
        // Verificar se há mudanças para commit
        try {
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            if (gitStatus.trim()) {
                console.log('   📝 Commitando mudanças...');
                execSync('git add .', { stdio: 'inherit' });
                execSync('git commit -m "Fix Railway configuration and database integration"', { stdio: 'inherit' });
                console.log('   ✅ Mudanças commitadas');
            } else {
                console.log('   ✅ Nenhuma mudança pendente');
            }
        } catch (error) {
            console.log('   ⚠️  Erro ao verificar git');
        }

        console.log('\n🎉 Configuração Railway concluída!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Deploy no Railway:');
        console.log('   railway up');
        console.log('\n2. Verificar logs:');
        console.log('   railway logs');
        console.log('\n3. Abrir aplicação:');
        console.log('   railway open');
        console.log('\n4. Verificar variáveis de ambiente:');
        console.log('   railway variables list');

    } catch (error) {
        console.error('❌ Erro durante configuração:', error.message);
    }
}

setupRailway();