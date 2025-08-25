// Módulo Bot - Configuração de horário de funcionamento e respostas automáticas

class BotModule {
    constructor() {
        this.botConfig = {
            enabled: true,
            workingHours: {
                enabled: true,
                start: '08:00',
                end: '18:00'
            },
            offHoursMessage: 'Estamos fora do horário de atendimento. Retornaremos em breve.'
        };
        
        // URLs dos serviços - Detecta automaticamente as portas
        this.whatsappUrl = this.detectWhatsAppUrl();
        this.backendUrl = 'http://localhost:5000';
        
        // Status de conexão
        this.whatsappConnected = false;
        this.backendConnected = false;
    }

    detectWhatsAppUrl() {
        // Tenta detectar a porta do WhatsApp server
        const possiblePorts = [3001, 3002, 3003, 3004, 3005];
        
        // Por enquanto, usa a porta 3001 que está funcionando
        return 'http://localhost:3001';
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <div class="header-content">
                        <div class="header-left">
                            <div class="bot-avatar">🤖</div>
                            <div class="header-text">
                    <h2 class="module-title">Configurar Bot</h2>
                                <p class="module-subtitle">Automação de respostas fora do horário</p>
                    </div>
                </div>
                        <div class="header-right">
                            <div class="bot-status-badge ${this.botConfig.enabled ? 'active' : 'inactive'}">
                                <span class="status-dot"></span>
                                ${this.botConfig.enabled ? 'Ativo' : 'Inativo'}
                                </div>
                            </div>
                        </div>
                        </div>
                
                <!-- Status dos Serviços -->
                <div class="services-grid">
                    <div class="service-card ${this.whatsappConnected ? 'connected' : 'disconnected'}">
                        <div class="service-icon">💬</div>
                        <div class="service-info">
                            <h3>WhatsApp Server</h3>
                            <p>${this.whatsappConnected ? 'Conectado' : 'Desconectado'}</p>
                    </div>
                        <div class="service-status">
                            <span class="status-indicator ${this.whatsappConnected ? 'online' : 'offline'}"></span>
                </div>
                        </div>
                        
                    <div class="service-card ${this.backendConnected ? 'connected' : 'disconnected'}">
                        <div class="service-icon">⚙️</div>
                        <div class="service-info">
                            <h3>Backend API</h3>
                            <p>${this.backendConnected ? 'Conectado' : 'Desconectado'}</p>
                        </div>
                        <div class="service-status">
                            <span class="status-indicator ${this.backendConnected ? 'online' : 'offline'}"></span>
                        </div>
                    </div>
                        </div>
                        
                <!-- Configuração Principal -->
                <div class="config-section">
                    <div class="section-header">
                        <h3>⚙️ Configuração Principal</h3>
                        <p>Configure o comportamento automático do bot</p>
                    </div>
                    
                    <div class="config-grid">
                        <div class="config-card">
                            <div class="config-header">
                                <h4>🕐 Horário de Funcionamento</h4>
                                <label class="toggle-switch">
                                <input type="checkbox" id="working-hours-enabled" 
                                       ${this.botConfig.workingHours.enabled ? 'checked' : ''} />
                                    <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                            <div class="time-config" id="time-config">
                                <div class="time-inputs">
                                    <div class="time-input-group">
                                        <label>Início</label>
                                        <input type="time" class="time-input" id="start-time" 
                                       value="${this.botConfig.workingHours.start}" />
                            </div>
                                    <div class="time-separator">até</div>
                                    <div class="time-input-group">
                                        <label>Fim</label>
                                        <input type="time" class="time-input" id="end-time" 
                                       value="${this.botConfig.workingHours.end}" />
                            </div>
                        </div>
                        
                                <div class="timezone-info">
                                    <label>Fuso Horário</label>
                                    <div class="timezone-display">São Paulo (GMT-3)</div>
                        </div>
                    </div>
                </div>
                
                        <div class="config-card">
                            <div class="config-header">
                                <h4>💬 Resposta Automática</h4>
                                <label class="toggle-switch">
                                    <input type="checkbox" id="bot-enabled" 
                                           ${this.botConfig.enabled ? 'checked' : ''} />
                                    <span class="toggle-slider"></span>
                                </label>
                        </div>
                        
                            <div class="message-config">
                                <label>Mensagem Fora do Horário</label>
                                <textarea class="message-input" id="off-hours-message" rows="4"
                                        placeholder="Digite a mensagem que será enviada automaticamente...">${this.botConfig.offHoursMessage}</textarea>
                                <small class="input-help">Esta mensagem será enviada para novos contatos fora do horário de funcionamento</small>
                                </div>
                                </div>
                            </div>
                            
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-save" onclick="botModule.saveBotConfig()">
                            <span class="btn-icon">💾</span>
                            Salvar Configuração
                        </button>
                        <button class="btn btn-secondary" onclick="botModule.syncWithWhatsApp()">
                            <span class="btn-icon">🔄</span>
                            Sincronizar
                            </button>
                    </div>
                </div>
                
                <!-- Teste em Tempo Real -->
                <div class="test-section">
                    <div class="section-header">
                        <h3>🧪 Teste em Tempo Real</h3>
                        <p>Verifique o status atual do bot</p>
                        </div>
                        
                    <div class="test-dashboard">
                        <div class="test-card current-time-card">
                            <div class="test-icon">🕐</div>
                            <div class="test-content">
                                <h4>Horário Atual</h4>
                                <div class="time-display" id="current-time">${formatTime(new Date())}</div>
                        </div>
                    </div>
                    
                        <div class="test-card status-card">
                            <div class="test-icon">📊</div>
                            <div class="test-content">
                                <h4>Status do Bot</h4>
                                <div class="status-display" id="bot-status-test">
                                    <span class="status-badge ${this.isWithinWorkingHours() ? 'working' : 'offline'}">
                                        ${this.isWithinWorkingHours() ? '🟢 Dentro do Horário' : '🔴 Fora do Horário'}
                                    </span>
                    </div>
                            </div>
                        </div>
                        
                        <div class="test-card message-preview-card">
                            <div class="test-icon">💬</div>
                            <div class="test-content">
                                <h4>Mensagem de Resposta</h4>
                                <div class="message-preview" id="message-preview">
                                    ${this.isWithinWorkingHours() ? 'Bot ativo - Sem resposta automática' : this.botConfig.offHoursMessage}
                            </div>
                        </div>
                            </div>
                        </div>
                        
                    <div class="test-actions">
                        <button class="btn btn-test" onclick="botModule.testBotResponse()">
                            <span class="btn-icon">🧪</span>
                            Testar Resposta
                        </button>
                        <button class="btn btn-refresh" onclick="botModule.refreshStatus()">
                            <span class="btn-icon">🔄</span>
                            Atualizar Status
                        </button>
                    </div>
                </div>
                
                <!-- Logs do Sistema -->
                <div class="logs-section">
                    <div class="section-header">
                        <h3>📋 Logs do Sistema</h3>
                        <p>Histórico de atividades e eventos</p>
                        </div>
                        
                    <div class="logs-container">
                        <div class="logs-header">
                            <div class="logs-stats">
                                <span class="log-stat">Total: <span id="total-logs">0</span></span>
                                <span class="log-stat">Hoje: <span id="today-logs">0</span></span>
                        </div>
                            <button class="btn btn-clear" onclick="botModule.clearLogs()">
                                <span class="btn-icon">🗑️</span>
                                Limpar Logs
                            </button>
                        </div>
                        
                        <div class="logs-list" id="bot-logs">
                            ${this.renderBotLogs()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderBotLogs() {
        const logs = JSON.parse(localStorage.getItem('bot_logs') || '[]');
        if (logs.length === 0) {
            return '<div class="no-logs"><span>📝 Nenhum log disponível</span></div>';
        }

        return logs.slice(-10).reverse().map(log => `
            <div class="log-item ${log.type}">
                <div class="log-icon">${this.getLogIcon(log.type)}</div>
                <div class="log-content">
                    <div class="log-message">${log.message}</div>
                    <div class="log-time">${log.time}</div>
                </div>
            </div>
        `).join('');
    }

    getLogIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || 'ℹ️';
    }

    init() {
        this.loadBotConfig();
        this.checkServicesStatus();
        this.setupEventListeners();
        this.startTimeUpdate();
        this.addLog('info', 'Módulo Bot inicializado');
        this.updateLogStats();
    }

    destroy() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
        }
    }

    setupEventListeners() {
        setTimeout(() => {
            // Toggle horário de funcionamento
            const workingHoursCheckbox = document.getElementById('working-hours-enabled');
            const timeConfig = document.getElementById('time-config');
            
            if (workingHoursCheckbox && timeConfig) {
                workingHoursCheckbox.addEventListener('change', () => {
                    timeConfig.style.display = workingHoursCheckbox.checked ? 'block' : 'none';
                    this.updateMessagePreview();
                });
                
                // Aplica estado inicial
                timeConfig.style.display = workingHoursCheckbox.checked ? 'block' : 'none';
            }

            // Atualiza preview da mensagem quando o texto muda
            const messageInput = document.getElementById('off-hours-message');
            if (messageInput) {
                messageInput.addEventListener('input', () => {
                    this.updateMessagePreview();
                });
            }
        }, 100);
    }

    async checkServicesStatus() {
        // Verifica WhatsApp Server
        try {
            const response = await fetch(`${this.whatsappUrl}/api/status`, {
                method: 'GET',
                timeout: 5000
            });
            this.whatsappConnected = response.ok;
            if (response.ok) {
                const data = await response.json();
                this.addLog('success', `WhatsApp Server conectado - ${data.status}`);
            }
        } catch (error) {
            this.whatsappConnected = false;
            this.addLog('error', `Erro ao conectar WhatsApp Server: ${error.message}`);
        }

        // Verifica Backend
        try {
            const response = await fetch(`${this.backendUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });
            this.backendConnected = response.ok;
            if (response.ok) {
                this.addLog('success', 'Backend API conectado');
            }
        } catch (error) {
            this.backendConnected = false;
            this.addLog('error', `Erro ao conectar Backend: ${error.message}`);
        }

        this.updateServicesStatus();
    }

    updateServicesStatus() {
        const serviceCards = document.querySelectorAll('.service-card');
        serviceCards.forEach((card, index) => {
            const isConnected = index === 0 ? this.whatsappConnected : this.backendConnected;
            card.className = `service-card ${isConnected ? 'connected' : 'disconnected'}`;
            
            const statusIndicator = card.querySelector('.status-indicator');
            const statusText = card.querySelector('p');
        
        if (statusIndicator) {
                statusIndicator.className = `status-indicator ${isConnected ? 'online' : 'offline'}`;
        }
        
        if (statusText) {
                statusText.textContent = isConnected ? 'Conectado' : 'Desconectado';
            }
        });
    }

    startTimeUpdate() {
        this.updateCurrentTime();
        this.timeUpdateInterval = setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }

    updateCurrentTime() {
        const currentTimeElement = document.getElementById('current-time');
        const botStatusElement = document.getElementById('bot-status-test');
        const statusBadge = botStatusElement?.querySelector('.status-badge');
        
        if (currentTimeElement) {
            currentTimeElement.textContent = formatTime(new Date());
        }
        
        if (statusBadge) {
            const isWorking = this.isWithinWorkingHours();
            statusBadge.className = `status-badge ${isWorking ? 'working' : 'offline'}`;
            statusBadge.textContent = isWorking ? '🟢 Dentro do Horário' : '🔴 Fora do Horário';
        }

        this.updateMessagePreview();
    }

    updateMessagePreview() {
        const messagePreview = document.getElementById('message-preview');
        if (messagePreview) {
            const isWorking = this.isWithinWorkingHours();
            const message = document.getElementById('off-hours-message')?.value || this.botConfig.offHoursMessage;
            
            if (isWorking) {
                messagePreview.textContent = 'Bot ativo - Sem resposta automática';
                messagePreview.className = 'message-preview active';
            } else {
                messagePreview.textContent = message;
                messagePreview.className = 'message-preview offline';
            }
        }
    }

    isWithinWorkingHours() {
        if (!this.botConfig.workingHours.enabled) {
            return true; // Sempre dentro do horário se não estiver configurado
        }

            const now = new Date();
        // Usa o fuso horário de São Paulo
        const currentTime = formatTime(now);
        const currentMinutes = this.parseTime(currentTime);
            const startTime = this.parseTime(this.botConfig.workingHours.start);
            const endTime = this.parseTime(this.botConfig.workingHours.end);
            
        return currentMinutes >= startTime && currentMinutes <= endTime;
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    async saveBotConfig() {
        this.botConfig.enabled = document.getElementById('bot-enabled')?.checked || false;
        this.botConfig.workingHours.enabled = document.getElementById('working-hours-enabled')?.checked || false;
        this.botConfig.workingHours.start = document.getElementById('start-time')?.value || '08:00';
        this.botConfig.workingHours.end = document.getElementById('end-time')?.value || '18:00';
        this.botConfig.offHoursMessage = document.getElementById('off-hours-message')?.value || 'Estamos fora do horário de atendimento. Retornaremos em breve.';

        // Salva no localStorage
        localStorage.setItem('sacsmax_bot_config', JSON.stringify(this.botConfig));

        // Salva no backend
        try {
            const response = await fetch(`${this.backendUrl}/api/bot/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.botConfig)
            });

            if (response.ok) {
                this.addLog('success', 'Configuração salva com sucesso no backend');
                this.showNotification('✅ Configuração salva com sucesso!', 'success');
            } else {
                this.addLog('error', 'Erro ao salvar no backend');
                this.showNotification('❌ Erro ao salvar no backend', 'error');
            }
        } catch (error) {
            this.addLog('error', 'Erro de conexão com backend');
            this.showNotification('❌ Erro de conexão com backend', 'error');
        }

        // Sincroniza com WhatsApp server
        await this.syncWithWhatsApp();
    }

        async syncWithWhatsApp() {
        if (!this.whatsappConnected) {
            this.addLog('warning', 'WhatsApp server não está conectado');
            this.showNotification('⚠️ WhatsApp server não está conectado', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.whatsappUrl}/api/bot/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    enabled: this.botConfig.enabled,
                    workingHours: this.botConfig.workingHours,
                    offHoursMessage: this.botConfig.offHoursMessage
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.addLog('success', 'Configuração sincronizada com WhatsApp server');
                this.showNotification('✅ Sincronizado com WhatsApp!', 'success');
                
                // Atualiza a configuração local com a resposta do servidor
                if (data.config) {
                    this.botConfig = { ...this.botConfig, ...data.config };
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                this.addLog('error', `Erro ao sincronizar com WhatsApp server: ${errorData.message || 'Erro desconhecido'}`);
                this.showNotification('❌ Erro ao sincronizar com WhatsApp', 'error');
            }
        } catch (error) {
            this.addLog('error', `Erro de conexão com WhatsApp server: ${error.message}`);
            this.showNotification('❌ Erro de conexão com WhatsApp', 'error');
        }
    }

    async testBotResponse() {
        const isWorking = this.isWithinWorkingHours();
        const message = isWorking ? 
            '🟢 Bot está ativo - Dentro do horário de funcionamento' : 
            `🔴 Bot está ativo - Fora do horário de funcionamento\n\nMensagem que seria enviada:\n"${this.botConfig.offHoursMessage}"`;
        
        this.showNotification(message, isWorking ? 'success' : 'warning');
        this.addLog('info', `Teste realizado - ${isWorking ? 'Dentro' : 'Fora'} do horário`);
    }

    refreshStatus() {
        this.checkServicesStatus();
        this.updateCurrentTime();
        this.addLog('info', 'Status atualizado manualmente');
        this.showNotification('🔄 Status atualizado!', 'info');
    }

    clearLogs() {
        localStorage.removeItem('bot_logs');
        const logsList = document.getElementById('bot-logs');
        if (logsList) {
            logsList.innerHTML = '<div class="no-logs"><span>📝 Nenhum log disponível</span></div>';
        }
        this.updateLogStats();
        this.addLog('info', 'Logs limpos');
        this.showNotification('🗑️ Logs limpos!', 'info');
    }

    updateLogStats() {
        const logs = JSON.parse(localStorage.getItem('bot_logs') || '[]');
        const today = new Date().toDateString();
        const todayLogs = logs.filter(log => new Date(log.time).toDateString() === today);
        
        const totalLogsElement = document.getElementById('total-logs');
        const todayLogsElement = document.getElementById('today-logs');
        
        if (totalLogsElement) totalLogsElement.textContent = logs.length;
        if (todayLogsElement) todayLogsElement.textContent = todayLogs.length;
    }

    addLog(type, message) {
        const logs = JSON.parse(localStorage.getItem('bot_logs') || '[]');
        logs.push({
            type: type,
            message: message,
            time: formatTime(new Date())
        });

        // Mantém apenas os últimos 50 logs
        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }

        localStorage.setItem('bot_logs', JSON.stringify(logs));
        this.updateLogsDisplay();
        this.updateLogStats();
    }

    updateLogsDisplay() {
        const logsList = document.getElementById('bot-logs');
        if (logsList) {
            logsList.innerHTML = this.renderBotLogs();
        }
    }

    loadBotConfig() {
        const savedConfig = localStorage.getItem('sacsmax_bot_config');
        if (savedConfig) {
            this.botConfig = { ...this.botConfig, ...JSON.parse(savedConfig) };
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Adiciona estilos específicos do módulo Bot
const botStyles = `
    .module-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        color: white;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .bot-avatar {
        font-size: 3rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);
    }

    .header-text h2 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 700;
    }

    .header-text p {
        margin: 0;
        opacity: 0.9;
        font-size: 1rem;
    }

    .bot-status-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 25px;
        font-weight: 600;
        backdrop-filter: blur(10px);
    }

    .bot-status-badge.active {
        background: rgba(40, 167, 69, 0.2);
        border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .bot-status-badge.inactive {
        background: rgba(220, 53, 69, 0.2);
        border: 1px solid rgba(220, 53, 69, 0.3);
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #28a745;
        animation: pulse 2s infinite;
    }

    .bot-status-badge.inactive .status-dot {
        background: #dc3545;
    }

    .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .service-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }

    .service-card.connected {
        border-color: #28a745;
        background: linear-gradient(135deg, #f8fff9 0%, #e8f5e8 100%);
    }

    .service-card.disconnected {
        border-color: #dc3545;
        background: linear-gradient(135deg, #fff8f8 0%, #f5e8e8 100%);
    }

    .service-icon {
        font-size: 2rem;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: rgba(102, 126, 234, 0.1);
    }

    .service-info {
        flex: 1;
    }

    .service-info h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.1rem;
        font-weight: 600;
    }

    .service-info p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.7;
    }

    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #dc3545;
    }

    .status-indicator.online {
        background: #28a745;
        animation: pulse 2s infinite;
    }

    .config-section {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .section-header {
        margin-bottom: 2rem;
        text-align: center;
    }

    .section-header h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .section-header p {
        margin: 0;
        color: #6c757d;
        font-size: 1rem;
    }

    .config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .config-card {
        background: #f8f9fa;
        border-radius: 12px;
        padding: 1.5rem;
        border: 1px solid #e9ecef;
    }

    .config-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .config-header h4 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .toggle-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 24px;
    }

    .toggle-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }

    input:checked + .toggle-slider {
        background-color: #667eea;
    }

    input:checked + .toggle-slider:before {
        transform: translateX(26px);
    }

    .time-config {
        background: white;
        border-radius: 8px;
        padding: 1.5rem;
        border: 1px solid #dee2e6;
    }

    .time-inputs {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .time-input-group {
        flex: 1;
    }

    .time-input-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }

    .time-input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.3s ease;
    }

    .time-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .time-separator {
        font-weight: 600;
        color: #6c757d;
        margin: 0 0.5rem;
    }

    .timezone-info {
        margin-top: 1rem;
    }

    .timezone-info label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }

    .timezone-display {
        padding: 0.75rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        background: #f8f9fa;
        color: #6c757d;
        font-weight: 500;
    }

    .message-config label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #495057;
    }

    .message-input {
        width: 100%;
        padding: 1rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.3s ease;
    }

    .message-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .input-help {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.85rem;
        color: #6c757d;
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
    }

    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-secondary {
        background: #6c757d;
        color: white;
    }

    .btn-secondary:hover {
        background: #5a6268;
        transform: translateY(-2px);
    }

    .btn-icon {
        font-size: 1.1rem;
    }

    .test-section {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .test-dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .test-card {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 12px;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        border: 1px solid #dee2e6;
        transition: all 0.3s ease;
    }

    .test-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .test-icon {
        font-size: 2rem;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: rgba(102, 126, 234, 0.1);
    }

    .test-content {
        flex: 1;
    }

    .test-content h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .time-display {
        font-size: 1.2rem;
        font-weight: 700;
        color: #667eea;
        font-family: monospace;
    }

    .status-badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .status-badge.working {
        background: #d4edda;
        color: #155724;
    }

    .status-badge.offline {
        background: #f8d7da;
        color: #721c24;
    }

    .message-preview {
        font-size: 0.9rem;
        line-height: 1.4;
        max-height: 60px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
    }

    .message-preview.active {
        color: #28a745;
        font-weight: 600;
    }

    .message-preview.offline {
        color: #dc3545;
        font-style: italic;
    }

    .test-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .btn-test {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
    }

    .btn-test:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
    }

    .btn-refresh {
        background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);
        color: white;
    }

    .btn-refresh:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(23, 162, 184, 0.3);
    }

    .logs-section {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .logs-container {
        border: 1px solid #e9ecef;
        border-radius: 12px;
        overflow: hidden;
    }

    .logs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
    }

    .logs-stats {
        display: flex;
        gap: 1.5rem;
    }

    .log-stat {
        font-size: 0.9rem;
        color: #6c757d;
    }

    .log-stat span {
        font-weight: 600;
        color: #667eea;
    }

    .btn-clear {
        background: #dc3545;
        color: white;
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }

    .btn-clear:hover {
        background: #c82333;
    }

    .logs-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 1rem;
    }

    .log-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        transition: all 0.3s ease;
    }

    .log-item.info {
        background: #e7f3ff;
        border-left: 4px solid #17a2b8;
    }

    .log-item.success {
        background: #d4edda;
        border-left: 4px solid #28a745;
    }

    .log-item.warning {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
    }

    .log-item.error {
        background: #f8d7da;
        border-left: 4px solid #dc3545;
    }

    .log-icon {
        font-size: 1.2rem;
        margin-top: 0.1rem;
    }

    .log-content {
        flex: 1;
    }

    .log-message {
        margin-bottom: 0.25rem;
        font-weight: 500;
        color: #2c3e50;
    }

    .log-time {
        font-size: 0.8rem;
        color: #6c757d;
    }

    .no-logs {
        text-align: center;
        padding: 3rem;
        color: #6c757d;
    }

    .no-logs span {
        font-size: 1.1rem;
        opacity: 0.7;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        max-width: 400px;
        border-left: 4px solid #667eea;
    }

    .notification.success {
        border-left-color: #28a745;
    }

    .notification.error {
        border-left-color: #dc3545;
    }

    .notification.warning {
        border-left-color: #ffc107;
    }

    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }

    .notification-message {
        flex: 1;
        white-space: pre-line;
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: #6c757d;
        padding: 0;
        line-height: 1;
    }

    .notification-close:hover {
        color: #dc3545;
    }
`;

// Adiciona os estilos ao documento
if (!document.getElementById('bot-styles')) {
    const style = document.createElement('style');
    style.id = 'bot-styles';
    style.textContent = botStyles;
    document.head.appendChild(style);
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BotModule;
}

// Variável global para acesso direto
window.botModule = new BotModule();
