#!/usr/bin/env node
/**
 * Servidor WhatsApp Web.js Simplificado
 * Versão para Railway sem dependências pesadas
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Armazenar conexões WebSocket
const connections = new Set();

// Endpoint de status para Railway
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        service: 'whatsapp-server',
        connections: connections.size,
        timestamp: new Date().toISOString(),
        environment: process.env.RAILWAY_ENVIRONMENT || 'development'
    });
});

// Endpoint de health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'whatsapp-server',
        timestamp: new Date().toISOString()
    });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('🔌 Nova conexão WebSocket estabelecida');
    connections.add(ws);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 Mensagem recebida:', data);

            // Broadcast para todas as conexões
            connections.forEach((connection) => {
                if (connection.readyState === WebSocket.OPEN) {
                    connection.send(JSON.stringify(data));
                }
            });
        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    });

    ws.on('close', () => {
        console.log('🔌 Conexão WebSocket fechada');
        connections.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ Erro na conexão WebSocket:', error);
        connections.delete(ws);
    });
});

// API endpoints
app.post('/api/send-message', (req, res) => {
    try {
        const { message, to } = req.body;
        
        // Simular envio de mensagem WhatsApp
        const response = {
            success: true,
            message: 'Mensagem enviada com sucesso',
            data: {
                to,
                message,
                timestamp: new Date().toISOString(),
                id: Math.random().toString(36).substr(2, 9)
            }
        };

        // Broadcast via WebSocket
        connections.forEach((connection) => {
            if (connection.readyState === WebSocket.OPEN) {
                connection.send(JSON.stringify({
                    type: 'message_sent',
                    data: response.data
                }));
            }
        });

        res.json(response);
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.get('/api/connections', (req, res) => {
    res.json({
        connections: connections.size,
        active: Array.from(connections).filter(ws => ws.readyState === WebSocket.OPEN).length
    });
});

// Endpoint para adicionar sessão WhatsApp
app.post('/api/sessions/add', (req, res) => {
    try {
        const { sessionName } = req.body;
        
        // Simular criação de sessão WhatsApp
        const response = {
            success: true,
            message: 'Sessão WhatsApp criada com sucesso',
            data: {
                sessionName: sessionName || 'sacmax',
                qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // QR code placeholder
                status: 'qr_ready',
                timestamp: new Date().toISOString()
            }
        };

        // Broadcast via WebSocket
        connections.forEach((connection) => {
            if (connection.readyState === WebSocket.OPEN) {
                connection.send(JSON.stringify({
                    type: 'session_created',
                    data: response.data
                }));
            }
        });

        res.json(response);
    } catch (error) {
        console.error('❌ Erro ao criar sessão:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Endpoint para remover sessão
app.delete('/api/sessions/remove', (req, res) => {
    try {
        const { sessionName } = req.body;
        
        const response = {
            success: true,
            message: 'Sessão WhatsApp removida com sucesso',
            data: {
                sessionName: sessionName || 'sacmax',
                timestamp: new Date().toISOString()
            }
        };

        res.json(response);
    } catch (error) {
        console.error('❌ Erro ao remover sessão:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Endpoint para gerar QR Code
app.get('/api/sessions/:sessionName/qr', (req, res) => {
    try {
        const { sessionName } = req.params;
        
        // Simular QR Code real (em produção seria gerado pelo WhatsApp Web.js)
        const qrCodeData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        const response = {
            success: true,
            qr: qrCodeData,
            sessionName: sessionName,
            status: 'qr_ready',
            timestamp: new Date().toISOString()
        };

        res.json(response);
    } catch (error) {
        console.error('❌ Erro ao gerar QR Code:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Endpoint para verificar status da sessão
app.get('/api/sessions/:sessionName/status', (req, res) => {
    try {
        const { sessionName } = req.params;
        
        // Simular status da sessão
        const response = {
            success: true,
            sessionName: sessionName,
            status: 'connected', // ou 'disconnected', 'qr_ready'
            timestamp: new Date().toISOString()
        };

        res.json(response);
    } catch (error) {
        console.error('❌ Erro ao verificar status da sessão:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp Server rodando na porta ${PORT}`);
    console.log(`🌍 Ambiente: ${process.env.RAILWAY_ENVIRONMENT || 'development'}`);
    console.log(`📡 WebSocket disponível em ws://localhost:${PORT}`);
});

// Attach WebSocket server
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, fechando servidor...');
    server.close(() => {
        console.log('✅ Servidor fechado');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Recebido SIGINT, fechando servidor...');
    server.close(() => {
        console.log('✅ Servidor fechado');
        process.exit(0);
    });
});

module.exports = app;

