// Módulo Bot - Configuração de chatbot e respostas automáticas

class BotModule {
    constructor() {
        this.botConfig = {
            enabled: true,
            name: 'SacsMax Bot',
            welcomeMessage: 'Olá! Sou o assistente virtual da SacsMax. Como posso ajudá-lo?',
            autoReplies: [],
            keywords: [],
            workingHours: {
                enabled: true,
                start: '08:00',
                end: '18:00',
                timezone: 'America/Sao_Paulo'
            },
            fallbackMessage: 'Desculpe, não entendi sua mensagem. Um técnico entrará em contato em breve.'
        };
        this.testMode = false;
        this.testMessages = [];
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">🤖</span>
                    <h2 class="module-title">Configurar Bot</h2>
                    <div class="bot-status">
                        <span class="status-indicator ${this.botConfig.enabled ? 'online' : 'offline'}"></span>
                        <span class="status-text">${this.botConfig.enabled ? 'Ativo' : 'Inativo'}</span>
                    </div>
                </div>
                
                <!-- Status do Bot -->
                <div class="card">
                    <div class="bot-status-card">
                        <div class="bot-info">
                            <div class="bot-avatar">🤖</div>
                            <div class="bot-details">
                                <h3>${this.botConfig.name}</h3>
                                <p>Assistente Virtual Inteligente</p>
                                <div class="bot-stats">
                                    <span class="stat">📝 ${this.botConfig.autoReplies.length} respostas</span>
                                    <span class="stat">🔑 ${this.botConfig.keywords.length} palavras-chave</span>
                                    <span class="stat">⏰ ${this.botConfig.workingHours.enabled ? 'Horário configurado' : '24h'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="bot-controls">
                            <button class="btn ${this.botConfig.enabled ? 'btn-success' : 'btn-secondary'}" 
                                    onclick="this.toggleBot()">
                                ${this.botConfig.enabled ? '🟢 Ativo' : '🔴 Inativo'}
                            </button>
                            <button class="btn btn-primary" onclick="this.testBot()">
                                🧪 Testar Bot
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Configurações Principais -->
                <div class="grid grid-2">
                    <div class="card">
                        <h3>⚙️ Configurações Básicas</h3>
                        
                        <div class="form-group">
                            <label class="form-label">Nome do Bot:</label>
                            <input type="text" class="form-input" id="bot-name" 
                                   value="${this.botConfig.name}" />
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Mensagem de Boas-vindas:</label>
                            <textarea class="form-input" id="welcome-message" rows="3"
                                    placeholder="Digite a mensagem de boas-vindas...">${this.botConfig.welcomeMessage}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Mensagem de Fallback:</label>
                            <textarea class="form-input" id="fallback-message" rows="3"
                                    placeholder="Mensagem quando o bot não entende...">${this.botConfig.fallbackMessage}</textarea>
                        </div>
                        
                        <button class="btn btn-primary" onclick="this.saveBasicConfig()">
                            💾 Salvar Configurações
                        </button>
                    </div>
                    
                    <div class="card">
                        <h3>⏰ Horário de Funcionamento</h3>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="working-hours-enabled" 
                                       ${this.botConfig.workingHours.enabled ? 'checked' : ''} />
                                Ativar horário de funcionamento
                            </label>
                        </div>
                        
                        <div class="time-config">
                            <div class="form-group">
                                <label class="form-label">Horário de Início:</label>
                                <input type="time" class="form-input" id="start-time" 
                                       value="${this.botConfig.workingHours.start}" />
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Horário de Fim:</label>
                                <input type="time" class="form-input" id="end-time" 
                                       value="${this.botConfig.workingHours.end}" />
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Fuso Horário:</label>
                                <select class="form-input" id="timezone">
                                    <option value="America/Sao_Paulo" selected>Brasília (GMT-3)</option>
                                    <option value="America/Manaus">Manaus (GMT-4)</option>
                                    <option value="America/Belem">Belém (GMT-3)</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Mensagem Fora do Horário:</label>
                            <textarea class="form-input" id="off-hours-message" rows="3"
                                    placeholder="Mensagem quando estiver fora do horário...">Estamos fora do horário de atendimento. Retornaremos em breve.</textarea>
                        </div>
                        
                        <button class="btn btn-primary" onclick="this.saveTimeConfig()">
                            💾 Salvar Horários
                        </button>
                    </div>
                </div>
                
                <!-- Respostas Automáticas -->
                <div class="card">
                    <h3>💬 Respostas Automáticas</h3>
                    <p class="section-description">
                        Configure respostas automáticas baseadas em palavras-chave ou frases específicas.
                    </p>
                    
                    <div class="auto-replies-container">
                        <div class="auto-replies-list" id="auto-replies-list">
                            ${this.renderAutoReplies()}
                        </div>
                        
                        <div class="add-reply-section">
                            <h4>➕ Adicionar Nova Resposta</h4>
                            <div class="grid grid-2">
                                <div class="form-group">
                                    <label class="form-label">Palavras-chave:</label>
                                    <input type="text" class="form-input" id="new-keywords" 
                                           placeholder="Ex: preço, orçamento, valor" />
                                    <small class="form-help">Separe múltiplas palavras com vírgula</small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Resposta:</label>
                                    <textarea class="form-input" id="new-reply" rows="3"
                                            placeholder="Digite a resposta automática..."></textarea>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="new-reply-priority" />
                                    Resposta prioritária (sobrescreve outras)
                                </label>
                            </div>
                            
                            <button class="btn btn-success" onclick="this.addAutoReply()">
                                ➕ Adicionar Resposta
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Teste do Bot -->
                <div class="card" id="test-section" style="display: none;">
                    <h3>🧪 Teste do Bot</h3>
                    <p class="section-description">
                        Teste as respostas do bot em tempo real.
                    </p>
                    
                    <div class="test-container">
                        <div class="test-messages" id="test-messages">
                            ${this.renderTestMessages()}
                        </div>
                        
                        <div class="test-input-area">
                            <div class="test-input-container">
                                <input type="text" class="test-input" id="test-message-input"
                                       placeholder="Digite uma mensagem para testar..." />
                                <button class="btn btn-primary" onclick="this.sendTestMessage()">
                                    📤 Enviar
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="test-controls">
                        <button class="btn btn-secondary" onclick="this.clearTest()">
                            🗑️ Limpar Teste
                        </button>
                        <button class="btn btn-secondary" onclick="this.closeTest()">
                            ❌ Fechar Teste
                        </button>
                    </div>
                </div>
                
                <!-- Estatísticas do Bot -->
                <div class="card">
                    <h3>📊 Estatísticas do Bot</h3>
                    
                    <div class="bot-stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">💬</div>
                            <div class="stat-content">
                                <h4>1,247</h4>
                                <p>Mensagens Respondidas</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">✅</div>
                            <div class="stat-content">
                                <h4>89%</h4>
                                <p>Taxa de Sucesso</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">⏱️</div>
                            <div class="stat-content">
                                <h4>2.3s</h4>
                                <p>Tempo Médio de Resposta</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon">👥</div>
                            <div class="stat-content">
                                <h4>156</h4>
                                <p>Conversas Atendidas</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-actions">
                        <button class="btn btn-secondary" onclick="this.exportStats()">
                            📊 Exportar Relatório
                        </button>
                        <button class="btn btn-secondary" onclick="this.resetStats()">
                            🔄 Resetar Estatísticas
                        </button>
                    </div>
                </div>
                
                <!-- Configurações Avançadas -->
                <div class="card">
                    <h3>🔧 Configurações Avançadas</h3>
                    
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="typing-indicator" checked />
                                Mostrar indicador de digitação
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="read-receipts" checked />
                                Mostrar confirmação de leitura
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="auto-escalation" />
                                Escalar para humano automaticamente
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <input type="checkbox" id="learning-mode" />
                                Modo de aprendizado ativo
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Tempo de Espera para Escalação (minutos):</label>
                        <input type="number" class="form-input" id="escalation-time" value="5" min="1" max="60" />
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Idiomas Suportados:</label>
                        <select class="form-input" id="supported-languages" multiple>
                            <option value="pt-BR" selected>Português (Brasil)</option>
                            <option value="en-US">English (US)</option>
                            <option value="es-ES">Español</option>
                        </select>
                    </div>
                    
                    <button class="btn btn-primary" onclick="this.saveAdvancedConfig()">
                        💾 Salvar Configurações Avançadas
                    </button>
                </div>
            </div>
        `;
    }

    renderAutoReplies() {
        if (this.botConfig.autoReplies.length === 0) {
            return '<p class="no-replies">Nenhuma resposta automática configurada</p>';
        }

        return this.botConfig.autoReplies.map((reply, index) => `
            <div class="auto-reply-item" data-index="${index}">
                <div class="reply-header">
                    <div class="reply-keywords">
                        <strong>Palavras-chave:</strong> ${reply.keywords.join(', ')}
                        ${reply.priority ? '<span class="priority-badge">Prioritária</span>' : ''}
                    </div>
                    <div class="reply-actions">
                        <button class="btn btn-sm btn-secondary" onclick="this.editReply(${index})">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="this.deleteReply(${index})">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="reply-content">
                    <strong>Resposta:</strong> ${reply.response}
                </div>
            </div>
        `).join('');
    }

    renderTestMessages() {
        if (this.testMessages.length === 0) {
            return '<p class="no-test-messages">Nenhuma mensagem de teste ainda</p>';
        }

        return this.testMessages.map(message => `
            <div class="test-message ${message.isBot ? 'bot' : 'user'}">
                <div class="test-message-content">
                    <div class="test-message-text">${message.text}</div>
                    <div class="test-message-time">${message.time}</div>
                </div>
            </div>
        `).join('');
    }

    init() {
        this.loadBotConfig();
        this.setupEventListeners();
    }

    destroy() {
        // Limpa event listeners se necessário
    }

    setupEventListeners() {
        setTimeout(() => {
            this.setupFormValidation();
        }, 100);
    }

    setupFormValidation() {
        // Adiciona validação aos formulários
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
        });
    }

    validateInput(input) {
        const value = input.value.trim();
        
        if (input.required && !value) {
            input.classList.add('error');
            return false;
        }
        
        input.classList.remove('error');
        return true;
    }

    toggleBot() {
        this.botConfig.enabled = !this.botConfig.enabled;
        this.updateBotStatus();
        this.saveBotConfig();
        
        const message = this.botConfig.enabled ? 
            'Bot ativado com sucesso!' : 
            'Bot desativado. As mensagens serão direcionadas para técnicos.';
        
        this.showNotification(message, this.botConfig.enabled ? 'success' : 'warning');
    }

    updateBotStatus() {
        const statusIndicator = document.querySelector('.bot-status .status-indicator');
        const statusText = document.querySelector('.bot-status .status-text');
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.botConfig.enabled ? 'online' : 'offline'}`;
        }
        
        if (statusText) {
            statusText.textContent = this.botConfig.enabled ? 'Ativo' : 'Inativo';
        }
    }

