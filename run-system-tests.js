#!/usr/bin/env node

/**
 * Executor de Bateria de Testes de Sistema - SacsMax
 * Executa testes completos de funcionalidade, performance e segurança
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const SystemTestSuite = require('./test/systemTestSuite');

class TestRunner {
    constructor() {
        this.testResults = {};
        this.startTime = Date.now();
    }

    async run() {
        console.log('🚀 SACSMAX - BATERIA COMPLETA DE TESTES DE SISTEMA\n');
        console.log('=' .repeat(60));
        
        try {
            // Verificar pré-requisitos
            await this.checkPrerequisites();
            
            // Executar testes
            await this.executeTests();
            
            // Gerar relatório final
            await this.generateFinalReport();
            
            // Verificar deploy readiness
            await this.checkDeployReadiness();
            
        } catch (error) {
            console.error('❌ Erro na execução dos testes:', error.message);
            process.exit(1);
        }
    }

    async checkPrerequisites() {
        console.log('\n📋 Verificando pré-requisitos...');
        
        const checks = [
            { name: 'Node.js', check: () => this.checkNodeVersion() },
            { name: 'Dependências', check: () => this.checkDependencies() },
            { name: 'Variáveis de Ambiente', check: () => this.checkEnvironmentVars() },
            { name: 'Estrutura de Diretórios', check: () => this.checkDirectoryStructure() }
        ];

        for (const check of checks) {
            try {
                const result = await check.check();
                console.log(`  ✅ ${check.name}: ${result}`);
            } catch (error) {
                console.log(`  ❌ ${check.name}: ${error.message}`);
                throw error;
            }
        }
    }

    checkNodeVersion() {
        const version = process.version;
        const major = parseInt(version.substring(1).split('.')[0]);
        
        if (major < 16) {
            throw new Error(`Node.js ${version} - versão mínima 16.0.0`);
        }
        
        return version;
    }

    checkDependencies() {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredDeps = ['express', '@supabase/supabase-js', 'cors', 'multer', 'xlsx'];
        
        const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
        
        if (missing.length > 0) {
            throw new Error(`Dependências faltando: ${missing.join(', ')}`);
        }
        
        return 'Todas as dependências instaladas';
    }

    checkEnvironmentVars() {
        const requiredVars = ['PORT', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
        const optionalVars = ['SUPABASE_SERVICE_KEY', 'ADMIN_TOKEN', 'NODE_ENV'];
        
        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            throw new Error(`Variáveis de ambiente faltando: ${missing.join(', ')}`);
        }
        
        const configured = optionalVars.filter(varName => process.env[varName]);
        
        return `Variáveis configuradas: ${requiredVars.length + configured.length}/${requiredVars.length + optionalVars.length}`;
    }

    checkDirectoryStructure() {
        const requiredDirs = ['backend', 'test', 'uploads', 'logs'];
        const requiredFiles = ['package.json', 'railway.toml', '.railwayignore', 'start.sh'];
        
        const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missingDirs.length > 0 || missingFiles.length > 0) {
            throw new Error(`Estrutura incompleta: ${missingDirs.concat(missingFiles).join(', ')}`);
        }
        
        return 'Estrutura completa';
    }

    async executeTests() {
        console.log('\n⚡ Executando testes de sistema...');
        
        const testSuite = new SystemTestSuite();
        const results = await testSuite.runAllTests();
        
        this.testResults = results;
        
        console.log('\n📊 Resultados dos Testes:');
        console.log(`  • Testes Funcionais: ${this.countPassed(results.categories.functional)}/${results.categories.functional.length}`);
        console.log(`  • Testes de Performance: ${this.countPassed(results.categories.performance)}/${results.categories.performance.length}`);
        console.log(`  • Testes de Segurança: ${this.countPassed(results.categories.security)}/${results.categories.security.length}`);
        console.log(`  • Testes de Integração: ${this.countPassed(results.categories.integration)}/${results.categories.integration.length}`);
    }

    countPassed(tests) {
        return tests.filter(test => test.passed).length;
    }

    async generateFinalReport() {
        const report = {
            ...this.testResults,
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            },
            deployment: {
                railwayReady: this.checkRailwayReadiness(),
                dockerOptimized: this.checkDockerOptimization(),
                securityScore: this.calculateSecurityScore()
            }
        };

        // Salvar relatório detalhado
        const reportPath = path.join(process.cwd(), 'system-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Gerar relatório visual
        await this.generateVisualReport(report);
        
        console.log(`\n📄 Relatório completo salvo em: ${reportPath}`);
    }

    checkRailwayReadiness() {
        const checks = [
            fs.existsSync('railway.toml'),
            fs.existsSync('.railwayignore'),
            fs.existsSync('start.sh'),
            !fs.existsSync('docker-compose.yml'),
            !fs.existsSync('Dockerfile.dev')
        ];
        
        return checks.every(check => check);
    }

    checkDockerOptimization() {
        const dockerfile = fs.readFileSync('docker/Dockerfile.production', 'utf8');
        
        const optimizations = [
            dockerfile.includes('multi-stage'),
            dockerfile.includes('USER node'),
            dockerfile.includes('--production'),
            dockerfile.includes('HEALTHCHECK')
        ];
        
        return optimizations.filter(opt => opt).length / optimizations.length;
    }

    calculateSecurityScore() {
        const securityTests = this.testResults.categories.security || [];
        const passed = securityTests.filter(test => test.passed).length;
        const total = securityTests.length;
        
        return total > 0 ? (passed / total) * 100 : 0;
    }

    async generateVisualReport(report) {
        const visualReport = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE TESTES DE SISTEMA - SACSMAX                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  📊 RESULTADOS GERAIS                                                       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  Total de Testes: ${report.summary.total.toString().padStart(3)}                                             ║
║  Passaram: ${report.summary.passed.toString().padStart(9)} ✅                                             ║
║  Falharam: ${report.summary.failed.toString().padStart(7)} ❌                                             ║
║  Taxa de Sucesso: ${report.summary.successRate.padStart(6)}                                              ║
║  Duração: ${report.summary.duration}ms                                       ║
║                                                                              ║
║  🚀 STATUS DO DEPLOY                                                       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  Railway Ready: ${report.deployment.railwayReady ? '✅ SIM' : '❌ NÃO'}                                    ║
║  Docker Otimizado: ${(report.deployment.dockerOptimization * 100).toFixed(0)}%                              ║
║  Pontuação Segurança: ${report.deployment.securityScore.toFixed(0)}%                                     ║
║                                                                              ║
║  📋 RECOMENDAÇÕES                                                          ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
${report.recommendations.map(rec => `║  • ${rec.padEnd(70)} ║`).join('\n')}
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        `;

        fs.writeFileSync('test-summary.txt', visualReport);
        console.log(visualReport);
    }

    async checkDeployReadiness() {
        console.log('\n🎯 Verificação Final de Deploy...');
        
        const readiness = {
            functional: this.testResults.summary.passed > (this.testResults.summary.total * 0.8),
            performance: !this.testResults.categories.performance.some(t => !t.passed),
            security: this.testResults.deployment.securityScore >= 80,
            railway: this.testResults.deployment.railwayReady
        };

        const allReady = Object.values(readiness).every(r => r);

        console.log(`\n🚀 Sistema ${allReady ? '100%' : 'parcialmente'} pronto para deploy no Railway!`);
        
        if (allReady) {
            console.log('\n✅ PRÓXIMOS PASSOS:');
            console.log('1. Configurar variáveis de ambiente no Railway');
            console.log('2. Executar: railway up');
            console.log('3. Verificar health check em: /health');
            console.log('4. Monitorar logs e métricas');
        } else {
            console.log('\n⚠️  AJUSTES NECESSÁRIOS:');
            if (!readiness.functional) console.log('• Verificar testes funcionais falhados');
            if (!readiness.performance) console.log('• Otimizar performance');
            if (!readiness.security) console.log('• Melhorar segurança');
            if (!readiness.railway) console.log('• Verificar configuração Railway');
        }

        return allReady;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const runner = new TestRunner();
    runner.run().catch(error => {
        console.error('❌ Falha na execução dos testes:', error);
        process.exit(1);
    });
}

module.exports = TestRunner;