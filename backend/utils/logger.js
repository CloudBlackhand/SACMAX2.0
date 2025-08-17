const winston = require('winston');
const path = require('path');

// Criar diretório de logs se não existir
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'sacsmax-automation' },
    transports: [
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log') 
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Em produção, usar apenas os transportes básicos do winston
// DailyRotateFile removido para evitar dependência adicional
if (process.env.NODE_ENV === 'production') {
    logger.info('Logger configurado para produção com transportes básicos');
}

module.exports = logger;