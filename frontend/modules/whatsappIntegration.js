/**
 * SACSMAX - Módulo de Integração WhatsApp
 * Integração entre a interface web e o WhatsApp Component
 */

import { apiService } from '../services/apiService.js';
import { Formatters } from '../utils/formatters.js';

class WhatsAppIntegration {
    constructor() {
        this.whatsAppComponent = null;
        this.contacts = [];
        this.isInitialized = false;
    }

    init() {
        this.createWhatsAppSection();
        this.bindEvents();
        this.loadContacts();
    }

    createWhatsAppSection() {
        const whatsappSection = document.createElement('div');
        whatsappSection.className = 'section';
        whatsappSection.id = 'whatsapp-section';
        
        whatsappSection.innerHTML = `
            <h2>WhatsApp Web</h2>
            <div id="whatsapp-container" class="whatsapp-container">
                <!-- WhatsApp Component será carregado aqui -->
            </div>
        `;

        document.querySelector('.content').appendChild(whatsappSection);
    }

    bindEvents() {
        // Escutar eventos globais
        window.addEventListener('botStatusChanged', this.handleBotStatusChange.bind(this));
        window.addEventListener('contactsUploaded', this.handleContactsUploaded.bind(this));
        
        // Escutar eventos do WhatsApp Component
        window.addEventListener('whatsappMessageSent', this.handleMessageSent.bind(this));
        window.addEventListener('whatsappMessageReceived', this.handleMessageReceived.bind(this));
    }

    async loadContacts() {
        try {
            this.contacts = await apiService.getContacts();
            this.updateContactsInWhatsApp();
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
        }
    }

    handleBotStatusChange(event) {
        const { status } = event.detail;
        
        if (status.ready && !this.isInitialized) {
            this.initializeWhatsAppComponent();
        }
    }

    handleContactsUploaded(event) {
        const { contacts } = event.detail;
        this.contacts = contacts;
        this.updateContactsInWhatsApp();
    }

    async initializeWhatsAppComponent() {
        if (this.isInitialized) return;

        try {
            const container = document.getElementById('whatsapp-container');
            if (!container) return;

            // Importar e inicializar o WhatsApp Component
            if (typeof WhatsAppComponent !== 'undefined') {
                this.whatsAppComponent = new WhatsAppComponent(container, {
                    onMessageSend: this.handleMessageSend.bind(this),
                    onFileUpload: this.handleFileUpload.bind(this),
                    onStickerSend: this.handleStickerSend.bind(this)
                });

                this.isInitialized = true;
                this.updateContactsInWhatsApp();
            }
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp Component:', error);
        }
    }

    updateContactsInWhatsApp() {
        if (this.whatsAppComponent && this.contacts.length > 0) {
            this.whatsAppComponent.setContacts(this.contacts.map(contact => ({
                id: contact.phone || contact.telefone,
                name: contact.name || contact.nome,
                phone: contact.phone || contact.telefone,
                lastMessage: contact.lastMessage || 'Sem mensagens',
                lastSeen: contact.lastSeen || null,
                unread: contact.unread || 0
            })));
        }
    }

    async handleMessageSend(data) {
        try {
            const result = await apiService.sendWhatsAppMessage({
                phone: data.phone,
                message: data.message
            });

            if (result.success) {
                this.whatsAppComponent.confirmMessageSent(data.id);
                return { success: true };
            } else {
                return { success: false, error: result.message };
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return { success: false, error: 'Erro ao enviar mensagem' };
        }
    }

    async handleFileUpload(data) {
        try {
            const result = await apiService.uploadWhatsAppMedia(data.file);
            
            if (result.success) {
                return { success: true, url: result.url };
            } else {
                return { success: false, error: result.message };
            }
        } catch (error) {
            console.error('Erro ao fazer upload de arquivo:', error);
            return { success: false, error: 'Erro ao fazer upload' };
        }
    }

    async handleStickerSend(data) {
        try {
            const result = await apiService.sendWhatsAppSticker({
                phone: data.phone,
                sticker: data.sticker
            });

            if (result.success) {
                return { success: true };
            } else {
                return { success: false, error: result.message };
            }
        } catch (error) {
            console.error('Erro ao enviar sticker:', error);
            return { success: false, error: 'Erro ao enviar sticker' };
        }
    }

    handleMessageSent(event) {
        // Mensagem enviada com sucesso
        console.log('Mensagem enviada:', event.detail);
    }

    handleMessageReceived(event) {
        // Nova mensagem recebida
        console.log('Mensagem recebida:', event.detail);
    }

    async sendBulkMessages(contacts, message) {
        if (!this.isInitialized) {
            return { success: false, error: 'WhatsApp não está pronto' };
        }

        try {
            const messages = contacts.map(contact => ({
                phone: contact.phone || contact.telefone,
                message: message
            }));

            const result = await apiService.sendWhatsAppMessages(messages);
            return result;
        } catch (error) {
            console.error('Erro ao enviar mensagens em massa:', error);
            return { success: false, error: 'Erro ao enviar mensagens' };
        }
    }

    getWhatsAppStatus() {
        return {
            initialized: this.isInitialized,
            contactsCount: this.contacts.length
        };
    }

    destroy() {
        if (this.whatsAppComponent) {
            this.whatsAppComponent.destroy();
            this.whatsAppComponent = null;
        }
        this.isInitialized = false;
    }
}

// Exportar para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WhatsAppIntegration };
} else {
    // Exportar global para uso em scripts tradicionais
    window.WhatsAppIntegration = WhatsAppIntegration;
}