// Módulo WhatsApp - Interface WhatsApp Web
class WhatsAppModule {
    constructor() {
        this.currentChat = null;
        this.messages = [];
        this.isConnected = false;
        this.sessionStatus = 'disconnected';
        this.contacts = [];
        
        // Inicializar quando o módulo for carregado
        this.init();
    }

    init() {
        console.log('🚀 Inicializando módulo WhatsApp...');
        
        // Disponibilizar globalmente
        window.whatsappModule = this;
        
        // Verificar status da conexão
        this.checkConnection();
        
        console.log('✅ Módulo WhatsApp inicializado e disponível globalmente');
    }

    async checkConnection() {
        try {
            const response = await fetch(`${SacsMaxConfig.backend.current}/api/health`);
            this.isConnected = response.ok;
            this.sessionStatus = this.isConnected ? 'connected' : 'disconnected';
        } catch (error) {
            console.error('❌ Erro ao verificar conexão:', error);
            this.isConnected = false;
            this.sessionStatus = 'disconnected';
        }
    }

    // Função chamada pelo módulo de produtividade
    createNewChat(phone, clientName) {
        console.log('💬 Criando novo chat:', clientName, phone);
        
        // Criar dados do chat
        this.currentChat = {
            id: `chat_${Date.now()}`,
            name: clientName,
            phone: phone,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=25d366&color=fff&size=40`,
            status: 'online',
            lastSeen: new Date().toLocaleTimeString('pt-BR')
        };

        // Inicializar mensagens
        this.messages = [
            {
                id: 1,
                type: 'received',
                content: `Olá ${clientName}! Como posso ajudá-lo hoje?`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                sender: clientName
            }
        ];

        // Atualizar interface
        this.updateInterface();
        
        console.log('✅ Novo chat criado com sucesso');
    }

    // Atualizar interface
    updateInterface() {
        console.log('🔄 Atualizando interface do WhatsApp...');
        
        // Se o app principal estiver ativo, usar seu sistema de carregamento
        if (window.app && window.app.currentModule === 'whatsapp') {
            window.app.loadModule('whatsapp');
        } else {
            // Fallback: atualizar diretamente
            const contentArea = document.getElementById('app-content');
            if (contentArea) {
                contentArea.innerHTML = this.render();
            }
        }
        
        console.log('✅ Interface atualizada');
    }

    // Fechar chat atual
    closeChat() {
        this.currentChat = null;
        this.messages = [];
        this.updateInterface();
    }

    // Enviar mensagem
    sendMessage(content) {
        if (!content.trim() || !this.currentChat) return;

        // Adicionar mensagem enviada
        const sentMessage = {
            id: this.messages.length + 1,
            type: 'sent',
            content: content.trim(),
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            sender: 'Você'
        };
        
        this.messages.push(sentMessage);

        // Simular resposta automática após 2 segundos
        setTimeout(() => {
            const responses = [
                'Entendi! Vou verificar isso para você.',
                'Perfeito! Já estou processando sua solicitação.',
                'Obrigado pela informação! Estou trabalhando nisso.',
                'Certo! Deixe-me buscar essas informações.',
                'Anotado! Vou resolver isso o mais rápido possível.'
            ];
            
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            
            const receivedMessage = {
                id: this.messages.length + 1,
                type: 'received',
                content: randomResponse,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                sender: this.currentChat.name
            };
            
            this.messages.push(receivedMessage);
            this.updateInterface();
        }, 2000);

        // Limpar input
        const messageInput = document.querySelector('.wa-message-input input');
        if (messageInput) {
            messageInput.value = '';
        }

        this.updateInterface();
    }

    // Manipular tecla Enter no input
    handleMessageKeyPress(event) {
        if (event.key === 'Enter') {
            const input = event.target;
            this.sendMessage(input.value);
        }
    }

    // Renderizar interface principal
    render() {
        if (!this.currentChat) {
            return this.renderWelcomeScreen();
        } else {
            return this.renderChatInterface();
        }
    }

    // Tela de boas-vindas
    renderWelcomeScreen() {
        return `
            <div class="wa-welcome-container">
                <div class="wa-welcome-content">
                    <div class="wa-welcome-icon">💬</div>
                    <h1 class="wa-welcome-title">WhatsApp</h1>
                    <p class="wa-welcome-subtitle">Envie e receba mensagens sem precisar conectar seu telefone.</p>
                    
                    <div class="wa-status-card">
                        <div class="wa-status-header">
                            <span class="wa-status-icon">📱</span>
                            <span class="wa-status-text">Status da Conexão</span>
                        </div>
                        <div class="wa-status-indicator ${this.isConnected ? 'connected' : 'disconnected'}">
                            ${this.isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                        </div>
                    </div>

                    <div class="wa-instructions">
                        <h3>Como usar:</h3>
                        <ol>
                            <li>Vá para o módulo <strong>Produtividade</strong></li>
                            <li>Encontre um contato na lista</li>
                            <li>Clique no botão <strong>"WhatsApp"</strong></li>
                            <li>O chat será aberto automaticamente</li>
                        </ol>
                    </div>

                    <div class="wa-features">
                        <div class="wa-feature">
                            <span class="wa-feature-icon">🔒</span>
                            <span class="wa-feature-text">Criptografado de ponta a ponta</span>
                        </div>
                        <div class="wa-feature">
                            <span class="wa-feature-icon">⚡</span>
                            <span class="wa-feature-text">Sincronização em tempo real</span>
                        </div>
                        <div class="wa-feature">
                            <span class="wa-feature-icon">📱</span>
                            <span class="wa-feature-text">Interface idêntica ao WhatsApp Web</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Interface do chat
    renderChatInterface() {
        return `
            <div class="wa-chat-container">
                <!-- Header do Chat -->
                <div class="wa-chat-header">
                    <div class="wa-chat-contact-info">
                        <img src="${this.currentChat.avatar}" alt="${this.currentChat.name}" class="wa-contact-avatar">
                        <div class="wa-contact-details">
                            <div class="wa-contact-name">${this.currentChat.name}</div>
                            <div class="wa-contact-status">${this.currentChat.status}</div>
                        </div>
                    </div>
                    <div class="wa-chat-actions">
                        <button class="wa-action-btn" title="Buscar">
                            <span>🔍</span>
                        </button>
                        <button class="wa-action-btn" title="Menu">
                            <span>⋮</span>
                        </button>
                        <button class="wa-action-btn wa-close-btn" onclick="whatsappModule.closeChat()" title="Fechar">
                            <span>✕</span>
                        </button>
                    </div>
                </div>

                <!-- Área de Mensagens -->
                <div class="wa-messages-area">
                    <div class="wa-messages-container">
                        ${this.renderMessages()}
                    </div>
                </div>

                <!-- Input de Mensagem -->
                <div class="wa-message-input-container">
                    <div class="wa-input-wrapper">
                        <button class="wa-input-btn" title="Anexar">
                            <span>📎</span>
                        </button>
                        <input type="text" 
                               class="wa-message-input" 
                               placeholder="Digite uma mensagem"
                               onkeypress="whatsappModule.handleMessageKeyPress(event)">
                        <button class="wa-input-btn" title="Emoji">
                            <span>😊</span>
                        </button>
                        <button class="wa-input-btn wa-send-btn" 
                                onclick="whatsappModule.sendMessage(document.querySelector('.wa-message-input').value)"
                                title="Enviar">
                            <span>➤</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Renderizar mensagens
    renderMessages() {
        return this.messages.map(message => `
            <div class="wa-message ${message.type}">
                <div class="wa-message-content">
                    <div class="wa-message-text">${message.content}</div>
                    <div class="wa-message-time">${message.timestamp}</div>
                </div>
            </div>
        `).join('');
    }

    // Destruir módulo
    destroy() {
        console.log('🛑 Destruindo módulo WhatsApp...');
        this.currentChat = null;
        this.messages = [];
        window.whatsappModule = null;
    }
}

// Estilos CSS para WhatsApp Web
const whatsappStyles = `
<style>
/* Container Principal */
.wa-welcome-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80vh;
    background: #f0f2f5;
    padding: 20px;
}

.wa-welcome-content {
    background: white;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.wa-welcome-icon {
    font-size: 64px;
    margin-bottom: 20px;
}

.wa-welcome-title {
    font-size: 32px;
    color: #075e54;
    margin-bottom: 10px;
    font-weight: 600;
}

.wa-welcome-subtitle {
    color: #667781;
    font-size: 16px;
    margin-bottom: 30px;
    line-height: 1.5;
}

/* Status Card */
.wa-status-card {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 30px;
}

.wa-status-header {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.wa-status-icon {
    font-size: 20px;
    margin-right: 10px;
}

.wa-status-text {
    font-weight: 600;
    color: #333;
}

.wa-status-indicator {
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
}

.wa-status-indicator.connected {
    background: #25d366;
    color: white;
}

.wa-status-indicator.disconnected {
    background: #dc3545;
    color: white;
}

/* Instruções */
.wa-instructions {
    text-align: left;
    margin-bottom: 30px;
}

.wa-instructions h3 {
    color: #075e54;
    margin-bottom: 15px;
}

.wa-instructions ol {
    color: #667781;
    line-height: 1.8;
}

.wa-instructions li {
    margin-bottom: 8px;
}

/* Features */
.wa-features {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.wa-feature {
    display: flex;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
}

.wa-feature-icon {
    font-size: 20px;
    margin-right: 12px;
}

.wa-feature-text {
    color: #667781;
    font-size: 14px;
}

/* Chat Container */
.wa-chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f0f2f5;
}

/* Chat Header */
.wa-chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #075e54;
    color: white;
    padding: 10px 16px;
    height: 60px;
}

.wa-chat-contact-info {
    display: flex;
    align-items: center;
}

.wa-contact-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
}

.wa-contact-details {
    display: flex;
    flex-direction: column;
}

.wa-contact-name {
    font-weight: 600;
    font-size: 16px;
}

.wa-contact-status {
    font-size: 13px;
    opacity: 0.8;
}

.wa-chat-actions {
    display: flex;
    gap: 8px;
}

.wa-action-btn {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s;
}

.wa-action-btn:hover {
    background: rgba(255,255,255,0.1);
}

.wa-close-btn:hover {
    background: rgba(255,255,255,0.2);
}

/* Messages Area */
.wa-messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #e5ddd5;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="%23ffffff" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="%23ffffff" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
}

.wa-messages-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* Messages */
.wa-message {
    display: flex;
    margin-bottom: 8px;
}

.wa-message.sent {
    justify-content: flex-end;
}

.wa-message.received {
    justify-content: flex-start;
}

.wa-message-content {
    max-width: 65%;
    padding: 8px 12px;
    border-radius: 8px;
    position: relative;
}

.wa-message.sent .wa-message-content {
    background: #dcf8c6;
    color: #000;
    border-bottom-right-radius: 2px;
}

.wa-message.received .wa-message-content {
    background: white;
    color: #000;
    border-bottom-left-radius: 2px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.wa-message-text {
    font-size: 14px;
    line-height: 1.4;
    margin-bottom: 4px;
}

.wa-message-time {
    font-size: 11px;
    color: #667781;
    text-align: right;
}

.wa-message.received .wa-message-time {
    text-align: left;
}

/* Message Input */
.wa-message-input-container {
    background: #f0f2f5;
    padding: 10px 16px;
    border-top: 1px solid #e9edef;
}

.wa-input-wrapper {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 8px;
    padding: 8px 12px;
    gap: 8px;
}

.wa-input-btn {
    background: none;
    border: none;
    font-size: 20px;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s;
    color: #54656f;
}

.wa-input-btn:hover {
    background: #f0f2f5;
}

.wa-send-btn {
    background: #25d366 !important;
    color: white !important;
}

.wa-send-btn:hover {
    background: #128c7e !important;
}

.wa-message-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    padding: 8px 0;
    background: transparent;
}

.wa-message-input::placeholder {
    color: #667781;
}

/* Responsividade */
@media (max-width: 768px) {
    .wa-welcome-content {
        padding: 20px;
        margin: 10px;
    }
    
    .wa-welcome-title {
        font-size: 24px;
    }
    
    .wa-chat-header {
        padding: 8px 12px;
    }
    
    .wa-messages-area {
        padding: 10px;
    }
    
    .wa-message-content {
        max-width: 80%;
    }
}
</style>
`;

// Inserir estilos no head
document.head.insertAdjacentHTML('beforeend', whatsappStyles);
