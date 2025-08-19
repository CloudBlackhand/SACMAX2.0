/**
 * SACSMAX - Interface Web Refatorada
 * Versão modular e otimizada do webInterface.js
 */

import { UploadManager } from './modules/upload.js';
import { BotController } from './modules/botControl.js';
import { FeedbackUIManager } from './modules/feedbackUI.js';
import { WhatsAppIntegration } from './modules/whatsappIntegration.js';

class SacsMaxApp {
    constructor() {
        this.currentTab = 'upload';
        this.modules = {};
        this.isInitialized = false;
    }

    async init() {
        try {
            await this.loadStyles();
            this.createAppStructure();
            this.initializeModules();
            this.bindEvents();
            this.showTab('upload');
            this.isInitialized = true;
            console.log('SacsMax App inicializado com sucesso!');
        } catch (error) {
            console.error('Erro ao inicializar SacsMax App:', error);
        }
    }

    async loadStyles() {
        // Carregar CSS principal
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = './styles/main.css';
        document.head.appendChild(link);
    }

    createAppStructure() {
        // Limpar body e criar estrutura base
        document.body.innerHTML = '';

        const appContainer = document.createElement('div');
        appContainer.className = 'app-container';
        appContainer.innerHTML = `
            <header class="header">
                <h1>SacsMax Automation</h1>
                <p>Sistema de gestão de feedback e mensagens em massa</p>
            </header>
            
            <nav class="tabs" id="main-tabs">
                <button class="tab active" data-tab="upload">Upload</button>
                <button class="tab" data-tab="bot">Bot</button>
                <button class="tab" data-tab="whatsapp">WhatsApp</button>
                <button class="tab" data-tab="feedback">Feedback</button>
            </nav>
            
            <main class="content" id="main-content">
                <!-- Seções serão carregadas pelos módulos -->
            </main>
        `;

        document.body.appendChild(appContainer);
    }

    initializeModules() {
        // Inicializar módulos
        this.modules.upload = new UploadManager();
        this.modules.bot = new BotController();
        this.modules.feedback = new FeedbackUIManager();
        this.modules.whatsapp = new WhatsAppIntegration();

        // Inicializar cada módulo
        this.modules.upload.init();
        this.modules.bot.init();
        this.modules.feedback.init();
        this.modules.whatsapp.init();
    }

    bindEvents() {
        // Eventos de navegação
        const tabs = document.querySelectorAll('[data-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.showTab(tabName);
            });
        });

        // Eventos globais
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Atalhos de teclado
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    showTab(tabName) {
        // Atualizar abas ativas
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Mostrar/ocultar seções
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.toggle('active', section.id === `${tabName}-section`);
        });

        this.currentTab = tabName;

        // Atualizar título da página
        const titles = {
            upload: 'Upload de Contatos',
            bot: 'Controle do Bot',
            whatsapp: 'WhatsApp Web',
            feedback: 'Gerenciamento de Feedback'
        };
        document.title = `SacsMax - ${titles[tabName]}`;
    }

    handleResize() {
        // Ajustar layout responsivo
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile', isMobile);
    }

    handleKeyboardShortcuts(e) {
        // Atalhos de teclado
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.showTab('upload');
                    break;
                case '2':
                    e.preventDefault();
                    this.showTab('bot');
                    break;
                case '3':
                    e.preventDefault();
                    this.showTab('whatsapp');
                    break;
                case '4':
                    e.preventDefault();
                    this.showTab('feedback');
                    break;
            }
        }
    }

    getModule(name) {
        return this.modules[name];
    }

    destroy() {
        // Limpar módulos
        Object.values(this.modules).forEach(module => {
            if (module.destroy) {
                module.destroy();
            }
        });
        
        this.modules = {};
        this.isInitialized = false;
    }

    // Métodos utilitários
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            min-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showLoading(message = 'Carregando...') {
        const loading = document.createElement('div');
        loading.id = 'global-loading';
        loading.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                        background: rgba(0,0,0,0.5); z-index: 9999; display: flex; 
                        align-items: center; justify-content: center;">
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <div class="loading"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('global-loading');
        if (loading) {
            loading.remove();
        }
    }
}

// Inicializar aplicação quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.sacsMaxApp = new SacsMaxApp();
        window.sacsMaxApp.init();
    });
} else {
    window.sacsMaxApp = new SacsMaxApp();
    window.sacsMaxApp.init();
}

// Exportar para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SacsMaxApp };
} else {
    // Disponível globalmente via window.sacsMaxApp
    window.SacsMaxApp = SacsMaxApp;
}