#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testando conexão com Railway...\n');

async function testRailwayConnection() {
    const results = {
        environment: {},
        database: {},
        whatsapp: {},
        api: {},
        files: {}
    };

    // 1. Verificar variáveis de ambiente
    console.log('📊 1. Verificando variáveis de ambiente...');
    const requiredEnvVars = [
        'DATABASE_URL',
        'DATABASE_PUBLIC_URL',
        'RAILWAY_ENVIRONMENT_ID',
        'RAILWAY_PROJECT_ID',
        'PUPPETEER_EXECUTABLE_PATH',
        'WHATSAPP_HEADLESS'
    ];

    for (const envVar of requiredEnvVars) {
        const value = process.env[envVar];
        results.environment[envVar] = {
            present: !!value,
            value: value ? (envVar.includes('URL') ? '***CONFIGURADO***' : value) : 'NÃO CONFIGURADO'
        };
        
        if (value) {
            console.log(`   ✅ ${envVar}: ${results.environment[envVar].value}`);
        } else {
            console.log(`   ❌ ${envVar}: NÃO CONFIGURADO`);
        }
    }

    // 2. Verificar arquivos essenciais
    console.log('\n📁 2. Verificando arquivos essenciais...');
    const essentialFiles = [
        'railway.toml',
        'docker/Dockerfile.production',
        'backend/server.js',
        'backend/services/supabaseService.js',
        'backend/services/whatsappService.js'
    ];

    for (const file of essentialFiles) {
        const exists = fs.existsSync(path.join(__dirname, file));
        results.files[file] = { exists };
        
        if (exists) {
            console.log(`   ✅ ${file}: Presente`);
        } else {
            console.log(`   ❌ ${file}: Ausente`);
        }
    }

    // 3. Testar conexão com banco de dados (se configurado)
    console.log('\n🗄️ 3. Testando conexão com banco de dados...');
    if (process.env.DATABASE_URL) {
        try {
            // Teste básico de conexão PostgreSQL
            const { Client } = require('pg');
            const client = new Client({ connectionString: process.env.DATABASE_URL });
            await client.connect();
            
            // Testar query simples
            const result = await client.query('SELECT NOW() as current_time');
            await client.end();

            results.database.connected = true;
            results.database.currentTime = result.rows[0].current_time;
            console.log(`   ✅ Banco conectado: ${result.rows[0].current_time}`);
        } catch (error) {
            results.database.connected = false;
            results.database.error = error.message;
            console.log(`   ❌ Erro no banco: ${error.message}`);
        }
    } else {
        console.log('   ⚠️  DATABASE_URL não configurada');
        results.database.connected = false;
    }

    // 4. Testar WhatsApp (se Chrome estiver disponível)
    console.log('\n📱 4. Testando configuração do WhatsApp...');
    const chromePaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ];

    let chromeFound = false;
    for (const chromePath of chromePaths) {
        if (fs.existsSync(chromePath)) {
            results.whatsapp.chromePath = chromePath;
            results.whatsapp.chromeFound = true;
            chromeFound = true;
            console.log(`   ✅ Chrome encontrado: ${chromePath}`);
            break;
        }
    }

    if (!chromeFound) {
        console.log('   ❌ Chrome não encontrado');
        results.whatsapp.chromeFound = false;
    }

    // 5. Testar API local (se estiver rodando)
    console.log('\n🌐 5. Testando API local...');
    try {
        const response = await axios.get('http://localhost:3000/health', { timeout: 5000 });
        results.api.local = {
            connected: true,
            status: response.status,
            data: response.data
        };
        console.log(`   ✅ API local: ${response.status} - ${JSON.stringify(response.data)}`);
    } catch (error) {
        results.api.local = {
            connected: false,
            error: error.message
        };
        console.log(`   ❌ API local: ${error.message}`);
    }

    // 6. Testar API Railway (se URL estiver disponível)
    console.log('\n🚄 6. Testando API Railway...');
    const railwayUrl = process.env.RAILWAY_STATIC_URL;
    if (railwayUrl) {
        try {
            const response = await axios.get(`${railwayUrl}/health`, { timeout: 10000 });
            results.api.railway = {
                connected: true,
                status: response.status,
                data: response.data
            };
            console.log(`   ✅ API Railway: ${response.status} - ${JSON.stringify(response.data)}`);
        } catch (error) {
            results.api.railway = {
                connected: false,
                error: error.message
            };
            console.log(`   ❌ API Railway: ${error.message}`);
        }
    } else {
        console.log('   ⚠️  RAILWAY_STATIC_URL não configurada');
        results.api.railway = { connected: false };
    }

    // Salvar relatório
    const reportPath = path.join(__dirname, 'railway-connection-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log('='.repeat(50));
    
    const envConfigured = Object.values(results.environment).filter(v => v.present).length;
    const filesPresent = Object.values(results.files).filter(v => v.exists).length;
    
    console.log(`📊 Variáveis de ambiente: ${envConfigured}/${requiredEnvVars.length} configuradas`);
    console.log(`📁 Arquivos essenciais: ${filesPresent}/${essentialFiles.length} presentes`);
    console.log(`🗄️  Banco de dados: ${results.database.connected ? '✅ Conectado' : '❌ Desconectado'}`);
    console.log(`📱 WhatsApp: ${results.whatsapp.chromeFound ? '✅ Chrome encontrado' : '❌ Chrome não encontrado'}`);
    console.log(`🌐 API Local: ${results.api.local.connected ? '✅ Funcionando' : '❌ Não funcionando'}`);
    console.log(`🚄 API Railway: ${results.api.railway.connected ? '✅ Funcionando' : '❌ Não funcionando'}`);
    
    console.log(`\n📄 Relatório completo salvo em: ${reportPath}`);
    
    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    if (!results.database.connected) {
        console.log('   • Configure DATABASE_URL no Railway');
    }
    if (!results.whatsapp.chromeFound) {
        console.log('   • Instale Google Chrome no container Railway');
    }
    if (!results.api.local.connected) {
        console.log('   • Inicie o servidor local: npm start');
    }
    if (!results.api.railway.connected) {
        console.log('   • Faça deploy no Railway: railway up');
    }
}

testRailwayConnection().catch(console.error);