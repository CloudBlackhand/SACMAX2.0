#!/usr/bin/env node

const cacheManager = require('./backend/services/cacheManager');
const redisService = require('./backend/services/redisService');

async function monitorCache() {
  console.log('📊 Monitoramento de Cache SacsMax');
  console.log('='.repeat(50));
  
  try {
    const stats = await cacheManager.getCacheStats();
    console.log('📈 Estatísticas do Cache:');
    console.log(JSON.stringify(stats, null, 2));
    
    const health = await redisService.healthCheck();
    console.log('\n💚 Health Check Redis:', health ? 'OK' : 'FALHOU');
    
  } catch (error) {
    console.error('❌ Erro no monitoramento:', error.message);
  }
}

if (require.main === module) {
  monitorCache();
}

module.exports = { monitorCache };