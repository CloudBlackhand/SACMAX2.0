/**
 * SACSMAX - API Service Centralizado
 * Centraliza todas as chamadas HTTP para o backend
 */

class ApiService {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl || window.location.origin + '/api';
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    // Configuração de requisição padrão
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
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
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Upload de arquivo Excel
    async uploadExcel(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return this.request('/excel/upload', {
            method: 'POST',
            body: formData,
            headers: {} // Remove Content-Type para FormData
        });
    }

    // Templates de feedback
    async getFeedbackTemplates() {
        return this.request('/feedback/templates');
    }

    async saveFeedbackTemplate(template) {
        return this.request('/feedback/templates', {
            method: 'POST',
            body: JSON.stringify(template)
        });
    }

    // WhatsApp
    async startWhatsApp() {
        return this.request('/whatsapp/start', { method: 'POST' });
    }

    async stopWhatsApp() {
        return this.request('/whatsapp/stop', { method: 'POST' });
    }

    async getWhatsAppStatus() {
        return this.request('/whatsapp/status');
    }

    async sendWhatsAppMessage(message) {
        return this.request('/whatsapp/send', {
            method: 'POST',
            body: JSON.stringify(message)
        });
    }

    async sendWhatsAppMessages(messages) {
        return this.request('/whatsapp/send-messages', {
            method: 'POST',
            body: JSON.stringify({ messages })
        });
    }

    async uploadWhatsAppMedia(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        return this.request('/whatsapp/upload', {
            method: 'POST',
            body: formData,
            headers: {}
        });
    }

    async sendWhatsAppSticker(stickerData) {
        return this.request('/whatsapp/send-sticker', {
            method: 'POST',
            body: JSON.stringify(stickerData)
        });
    }

    async sendWhatsAppFile(fileData) {
        return this.request('/whatsapp/send-file', {
            method: 'POST',
            body: JSON.stringify(fileData)
        });
    }

    // Contatos
    async getContacts() {
        return this.request('/contacts');
    }

    // Configurações
    async getConfig() {
        return this.request('/config');
    }

    async saveConfig(config) {
        return this.request('/config/save', {
            method: 'POST',
            body: JSON.stringify(config)
        });
    }

    // Feedback
    async getFeedbackStats() {
        return this.request('/feedback/stats');
    }

    async getRecentFeedback(limit = 5) {
        return this.request(`/feedback?limit=${limit}`);
    }

    async sendFeedbackMessage(message) {
        return this.request('/feedback/chat/send', {
            method: 'POST',
            body: JSON.stringify(message)
        });
    }

    async getFeedbackCampaigns() {
        return this.request('/feedback/campaigns');
    }

    async importFeedback(data) {
        return this.request('/feedback/import', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Envio em massa
    async startMassSend(data) {
        return this.request('/mass-send/start', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Network status
    async getNetworkStatus() {
        return this.request('/network/status');
    }
}

// Exportar instância única
const apiService = new ApiService();

// Exportar para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiService, apiService };
} else {
    // Exportar global para uso em scripts tradicionais
    window.apiService = apiService;
    window.ApiService = ApiService;
}