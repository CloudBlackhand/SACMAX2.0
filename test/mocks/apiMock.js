/**
 * SACSMAX - Mocks Unificados para Testes
 * Mock de APIs para desenvolvimento e testes
 */

class ApiMock {
    constructor() {
        this.mockData = this.generateMockData();
        this.delay = 500; // Delay simulado de rede
    }

    generateMockData() {
        return {
            contacts: [
                { id: 1, nome: 'João Silva', telefone: '5511999999999', email: 'joao@teste.com' },
                { id: 2, nome: 'Maria Santos', telefone: '5511888888888', email: 'maria@teste.com' },
                { id: 3, nome: 'Pedro Oliveira', telefone: '5511777777777', email: 'pedro@teste.com' },
                { id: 4, nome: 'Ana Costa', telefone: '5511666666666', email: 'ana@teste.com' },
                { id: 5, nome: 'Lucas Ferreira', telefone: '5511555555555', email: 'lucas@teste.com' }
            ],
            templates: [
                {
                    id: 'welcome',
                    name: 'Boas-vindas',
                    message: 'Olá! Seja bem-vindo à nossa empresa. Como podemos ajudar você hoje?',
                    type: 'text'
                },
                {
                    id: 'followup',
                    name: 'Acompanhamento',
                    message: 'Olá! Passando para verificar como está sua experiência conosco.',
                    type: 'text'
                },
                {
                    id: 'promotion',
                    name: 'Promoção',
                    message: 'Temos uma promoção especial para você! Aproveite agora!',
                    type: 'text'
                }
            ],
            feedback: [
                {
                    id: 1,
                    contactName: 'João Silva',
                    phone: '5511999999999',
                    message: 'Gostei muito do serviço!',
                    status: 'sent',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: 2,
                    contactName: 'Maria Santos',
                    phone: '5511888888888',
                    message: 'Obrigada pelo atendimento!',
                    status: 'sent',
                    timestamp: new Date(Date.now() - 7200000).toISOString()
                }
            ],
            stats: {
                totalMessages: 156,
                responseRate: 78,
                activeTemplates: 3,
                activeCampaigns: 2
            },
            whatsappStatus: {
                initialized: true,
                connected: true,
                ready: true,
                qrCode: null
            }
        };
    }

    // Simular delay de rede
    async delay(ms = this.delay) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Mock de upload Excel
    async uploadExcel(file) {
        await this.delay();
        
        if (Math.random() > 0.1) { // 90% de sucesso
            return {
                success: true,
                contacts: this.mockData.contacts,
                message: `Arquivo processado com sucesso! ${this.mockData.contacts.length} contatos encontrados.`
            };
        } else {
            return {
                success: false,
                message: 'Erro ao processar arquivo. Verifique o formato.'
            };
        }
    }

    // Mock de templates
    async getFeedbackTemplates() {
        await this.delay();
        return this.mockData.templates;
    }

    async saveFeedbackTemplate(template) {
        await this.delay();
        
        const newTemplate = {
            ...template,
            id: `template_${Date.now()}`
        };
        
        this.mockData.templates.push(newTemplate);
        
        return {
            success: true,
            template: newTemplate
        };
    }

    // Mock de contatos
    async getContacts() {
        await this.delay();
        return this.mockData.contacts;
    }

    // Mock de estatísticas
    async getFeedbackStats() {
        await this.delay();
        return this.mockData.stats;
    }

    // Mock de feedback recente
    async getRecentFeedback(limit = 5) {
        await this.delay();
        return this.mockData.feedback.slice(0, limit);
    }

    // Mock de envio de mensagem
    async sendWhatsAppMessage(message) {
        await this.delay(1000); // Delay maior para envio
        
        if (Math.random() > 0.05) { // 95% de sucesso
            return {
                success: true,
                messageId: `msg_${Date.now()}`
            };
        } else {
            return {
                success: false,
                message: 'Erro ao enviar mensagem. Tente novamente.'
            };
        }
    }

