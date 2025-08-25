#!/usr/bin/env node
/**
 * Script de teste para verificar o WhatsApp server
 */

const http = require('http');

// Testar diferentes portas
const ports = [3001, 3002, 3003, 3004, 3005];

async function testPort(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/api/status`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ port, status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ port, status: res.statusCode, error: 'Invalid JSON' });
                }
            });
        });
        
        req.on('error', () => {
            resolve({ port, error: 'Connection failed' });
        });
        
        req.setTimeout(2000, () => {
            req.destroy();
            resolve({ port, error: 'Timeout' });
        });
    });
}

async function testAllPorts() {
    console.log('🔍 Testando portas do WhatsApp server...\n');
    
    const results = await Promise.all(ports.map(testPort));
    
    results.forEach(result => {
        if (result.error) {
            console.log(`❌ Porta ${result.port}: ${result.error}`);
        } else {
            console.log(`✅ Porta ${result.port}: Status ${result.status}`);
            if (result.data) {
                console.log(`   Dados: ${JSON.stringify(result.data, null, 2)}`);
            }
        }
    });
    
    // Verificar se alguma porta está funcionando
    const workingPorts = results.filter(r => !r.error && r.status === 200);
    
    if (workingPorts.length > 0) {
        console.log(`\n🎉 WhatsApp server encontrado em ${workingPorts.length} porta(s)!`);
        workingPorts.forEach(wp => {
            console.log(`   - Porta ${wp.port}: ${wp.data?.success ? 'OK' : 'Erro'}`);
        });
    } else {
        console.log('\n❌ Nenhuma porta do WhatsApp server está funcionando');
        console.log('💡 Execute: node whatsapp-server-simple.js');
    }
}

// Executar teste
testAllPorts().catch(console.error);
