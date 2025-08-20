const redisService = require('./redisService');

class RateLimiter {
  constructor() {
    this.limits = {
      '/api/excel/upload': { requests: 10, window: 60000 },
      '/api/whatsapp/send': { requests: 30, window: 60000 },
      '/api/clients': { requests: 100, window: 60000 },
      '/api/feedback': { requests: 50, window: 60000 }
    };
  }

  async checkLimit(endpoint, identifier) {
    const key = `rate:${endpoint}:${identifier}`;
    const limit = this.limits[endpoint] || { requests: 60, window: 60000 };
    
    try {
      const current = await redisService.get(key);
      const requests = current ? current.requests : 0;
      const resetTime = current ? current.resetTime : Date.now() + limit.window;
      
      if (requests >= limit.requests) {
        return {
          allowed: false,
          resetTime,
          remaining: 0
        };
      }
      
      const newCount = requests + 1;
      const ttl = Math.ceil((resetTime - Date.now()) / 1000);
      
      await redisService.set(key, {
        requests: newCount,
        resetTime
      }, ttl);
      
      return {
        allowed: true,
        remaining: limit.requests - newCount,
        resetTime
      };
      
    } catch (error) {
      // Se Redis falhar, permitir (fail-open)
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + 60000
      };
    }
  }

  async getRateLimitHeaders(endpoint, identifier) {
    const key = `rate:${endpoint}:${identifier}`;
    const limit = this.limits[endpoint] || { requests: 60, window: 60000 };
    
    try {
      const current = await redisService.get(key);
      const requests = current ? current.requests : 0;
      const resetTime = current ? current.resetTime : Date.now() + limit.window;
      
      return {
        'X-RateLimit-Limit': limit.requests,
        'X-RateLimit-Remaining': Math.max(0, limit.requests - requests),
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      };
    } catch {
      return {
        'X-RateLimit-Limit': limit.requests,
        'X-RateLimit-Remaining': limit.requests,
        'X-RateLimit-Reset': new Date(Date.now() + 60000).toISOString()
      };
    }
  }
}

module.exports = new RateLimiter();