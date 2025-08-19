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
const cacheService = require('./services/cacheService');

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
        // Health check - versão ultra-simplificada para Railway
        this.app.get('/health', (req, res) => {
            // Resposta imediata sem verificações complexas
            res.status(200).json({ status: 'ok', timestamp: Date.now() });
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

        // API endpoints para o frontend web
        
        // Upload de Excel - rota específica para o frontend
        this.app.post('/api/excel/upload', this.upload.single('file'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
                }

                const result = await this.excelProcessor.processFile(req.file.path);
                
                // Limpar arquivo temporário
                fs.unlink(req.file.path, () => {});
                
                res.json({
                    success: true,
                    contacts: result.contacts || [],
                    sheets: result.sheets || [],
                    message: `Processado ${result.contacts?.length || 0} contatos`
                });
            } catch (error) {
                logger.error('Erro no upload:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Upload de Excel para dados de cliente por data
        this.app.post('/api/excel/client-data', this.upload.single('file'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
                }

                const result = await this.excelProcessor.processFile(req.file.path, 'client_data');
                
                // Limpar arquivo temporário
                fs.unlink(req.file.path, () => {});
                
                res.json({
                    success: true,
                    client_data_by_date: result.client_data_by_date || {},
                    sheets: result.sheets || [],
                    total_dates: result.total_dates || 0,
                    message: `Processado ${result.total_dates || 0} datas com dados de clientes`
                });
            } catch (error) {
                logger.error('Erro no upload de Excel - client_data', error);
                
                // Limpar arquivo em caso de erro
                if (req.file) {
                    fs.unlink(req.file.path, () => {});
                }
                
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Status do WhatsApp - rota para o frontend
        this.app.get('/api/whatsapp/status', async (req, res) => {
            try {
                const status = {
                    initialized: this.whatsappService.isInitialized ? this.whatsappService.isInitialized() : false,
                    connected: this.whatsappService.isConnected ? this.whatsappService.isConnected() : false,
                    ready: this.whatsappService.isReady ? this.whatsappService.isReady() : false,
                    qrCode: this.whatsappService.qrCode || null
                };
                
                res.json(status);
            } catch (error) {
                logger.error('Erro ao obter status:', error);
                res.json({
                    initialized: false,
                    connected: false,
                    ready: false,
                    qrCode: null,
                    error: error.message
                });
            }
        });

        // Iniciar WhatsApp - rota para o frontend
        this.app.post('/api/whatsapp/start', async (req, res) => {
            try {
                const result = await this.whatsappService.initialize();
                res.json({
                    success: true,
                    message: 'WhatsApp iniciado com sucesso',
                    connected: this.whatsappService.isConnected(),
                    ready: this.whatsappService.isReady()
                });
            } catch (error) {
                logger.error('Erro ao iniciar WhatsApp:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Parar WhatsApp - rota para o frontend
        this.app.post('/api/whatsapp/stop', async (req, res) => {
            try {
                await this.whatsappService.disconnect();
                res.json({
                    success: true,
                    message: 'WhatsApp parado com sucesso'
                });
            } catch (error) {
                logger.error('Erro ao parar WhatsApp:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Enviar mensagens - rota para o frontend
        this.app.post('/api/whatsapp/send-messages', async (req, res) => {
            try {
                const { contacts, config } = req.body;
                
                if (!contacts || !Array.isArray(contacts)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Contatos não fornecidos ou formato inválido'
                    });
                }

                // Processar mensagens com base nas configurações
                const results = await this.whatsappService.sendMessages(contacts, config);
                
                res.json({
                    success: true,
                    sent: results.sent || 0,
                    failed: results.failed || 0,
                    total: contacts.length
                });
            } catch (error) {
                logger.error('Erro ao enviar mensagens:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Configurações - salvar
        this.app.post('/api/config/save', async (req, res) => {
            try {
                const config = req.body;
                
                // Salvar configurações
                const configPath = path.join(__dirname, '../config/settings.json');
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                res.json({
                    success: true,
                    message: 'Configurações salvas com sucesso'
                });
            } catch (error) {
                logger.error('Erro ao salvar configurações:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Configurações - obter
        this.app.get('/api/config', (req, res) => {
            try {
                const configPath = path.join(__dirname, '../config/settings.json');
                let config = {
                    delayBetweenMessages: 2000,
                    maxRetries: 3,
                    autoResponse: true
                };
                
                if (fs.existsSync(configPath)) {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                }
                
                res.json(config);
            } catch (error) {
                logger.error('Erro ao ler configurações:', error);
                res.status(500).json({
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
        
        // Rota raiz com interface web
        this.app.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>SACSMAX - Sistema de Automação de Comunicação</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
                        .container { max-width: 1200px; margin: 0 auto; padding: 20px; min-height: 100vh; display: flex; flex-direction: column; }
                        .header { background: white; border-radius: 15px; padding: 30px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; }
                        .header h1 { color: #667eea; font-size: 2.5em; margin-bottom: 10px; }
                        .header p { color: #666; font-size: 1.2em; }
                        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
                        .status-card { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
                        .status-icon { font-size: 3em; margin-bottom: 15px; }
                        .status-title { font-size: 1.3em; font-weight: bold; margin-bottom: 10px; }
                        .status-text { color: #666; }
                        .btn { background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.3s ease; margin: 10px; text-decoration: none; display: inline-block; }
                        .btn:hover { background: #5a6fd8; transform: translateY(-1px); }
                        .features { background: white; border-radius: 15px; padding: 30px; margin: 20px 0; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                        .features h2 { color: #667eea; margin-bottom: 20px; text-align: center; }
                        .feature-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
                        .feature-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚀 SACSMAX - Sistema Ativo</h1>
                            <p>Sistema de Automação de Comunicação via WhatsApp</p>
                        </div>
                        
                        <div class="status-grid">
                            <div class="status-card">
                                <div class="status-icon">🟢</div>
                                <div class="status-title">Servidor</div>
                                <div class="status-text">Online na porta ${process.env.PORT || 3000}</div>
                            </div>
                            <div class="status-card">
                                <div class="status-icon">📱</div>
                                <div class="status-title">WhatsApp</div>
                                <div class="status-text">${this.whatsappService.isInitialized && this.whatsappService.isInitialized() ? '✅ Conectado' : '❌ Desconectado'}</div>
                            </div>
                            <div class="status-card">
                                <div class="status-icon">🌐</div>
                                <div class="status-title">Interface</div>
                                <div class="status-text">Interface web completa disponível</div>
                            </div>
                        </div>
                        
                        <div class="features">
                            <h2>🎯 Funcionalidades Disponíveis</h2>
                            <div class="feature-list">
                                <div class="feature-item">📊 Upload de Planilhas Excel</div>
                                <div class="feature-item">📱 Controle do WhatsApp</div>
                                <div class="feature-item">🔄 Status em Tempo Real</div>
                                <div class="feature-item">⚙️ Configurações Dinâmicas</div>
                                <div class="feature-item">📤 Envio de Mensagens</div>
                                <div class="feature-item">📋 Dashboard de Progresso</div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="/interface" class="btn">🚀 Acessar Interface Completa</a>
                        </div>
                    </div>
                </body>
                </html>
            `);
        });

        // Rota para servir a interface como JavaScript
        this.app.get('/web-interface.js', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/webInterface.js'));
        });

        // Rota para página HTML que carrega a interface
        this.app.get('/interface', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SACSMAX - Interface Web</title>
</head>
<body>
    <script src="/web-interface.js"></script>
</body>
</html>
            `);
        });

        // Rotas de API para o frontend web
        
        // Upload de Excel
        this.app.post('/api/excel/upload', this.upload.single('file'), async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado' });
                }

                const result = await this.excelProcessor.processFile(req.file.path);
                
                // Limpar arquivo temporário
                fs.unlink(req.file.path, () => {});
                
                res.json({
                    success: true,
                    contacts: result.contacts || [],
                    sheets: result.sheets || [],
                    message: `Processado ${result.contacts?.length || 0} contatos`
                });
            } catch (error) {
                console.error('Erro no upload:', error);
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Status do WhatsApp
        this.app.get('/api/whatsapp/status', async (req, res) => {
            try {
                const status = await this.whatsappService.getStatus();
                res.json({
                    initialized: status.initialized,
                    connected: status.connected,
                    ready: status.ready,
                    qrCode: status.qrCode || null
                });
            } catch (error) {
                console.error('Erro ao obter status:', error);
                res.json({
                    initialized: false,
                    connected: false,
                    ready: false,
                    qrCode: null,
                    error: error.message
                });
            }
        });

        // Iniciar WhatsApp
        this.app.post('/api/whatsapp/start', async (req, res) => {
            try {
                const result = await this.whatsappService.initialize();
                res.json({
                    success: true,
                    message: 'WhatsApp iniciado com sucesso',
                    connected: result.connected,
                    ready: result.ready
                });
            } catch (error) {
                console.error('Erro ao iniciar WhatsApp:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Parar WhatsApp
        this.app.post('/api/whatsapp/stop', async (req, res) => {
            try {
                await this.whatsappService.stop();
                res.json({
                    success: true,
                    message: 'WhatsApp parado com sucesso'
                });
            } catch (error) {
                console.error('Erro ao parar WhatsApp:', error);
                res.status(500).json({
                    success: false,
                    message: error.message
                });
            }
        });

        // Enviar mensagens
        this.app.post('/api/whatsapp/send-messages', async (req, res) => {
            try {
                const { contacts, config } = req.body;
                
                if (!contacts || !Array.isArray(contacts)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Contatos não fornecidos ou formato inválido'
                    });
                }

                const result = await this.whatsappService.sendMessages(contacts, config);
                res.json({
                    success: true,
                    sent: result.sent || 0,
                    failed: result.failed || 0,
                    total: contacts.length
                });
            } catch (error) {
                console.error('Erro ao enviar mensagens:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Salvar configurações
        this.app.post('/api/config/save', async (req, res) => {
            try {
                const config = req.body;
                
                // Salvar configurações (pode ser em arquivo ou banco)
                const configPath = path.join(__dirname, '../config/settings.json');
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                
                res.json({
                    success: true,
                    message: 'Configurações salvas com sucesso'
                });
            } catch (error) {
                console.error('Erro ao salvar configurações:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Obter configurações
        this.app.get('/api/config', (req, res) => {
            try {
                const configPath = path.join(__dirname, '../config/settings.json');
                let config = {
                    delayBetweenMessages: 2000,
                    maxRetries: 3,
                    autoResponse: true
                };
                
                if (fs.existsSync(configPath)) {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                }
                
                res.json(config);
            } catch (error) {
                console.error('Erro ao ler configurações:', error);
                res.status(500).json({
                    error: error.message
                });
            }
        });

        // === INTEGRAÇÃO SUPABASE ===
        const SupabaseService = require('./services/supabaseService');

        // === INTEGRAÇÃO FEEDBACK ===
        const feedbackRoutes = require('./routes/feedback');
        this.app.use('/api/feedback', feedbackRoutes);

        // === INTEGRAÇÃO CACHE (ADMIN) ===
        const cacheRoutes = require('./routes/cache');
        this.app.use('/api/cache', cacheRoutes);

        // Salvar dados da planilha no Supabase
        this.app.post('/api/supabase/save-data', async (req, res) => {
            try {
                const { spreadsheetData, fileName, mode } = req.body;
                
                if (!spreadsheetData || !fileName) {
                    return res.status(400).json({
                        success: false,
                        error: 'Dados da planilha ou nome do arquivo não fornecidos'
                    });
                }

                const result = await SupabaseService.saveSpreadsheetData(
                    spreadsheetData, 
                    fileName, 
                    mode || 'client_data'
                );

                res.json({
                    success: true,
                    ...result,
                    message: `Dados salvos com sucesso: ${result.total_records} registros processados`
                });
            } catch (error) {
                logger.error('Erro ao salvar dados no Supabase:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Buscar todos os clientes
        this.app.get('/api/supabase/clients', async (req, res) => {
            try {
                const clients = await SupabaseService.getAllClients();
                res.json({
                    success: true,
                    clients,
                    total: clients.length
                });
            } catch (error) {
                logger.error('Erro ao buscar clientes:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Buscar dados de um cliente específico
        this.app.get('/api/supabase/clients/:id/data', async (req, res) => {
            try {
                const { id } = req.params;
                const clientData = await SupabaseService.getClientData(id);
                
                res.json({
                    success: true,
                    clientData,
                    total: clientData.length
                });
            } catch (error) {
                logger.error('Erro ao buscar dados do cliente:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Buscar histórico de uploads
        this.app.get('/api/supabase/upload-history', async (req, res) => {
            try {
                const history = await SupabaseService.getUploadHistory();
                res.json({
                    success: true,
                    history,
                    total: history.length
                });
            } catch (error) {
                logger.error('Erro ao buscar histórico:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Deletar cliente
        this.app.delete('/api/supabase/clients/:id', async (req, res) => {
            try {
                const { id } = req.params;
                await SupabaseService.deleteClient(id);
                
                res.json({
                    success: true,
                    message: 'Cliente deletado com sucesso'
                });
            } catch (error) {
                logger.error('Erro ao deletar cliente:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
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
            const host = process.env.HOST || '0.0.0.0';
            
            // Iniciar servidor HTTP imediatamente para passar no health check
            this.server.listen(port, host, () => {
                logger.info(`Servidor iniciado em ${host}:${port}`);
                console.log(`🚀 SacsMax Automation rodando em http://${host}:${port}`);
                console.log(`📱 WhatsApp Web será iniciado via frontend quando necessário`);
            });

            // Serviços serão inicializados apenas via interface (botões)
            setTimeout(() => {
                logger.info('Sistema pronto - WhatsApp pode ser iniciado via interface');
            }, 2000);

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