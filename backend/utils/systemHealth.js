const fs = require('fs');
const path = require('path');
const { Client } = require('@supabase/supabase-js');
const logger = require('./logger');
const cacheService = require('../services/cacheService');

class SystemHealth {
    constructor() {
        this.checks = [];
    }

    async performHealthCheck() {
        this.checks = [];
        
        await this.checkSupabaseConnection();
        await this.checkCacheSystem();
        await this.checkFileSystem();
        await this.checkEnvironmentVariables();
        await this.checkChromeAvailability();
        
        return this.generateReport();
    }

    async checkSupabaseConnection() {
        try {
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseKey = process.env.SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                this.addCheck('supabase', false, 'Variáveis de ambiente não configuradas');
                return;
            }

            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase.from('clients').select('id').limit(1);
            
            if (error) {
                this.addCheck('supabase', false, `Erro de conexão: ${error.message}`);
            } else {
                this.addCheck('supabase', true, 'Conexão estabelecida com sucesso');
            }
        } catch (error) {
            this.addCheck('supabase', false, `Erro inesperado: ${error.message}`);
        }
    }

    async checkCacheSystem() {
        try {
            const stats = await cacheService.getStats();
            this.addCheck('cache', true, `Cache operacional - ${stats.fileCount} arquivos, ${stats.totalSize} bytes`);
        } catch (error) {
            this.addCheck('cache', false, `Erro no cache: ${error.message}`);
        }
    }

    async checkFileSystem() {
        try {
            const requiredDirs = ['uploads', 'logs', 'config'];
            const missingDirs = [];
            
            for (const dir of requiredDirs) {
                const dirPath = path.join(process.cwd(), dir);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            }
            
            this.addCheck('filesystem', true, 'Diretórios necessários verificados/criados');
        } catch (error) {
            this.addCheck('filesystem', false, `Erro no sistema de arquivos: ${error.message}`);
        }
    }

    async checkEnvironmentVariables() {
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
            this.addCheck('environment', true, 'Todas as variáveis obrigatórias configuradas');
        } else {
            this.addCheck('environment', false, `Variáveis faltando: ${missingVars.join(', ')}`);
        }
    }

    async checkChromeAvailability() {
        try {
            const { execSync } = require('child_process');
            const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
            
            try {
                execSync(`which chromium-browser || which chrome || test -f ${chromePath}`, { stdio: 'ignore' });
                this.addCheck('chrome', true, 'Chrome/Chromium disponível');
            } catch (error) {
                this.addCheck('chrome', false, 'Chrome/Chromium não encontrado');
            }
        } catch (error) {
            this.addCheck('chrome', false, `Erro ao verificar Chrome: ${error.message}`);
        }
    }

    addCheck(component, status, message) {
        this.checks.push({
            component,
            status,
            message,
            timestamp: new Date().toISOString()
        });
    }

    generateReport() {
        const totalChecks = this.checks.length;
        const passedChecks = this.checks.filter(check => check.status).length;
        const failedChecks = totalChecks - passedChecks;
        
        return {
            summary: {
                total: totalChecks,
                passed: passedChecks,
                failed: failedChecks,
                status: failedChecks === 0 ? 'healthy' : 'unhealthy'
            },
            checks: this.checks,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }

    async logHealthStatus() {
        const report = await this.performHealthCheck();
        
        if (report.summary.status === 'healthy') {
            logger.info('Sistema operacional - todos os componentes funcionando');
        } else {
            logger.error('Sistema com problemas:', report);
        }
        
        return report;
    }
}

// Função auxiliar para criar cliente Supabase
function createClient(url, key) {
    return new Client(url, key);
}

module.exports = new SystemHealth();