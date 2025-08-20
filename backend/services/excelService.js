const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

class ExcelService {
    constructor() {
        this.client = null;
        this.connected = false;
    }

    async connect() {
        try {
            this.client = new Client({
                connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL
            });
            await this.client.connect();
            this.connected = true;
            console.log('✅ Conectado ao PostgreSQL do Railway');
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
            this.connected = false;
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.end();
            this.connected = false;
        }
    }

    async saveExcelData(data) {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const query = `
                INSERT INTO excel_data (filename, data, created_at) 
                VALUES ($1, $2, NOW()) 
                RETURNING id
            `;
            
            const result = await this.client.query(query, [
                data.filename,
                JSON.stringify(data.content)
            ]);
            
            return { success: true, id: result.rows[0].id };
        } catch (error) {
            console.error('Erro ao salvar dados Excel:', error);
            return { success: false, error: error.message };
        }
    }

    async getExcelData(id) {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const query = 'SELECT * FROM excel_data WHERE id = $1';
            const result = await this.client.query(query, [id]);
            
            if (result.rows.length > 0) {
                return { success: true, data: result.rows[0] };
            }
            
            return { success: false, error: 'Dados não encontrados' };
        } catch (error) {
            console.error('Erro ao buscar dados Excel:', error);
            return { success: false, error: error.message };
        }
    }

    async listExcelData() {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const query = 'SELECT id, filename, created_at FROM excel_data ORDER BY created_at DESC';
            const result = await this.client.query(query);
            
            return { success: true, data: result.rows };
        } catch (error) {
            console.error('Erro ao listar dados Excel:', error);
            return { success: false, error: error.message };
        }
    }

    async createTable() {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const query = `
                CREATE TABLE IF NOT EXISTS excel_data (
                    id SERIAL PRIMARY KEY,
                    filename VARCHAR(255) NOT NULL,
                    data JSONB,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `;
            
            await this.client.query(query);
            console.log('✅ Tabela excel_data criada com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao criar tabela:', error);
            return false;
        }
    }

    async testConnection() {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const result = await this.client.query('SELECT NOW() as current_time');
            return {
                success: true,
                message: 'Conexão PostgreSQL funcionando',
                timestamp: result.rows[0].current_time
            };
        } catch (error) {
            return {
                success: false,
                message: 'Falha na conexão PostgreSQL',
                error: error.message
            };
        }
    }
}

module.exports = new ExcelService();