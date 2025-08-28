#!/usr/bin/env node
/**
 * Servidor WhatsApp Web.js com controle via Settings
 * Inicia pausado e só ativa quando liberado
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.WHATSAPP_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Armazenar conexões WebSocket
const connections = new Set();

// Estado global do WhatsApp
let whatsappClient = null;
let whatsappStatus = 'paused'; // Inicia pausado
let qrCode = null;
let isEnabled = false; // Controlado via Settings
let qrCodeData = null; // QR Code real do WhatsApp Web

// Broadcast para todos os clientes WebSocket
function broadcastToClients(event, data) {
    connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event, data }));
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔌 Nova conexão WebSocket estabelecida');
    connections.add(ws);

    // Enviar status atual para nova conexão
    ws.send(JSON.stringify({
        event: 'status_update',
        data: {
            status: whatsappStatus,
            isEnabled: isEnabled
        }
    }));

    ws.on('close', () => {
        console.log('🔌 Conexão WebSocket fechada');
        connections.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ Erro na conexão WebSocket:', error);
        connections.delete(ws);
    });
});

// Função para criar cliente WhatsApp
function createWhatsAppClient() {
    console.log('🔧 Criando cliente WhatsApp...');
    
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: 'sacmax' }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-javascript',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--single-process',
                '--no-zygote',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--mute-audio',
                '--no-first-run',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-client-side-phishing-detection',
                '--disable-component-extensions-with-background-pages',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-renderer-backgrounding',
                '--disable-sync',
                '--force-color-profile=srgb',
                '--metrics-recording-only',
                '--no-first-run',
                '--password-store=basic',
                '--use-mock-keychain'
            ],
            timeout: 120000
        }
    });

    // Eventos do cliente
    client.on('qr', async (qr) => {
        console.log('📱 QR Code REAL gerado - aguardando escaneamento...');
        console.log('🔗 QR Code data:', qr);
        
        try {
            // Salvar o QR Code real
            qrCodeData = qr;
            qrCode = await qrcode.toDataURL(qr);
            whatsappStatus = 'qr_ready';
            
            console.log('✅ QR Code REAL convertido para imagem');
            
            broadcastToClients('qr_ready', {
                qr: qrCode,
                qrData: qrCodeData,
                status: 'qr_ready'
            });
        } catch (error) {
            console.error('❌ Erro ao gerar QR Code REAL:', error);
        }
    });

    client.on('ready', () => {
        console.log('✅ WhatsApp pronto e conectado!');
        whatsappStatus = 'ready';
        qrCode = null;
        
        broadcastToClients('whatsapp_ready', {
            status: 'ready',
            message: 'WhatsApp conectado e funcionando'
        });
    });

    client.on('authenticated', () => {
        console.log('🔐 WhatsApp autenticado');
        whatsappStatus = 'authenticated';
        
        broadcastToClients('authenticated', {
            status: 'authenticated',
            message: 'Sessão autenticada'
        });
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ Falha na autenticação:', msg);
        whatsappStatus = 'auth_failure';
        
        broadcastToClients('auth_failure', {
            error: msg,
            status: 'auth_failure'
        });
    });

    client.on('disconnected', (reason) => {
        console.log('📱 WhatsApp desconectado:', reason);
        whatsappStatus = 'disconnected';
        
        broadcastToClients('disconnected', {
            reason: reason,
            status: 'disconnected'
        });
    });

    client.on('loading_screen', (percent, message) => {
        console.log(`📱 Carregando WhatsApp: ${percent}% - ${message}`);
        whatsappStatus = 'loading';
        
        broadcastToClients('loading_screen', {
            percent,
                message,
            status: 'loading'
        });
    });

    client.on('message', async (msg) => {
        console.log('📨 Nova mensagem recebida:', msg.body);
        
        const messageData = {
            id: msg.id._serialized,
            from: msg.from,
            to: msg.to,
            body: msg.body,
            timestamp: msg.timestamp,
            type: msg.type,
            hasMedia: msg.hasMedia,
            isGroup: msg.isGroup,
            isStatus: msg.isStatus
        };

        if (msg.hasMedia) {
            try {
                const media = await msg.downloadMedia();
                messageData.media = {
                    mimetype: media.mimetype,
                    data: media.data,
                    filename: media.filename
                };
            } catch (error) {
                console.error('Erro ao baixar mídia:', error);
            }
        }

        broadcastToClients('new_message', messageData);
    });

    client.on('message_create', async (msg) => {
        if (msg.fromMe) {
            console.log('📤 Mensagem enviada:', msg.body);
            
            const messageData = {
                id: msg.id._serialized,
                from: msg.from,
                to: msg.to,
                body: msg.body,
                timestamp: msg.timestamp,
                type: msg.type,
                hasMedia: msg.hasMedia,
                isGroup: msg.isGroup,
                isStatus: msg.isStatus
            };

            broadcastToClients('message_sent', messageData);
        }
    });

    console.log('🔧 Cliente WhatsApp criado');
    return client;
}

// NOVO: Ativar WhatsApp via Settings
app.post('/api/whatsapp/enable', async (req, res) => {
    try {
        if (isEnabled) {
            return res.json({
                success: false,
                message: 'WhatsApp já está ativado',
                status: whatsappStatus
            });
        }

        console.log('🚀 Ativando WhatsApp via Settings...');
        isEnabled = true;
        whatsappStatus = 'starting';
        
        // Criar e inicializar cliente
        whatsappClient = createWhatsAppClient();
        
        // Inicializar cliente
        await whatsappClient.initialize();
        
        res.json({
            success: true,
            message: 'WhatsApp ativado com sucesso',
            status: whatsappStatus
        });
        
    } catch (error) {
        console.error('❌ Erro ao ativar WhatsApp:', error);
        isEnabled = false;
        whatsappStatus = 'error';
        
        res.status(500).json({
            success: false,
            message: 'Erro ao ativar WhatsApp',
            error: error.message,
            status: whatsappStatus
        });
    }
});

// NOVO: Desativar WhatsApp via Settings
app.post('/api/whatsapp/disable', async (req, res) => {
    try {
        if (!isEnabled) {
            return res.json({
                success: false,
                message: 'WhatsApp não está ativado',
                status: whatsappStatus
            });
        }

        console.log('🛑 Desativando WhatsApp via Settings...');
        
        if (whatsappClient) {
            await whatsappClient.destroy();
            whatsappClient = null;
        }
        
        isEnabled = false;
        whatsappStatus = 'paused';
        qrCode = null;
        
        broadcastToClients('whatsapp_disabled', {
            status: 'paused'
        });
        
        res.json({
            success: true,
            message: 'WhatsApp desativado com sucesso',
            status: whatsappStatus
        });
        
    } catch (error) {
        console.error('❌ Erro ao desativar WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao desativar WhatsApp',
            error: error.message
        });
    }
});

// NOVO: Gerar QR Code (só funciona se ativado)
app.post('/api/whatsapp/generate-qr', async (req, res) => {
    try {
        if (!isEnabled) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp não está ativado. Ative primeiro via Settings.',
                status: 'paused'
            });
        }

        if (whatsappStatus === 'ready') {
            return res.json({
                success: false,
                message: 'WhatsApp já está conectado',
                status: 'ready'
            });
        }

        console.log('📱 Gerando QR Code...');
        
        // Se não tem cliente, criar um
        if (!whatsappClient) {
            whatsappClient = createWhatsAppClient();
            await whatsappClient.initialize();
        }
        
        res.json({
            success: true,
            message: 'QR Code sendo gerado...',
            status: whatsappStatus
        });
        
    } catch (error) {
        console.error('❌ Erro ao gerar QR Code:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar QR Code',
            error: error.message
        });
    }
});

// Endpoints da API

// Status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        service: 'whatsapp-server',
        connections: connections.size,
        whatsapp_status: whatsappStatus,
        isEnabled: isEnabled,
        timestamp: new Date().toISOString(),
        environment: process.env.RAILWAY_ENVIRONMENT || 'development'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'whatsapp-server',
        whatsapp_status: whatsappStatus,
        isEnabled: isEnabled,
        timestamp: new Date().toISOString()
    });
});

// Status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
    res.json({
            success: true,
        status: whatsappStatus,
        isEnabled: isEnabled,
        hasClient: !!whatsappClient,
                timestamp: new Date().toISOString()
    });
});

// Obter QR Code REAL
app.get('/api/whatsapp/qr', (req, res) => {
    if (!isEnabled) {
        return res.status(400).json({
            success: false,
            message: 'WhatsApp não está ativado. Ative primeiro via Settings.',
            status: 'paused'
        });
    }
    
    if (whatsappStatus === 'qr_ready' && qrCode && qrCodeData) {
        console.log('📱 Retornando QR Code REAL do WhatsApp Web');
        res.json({
            success: true,
            qr: qrCode,
            qrData: qrCodeData, // QR Code real do WhatsApp Web
            status: 'qr_ready',
            message: 'QR Code REAL do WhatsApp Web gerado'
        });
    } else if (whatsappStatus === 'ready') {
        res.json({
            success: false,
            message: 'WhatsApp já está conectado',
            status: 'ready'
        });
    } else {
        res.json({
            success: false,
            message: 'QR Code REAL não disponível. Clique em "Gerar QR Code" primeiro.',
            status: whatsappStatus
        });
    }
});

// Enviar mensagem
app.post('/api/send-message', (req, res) => {
    try {
        const { message, to } = req.body;
        
        if (!isEnabled) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp não está ativado. Ative primeiro via Settings.',
                status: 'paused'
            });
        }
        
        if (whatsappStatus !== 'ready') {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp não está pronto. Aguarde a conexão.',
                status: whatsappStatus
            });
        }
        
        // Enviar mensagem real
        whatsappClient.sendMessage(to, message).then((msg) => {
            res.json({
                success: true,
                message: 'Mensagem enviada com sucesso',
                messageId: msg.id._serialized
            });
        }).catch((error) => {
            console.error('❌ Erro ao enviar mensagem:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao enviar mensagem'
            });
        });
        
    } catch (error) {
        console.error('❌ Erro ao processar envio:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Endpoints compatibilidade
app.get('/api/connections', (req, res) => {
    res.json({
        connections: connections.size,
        active: Array.from(connections).filter(ws => ws.readyState === WebSocket.OPEN).length,
        whatsapp_status: whatsappStatus,
        isEnabled: isEnabled
    });
});

app.post('/api/sessions/add', (req, res) => {
        const { sessionName } = req.body;
        
        const response = {
            success: true,
        message: 'Sessão WhatsApp criada com sucesso',
            data: {
                sessionName: sessionName || 'sacmax',
            status: whatsappStatus,
            isEnabled: isEnabled,
                timestamp: new Date().toISOString()
            }
        };

        res.json(response);
});

app.get('/api/sessions/:sessionName/qr', (req, res) => {
    // Redirecionar para o endpoint de QR
    res.redirect('/api/whatsapp/qr');
});

app.get('/api/sessions/:sessionName/status', (req, res) => {
        const { sessionName } = req.params;
        
        const response = {
            success: true,
            sessionName: sessionName,
        status: whatsappStatus,
        isEnabled: isEnabled,
            timestamp: new Date().toISOString()
        };

        res.json(response);
});

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Server com controle via Settings rodando na porta ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.RAILWAY_ENVIRONMENT || 'development'}`);
    console.log(`📡 WebSocket disponível em ws://localhost:${PORT}`);
    console.log(`📱 WhatsApp: Pausado - Ative via Settings para usar`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, fechando servidor...');
    if (whatsappClient) {
        whatsappClient.destroy();
    }
    server.close(() => {
        console.log('✅ Servidor fechado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, fechando servidor...');
    if (whatsappClient) {
        whatsappClient.destroy();
    }
    server.close(() => {
        console.log('✅ Servidor fechado');
        process.exit(0);
    });
});

module.exports = app;

