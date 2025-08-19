/**
 * SACSMAX - Módulo de Controle do Bot
 * Gerenciamento de estado e controle do WhatsApp
 */

import { apiService } from '../services/apiService.js';

class BotController {
    constructor() {
        this.status = {
            initialized: false,
            connected: false,
            ready: false,
            qrCode: null
        };
        this.statusInterval = null;
    }

    init() {
        this.createBotControlSection();
        this.bindEvents();
        this.startStatusMonitoring();
    }

    createBotControlSection() {
        const botSection = document.createElement('div');
        botSection.className = 'section';
        botSection.id = 'bot-section';
        
        botSection.innerHTML = `
            <h2>Controle do WhatsApp</h2>
            <div class="status-card">
                <h3>Status do Bot</h3>
                <div class="status-item">
                    <span>Inicializado:</span>
                    <span id="status-initialized">Não</span>
                </div>
                <div class="status-item">
                    <span>Conectado:</span>
                    <span id="status-connected">Não</span>
                </div>
                <div class="status-item">
                    <span>Pronto:</span>
                    <span id="status-ready">Não</span>
                </div>
            </div>
            
            <div id="qr-container" style="display: none;">
                <h3>Escaneie o QR Code</h3>
                <div class="qr-code" id="qr-code"></div>
                <p>Abra o WhatsApp no seu celular e escaneie este código</p>
            </div>
            
            <div class="button-group">
                <button type="button" class="btn btn-success" id="start-bot-btn">Iniciar Bot</button>
                <button type="button" class="btn btn-danger" id="stop-bot-btn" disabled>Parar Bot</button>
                <button type="button" class="btn" id="refresh-status-btn">Atualizar Status</button>
            </div>
        `;

        document.querySelector('.content').appendChild(botSection);
    }

    bindEvents() {
        const startBtn = document.getElementById('start-bot-btn');
        const stopBtn = document.getElementById('stop-bot-btn');
        const refreshBtn = document.getElementById('refresh-status-btn');

        if (startBtn) startBtn.addEventListener('click', this.startBot.bind(this));
        if (stopBtn) stopBtn.addEventListener('click', this.stopBot.bind(this));
        if (refreshBtn) refreshBtn.addEventListener('click', this.refreshStatus.bind(this));
    }

    async startBot() {
        const startBtn = document.getElementById('start-bot-btn');
        const stopBtn = document.getElementById('stop-bot-btn');
        
        startBtn.disabled = true;
        startBtn.innerHTML = '<span class="loading"></span> Iniciando...';

        try {
            const result = await apiService.startWhatsApp();
            
            if (result.success) {
                this.showMessage('Bot iniciado com sucesso!', 'success');
                await this.refreshStatus();
            } else {
                this.showMessage(result.message || 'Erro ao iniciar bot', 'error');
            }
        } catch (error) {
            console.error('Erro ao iniciar bot:', error);
            this.showMessage('Erro ao conectar com o servidor', 'error');
        } finally {
            startBtn.disabled = false;
            startBtn.innerHTML = 'Iniciar Bot';
        }
    }

    async stopBot() {
        const stopBtn = document.getElementById('stop-bot-btn');
        const startBtn = document.getElementById('start-bot-btn');
        
        stopBtn.disabled = true;
        stopBtn.innerHTML = '<span class="loading"></span> Parando...';

        try {
            const result = await apiService.stopWhatsApp();
            
            if (result.success) {
                this.showMessage('Bot parado com sucesso!', 'success');
                this.updateStatus({
                    initialized: false,
                    connected: false,
                    ready: false,
                    qrCode: null
                });
            } else {
                this.showMessage(result.message || 'Erro ao parar bot', 'error');
            }
        } catch (error) {
            console.error('Erro ao parar bot:', error);
            this.showMessage('Erro ao conectar com o servidor', 'error');
        } finally {
            stopBtn.disabled = false;
            stopBtn.innerHTML = 'Parar Bot';
        }
    }

    async refreshStatus() {
        try {
            const status = await apiService.getWhatsAppStatus();
            this.updateStatus(status);
        } catch (error) {
            console.error('Erro ao obter status:', error);
            this.showMessage('Erro ao verificar status', 'error');
        }
    }

    updateStatus(newStatus) {
        this.status = { ...this.status, ...newStatus };

        // Atualizar elementos da UI
        const initializedEl = document.getElementById('status-initialized');
        const connectedEl = document.getElementById('status-connected');
        const readyEl = document.getElementById('status-ready');
        const startBtn = document.getElementById('start-bot-btn');
        const stopBtn = document.getElementById('stop-bot-btn');
        const qrContainer = document.getElementById('qr-container');
        const qrCode = document.getElementById('qr-code');

        if (initializedEl) initializedEl.textContent = this.status.initialized ? 'Sim' : 'Não';
        if (connectedEl) connectedEl.textContent = this.status.connected ? 'Sim' : 'Não';
        if (readyEl) readyEl.textContent = this.status.ready ? 'Sim' : 'Não';

        if (startBtn) startBtn.disabled = this.status.connected;
        if (stopBtn) stopBtn.disabled = !this.status.connected;

        // Gerenciar QR Code
        if (this.status.qrCode && !this.status.connected) {
            qrContainer.style.display = 'block';
            qrCode.innerHTML = `<img src="${this.status.qrCode}" alt="QR Code WhatsApp" style="max-width: 100%;">`;
        } else {
            qrContainer.style.display = 'none';
        }

        // Disparar evento de mudança de status
        window.dispatchEvent(new CustomEvent('botStatusChanged', {
            detail: { status: this.status }
        }));
    }

    startStatusMonitoring() {
        // Verificar status a cada 5 segundos
        this.statusInterval = setInterval(() => {
            this.refreshStatus();
        }, 5000);

        // Primeira verificação
        this.refreshStatus();
    }

    stopStatusMonitoring() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
    }

    showMessage(message, type = 'info') {
        // Criar elemento de mensagem temporário
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        
        const botSection = document.getElementById('bot-section');
        if (botSection) {
            botSection.insertBefore(messageDiv, botSection.firstChild);
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 5000);
        }
    }

    getStatus() {
        return this.status;
    }

    destroy() {
        this.stopStatusMonitoring();
    }
}

// Exportar para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BotController };
} else {
    // Exportar global para uso em scripts tradicionais
    window.BotController = BotController;
}