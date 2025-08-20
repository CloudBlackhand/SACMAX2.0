#!/usr/bin/env node

/**
 * Teste de Conexão Railway PostgreSQL - SacsMax
 * Verifica todos os componentes com Railway PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Forçar carregamento do dotenv
require('dotenv').config({ path: path.join(__dirname, '.env') });

class RailwayConnectionTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            components: {}
        };
    }

    async testAll() {
        console.log('🔍 Testando conexões Railway PostgreSQL...\n');

        await this.testEnvironment();
        await this.testRailwayDB();
        await this.testWhatsApp();
        await this.testNetwork();
        await this.testServices();
        await this.testFrontend();

        this.generateReport();
        return this.results;
    }

    async testEnvironment() {
        console.log('📋 1. Testando variáveis de ambiente Railway...');
        
        const envFile = path.join(__dirname, '.env');
        const envExists = fs.existsSync(envFile);
        
        const requiredVars = [
            'NODE_ENV',
            'PORT',
            'DATABASE_URL',
            'WHATSAPP_HEADLESS',
            'MAX_FILE_SIZE'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        this.results.components.environment = {
            status: missingVars.length === 0 ? 'connected' : 'disconnected',
            message: missingVars.length === 0 ? 'Variáveis Railway configuradas' : `Faltando: ${missingVars.join(', ')}`,
            details: {
                envFileExists: envExists,
                databaseUrl: !!process.env.DATABASE_URL,
                databasePublicUrl: !!process.env.DATABASE_PUBLIC_URL
            }
        };

        console.log(`   ${missingVars.length === 0 ? '✅' : '❌'} ${this.results.components.environment.message}`);
    }

    async testRailwayDB() {
        console.log('🚂 2. Testando conexão Railway PostgreSQL...');
        
        try {
            const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
            
            if (!connectionString) {
                this.results.components.railwayDB = {
                    status: 'disconnected',
                    message: 'DATABASE_URL não configurado',
                    details: { connectionString: false }
                };
                console.log('   ❌ DATABASE_URL não configurado');
                return;
            }

            const client = new Client({ connectionString });
            await client.connect();
            
            const result = await client.query('SELECT NOW() as current_time, version()');
            await client.end();

            this.results.components.railwayDB = {
                status: 'connected',
                message: 'Railway PostgreSQL conectado',
                details: {
                    timestamp: result.rows[0].current_time,
                    version: result.rows[0].version
                }
            };
            console.log('   ✅ Railway PostgreSQL conectado');

        } catch (error) {
            this.results.components.railwayDB = {
                status: 'disconnected',
                message: 'Erro ao conectar ao Railway PostgreSQL',
                details: { error: error.message }
            };
            console.log(`   ❌ Erro: ${error.message}`);
        }
    }

    async testWhatsApp() {
        console.log('💬 3. Testando WhatsApp...');
        
        const whatsappServicePath = path.join(__dirname, 'backend', 'services', 'whatsappService.js');
        const serviceExists = fs.existsSync(whatsappServicePath);
        
        this.results.components.whatsapp = {
            status: serviceExists ? 'connected' : 'disconnected',
            message: serviceExists ? 'Serviço WhatsApp disponível' : 'Serviço WhatsApp não encontrado',
            details: { serviceFile: serviceExists }
        };
        
        console.log(`   ${serviceExists ? '✅' : '❌'} ${this.results.components.whatsapp.message}`);
    }

    async testNetwork() {
        console.log('🌐 4. Testando conectividade...');
        
        const endpoints = [
            'https://www.google.com',
            'https://railway.app',
            'https://8.8.8.8'
        ];

        try {
            const https = require('https');
            const results = [];

            for (const endpoint of endpoints) {
                try {
                    const url = new URL(endpoint);
                    await new Promise((resolve, reject) => {
                        const req = https.request({
                            hostname: url.hostname,
                            path: '/',
                            method: 'GET',
                            timeout: 3000
                        }, (res) => {
                            results.push({ endpoint, status: res.statusCode });
                            resolve();
                        });
                        
                        req.on('error', () => {
                            results.push({ endpoint, status: 'error' });
                            resolve();
                        });
                        req.on('timeout', () => {
                            results.push({ endpoint, status: 'timeout' });
                            resolve();
                        });
                        req.end();
                    });
                } catch (error) {
                    results.push({ endpoint, status: 'error' });
                }
            }

            const connected = results.filter(r => r.status === 200 || r.status === 302).length;
            
            this.results.components.network = {
                status: connected > 0 ? 'connected' : 'disconnected',
                message: `${connected}/${endpoints.length} endpoints acessíveis`,
                details: { results }
            };
            
            console.log(`   ${connected > 0 ? '✅' : '❌'} ${this.results.components.network.message}`);

        } catch (error) {
            this.results.components.network = {
                status: 'disconnected',
                message: 'Erro ao testar rede',
                details: { error: error.message }
            };
            console.log(`   ❌ Erro de rede: ${error.message}`);
        }
    }

    async testServices() {
        console.log('⚙️  5. Testando serviços...');
        
        const services = ['cache', 'feedback', 'excel', 'network', 'whatsapp'];
        const serviceResults = [];

        for (const serviceName of services) {
            const servicePath = path.join(__dirname, 'backend', 'services', `${serviceName}Service.js`);
            const serviceExists = fs.existsSync(servicePath);
            
            serviceResults.push({
                name: serviceName,
                exists: serviceExists,
                path: servicePath
            });
        }

        const availableServices = serviceResults.filter(s => s.exists).length;
        
        this.results.components.services = {
            status: availableServices === services.length ? 'connected' : 'partial',
            message: `${availableServices}/${services.length} serviços disponíveis`,
            details: { services: serviceResults }
        };
        
        console.log(`   ${availableServices === services.length ? '✅' : '⚠️'} ${this.results.components.services.message}`);
    }

    async testFrontend() {
        console.log('🎨 6. Testando frontend...');
        
        const frontendFiles = [
            'frontend/whatsappComponent.js',
            'frontend/feedback.js',
            'frontend/webInterface.js',
            'frontend/services/apiService.js',
            'frontend/services/networkService.js'
        ];

        const fileResults = [];
        for (const filePath of frontendFiles) {
            const fullPath = path.join(__dirname, filePath);
            const exists = fs.existsSync(fullPath);
            fileResults.push({ file: filePath, exists, path: fullPath });
        }

        const availableFiles = fileResults.filter(f => f.exists).length;
        
        this.results.components.frontend = {
            status: availableFiles === frontendFiles.length ? 'connected' : 'partial',
            message: `${availableFiles}/${frontendFiles.length} arquivos presentes`,
            details: { files: fileResults }
        };
        
        console.log(`   ${availableFiles === frontendFiles.length ? '✅' : '⚠️'} ${this.results.components.frontend.message}`);
    }

    generateReport() {
        console.log('\n📊 RESUMO DOS COMPONENTES RAILWAY:\n');
        
        const components = Object.keys(this.results.components);
        const statusCounts = {
            connected: 0,
            disconnected: 0,
            partial: 0
        };

        components.forEach(component => {
            const status = this.results.components[component].status;
            const emoji = {
                connected: '🟢',
                disconnected: '🔴',
                partial: '🟡'
            }[status];
            
            statusCounts[status]++;
            console.log(`${emoji} ${component.toUpperCase()}: ${this.results.components[component].message}`);
        });

        console.log(`\n📈 ESTATÍSTICAS RAILWAY:`);
        console.log(`   Total: ${components.length} componentes`);
        console.log(`   Conectados: ${statusCounts.connected}`);
        console.log(`   Desconectados: ${statusCounts.disconnected}`);
        console.log(`   Parciais: ${statusCounts.partial}`);

        // Salvar relatório
        const reportPath = path.join(__dirname, 'railway-connection-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Relatório salvo em: ${reportPath}`);

        // Identificar próximos passos
        const issues = components.filter(c => this.results.components[c].status !== 'connected');
        if (issues.length > 0) {
            console.log(`\n📝 PRÓXIMOS PASSOS:`);
            if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) {
                console.log(`   1. Configure DATABASE_URL no Railway: railway variables set DATABASE_URL "postgresql://..."`);
            }
            console.log(`   2. Execute: node scripts/setup-railway-db.js`);
            console.log(`   3. Deploy para Railway: railway up`);
        }
    }
}

// Executar testes
if (require.main === module) {
    const tester = new RailwayConnectionTester();
    tester.testAll().catch(console.error);
}

module.exports = RailwayConnectionTester;