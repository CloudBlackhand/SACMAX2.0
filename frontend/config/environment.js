/**
 * SACSMAX - Configuração de Ambiente
 * Gerenciamento de variáveis de ambiente para frontend
 */

class EnvironmentConfig {
    constructor() {
        this.config = this.loadConfig();
    }

    loadConfig() {
        const env = process.env.NODE_ENV || 'development';
        
        const configs = {
            development: {
                API_URL: 'http://localhost:3000',
                SOCKET_URL: 'http://localhost:3000',
                DEBUG: true,
                MOCK_API: true,
                RETRY_ATTEMPTS: 3,
                RETRY_DELAY: 1000,
                TIMEOUT: 30000,
                MAX_CONCURRENT_REQUESTS: 5
            },
            production: {
                API_URL: process.env.REACT_APP_API_URL || 'https://api.sacsmax.com',
                SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'https://api.sacsmax.com',
                DEBUG: false,
                MOCK_API: false,
                RETRY_ATTEMPTS: 5,
                RETRY_DELAY: 2000,
                TIMEOUT: 60000,
                MAX_CONCURRENT_REQUESTS: 10
            },
            railway: {
                API_URL: process.env.REACT_APP_API_URL || process.env.RAILWAY_STATIC_URL || 'https://sacsmax.up.railway.app',
                SOCKET_URL: process.env.REACT_APP_SOCKET_URL || process.env.RAILWAY_STATIC_URL || 'https://sacsmax.up.railway.app',
                DEBUG: false,
                MOCK_API: false,
                RETRY_ATTEMPTS: 5,
                RETRY_DELAY: 2000,
                TIMEOUT: 60000,
                MAX_CONCURRENT_REQUESTS: 10
            }
        };

        return configs[env] || configs.development;
    }

    get(key) {
        return this.config[key];
    }

    getAll() {
        return { ...this.config };
    }

    isDevelopment() {
        return process.env.NODE_ENV === 'development';
    }

    isProduction() {
        return process.env.NODE_ENV === 'production';
    }

    isRailway() {
        return process.env.NODE_ENV === 'railway';
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// Criar instância global
const envConfig = new EnvironmentConfig();

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnvironmentConfig, envConfig };
} else {
    window.EnvironmentConfig = EnvironmentConfig;
    window.envConfig = envConfig;
}

// Variáveis de ambiente para Railway
const railwayEnvVars = [
    'PORT',
    'NODE_ENV',
    'RAILWAY_STATIC_URL',
    'RAILWAY_SERVICE_ID',
    'RAILWAY_PROJECT_ID',
    'RAILWAY_ENVIRONMENT_ID',
    'DATABASE_URL',
    'REDIS_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'WHATSAPP_SESSION_NAME',
    'WHATSAPP_WEBHOOK_URL',
    'JWT_SECRET',
    'CORS_ORIGIN'
];

// Verificar variáveis obrigatórias
function validateEnvironmentVars() {
    const missing = [];
    
    const requiredVars = envConfig.isProduction() ? [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'WHATSAPP_SESSION_NAME',
        'JWT_SECRET'
    ] : [];

    requiredVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    if (missing.length > 0) {
        console.warn('Variáveis de ambiente ausentes:', missing);
    }

    return missing.length === 0;
}

// Exportar função de validação
if (typeof module !== 'undefined' && module.exports) {
    module.exports.validateEnvironmentVars = validateEnvironmentVars;
} else {
    window.validateEnvironmentVars = validateEnvironmentVars;
}

// Executar validação ao carregar
validateEnvironmentVars();