    testBot() {
        this.testMode = true;
        this.testMessages = [];
        this.showTestSection();
        this.addTestMessage('Olá! Como posso ajudá-lo?', true);
    }

    showTestSection() {
        const testSection = document.getElementById('test-section');
        if (testSection) {
            testSection.style.display = 'block';
            testSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    closeTest() {
        this.testMode = false;
        const testSection = document.getElementById('test-section');
        if (testSection) {
            testSection.style.display = 'none';
        }
    }

    sendTestMessage() {
        const input = document.getElementById('test-message-input');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        this.addTestMessage(message, false);
        input.value = '';

        // Simula resposta do bot
        setTimeout(() => {
            const botResponse = this.getBotResponse(message);
            this.addTestMessage(botResponse, true);
        }, 1000);
    }

    addTestMessage(text, isBot) {
        const message = {
            text: text,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isBot: isBot
        };

        this.testMessages.push(message);
        this.updateTestMessages();
    }

    updateTestMessages() {
        const testMessages = document.getElementById('test-messages');
        if (testMessages) {
            testMessages.innerHTML = this.renderTestMessages();
            testMessages.scrollTop = testMessages.scrollHeight;
        }
    }

    getBotResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Verifica respostas automáticas
        for (const reply of this.botConfig.autoReplies) {
            const hasKeyword = reply.keywords.some(keyword => 
                lowerMessage.includes(keyword.toLowerCase())
            );
            
            if (hasKeyword) {
                return reply.response;
            }
        }
        
        // Verifica horário de funcionamento
        if (this.botConfig.workingHours.enabled) {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const startTime = this.parseTime(this.botConfig.workingHours.start);
            const endTime = this.parseTime(this.botConfig.workingHours.end);
            
            if (currentTime < startTime || currentTime > endTime) {
                return 'Estamos fora do horário de atendimento. Retornaremos em breve.';
            }
        }
        
        return this.botConfig.fallbackMessage;
    }

    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    clearTest() {
        this.testMessages = [];
        this.updateTestMessages();
    }

    saveBasicConfig() {
        this.botConfig.name = document.getElementById('bot-name')?.value || this.botConfig.name;
        this.botConfig.welcomeMessage = document.getElementById('welcome-message')?.value || this.botConfig.welcomeMessage;
        this.botConfig.fallbackMessage = document.getElementById('fallback-message')?.value || this.botConfig.fallbackMessage;
        
        this.saveBotConfig();
        this.showNotification('Configurações básicas salvas com sucesso!', 'success');
    }

    saveTimeConfig() {
        this.botConfig.workingHours.enabled = document.getElementById('working-hours-enabled')?.checked || false;
        this.botConfig.workingHours.start = document.getElementById('start-time')?.value || '08:00';
        this.botConfig.workingHours.end = document.getElementById('end-time')?.value || '18:00';
        this.botConfig.workingHours.timezone = document.getElementById('timezone')?.value || 'America/Sao_Paulo';
        
        this.saveBotConfig();
        this.showNotification('Configurações de horário salvas com sucesso!', 'success');
    }

    addAutoReply() {
        const keywords = document.getElementById('new-keywords')?.value;
        const response = document.getElementById('new-reply')?.value;
        const priority = document.getElementById('new-reply-priority')?.checked || false;
        
        if (!keywords || !response) {
            this.showNotification('Preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        const keywordsArray = keywords.split(',').map(k => k.trim()).filter(k => k);
        
        const newReply = {
            keywords: keywordsArray,
            response: response,
            priority: priority
        };
        
        this.botConfig.autoReplies.push(newReply);
        this.saveBotConfig();
        this.updateAutoReplies();
        
        // Limpa campos
        document.getElementById('new-keywords').value = '';
        document.getElementById('new-reply').value = '';
        document.getElementById('new-reply-priority').checked = false;
        
        this.showNotification('Resposta automática adicionada com sucesso!', 'success');
    }

    editReply(index) {
        const reply = this.botConfig.autoReplies[index];
        if (!reply) return;
        
        // Preenche formulário para edição
        document.getElementById('new-keywords').value = reply.keywords.join(', ');
        document.getElementById('new-reply').value = reply.response;
        document.getElementById('new-reply-priority').checked = reply.priority;
        
        // Remove a resposta antiga
        this.botConfig.autoReplies.splice(index, 1);
        this.updateAutoReplies();
        
        this.showNotification('Resposta carregada para edição. Salve as alterações.', 'info');
    }

    deleteReply(index) {
        if (confirm('Tem certeza que deseja excluir esta resposta automática?')) {
            this.botConfig.autoReplies.splice(index, 1);
            this.saveBotConfig();
            this.updateAutoReplies();
            this.showNotification('Resposta automática excluída com sucesso!', 'success');
        }
    }

    updateAutoReplies() {
        const autoRepliesList = document.getElementById('auto-replies-list');
        if (autoRepliesList) {
            autoRepliesList.innerHTML = this.renderAutoReplies();
        }
    }

    saveAdvancedConfig() {
        // Salva configurações avançadas
        const config = {
            typingIndicator: document.getElementById('typing-indicator')?.checked || false,
            readReceipts: document.getElementById('read-receipts')?.checked || false,
            autoEscalation: document.getElementById('auto-escalation')?.checked || false,
            learningMode: document.getElementById('learning-mode')?.checked || false,
            escalationTime: document.getElementById('escalation-time')?.value || 5
        };
        
        localStorage.setItem('bot_advanced_config', JSON.stringify(config));
        this.showNotification('Configurações avançadas salvas com sucesso!', 'success');
    }

    exportStats() {
        const stats = {
            totalMessages: 1247,
            successRate: 89,
            avgResponseTime: 2.3,
            conversations: 156,
            date: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bot-stats-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Relatório exportado com sucesso!', 'success');
    }

    resetStats() {
        if (confirm('Tem certeza que deseja resetar todas as estatísticas? Esta ação não pode ser desfeita.')) {
            this.showNotification('Estatísticas resetadas com sucesso!', 'success');
        }
    }

    loadBotConfig() {
        const savedConfig = localStorage.getItem('sacsmax_bot_config');
        if (savedConfig) {
            this.botConfig = { ...this.botConfig, ...JSON.parse(savedConfig) };
        }
    }

    saveBotConfig() {
        localStorage.setItem('sacsmax_bot_config', JSON.stringify(this.botConfig));
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
    .bot-status-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 12px;
    }

    .bot-info {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .bot-avatar {
        font-size: 3rem;
        opacity: 0.9;
    }

    .bot-details h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
    }

    .bot-details p {
        margin: 0 0 1rem 0;
        opacity: 0.8;
    }

    .bot-stats {
        display: flex;
        gap: 1rem;
    }

    .bot-stats .stat {
        font-size: 0.8rem;
        opacity: 0.8;
    }

    .bot-controls {
        display: flex;
        gap: 1rem;
    }

    .bot-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
    }

    .section-description {
        color: #6c757d;
        margin-bottom: 1.5rem;
    }

    .auto-replies-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .auto-replies-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
    }

    .auto-reply-item {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        border-left: 4px solid #667eea;
    }

    .auto-reply-item:last-child {
        margin-bottom: 0;
    }

    .reply-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .reply-keywords {
        font-size: 0.9rem;
    }

    .priority-badge {
        background: #dc3545;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        margin-left: 0.5rem;
    }

    .reply-actions {
        display: flex;
        gap: 0.5rem;
    }

    .reply-content {
        font-size: 0.9rem;
        color: #495057;
    }

    .no-replies {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 2rem;
    }

    .add-reply-section {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 1.5rem;
        border: 2px dashed #dee2e6;
    }

    .add-reply-section h4 {
        margin-bottom: 1rem;
        color: #495057;
    }

    .form-help {
        font-size: 0.8rem;
        color: #6c757d;
        margin-top: 0.25rem;
    }

    .test-container {
        display: flex;
        flex-direction: column;
        height: 400px;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
    }

    .test-messages {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        background: #f0f2f5;
    }

    .test-message {
        margin-bottom: 1rem;
        display: flex;
    }

    .test-message.user {
        justify-content: flex-end;
    }

    .test-message-content {
        max-width: 70%;
        padding: 0.75rem 1rem;
        border-radius: 12px;
    }

    .test-message.user .test-message-content {
        background: #667eea;
        color: white;
        border-bottom-right-radius: 4px;
    }

    .test-message.bot .test-message-content {
        background: white;
        color: #495057;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .test-message-text {
        margin-bottom: 0.25rem;
    }

    .test-message-time {
        font-size: 0.7rem;
        opacity: 0.7;
    }

    .test-input-area {
        padding: 1rem;
        background: white;
        border-top: 1px solid #e9ecef;
    }

    .test-input-container {
        display: flex;
        gap: 0.5rem;
    }

    .test-input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    .test-controls {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
        justify-content: center;
    }

    .no-test-messages {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 2rem;
    }

    .bot-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .stat-icon {
        font-size: 2rem;
        opacity: 0.8;
    }

    .stat-content h4 {
        font-size: 1.5rem;
        margin: 0 0 0.25rem 0;
        font-weight: 700;
    }

    .stat-content p {
        margin: 0;
        opacity: 0.8;
        font-size: 0.9rem;
    }

    .stats-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .time-config {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
    }

    .form-input.error {
        border-color: #dc3545;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
    }
`;

// Adiciona os estilos ao documento
if (!document.getElementById('bot-styles')) {
    const style = document.createElement('style');
    style.id = 'bot-styles';
    style.textContent = botStyles;
    document.head.appendChild(style);
}

export default BotModule;
