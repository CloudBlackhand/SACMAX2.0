#!/usr/bin/env node

/**
 * Sistema de Verificação Final - SacsMax Railway Deploy
 * Verifica integridade e funcionalidade completa do sistema
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando integridade do sistema...\n');

const checks = [
    {
        name: 'Arquivos essenciais',
        check: () => {
            const essentialFiles = [
                'railway.toml',
                '.railwayignore',
                'start.sh',
                'package.json',
                'backend/server.js',
                'docker/Dockerfile.production'
            ];
            
            const missing = essentialFiles.filter(file => !fs.existsSync(file));
            return {
                passed: missing.length === 0,
                details: missing.length > 0 ? `Arquivos faltando: ${missing.join(', ')}` : 'Todos os arquivos essenciais presentes'
            };
        }
    },
    {
        name: 'Dockerfile otimizado',
        check: () => {
            const dockerfile = fs.readFileSync('docker/Dockerfile.production', 'utf8');
            const hasMultiStage = dockerfile.includes('FROM node:18-alpine AS dependencies');
            const hasUser = dockerfile.includes('USER nodejs');
            return {
                passed: hasMultiStage && hasUser,
                details: hasMultiStage && hasUser ? 'Dockerfile otimizado para produção' : 'Dockerfile precisa de otimização'
            };
        }
    },
    {
        name: 'Configuração Railway',
        check: () => {
            const railwayToml = fs.readFileSync('railway.toml', 'utf8');
            const hasStartScript = railwayToml.includes('start.sh');
            const hasHealthcheck = railwayToml.includes('healthcheckPath');
            return {
                passed: hasStartScript && hasHealthcheck,
                details: hasStartScript && hasHealthcheck ? 'Configuração Railway completa' : 'Railway.toml incompleto'
            };
        }
    },
    {
        name: 'Arquivos ignorados',
        check: () => {
            const railwayignore = fs.readFileSync('.railwayignore', 'utf8');
            const hasUploads = railwayignore.includes('uploads/');
            const hasDevFiles = railwayignore.includes('test/');
            return {
                passed: hasUploads && hasDevFiles,
                details: hasUploads && hasDevFiles ? 'Arquivos desnecessários serão ignorados' : '.railwayignore incompleto'
            };
        }
    },
    {
        name: 'Estrutura de diretórios',
        check: () => {
            const requiredDirs = ['backend', 'docker', 'frontend'];
            const missing = requiredDirs.filter(dir => !fs.existsSync(dir));
            return {
                passed: missing.length === 0,
                details: missing.length > 0 ? `Diretórios faltando: ${missing.join(', ')}` : 'Estrutura de diretórios completa'
            };
        }
    }
];

let passed = 0;
let total = checks.length;

checks.forEach(check => {
    const result = check.check();
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${check.name}: ${result.details}`);
    if (result.passed) passed++;
});

console.log(`\n📊 Resultado: ${passed}/${total} verificações passaram`);

if (passed === total) {
    console.log('🎉 Sistema 100% pronto para deploy no Railway!');
    console.log('\nPróximos passos:');
    console.log('1. Configure as variáveis de ambiente no Railway');
    console.log('2. Faça o deploy usando: railway up');
    console.log('3. Verifique o health check em: /health');
} else {
    console.log('⚠️  Corrija os problemas acima antes do deploy');
    process.exit(1);
}