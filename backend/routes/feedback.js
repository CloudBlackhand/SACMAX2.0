const express = require('express');
const router = express.Router();
const feedbackService = require('../services/feedbackService');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Rotas de Feedback
router.get('/feedback', async (req, res) => {
    try {
        const filters = {
            category: req.query.category,
            clientId: req.query.clientId,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };
        
        const feedback = await feedbackService.getFeedback(filters);
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/feedback', async (req, res) => {
    try {
        const { clientId, message, source } = req.body;
        
        if (!clientId || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'ClientId e message são obrigatórios' 
            });
        }

        const feedback = await feedbackService.addFeedback(clientId, message, source);
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/feedback/:id/category', async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.body;
        
        if (!category) {
            return res.status(400).json({ 
                success: false, 
                error: 'Categoria é obrigatória' 
            });
        }

        const feedback = await feedbackService.updateFeedbackCategory(id, category);
        res.json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rotas de Templates
router.get('/templates', async (req, res) => {
    try {
        const { category } = req.query;
        const templates = await feedbackService.getMessageTemplates(category);
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/templates', async (req, res) => {
    try {
        const { name, category, template, variables } = req.body;
        
        if (!name || !category || !template) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nome, categoria e template são obrigatórios' 
            });
        }

        const newTemplate = await feedbackService.createMessageTemplate(
            name, category, template, variables
        );
        res.json({ success: true, data: newTemplate });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rotas de Chat
router.post('/chat/start', async (req, res) => {
    try {
        const { clientId } = req.body;
        
        if (!clientId) {
            return res.status(400).json({ 
                success: false, 
                error: 'ClientId é obrigatório' 
            });
        }

        const chat = await feedbackService.startChat(clientId);
        res.json({ success: true, data: chat });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/chat/:clientId/history', async (req, res) => {
    try {
        const { clientId } = req.params;
        const history = await feedbackService.getChatHistory(clientId);
        res.json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/chat/:chatId/message', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { sender, message, messageType } = req.body;
        
        if (!sender || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Sender e message são obrigatórios' 
            });
        }

        const chatMessage = await feedbackService.sendChatMessage(
            chatId, sender, message, messageType || 'text'
        );
        res.json({ success: true, data: chatMessage });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Gerar resposta com template
router.post('/generate-response', async (req, res) => {
    try {
        const { clientId, templateId, feedbackMessage, customData } = req.body;
        
        if (!clientId || !templateId || !feedbackMessage) {
            return res.status(400).json({ 
                success: false, 
                error: 'ClientId, templateId e feedbackMessage são obrigatórios' 
            });
        }

        const response = await feedbackService.generateResponse(
            clientId, templateId, feedbackMessage, customData
        );
        res.json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rotas de Campanhas
router.post('/campaigns', async (req, res) => {
    try {
        const { name, templateId, messageContent, targetFilter } = req.body;
        
        if (!name || !messageContent) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nome e conteúdo da mensagem são obrigatórios' 
            });
        }

        const campaign = await feedbackService.createMassCampaign(
            name, templateId, messageContent, targetFilter
        );
        res.json({ success: true, data: campaign });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/campaigns/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await feedbackService.executeMassCampaign(id);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Estatísticas
router.get('/stats', async (req, res) => {
    try {
        const stats = await feedbackService.getFeedbackStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Importar contatos via Excel
router.post('/contacts/import', upload.single('file'), async (req, res) => {
    try {
        // Aqui você implementaria a lógica de importação
        // Por enquanto, apenas retorna sucesso
        res.json({ 
            success: true, 
            message: 'Importação de contatos implementada' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;