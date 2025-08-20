const redisService = require('./redisService');
const logger = require('../utils/logger');

class CacheManager {
  constructor() {
    this.TTL = {
      WHATSAPP_STATUS: 300,      // 5 minutos
      CLIENT_LIST: 600,         // 10 minutos
      EXCEL_TEMPLATES: 3600,    // 1 hora
      METRICS: 900,             // 15 minutos
      FEEDBACK: 1800,           // 30 minutos
      UPLOAD_SESSION: 1800      // 30 minutos
    };
  }

  // Cache para status do WhatsApp
  async getWhatsAppStatus() {
    const key = 'whatsapp:status';
    return await redisService.get(key);
  }

  async setWhatsAppStatus(status) {
    const key = 'whatsapp:status';
    return await redisService.set(key, status, this.TTL.WHATSAPP_STATUS);
  }

  // Cache para lista de clientes
  async getClientList(page = 1, limit = 50) {
    const key = `clients:list:${page}:${limit}`;
    return await redisService.get(key);
  }

  async setClientList(page, limit, data) {
    const key = `clients:list:${page}:${limit}`;
    return await redisService.set(key, data, this.TTL.CLIENT_LIST);
  }

  // Cache para templates de Excel
  async getExcelTemplates() {
    const key = 'excel:templates';
    return await redisService.get(key);
  }

  async setExcelTemplates(templates) {
    const key = 'excel:templates';
    return await redisService.set(key, templates, this.TTL.EXCEL_TEMPLATES);
  }

  // Cache para métricas
  async getMetrics(date) {
    const key = `metrics:${date}`;
    return await redisService.get(key);
  }

  async setMetrics(date, metrics) {
    const key = `metrics:${date}`;
    return await redisService.set(key, metrics, this.TTL.METRICS);
  }

  // Cache para sessões de upload
  async getUploadSession(sessionId) {
    const key = `upload:session:${sessionId}`;
    return await redisService.get(key);
  }

  async setUploadSession(sessionId, sessionData) {
    const key = `upload:session:${sessionId}`;
    return await redisService.set(key, sessionData, this.TTL.UPLOAD_SESSION);
  }

  // Invalidação inteligente
  async invalidateClientCache() {
    await redisService.invalidatePattern('clients:*');
    logger.info('Cache de clientes invalidado');
  }

  async invalidateWhatsAppCache() {
    await redisService.invalidatePattern('whatsapp:*');
    logger.info('Cache do WhatsApp invalidado');
  }

  async invalidateExcelCache() {
    await redisService.invalidatePattern('excel:*');
    logger.info('Cache de Excel invalidado');
  }

  async invalidateAll() {
    await redisService.invalidatePattern('*');
    logger.info('Todo cache invalidado');
  }

  // Estatísticas de uso
  async getCacheStats() {
    const stats = await redisService.getStats();
    return {
      redis: stats,
      config: this.TTL,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new CacheManager();