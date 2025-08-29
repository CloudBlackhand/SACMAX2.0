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
        
        // Configuração WAHA
        this.wahaUrl = "https://waha-production-1c76.up.railway.app";
        this.sessionName = "default";
        
        // Polling para novas mensagens
        this.pollingInterval = null;
        this.pollingActive = false;
        this.lastMessageCheck = new Date();
        
        // Controle de mensagens já processadas (evitar duplicatas)
        this.processedMessages = new Set();
        
        // Configuração simplificada - Backend cuida da persistência
        this.cacheConfig = {
            maxCacheSize: 100, // Cache local limitado
            refreshInterval: 5000, // 5 segundos
            autoRefresh: true
        };

        // Inicializar
        this.init();
    }

    init() {
        console.log('🚀 Inicializando WhatsApp Web...');
        
        // Disponibilizar globalmente
        window.whatsappModule = this;
        
        // Verificar conexão e carregar chats
        this.initializeWaha();
        
        // Configurar eventos de página
        this.setupPageEvents();
        
        console.log('✅ WhatsApp Web inicializado');
    }

    destroy() {
        console.log('🔄 Destruindo WhatsApp Web...');
        
        // Parar polling
        this.stopPolling();
        
        // Limpar referência global
        if (window.whatsappModule === this) {
            window.whatsappModule = null;
        }
        
        console.log('✅ WhatsApp Web destruído');
    }

    async initializeWaha() {
        // Solicitar permissão para notificações
        await this.requestNotificationPermission();
        
        // Verificar conexão
        await this.checkConnection();
        
        // Carregar chats do backend
        await this.loadChatsFromBackend();
        
        // Iniciar polling para novas mensagens
        this.startPolling();
    }

    // Iniciar polling para novas mensagens
    startPolling() {
        if (this.pollingActive) return;
        
        console.log('🔄 Iniciando polling para novas mensagens...');
        this.pollingActive = true;
        
        this.pollingInterval = setInterval(async () => {
            await this.checkForNewMessages();
        }, this.cacheConfig.refreshInterval);
    }

    // Parar polling
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            this.pollingActive = false;
            console.log('⏹️ Polling parado');
        }
    }

    // Verificar novas mensagens
    async checkForNewMessages() {
        if (!this.pollingActive) return;
        
        try {
            console.log('🔄 Verificando novas mensagens...');
            
            // Buscar novas mensagens do backend
            const sinceParam = this.lastMessageCheck ? `?since=${this.lastMessageCheck.toISOString()}` : '';
            const url = `${SacsMaxConfig.backend.current}/api/whatsapp/new-messages${sinceParam}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.warn('⚠️ Resposta não OK:', response.status);
                return;
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                console.log(`📱 Encontradas ${data.count || data.data.length} novas mensagens`);
                
                // Processar cada mensagem nova
                data.data.forEach(message => {
                    this.processNewMessage(message);
                });
                
                // Atualizar interface
                this.updateInterface();
                
                // Confirmar que as mensagens foram processadas
                await this.confirmMessagesProcessed();
            }
            
            // Atualizar timestamp da última verificação
            this.lastMessageCheck = new Date();
            
        } catch (error) {
            console.error('❌ Erro ao verificar novas mensagens:', error);
        }
    }

    // Confirmar que as mensagens foram processadas
    async confirmMessagesProcessed() {
        try {
            const response = await fetch(`${SacsMaxConfig.backend.current}/api/whatsapp/confirm-messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message_ids: [] }) // Limpar toda a fila
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Mensagens confirmadas como processadas:', result);
            }
        } catch (error) {
            console.error('❌ Erro ao confirmar mensagens:', error);
        }
    }

    // Configurar eventos de página
    setupPageEvents() {
        console.log('📄 Configurando eventos de página...');
        
        // Salvar ao trocar de aba
        window.addEventListener('beforeunload', () => {
            console.log('💾 Salvando antes de sair da página...');
        });
        
        // Salvar quando a página fica oculta
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                console.log('💾 Salvando quando página fica oculta...');
            }
        });
        
        console.log('✅ Eventos de página configurados');
    }

    // Processar nova mensagem
    async processNewMessage(messageData) {
        try {
            console.log('📱 Processando nova mensagem:', messageData);
            
            // Extrair informações
            const chatId = `chat_${messageData.phone || messageData.chat_id || messageData.from || ''}`;
            const messageText = messageData.message || messageData.body || messageData.text || '';
            const senderName = messageData.senderName || messageData.notifyName || 'Desconhecido';
            const timestamp = messageData.received_at || messageData.timestamp || new Date().toISOString();
            
            if (!chatId || !messageText) {
                console.warn('⚠️ Mensagem sem chatId ou messageText:', messageData);
                return;
            }
            
            // Criar ID único
            const messageId = `${chatId}_${messageText}_${timestamp}`;
            
            // Verificar duplicatas
            if (this.processedMessages.has(messageId)) {
                console.log('🔄 Mensagem já processada, ignorando:', messageId);
                return;
            }
            
            this.processedMessages.add(messageId);
            
            // Criar ou atualizar chat
            await this.createOrUpdateChat(chatId, messageText, senderName, timestamp);
            
            // Adicionar mensagem ao histórico
            await this.addMessageToChat(chatId, {
                id: Date.now(),
                type: 'received',
                content: messageText,
                timestamp: new Date(timestamp).toLocaleTimeString('pt-BR'),
                sender: senderName,
                status: 'received',
                originalTimestamp: timestamp
            });
            
            // Mostrar notificação
            this.showNotification(senderName, messageText, chatId);
            
            console.log('✅ Nova mensagem processada:', { chatId, senderName, messageText });
            
        } catch (error) {
            console.error('❌ Erro ao processar nova mensagem:', error);
        }
    }

    // Criar ou atualizar chat
    async createOrUpdateChat(chatId, messageText, senderName, timestamp) {
        try {
            let chat = this.chats.get(chatId);
            const phone = chatId.replace('chat_', '');
            
            if (!chat) {
                // Criar novo chat
                chat = {
                    id: chatId,
                    name: senderName || phone,
                    phone: phone,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || phone)}&background=25d366&color=fff&size=40`,
                    status: 'online',
                    lastMessage: messageText,
                    lastMessageTime: new Date(timestamp).toLocaleTimeString('pt-BR'),
                    unreadCount: 1,
                    isPinned: false,
                    isMuted: false,
                    wahaId: phone,
                    createdAt: Date.now()
                };
                this.chats.set(chatId, chat);
                console.log('✅ Novo chat criado:', chat.name);
            } else {
                // Atualizar chat existente
                chat.lastMessage = messageText;
                chat.lastMessageTime = new Date(timestamp).toLocaleTimeString('pt-BR');
                chat.unreadCount = (chat.unreadCount || 0) + 1;
                chat.updatedAt = Date.now();
                console.log('📱 Chat atualizado:', chat.name);
            }
            
        } catch (error) {
            console.error('❌ Erro ao criar/atualizar chat:', error);
        }
    }

    // Adicionar mensagem ao chat
    async addMessageToChat(chatId, message) {
        try {
            let messages = this.messages.get(chatId) || [];
            
            // Evitar duplicatas
            const isDuplicate = messages.some(msg => 
                msg.content === message.content && 
                msg.timestamp === message.timestamp &&
                msg.type === message.type
            );
            
            if (!isDuplicate) {
                messages.push(message);
                
                // Limitar número de mensagens no cache local
                if (messages.length > this.cacheConfig.maxCacheSize) {
                    messages = messages.slice(-this.cacheConfig.maxCacheSize);
                }
                
                this.messages.set(chatId, messages);
                console.log(`💬 Mensagem adicionada ao chat ${chatId}: ${messages.length} mensagens totais`);
            }
            
        } catch (error) {
            console.error('❌ Erro ao adicionar mensagem:', error);
        }
    }

    // Carregar chats do backend
    async loadChatsFromBackend() {
        try {
            console.log('📱 Carregando chats do backend...');
            
            const response = await fetch(`${SacsMaxConfig.backend.current}/api/whatsapp/chats`);
            const data = await response.json();
            
            if (data.success && data.data && data.data.chats) {
                console.log(`📱 ${data.data.chats.length} chats carregados do backend`);
                
                // Processar chats do backend
                for (const backendChat of data.data.chats) {
                    const chatId = `chat_${backendChat.phone}`;
                    
                    const chat = {
                        id: chatId,
                        name: backendChat.name || backendChat.phone,
                        phone: backendChat.phone,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(backendChat.name || backendChat.phone)}&background=25d366&color=fff&size=40`,
                        status: 'online',
                        lastMessage: backendChat.last_message || 'Nova conversa',
                        lastMessageTime: backendChat.last_message_time ? new Date(backendChat.last_message_time).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR'),
                        unreadCount: backendChat.unread_count || 0,
                        isPinned: false,
                        wahaId: backendChat.phone,
                        messageCount: backendChat.message_count || 0
                    };
                    
                    this.chats.set(chatId, chat);
                }
                
                this.updateInterface();
                console.log('✅ Chats carregados do backend');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar chats do backend:', error);
        }
    }

    // Carregar mensagens de um chat específico do backend
    async loadChatMessages(chatId, limit = 100) {
        try {
            const chat = this.chats.get(chatId);
            if (!chat || !chat.phone) return;
            
            console.log(`📱 Carregando mensagens do chat ${chat.phone}...`);
            
            const response = await fetch(`${SacsMaxConfig.backend.current}/api/whatsapp/messages/${chat.phone}?limit=${limit}`);
            const data = await response.json();
            
            if (data.success && data.data && data.data.messages) {
                console.log(`📱 ${data.data.messages.length} mensagens carregadas do backend`);
                
                // Processar mensagens do backend
                const messages = data.data.messages.map(msg => ({
                    id: msg.id || Date.now(),
                    type: msg.type || 'received',
                    content: msg.content || msg.text || '',
                    timestamp: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR'),
                    sender: msg.sender || chat.name,
                    status: msg.status || 'received',
                    originalTimestamp: msg.timestamp
                }));
                
                this.messages.set(chatId, messages);
                
                // Atualizar última mensagem do chat
                if (messages.length > 0) {
                    const lastMsg = messages[messages.length - 1];
                    chat.lastMessage = lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? '...' : '');
                    chat.lastMessageTime = lastMsg.timestamp;
                }
                
                console.log('✅ Mensagens carregadas do backend');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar mensagens do backend:', error);
        }
    }

    async checkConnection() {
        try {
            // Verificar status do WAHA
            const response = await fetch(`${SacsMaxConfig.backend.current}/api/whatsapp/status`);
            const data = await response.json();
            
            this.isConnected = data.success && data.data.waha_status === 'connected';
            this.sessionStatus = this.isConnected ? 'connected' : 'disconnected';
            
            console.log('📱 Status WAHA:', data.data);
        } catch (error) {
            console.error('❌ Erro ao verificar conexão WAHA:', error);
            this.isConnected = false;
            this.sessionStatus = 'disconnected';
        }
    }

    // Verificar estatísticas do sistema
    async checkStats() {
        try {
            const response = await fetch(`${SacsMaxConfig.backend.current}/api/whatsapp/stats`);
            const data = await response.json();
            
            if (data.success) {
                console.log('📊 Estatísticas do sistema:', data.data);
                return data.data;
            }
        } catch (error) {
            console.error('❌ Erro ao verificar estatísticas:', error);
        }
        return null;
    }

    // Criar chat automaticamente quando mensagem for recebida
    createChatFromMessage(phone, message, senderName = null) {
        console.log('💬 Criando chat automático para:', phone, senderName);
        
        const chatId = `chat_${phone}`;
        
        // Verificar se o chat já existe
        if (this.chats.has(chatId)) {
            console.log('📱 Chat já existe, atualizando última mensagem');
            const existingChat = this.chats.get(chatId);
            existingChat.lastMessage = message;
            existingChat.lastMessageTime = new Date().toLocaleTimeString('pt-BR');
            existingChat.unreadCount = (existingChat.unreadCount || 0) + 1;
            this.chats.set(chatId, existingChat);
        } else {
            // Criar novo chat
            const newChat = {
                id: chatId,
                name: senderName || phone,
                phone: phone,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || phone)}&background=25d366&color=fff&size=40`,
                status: 'online',
                lastMessage: message,
                lastMessageTime: new Date().toLocaleTimeString('pt-BR'),
                unreadCount: 1,
                isPinned: false,
                wahaId: phone
            };
            
            this.chats.set(chatId, newChat);
            
            // Adicionar mensagem recebida
            const messages = [{
                id: Date.now(),
                type: 'received',
                content: message,
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                sender: senderName || phone,
                status: 'received'
            }];
            
            this.messages.set(chatId, messages);
            console.log('✅ Chat criado automaticamente:', newChat.name);
        }
        
        this.updateInterface();
    }

    // Criar chat de teste para demonstração
    createTestChat(phone, clientName) {
        console.log('💬 Criando chat de teste:', clientName, phone);
        
        const chatId = `chat_${phone}`;
        
        // Verificar se o chat já existe
        if (this.chats.has(chatId)) {
            console.log('📱 Chat de teste já existe');
            return;
        }
        
        const newChat = {
            id: chatId,
            name: clientName || 'Teste',
            phone: phone,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName || 'Teste')}&background=25d366&color=fff&size=40`,
            status: 'online',
            lastMessage: 'Mensagem de teste enviada',
            lastMessageTime: new Date().toLocaleTimeString('pt-BR'),
            unreadCount: 0,
            isPinned: false,
            wahaId: phone // Usar o telefone como ID do WAHA
        };
        
        this.chats.set(chatId, newChat);
        
        // Inicializar mensagens
        const initialMessages = [
            {
                id: Date.now(),
                type: 'sent',
                content: 'Teste do SacsMax - Sistema funcionando! 🚀',
                timestamp: new Date().toLocaleTimeString('pt-BR'),
                sender: 'Você',
                status: 'sent'
            }
        ];
        
        this.messages.set(chatId, initialMessages);
        
        // Atualizar interface
        this.updateInterface();
        
        console.log('✅ Chat de teste criado');
    }

    // Função chamada pelo módulo de produtividade ou feedback
    createNewChat(phone, clientName = 'Cliente') {
        console.log('💬 Criando novo chat:', clientName, phone);
        
        if (!phone) {
            console.error('❌ Erro: Telefone não fornecido');
            return;
        }
        
        // Normalizar telefone (remover espaços, traços, etc.)
        phone = phone.replace(/\s+/g, '').replace(/-/g, '');
        
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
            isMuted: false,
            wahaId: phone // Importante para enviar mensagens
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
        
        // Abrir o chat
        this.openChat(chatId);
        
        console.log('✅ Novo chat criado e aberto:', chatId);
    }

    // Abrir chat existente
    async openChat(chatId) {
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
        
        // Carregar mensagens do backend se disponível
        if (chat.phone) {
            await this.loadChatMessages(chatId);
        }
        
        // Marcar chat como lido no backend
        if (chat.phone && chat.unreadCount > 0) {
            try {
                const response = await fetch(`${SacsMaxConfig.backend.current}/api/whatsapp/mark-read`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phone: chat.phone })
                });
                
                if (response.ok) {
                    chat.unreadCount = 0;
                    console.log('✅ Chat marcado como lido no backend:', chat.name);
                }
            } catch (error) {
                console.error('❌ Erro ao marcar chat como lido:', error);
            }
        }
        
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
    async sendMessage(content) {
        if (!content.trim() || !this.currentChat) return;

        const chatId = this.currentChat.id;
        const messages = this.messages.get(chatId) || [];
        
        // Adicionar mensagem enviada localmente
        const sentMessage = {
            id: Date.now(),
            type: 'sent',
            content: content.trim(),
            timestamp: new Date().toLocaleTimeString('pt-BR'),
            sender: 'Você',
            status: 'sending'
        };
        
        messages.push(sentMessage);
        this.messages.set(chatId, messages);
        
        // Atualizar último status do chat
        this.currentChat.lastMessage = content.trim();
        this.currentChat.lastMessageTime = sentMessage.timestamp;
        this.chats.set(chatId, this.currentChat);
        
        // Atualizar interface
        this.updateInterface();
        
        // Enviar mensagem via backend
        try {
            const response = await fetch(`${SacsMaxConfig.backend.current}/api/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: this.currentChat.phone,
                    message: content.trim(),
                    message_type: 'text'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Atualizar status da mensagem
                sentMessage.status = 'sent';
                console.log('✅ Mensagem enviada via backend');
                
                // Limpar o input
                const inputElement = document.querySelector('.wa-message-input');
                if (inputElement) {
                    inputElement.value = '';
                }
            } else {
                sentMessage.status = 'error';
                console.error('❌ Erro ao enviar mensagem:', result.error);
            }
            
            this.updateInterface();
            
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            sentMessage.status = 'error';
            this.updateInterface();
        }
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

    // Limpar dados
    clearData() {
        console.log('🗑️ Limpando dados do WhatsApp...');
        
        // Parar polling
        this.stopPolling();
        
        // Limpar estado
        this.currentChat = null;
        this.chats.clear();
        this.messages.clear();
        
        // Atualizar interface
        this.updateInterface();
        
        console.log('✅ Dados limpos');
    }

    // Solicitar permissão para notificações
    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        console.log('✅ Permissão para notificações concedida');
                        
                        // Mostrar notificação de teste
                        new Notification('SacsMax WhatsApp', {
                            body: 'Notificações ativadas! Você receberá alertas de novas mensagens.',
                            icon: '/static/images/whatsapp-icon.png'
                        });
                    } else {
                        console.warn('⚠️ Permissão para notificações negada');
                    }
                } catch (error) {
                    console.error('❌ Erro ao solicitar permissão para notificações:', error);
                }
            } else if (Notification.permission === 'granted') {
                console.log('✅ Permissão para notificações já concedida');
            }
        } else {
            console.warn('⚠️ Notificações não suportadas neste navegador');
        }
    }
    
    // Mostrar notificação de nova mensagem
    showNotification(senderName, messageText, chatId) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`Nova mensagem de ${senderName}`, {
                body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
                icon: '/static/images/whatsapp-icon.png',
                badge: '/static/images/whatsapp-badge.png',
                tag: `whatsapp-${chatId}`, // Evita notificações duplicadas
                requireInteraction: false,
                silent: false
            });
            
            // Fechar notificação automaticamente após 5 segundos
            setTimeout(() => {
                notification.close();
            }, 5000);
            
            // Ao clicar na notificação, focar no chat
            notification.onclick = () => {
                window.focus();
                // Selecionar o chat correspondente
                const chatElement = document.querySelector(`[data-chat-id="chat_${chatId}"]`);
                if (chatElement) {
                    chatElement.click();
                }
                notification.close();
            };
        }
    }

    // Destruir módulo
    destroy() {
        console.log('🛑 Destruindo módulo WhatsApp...');
        
        // Parar polling
        this.stopPolling();
        
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
