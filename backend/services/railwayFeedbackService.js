const { createRailwayClient } = require('../config/supabase');
const logger = require('../utils/logger');

class RailwayFeedbackService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      this.client = createRailwayClient();
      if (this.client) {
        await this.client.connect();
        this.isConnected = true;
        logger.info('Railway PostgreSQL conectado para feedback');
        await this.createTables();
      } else {
        logger.warn('Railway PostgreSQL não configurado, usando fallback');
      }
    } catch (error) {
      logger.error('Erro ao conectar ao Railway PostgreSQL:', error.message);
      this.isConnected = false;
    }
  }

  async createTables() {
    const createFeedbackTable = `
      CREATE TABLE IF NOT EXISTS feedback_responses (
        id SERIAL PRIMARY KEY,
        client_id VARCHAR(255),
        client_name VARCHAR(255),
        phone VARCHAR(50),
        feedback_text TEXT,
        sentiment VARCHAR(50),
        category VARCHAR(100),
        rating INTEGER,
        response_time INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createTemplatesTable = `
      CREATE TABLE IF NOT EXISTS message_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        content TEXT,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createClientsTable = `
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        phone VARCHAR(50),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await this.client.query(createFeedbackTable);
      await this.client.query(createTemplatesTable);
      await this.client.query(createClientsTable);
      logger.info('Tabelas Railway criadas com sucesso');
    } catch (error) {
      logger.error('Erro ao criar tabelas:', error.message);
    }
  }

  async saveFeedback(feedbackData) {
    if (!this.isConnected || !this.client) {
      logger.warn('Railway PostgreSQL não disponível, salvando em memória');
      return this.saveToMemory(feedbackData);
    }

    try {
      const query = `
        INSERT INTO feedback_responses 
        (client_id, client_name, phone, feedback_text, sentiment, category, rating, response_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        feedbackData.client_id,
        feedbackData.client_name,
        feedbackData.phone,
        feedbackData.feedback_text,
        feedbackData.sentiment,
        feedbackData.category,
        feedbackData.rating,
        feedbackData.response_time
      ];

      const result = await this.client.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      logger.error('Erro ao salvar feedback:', error.message);
      return this.saveToMemory(feedbackData);
    }
  }

  async getFeedback(filters = {}) {
    if (!this.isConnected || !this.client) {
      return this.getFromMemory(filters);
    }

    try {
      let query = 'SELECT * FROM feedback_responses WHERE 1=1';
      const values = [];
      let paramCount = 1;

      if (filters.client_id) {
        query += ` AND client_id = $${paramCount}`;
        values.push(filters.client_id);
        paramCount++;
      }

      if (filters.category) {
        query += ` AND category = $${paramCount}`;
        values.push(filters.category);
        paramCount++;
      }

      if (filters.sentiment) {
        query += ` AND sentiment = $${paramCount}`;
        values.push(filters.sentiment);
        paramCount++;
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
      }

      const result = await this.client.query(query, values);
      return { success: true, data: result.rows };
    } catch (error) {
      logger.error('Erro ao buscar feedback:', error.message);
      return this.getFromMemory(filters);
    }
  }

  async getStats() {
    if (!this.isConnected || !this.client) {
      return this.getMemoryStats();
    }

    try {
      const stats = await this.client.query(`
        SELECT 
          COUNT(*) as total_responses,
          COUNT(DISTINCT client_id) as unique_clients,
          AVG(rating) as avg_rating,
          COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) as positive_count,
          COUNT(CASE WHEN sentiment = 'negative' THEN 1 END) as negative_count,
          COUNT(CASE WHEN sentiment = 'neutral' THEN 1 END) as neutral_count
        FROM feedback_responses
      `);

      return { success: true, data: stats.rows[0] };
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error.message);
      return this.getMemoryStats();
    }
  }

  // Fallback para quando Railway não está disponível
  saveToMemory(data) {
    if (!this.memoryStorage) this.memoryStorage = [];
    data.id = Date.now();
    data.created_at = new Date().toISOString();
    this.memoryStorage.push(data);
    return { success: true, data, fallback: true };
  }

  getFromMemory(filters = {}) {
    if (!this.memoryStorage) this.memoryStorage = [];
    
    let results = [...this.memoryStorage];
    
    if (filters.client_id) {
      results = results.filter(item => item.client_id === filters.client_id);
    }
    
    if (filters.category) {
      results = results.filter(item => item.category === filters.category);
    }
    
    if (filters.sentiment) {
      results = results.filter(item => item.sentiment === filters.sentiment);
    }
    
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }
    
    return { success: true, data: results, fallback: true };
  }

  getMemoryStats() {
    if (!this.memoryStorage) this.memoryStorage = [];
    
    const total = this.memoryStorage.length;
    const uniqueClients = new Set(this.memoryStorage.map(item => item.client_id)).size;
    const avgRating = total > 0 ? this.memoryStorage.reduce((sum, item) => sum + (item.rating || 0), 0) / total : 0;
    
    const sentiments = this.memoryStorage.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
      return acc;
    }, {});
    
    return {
      success: true,
      data: {
        total_responses: total,
        unique_clients: uniqueClients,
        avg_rating: avgRating,
        positive_count: sentiments.positive || 0,
        negative_count: sentiments.negative || 0,
        neutral_count: sentiments.neutral || 0
      },
      fallback: true
    };
  }

  async checkConnection() {
    return this.isConnected;
  }
}

module.exports = new RailwayFeedbackService();