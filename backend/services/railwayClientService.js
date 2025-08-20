/**
 * Railway Client Service - SacsMax
 * Serviço para gerenciar clientes usando Railway PostgreSQL
 */

const { Pool } = require('pg');
const logger = require('../utils/logger');

class RailwayClientService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    /**
     * Buscar todos os clientes
     */
    async getClients() {
        try {
            const query = `
                SELECT id, name, phone, email, company, 
                       created_at, updated_at, status
                FROM clients 
                ORDER BY created_at DESC
            `;
            
            const result = await this.pool.query(query);
            return {
                success: true,
                data: result.rows,
                count: result.rows.length
            };
        } catch (error) {
            logger.error('Erro ao buscar clientes:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Buscar cliente por ID
     */
    async getClientById(id) {
        try {
            const query = `
                SELECT * FROM clients 
                WHERE id = $1
            `;
            
            const result = await this.pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return {
                    success: false,
                    error: 'Cliente não encontrado',
                    data: null
                };
            }

            return {
                success: true,
                data: result.rows[0]
            };
        } catch (error) {
            logger.error('Erro ao buscar cliente por ID:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Criar novo cliente
     */
    async createClient(clientData) {
        try {
            const { name, phone, email, company, status = 'active' } = clientData;
            
            const query = `
                INSERT INTO clients (name, phone, email, company, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [name, phone, email, company, status]);
            
            return {
                success: true,
                data: result.rows[0],
                message: 'Cliente criado com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao criar cliente:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Atualizar cliente
     */
    async updateClient(id, clientData) {
        try {
            const { name, phone, email, company, status } = clientData;
            
            const query = `
                UPDATE clients 
                SET name = $1, phone = $2, email = $3, company = $4, 
                    status = $5, updated_at = NOW()
                WHERE id = $6
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [name, phone, email, company, status, id]);
            
            if (result.rows.length === 0) {
                return {
                    success: false,
                    error: 'Cliente não encontrado',
                    data: null
                };
            }

            return {
                success: true,
                data: result.rows[0],
                message: 'Cliente atualizado com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao atualizar cliente:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Deletar cliente
     */
    async deleteClient(id) {
        try {
            const query = 'DELETE FROM clients WHERE id = $1 RETURNING *';
            const result = await this.pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return {
                    success: false,
                    error: 'Cliente não encontrado',
                    data: null
                };
            }

            return {
                success: true,
                data: result.rows[0],
                message: 'Cliente deletado com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao deletar cliente:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Salvar dados de planilha Excel
     */
    async saveExcelData(fileName, sheetName, data) {
        try {
            const query = `
                INSERT INTO excel_data (file_name, sheet_name, data, upload_date, processed)
                VALUES ($1, $2, $3, NOW(), false)
                RETURNING *
            `;
            
            const result = await this.pool.query(query, [fileName, sheetName, JSON.stringify(data)]);
            
            return {
                success: true,
                data: result.rows[0],
                message: 'Dados da planilha salvos com sucesso'
            };
        } catch (error) {
            logger.error('Erro ao salvar dados da planilha:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Buscar histórico de uploads
     */
    async getUploadHistory() {
        try {
            const query = `
                SELECT id, file_name, sheet_name, upload_date, processed
                FROM excel_data 
                ORDER BY upload_date DESC
                LIMIT 50
            `;
            
            const result = await this.pool.query(query);
            
            return {
                success: true,
                data: result.rows,
                count: result.rows.length
            };
        } catch (error) {
            logger.error('Erro ao buscar histórico de uploads:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Testar conexão com o banco
     */
    async testConnection() {
        try {
            const result = await this.pool.query('SELECT NOW() as current_time, version()');
            return {
                success: true,
                data: {
                    timestamp: result.rows[0].current_time,
                    version: result.rows[0].version
                },
                message: 'Conexão com Railway PostgreSQL estabelecida'
            };
        } catch (error) {
            logger.error('Erro ao testar conexão:', error);
            return {
                success: false,
                error: error.message,
                message: 'Falha na conexão com Railway PostgreSQL'
            };
        }
    }

    /**
     * Fechar conexão
     */
    async close() {
        try {
            await this.pool.end();
            logger.info('Conexão com Railway PostgreSQL fechada');
        } catch (error) {
            logger.error('Erro ao fechar conexão:', error);
        }
    }
}

module.exports = RailwayClientService;