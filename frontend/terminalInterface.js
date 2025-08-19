const readline = require('readline');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class TerminalInterface extends EventEmitter {
    constructor() {
        super();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.apiUrl = process.env.API_URL || 'http://localhost:3000';
        this.currentScreen = 'main';
        this.isRunning = true;
    }

    async start() {
        console.clear();
        this.showHeader();
        
        while (this.isRunning) {
            await this.showMainMenu();
        }
        
        this.rl.close();
    }

    showHeader() {
        console.log('='.repeat(60));
        console.log('    SACSMAX - Sistema de Comunicação');
        console.log('    WhatsApp + Excel + Análise de Feedback');
        console.log('='.repeat(60));
        console.log();
    }

    async showMainMenu() {
        console.log('MENU PRINCIPAL');
        console.log('1. Processar Planilha Excel');
        console.log('2. Controle WhatsApp');
        console.log('3. Enviar Mensagens');
        console.log('4. Classificar Feedback');
        console.log('5. Estatísticas do Sistema');
        console.log('6. Configurações');
        console.log('7. Sair');
        console.log();

        const choice = await this.question('Escolha uma opção: ');
        
        switch (choice) {
            case '1':
                await this.processExcelMenu();
                break;
            case '2':
                await this.whatsappControlMenu();
                break;
            case '3':
                await this.sendMessagesMenu();
                break;
            case '4':
                await this.classifyFeedbackMenu();
                break;
            case '5':
                await this.showSystemStats();
                break;
            case '6':
                await this.showSettings();
                break;
            case '7':
                this.isRunning = false;
                console.log('\nSaindo...\n');
                break;
            default:
                console.log('Opção inválida!\n');
                await this.sleep(1000);
        }
    }

    async processExcelMenu() {
        console.clear();
        this.showHeader();
        console.log('\x1b[1;33mPROCESSAR PLANILHA EXCEL\x1b[0m\n');

        try {
            const filePath = await this.question('Caminho do arquivo Excel (.xlsx/.xls): ');
            
            if (!fs.existsSync(filePath)) {
                console.log('\x1b[31mArquivo não encontrado!\x1b[0m\n');
                await this.question('Pressione ENTER para voltar...');
                return;
            }

            console.log('\nProcessando arquivo...\n');

            const formData = new FormData();
            const fileBuffer = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);
            
            // Simular upload via API
            const response = await this.uploadFile(filePath, fileName);
            
            if (response.success) {
                console.log('Processado com sucesso!');
                console.log(`Contatos encontrados: ${response.contacts.length}`);
                console.log(`Abas processadas: ${response.sheets.length}\n`);
                
                if (response.contacts.length > 0) {
                    console.log('Primeiros 5 contatos:');
                    response.contacts.slice(0, 5).forEach((contact, index) => {
                        console.log(`${index + 1}. ${contact.name} - ${contact.phone}`);
                    });
                    console.log('');
                }
            } else {
                console.log(`Erro: ${response.error}\n`);
            }

        } catch (error) {
            console.log(`Erro: ${error.message}\n`);
        }

        await this.question('Pressione ENTER para voltar...');
    }

    async whatsappControlMenu() {
        console.clear();
        this.showHeader();
        console.log('CONTROLE WHATSAPP\n');

        try {
            // Mostrar status atual
            const status = await this.apiCall('/whatsapp/status');
            
            console.log('Status Atual:');
            console.log(`Inicializado: ${status.initialized ? 'Sim' : 'Não'}`);
            console.log(`Conectado: ${status.connected ? 'Sim' : 'Não'}`);
            console.log(`Pronto: ${status.ready ? 'Sim' : 'Não'}`);
            
            if (status.qrCode) {
                console.log('QR Code disponível - escaneie para conectar');
            }
            console.log();

            console.log('Opções:');
            console.log('1. Iniciar WhatsApp');
            console.log('2. Parar WhatsApp');
            console.log('3. Atualizar Status');
            console.log('4. Voltar');
            console.log();

            const choice = await this.question('Escolha uma opção: ');

            switch (choice) {
                case '1':
                    await this.startWhatsApp();
                    break;
                case '2':
                    await this.stopWhatsApp();
                    break;
                case '3':
                    await this.whatsappControlMenu();
                    break;
                case '4':
                    return;
                default:
                    console.log('\x1b[31mOpção inválida!\x1b[0m\n');
                    await this.sleep(1000);
            }

        } catch (error) {
            console.log(`\x1b[31m❌ Erro: ${error.message}\x1b[0m\n`);
            await this.question('Pressione ENTER para voltar...');
        }
    }

    async startWhatsApp() {
        console.log('\nIniciando WhatsApp...\n');
        
        try {
            const response = await this.apiCall('/whatsapp/start', 'POST');
            
            if (response.success) {
                console.log(`${response.message}\n`);
                console.log(`Conectado: ${response.connected ? 'Sim' : 'Aguardando QR Code'}`);
                console.log(`Pronto: ${response.ready ? 'Sim' : 'Aguardando'}\n`);
            } else {
                console.log(`${response.message}\n`);
            }

        } catch (error) {
            console.log(`Erro ao iniciar WhatsApp: ${error.message}\n`);
        }
        
        await this.question('Pressione ENTER para continuar...');
        await this.whatsappControlMenu();
    }

    async stopWhatsApp() {
        console.log('\nParando WhatsApp...\n');
        
        try {
            const response = await this.apiCall('/whatsapp/stop', 'POST');
            
            if (response.success) {
                console.log(`\x1b[32m✅ ${response.message}\x1b[0m\n`);
            } else {
                console.log(`\x1b[33mℹ️  ${response.message}\x1b[0m\n`);
            }

        } catch (error) {
            console.log(`\x1b[31m❌ Erro ao parar WhatsApp: ${error.message}\x1b[0m\n`);
        }
        
        await this.question('Pressione ENTER para continuar...');
        await this.whatsappControlMenu();
    }

    async checkWhatsAppStatus() {
        console.clear();
        this.showHeader();
        console.log('\x1b[1;33mSTATUS DO WHATSAPP\x1b[0m\n');

        try {
            const response = await this.apiCall('/whatsapp/status');
            
            console.log(`Inicializado: ${response.initialized ? '\x1b[32m✅ Sim' : '\x1b[31m❌ Não'}\x1b[0m`);
            console.log(`Conectado: ${response.connected ? '\x1b[32m✅ Sim' : '\x1b[31m❌ Não'}\x1b[0m`);
            console.log(`Pronto: ${response.ready ? '\x1b[32m✅ Sim' : '\x1b[31m❌ Não'}\x1b[0m`);
            
            if (response.qrCode) {
                console.log(`\x1b[32m📱 QR Code disponível - escaneie para conectar\x1b[0m`);
            }

        } catch (error) {
            console.log(`\x1b[31m❌ Erro ao verificar status: ${error.message}\x1b[0m\n`);
        }

        await this.question('Pressione ENTER para voltar...');
    }

    async sendMessagesMenu() {
        console.clear();
        this.showHeader();
        console.log('\x1b[1;33mENVIAR MENSAGENS\x1b[0m\n');

        try {
            // Simular lista de contatos (em produção, viria do Excel)
            const contacts = [
                { name: 'João Silva', phone: '11999999999' },
                { name: 'Maria Santos', phone: '11888888888' },
                { name: 'Pedro Oliveira', phone: '11777777777' }
            ];

            console.log('\x1b[36mContatos disponíveis:\x1b[0m');
            contacts.forEach((contact, index) => {
                console.log(`${index + 1}. ${contact.name} - ${contact.phone}`);
            });
            console.log('');

            const message = await this.question('Mensagem a enviar: ');
            
            if (!message.trim()) {
                console.log('\x1b[31mMensagem vazia!\x1b[0m\n');
                await this.question('Pressione ENTER para voltar...');
                return;
            }

            console.log('\n\x1b[36mEnviando mensagens...\x1b[0m\n');

            // Simular envio via API
            const response = await this.apiCall('/api/send-messages', 'POST', {
                contacts: contacts,
                message: message
            });

            console.log(`\x1b[32m✅ Enviadas: ${response.sent.length}\x1b[0m`);
            console.log(`\x1b[31m❌ Falhas: ${response.failed.length}\x1b[0m\n`);

            if (response.failed.length > 0) {
                console.log('\x1b[33mFalhas:\x1b[0m');
                response.failed.forEach(fail => {
                    console.log(`- ${fail.contact.name}: ${fail.error}`);
                });
                console.log('');
            }

        } catch (error) {
            console.log(`\x1b[31m❌ Erro: ${error.message}\x1b[0m\n`);
        }

        await this.question('Pressione ENTER para voltar...');
    }

    async classifyFeedbackMenu() {
        console.clear();
        this.showHeader();
        console.log('\x1b[1;33mCLASSIFICAR FEEDBACK\x1b[0m\n');

        try {
            // Simular mensagens de feedback
            const messages = [
                { id: 1, text: 'Muito obrigado pelo excelente atendimento!', timestamp: new Date() },
                { id: 2, text: 'O serviço está muito ruim, estou decepcionado', timestamp: new Date() },
                { id: 3, text: 'Tudo ok, nada de mais', timestamp: new Date() }
            ];

            console.log('\x1b[36mClassificando feedback...\x1b[0m\n');

            const response = await this.apiCall('/api/classify-feedback', 'POST', {
                messages: messages
            });

            response.classifications.forEach(result => {
                const emoji = result.classification === 'positive' ? '🟢' : 
                            result.classification === 'negative' ? '🔴' : '⚪';
                
                console.log(`${emoji} ${result.classification.toUpperCase()} (${result.confidence * 100}%)`);
                console.log(`   Texto: "${result.text}"`);
                console.log(`   Motivo: ${result.reason}\n`);
            });

        } catch (error) {
            console.log(`\x1b[31m❌ Erro: ${error.message}\x1b[0m\n`);
        }

        await this.question('Pressione ENTER para voltar...');
    }

    async showSystemStats() {
        console.clear();
        this.showHeader();
        console.log('\x1b[1;33mESTATÍSTICAS DO SISTEMA\x1b[0m\n');

        try {
            const response = await this.apiCall('/health');
            
            console.log(`\x1b[36mStatus do Sistema:\x1b[0m ${response.status.toUpperCase()}`);
            console.log(`\x1b[36mTimestamp:\x1b[0m ${response.timestamp}`);
            console.log(`\x1b[36mWhatsApp Conectado:\x1b[0m ${response.whatsappConnected ? 'Sim' : 'Não'}\n`);

            // Estatísticas simuladas
            console.log('\x1b[36mEstatísticas Gerais:\x1b[0m');
            console.log('- Arquivos processados: 15');
            console.log('- Mensagens enviadas: 1.250');
            console.log('- Contatos únicos: 890');
            console.log('- Taxa de sucesso: 94%');
            console.log('');

        } catch (error) {
            console.log(`\x1b[31m❌ Erro ao obter estatísticas: ${error.message}\x1b[0m\n`);
        }

        await this.question('Pressione ENTER para voltar...');
    }

    async showSettings() {
        console.clear();
        this.showHeader();
        console.log('\x1b[1;33mCONFIGURAÇÕES\x1b[0m\n');

        console.log(`\x1b[36mURL da API:\x1b[0m ${this.apiUrl}`);
        console.log(`\x1b[36mAmbiente:\x1b[0m ${process.env.NODE_ENV || 'development'}`);
        console.log(`\x1b[36mPorta:\x1b[0m ${process.env.PORT || 3000}\n`);

        const newUrl = await this.question('Nova URL da API (deixe vazio para manter atual): ');
        if (newUrl.trim()) {
            this.apiUrl = newUrl.trim();
            console.log('\x1b[32m✅ URL atualizada!\x1b[0m\n');
        }

        await this.question('Pressione ENTER para voltar...');
    }

    async question(prompt) {
        return new Promise(resolve => {
            this.rl.question(prompt, resolve);
        });
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        // Simular chamadas API para interface de terminal
        // Em produção, usar axios ou fetch real
        
        const mockResponses = {
            '/health': {
                status: 'ok',
                timestamp: new Date().toISOString(),
                whatsappConnected: true
            },
            '/api/whatsapp/status': {
                connected: true,
                ready: true,
                qrReady: false
            },
            '/api/upload': {
                success: true,
                contacts: [
                    { name: 'João Silva', phone: '11999999999', date: '2024-01-15' },
                    { name: 'Maria Santos', phone: '11888888888', date: '2024-01-16' }
                ],
                sheets: [{ name: 'Clientes', contacts_found: 2 }]
            },
            '/api/send-messages': {
                sent: [
                    { contact: { name: 'João Silva', phone: '11999999999' } }
                ],
                failed: []
            },
            '/api/classify-feedback': {
                classifications: [
                    {
                        classification: 'positive',
                        confidence: 0.95,
                        reason: 'keywords positivos encontrados',
                        text: 'Muito obrigado pelo excelente atendimento!'
                    }
                ]
            }
        };

        // Simular delay de rede
        await this.sleep(1000);
        
        const key = endpoint + (method !== 'GET' ? '_POST' : '');
        return mockResponses[endpoint] || mockResponses[key] || { error: 'Endpoint não encontrado' };
    }

    async uploadFile(filePath, fileName) {
        // Simular upload de arquivo
        await this.sleep(2000);
        return {
            success: true,
            fileName,
            contacts: [
                { name: 'Cliente 1', phone: '11999999999', date: '2024-01-15' },
                { name: 'Cliente 2', phone: '11888888888', date: '2024-01-16' }
            ],
            sheets: [{ name: 'Planilha1', contacts_found: 2 }]
        };
    }
}

// Executar interface se chamada diretamente
if (require.main === module) {
    const terminal = new TerminalInterface();
    terminal.start().catch(console.error);
}

module.exports = TerminalInterface;