// Configuração centralizada do SacsMax Frontend
const SacsMaxConfig = {
    // URLs do backend
    backend: {
        // Em desenvolvimento local
        local: "http://localhost:5000",
        // Em produção (Railway)
        production: "https://sacmax20-production.up.railway.app",
        // URL atual baseada no ambiente
        current: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? "http://localhost:5000" 
            : "https://sacmax20-production.up.railway.app"
    },
    
    // Configurações WAHA
    waha: {
        // URL do WAHA no Railway
        url: "https://waha-production-1c76.up.railway.app",
        session_name: "sacsmax",
        timeout: 10000,
        // API v1 do WAHA
        api_version: "v1"
    },
    
    // Configurações de sistema
    system: {
        version: "2.1.0",
        debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    }
};

// Função utilitária para fazer requisições ao backend
async function apiRequest(endpoint, options = {}) {
    const url = `${SacsMaxConfig.backend.current}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 10000
    };
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erro na requisição para ${endpoint}:`, error);
        throw error;
    }
}

// Função para verificar saúde do backend
async function checkBackendHealth() {
    try {
        const health = await apiRequest('/api/health');
        return health.status === 'healthy';
    } catch (error) {
        console.error('Backend não está respondendo:', error);
        return false;
    }
}

// Função para verificar conectividade geral
async function checkSystemConnectivity() {
    const results = {
        backend: false,
        database: false,
        waha: false
    };
    
    try {
        // Verificar backend
        const backendHealth = await apiRequest('/api/health');
        results.backend = backendHealth.status === 'healthy';
        
        // Verificar banco de dados
        try {
            const dbHealth = await apiRequest('/api/database/test');
            results.database = dbHealth.status === 'connected';
        } catch (e) {
            console.warn('Banco de dados não disponível:', e);
        }
        
        // Verificar WAHA
        try {
            const wahaHealth = await apiRequest('/api/waha/status');
            results.waha = wahaHealth.status === 'connected';
        } catch (e) {
            console.warn('WAHA não disponível:', e);
        }
        
    } catch (error) {
        console.error('Erro ao verificar conectividade:', error);
    }
    
    return results;
}

// Exportar para uso global
window.SacsMaxConfig = SacsMaxConfig;
window.apiRequest = apiRequest;
window.checkBackendHealth = checkBackendHealth;
window.checkSystemConnectivity = checkSystemConnectivity;
