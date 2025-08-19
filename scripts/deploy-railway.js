#!/usr/bin/env node

/**
 * Script de Deploy para Railway
 * Prepara e executa o deploy do SACSMAX no Railway
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RailwayDeploy {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.checkRequirements();
    }

    checkRequirements() {
        console.log('🔍 Verificando requisitos para deploy...');

        // Verificar Railway CLI
        try {
            execSync('railway --version', { stdio: 'pipe' });
            console.log('✅ Railway CLI está instalado');
        } catch (error) {
            console.error('❌ Railway CLI não encontrado. Instale com:');
            console.error('npm install -g @railway/cli');
            process.exit(1);
        }

        // Verificar arquivo railway.toml
        const railwayToml = path.join(this.projectRoot, 'railway.toml');
        if (!fs.existsSync(railwayToml)) {
            console.error('❌ railway.toml não encontrado');
            process.exit(1);
        }

        // Verificar Dockerfile.production
        const dockerfile = path.join(this.projectRoot, 'Dockerfile.production');
        if (!fs.existsSync(dockerfile)) {
            console.error('❌ Dockerfile.production não encontrado');
            process.exit(1);
        }

        console.log('✅ Todos os requisitos verificados');
    }

    async deploy() {
        try {
            console.log('🚀 Iniciando deploy para Railway...');

            // Configurar variáveis de ambiente
            await this.setupEnvironment();

            // Build e deploy
            console.log('📦 Realizando build...');
            execSync('railway up', { 
                cwd: this.projectRoot,
                stdio: 'inherit'
            });

            console.log('✅ Deploy concluído com sucesso!');
            await this.showDeploymentInfo();

        } catch (error) {
            console.error('❌ Erro durante o deploy:', error.message);
            process.exit(1);
        }
    }

    async setupEnvironment() {
        console.log('⚙️  Configurando variáveis de ambiente...');

        const envVars = [
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'JWT_SECRET',
            'WHATSAPP_SESSION_NAME',
            'CORS_ORIGIN'
        ];

        const missingVars = [];
        envVars.forEach(varName => {
            if (!process.env[varName]) {
                missingVars.push(varName);
            }
        });

        if (missingVars.length > 0) {
            console.warn('⚠️  Variáveis de ambiente ausentes:', missingVars.join(', '));
            console.warn('Configure-as usando: railway variables set');
        }
    }

    async showDeploymentInfo() {
        try {
            const url = execSync('railway domain', { 
                cwd: this.projectRoot,
                encoding: 'utf8'
            }).trim();

            console.log(`\n🌐 URL do deploy: ${url}`);
            console.log(`📊 Health check: ${url}/health`);
            console.log(`📱 WhatsApp Webhook: ${url}/webhook`);
            console.log(`\n📝 Próximos passos:`);
            console.log(`1. Configure as variáveis de ambiente no Railway`);
            console.log(`2. Teste o health check: ${url}/health`);
            console.log(`3. Configure o webhook do WhatsApp`);

        } catch (error) {
            console.log('ℹ️  Execute "railway domain" para obter a URL do deploy');
        }
    }

    async checkHealth() {
        try {
            console.log('🔍 Verificando saúde do deploy...');
            
            const url = execSync('railway domain', { 
                cwd: this.projectRoot,
                encoding: 'utf8'
            }).trim();

            const response = await fetch(`${url}/health`);
            if (response.ok) {
                console.log('✅ Health check OK');
            } else {
                console.error('❌ Health check falhou:', response.status);
            }
        } catch (error) {
            console.error('❌ Erro ao verificar health check:', error.message);
        }
    }
}

// Executar script
if (require.main === module) {
    const deploy = new RailwayDeploy();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'deploy':
            deploy.deploy();
            break;
        case 'health':
            deploy.checkHealth();
            break;
        default:
            console.log('Uso: node scripts/deploy-railway.js [deploy|health]');
    }
}

module.exports = RailwayDeploy;