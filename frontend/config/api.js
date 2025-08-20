/**
 * Configuração da API para SACSMAX Frontend
 * Conecta ao backend Python no Railway
 */

// Configuração da API baseada no ambiente
const API_CONFIG = {
    // URL base da API
    baseURL: process.env.API_URL || window.location.origin + '/api',
    
    // Timeout das requisições (em ms)
    timeout: 30000,
    
    // Headers padrão
    defaultHeaders: {
        'Content-Type': 'application/json',
    },
    
    // Configurações de retry
    retry: {
        maxAttempts: 3,
        delay: 1000,
    },
    
    // Endpoints principais
    endpoints: {
        // Autenticação
        auth: {
            register: '/auth/register',
            login: '/auth/login',
            me: '/auth/me',
            logout: '/auth/logout',
        },
        
        // Excel
        excel: {
            upload: '/excel/upload',
            files: '/excel/files',
            contacts: '/excel/files/{id}/contacts',
        },
        
        // WhatsApp
        whatsapp: {
            start: '/whatsapp/start',
            stop: '/whatsapp/stop',
            status: '/whatsapp/status',
            qr: '/whatsapp/qr',
            send: '/whatsapp/send',
            sendBulk: '/whatsapp/send-messages',
            sessions: '/whatsapp/sessions',
        },
        
        // Contatos
        contacts: {
            list: '/contacts',
            get: '/contacts/{id}',
            update: '/contacts/{id}',
            delete: '/contacts/{id}',
            summary: '/contacts/stats/summary',
            bulkUpdate: '/contacts/bulk-update-status',
        },
        
        // Templates
        templates: {
            list: '/feedback/templates',
            get: '/feedback/templates/{id}',
            create: '/feedback/templates',
            update: '/feedback/templates/{id}',
            delete: '/feedback/templates/{id}',
            toggle: '/feedback/templates/{id}/toggle',
            preview: '/feedback/templates/{id}/preview',
        },
        
        // Sistema
        system: {
            health: '/health',
        },
    },
};

// Função para obter URL completa do endpoint
function getApiUrl(endpoint, params = {}) {
    let url = API_CONFIG.baseURL + endpoint;
    
    // Substituir parâmetros na URL
    Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key]);
    });
    
    return url;
}

// Função para fazer requisição com retry
async function apiRequest(url, options = {}, retryCount = 0) {
    const config = {
        headers: { ...API_CONFIG.defaultHeaders, ...options.headers },
        timeout: API_CONFIG.timeout,
        ...options,
    };
    
    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
        
    } catch (error) {
        // Retry logic
        if (retryCount < API_CONFIG.retry.maxAttempts) {
            console.warn(`Tentativa ${retryCount + 1} falhou, tentando novamente...`);
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.retry.delay));
            return apiRequest(url, options, retryCount + 1);
        }
        
        throw error;
    }
}

// Classe principal da API
class SACSMAXApi {
    constructor() {
        this.config = API_CONFIG;
    }
    
    // Métodos de autenticação
    async register(userData) {
        const url = getApiUrl(this.config.endpoints.auth.register);
        return apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }
    
    async login(credentials) {
        const url = getApiUrl(this.config.endpoints.auth.login);
        return apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }
    
    async getCurrentUser(token) {
        const url = getApiUrl(this.config.endpoints.auth.me);
        return apiRequest(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    }
    
    // Métodos de Excel
    async uploadExcel(file) {
        const url = getApiUrl(this.config.endpoints.excel.upload);
        const formData = new FormData();
        formData.append('file', file);
        
        return apiRequest(url, {
            method: 'POST',
            body: formData,
            headers: {}, // Remove Content-Type para FormData
        });
    }
    
    async getUploadedFiles() {
        const url = getApiUrl(this.config.endpoints.excel.files);
        return apiRequest(url);
    }
    
    async getContactsFromFile(fileId) {
        const url = getApiUrl(this.config.endpoints.excel.contacts, { id: fileId });
        return apiRequest(url);
    }
    
    // Métodos de WhatsApp
    async startWhatsApp(sessionName = 'default') {
        const url = getApiUrl(this.config.endpoints.whatsapp.start);
        return apiRequest(url, {
            method: 'POST',
            body: JSON.stringify({ session_name: sessionName }),
        });
    }
    
    async stopWhatsApp() {
        const url = getApiUrl(this.config.endpoints.whatsapp.stop);
        return apiRequest(url, { method: 'POST' });
    }
    
    async getWhatsAppStatus() {
        const url = getApiUrl(this.config.endpoints.whatsapp.status);
        return apiRequest(url);
    }
    
    async getQRCode() {
        const url = getApiUrl(this.config.endpoints.whatsapp.qr);
        return apiRequest(url);
    }
    
    async sendMessage(messageData) {
        const url = getApiUrl(this.config.endpoints.whatsapp.send);
        return apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(messageData),
        });
    }
    
    async sendBulkMessages(bulkData) {
        const url = getApiUrl(this.config.endpoints.whatsapp.sendBulk);
        return apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(bulkData),
        });
    }
    
    // Métodos de contatos
    async getContacts(params = {}) {
        const url = getApiUrl(this.config.endpoints.contacts.list);
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        return apiRequest(fullUrl);
    }
    
    async updateContact(contactId, updateData) {
        const url = getApiUrl(this.config.endpoints.contacts.update, { id: contactId });
        return apiRequest(url, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }
    
    async getContactsSummary() {
        const url = getApiUrl(this.config.endpoints.contacts.summary);
        return apiRequest(url);
    }
    
    // Métodos de templates
    async getTemplates(activeOnly = true) {
        const url = getApiUrl(this.config.endpoints.templates.list);
        const queryString = new URLSearchParams({ active_only: activeOnly }).toString();
        const fullUrl = `${url}?${queryString}`;
        return apiRequest(fullUrl);
    }
    
    async createTemplate(templateData) {
        const url = getApiUrl(this.config.endpoints.templates.create);
        return apiRequest(url, {
            method: 'POST',
            body: JSON.stringify(templateData),
        });
    }
    
    async updateTemplate(templateId, updateData) {
        const url = getApiUrl(this.config.endpoints.templates.update, { id: templateId });
        return apiRequest(url, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }
    
    // Métodos do sistema
    async getHealth() {
        const url = getApiUrl(this.config.endpoints.system.health);
        return apiRequest(url);
    }
    
    // Método para testar conexão
    async testConnection() {
        try {
            const health = await this.getHealth();
            return {
                success: true,
                status: health.status,
                version: health.version,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

// Exportar instância global da API
window.SACSMAXApi = new SACSMAXApi();

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SACSMAXApi;
}

