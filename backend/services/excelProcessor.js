const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class ExcelProcessor {
    constructor() {
        this.pythonPath = process.env.PYTHON_PATH || 'python3';
        this.processorPath = path.join(__dirname, '../../python_modules/excel_processor.py');
    }

    async processFile(filePath) {
        try {
            // Verificar se o arquivo existe
            if (!fs.existsSync(filePath)) {
                throw new Error(`Arquivo não encontrado: ${filePath}`);
            }

            // Verificar se o script Python existe
            if (!fs.existsSync(this.processorPath)) {
                throw new Error(`Script Python não encontrado: ${this.processorPath}`);
            }

            logger.info('Iniciando processamento de Excel', { filePath });

            // Executar script Python
            const result = await this.executePythonScript(filePath);
            
            if (result.error) {
                throw new Error(result.error);
            }

            logger.info('Excel processado com sucesso', {
                filePath,
                totalContacts: result.contacts?.length || 0,
                sheets: result.sheets?.length || 0
            });

            return result;

        } catch (error) {
            logger.error('Erro ao processar Excel', error);
            throw error;
        }
    }

    async executePythonScript(filePath) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonPath, [this.processorPath, filePath]);
            
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
                    logger.error('Script Python retornou erro', {
                        code,
                        stderr,
                        stdout
                    });
                    reject(new Error(`Python script failed: ${stderr || stdout}`));
                    return;
                }

                try {
                    // Parse do JSON retornado
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (parseError) {
                    logger.error('Erro ao parsear JSON do Python', {
                        error: parseError.message,
                        stdout
                    });
                    reject(new Error(`Failed to parse Python output: ${parseError.message}`));
                }
            });

            pythonProcess.on('error', (error) => {
                logger.error('Erro ao executar Python', error);
                reject(error);
            });

            // Timeout de 30 segundos
            setTimeout(() => {
                pythonProcess.kill('SIGTERM');
                reject(new Error('Python script timeout'));
            }, 30000);
        });
    }

    async validateExcelFile(filePath) {
        try {
            const stats = fs.statSync(filePath);
            
            if (stats.size > parseInt(process.env.MAX_FILE_SIZE || '10485760')) {
                throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
            }

            const ext = path.extname(filePath).toLowerCase();
            if (!['.xlsx', '.xls'].includes(ext)) {
                throw new Error('Formato de arquivo inválido. Use .xlsx ou .xls');
            }

            return true;

        } catch (error) {
            logger.error('Erro na validação do arquivo', error);
            throw error;
        }
    }

    async getFileInfo(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            return {
                name: path.basename(filePath),
                size: stats.size,
                extension: ext,
                lastModified: stats.mtime,
                path: filePath
            };

        } catch (error) {
            logger.error('Erro ao obter informações do arquivo', error);
            throw error;
        }
    }

    async deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.info('Arquivo deletado', { filePath });
            }
        } catch (error) {
            logger.error('Erro ao deletar arquivo', error);
            throw error;
        }
    }
}

module.exports = ExcelProcessor;