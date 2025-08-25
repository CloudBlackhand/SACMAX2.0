#!/usr/bin/env node
/**
 * Servidor WhatsApp Web.js Real com WebSocket
 * Integração em tempo real como WhatsApp Web
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

const PORT = 3001;

// Configurar CORS
app.use(cors());
app.use(express.json());

// Armazenar clientes ativos e WebSocket connections
const clients = new Map();
const sessions = new Map();
const wsConnections = new Set();

// Broadcast para todos os clientes WebSocket
function broadcastToClients(event, data) {
    wsConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event, data }));
        }
    });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔌 Nova conexão WebSocket estabelecida');
    wsConnections.add(ws);
    
    ws.on('close', () => {
        console.log('🔌 Conexão WebSocket fechada');
        wsConnections.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('❌ Erro na conexão WebSocket:', error);
        wsConnections.delete(ws);
    });
});

// Função para criar novo cliente WhatsApp
function createWhatsAppClient(sessionName) {
    console.log(`🔧 Criando cliente WhatsApp para sessão: ${sessionName}`);
    
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionName }),
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
            timeout: 60000,
            ignoreDefaultArgs: ['--disable-extensions']
        }
    });

    // Eventos do cliente
    client.on('qr', async (qr) => {
        console.log(`📱 QR Code gerado para sessão: ${sessionName}`);
        try {
            let qrDataUrl;
            if (qr.startsWith('data:image/')) {
                qrDataUrl = qr;
            } else {
                qrDataUrl = await qrcode.toDataURL(qr);
            }
            
            sessions.set(sessionName, {
                status: 'qr_ready',
                qr: qrDataUrl,
                client: client
            });
            
            // Broadcast QR Code para frontend
            broadcastToClients('qr_ready', {
                sessionName,
                qr: qrDataUrl
            });
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
        }
    });

    client.on('ready', () => {
        console.log(`✅ Cliente WhatsApp pronto para sessão: ${sessionName}`);
        sessions.set(sessionName, {
            status: 'ready',
            client: client
        });
        broadcastToClients('whatsapp_ready', { sessionName });
    });

    client.on('authenticated', () => {
        console.log(`🔐 Cliente WhatsApp autenticado para sessão: ${sessionName}`);
        sessions.set(sessionName, {
            status: 'authenticated',
            client: client
        });
        broadcastToClients('authenticated', { sessionName });
    });

    client.on('auth_failure', (msg) => {
        console.error(`❌ Falha na autenticação para sessão ${sessionName}:`, msg);
        sessions.set(sessionName, {
            status: 'auth_failure',
            error: msg,
            client: client
        });
        broadcastToClients('auth_failure', { sessionName, error: msg });
    });

    client.on('disconnected', (reason) => {
        console.log(`🔌 Cliente WhatsApp desconectado da sessão ${sessionName}:`, reason);
        sessions.set(sessionName, {
            status: 'disconnected',
            reason: reason,
            client: client
        });
        broadcastToClients('disconnected', { sessionName, reason });
    });

    client.on('loading_screen', (percent, message) => {
        console.log(`📱 Carregando WhatsApp para sessão ${sessionName}: ${percent}% - ${message}`);
        broadcastToClients('loading_screen', { sessionName, percent, message });
    });

    client.on('message', async (msg) => {
        console.log(`💬 Nova mensagem recebida na sessão ${sessionName}:`, msg.body);
        
        const messageData = {
            sessionName,
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
            console.log(`📤 Mensagem enviada na sessão ${sessionName}:`, msg.body);
            
            const messageData = {
                sessionName,
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

    client.on('change_state', (state) => {
        console.log(`🔄 Estado alterado na sessão ${sessionName}:`, state);
        broadcastToClients('state_change', { sessionName, state });
    });

    // Evento de contato atualizado
    client.on('contact_changed', async (message, oldId, newId, isContact) => {
        console.log(`👤 Contato alterado na sessão ${sessionName}:`, { oldId, newId, isContact });
        broadcastToClients('contact_changed', { sessionName, oldId, newId, isContact });
    });

    console.log(`🔧 Cliente WhatsApp criado para sessão: ${sessionName}`);
    return client;
}

// Endpoints da API

// Listar sessões
app.get('/api/sessions', (req, res) => {
    const sessionList = Array.from(sessions.keys()).map(name => ({
        sessionName: name,
        status: sessions.get(name).status
    }));
    
    res.json({
        success: true,
        sessions: sessionList
    });
});

// Criar nova sessão
app.post('/api/sessions/add', (req, res) => {
    const { sessionName } = req.body;
    
    if (!sessionName) {
        return res.status(400).json({
            success: false,
            message: 'sessionName é obrigatório'
        });
    }

    if (sessions.has(sessionName)) {
        return res.status(400).json({
            success: false,
            message: 'Sessão já existe'
        });
    }

    try {
        console.log(`🚀 Iniciando criação da sessão: ${sessionName}`);
        
        const client = createWhatsAppClient(sessionName);
        
        // Adicionar tratamento de erro para inicialização
        client.on('error', (error) => {
            console.error(`❌ Erro no cliente WhatsApp para sessão ${sessionName}:`, error);
            sessions.set(sessionName, {
                status: 'error',
                error: error.message,
                client: client
            });
            broadcastToClients('error', { sessionName, error: error.message });
        });
        
        // Inicializar cliente com timeout
        const initPromise = client.initialize();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout na inicialização')), 30000);
        });
        
        Promise.race([initPromise, timeoutPromise])
            .then(() => {
                console.log(`✅ Cliente WhatsApp inicializado com sucesso para sessão: ${sessionName}`);
                sessions.set(sessionName, {
                    status: 'initializing',
                    client: client
                });
            })
            .catch((error) => {
                console.error(`❌ Erro na inicialização do cliente para sessão ${sessionName}:`, error);
                sessions.set(sessionName, {
                    status: 'init_error',
                    error: error.message,
                    client: client
                });
            });
        
        res.json({
            success: true,
            message: 'Sessão criada com sucesso',
            sessionName: sessionName
        });
    } catch (error) {
        console.error('Erro ao criar sessão:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar sessão',
            error: error.message
        });
    }
});

// Remover sessão
app.delete('/api/sessions/remove/:sessionName', (req, res) => {
    const { sessionName } = req.params;
    
    if (!sessions.has(sessionName)) {
        return res.status(404).json({
            success: false,
            message: 'Sessão não encontrada'
        });
    }

    try {
        const session = sessions.get(sessionName);
        if (session.client) {
            session.client.destroy();
        }
        sessions.delete(sessionName);
        
        res.json({
            success: true,
            message: 'Sessão removida com sucesso',
            sessionName: sessionName
        });
    } catch (error) {
        console.error('Erro ao remover sessão:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao remover sessão',
            error: error.message
        });
    }
});

// Obter QR Code
app.get('/api/sessions/:sessionName/qr', (req, res) => {
    const { sessionName } = req.params;
    
    if (!sessions.has(sessionName)) {
        return res.status(404).json({
            success: false,
            message: 'Sessão não encontrada'
        });
    }

    const session = sessions.get(sessionName);
    
    if (session.status === 'qr_ready' && session.qr) {
        res.json({
            success: true,
            qr: session.qr
        });
    } else {
        res.json({
            success: false,
            message: 'QR Code não disponível'
        });
    }
});

// Enviar mensagem
app.post('/api/send-message', async (req, res) => {
    const { sessionName, number, text, type = 'text' } = req.body;
    
    if (!sessionName || !number || !text) {
        return res.status(400).json({
            success: false,
            message: 'sessionName, number e text são obrigatórios'
        });
    }

    if (!sessions.has(sessionName)) {
        return res.status(404).json({
            success: false,
            message: 'Sessão não encontrada'
        });
    }

    const session = sessions.get(sessionName);
    
    if (session.status !== 'ready') {
        return res.status(400).json({
            success: false,
            message: 'Sessão não está pronta'
        });
    }

    try {
        // Formatar número
        let formattedNumber = number.replace(/\D/g, '');
        if (!formattedNumber.endsWith('@c.us')) {
            formattedNumber = formattedNumber + '@c.us';
        }

        // Enviar mensagem
        const message = await session.client.sendMessage(formattedNumber, text);
        
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            messageId: message.id._serialized,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem',
            error: error.message
        });
    }
});

// Obter mensagens de um chat
app.get('/api/messages/:number', async (req, res) => {
    const { number } = req.params;
    const { sessionName, limit = 50 } = req.query;
    
    if (!sessionName) {
        return res.status(400).json({
            success: false,
            message: 'sessionName é obrigatório'
        });
    }

    if (!sessions.has(sessionName)) {
        return res.status(404).json({
            success: false,
            message: 'Sessão não encontrada'
        });
    }

    const session = sessions.get(sessionName);
    
    if (session.status !== 'ready') {
        return res.status(400).json({
            success: false,
            message: 'Sessão não está pronta'
        });
    }

    try {
        // Formatar número
        let formattedNumber = number.replace(/\D/g, '');
        if (!formattedNumber.endsWith('@c.us')) {
            formattedNumber = formattedNumber + '@c.us';
        }

        // Obter chat
        const chat = await session.client.getChatById(formattedNumber);
        const messages = await chat.fetchMessages({ limit: parseInt(limit) });
        
        const formattedMessages = messages.map(msg => ({
            id: msg.id._serialized,
            text: msg.body,
            fromMe: msg.fromMe,
            timestamp: msg.timestamp * 1000, // Converter para milissegundos
            type: msg.type
        }));

        res.json({
            success: true,
            messages: formattedMessages,
            number: formattedNumber
        });
    } catch (error) {
        console.error('Erro ao obter mensagens:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter mensagens',
            error: error.message
        });
    }
});

// Obter todos os chats
app.get('/api/chats', async (req, res) => {
    const { sessionName } = req.query;
    
    if (!sessionName) {
        return res.status(400).json({
            success: false,
            message: 'sessionName é obrigatório'
        });
    }

    if (!sessions.has(sessionName)) {
        return res.status(404).json({
            success: false,
            message: 'Sessão não encontrada'
        });
    }

    const session = sessions.get(sessionName);
    
    if (session.status !== 'ready') {
        return res.status(400).json({
            success: false,
            message: 'Sessão não está pronta'
        });
    }

    try {
        const chats = await session.client.getChats();
        const formattedChats = chats.map(chat => ({
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chat.isGroup,
            unreadCount: chat.unreadCount,
            lastMessage: chat.lastMessage ? {
                id: chat.lastMessage.id._serialized,
                text: chat.lastMessage.body,
                timestamp: chat.lastMessage.timestamp * 1000
            } : null
        }));

        res.json({
            success: true,
            chats: formattedChats
        });
    } catch (error) {
        console.error('Erro ao obter chats:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter chats',
            error: error.message
        });
    }
});

// Status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        sessions: sessions.size,
        websocketConnections: wsConnections.size,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`🚀 Servidor WhatsApp Web.js rodando na porta ${PORT}`);
    console.log(`📱 API disponível em: http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket disponível em: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor WhatsApp...');
    
    // Fechar todas as conexões WebSocket
    wsConnections.forEach(ws => {
        ws.close();
    });
    
    // Desconectar todos os clientes
    for (const [sessionName, session] of sessions) {
        if (session.client) {
            session.client.destroy();
        }
    }
    
    process.exit(0);
});
