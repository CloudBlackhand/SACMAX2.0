const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CacheService {
    constructor() {
        this.cacheDir = path.join(__dirname, '..', '..', '.cache');
        this.maxCacheSize = 100 * 1024 * 1024; // 100MB
        this.maxAge = 60 * 60 * 1000; // 1 hora
        this.ensureCacheDir();
    }

    ensureCacheDir() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    generateKey(originalName, buffer) {
        const hash = crypto.createHash('md5');
        hash.update(buffer);
        hash.update(originalName);
        return `${hash.digest('hex')}_${Date.now()}`;
    }

    async storeFile(file) {
        try {
            const buffer = fs.readFileSync(file.path);
            const key = this.generateKey(file.originalname, buffer);
            const cachePath = path.join(this.cacheDir, key);
            
            fs.writeFileSync(cachePath, buffer);
            
            const metadata = {
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                timestamp: Date.now(),
                path: cachePath
            };
            
            fs.writeFileSync(`${cachePath}.meta`, JSON.stringify(metadata));
            
            // Limpar cache antigo automaticamente
            this.cleanupOldFiles();
            
            return {
                key,
                metadata,
                cached: true
            };
        } catch (error) {
            console.error('Erro ao armazenar arquivo em cache:', error);
            return { cached: false, error: error.message };
        }
    }

    async getFile(key) {
        try {
            const cachePath = path.join(this.cacheDir, key);
            const metaPath = `${cachePath}.meta`;
            
            if (!fs.existsSync(cachePath) || !fs.existsSync(metaPath)) {
                return null;
            }
            
            const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            
            // Verificar se expirou
            if (Date.now() - metadata.timestamp > this.maxAge) {
                this.deleteFile(key);
                return null;
            }
            
            return {
                buffer: fs.readFileSync(cachePath),
                metadata
            };
        } catch (error) {
            console.error('Erro ao recuperar arquivo do cache:', error);
            return null;
        }
    }

    async deleteFile(key) {
        try {
            const cachePath = path.join(this.cacheDir, key);
            const metaPath = `${cachePath}.meta`;
            
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
            
            return true;
        } catch (error) {
            console.error('Erro ao deletar arquivo do cache:', error);
            return false;
        }
    }

    async clearCache() {
        try {
            if (!fs.existsSync(this.cacheDir)) return { cleared: true, count: 0 };
            
            const files = fs.readdirSync(this.cacheDir);
            let count = 0;
            
            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                try {
                    fs.unlinkSync(filePath);
                    count++;
                } catch (error) {
                    console.error(`Erro ao deletar ${file}:`, error);
                }
            }
            
            return { cleared: true, count };
        } catch (error) {
            console.error('Erro ao limpar cache:', error);
            return { cleared: false, error: error.message };
        }
    }

    getCacheStats() {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                return { totalFiles: 0, totalSize: 0, oldestFile: null };
            }
            
            const files = fs.readdirSync(this.cacheDir);
            let totalSize = 0;
            let oldestFile = null;
            
            for (const file of files) {
                if (!file.endsWith('.meta')) {
                    const filePath = path.join(this.cacheDir, file);
                    const stats = fs.statSync(filePath);
                    totalSize += stats.size;
                    
                    const metaPath = `${filePath}.meta`;
                    if (fs.existsSync(metaPath)) {
                        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                        if (!oldestFile || metadata.timestamp < oldestFile.timestamp) {
                            oldestFile = metadata;
                        }
                    }
                }
            }
            
            return {
                totalFiles: files.filter(f => !f.endsWith('.meta')).length,
                totalSize,
                oldestFile,
                maxSize: this.maxCacheSize
            };
        } catch (error) {
            console.error('Erro ao obter estatísticas do cache:', error);
            return { totalFiles: 0, totalSize: 0, error: error.message };
        }
    }

    cleanupOldFiles() {
        try {
            if (!fs.existsSync(this.cacheDir)) return;
            
            const files = fs.readdirSync(this.cacheDir);
            const now = Date.now();
            
            for (const file of files) {
                if (file.endsWith('.meta')) continue;
                
                const filePath = path.join(this.cacheDir, file);
                const metaPath = `${filePath}.meta`;
                
                try {
                    const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                    
                    if (now - metadata.timestamp > this.maxAge) {
                        fs.unlinkSync(filePath);
                        fs.unlinkSync(metaPath);
                    }
                } catch (error) {
                    // Se não conseguir ler metadata, deletar
                    try {
                        fs.unlinkSync(filePath);
                        if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
                    } catch (cleanupError) {
                        console.error('Erro ao limpar arquivo antigo:', cleanupError);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao limpar arquivos antigos:', error);
        }
    }
}

module.exports = new CacheService();