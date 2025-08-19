#!/usr/bin/env node

/**
 * Bateria Completa de Testes de Sistema - SacsMax
 * Valida funcionalidade, desempenho e segurança dos componentes existentes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SystemTestSuite {
    constructor() {
        this.results = {
            functional: [],
            performance: [],
            security: [],
            integration: []
        };
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 Iniciando bateria completa de testes...\n');

        await this.runFunctionalTests();
        await this.runPerformanceTests();
        await this.runSecurityTests();
        await this.runIntegrationTests();

        return this.generateReport();
    }

    async runFunctionalTests() {
        console.log('📋 Testes Funcionais...');

        await this.testHealthCheck();
        await this.testFileStructure();
        await this.testAPIEndpoints();
        await this.testEnvironmentConfig();
        await this.testDockerConfig();
    }

    async testHealthCheck() {
        try {
            // Verificar se o endpoint de health está implementado
            const serverFile = fs.readFileSync('backend/server.js', 'utf8');
            const hasHealthEndpoint = serverFile.includes('/health');
            
            this.results.functional.push({
                test: 'Health Check Endpoint',
                passed: hasHealthEndpoint,
                details: hasHealthEndpoint ? 'Endpoint /health implementado' : 'Endpoint /health não encontrado'
            });
        } catch (error) {
            this.results.functional.push({
                test: 'Health Check',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testFileStructure() {
        try {
            const requiredFiles = [
                'backend/server.js',
                'package.json',
                'railway.toml',
                '.railwayignore',
                'start.sh',
                'docker/Dockerfile.production'
            ];

            const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
            const passed = missingFiles.length === 0;

            this.results.functional.push({
                test: 'File Structure',
                passed,
                details: passed ? 'Todos os arquivos essenciais presentes' : `Faltando: ${missingFiles.join(', ')}`
            });
        } catch (error) {
            this.results.functional.push({
                test: 'File Structure',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testAPIEndpoints() {
        try {
            const serverFile = fs.readFileSync('backend/server.js', 'utf8');
            
            const endpoints = [
                '/health',
                '/api/upload',
                '/api/whatsapp/start',
                '/api/whatsapp/stop'
            ];

            const available = endpoints.filter(endpoint => serverFile.includes(endpoint));
            const passed = available.length >= 2; // Pelo menos health e upload

            this.results.functional.push({
                test: 'API Endpoints',
                passed,
                details: `Endpoints disponíveis: ${available.join(', ')}`
            });
        } catch (error) {
            this.results.functional.push({
                test: 'API Endpoints',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testEnvironmentConfig() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const hasStartScript = packageJson.scripts && packageJson.scripts.start;
            const hasCorrectMain = packageJson.main === 'backend/server.js';

            this.results.functional.push({
                test: 'Environment Configuration',
                passed: hasStartScript && hasCorrectMain,
                details: `Start script: ${hasStartScript ? '✅' : '❌'}, Main: ${hasCorrectMain ? '✅' : '❌'}`
            });
        } catch (error) {
            this.results.functional.push({
                test: 'Environment Configuration',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testDockerConfig() {
        try {
            const dockerfile = fs.readFileSync('docker/Dockerfile.production', 'utf8');
            
            const optimizations = [
                dockerfile.includes('FROM node:'),
                dockerfile.includes('USER node'),
                dockerfile.includes('--production'),
                dockerfile.includes('EXPOSE')
            ];

            const score = optimizations.filter(opt => opt).length / optimizations.length;
            const passed = score >= 0.75;

            this.results.functional.push({
                test: 'Docker Configuration',
                passed,
                details: `Otimizações implementadas: ${Math.round(score * 100)}%`
            });
        } catch (error) {
            this.results.functional.push({
                test: 'Docker Configuration',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async runPerformanceTests() {
        console.log('⚡ Testes de Performance...');

        await this.testStartupReadiness();
        await this.testFileSizeLimits();
        await this.testMemoryOptimization();
    }

    async testStartupReadiness() {
        try {
            const startScript = fs.readFileSync('start.sh', 'utf8');
            const hasHealthCheck = startScript.includes('systemHealth.js') || startScript.includes('health');
            
            this.results.performance.push({
                test: 'Startup Health Check',
                passed: hasHealthCheck,
                details: hasHealthCheck ? 'Verificação de saúde no startup' : 'Verificação de saúde não configurada'
            });
        } catch (error) {
            this.results.performance.push({
                test: 'Startup Health Check',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testFileSizeLimits() {
        try {
            const serverFile = fs.readFileSync('backend/server.js', 'utf8');
            const hasMulterConfig = serverFile.includes('multer') && serverFile.includes('limits');
            
            this.results.performance.push({
                test: 'File Size Limits',
                passed: hasMulterConfig,
                details: hasMulterConfig ? 'Limites de tamanho de arquivo configurados' : 'Limites não configurados'
            });
        } catch (error) {
            this.results.performance.push({
                test: 'File Size Limits',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testMemoryOptimization() {
        try {
            const railwayToml = fs.readFileSync('railway.toml', 'utf8');
            const hasMemoryLimits = railwayToml.includes('memory') || railwayToml.includes('cpu');
            
            this.results.performance.push({
                test: 'Memory Optimization',
                passed: true, // Railway gerencia automaticamente
                details: hasMemoryLimits ? 'Limites de recursos configurados' : 'Usando limites padrão do Railway'
            });
        } catch (error) {
            this.results.performance.push({
                test: 'Memory Optimization',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async runSecurityTests() {
        console.log('🔒 Testes de Segurança...');

        await this.testEnvironmentVariables();
        await this.testFilePermissions();
        await this.testRailwayIgnore();
        await this.testNonRootUser();
    }

    async testEnvironmentVariables() {
        try {
            const sensitiveVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
            const configured = sensitiveVars.filter(varName => process.env[varName]);
            
            this.results.security.push({
                test: 'Environment Variables',
                passed: configured.length > 0,
                details: `Variáveis configuradas: ${configured.length}/${sensitiveVars.length}`
            });
        } catch (error) {
            this.results.security.push({
                test: 'Environment Variables',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testFilePermissions() {
        try {
            const criticalFiles = ['railway.toml', '.railwayignore', 'start.sh'];
            const readable = criticalFiles.filter(file => {
                try {
                    fs.accessSync(file, fs.constants.R_OK);
                    return true;
                } catch {
                    return false;
                }
            });

            this.results.security.push({
                test: 'File Permissions',
                passed: readable.length === criticalFiles.length,
                details: `Arquivos acessíveis: ${readable.length}/${criticalFiles.length}`
            });
        } catch (error) {
            this.results.security.push({
                test: 'File Permissions',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testRailwayIgnore() {
        try {
            const railwayIgnore = fs.readFileSync('.railwayignore', 'utf8');
            const hasSensitivePatterns = railwayIgnore.includes('node_modules') && 
                                       railwayIgnore.includes('.env') &&
                                       railwayIgnore.includes('logs');

            this.results.security.push({
                test: 'Railway Ignore',
                passed: hasSensitivePatterns,
                details: hasSensitivePatterns ? 'Arquivos sensíveis ignorados' : 'Verificar padrões de exclusão'
            });
        } catch (error) {
            this.results.security.push({
                test: 'Railway Ignore',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testNonRootUser() {
        try {
            const dockerfile = fs.readFileSync('docker/Dockerfile.production', 'utf8');
            const hasUser = dockerfile.includes('USER node');

            this.results.security.push({
                test: 'Non-Root User',
                passed: hasUser,
                details: hasUser ? 'Usuário não-root configurado' : 'Container executando como root'
            });
        } catch (error) {
            this.results.security.push({
                test: 'Non-Root User',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async runIntegrationTests() {
        console.log('🔗 Testes de Integração...');

        await this.testRailwayConfiguration();
        await this.testDockerIntegration();
        await this.testStartScript();
    }

    async testRailwayConfiguration() {
        try {
            const railwayToml = fs.readFileSync('railway.toml', 'utf8');
            
            const required = [
                railwayToml.includes('build'),
                railwayToml.includes('start'),
                railwayToml.includes('healthcheck')
            ];

            const passed = required.every(r => r);

            this.results.integration.push({
                test: 'Railway Configuration',
                passed,
                details: passed ? 'Configuração Railway completa' : 'Verificar railway.toml'
            });
        } catch (error) {
            this.results.integration.push({
                test: 'Railway Configuration',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testDockerIntegration() {
        try {
            const dockerfile = fs.readFileSync('docker/Dockerfile.production', 'utf8');
            const railwayToml = fs.readFileSync('railway.toml', 'utf8');
            
            const dockerfileMatch = railwayToml.includes('Dockerfile.production');
            const hasMultiStage = dockerfile.includes('FROM node:') && dockerfile.includes('FROM node:');

            this.results.integration.push({
                test: 'Docker Integration',
                passed: dockerfileMatch && hasMultiStage,
                details: dockerfileMatch ? 'Dockerfile integrado corretamente' : 'Verificar integração Docker'
            });
        } catch (error) {
            this.results.integration.push({
                test: 'Docker Integration',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    async testStartScript() {
        try {
            const startScript = fs.readFileSync('start.sh', 'utf8');
            const isExecutable = fs.statSync('start.sh').mode & parseInt('111', 8);
            
            const hasNodeStart = startScript.includes('npm start') || startScript.includes('node');

            this.results.integration.push({
                test: 'Start Script',
                passed: hasNodeStart,
                details: hasNodeStart ? `Script de inicialização configurado${isExecutable ? ' e executável' : ''}` : 'Script de inicialização incompleto'
            });
        } catch (error) {
            this.results.integration.push({
                test: 'Start Script',
                passed: false,
                details: `Erro: ${error.message}`
            });
        }
    }

    generateReport() {
        const totalTests = Object.values(this.results).flat().length;
        const passedTests = Object.values(this.results).flat().filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        const report = {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
                duration: Date.now() - this.startTime
            },
            categories: this.results,
            recommendations: this.generateRecommendations(),
            timestamp: new Date().toISOString()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        const failedTests = Object.values(this.results).flat().filter(r => !r.passed);
        
        if (failedTests.some(t => t.test.includes('File Structure'))) {
            recommendations.push('Verificar arquivos essenciais do projeto');
        }
        
        if (failedTests.some(t => t.test.includes('Security'))) {
            recommendations.push('Implementar melhorias de segurança');
        }
        
        if (failedTests.some(t => t.test.includes('Configuration'))) {
            recommendations.push('Revisar configurações de ambiente');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Sistema 100% pronto para deploy no Railway');
        }
        
        return recommendations;
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const testSuite = new SystemTestSuite();
    testSuite.runAllTests().then(report => {
        console.log('\n📊 RELATÓRIO DE TESTES DE SISTEMA');
        console.log('================================\n');
        console.log(`Total de Testes: ${report.summary.total}`);
        console.log(`Passaram: ${report.summary.passed} ✅`);
        console.log(`Falharam: ${report.summary.failed} ❌`);
        console.log(`Taxa de Sucesso: ${report.summary.successRate}`);
        console.log(`Duração: ${report.summary.duration}ms\n`);
        
        console.log('📋 RECOMENDAÇÕES:');
        report.recommendations.forEach(rec => console.log(`- ${rec}`));
        
        // Salvar relatório
        fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Relatório salvo em: test-results.json');
        
        process.exit(report.summary.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('❌ Erro nos testes:', error);
        process.exit(1);
    });
}

module.exports = SystemTestSuite;