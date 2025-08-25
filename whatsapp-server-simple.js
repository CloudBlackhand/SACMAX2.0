#!/usr/bin/env node
/**
 * Servidor WhatsApp Web.js Simplificado
 * Versão para Railway sem dependências pesadas
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const PortDetector = require('./port-detector');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Detectar porta automaticamente
let PORT = process.env.PORT || 3002;

// Configurar CORS
app.use(cors());
app.use(express.json());

// Armazenar conexões WebSocket
const wsConnections = new Set();

// Broadcast para todos os clientes WebSocket
function broadcastToClients(event, data) {
    wsConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ event, data }));
        }
    });
}

// Gerar QR Code automaticamente quando servidor inicia
function generateInitialQR() {
    const mockQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDcvMTUvMTTNZPZeAAAGkklEQVR4nO3dQW7jRhBA0RqZRZA95xJzg+SSc4PcIHPJXCJZBEFgwAMPPJ5RW2yS/d8DhAQILLG76quuIkVRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8FSrpQcAnGtVSvlSSvlYSvlUSllf+Pkvv/1eSilbBQEsY1VK+VhK+VFK+VxKWS8whtUpY3pTSvmxzCGAx1mVUr6WUr6VUt4sPJa/rU8Z0+tSyldFAczHqpTytZTyfumB/If1KeN7M/9DA/eVCf9tKeX10gM5w+vTOL8pBOD+EvH/sNvPk1hfGCeQjbxnXfLT7Xn/0mO5wutTxisEYDqyuf9j6YFcKZv/H5ceCHA5m/x8ZPP/49IDgWdXKfLz0lMQwHi+8Oe5/D+VH/YEYBzZ3H+39EBGkjOBd0sPBJ6F7v/xdAIwjHXR/T+aLgCuZ/N/GTYFYRjr4px/SQoBuNy6OOdfmkIAzrcu7va7FxsD4ExZ+bfJvx8hAGd4XXz7715sBsKJVkXnvy86ATjBquj8F6ETgH+o+1/WuigC4G/q/uXZE4B/WBdd/+KEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA06n8BBgCJFDCnTSP/6QAAAABJRU5ErkJggg==';
    
    console.log('📱 QR Code inicial gerado automaticamente');
    
    // Enviar QR Code via WebSocket
    broadcastToClients('qr_ready', {
        sessionName: 'sacmax',
        qr: mockQR
    });
    
    return mockQR;
}

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔌 Nova conexão WebSocket estabelecida');
    wsConnections.add(ws);

    // Enviar status inicial
    ws.send(JSON.stringify({
        event: 'status',
        data: {
            status: 'connected',
            message: 'Conectado ao servidor WhatsApp',
            port: PORT
        }
    }));

    ws.on('close', () => {
        console.log('🔌 Conexão WebSocket fechada');
        wsConnections.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ Erro na conexão WebSocket:', error);
        wsConnections.delete(ws);
    });
});

// Configuração do Bot (em memória)
let botConfig = {
    enabled: true,
    workingHours: {
        enabled: true,
        start: '08:00',
        end: '18:00',
        timezone: 'America/Sao_Paulo'
    },
    offHoursMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve.'
};

// Endpoints da API

// Status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'running',
        sessions: 0,
        websocketConnections: wsConnections.size,
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Endpoints do Bot
app.get('/api/bot/config', (req, res) => {
    res.json({
        success: true,
        config: botConfig
    });
});

app.post('/api/bot/config', (req, res) => {
    try {
        const newConfig = req.body;
        botConfig = { ...botConfig, ...newConfig };
        
        // Broadcast da nova configuração
        broadcastToClients('bot_config_updated', botConfig);
        
        res.json({
            success: true,
            message: 'Configuração do bot atualizada',
            config: botConfig
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Verificar se está dentro do horário de funcionamento
app.get('/api/bot/check-hours', (req, res) => {
    try {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = parseInt(botConfig.workingHours.start.split(':')[0]) * 60 + 
                         parseInt(botConfig.workingHours.start.split(':')[1]);
        const endTime = parseInt(botConfig.workingHours.end.split(':')[0]) * 60 + 
                       parseInt(botConfig.workingHours.end.split(':')[1]);
        
        const isWithinHours = currentTime >= startTime && currentTime <= endTime;
        
        res.json({
            success: true,
            isWithinHours: isWithinHours,
            currentTime: now.toLocaleTimeString('pt-BR'),
            workingHours: botConfig.workingHours,
            message: isWithinHours ? 'Dentro do horário' : botConfig.offHoursMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint para obter informações de portas
app.get('/api/ports', async (req, res) => {
    try {
        const detector = new PortDetector();
        const ports = await detector.detectPorts();
        res.json({
            success: true,
            ports: ports,
            currentPort: PORT
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Criar nova sessão (simulado)
app.post('/api/sessions/add', (req, res) => {
    const { sessionName } = req.body;

    if (!sessionName) {
        return res.status(400).json({
            success: false,
            message: 'sessionName é obrigatório'
        });
    }

    console.log(`📱 Sessão WhatsApp criada: ${sessionName}`);

    // Gerar QR Code real de exemplo
    const mockQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDcvMTUvMTTNZPZeAAAGkklEQVR4nO3dQW7jRhBA0RqZRZA95xJzg+SSc4PcIHPJXCJZBEFgwAMPPJ5RW2yS/d8DhAQILLG76quuIkVRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8FSrpQcAnGtVSvlSSvlYSvlUSllf+Pkvv/1eSilbBQEsY1VK+VhK+VFK+VxKWS8whtUpY3pTSvmxzCGAx1mVUr6WUr6VUt4sPJa/rU8Z0+tSyldFAczHqpTytZTyfumB/If1KeN7M/9DA/eVCf9tKeX10gM5w+vTOL8pBOD+EvH/sNvPk1hfGCeQjbxnXfLT7Xn/0mO5wutTxisEYDqyuf9j6YFcKZv/H5ceCHA5m/x8ZPP/49IDgWdXKfLz0lMQwHi+8Oe5/D+VH/YEYBzZ3H+39EBGkjOBd0sPBJ6F7v/xdAIwjHXR/T+aLgCuZ/N/GTYFYRjr4px/SQoBuNy6OOdfmkIAzrcu7va7FxsD4ExZ+bfJvx8hAGd4XXz7715sBsKJVkXnvy86ATjBquj8F6ETgH+o+1/WuigC4G/q/uXZE4B/WBdd/+KEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA06n8BBgCJFDCnTSP/6QAAAABJRU5ErkJggg==';

    // Broadcast QR Code para frontend
    broadcastToClients('qr_ready', {
        sessionName,
        qr: mockQR
    });

    console.log('📱 QR Code enviado via WebSocket para sessão:', sessionName);

    res.json({
        success: true,
        message: 'Sessão criada com sucesso',
        sessionName: sessionName,
        port: PORT
    });
});

// Obter QR Code
app.get('/api/sessions/:sessionName/qr', (req, res) => {
    const { sessionName } = req.params;

    // Gerar um QR Code de exemplo mais realista (QR Code placeholder)
    // Este é um QR Code real que diz "SACMAX-WHATSAPP-DEMO"
    const mockQR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNui8sowAAAAWdEVYdENyZWF0aW9uIFRpbWUAMDcvMTUvMTTNZPZeAAAGkklEQVR4nO3dQW7jRhBA0RqZRZA95xJzg+SSc4PcIHPJXCJZBEFgwAMPPJ5RW2yS/d8DhAQILLG76quuIkVRAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8FSrpQcAnGtVSvlSSvlYSvlUSllf+Pkvv/1eSilbBQEsY1VK+VhK+VFK+VxKWS8whtUpY3pTSvmxzCGAx1mVUr6WUr6VUt4sPJa/rU8Z0+tSyldFAczHqpTytZTyfumB/If1KeN7M/9DA/eVCf9tKeX10gM5w+vTOL8pBOD+EvH/sNvPk1hfGCeQjbxnXfLT7Xn/0mO5wutTxisEYDqyuf9j6YFcKZv/H5ceCHA5m/x8ZPP/49IDgWdXKfLz0lMQwHi+8Oe5/D+VH/YEYBzZ3H+39EBGkjOBd0sPBJ6F7v/xdAIwjHXR/T+aLgCuZ/N/GTYFYRjr4px/SQoBuNy6OOdfmkIAzrcu7va7FxsD4ExZ+bfJvx8hAGd4XXz7715sBsKJVkXnvy86ATjBquj8F6ETgH+o+1/WuigC4G/q/uXZE4B/WBdd/+KEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA0SggAQKOEAAA06n8BBgCJFDCnTSP/6QAAAABJRU5ErkJggg==';

    res.json({
        success: true,
        qr: mockQR,
        sessionName: sessionName,
        port: PORT
    });
});

// Listar sessões
app.get('/api/sessions', (req, res) => {
    res.json({
        success: true,
        sessions: [
            {
                sessionName: 'default',
                status: 'ready',
                port: PORT
            }
        ]
    });
});

// Enviar mensagem (simulado)
app.post('/api/send-message', (req, res) => {
    const { sessionName, to, message } = req.body;

    if (!sessionName || !to || !message) {
        return res.status(400).json({
            success: false,
            message: 'sessionName, to e message são obrigatórios'
        });
    }

    console.log(`📤 Mensagem enviada: ${message} para ${to}`);

    // Simular mensagem enviada
    const messageData = {
        sessionName,
        id: Date.now().toString(),
        from: 'me',
        to: to,
        body: message,
        timestamp: Math.floor(Date.now() / 1000),
        type: 'chat',
        hasMedia: false,
        isGroup: false,
        isStatus: false
    };

    // Broadcast mensagem enviada
    broadcastToClients('message_sent', messageData);

    res.json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: messageData,
        port: PORT
    });
});

// Obter chats (simulado)
app.get('/api/chats', (req, res) => {
    const mockChats = [
        {
            id: '1234567890@c.us',
            name: 'Contato Teste',
            number: '1234567890',
            unreadCount: 0,
            lastMessage: 'Olá!'
        }
    ];

    res.json({
        success: true,
        chats: mockChats,
        port: PORT
    });
});

// Obter mensagens (simulado)
app.get('/api/messages/:contactId', (req, res) => {
    const { contactId } = req.params;

    const mockMessages = [
        {
            id: '1',
            from: contactId,
            to: 'me',
            body: 'Olá! Como você está?',
            timestamp: Math.floor(Date.now() / 1000) - 3600,
            type: 'chat',
            hasMedia: false
        },
        {
            id: '2',
            from: 'me',
            to: contactId,
            body: 'Oi! Tudo bem, obrigado!',
            timestamp: Math.floor(Date.now() / 1000) - 1800,
            type: 'chat',
            hasMedia: false
        }
    ];

    res.json({
        success: true,
        messages: mockMessages,
        port: PORT
    });
});

// Função para iniciar servidor com porta automática
async function startServer() {
    try {
        // Detectar porta disponível
        const detector = new PortDetector();
        const ports = await detector.detectPorts();
        PORT = ports.whatsapp;
        
        // Iniciar servidor
        server.listen(PORT, () => {
            console.log(`🚀 Servidor WhatsApp Simplificado rodando na porta ${PORT}`);
            console.log(`📱 API disponível em: http://localhost:${PORT}/api`);
            console.log(`🔌 WebSocket disponível em: ws://localhost:${PORT}`);
            console.log(`💡 Modo simulado - Para uso em produção, configure o WhatsApp real`);
            console.log(`📋 Portas detectadas:`, ports);
            
            // Gerar QR Code automaticamente quando servidor inicia
            setTimeout(() => {
                generateInitialQR();
            }, 2000);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Iniciar servidor
startServer();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor WhatsApp...');
    server.close(() => {
        console.log('✅ Servidor WhatsApp encerrado');
        process.exit(0);
    });
});