    // Mock de envio em massa
    async sendWhatsAppMessages(messages) {
        await this.delay(2000); // Delay maior para envio em massa
        
        const successCount = Math.floor(messages.length * 0.9); // 90% de sucesso
        
        return {
            success: true,
            sent: successCount,
            failed: messages.length - successCount,
            total: messages.length
        };
    }

    // Mock de upload de mídia
    async uploadWhatsAppMedia(file) {
        await this.delay(1500); // Delay para upload
        
        return {
            success: true,
            url: `https://mock-cdn.com/media_${Date.now()}.${file.name.split('.').pop()}`
        };
    }

    // Mock de status do WhatsApp
    async getWhatsAppStatus() {
        await this.delay();
        return this.mockData.whatsappStatus;
    }

    // Mock de start/stop bot
    async startWhatsApp() {
        await this.delay(1000);
        this.mockData.whatsappStatus = {
            initialized: true,
            connected: true,
            ready: true,
            qrCode: null
        };
        return { success: true };
    }

    async stopWhatsApp() {
        await this.delay(1000);
        this.mockData.whatsappStatus = {
            initialized: false,
            connected: false,
            ready: false,
            qrCode: null
        };
        return { success: true };
    }

    // Mock de configurações
    async getConfig() {
        await this.delay();
        return {
            delayBetweenMessages: 2000,
            maxRetries: 3,
            autoResponse: true
        };
    }

    async saveConfig(config) {
        await this.delay();
        return { success: true, config };
    }

    // Mock de campanhas
    async getFeedbackCampaigns() {
        await this.delay();
        return [
            { id: 1, name: 'Campanha de Boas-vindas', active: true },
            { id: 2, name: 'Campanha de Follow-up', active: true }
        ];
    }

    // Mock de importação
    async importFeedback(data) {
        await this.delay();
        return { success: true, imported: data.length };
    }

    // Mock de envio de sticker
    async sendWhatsAppSticker(data) {
        await this.delay();
        return { success: true };
    }

    // Mock de envio de arquivo
    async sendWhatsAppFile(data) {
        await this.delay();
        return { success: true };
    }

    // Mock de mass send
    async startMassSend(data) {
        await this.delay();
        return {
            success: true,
            campaignId: `campaign_${Date.now()}`,
            estimatedTime: data.contacts.length * 2
        };
    }

    // Mock de status de rede
    async getNetworkStatus() {
        await this.delay();
        return {
            online: true,
            latency: Math.floor(Math.random() * 100) + 50
        };
    }

    // Resetar mocks
    reset() {
        this.mockData = this.generateMockData();
    }

    // Adicionar dados customizados
    addCustomData(type, data) {
        if (this.mockData[type]) {
            this.mockData[type].push(data);
        }
    }
}

// Criar instância global
const apiMock = new ApiMock();

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiMock, apiMock };
} else {
    // Mock global para desenvolvimento
    window.ApiMock = ApiMock;
    window.apiMock = apiMock;
}

// Para desenvolvimento local, substituir API real
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Usando mocks de API para desenvolvimento');
    
    // Substituir métodos do apiService por mocks
    if (window.apiService) {
        const methodsToMock = [
            'uploadExcel', 'getFeedbackTemplates', 'saveFeedbackTemplate',
            'getContacts', 'getFeedbackStats', 'getRecentFeedback',
            'sendWhatsAppMessage', 'sendWhatsAppMessages', 'uploadWhatsAppMedia',
            'getWhatsAppStatus', 'startWhatsApp', 'stopWhatsApp',
            'getConfig', 'saveConfig', 'getFeedbackCampaigns', 'importFeedback',
            'sendWhatsAppSticker', 'sendWhatsAppFile', 'startMassSend',
            'getNetworkStatus'
        ];

        methodsToMock.forEach(method => {
            if (window.apiService[method]) {
                window.apiService[method] = (...args) => apiMock[method](...args);
            }
        });
    }
}