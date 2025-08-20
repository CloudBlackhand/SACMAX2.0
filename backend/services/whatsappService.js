const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

class WhatsAppService extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.qrCode = null;
        this.qrReady = false;
        this.isClientReady = false;
        this.isClientConnected = false;
    }

    async initialize() {
        try {
            // Configurar caminho do Chrome baseado no ambiente
            let executablePath;
            if (process.env.RAILWAY_ENVIRONMENT) {
                // Railway usa Google Chrome
                executablePath = '/usr/bin/google-chrome';
            } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
                executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
            } else if (process.platform === 'linux') {
                executablePath = '/usr/bin/chromium-browser';
            } else if (process.platform === 'win32') {
                // Windows - deixar Puppeteer encontrar o Chrome automaticamente
                executablePath = undefined;
            }

            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: './wwebjs_auth',
                    clientId: process.env.WHATSAPP_SESSION_NAME || 'sacsmax-session'
                }),
                puppeteer: {
                    headless: process.env.WHATSAPP_HEADLESS !== 'false',
                    executablePath,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu',
                        '--disable-software-rasterizer',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--disable-features=TranslateUI',
                        '--disable-extensions',
                        '--disable-default-apps',
                        '--no-sandbox',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--disable-alsa',
                        '--disable-audio'
                    ]
                }
            });

            this.setupEventHandlers();
            await this.client.initialize();
            
            logger.info('WhatsApp Web inicializado com sucesso');
        } catch (error) {
            logger.error('Erro ao inicializar WhatsApp Web', error);
            throw error;
        }
    }

    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            logger.info('QR Code recebido para escaneamento');
            this.qrCode = qr;
            this.qrReady = true;
            
            if (process.env.NODE_ENV === 'development') {
                qrcode.generate(qr, { small: true });
            }
            
            this.emit('qr', qr);
        });

        this.client.on('ready', () => {
            logger.info('WhatsApp Web está pronto!');
            this.isClientReady = true;
            this.isClientConnected = true;
            this.emit('ready');
        });

        this.client.on('authenticated', () => {
            logger.info('WhatsApp Web autenticado com sucesso');
        });

        this.client.on('auth_failure', (msg) => {
            logger.error('Falha na autenticação do WhatsApp', { message: msg });
        });

        this.client.on('message', async (message) => {
            logger.info('Mensagem recebida', {
                from: message.from,
                body: message.body.substring(0, 100)
            });
            
            this.emit('message', {
                id: message.id.id,
                from: message.from,
                body: message.body,
                timestamp: message.timestamp,
                type: message.type
            });
        });

        this.client.on('disconnected', (reason) => {
            logger.warn('WhatsApp Web desconectado', { reason });
            this.isClientReady = false;
            this.isClientConnected = false;
            this.emit('disconnected', reason);
        });

        this.client.on('message_create', (message) => {
            if (message.fromMe) {
                logger.info('Mensagem enviada', {
                    to: message.to,
                    body: message.body.substring(0, 100)
                });
            }
        });
    }

    isConnected() {
        return this.isClientConnected;
    }

    isReady() {
        return this.isClientReady;
    }

    isInitialized() {
        return this.client !== null;
    }

    getQRCode() {
        return this.qrCode;
    }

    async sendMessage(contact, message) {
        try {
            if (!this.isClientReady) {
                throw new Error('WhatsApp Web não está pronto');
            }

            // Formatar número de telefone
            const formattedNumber = this.formatPhoneNumber(contact.phone);
            
            // Criar chat ID
            const chatId = formattedNumber.includes('@') ? formattedNumber : `${formattedNumber}@c.us`;
            
            // Enviar mensagem
            const result = await this.client.sendMessage(chatId, message);
            
            logger.info('Mensagem enviada com sucesso', {
                to: contact.phone,
                messageId: result.id.id
            });

            return {
                success: true,
                messageId: result.id.id,
                contact: contact,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Erro ao enviar mensagem', {
                to: contact.phone,
                error: error.message
            });

            return {
                success: false,
                contact: contact,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async sendMessages(contacts, message) {
        const results = {
            sent: [],
            failed: []
        };

        // Processar em lotes para evitar bloqueio
        const batchSize = 5;
        for (let i = 0; i < contacts.length; i += batchSize) {
            const batch = contacts.slice(i, i + batchSize);
            
            const batchPromises = batch.map(contact => this.sendMessage(contact, message));
            const batchResults = await Promise.allSettled(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.success) {
                    results.sent.push(result.value);
                } else {
                    const error = result.reason || result.value?.error || 'Erro desconhecido';
                    results.failed.push({
                        contact: batch[index],
                        error: error.toString()
                    });
                }
            });

            // Pausa entre lotes
            if (i + batchSize < contacts.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return results;
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.destroy();
                this.client = null;
                this.qrCode = null;
                this.qrReady = false;
                this.isClientReady = false;
                this.isClientConnected = false;
                logger.info('WhatsApp Web desconectado e cliente destruído');
            }
        } catch (error) {
            logger.error('Erro ao desconectar WhatsApp', error);
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        // Remover caracteres não numéricos
        let cleaned = phone.replace(/\D/g, '');
        
        // Adicionar código do país se não estiver presente
        if (cleaned.length === 11 && cleaned.startsWith('9')) {
            cleaned = '55' + cleaned;
        } else if (cleaned.length === 10 && !cleaned.startsWith('55')) {
            cleaned = '55' + cleaned;
        }
        
        return cleaned;
    }

    async getChats() {
        try {
            if (!this.isClientReady) {
                throw new Error('WhatsApp Web não está pronto');
            }

            const chats = await this.client.getChats();
            return chats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name,
                isGroup: chat.isGroup,
                unreadCount: chat.unreadCount,
                timestamp: chat.timestamp
            }));
        } catch (error) {
            logger.error('Erro ao obter chats', error);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.destroy();
                logger.info('WhatsApp Web desconectado');
            }
        } catch (error) {
            logger.error('Erro ao desconectar WhatsApp', error);
            throw error;
        }
    }
}

module.exports = WhatsAppService;