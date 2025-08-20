/**
 * SACSMAX - Configuração para Desenvolvimento Local
 * Conecta o frontend ao backend Python local
 */

// Configuração para desenvolvimento local
const LOCAL_CONFIG = {
    // Backend Python (FastAPI)
    API_URL: 'http://localhost:8000/api',
    BACKEND_URL: 'http://localhost:8000',
    
    // WhatsApp Web.js (Node.js)
    WHATSAPP_API_URL: 'http://localhost:3000',
    
    // Configurações gerais
    DEBUG: true,
    MOCK_API: false,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    TIMEOUT: 30000,
    
    // CORS e headers
    CORS_ORIGINS: ['http://localhost:8000', 'http://localhost:3000', 'http://127.0.0.1:8000'],
    
    // Endpoints específicos
    ENDPOINTS: {
        // Backend Python
        AUTH: '/auth',
        EXCEL: '/excel',
        CONTACTS: '/contacts',
        FEEDBACK: '/feedback',
        
        // WhatsApp Web.js
        WHATSAPP: '/whatsapp'
    }
};

// Função para obter configuração baseada no ambiente
function getLocalConfig() {
    // Verificar se estamos em desenvolvimento local
    const isLocalDev = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
    
    if (isLocalDev) {
        console.log('🔧 Usando configuração de desenvolvimento local');
        console.log('📡 Backend Python:', LOCAL_CONFIG.API_URL);
        console.log('📱 WhatsApp API:', LOCAL_CONFIG.WHATSAPP_API_URL);
        return LOCAL_CONFIG;
    }
    
    // Fallback para produção
    return {
        API_URL: window.location.origin + '/api',
        BACKEND_URL: window.location.origin,
        WHATSAPP_API_URL: window.location.origin,
        DEBUG: false,
        MOCK_API: false
    };
}

// Configuração global
window.LOCAL_CONFIG = LOCAL_CONFIG;
window.getLocalConfig = getLocalConfig;

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LOCAL_CONFIG, getLocalConfig };
}
