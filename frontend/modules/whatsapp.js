// Módulo WhatsApp - Sistema de chat integrado

class WhatsAppModule {
    constructor() {
        this.currentChat = null;
        this.messages = {};
        this.isConnected = false;
        this.sessionName = 'sacmax';
        this.qrCode = null;
        this.sessionStatus = 'disconnected';
        
        // Configuração para Railway
        this.whatsappPort = 3002;
        this.whatsappUrl = window.location.origin;
        
        // Estado controlado
        this.whatsappStatus = 'paused';
        this.isWhatsAppEnabled = false;
    }

    async initWhatsApp() {
        try {
            console.log('🔧 Inicializando WhatsApp...');
            
            // Verificar status do backend
            await this.checkBackendStatus();
            
            // Sistema funcionando
            this.isConnected = true;
            this.sessionStatus = 'ready';
            
            console.log('✅ WhatsApp inicializado');
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp:', error);
        }
    }

    async checkBackendStatus() {
        try {
            const response = await fetch(`${window.location.origin}/api/health`);
                if (response.ok) {
                console.log('✅ Backend conectado');
                return true;
            } else {
                console.log('⚠️ Backend não disponível');
                return false;
                }
            } catch (error) {
            console.error('Erro ao verificar backend:', error);
            return false;
        }
    }

    // REMOVIDO: detectWhatsAppPort() - não necessário
    // REMOVIDO: connectWebSocket() - não necessário
    // REMOVIDO: handleWebSocketMessage() - não necessário

    // NOVO: Sistema independente
    async checkWhatsAppStatus() {
        try {
            const response = await fetch(`${window.location.origin}/api/whatsapp/status`);
            if (response.ok) {
                const data = await response.json();
                this.whatsappStatus = data.status;
                this.isWhatsAppEnabled = data.isEnabled;
                console.log('✅ Status WhatsApp atualizado:', data.status);
            }
        } catch (error) {
            console.error('Erro ao verificar status WhatsApp:', error);
        }
    }

