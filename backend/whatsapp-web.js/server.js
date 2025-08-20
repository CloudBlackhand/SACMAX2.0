/**
 * WhatsApp Web.js Server para SACSMAX
 * Servidor Express com Baileys para integração WhatsApp
 */

const express = require('express');
const cors = require('cors');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Armazenar sessões ativas
const sessions = new Map();

// Função para criar conexão WhatsApp
async function createWhatsAppConnection(sessionId, config = {}) {
    try {
        const sessionPath = path.join(__dirname, 'sessions', sessionId);
        
        // Criar diretório da sessão se não existir
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }
        
        // Configurar autenticação
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        
        // Criar conexão
        const sock = makeWASocket({
            printQRInTerminal: true,
            auth: state,
            logger: console,
            ...config
        });
        
        // Eventos da conexão
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                // Gerar QR Code
                const qrCode = await QRCode.toDataURL(qr);
                sessions.get(sessionId).qrCode = qrCode;
                console.log(`QR Code gerado para sessão ${sessionId}`);
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    console.log(`Reconectando sessão ${sessionId}...`);
                    setTimeout(() => createWhatsAppConnection(sessionId, config), 5000);
                } else {
                    console.log(`Sessão ${sessionId} desconectada permanentemente`);
                    sessions.delete(sessionId);
                }
            } else if (connection === 'open') {
                console.log(`Sessão ${sessionId} conectada com sucesso`);
                sessions.get(sessionId).connected = true;
                sessions.get(sessionId).qrCode = null;
            }
        });
        
        sock.ev.on('creds.update', saveCreds);
        
        // Armazenar sessão
        sessions.set(sessionId, {
            sock,
            connected: false,
            qrCode: null,
            config
        });
        
        return { success: true, message: 'Sessão criada com sucesso' };
        
    } catch (error) {
        console.error(`Erro ao criar sessão ${sessionId}:`, error);
        return { success: false, message: error.message };
    }
}

// Rotas da API

// Listar sessões
app.get('/api/sessions', (req, res) => {
    const sessionList = Array.from(sessions.keys()).map(sessionId => ({
        sessionId,
        connected: sessions.get(sessionId).connected,
        hasQR: !!sessions.get(sessionId).qrCode
    }));
    
    res.json({
        success: true,
        sessions: sessionList
    });
});

// Criar nova sessão
app.post('/api/sessions/add', async (req, res) => {
    const { session, config } = req.body;
    
    if (!session) {
        return res.status(400).json({
            success: false,
            message: 'ID da sessão é obrigatório'
        });
    }
    
    if (sessions.has(session)) {
        return res.status(400).json({
            success: false,
            message: 'Sessão já existe'
        });
    }
    
    const result = await createWhatsAppConnection(session, config);
    
    if (result.success) {
        res.json({
            success: true,
            message: result.message,
            data: {
                session,
                qr: sessions.get(session)?.qrCode
            }
        });
    } else {
        res.status(500).json({
            success: false,
            message: result.message
        });
    }
});

// Remover sessão
app.delete('/api/sessions/remove/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    if (!sessions.has(sessionId)) {
        return res.status(404).json({
            success: false,
            message: 'Sessão não encontrada'
        });
    }
    
    const session = sessions.get(sessionId);
    
    if (session.sock) {
        session.sock.end();
    }
    
    sessions.delete(sessionId);
    
    // Remover arquivos da sessão
    const sessionPath = path.join(__dirname, 'sessions', sessionId);
    if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
    }
    
    res.json({
        success: true,
        message: 'Sessão removida com sucesso'
    });
});

// Obter QR Code
app.get('/api/sessions/:sessionId/qr', (req, res) => {
    const { sessionId } = req.params;
    
    if (!sessions.has(sessionId)) {
        return res.status(404).json({
            success: false,
            message: 'Sessão não encontrada'
        });
    }
    
    const session = sessions.get(sessionId);
    
    if (session.connected) {
        return res.json({
            success: false,
            message: 'Sessão já está conectada'
        });
    }
    
    if (!session.qrCode) {
        return res.json({
            success: false,
            message: 'QR Code não disponível'
        });
    }
    
    res.json({
        success: true,
        data: {
            qr: session.qrCode
        }
    });
});

// Enviar mensagem
app.post('/api/send', async (req, res) => {
    const { session, data } = req.body;
    
    if (!session || !data) {
        return res.status(400).json({
            success: false,
            message: 'Sessão e dados são obrigatórios'
        });
    }
    
    if (!sessions.has(session)) {
        return res.status(404).json({
            success: false,
            message: 'Sessão não encontrada'
        });
    }
    
    const sessionData = sessions.get(session);
    
    if (!sessionData.connected) {
        return res.status(400).json({
            success: false,
            message: 'Sessão não está conectada'
        });
    }
    
    try {
        const { number, message, type = 'text' } = data;
        
        // Formatar número
        const formattedNumber = number.replace(/\D/g, '');
        const jid = `${formattedNumber}@s.whatsapp.net`;
        
        let result;
        
        switch (type) {
            case 'text':
                result = await sessionData.sock.sendMessage(jid, { text: message });
                break;
            case 'image':
                // Implementar envio de imagem
                result = await sessionData.sock.sendMessage(jid, { text: message });
                break;
            default:
                result = await sessionData.sock.sendMessage(jid, { text: message });
        }
        
        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            data: {
                id: result.key.id,
                timestamp: result.key.timestamp
            }
        });
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Status da API
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        sessions_count: sessions.size,
        connected_sessions: Array.from(sessions.values()).filter(s => s.connected).length
    });
});

// Rota de teste
app.get('/', (req, res) => {
    res.json({
        message: 'WhatsApp Web.js Server para SACSMAX',
        version: '1.0.0',
        endpoints: {
            sessions: '/api/sessions',
            add_session: 'POST /api/sessions/add',
            remove_session: 'DELETE /api/sessions/remove/:sessionId',
            qr_code: 'GET /api/sessions/:sessionId/qr',
            send_message: 'POST /api/send',
            status: '/api/status'
        }
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Web.js Server rodando na porta ${PORT}`);
    console.log(`📱 Endpoints disponíveis:`);
    console.log(`   - GET  /api/sessions`);
    console.log(`   - POST /api/sessions/add`);
    console.log(`   - DELETE /api/sessions/remove/:sessionId`);
    console.log(`   - GET  /api/sessions/:sessionId/qr`);
    console.log(`   - POST /api/send`);
    console.log(`   - GET  /api/status`);
});

