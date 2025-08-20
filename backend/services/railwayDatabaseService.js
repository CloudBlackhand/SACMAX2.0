const { Client } = require('pg');
const logger = require('../utils/logger');

class RailwayDatabaseService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.TABLE_CLIENTS = 'clients';
        this.TABLE_SPREADSHEET_DATA = 'spreadsheet_data';
        this.TABLE_UPLOAD_HISTORY = 'upload_history';
    }

    async connect() {
        try {
            const connectionString = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;
            
            if (!connectionString) {
                throw new Error('DATABASE_URL não configurada');
            }

            this.client = new Client({ connectionString });
            await this.client.connect();
            this.isConnected = true;
            
            logger.info('Conectado ao Railway PostgreSQL');
            
            // Criar tabelas se não existirem
            await this.createTables();
            
            return true;
        } catch (error) {
            logger.error('Erro ao conectar ao banco:', error);
            this.isConnected = false;
            return false;
        }
    }

    async createTables() {
        try {
            // Tabela de clientes
            await this.client.query(`
                CREATE TABLE IF NOT EXISTS ${this.TABLE_CLIENTS} (
                    id SERIAL PRIMARY KEY,
                    client_id VARCHAR(255) UNIQUE NOT NULL,
                    client_name VARCHAR(500) NOT NULL,
                    phone VARCHAR(20),
                    sheet_name VARCHAR(255),
                    last_upload_id VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tabela de histórico de uploads
            await this.client.query(`
                CREATE TABLE IF NOT EXISTS ${this.TABLE_UPLOAD_HISTORY} (
                    id SERIAL PRIMARY KEY,
                    upload_id VARCHAR(255) UNIQUE NOT NULL,
                    file_name VARCHAR(500) NOT NULL,
                    mode VARCHAR(50) NOT NULL,
                    total_records INTEGER DEFAULT 0,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'completed'
                )
            `);

            // Tabela de dados de planilha
            await this.client.query(`
                CREATE TABLE IF NOT EXISTS ${this.TABLE_SPREADSHEET_DATA} (
                    id SERIAL PRIMARY KEY,
                    upload_id VARCHAR(255) NOT NULL,
                    client_id INTEGER REFERENCES ${this.TABLE_CLIENTS}(id),
                    date DATE,
                    sheet_name VARCHAR(255),
                    data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            logger.info('Tabelas criadas/verificadas com sucesso');
        } catch (error) {
            logger.error('Erro ao criar tabelas:', error);
            throw error;
        }
    }

    async upsertClient(clientData, upload_id) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            // Verificar se o cliente já existe
            const existingResult = await this.client.query(
                `SELECT id FROM ${this.TABLE_CLIENTS} WHERE client_id = $1`,
                [clientData.client_id]
            );

            const clientRecord = {
                client_id: clientData.client_id,
                client_name: clientData.client_name,
                phone: clientData.phone || null,
                sheet_name: clientData.sheet_name,
                last_upload_id: upload_id,
                updated_at: new Date()
            };

            if (existingResult.rows.length > 0) {
                // Atualizar cliente existente
                const result = await this.client.query(
                    `UPDATE ${this.TABLE_CLIENTS} 
                     SET client_name = $1, phone = $2, sheet_name = $3, last_upload_id = $4, updated_at = $5
                     WHERE id = $6 RETURNING *`,
                    [
                        clientRecord.client_name,
                        clientRecord.phone,
                        clientRecord.sheet_name,
                        clientRecord.last_upload_id,
                        clientRecord.updated_at,
                        existingResult.rows[0].id
                    ]
                );

                return { 
                    id: existingResult.rows[0].id, 
                    action: 'updated', 
                    data: result.rows[0] 
                };
            } else {
                // Criar novo cliente
                const result = await this.client.query(
                    `INSERT INTO ${this.TABLE_CLIENTS} 
                     (client_id, client_name, phone, sheet_name, last_upload_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                    [
                        clientRecord.client_id,
                        clientRecord.client_name,
                        clientRecord.phone,
                        clientRecord.sheet_name,
                        clientRecord.last_upload_id,
                        new Date(),
                        clientRecord.updated_at
                    ]
                );

                return { 
                    id: result.rows[0].id, 
                    action: 'created', 
                    data: result.rows[0] 
                };
            }
        } catch (error) {
            logger.error('Erro ao salvar cliente:', error);
            throw error;
        }
    }

    async createUploadRecord(fileName, mode, spreadsheetData) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const totalRecords = mode === 'contacts' 
                ? (spreadsheetData.contacts?.length || 0)
                : Object.keys(spreadsheetData.client_data_by_date || {}).length;

            const result = await this.client.query(
                `INSERT INTO ${this.TABLE_UPLOAD_HISTORY} 
                 (upload_id, file_name, mode, total_records, status)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [uploadId, fileName, mode, totalRecords, 'completed']
            );

            return result.rows[0];
        } catch (error) {
            logger.error('Erro ao criar registro de upload:', error);
            throw error;
        }
    }

    async saveSpreadsheetData(spreadsheetData, fileName, mode = 'client_data') {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            // Criar registro de upload
            const uploadRecord = await this.createUploadRecord(fileName, mode, spreadsheetData);
            
            let savedRecords = 0;

            if (mode === 'client_data') {
                // Processar dados organizados por cliente e data
                const { client_data_by_date } = spreadsheetData;
                
                for (const [date, clients] of Object.entries(client_data_by_date || {})) {
                    for (const [clientId, clientInfo] of Object.entries(clients)) {
                        // Salvar/atualizar cliente
                        const clientResult = await this.upsertClient({
                            client_id: clientId,
                            client_name: clientInfo.client_name,
                            phone: this.extractPhoneFromData(clientInfo.data),
                            sheet_name: clientInfo.sheet
                        }, uploadRecord.upload_id);

                        // Salvar dados da planilha
                        await this.client.query(
                            `INSERT INTO ${this.TABLE_SPREADSHEET_DATA} 
                             (upload_id, client_id, date, sheet_name, data)
                             VALUES ($1, $2, $3, $4, $5)`,
                            [
                                uploadRecord.upload_id,
                                clientResult.id,
                                date,
                                clientInfo.sheet,
                                JSON.stringify(clientInfo.data)
                            ]
                        );

                        savedRecords++;
                    }
                }
            } else if (mode === 'contacts') {
                // Processar contatos simples
                for (const contact of spreadsheetData.contacts || []) {
                    const clientResult = await this.upsertClient({
                        client_id: contact.id || contact.phone,
                        client_name: contact.name,
                        phone: contact.phone,
                        sheet_name: contact.sheet || 'default'
                    }, uploadRecord.upload_id);

                    savedRecords++;
                }
            }

            logger.info(`Dados salvos no banco: ${savedRecords} registros`);
            return { total_records: savedRecords, upload_id: uploadRecord.upload_id };

        } catch (error) {
            logger.error('Erro ao salvar dados da planilha:', error);
            throw error;
        }
    }

    async getAllClients() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const result = await this.client.query(
                `SELECT * FROM ${this.TABLE_CLIENTS} ORDER BY created_at DESC`
            );

            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar clientes:', error);
            return [];
        }
    }

    async getClientData(clientId) {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const result = await this.client.query(
                `SELECT * FROM ${this.TABLE_SPREADSHEET_DATA} 
                 WHERE client_id = $1 ORDER BY date DESC`,
                [clientId]
            );

            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar dados do cliente:', error);
            return [];
        }
    }

    async getUploadHistory() {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            const result = await this.client.query(
                `SELECT * FROM ${this.TABLE_UPLOAD_HISTORY} ORDER BY processed_at DESC`
            );

            return result.rows;
        } catch (error) {
            logger.error('Erro ao buscar histórico de uploads:', error);
            return [];
        }
    }

    extractPhoneFromData(data) {
        if (!data) return null;
        
        // Procurar por campos que podem conter telefone
        const phoneFields = ['phone', 'telefone', 'celular', 'mobile', 'contact'];
        
        for (const field of phoneFields) {
            if (data[field]) {
                return data[field].toString();
            }
        }
        
        return null;
    }

    async disconnect() {
        if (this.client) {
            await this.client.end();
            this.isConnected = false;
            logger.info('Desconectado do Railway PostgreSQL');
        }
    }
}

module.exports = RailwayDatabaseService;
