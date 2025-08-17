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
        this.app.get('/health', async (req, res) => {
            let chromeAvailable = false;
            
            // Verificar se o Chrome/Chromium está disponível
            try {
                const { execSync } = require('child_process');
                const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
                execSync(`which chromium-browser || which chrome || test -f ${chromePath}`, { stdio: 'ignore' });
                chromeAvailable = true;
            } catch (error) {
                chromeAvailable = false;
            }

            const healthStatus = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                server: 'running',
                chrome: {
                    available: chromeAvailable,
                    path: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
                },
                whatsapp: {
                    connected: this.whatsappService.isConnected(),
                    ready: this.whatsappService.isReady(),
                    initialized: this.whatsappService.isInitialized ? this.whatsappService.isInitialized() : false
                },
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0',
                environment: {
                    node: process.version,
                    platform: process.platform,
                    arch: process.arch
                }
            };
            
            // Se o Chrome não estiver disponível, retornar 503
            const statusCode = chromeAvailable ? 200 : 503;
            res.status(statusCode).json(healthStatus);
        });

        // WhatsApp control endpoints
        this.app.post('/whatsapp/start', async (req, res) => {
            try {
                if (this.whatsappService.isInitialized && this.whatsappService.isInitialized()) {
                    return res.json({ 
                        success: false, 
                        message: 'WhatsApp já está inicializado' 
                    });
                }
                
                await this.whatsappService.initialize();
                res.json({ 
                    success: true, 
                    message: 'WhatsApp inicializado com sucesso',
                    connected: this.whatsappService.isConnected(),
                    ready: this.whatsappService.isReady()
                });
            } catch (error) {
                logger.error('Erro ao iniciar WhatsApp via endpoint', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });

        this.app.post('/whatsapp/stop', async (req, res) => {
            try {
                if (!this.whatsappService.isInitialized || !this.whatsappService.isInitialized()) {
                    return res.json({ 
                        success: false, 
                        message: 'WhatsApp não está inicializado' 
                    });
                }
                
                await this.whatsappService.disconnect();
                res.json({ 
                    success: true, 
                    message: 'WhatsApp desconectado com sucesso'
                });
            } catch (error) {
                logger.error('Erro ao parar WhatsApp via endpoint', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
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
        this.app.get('/whatsapp/status', (req, res) => {
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

        // Servir frontend estático
        this.app.use(express.static(path.join(__dirname, '../frontend')));
        
        // Rota raiz - Interface Web
        this.app.get('/', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SacsMax Automation - Sistema de Automação WhatsApp</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { background: white; padding: 2rem; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 800px; width: 90%; text-align: center; }
        .logo { font-size: 3rem; margin-bottom: 1rem; }
        h1 { color: #333; margin-bottom: 1rem; font-size: 2.5rem; }
        .subtitle { color: #666; margin-bottom: 2rem; font-size: 1.2rem; }
        .status { display: flex; justify-content: space-around; margin: 2rem 0; }
        .status-item { padding: 1rem; background: #f8f9fa; border-radius: 10px; flex: 1; margin: 0 0.5rem; }
        .status-title { font-weight: bold; color: #333; margin-bottom: 0.5rem; }
        .status-value { font-size: 1.1rem; }
        .online { color: #28a745; }
        .offline { color: #dc3545; }
        .api-section { margin: 2rem 0; padding: 1.5rem; background: #f8f9fa; border-radius: 10px; }
        .api-title { font-size: 1.5rem; margin-bottom: 1rem; color: #333; }
        .endpoint { margin: 1rem 0; padding: 1rem; background: white; border-radius: 5px; border-left: 4px solid #667eea; }
        .method { font-weight: bold; color: #667eea; }
        .path { font-family: monospace; background: #f1f3f4; padding: 0.2rem 0.5rem; border-radius: 3px; }
        .description { color: #666; margin-top: 0.5rem; }
        .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📱</div>
        <h1>SacsMax Automation</h1>
        <p class="subtitle">Sistema de Automação WhatsApp para Envio em Massa</p>
        
        <div class="status">
            <div class="status-item">
                <div class="status-title">Servidor</div>
                <div class="status-value online">✅ Online</div>
            </div>
            <div class="status-item">
                <div class="status-title">WhatsApp</div>
                <div class="status-value offline">⏳ Aguardando</div>
            </div>
            <div class="status-item">
                <div class="status-title">API</div>
                <div class="status-value online">✅ Disponível</div>
            </div>
        </div>

        <div class="api-section">
            <h2 class="api-title">🔗 Endpoints da API</h2>
            
            <div class="endpoint">
                <span class="method">GET</span> <span class="path">/health</span>
                <div class="description">Verificar status do sistema</div>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span> <span class="path">/whatsapp/start</span>
                <div class="description">Inicializar WhatsApp Web</div>
            </div>
            
            <div class="endpoint">
                <span class="method">GET</span> <span class="path">/api/whatsapp/qr</span>
                <div class="description">Obter QR Code para autenticação</div>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span> <span class="path">/api/upload</span>
                <div class="description">Upload de planilha Excel com contatos</div>
            </div>
            
            <div class="endpoint">
                <span class="method">POST</span> <span class="path">/api/send-messages</span>
                <div class="description">Enviar mensagens em massa</div>
            </div>
        </div>

        <div class="footer">
            <p>🚀 SacsMax v1.0 - Sistema rodando no Railway</p>
            <p>Desenvolvido para automação profissional de WhatsApp</p>
        </div>
    </div>

    <script>
        // Atualizar status em tempo real
        async function updateStatus() {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                
                const whatsappStatus = document.querySelector('.status-item:nth-child(2) .status-value');
                if (data.whatsapp.connected) {
                    whatsappStatus.innerHTML = '✅ Conectado';
                    whatsappStatus.className = 'status-value online';
                } else if (data.whatsapp.initialized) {
                    whatsappStatus.innerHTML = '🔄 Inicializando';
                    whatsappStatus.className = 'status-value';
                } else {
                    whatsappStatus.innerHTML = '⏳ Aguardando';
                    whatsappStatus.className = 'status-value offline';
                }
            } catch (error) {
                console.log('Erro ao atualizar status:', error);
            }
        }
        
        // Atualizar a cada 5 segundos
        setInterval(updateStatus, 5000);
        updateStatus();
    </script>
</body>
</html>
            `);
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
            
            // Iniciar servidor HTTP apenas - WhatsApp será controlado pelo frontend
            this.server.listen(port, () => {
                logger.info(`Servidor iniciado na porta ${port}`);
                console.log(`🚀 SacsMax Automation rodando em http://localhost:${port}`);
                console.log(`📱 WhatsApp Web será iniciado via frontend quando necessário`);
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