#!/usr/bin/env node

/**
 * Teste de Conexão - SacsMax
 * Verifica todos os componentes críticos do sistema
 */

const fs = require('fs');
const path = require('path');

// Forçar carregamento do dotenv
require('dotenv').config({ path: path.join(__dirname, '.env') });

class ConnectionTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            components: {}
        };
    }

    async testAll() {
        console.log('🔍 Testando conexões do sistema SacsMax...\n');

        await this.testDotenv();
        await this.testSupabase();
        await this.testWhatsApp();
        await this.testNetwork();
        await this.testServices();
        await this.testFrontend();

        this.generateReport();
        return this.results;
    }

    async testDotenv() {
        console.log('📋 1. Testando carregamento de variáveis de ambiente...');
        
        const envFile = path.join(__dirname, '.env');
        const envExists = fs.existsSync(envFile);
        
        const requiredVars = [
            'NODE_ENV',
            'PORT',
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'WHATSAPP_HEADLESS',
            'MAX_FILE_SIZE'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        this.results.components.dotenv = {
            status: missingVars.length === 0 ? 'connected' : 'disconnected',
            message: missingVars.length === 0 ? 'Variáveis carregadas com sucesso' : `Faltando: ${missingVars.join(', ')}`,
            details: {
                envFileExists: envExists,
                loadedVars: Object.keys(process.env).filter(key => key.startsWith('SUPABASE') || key.startsWith('WHATSAPP')),
                missingVars: missingVars
            }
        };

        console.log(`   ${missingVars.length === 0 ? '✅' : '❌'} ${this.results.components.dotenv.message}`);
    }

    async testSupabase() {
        console.log('🔗 2. Testando conexão com Supabase...');
        
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                this.results.components.supabase = {
                    status: 'disconnected',
                    message: 'Credenciais do Supabase não configuradas',
                    details: { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey }
                };
                console.log('   ❌ Credenciais não configuradas');
                return;
            }

            // Testar conectividade básica
            const https = require('https');
            const url = new URL(supabaseUrl);
            
            await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: url.hostname,
                    path: '/',
                    method: 'GET',
                    timeout: 5000
                }, (res) => {
                    resolve(res.statusCode);
                });
                
                req.on('error', reject);
                req.on('timeout', () => reject(new Error('Timeout')));
                req.end();
            });

            this.results.components.supabase = {
                status: 'connected',
                message: 'Supabase acessível',
                details: { url: supabaseUrl }
            };
            console.log('   ✅ Supabase acessível');

        } catch (error) {
            this.results.components.supabase = {
                status: 'disconnected',
                message: 'Erro ao conectar ao Supabase',
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
            status: serviceExists ? 'partial' : 'disconnected',
            message: serviceExists ? 'Serviço WhatsApp encontrado' : 'Serviço WhatsApp não encontrado',
            details: { serviceFile: serviceExists }
        };
        
        console.log(`   ${serviceExists ? '⚠️' : '❌'} ${this.results.components.whatsapp.message}`);
    }

    async testNetwork() {
        console.log('🌐 4. Testando conectividade de rede...');
        
        const endpoints = [
            'https://www.google.com',
            'https://www.cloudflare.com',
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
        console.log('⚙️  5. Testando serviços do backend...');
        
        const services = ['cache', 'feedback', 'excel', 'network'];
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
        console.log('🎨 6. Testando arquivos do frontend...');
        
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
        console.log('\n📊 RESUMO DOS COMPONENTES:\n');
        
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

        console.log(`\n📈 ESTATÍSTICAS:`);
        console.log(`   Total: ${components.length} componentes`);
        console.log(`   Conectados: ${statusCounts.connected}`);
        console.log(`   Desconectados: ${statusCounts.disconnected}`);
        console.log(`   Parciais: ${statusCounts.partial}`);

        // Salvar relatório
        const reportPath = path.join(__dirname, 'connection-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Relatório salvo em: ${reportPath}`);

        // Identificar problemas críticos
        const criticalIssues = components.filter(c => 
            this.results.components[c].status === 'disconnected' ||
            (this.results.components[c].status === 'partial' && ['supabase', 'whatsapp'].includes(c))
        );

        if (criticalIssues.length > 0) {
            console.log(`\n🚨 PROBLEMAS CRÍTICOS:`);
            criticalIssues.forEach(issue => {
                console.log(`   - ${issue}: ${this.results.components[issue].message}`);
            });
        }
    }
}

// Executar testes
if (require.main === module) {
    const tester = new ConnectionTester();
    tester.testAll().catch(console.error);
}

module.exports = ConnectionTester;