const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class PythonDatabaseService {
    constructor() {
        this.pythonPath = process.env.PYTHON_PATH || 'python3';
        this.databaseServicePath = path.join(__dirname, '../../python_modules/database_service.py');
    }

    /**
     * Executar comando Python e retornar resultado
     */
    async executePythonCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonPath, [this.databaseServicePath, command, ...args]);
            
            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    logger.error('Comando Python retornou erro', {
                        command,
                        code,
                        stderr,
                        stdout
                    });
                    reject(new Error(`Python command failed: ${stderr || stdout}`));
                    return;
                }

                try {
                    // Tentar parsear JSON
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (parseError) {
                    // Se não for JSON, retornar string
                    resolve(stdout.trim());
                }
            });

            pythonProcess.on('error', (error) => {
                logger.error('Erro ao executar Python', error);
                reject(error);
            });

            // Timeout de 60 segundos
            setTimeout(() => {
                pythonProcess.kill('SIGTERM');
                reject(new Error('Python command timeout'));
            }, 60000);
        });
    }

    /**
     * Salvar dados de planilha no banco via Python
     */
    async saveSpreadsheetData(spreadsheetData, fileName, mode = 'contacts') {
        try {
            // Salvar dados em arquivo temporário
            const tempFile = path.join(__dirname, '../../temp_data.json');
            fs.writeFileSync(tempFile, JSON.stringify(spreadsheetData));

            // Executar comando Python
            const result = await this.executePythonCommand('save_data', [tempFile, mode]);

            // Limpar arquivo temporário
            fs.unlinkSync(tempFile);

            logger.info('Dados salvos via Python', { fileName, mode, result });
            return result;

        } catch (error) {
            logger.error('Erro ao salvar dados via Python', error);
            throw error;
        }
    }

    /**
     * Obter todos os clientes do banco via Python
     */
    async getAllClients() {
        try {
            const result = await this.executePythonCommand('get_clients');
            
            // Se result for string, tentar parsear
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            
            return result;
        } catch (error) {
            logger.error('Erro ao obter clientes via Python', error);
            return [];
        }
    }

    /**
     * Obter dados de um cliente específico
     */
    async getClientData(clientId) {
        try {
            const result = await this.executePythonCommand('get_client_data', [clientId.toString()]);
            
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            
            return result;
        } catch (error) {
            logger.error('Erro ao obter dados do cliente via Python', error);
            return [];
        }
    }

    /**
     * Obter histórico de uploads
     */
    async getUploadHistory() {
        try {
            const result = await this.executePythonCommand('get_upload_history');
            
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            
            return result;
        } catch (error) {
            logger.error('Erro ao obter histórico via Python', error);
            return [];
        }
    }

    /**
     * Deletar cliente
     */
    async deleteClient(clientId) {
        try {
            const result = await this.executePythonCommand('delete_client', [clientId.toString()]);
            
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            
            return result;
        } catch (error) {
            logger.error('Erro ao deletar cliente via Python', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Classificar feedback usando Python
     */
    async classifyFeedback(text) {
        try {
            // Escapar texto para linha de comando
            const escapedText = text.replace(/"/g, '\\"');
            const result = await this.executePythonCommand('classify_feedback', [escapedText]);
            
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            
            return result;
        } catch (error) {
            logger.error('Erro ao classificar feedback via Python', error);
            return {
                sentiment: 'neutral',
                confidence: 0.0,
                score: 0.0
            };
        }
    }

    /**
     * Salvar feedback no banco
     */
    async saveFeedback(clientId, messageText, sentiment, confidence, score) {
        try {
            const args = [
                clientId.toString(),
                messageText.replace(/"/g, '\\"'),
                sentiment,
                confidence.toString(),
                score.toString()
            ];
            
            const result = await this.executePythonCommand('save_feedback', args);
            
            if (typeof result === 'string') {
                return JSON.parse(result);
            }
            
            return result;
        } catch (error) {
            logger.error('Erro ao salvar feedback via Python', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Configurar banco de dados
     */
    async setupDatabase() {
        try {
            await this.executePythonCommand('setup');
            logger.info('Banco de dados configurado via Python');
            return { success: true };
        } catch (error) {
            logger.error('Erro ao configurar banco via Python', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar se o serviço Python está disponível
     */
    async isAvailable() {
        try {
            await this.executePythonCommand('setup');
            return true;
        } catch (error) {
            logger.warn('Serviço Python não disponível', error);
            return false;
        }
    }
}

module.exports = PythonDatabaseService;
