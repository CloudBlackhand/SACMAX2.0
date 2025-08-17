const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createServer } = require('http');
const { Server } = require('socket.io');
const WhatsAppService = require('./services/whatsappService');
const ExcelProcessor = require('./services/excelProcessor');
const FeedbackClassifier = require('./services/feedbackClassifier');
const logger = require('./utils/logger');

require('dotenv').config();

class SacsMaxServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.whatsappService = new WhatsAppService();
        this.excelProcessor = new ExcelProcessor();
        this.feedbackClassifier = new FeedbackClassifier();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.setupWhatsAppHandlers();
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use('/uploads', express.static('uploads'));

        // Configuração de upload
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = 'uploads';
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });

        this.upload = multer({ 
            storage: storage,
            limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/vnd.ms-excel') {
                    cb(null, true);
                } else {
                    cb(new Error('Apenas arquivos Excel são permitidos'));
                }
            }
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                timestamp: new Date().toISOString(),
                whatsappConnected: this.whatsappService.isConnected()
            });
        });

        // Upload de planilhas
        this.app.post('/api/upload', this.upload.single('file'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
                }

                const filePath = req.file.path;
                const result = await this.excelProcessor.processFile(filePath);
                
                logger.info(`Arquivo processado: ${req.file.originalname}`, { 
                    fileName: req.file.originalname,
                    contactsCount: result.contacts.length 
                });

                res.json({
                    success: true,
                    fileName: req.file.originalname,
                    contacts: result.contacts,
                    sheets: result.sheets
                });
            } catch (error) {
                logger.error('Erro ao processar arquivo', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Enviar mensagens
        this.app.post('/api/send-messages', async (req, res) => {
            try {
                const { contacts, message } = req.body;
                
                if (!contacts || !message) {
                    return res.status(400).json({ error: 'Contatos e mensagem são obrigatórios' });
                }

                const results = await this.whatsappService.sendMessages(contacts, message);
                
                logger.info(`Mensagens enviadas: ${results.sent.length}`, {
                    sent: results.sent.length,
                    failed: results.failed.length
                });

                res.json({
                    success: true,
                    sent: results.sent,
                    failed: results.failed
                });
            } catch (error) {
                logger.error('Erro ao enviar mensagens', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Obter QR Code para WhatsApp
        this.app.get('/api/whatsapp/qr', (req, res) => {
            if (this.whatsappService.qrCode) {
                res.json({ qr: this.whatsappService.qrCode });
            } else {
                res.status(404).json({ error: 'QR Code não disponível' });
            }
        });

        // Status do WhatsApp
        this.app.get('/api/whatsapp/status', (req, res) => {
            res.json({
                connected: this.whatsappService.isConnected(),
                ready: this.whatsappService.isReady(),
                qrReady: this.whatsappService.qrReady
            });
        });

        // Classificar feedback
        this.app.post('/api/classify-feedback', async (req, res) => {
            try {
                const { messages } = req.body;
                
                if (!messages || !Array.isArray(messages)) {
                    return res.status(400).json({ error: 'Mensagens são obrigatórias' });
                }

                const classifications = await this.feedbackClassifier.classify(messages);
                
                res.json({
                    success: true,
                    classifications
                });
            } catch (error) {
                logger.error('Erro ao classificar feedback', error);
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            logger.info('Cliente conectado via Socket.IO', { socketId: socket.id });

            socket.on('disconnect', () => {
                logger.info('Cliente desconectado', { socketId: socket.id });
            });

            socket.on('get-whatsapp-status', () => {
                socket.emit('whatsapp-status', {
                    connected: this.whatsappService.isConnected(),
                    ready: this.whatsappService.isReady(),
                    qrReady: this.whatsappService.qrReady
                });
            });
        });
    }

    setupWhatsAppHandlers() {
        this.whatsappService.on('qr', (qr) => {
            this.io.emit('whatsapp-qr', { qr });
        });

        this.whatsappService.on('ready', () => {
            this.io.emit('whatsapp-ready');
        });

        this.whatsappService.on('message', (message) => {
            this.io.emit('whatsapp-message', message);
        });

        this.whatsappService.on('disconnected', () => {
            this.io.emit('whatsapp-disconnected');
        });
    }

    async start() {
        try {
            const port = process.env.PORT || 3000;
            
            // Inicializar WhatsApp
            await this.whatsappService.initialize();
            
            // Iniciar servidor
            this.server.listen(port, () => {
                logger.info(`Servidor iniciado na porta ${port}`);
                console.log(`🚀 SacsMax Automation rodando em http://localhost:${port}`);
            });

        } catch (error) {
            logger.error('Erro ao iniciar servidor', error);
            process.exit(1);
        }
    }
}

// Inicializar servidor
const server = new SacsMaxServer();
server.start();

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown:', error);
    process.exit(1);
});