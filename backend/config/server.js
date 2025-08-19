const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { supabaseOptimizedService } = require('../services/supabaseOptimizedService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de upload
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não suportado. Use Excel ou CSV.'));
        }
    }
});

// Criar diretório de uploads se não existir
fs.mkdir('uploads', { recursive: true }).catch(console.error);

// Rotas de Upload e Processamento
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        const { mode = 'client_data' } = req.body;
        
        // Criar sessão de upload
        const uploadSession = await supabaseOptimizedService.createUploadSession({
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mode: mode
        });

        // Processar arquivo
        const filePath = req.file.path;
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        let processedData;
        if (req.file.mimetype.includes('csv')) {
            processedData = await processCSV(fileContent);
        } else {
            processedData = await processExcel(filePath);
        }

        // Salvar dados processados
        const result = await supabaseOptimizedService.processSpreadsheetDataOptimized({
            uploadSessionId: uploadSession.id,
            data: processedData,
            mode: mode
        });

        // Limpar arquivo temporário
        await fs.unlink(filePath);

        res.json({
            success: true,
            sessionId: uploadSession.id,
            processedRecords: result.processedRecords,
            mode: mode
        });

    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rotas de Contatos Enviados
app.get('/api/sent-contacts', async (req, res) => {
    try {
        const { page = 1, limit = 20, q: searchTerm } = req.query;
        
        let contacts;
        let total;

        if (searchTerm) {
            const result = await supabaseOptimizedService.searchContacts(searchTerm);
            contacts = result;
            total = result.length;
        } else {
            const offset = (page - 1) * limit;
            const result = await supabaseOptimizedService.getAllSentContacts({
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
            contacts = result.contacts;
            total = result.total;
        }

        res.json({
            contacts,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sent-contacts/stats', async (req, res) => {
    try {
        const stats = await supabaseOptimizedService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sent-contacts/:id/resend', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await supabaseOptimizedService.resendMessage(id);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Erro ao reenviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rotas de Templates de Mensagens em Massa
app.get('/api/mass-templates', async (req, res) => {
    try {
        const templates = await supabaseOptimizedService.getMassTemplates();
        res.json(templates);
    } catch (error) {
        console.error('Erro ao buscar templates:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/mass-templates', async (req, res) => {
    try {
        const template = await supabaseOptimizedService.saveMassTemplate(req.body);
        res.json(template);
    } catch (error) {
        console.error('Erro ao salvar template:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/mass-templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const template = await supabaseOptimizedService.updateMassTemplate(id, req.body);
        res.json(template);
    } catch (error) {
        console.error('Erro ao atualizar template:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/mass-templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await supabaseOptimizedService.deleteMassTemplate(id);
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rotas de Upload History
app.get('/api/upload-history', async (req, res) => {
    try {
        const history = await supabaseOptimizedService.getUploadHistory();
        res.json(history);
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rotas de Feedback
app.get('/api/feedback', async (req, res) => {
    try {
        const { category, from, to, page = 1, limit = 50 } = req.query;
        
        const feedback = await supabaseOptimizedService.getFeedback({
            category,
            dateFrom: from,
            dateTo: to,
            limit: parseInt(limit),
            offset: (page - 1) * limit
        });

        res.json(feedback);
    } catch (error) {
        console.error('Erro ao buscar feedback:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota de Health Check
app.get('/api/health', async (req, res) => {
    try {
        const isConnected = await supabaseOptimizedService.checkConnection();
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: isConnected ? 'connected' : 'disconnected'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Funções auxiliares de processamento
async function processCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        return row;
    });
}

async function processExcel(filePath) {
    // Para simplicidade, retornar estrutura básica
    // Em produção, usar biblioteca como xlsx
    return [{ name: 'Cliente', phone: '11999999999', email: 'cliente@email.com' }];
}

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('Erro não tratado:', error);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Ocorreu um erro'
    });
});

// Rota 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;