    // NOVO: Gerar QR Code independente
    async generateQRCode() {
        try {
            if (!this.isWhatsAppEnabled) {
                this.showError('WhatsApp não está ativado. Ative primeiro via Settings.');
                return;
            }
            
            const generateBtn = document.getElementById('generate-qr-btn');
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<span class="btn-icon">⏳</span> Gerando...';
            
            // Solicitar geração do QR Code
            const response = await fetch(`${window.location.origin}/api/whatsapp/generate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                // Aguardar um pouco e verificar se o QR Code foi gerado
                setTimeout(async () => {
                    await this.checkQRCode();
                }, 1000);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('❌ Erro ao gerar QR Code:', error);
            this.showError(`Erro ao gerar QR Code: ${error.message}`);
        } finally {
            const generateBtn = document.getElementById('generate-qr-btn');
            generateBtn.disabled = this.whatsappStatus === 'ready';
            generateBtn.innerHTML = '<span class="btn-icon">📱</span> Gerar QR Code';
        }
    }

    // NOVO: Verificar QR Code independente
    async checkQRCode() {
        try {
            const response = await fetch(`${window.location.origin}/api/whatsapp/qr`);
            const data = await response.json();

            if (data.success) {
                const qrContainer = document.getElementById('qr-container');
                qrContainer.style.display = 'block';
                document.getElementById('qr-code').innerHTML = `<img src="${data.qr}" alt="QR Code WhatsApp" />`;
                
                this.whatsappStatus = 'qr_ready';
                this.updateStatus();
                
                console.log('✅ QR Code exibido (modo independente)');
            }
        } catch (error) {
            console.error('❌ Erro ao verificar QR Code:', error);
        }
    }

    // NOVO: Atualizar status
    updateStatus() {
        const statusText = document.querySelector('.connection-status .status-text');
        const statusIndicator = document.querySelector('.connection-status .status-indicator');
        
        if (statusText) {
            statusText.textContent = this.getStatusText();
        }
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.whatsappStatus === 'ready' ? 'connected' : 'disconnected'}`;
        }
    }

    // Função de renderização - Chat WhatsApp Web
    render() {
        if (!this.currentChat) {
            // Tela inicial - sem chat ativo
            return `
                <div class="module-container fade-in">
                    <div class="module-header">
                        <span class="module-icon">📱</span>
                        <h2 class="module-title">WhatsApp</h2>
                        <div class="connection-status">
                            <span class="status-indicator ${this.isConnected ? 'connected' : 'disconnected'}">
                                ${this.isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
                            </span>
                            <span class="status-text">${this.getStatusText()}</span>
                        </div>
                    </div>
                    
                    <div class="wa-content">
                        <div class="wa-info">
                            <h3>💬 Chat WhatsApp</h3>
                            <p>Para iniciar um chat, clique no botão "WhatsApp" na lista de contatos do módulo Produtividade.</p>
                            <div class="wa-status">
                                <strong>Status:</strong> ${this.getStatusText()}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Chat ativo - Interface WhatsApp Web
            return `
                <div class="module-container fade-in">
                    <div class="module-header">
                        <span class="module-icon">📱</span>
                        <h2 class="module-title">WhatsApp - ${this.currentChat.name}</h2>
                        <button class="btn-close-chat" onclick="whatsappModule.closeChat()">✕</button>
                    </div>
                    
                    <div class="wa-chat-container">
                        ${this.renderChatInterface()}
                    </div>
                </div>
            `;
        }
    }

    renderChatInterface() {
        return `
            <div class="wa-chat-header">
                <div class="wa-chat-contact">
                    <img src="${this.currentChat.avatar || 'https://via.placeholder.com/40'}" alt="${this.currentChat.name}">
                    <div class="wa-chat-info">
                        <div class="wa-chat-name">${this.currentChat.name}</div>
                        <div class="wa-chat-status">${this.currentChat.status || 'online'}</div>
                    </div>
                </div>
            </div>
            
            <div class="wa-messages-container">
                ${this.renderMessages()}
            </div>
            
            <div class="wa-message-input">
                <div class="wa-input-container">
                    <button class="wa-attachment-btn" onclick="whatsappModule.toggleAttachmentMenu()">
                        📎
                    </button>
                    <input type="text" class="wa-message-text" placeholder="Digite uma mensagem..." 
                           onkeypress="whatsappModule.handleMessageKeyPress(event)">
                    <button class="wa-emoji-btn" onclick="whatsappModule.toggleEmojiPicker()">
                        😊
                    </button>
                    <button class="wa-send-btn" onclick="whatsappModule.sendMessage()">
                        ➤
                    </button>
                </div>
            </div>
        `;
    }

    renderMessages() {
        const messages = this.messages[this.currentChat?.id] || [];
        
        if (messages.length === 0) {
            return `
                <div class="wa-messages-empty">
                    <p>Nenhuma mensagem ainda</p>
                    <p>Inicie uma conversa!</p>
                </div>
            `;
        }

        return messages.map(message => `
            <div class="wa-message ${message.isOutgoing ? 'outgoing' : 'incoming'}">
                <div class="wa-message-content">
                    <div class="wa-message-text">${message.text}</div>
                    <div class="wa-message-time">${message.time}</div>
                </div>
            </div>
        `).join('');
    }

    getStatusText() {
        switch (this.whatsappStatus) {
            case 'paused': return 'Pausado - Ative via Settings';
            case 'starting': return 'Iniciando...';
            case 'qr_ready': return 'QR Code pronto';
            case 'ready': return 'Pronto para uso';
            case 'loading': return 'Carregando...';
            case 'authenticated': return 'Autenticado';
            case 'disconnected': return 'Desconectado';
            case 'error': return 'Erro de conexão';
            default: return 'Desconhecido';
        }
    }

    init() {
        console.log('🚀 Inicializando módulo WhatsApp...');
        this.initWhatsApp();
        
        // Garantir que o módulo esteja disponível globalmente
        window.whatsappModule = this;
        
        console.log('✅ Módulo WhatsApp inicializado e disponível globalmente');
    }

    destroy() {
        console.log('🛑 Destruindo módulo WhatsApp...');
        // Limpar recursos se necessário
    }

    // Funções do chat
    startChat(contactData) {
        console.log('💬 Iniciando chat com:', contactData);
        
        // Criar objeto de contato
        this.currentChat = {
            id: contactData.id,
            name: contactData.nome_cliente || 'Cliente',
            phone: contactData.telefone1 || contactData.telefone2 || '',
            status: 'online',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactData.nome_cliente || 'Cliente')}&background=25d366&color=fff&size=40`
        };
        
        // Inicializar mensagens se não existirem
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        
        // Atualizar interface
        this.updateInterface();
        
        console.log('✅ Chat iniciado com sucesso');
    }

    // Função chamada pelo módulo de produtividade
    createNewChat(phone, clientName) {
        console.log('💬 Criando novo chat:', clientName, phone);
        console.log('🔍 Estado atual do módulo:', this);
        
        // Criar objeto de contato
        this.currentChat = {
            id: `chat_${Date.now()}`,
            name: clientName,
            phone: phone,
            status: 'online',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=25d366&color=fff&size=40`
        };
        
        console.log('📱 Objeto de chat criado:', this.currentChat);
        
        // Inicializar mensagens se não existirem
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        
        console.log('💾 Mensagens inicializadas para chat:', this.currentChat.id);
        
        // Atualizar interface
        console.log('🔄 Atualizando interface...');
        this.updateInterface();
        
        console.log('✅ Novo chat criado com sucesso');
        console.log('🎯 Chat atual:', this.currentChat);
    }

    closeChat() {
        console.log('🛑 Fechando chat');
        this.currentChat = null;
        this.updateInterface();
    }

    sendMessage() {
        const input = document.querySelector('.wa-message-text');
        if (!input || !this.currentChat) return;
        
        const text = input.value.trim();
        if (!text) return;
        
        // Adicionar mensagem
        const message = {
            text: text,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: true
        };
        
        this.messages[this.currentChat.id].push(message);
        
        // Limpar input
        input.value = '';
        
        // Atualizar interface
        this.updateInterface();
        
        // Simular resposta automática após 2 segundos
        setTimeout(() => {
            this.simulateResponse();
        }, 2000);
    }

    simulateResponse() {
        if (!this.currentChat) return;
        
        const responses = [
            "Obrigado pelo contato!",
            "Vou verificar isso para você.",
            "Entendi, vou processar sua solicitação.",
            "Aguarde um momento, estou verificando.",
            "Sua solicitação foi registrada com sucesso."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const message = {
            text: randomResponse,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: false
        };
        
        this.messages[this.currentChat.id].push(message);
        this.updateInterface();
    }

    handleMessageKeyPress(event) {
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    }

    toggleEmojiPicker() {
        console.log('Emoji picker:', 'funcionalidade em desenvolvimento');
    }

    toggleAttachmentMenu() {
        console.log('Menu de anexos:', 'funcionalidade em desenvolvimento');
    }

    updateInterface() {
        console.log('🔄 Atualizando interface do WhatsApp...');
        
        // Atualizar o conteúdo do módulo usando a função do main.js
        if (window.app && window.app.currentModule === 'whatsapp') {
            window.app.loadModule('whatsapp');
        } else {
            // Fallback: atualizar diretamente o conteúdo
            const moduleContent = document.querySelector('.module-content');
            if (moduleContent) {
                moduleContent.innerHTML = this.render();
            } else {
                console.warn('⚠️ Elemento .module-content não encontrado');
            }
        }
        
        // Scroll para última mensagem
        setTimeout(() => {
            const messagesContainer = document.querySelector('.wa-messages-container');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
        
        console.log('✅ Interface atualizada');
    }

    // Funções auxiliares
    searchContacts(query) {
        this.searchTerm = query.toLowerCase();
        this.filteredContacts = this.contacts.filter(contact =>
                    contact.name.toLowerCase().includes(this.searchTerm) ||
            contact.lastMessage?.toLowerCase().includes(this.searchTerm)
        );
        this.updateContactsList();
    }

    selectContact(contactId) {
        this.currentChat = this.contacts.find(c => c.id === contactId);
        this.updateChatInterface();
    }

    sendMessage() {
        const input = document.querySelector('.wa-message-text');
        const text = input?.value?.trim();
        
        if (!text || !this.currentChat) return;

        const message = {
            id: Date.now(),
            text: text,
            time: new Date().toLocaleTimeString(),
            isOutgoing: true
        };
        
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        
        this.messages[this.currentChat.id].push(message);
        input.value = '';
        
        this.updateChatInterface();
    }

    handleMessageKeyPress(event) {
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    }

    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
        // Implementar emoji picker
    }

    toggleAttachmentMenu() {
        this.showAttachmentMenu = !this.showAttachmentMenu;
        // Implementar menu de anexos
    }

    updateContactsList() {
        const contactsList = document.querySelector('.wa-contacts-list');
        if (contactsList) {
            contactsList.innerHTML = this.renderContactsList();
        }
    }

    updateChatInterface() {
        const chatContainer = document.querySelector('.wa-chat-container');
        if (chatContainer) {
            chatContainer.innerHTML = this.renderChatInterface();
        }
    }

    showError(message) {
        console.error(message);
        // Implementar notificação de erro
    }
}

// Adiciona estilos específicos do módulo WhatsApp
const whatsappStyles = `
    /* Chat WhatsApp Web */
    .wa-chat-container {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 120px);
        background: #f0f0f0;
    }

    .wa-chat-header {
        background: #075e54;
        color: white;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .wa-chat-contact img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .wa-chat-info {
        flex: 1;
    }

    .wa-chat-name {
        font-weight: bold;
        font-size: 16px;
    }

    .wa-chat-status {
        font-size: 12px;
        opacity: 0.8;
    }

    .wa-messages-container {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background: #e5ddd5;
    }

    .wa-messages-empty {
        text-align: center;
        color: #666;
        margin-top: 50px;
    }

    .wa-message {
        margin-bottom: 10px;
        display: flex;
    }

    .wa-message.outgoing {
        justify-content: flex-end;
    }

    .wa-message.incoming {
        justify-content: flex-start;
    }

    .wa-message-content {
        max-width: 70%;
        padding: 10px 15px;
        border-radius: 15px;
        position: relative;
    }

    .wa-message.outgoing .wa-message-content {
        background: #dcf8c6;
        color: #000;
    }

    .wa-message.incoming .wa-message-content {
        background: white;
        color: #000;
    }

    .wa-message-text {
        margin-bottom: 5px;
        word-wrap: break-word;
    }

    .wa-message-time {
        font-size: 11px;
        opacity: 0.7;
        text-align: right;
    }

    .wa-message-input {
        background: #f0f0f0;
        padding: 15px;
        border-top: 1px solid #ddd;
    }

    .wa-input-container {
        display: flex;
        align-items: center;
        gap: 10px;
        background: white;
        border-radius: 25px;
        padding: 8px 15px;
    }

    .wa-attachment-btn,
    .wa-emoji-btn,
    .wa-send-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: background 0.2s;
    }

    .wa-attachment-btn:hover,
    .wa-emoji-btn:hover {
        background: #f0f0f0;
    }

    .wa-send-btn {
        background: #25d366;
        color: white;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wa-send-btn:hover {
        background: #128c7e;
    }

    .wa-message-text {
        flex: 1;
        border: none;
        outline: none;
        font-size: 14px;
        padding: 8px 0;
    }

    .btn-close-chat {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: background 0.2s;
    }

    .btn-close-chat:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .wa-sidebar {
        width: 350px;
        background: white;
        border-right: 1px solid #e0e0e0;
        display: flex;
        flex-direction: column;
    }

    .wa-search-container {
        padding: 10px;
        border-bottom: 1px solid #e0e0e0;
    }

    .wa-search-box {
        display: flex;
        align-items: center;
        background: #f5f5f5;
        border-radius: 8px;
        padding: 8px 12px;
    }

    .wa-search-icon {
        color: #666;
        margin-right: 8px;
    }

    .wa-search-input {
        border: none;
        background: transparent;
        flex: 1;
        outline: none;
        font-size: 14px;
    }

    .wa-chats-list {
        flex: 1;
        overflow-y: auto;
    }

    .wa-chat-item {
        display: flex;
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .wa-chat-item:hover {
        background: #f8f9fa;
    }

    .wa-chat-item.active {
        background: #e3f2fd;
    }

    .wa-chat-avatar {
        position: relative;
        margin-right: 12px;
    }

    .avatar-placeholder {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #25d366;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 18px;
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
        background: #4caf50;
    }

    .wa-chat-status.offline {
        background: #ccc;
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
        font-size: 14px;
        color: #333;
    }

    .wa-chat-time {
        font-size: 12px;
        color: #666;
    }

    .wa-chat-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .wa-chat-message {
        font-size: 13px;
        color: #666;
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
    }

    .wa-chat-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #efeae2;
    }

    .wa-chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .wa-chat-header {
        background: white;
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .wa-chat-contact {
        display: flex;
        align-items: center;
    }

    .wa-chat-details {
        margin-left: 12px;
    }

    .wa-chat-status-text {
        font-size: 12px;
        color: #666;
    }

    .wa-messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column-reverse; /* Mensagens mais recentes no topo */
    }

    .wa-message {
        margin-top: 8px; /* Mudança de margin-bottom para margin-top */
        display: flex;
    }

    .wa-message.incoming {
        justify-content: flex-start;
    }

    .wa-message.outgoing {
        justify-content: flex-end;
    }

    .wa-message-content {
        max-width: 65%;
        padding: 8px 12px;
        border-radius: 8px;
        position: relative;
    }

    .wa-message.incoming .wa-message-content {
        background: white;
        color: #333;
    }

    .wa-message.outgoing .wa-message-content {
        background: #dcf8c6;
        color: #333;
    }

    .wa-message-text {
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
    }

    .wa-message-time {
        font-size: 11px;
        color: #666;
        margin-top: 4px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }

    .wa-message-status {
        margin-left: 4px;
        color: #34b7f1;
    }

    .wa-input-container {
        background: white;
        padding: 12px 16px;
        border-top: 1px solid #e0e0e0;
    }

    .wa-input-wrapper {
        display: flex;
        align-items: flex-end;
        gap: 8px;
    }

    .wa-input-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: background-color 0.2s;
        font-size: 20px;
    }

    .wa-input-btn:hover {
        background: #f0f0f0;
    }

    .wa-input-box {
        flex: 1;
        background: #f0f0f0;
        border-radius: 20px;
        padding: 8px 12px;
    }

    .wa-message-input {
        border: none;
        background: transparent;
        outline: none;
        resize: none;
        width: 100%;
        font-size: 14px;
        line-height: 1.4;
        max-height: 120px;
    }

    .wa-send-btn {
        background: #25d366;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        font-size: 18px;
        font-weight: bold;
    }

    .wa-send-btn:hover {
        background: #128c7e;
    }

    .wa-welcome-screen {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: #efeae2;
    }

    .wa-welcome-content {
        text-align: center;
        color: #666;
    }

    .wa-welcome-icon {
        margin-bottom: 24px;
        color: #25d366;
        font-size: 64px;
    }

    .wa-welcome-content h1 {
        margin-bottom: 16px;
        color: #333;
    }

    .wa-welcome-content p {
        margin-bottom: 24px;
        font-size: 16px;
    }

    .wa-empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }

    .wa-empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }

