#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CompleteDiagnostic {
    constructor() {
        this.results = {
            supabase: { status: 'unknown', message: '', details: [] },
            whatsapp: { status: 'unknown', message: '', details: [] },
            network: { status: 'unknown', message: '', details: [] },
            environment: { status: 'unknown', message: '', details: [] },
            services: { status: 'unknown', message: '', details: [] },
            frontend: { status: 'unknown', message: '', details: [] }
        };
    }

    async runCompleteDiagnostic() {
        console.log('🔍 Iniciando diagnóstico completo do SacsMax...\n');

        await this.checkEnvironmentVariables();
        await this.checkSupabaseConnection();
        await this.checkWhatsAppStatus();
        await this.checkNetworkServices();
        await this.checkSystemServices();
        await this.checkFrontendComponents();

        this.generateReport();
    }

    async checkEnvironmentVariables() {
        console.log('📋 Verificando variáveis de ambiente...');
        
        const requiredVars = [
            'NODE_ENV',
            'PORT',
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'WHATSAPP_HEADLESS',
            'MAX_FILE_SIZE'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length === 0) {
            this.results.environment.status = 'connected';
            this.results.environment.message = 'Todas as variáveis obrigatórias configuradas';
        } else {
            this.results.environment.status = 'disconnected';
            this.results.environment.message = `Variáveis faltando: ${missingVars.join(', ')}`;
            this.results.environment.details = missingVars;
        }

        // Verificar arquivo .env
        const envFile = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envFile)) {
            this.results.environment.details.push('Arquivo .env não encontrado');
        }

        console.log(`   ✅ Environment: ${this.results.environment.status}`);
    }

    async checkSupabaseConnection() {
        console.log('🗄️  Verificando conexão com Supabase...');
        
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                this.results.supabase.status = 'disconnected';
                this.results.supabase.message = 'Variáveis de ambiente não configuradas';
                this.results.supabase.details = ['SUPABASE_URL ou SUPABASE_ANON_KEY não definidas'];
                console.log(`   ❌ Supabase: ${this.results.supabase.message}`);
                return;
            }

            // Verificar se o módulo Supabase está disponível
            try {
                const { createClient } = require('@supabase/supabase-js');
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data, error } = await supabase.from('clients').select('id').limit(1);
                
                if (error) {
                    this.results.supabase.status = 'disconnected';
                    this.results.supabase.message = `Erro de conexão: ${error.message}`;
                    this.results.supabase.details = [error.message];
                } else {
                    this.results.supabase.status = 'connected';
                    this.results.supabase.message = 'Conexão estabelecida com sucesso';
                }
            } catch (moduleError) {
                this.results.supabase.status = 'disconnected';
                this.results.supabase.message = 'Módulo @supabase/supabase-js não encontrado';
                this.results.supabase.details = [moduleError.message];
            }

        } catch (error) {
            this.results.supabase.status = 'disconnected';
            this.results.supabase.message = `Erro inesperado: ${error.message}`;
            this.results.supabase.details = [error.message];
        }

        console.log(`   ✅ Supabase: ${this.results.supabase.status}`);
    }

    async checkWhatsAppStatus() {
        console.log('📱 Verificando WhatsApp...');
        
        try {
            // Verificar se o serviço WhatsApp está inicializado
            const whatsappService = require('./backend/services/whatsappService');
            
            if (whatsappService.isConnected && whatsappService.isReady) {
                this.results.whatsapp.status = 'connected';
                this.results.whatsapp.message = 'WhatsApp conectado e pronto';
            } else {
                this.results.whatsapp.status = 'disconnected';
                this.results.whatsapp.message = 'WhatsApp não inicializado ou desconectado';
                this.results.whatsapp.details = ['Serviço não inicializado'];
            }
        } catch (error) {
            this.results.whatsapp.status = 'disconnected';
            this.results.whatsapp.message = 'Serviço WhatsApp não disponível';
            this.results.whatsapp.details = [error.message];
        }

        console.log(`   ✅ WhatsApp: ${this.results.whatsapp.status}`);
    }

    async checkNetworkServices() {
        console.log('🌐 Verificando serviços de rede...');
        
        try {
            const endpoints = [
                'https://www.google.com',
                'https://www.cloudflare.com',
                'https://8.8.8.8'
            ];

            const results = [];
            for (const endpoint of endpoints) {
                try {
                    const https = require('https');
                    await new Promise((resolve, reject) => {
                        const req = https.get(endpoint, (res) => {
                            results.push(`${endpoint}: ${res.statusCode}`);
                            resolve();
                        });
                        req.on('error', reject);
                        req.setTimeout(3000, () => reject(new Error('Timeout')));
                    });
                } catch (error) {
                    results.push(`${endpoint}: erro - ${error.message}`);
                }
            }

            this.results.network.status = 'partial';
            this.results.network.message = `Verificados ${results.length} endpoints`;
            this.results.network.details = results;

        } catch (error) {
            this.results.network.status = 'disconnected';
            this.results.network.message = 'Erro ao verificar rede';
            this.results.network.details = [error.message];
        }

        console.log(`   ✅ Network: ${this.results.network.status}`);
    }

    async checkSystemServices() {
        console.log('⚙️  Verificando serviços do sistema...');
        
        const services = [
            { name: 'Cache', file: './backend/services/cacheService.js' },
            { name: 'Feedback', file: './backend/services/feedbackService.js' },
            { name: 'Excel', file: './backend/services/excelProcessor.js' },
            { name: 'Network', file: './backend/services/networkService.js' }
        ];

        const serviceResults = [];
        for (const service of services) {
            try {
                const serviceModule = require(service.file);
                serviceResults.push(`${service.name}: OK`);
            } catch (error) {
                serviceResults.push(`${service.name}: Erro - ${error.message}`);
            }
        }

        this.results.services.status = 'partial';
        this.results.services.message = `${serviceResults.filter(r => r.includes('OK')).length}/${services.length} serviços disponíveis`;
        this.results.services.details = serviceResults;

        console.log(`   ✅ Services: ${this.results.services.status}`);
    }

    async checkFrontendComponents() {
        console.log('🎨 Verificando componentes frontend...');
        
        const frontendFiles = [
            'frontend/whatsappComponent.js',
            'frontend/feedback.js',
            'frontend/webInterface.js',
            'frontend/services/apiService.js',
            'frontend/services/networkService.js'
        ];

        const fileResults = [];
        for (const file of frontendFiles) {
            const filePath = path.join(process.cwd(), file);
            if (fs.existsSync(filePath)) {
                fileResults.push(`${file}: Presente`);
            } else {
                fileResults.push(`${file}: Ausente`);
            }
        }

        this.results.frontend.status = 'partial';
        this.results.frontend.message = `${fileResults.filter(r => r.includes('Presente')).length}/${frontendFiles.length} arquivos presentes`;
        this.results.frontend.details = fileResults;

        console.log(`   ✅ Frontend: ${this.results.frontend.status}`);
    }

    generateReport() {
        console.log('\n📊 RELATÓRIO DE DIAGNÓSTICO COMPLETO\n');
        
        const components = Object.keys(this.results);
        const disconnected = components.filter(comp => 
            this.results[comp].status === 'disconnected' || 
            this.results[comp].status === 'partial'
        );

        console.log('🔴 COMPONENTES DESCONECTADOS OU COM PROBLEMAS:');
        disconnected.forEach(comp => {
            console.log(`   • ${comp.toUpperCase()}: ${this.results[comp].message}`);
            if (this.results[comp].details && this.results[comp].details.length > 0) {
                this.results[comp].details.forEach(detail => {
                    console.log(`     - ${detail}`);
                });
            }
        });

        console.log('\n🟢 COMPONENTES FUNCIONANDO:');
        components.filter(comp => this.results[comp].status === 'connected').forEach(comp => {
            console.log(`   • ${comp.toUpperCase()}: ${this.results[comp].message}`);
        });

        console.log('\n📈 RESUMO:');
        console.log(`   Total de componentes: ${components.length}`);
        console.log(`   Conectados: ${components.filter(c => this.results[c].status === 'connected').length}`);
        console.log(`   Desconectados: ${components.filter(c => this.results[c].status === 'disconnected').length}`);
        console.log(`   Parciais: ${components.filter(c => this.results[c].status === 'partial').length}`);

        // Salvar relatório
        const reportPath = path.join(process.cwd(), 'diagnostic-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Relatório salvo em: ${reportPath}`);
    }
}

// Executar diagnóstico
if (require.main === module) {
    const diagnostic = new CompleteDiagnostic();
    diagnostic.runCompleteDiagnostic().catch(console.error);
}

module.exports = CompleteDiagnostic;