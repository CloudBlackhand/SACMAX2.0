// Módulo WhatsApp - 100% fiel ao WhatsApp Web
class WhatsAppModule {
    constructor() {
        // Estado principal
        this.currentChat = null;
        this.chats = new Map(); // Histórico de todos os chats
        this.messages = new Map(); // Mensagens por chat
        this.isConnected = false;
        this.sessionStatus = 'disconnected';
        
        // Interface
        this.showSidebar = true;
        this.searchTerm = '';
        this.filteredChats = [];
        
        // Inicializar
        this.init();
    }

    init() {
        console.log('🚀 Inicializando WhatsApp Web...');
        
        // Disponibilizar globalmente
        window.whatsappModule = this;
        
        // Carregar dados salvos
        this.loadSavedData();
        
        // Verificar conexão
        this.checkConnection();
        
        console.log('✅ WhatsApp Web inicializado');
    }

    // Carregar dados salvos do localStorage
    loadSavedData() {
        try {
            const savedChats = localStorage.getItem('whatsapp_chats');
            const savedMessages = localStorage.getItem('whatsapp_messages');
            
            if (savedChats) {
                this.chats = new Map(JSON.parse(savedChats));
            }
            
            if (savedMessages) {
                this.messages = new Map(JSON.parse(savedMessages));
            }
            
            console.log('📱 Dados carregados:', this.chats.size, 'chats,', this.messages.size, 'conversas');
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
        }
    }

    // Salvar dados no localStorage
    saveData() {
        try {
            localStorage.setItem('whatsapp_chats', JSON.stringify(Array.from(this.chats.entries())));
            localStorage.setItem('whatsapp_messages', JSON.stringify(Array.from(this.messages.entries())));
            } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
        }
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
        
        const chatId = `chat_${phone}`;
        
        // Verificar se o chat já existe
        if (this.chats.has(chatId)) {
            console.log('📱 Chat já existe, abrindo...');
            this.openChat(chatId);
                return;
            }
            
