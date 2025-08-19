const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService');

// Middleware de autenticação básica para admin
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Em produção, usar autenticação real
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
        return res.status(401).json({ error: 'Acesso não autorizado' });
    }
    
    next();
};

// GET /api/cache/stats - Estatísticas do cache
router.get('/stats', async (req, res) => {
    try {
        const stats = await cacheService.getCacheStats();
        res.json({
            success: true,
            stats: {
                totalFiles: stats.totalFiles,
                totalSize: stats.totalSize,
                totalSizeFormatted: formatBytes(stats.totalSize),
                maxSize: stats.maxSize,
                maxSizeFormatted: formatBytes(stats.maxSize),
                oldestFile: stats.oldestFile,
                usagePercentage: ((stats.totalSize / stats.maxSize) * 100).toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/cache/clear - Limpar todo o cache
router.post('/clear', authenticateAdmin, async (req, res) => {
    try {
        const result = await cacheService.clearCache();
        
        if (result.cleared) {
            res.json({
                success: true,
                message: `Cache limpo com sucesso. ${result.count} arquivo(s) removido(s).`,
                clearedFiles: result.count
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao limpar cache',
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/cache/file/:key - Deletar arquivo específico
router.delete('/file/:key', authenticateAdmin, async (req, res) => {
    try {
        const { key } = req.params;
        const deleted = await cacheService.deleteFile(key);
        
        if (deleted) {
            res.json({ success: true, message: 'Arquivo removido do cache' });
        } else {
            res.status(404).json({ success: false, message: 'Arquivo não encontrado no cache' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Função auxiliar para formatar bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router;