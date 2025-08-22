#!/usr/bin/env node
/**
 * Servidor WhatsApp Web.js Real
 * Integração com o backend SacsMax
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');

const app = express();
const PORT = 3001;

// Configurar CORS
app.use(cors());
app.use(express.json());

// Armazenar clientes ativos
const clients = new Map();
const sessions = new Map();

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
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    // Eventos do cliente
    client.on('qr', async (qr) => {
        console.log(`📱 QR Code gerado para sessão: ${sessionName}`);
        try {
            const qrDataUrl = await qrcode.toDataURL(qr);
            sessions.set(sessionName, {
                status: 'qr_ready',
                qr: qrDataUrl,
                client: client
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
    });

    client.on('authenticated', () => {
        console.log(`🔐 Cliente autenticado para sessão: ${sessionName}`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`❌ Falha na autenticação para sessão ${sessionName}:`, msg);
        sessions.set(sessionName, {
            status: 'auth_failed',
            error: msg
        });
    });

    client.on('disconnected', (reason) => {
        console.log(`🔌 Cliente desconectado da sessão ${sessionName}:`, reason);
        sessions.delete(sessionName);
    });

    client.on('message', (msg) => {
        console.log(`💬 Nova mensagem recebida na sessão ${sessionName}:`, msg.body);
    });

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
        const client = createWhatsAppClient(sessionName);
        client.initialize();
        
        sessions.set(sessionName, {
            status: 'initializing',
            client: client
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

// Status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        sessions: sessions.size,
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor WhatsApp Web.js rodando na porta ${PORT}`);
    console.log(`📱 API disponível em: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor WhatsApp...');
    
    // Desconectar todos os clientes
    for (const [sessionName, session] of sessions) {
        if (session.client) {
            session.client.destroy();
        }
    }
    
    process.exit(0);
});