        // Criar novo chat
        const newChat = {
            id: chatId,
            name: clientName,
            phone: phone,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=25d366&color=fff&size=40`,
            status: 'online',
            lastMessage: 'Chat iniciado',
            lastMessageTime: new Date().toLocaleTimeString('pt-BR'),
            unreadCount: 0,
            isPinned: false,
            isMuted: false
        };
        
        // Adicionar ao histórico
        this.chats.set(chatId, newChat);
        
        // Inicializar mensagens
        const initialMessages = [
            {
                id: Date.now(),
                type: 'received',
                content: `Olá ${clientName}! Como posso ajudá-lo hoje?`,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                sender: clientName,
                status: 'read'
            }
        ];
        
        this.messages.set(chatId, initialMessages);
        
        // Salvar dados
        this.saveData();
        
        // Abrir o chat
        this.openChat(chatId);
        
        console.log('✅ Novo chat criado e aberto');
    }

    // Abrir chat existente
    openChat(chatId) {
        const chat = this.chats.get(chatId);
        if (!chat) return;
        
        this.currentChat = chat;
        
        // Marcar mensagens como lidas
        const messages = this.messages.get(chatId) || [];
        messages.forEach(msg => {
            if (msg.type === 'received') {
                msg.status = 'read';
            }
        });
        chat.unreadCount = 0;
        
        // Salvar dados
        this.saveData();
        
        // Atualizar interface
        this.updateInterface();
        
        console.log('📱 Chat aberto:', chat.name);
    }

    // Fechar chat atual
    closeChat() {
        this.currentChat = null;
        this.updateInterface();
    }

    // Enviar mensagem
    sendMessage(content) {
        if (!content.trim() || !this.currentChat) return;

        const chatId = this.currentChat.id;
        const messages = this.messages.get(chatId) || [];
        
        // Adicionar mensagem enviada
        const sentMessage = {
            id: Date.now(),
            type: 'sent',
            content: content.trim(),
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            sender: 'Você',
            status: 'sent'
        };
        
        messages.push(sentMessage);
        this.messages.set(chatId, messages);
        
        // Atualizar último status do chat
        this.currentChat.lastMessage = content.trim();
        this.currentChat.lastMessageTime = sentMessage.timestamp;
        this.chats.set(chatId, this.currentChat);
        
        // Salvar dados
        this.saveData();
        
        // Atualizar interface
        this.updateInterface();
        
        // Simular resposta automática após 2-4 segundos
        setTimeout(() => {
            this.simulateResponse();
        }, 2000 + Math.random() * 2000);
    }

    // Simular resposta automática
    simulateResponse() {
        if (!this.currentChat) return;
        
        const responses = [
            'Entendi! Vou verificar isso para você.',
            'Perfeito! Já estou processando sua solicitação.',
            'Obrigado pela informação! Estou trabalhando nisso.',
            'Certo! Deixe-me buscar essas informações.',
            'Anotado! Vou resolver isso o mais rápido possível.',
            'Compreendo sua solicitação. Vou analisar os detalhes.',
            'Excelente! Sua solicitação foi registrada com sucesso.',
            'Vou verificar isso imediatamente para você.',
            'Entendi perfeitamente. Deixe-me processar isso.',
            'Obrigado pelo contato! Vou cuidar disso agora.'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const chatId = this.currentChat.id;
        const messages = this.messages.get(chatId) || [];
        
        const receivedMessage = {
            id: Date.now(),
            type: 'received',
            content: randomResponse,
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            sender: this.currentChat.name,
            status: 'received'
        };
        
        messages.push(receivedMessage);
        this.messages.set(chatId, messages);
        
        // Atualizar último status do chat
        this.currentChat.lastMessage = randomResponse;
        this.currentChat.lastMessageTime = receivedMessage.timestamp;
        this.currentChat.unreadCount = 0; // Já está aberto
        this.chats.set(chatId, this.currentChat);
        
        // Salvar dados
        this.saveData();
        
        // Atualizar interface
        this.updateInterface();
    }

    // Manipular tecla Enter no input
    handleMessageKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const input = event.target;
            this.sendMessage(input.value);
        }
    }

    // Buscar chats
    searchChats(query) {
        this.searchTerm = query.toLowerCase();
        this.filteredChats = Array.from(this.chats.values()).filter(chat =>
            chat.name.toLowerCase().includes(this.searchTerm) ||
            chat.lastMessage.toLowerCase().includes(this.searchTerm)
        );
        this.updateInterface();
    }

    // Alternar sidebar
    toggleSidebar() {
        this.showSidebar = !this.showSidebar;
        this.updateInterface();
    }

    // Renderizar interface principal
    render() {
        // Sempre mostrar a interface principal do WhatsApp Web
        return this.renderMainInterface();
    }

    // Tela de boas-vindas
    renderWelcomeScreen() {
        return `
            <div class="wa-welcome-container">
                <div class="wa-welcome-content">
                    <div class="wa-welcome-icon">💬</div>
                    <h1 class="wa-welcome-title">WhatsApp Web</h1>
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
                            <span class="wa-feature-icon">💾</span>
                            <span class="wa-feature-text">Histórico persistente</span>
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

    // Interface principal do WhatsApp Web
    renderMainInterface() {
        return `
                <div class="wa-main-container">
                <!-- Sidebar -->
                <div class="wa-sidebar ${this.showSidebar ? 'show' : 'hide'}">
                    <!-- Header da Sidebar -->
                    <div class="wa-sidebar-header">
                        <div class="wa-user-info">
                            <img src="https://ui-avatars.com/api/?name=SacsMax&background=25d366&color=fff&size=40" alt="SacsMax" class="wa-user-avatar">
                            <div class="wa-user-details">
                                <div class="wa-user-name">SacsMax</div>
                                <div class="wa-user-status">online</div>
                            </div>
                        </div>
                        <div class="wa-sidebar-actions">
                            <button class="wa-action-btn" title="Status">
                                <span>📱</span>
                            </button>
                            <button class="wa-action-btn" title="Nova conversa">
                                <span>💬</span>
                            </button>
                            <button class="wa-action-btn" title="Menu">
                                <span>⋮</span>
                            </button>
                        </div>
                    </div>

                    <!-- Busca -->
                        <div class="wa-search-container">
                            <div class="wa-search-box">
                                <span class="wa-search-icon">🔍</span>
                            <input type="text" 
                                   class="wa-search-input" 
                                   placeholder="Pesquisar ou começar uma nova conversa"
                                   oninput="whatsappModule.searchChats(this.value)">
                            </div>
                        </div>
                        
                    <!-- Lista de Chats -->
                    <div class="wa-chats-list">
                        ${this.renderChatsList()}
                        </div>
                    </div>
                    
                <!-- Área do Chat -->
                <div class="wa-chat-area">
                    ${this.currentChat ? this.renderChatInterface() : this.renderEmptyChat()}
                </div>
            </div>
        `;
    }

    // Renderizar lista de chats
    renderChatsList() {
        const chatsToShow = this.searchTerm ? this.filteredChats : Array.from(this.chats.values());
        
        if (chatsToShow.length === 0) {
            return `
                <div class="wa-empty-chats">
                    <div class="wa-empty-icon">💬</div>
                    <p>Nenhuma conversa encontrada</p>
                </div>
            `;
        }

        return chatsToShow.map(chat => `
            <div class="wa-chat-item ${this.currentChat?.id === chat.id ? 'active' : ''}" 
                 onclick="whatsappModule.openChat('${chat.id}')">
                <div class="wa-chat-avatar">
                    <img src="${chat.avatar}" alt="${chat.name}">
                    <div class="wa-chat-status ${chat.status}"></div>
                </div>
                <div class="wa-chat-info">
                    <div class="wa-chat-header">
                        <div class="wa-chat-name">${chat.name}</div>
                        <div class="wa-chat-time">${chat.lastMessageTime}</div>
                </div>
                    <div class="wa-chat-preview">
                        <div class="wa-chat-message">${chat.lastMessage}</div>
                        ${chat.unreadCount > 0 ? `<div class="wa-unread-badge">${chat.unreadCount}</div>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Interface do chat
    renderChatInterface() {
        const messages = this.messages.get(this.currentChat.id) || [];
        
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
                    </div>
            </div>
            
                <!-- Área de Mensagens -->
                <div class="wa-messages-area">
            <div class="wa-messages-container">
                        ${this.renderMessages(messages)}
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

    // Chat vazio
    renderEmptyChat() {
        return `
            <div class="wa-empty-chat">
                <div class="wa-empty-chat-icon">💬</div>
                <h2>Selecione uma conversa</h2>
                <p>Escolha um chat da lista para começar a conversar</p>
            </div>
        `;
    }

    // Renderizar mensagens
    renderMessages(messages) {
        if (messages.length === 0) {
            return `
                <div class="wa-messages-empty">
                    <p>Nenhuma mensagem ainda</p>
                    <p>Inicie uma conversa!</p>
                </div>
            `;
        }

        return messages.map(message => `
            <div class="wa-message ${message.type}">
                    <div class="wa-message-content">
                    <div class="wa-message-text">${message.content}</div>
                    <div class="wa-message-time">
                        ${message.timestamp}
                        ${message.type === 'sent' ? `<span class="wa-message-status ${message.status}">${this.getStatusIcon(message.status)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Ícone de status da mensagem
    getStatusIcon(status) {
        switch (status) {
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '✓';
        }
    }

    // Atualizar interface
    updateInterface() {
        console.log('🔄 Atualizando interface do WhatsApp...');
        console.log('📱 Chat atual:', this.currentChat?.name);
        
        // Forçar atualização da interface
        const contentArea = document.getElementById('app-content');
        if (contentArea) {
            contentArea.innerHTML = this.render();
            console.log('✅ HTML atualizado');
        } else {
            console.error('❌ Elemento app-content não encontrado');
        }
        
        // Scroll para última mensagem após um pequeno delay
        setTimeout(() => {
            const messagesContainer = document.querySelector('.wa-messages-container');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                console.log('✅ Scroll para última mensagem');
            }
        }, 200);
        
        console.log('✅ Interface atualizada');
    }

    // Destruir módulo
    destroy() {
        console.log('🛑 Destruindo módulo WhatsApp...');
        this.saveData();
        this.currentChat = null;
        this.chats.clear();
        this.messages.clear();
        window.whatsappModule = null;
    }
}

// Estilos CSS para WhatsApp Web 100% fiel
const whatsappStyles = `
<style>
/* Container Principal */
.wa-main-container {
    display: flex;
    height: 100vh;
    background: #f0f2f5;
}

/* Sidebar */
.wa-sidebar {
    width: 400px;
    background: white;
    border-right: 1px solid #e9edef;
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
}

.wa-sidebar.hide {
    transform: translateX(-100%);
}

/* Header da Sidebar */
.wa-sidebar-header {
    background: #f0f2f5;
    padding: 10px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e9edef;
}

.wa-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.wa-user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.wa-user-details {
    display: flex;
    flex-direction: column;
}

.wa-user-name {
    font-weight: 600;
    font-size: 16px;
    color: #111b21;
}

.wa-user-status {
    font-size: 13px;
    color: #667781;
}

.wa-sidebar-actions {
        display: flex;
    gap: 8px;
}

.wa-action-btn {
    background: none;
    border: none;
    color: #54656f;
    font-size: 18px;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s;
}

.wa-action-btn:hover {
    background: #e9edef;
}

/* Busca */
    .wa-search-container {
    padding: 8px 12px;
    background: white;
    border-bottom: 1px solid #e9edef;
    }

    .wa-search-box {
        display: flex;
        align-items: center;
    background: #f0f2f5;
        border-radius: 8px;
        padding: 8px 12px;
    gap: 8px;
    }

    .wa-search-icon {
    color: #54656f;
    font-size: 16px;
    }

    .wa-search-input {
    flex: 1;
        border: none;
        background: transparent;
        outline: none;
    font-size: 15px;
    color: #111b21;
    }

.wa-search-input::placeholder {
    color: #667781;
}

/* Lista de Chats */
    .wa-chats-list {
        flex: 1;
        overflow-y: auto;
    }

    .wa-chat-item {
        display: flex;
        padding: 12px 16px;
    gap: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
    border-bottom: 1px solid #f0f2f5;
    }

    .wa-chat-item:hover {
    background: #f5f6f6;
    }

    .wa-chat-item.active {
    background: #f0f2f5;
    }

    .wa-chat-avatar {
        position: relative;
    flex-shrink: 0;
}

.wa-chat-avatar img {
    width: 49px;
    height: 49px;
        border-radius: 50%;
    }

    .wa-chat-status {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
    }

    .wa-chat-status.online {
    background: #25d366;
    }

    .wa-chat-status.offline {
    background: #667781;
    }

    .wa-chat-info {
        flex: 1;
        min-width: 0;
    }

    .wa-chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
    }

    .wa-chat-name {
        font-weight: 600;
    font-size: 16px;
    color: #111b21;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    }

    .wa-chat-time {
        font-size: 12px;
    color: #667781;
    flex-shrink: 0;
    }

    .wa-chat-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .wa-chat-message {
    font-size: 14px;
    color: #667781;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
    }

    .wa-unread-badge {
        background: #25d366;
        color: white;
        border-radius: 50%;
        min-width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        margin-left: 8px;
    flex-shrink: 0;
    }

/* Área do Chat */
    .wa-chat-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #efeae2;
    }

/* Chat Container */
    .wa-chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

/* Chat Header */
    .wa-chat-header {
    background: #f0f2f5;
    padding: 10px 16px;
        display: flex;
        justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e9edef;
    }

.wa-chat-contact-info {
        display: flex;
        align-items: center;
    gap: 12px;
}

.wa-contact-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.wa-contact-details {
    display: flex;
    flex-direction: column;
}

.wa-contact-name {
    font-weight: 600;
    font-size: 16px;
    color: #111b21;
}

.wa-contact-status {
    font-size: 13px;
    color: #667781;
}

.wa-chat-actions {
    display: flex;
    gap: 8px;
}

/* Messages Area */
.wa-messages-area {
        flex: 1;
        overflow-y: auto;
    padding: 20px;
    background: #efeae2;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23ffffff" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="%23ffffff" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="%23ffffff" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
}

.wa-messages-container {
        display: flex;
    flex-direction: column;
    gap: 8px;
}

.wa-messages-empty {
    text-align: center;
    color: #667781;
    margin-top: 50px;
}

.wa-messages-empty p {
    margin: 8px 0;
    font-size: 14px;
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
    padding: 6px 7px 8px 9px;
    border-radius: 7.5px;
        position: relative;
    }

.wa-message.sent .wa-message-content {
    background: #d9fdd3;
    color: #111b21;
    border-bottom-right-radius: 2px;
}

.wa-message.received .wa-message-content {
    background: white;
    color: #111b21;
    border-bottom-left-radius: 2px;
    box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
    }

    .wa-message-text {
    font-size: 14.2px;
    line-height: 19px;
    margin-bottom: 4px;
        word-wrap: break-word;
    }

    .wa-message-time {
        font-size: 11px;
    color: #667781;
        display: flex;
        align-items: center;
        justify-content: flex-end;
    gap: 4px;
}

.wa-message.received .wa-message-time {
    justify-content: flex-start;
    }

    .wa-message-status {
    font-size: 12px;
}

.wa-message-status.sent {
    color: #667781;
}

.wa-message-status.delivered {
    color: #53bdeb;
}

.wa-message-status.read {
    color: #53bdeb;
}

/* Message Input */
.wa-message-input-container {
    background: #f0f2f5;
    padding: 10px 16px;
    border-top: 1px solid #e9edef;
    }

    .wa-input-wrapper {
        display: flex;
        align-items: flex-end;
    background: white;
    border-radius: 8px;
    padding: 8px 12px;
        gap: 8px;
    }

    .wa-input-btn {
        background: none;
        border: none;
    font-size: 24px;
        padding: 8px;
        border-radius: 50%;
    cursor: pointer;
        transition: background-color 0.2s;
    color: #54656f;
    display: flex;
    align-items: center;
    justify-content: center;
    }

    .wa-input-btn:hover {
    background: #f0f2f5;
}

.wa-send-btn {
    background: #25d366 !important;
    color: white !important;
    width: 32px;
    height: 32px;
    padding: 0;
}

.wa-send-btn:hover {
    background: #128c7e !important;
    }

    .wa-message-input {
    flex: 1;
        border: none;
        outline: none;
    font-size: 15px;
    padding: 9px 12px;
    background: transparent;
        resize: none;
    max-height: 100px;
    min-height: 20px;
    line-height: 20px;
}

.wa-message-input::placeholder {
    color: #667781;
}

/* Empty States */
.wa-empty-chats {
    text-align: center;
    padding: 40px 20px;
    color: #667781;
}

.wa-empty-chat {
        display: flex;
    flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
    color: #667781;
        text-align: center;
}

.wa-empty-icon, .wa-empty-chat-icon {
        font-size: 48px;
        margin-bottom: 16px;
    opacity: 0.5;
}

.wa-empty-chat h2 {
    margin-bottom: 8px;
    color: #111b21;
}

.wa-empty-chat p {
    font-size: 14px;
}

/* Welcome Screen */
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

/* Responsividade */
@media (max-width: 768px) {
    .wa-sidebar {
        width: 100%;
        position: absolute;
        z-index: 10;
    }
    
    .wa-chat-area {
        width: 100%;
    }
    
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
