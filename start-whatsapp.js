#!/usr/bin/env node
/**
 * Script para iniciar apenas o WhatsApp Server
 * Uso: node start-whatsapp.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando WhatsApp Server...');
console.log('📱 Para parar, pressione Ctrl+C');

// Iniciar o WhatsApp server
const whatsappProcess = spawn('node', ['whatsapp-server-simple.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

// Capturar sinais para encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando WhatsApp Server...');
    whatsappProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Encerrando WhatsApp Server...');
    whatsappProcess.kill('SIGTERM');
    process.exit(0);
});

// Capturar erros
whatsappProcess.on('error', (error) => {
    console.error('❌ Erro ao iniciar WhatsApp Server:', error);
    process.exit(1);
});

whatsappProcess.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ WhatsApp Server encerrado com código ${code}`);
        process.exit(code);
    }
    console.log('✅ WhatsApp Server encerrado');
});

