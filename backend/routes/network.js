/**
 * Rotas de verificação de conectividade
 * Equipe Desktop Internet
 */

const express = require('express');
const NetworkService = require('../services/networkService');

const router = express.Router();
const networkService = new NetworkService();

/**
 * GET /api/network/status
 * Verifica status da conexão com internet
 */
router.get('/status', async (req, res) => {
    try {
        const status = await networkService.checkConnectivity();
        const localStatus = await networkService.checkLocalNetwork();
        
        const fullStatus = {
            ...status,
            local: localStatus,
            overall: networkService.getConnectionMessage(status),
            troubleshooting: networkService.getTroubleshootingTips(status)
        };

        res.json(fullStatus);
    } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        res.status(500).json({
            error: 'Erro ao verificar conectividade',
            message: error.message
        });
    }
});

/**
 * GET /api/network/health
 * Verifica saúde do servidor local
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    });
});

/**
 * POST /api/network/test
 * Testa conexão com endpoint específico
 */
router.post('/test', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                error: 'URL é obrigatória'
            });
        }

        const result = await networkService.testEndpoint(url);
        res.json(result);
    } catch (error) {
        console.error('Erro ao testar endpoint:', error);
        res.status(500).json({
            error: 'Erro ao testar conexão',
            message: error.message
        });
    }
});

module.exports = router;