const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.init();
  }

  init() {
    try {
      const redisUrl = process.env.REDIS_URL || process.env.RAILWAY_REDIS_URL || 'redis://localhost:6379';
      
      this.client = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        retryDelayOnClusterDown: 300,
        enableOfflineQueue: false,
        cache: {
          max: 1000,
          ttl: 300000 // 5 minutos
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('✅ Redis conectado com sucesso');
      });

      this.client.on('error', (error) => {
        this.isConnected = false;
        logger.error('❌ Erro Redis:', error.message);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('⚠️  Redis desconectado');
      });

    } catch (error) {
      logger.error('❌ Falha ao inicializar Redis:', error.message);
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) return null;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('❌ Erro ao buscar cache:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      if (!this.isConnected) return false;
      await this.client.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('❌ Erro ao salvar cache:', error.message);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('❌ Erro ao deletar cache:', error.message);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) return false;
      return await this.client.exists(key);
    } catch (error) {
      logger.error('❌ Erro ao verificar cache:', error.message);
      return false;
    }
  }

  async invalidatePattern(pattern) {
    try {
      if (!this.isConnected) return false;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('❌ Erro ao invalidar cache:', error.message);
      return 0;
    }
  }

  async getStats() {
    try {
      if (!this.isConnected) return null;
      const info = await this.client.info();
      return this.parseRedisInfo(info);
    } catch (error) {
      logger.error('❌ Erro ao obter estatísticas:', error.message);
      return null;
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const stats = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key] = isNaN(value) ? value : Number(value);
      }
    });
    
    return {
      connected_clients: stats.connected_clients,
      used_memory_human: stats.used_memory_human,
      keyspace_hits: stats.keyspace_hits,
      keyspace_misses: stats.keyspace_misses,
      keyspace_hit_ratio: stats.keyspace_hits / (stats.keyspace_hits + stats.keyspace_misses) || 0
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) return false;
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new RedisService();