    .wa-empty-chat {
        text-align: center;
        padding: 40px 20px;
        color: #666;
    }

    .wa-empty-chat-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }

    .wa-welcome-screen {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: #f8f9fa;
    }

    .wa-welcome-content {
        text-align: center;
        padding: 2rem;
        max-width: 400px;
    }

    .wa-welcome-icon {
        font-size: 64px;
        margin-bottom: 1rem;
    }

    .wa-welcome-content h1 {
        color: #333;
        margin-bottom: 1rem;
        font-size: 1.5rem;
    }

    .wa-welcome-content p {
        color: #666;
        margin-bottom: 2rem;
        line-height: 1.5;
    }

    .wa-welcome-stats {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 2rem;
    }

    .wa-stat {
        text-align: center;
    }

    .wa-stat-number {
        display: block;
        font-size: 2rem;
        font-weight: bold;
        color: #25d366;
    }

    .wa-stat-label {
        font-size: 0.9rem;
        color: #666;
    }

    .emoji-panel {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        margin-top: 8px;
    }

    .emoji-item {
        cursor: pointer;
        font-size: 20px;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .emoji-item:hover {
        background: #f0f0f0;
    }

    .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .status-indicator.connected {
        background: #4caf50;
    }

    .status-indicator.disconnected {
        background: #f44336;
    }

    .status-text {
        font-size: 12px;
        color: #666;
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-radius: 8px;
        color: white;
        min-width: 300px;
    }

    .notification-success {
        background: #28a745;
    }

    .notification-error {
        background: #dc3545;
    }

    .notification-warning {
        background: #ffc107;
        color: #212529;
    }

    .notification-info {
        background: #17a2b8;
    }

    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.2rem;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .qr-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .qr-modal-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
        width: 90%;
    }

    .qr-modal-content img {
        max-width: 100%;
        height: auto;
        margin: 1rem 0;
    }

    .qr-modal-content button {
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1rem;
    }

    .whatsapp-control-panel {
        background: #f8f9fa;
        padding: 15px 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
    }

    .control-info {
        flex: 1;
        font-size: 0.9rem;
        color: #666;
    }

    .control-buttons {
        display: flex;
        gap: 10px;
    }

    .warning-message {
        background: #fff3cd;
        color: #856404;
        padding: 10px 15px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
    }

    .warning-icon {
        color: #ffeeba;
        background: #856404;
        padding: 5px;
        border-radius: 50%;
        font-size: 1.1rem;
    }

    .qr-container {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        text-align: center;
        margin: 15px;
        display: none; /* Ocultar por padrão */
    }

    .qr-header h3 {
        color: #333;
        margin-bottom: 10px;
    }

    .qr-code img {
        max-width: 100%;
        height: auto;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        margin-bottom: 15px;
    }

    .qr-instructions {
        font-size: 0.8rem;
        color: #666;
        line-height: 1.5;
    }

    .qr-instructions p {
        margin-bottom: 10px;
    }

    .qr-instructions ol {
        padding-left: 20px;
    }

    .qr-instructions li {
        margin-bottom: 5px;
    }

    .status-value.paused {
        color: #6c757d;
    }

    .status-value.starting {
        color: #ffc107;
    }

    .status-value.qr_ready {
        color: #17a2b8;
    }

    .status-value.ready {
        color: #28a745;
    }

    .status-value.loading {
        color: #ffc107;
    }

    .status-value.authenticated {
        color: #17a2b8;
    }

    .status-value.disconnected {
        color: #dc3545;
    }

    .status-value.error {
        color: #dc3545;
    }
`;

// Adiciona os estilos ao documento
if (!document.getElementById('whatsapp-styles')) {
    const style = document.createElement('style');
    style.id = 'whatsapp-styles';
    style.textContent = whatsappStyles;
    document.head.appendChild(style);
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatsAppModule;
}

// Variável global para acesso direto
window.whatsappModule = new WhatsAppModule();
