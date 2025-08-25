#!/usr/bin/env node
/**
 * Detector de Portas Disponíveis - Versão Simplificada
 * Encontra portas livres rapidamente
 */

const net = require('net');

class PortDetector {
    constructor() {
        this.defaultPorts = {
            frontend: 3000,
            backend: 5000,
            whatsapp: 3002
        };
    }

    isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            // Timeout de 1 segundo
            const timeout = setTimeout(() => {
                server.close();
                resolve(false);
            }, 1000);
            
            server.listen(port, () => {
                clearTimeout(timeout);
                server.once('close', () => {
                    resolve(true);
                });
                server.close();
            });
            
            server.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });
        });
    }

    async findAvailablePort(startPort, usedPorts = []) {
        // Tentar apenas as próximas 10 portas
        for (let i = 0; i < 10; i++) {
            const port = startPort + i;
            
            // Verificar se a porta já foi usada por outro serviço
            if (usedPorts.includes(port)) {
                continue;
            }
            
            if (await this.isPortAvailable(port)) {
                return port;
            }
        }
        return startPort; // Retornar porta original se não encontrar
    }

    async detectPorts() {
        console.log('🔍 Detectando portas disponíveis...');
        
        const ports = {};
        const usedPorts = [];
        
        // Detectar porta do Frontend
        ports.frontend = await this.findAvailablePort(this.defaultPorts.frontend, usedPorts);
        usedPorts.push(ports.frontend);
        console.log(`✅ Frontend: porta ${ports.frontend}`);
        
        // Detectar porta do Backend
        ports.backend = await this.findAvailablePort(this.defaultPorts.backend, usedPorts);
        usedPorts.push(ports.backend);
        console.log(`✅ Backend: porta ${ports.backend}`);
        
        // Detectar porta do WhatsApp
        ports.whatsapp = await this.findAvailablePort(this.defaultPorts.whatsapp, usedPorts);
        usedPorts.push(ports.whatsapp);
        console.log(`✅ WhatsApp: porta ${ports.whatsapp}`);
        
        return ports;
    }
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortDetector;
}

// Se executado diretamente, detectar portas
if (require.main === module) {
    const detector = new PortDetector();
    detector.detectPorts().then(ports => {
        console.log('\n📋 Portas detectadas:');
        console.log(JSON.stringify(ports, null, 2));
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erro:', error);
        process.exit(1);
    });
}
