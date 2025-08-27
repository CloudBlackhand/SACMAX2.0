// Módulo WhatsApp - Interface em tempo real como WhatsApp Web

class WhatsAppModule {
    constructor() {
        this.contacts = [];
        this.currentChat = null;
        this.messages = {};
        this.isConnected = false;
        this.typingUsers = new Set();
        this.unreadCounts = {};
        this.searchTerm = '';
        this.filteredContacts = [];
        this.showEmojiPicker = false;
        this.showAttachmentMenu = false;
        this.sessionName = 'sacmax';
        this.qrCode = null;
        this.sessionStatus = 'disconnected';
        
        // WebSocket
        this.ws = null;
        this.wsReconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Configuração para Railway - usar proxy do backend
        this.whatsappPort = 3002;
        this.whatsappUrl = window.location.origin; // Usar o mesmo domínio do frontend
        
        // Inicializar WhatsApp
        this.initWhatsApp();

        // NOVO: Estado controlado
        this.whatsappStatus = 'paused';
        this.isWhatsAppEnabled = false;
    }

    async initWhatsApp() {
        try {
            // Detectar porta do WhatsApp
            await this.detectWhatsAppPort();
            
            // Conectar WebSocket
            this.connectWebSocket();
            
            // Verificar status do WhatsApp
            await this.checkWhatsAppStatus();
            
            // Só iniciar sessão se não estiver conectado e não estiver tentando conectar
            if (!this.isConnected && this.sessionStatus !== 'qr_ready') {
                await this.startWhatsAppSession();
            }
        } catch (error) {
            console.error('Erro ao inicializar WhatsApp:', error);
        }
    }

    async detectWhatsAppPort() {
        try {
            console.log('🔍 Detectando porta do WhatsApp...');
            
            // Usar proxy do backend
            const baseUrl = window.location.origin;
            
            try {
                const response = await fetch(`${baseUrl}/api/whatsapp/status`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                
                if (response.ok) {
                    console.log(`✅ WhatsApp detectado via proxy em ${baseUrl}`);
                    return;
                }
            } catch (error) {
                console.log('⚠️ WhatsApp não respondeu via proxy');
            }
            
            console.log('⚠️ WhatsApp não detectado');
        } catch (error) {
            console.error('Erro ao detectar porta do WhatsApp:', error);
        }
    }

    connectWebSocket() {
        try {
            // Fechar conexão existente se houver
            if (this.ws) {
                this.ws.close();
            }
            
            // Conectar ao WebSocket via proxy do backend
            const wsUrl = this.whatsappUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/whatsapp';
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log(`🔌 WebSocket conectado ao servidor WhatsApp na porta ${this.whatsappPort}`);
                this.wsReconnectAttempts = 0;
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Erro ao processar mensagem WebSocket:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket desconectado');
                this.handleWebSocketDisconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ Erro no WebSocket:', error);
            };
            
        } catch (error) {
            console.error('Erro ao conectar WebSocket:', error);
        }
    }

    handleWebSocketDisconnect() {
        if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
            this.wsReconnectAttempts++;
            console.log(`🔄 Tentativa de reconexão WebSocket ${this.wsReconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, 3000);
        } else {
            console.error('❌ Máximo de tentativas de reconexão WebSocket atingido');
        }
    }

    handleWebSocketMessage(data) {
        const { event, data: eventData } = data;
        
        switch (event) {
            case 'qr_ready':
                this.handleQRReady(eventData);
                break;
                
            case 'whatsapp_ready':
                this.handleWhatsAppReady(eventData);
                break;
                
            case 'authenticated':
                this.handleAuthenticated(eventData);
                break;
                
            case 'new_message':
                this.handleNewMessage(eventData);
                break;
                
            case 'message_sent':
                this.handleMessageSent(eventData);
                break;
                
            case 'disconnected':
                this.handleDisconnected(eventData);
                break;
                
            default:
                console.log('📨 Evento WebSocket não tratado:', event, eventData);
        }
    }

    handleQRReady(data) {
        console.log('📱 QR Code recebido via WebSocket');
        this.qrCode = data.qr;
        this.sessionStatus = 'qr_ready';
        
        // Só mostrar modal se não estiver já visível
        const existingModal = document.querySelector('.qr-modal');
        if (!existingModal) {
            this.showQRCodeModal();
        }
    }

    handleWhatsAppReady(data) {
        console.log('✅ WhatsApp pronto via WebSocket');
        this.isConnected = true;
        this.sessionStatus = 'connected';
        this.hideQRCodeModal();
        
        // NÃO carregar contatos do banco - usar apenas WebSocket
        // Inicializar lista vazia para conversas reais
        this.contacts = [];
        this.messages = {};
        this.updateContactsList();
        
        this.showSuccess('WhatsApp conectado com sucesso!');
    }

    // NOVO: Método para criar nova conversa via botão da Produtividade
    async createNewChat(phoneNumber, contactName = 'Cliente') {
        console.log(`💬 Criando nova conversa: ${contactName} (${phoneNumber})`);
        
        // Verificar se já existe conversa com este número
        const existingContact = this.contacts.find(c => c.phone === phoneNumber);
        if (existingContact) {
            console.log('✅ Conversa já existe, abrindo...');
            this.selectContact(existingContact.id);
            return existingContact.id;
        }
        
        // Criar novo contato
        const contactId = `contact_${Date.now()}`;
        const newContact = {
            id: contactId,
            name: contactName,
            phone: phoneNumber,
            lastMessage: 'Nova conversa iniciada',
            lastMessageTime: formatTime(new Date()),
            online: true,
            unreadCount: 0
        };
        
        // Adicionar à lista de contatos
        this.contacts.push(newContact);
        
        // Inicializar mensagens vazias
        this.messages[contactId] = [];
        
        // Atualizar interface
        this.updateContactsList();
        
        // Selecionar o novo chat
        this.selectContact(contactId);
        
        console.log(`✅ Nova conversa criada: ${contactName}`);
        return contactId;
    }

    handleAuthenticated(data) {
        console.log('🔐 WhatsApp autenticado via WebSocket');
        this.sessionStatus = 'authenticated';
    }

    handleNewMessage(data) {
        console.log('💬 Nova mensagem recebida via WebSocket:', data);
        
        // Criar ou atualizar contato
        const contactId = data.contactId;
        const contactName = data.contactName;
        const contactNumber = data.contactNumber;
        
        // Verificar se o contato já existe
        let contact = this.contacts.find(c => c.id === contactId);
        if (!contact) {
            contact = {
                id: contactId,
                name: contactName,
                phone: contactNumber,
                lastMessage: data.text,
                lastMessageTime: formatTime(new Date(data.timestamp)),
                online: true
            };
            this.contacts.push(contact);
        } else {
            contact.lastMessage = data.text;
                            contact.lastMessageTime = formatTime(new Date(data.timestamp));
        }
        
        // Adicionar mensagem ao chat
        if (!this.messages[contactId]) {
            this.messages[contactId] = [];
        }
        
        const message = {
            id: data.id,
            text: data.text,
                            time: formatTime(new Date(data.timestamp)),
            isOutgoing: false,
            timestamp: data.timestamp
        };
        
        this.messages[contactId].push(message);
        
        // Incrementar contador de não lidas se não for o chat atual
        if (this.currentChat?.id !== contactId) {
            this.unreadCounts[contactId] = (this.unreadCounts[contactId] || 0) + 1;
        }
        
        // Atualizar interface
        this.updateContactsList();
        
        // Se for o chat atual, atualizar área de chat
        if (this.currentChat?.id === contactId) {
            this.updateChatArea();
            this.scrollToBottom();
        }
        
        // Notificar nova mensagem
        this.showNotification(`Nova mensagem de ${contactName}: ${data.text}`, 'info');
    }

    handleMessageSent(data) {
        console.log('📤 Mensagem enviada via WebSocket:', data);
        
        const contactId = data.contactId;
        
        if (this.messages[contactId]) {
            // Atualizar status da última mensagem enviada
            const lastMessage = this.messages[contactId].find(m => m.isOutgoing && !m.status);
            if (lastMessage) {
                lastMessage.status = 'sent';
            }
            
            // Atualizar interface
            this.updateChatArea();
        }
    }

    handleDisconnected(data) {
        console.log('🔌 WhatsApp desconectado via WebSocket');
        this.isConnected = false;
        this.sessionStatus = 'disconnected';
        this.showWarning('WhatsApp desconectado. Tentando reconectar...');
    }

    async checkWhatsAppStatus() {
        try {
            // Verificar se o backend está funcionando
            const response = await fetch('http://localhost:5000/health');
            if (response.ok) {
                this.isConnected = true;
                this.sessionStatus = 'connected';
                console.log('✅ Backend conectado');
            } else {
                this.isConnected = false;
                this.sessionStatus = 'disconnected';
                console.log('⚠️ Backend não disponível');
            }
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            this.isConnected = false;
            this.sessionStatus = 'disconnected';
        }
    }

    async startWhatsAppSession() {
        try {
            // Verificar se já está tentando conectar
            if (this.sessionStatus === 'qr_ready' || this.sessionStatus === 'initializing') {
                console.log('⚠️ Já tentando conectar, ignorando nova tentativa');
                return;
            }
            
            console.log('Iniciando sessão WhatsApp...');
            this.sessionStatus = 'initializing';
            
            const response = await fetch(`${this.whatsappUrl}/api/sessions/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionName: this.sessionName })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Sessão iniciada:', result);
            } else {
                console.error('Erro ao iniciar sessão:', result);
                this.sessionStatus = 'disconnected';
            }
        } catch (error) {
            console.error('Erro ao iniciar sessão WhatsApp:', error);
            this.sessionStatus = 'disconnected';
        }
    }

    // REMOVIDO: loadRealContacts() - não usar banco de dados, apenas WebSocket
    // async loadRealContacts() {
    //     try {
    //         // Primeiro, carregar contatos do banco de dados (PRODUTIVIDADE)
    //         const response = await fetch('http://localhost:5000/api/productivity/contacts');
    //         if (response.ok) {
    //             const contacts = await response.json();
    //             
    //             // Converter para formato do WhatsApp
    //             this.contacts = contacts.map((contact, index) => ({
    //                 id: `contact_${index}`,
    //                 name: contact.nome_cliente || `Cliente ${index + 1}`,
    //                 phone: contact.telefone1 || contact.telefone2 || `55${Math.floor(Math.random() * 900000000) + 100000000}`,
    //                 lastMessage: 'Cliente do sistema SacsMax',
    //                 lastMessageTime: formatTime(new Date()),
    //                 online: true,
    //                 unreadCount: 0,
    //                 originalData: contact
    //             }));
    //             
    //             console.log(`✅ Carregados ${this.contacts.length} contatos do banco de dados`);
    //             this.updateContactsList();
    //             
    //             // Inicializar mensagens vazias para cada contato
    //             for (const contact of this.contacts) {
    //                 if (!this.messages[contact.id]) {
    //                         this.messages[contact.id] = [];
    //                     }
    //                 }
    //             } else {
    //                 console.error('Erro ao carregar contatos do banco:', response.status);
    //                 // Fallback: criar contatos de exemplo
    //                 // REMOVIDO: createSampleContacts() - não usar contatos de exemplo
    //             }
    //         } catch (error) {
    //             console.error('Erro ao carregar contatos reais:', error);
    //             // REMOVIDO: createSampleContacts() - não usar contatos de exemplo
    //         }
    //     }

    async loadMessagesForContact(contactId) {
        try {
            // Para conversas reais, não criar mensagem inicial automática
            if (!this.messages[contactId]) {
                this.messages[contactId] = [];
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        }
    }

    // REMOVIDO: createSampleContacts() - não usar contatos de exemplo
    // createSampleContacts() {
    //     this.contacts = [
    //         {
    //             id: 'contact_1',
    //             name: 'João Silva',
    //             phone: '5511999999999',
    //             lastMessage: 'Olá! Preciso de ajuda com meu plano',
    //             lastMessageTime: formatTime(new Date()),
    //             online: true,
    //             unreadCount: 0
    //         },
    //         {
    //             id: 'contact_2',
    //             name: 'Maria Santos',
    //             phone: '5511888888888',
    //             lastMessage: 'Quando vocês vão instalar meu serviço?',
    //             lastMessageTime: formatTime(new Date()),
    //             online: false,
    //             unreadCount: 2
    //         }
    //     ];
    //     
    //     // Inicializar mensagens para contatos de exemplo
    //     for (const contact of this.contacts) {
    //         this.messages[contact.id] = [{
    //             id: `msg_${Date.now()}_${contact.id}`,
    //             text: contact.lastMessage,
    //             time: contact.lastMessageTime,
    //             isOutgoing: false,
    //             timestamp: Date.now()
    //         }];
    //     }
    //     
    //     this.updateContactsList();
    // }

    showQRCodeModal() {
        // Remover modal existente se houver
        this.hideQRCodeModal();
        
        const modal = document.createElement('div');
        modal.className = 'qr-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <h3>Conecte seu WhatsApp</h3>
                <p>Escaneie o QR Code com seu WhatsApp</p>
                <img src="${this.qrCode}" alt="QR Code" />
                <p class="qr-status">Aguardando conexão...</p>
                <button class="btn btn-secondary" id="cancel-qr-btn">Cancelar</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Adicionar event listener para o botão cancelar
        const cancelBtn = document.getElementById('cancel-qr-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeQRModal();
            });
            }
    }

    hideQRCodeModal() {
        const modal = document.querySelector('.qr-modal');
        if (modal) {
            modal.remove();
        }
    }

    closeQRModal() {
        this.hideQRCodeModal();
        // Parar tentativas de conexão
        this.sessionStatus = 'disconnected';
        this.isConnected = false;
        
        // Fechar WebSocket se estiver aberto
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        
        console.log('❌ Conexão WhatsApp cancelada pelo usuário');
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">💬</span>
                    <h2 class="module-title">WhatsApp</h2>
                    <div class="connection-status">
                        <span class="status-indicator ${this.whatsappStatus === 'ready' ? 'connected' : 'disconnected'}"></span>
                        <span class="status-text">${this.getStatusText()}</span>
                    </div>
                </div>
                
                <!-- NOVO: Painel de controle -->
                <div class="whatsapp-control-panel">
                    <div class="control-info">
                        <p><strong>Status:</strong> ${this.getStatusText()}</p>
                        <p><strong>WhatsApp:</strong> ${this.isWhatsAppEnabled ? 'Ativado' : 'Desativado'}</p>
                    </div>
                    
                    <div class="control-buttons">
                        ${!this.isWhatsAppEnabled ? `
                            <div class="warning-message">
                                <span class="warning-icon">⚠️</span>
                                <span>WhatsApp não está ativado. Vá para Settings para ativar.</span>
                            </div>
                        ` : `
                            <button class="btn btn-primary" onclick="whatsappModule.generateQRCode()" id="generate-qr-btn" ${this.whatsappStatus === 'ready' ? 'disabled' : ''}>
                                <span class="btn-icon">📱</span>
                                Gerar QR Code
                            </button>
                        `}
                    </div>
                </div>

                <!-- QR Code Container -->
                <div class="qr-container" id="qr-container" style="display: ${this.whatsappStatus === 'qr_ready' ? 'block' : 'none'};">
                    <div class="qr-header">
                        <h3>📱 Escaneie o QR Code</h3>
                        <p>Abra o WhatsApp no seu celular e escaneie o código abaixo</p>
                    </div>
                    <div class="qr-code" id="qr-code">
                        <!-- QR Code será inserido aqui -->
                    </div>
                    <div class="qr-instructions">
                        <p><strong>Como escanear:</strong></p>
                        <ol>
                            <li>Abra o WhatsApp no seu celular</li>
                            <li>Vá em Configurações > Aparelhos conectados</li>
                            <li>Toque em "Conectar um aparelho"</li>
                            <li>Aponte a câmera para o QR Code</li>
                        </ol>
                        <p><strong>Importante:</strong> Após escanear, o sistema ficará conectado 24/7!</p>
                    </div>
                </div>

                <!-- Interface de chat (quando conectado) -->
                ${this.whatsappStatus === 'ready' ? this.renderChatInterface() : ''}

            </div>
        `;
    }

    renderContactsList() {
        const contacts = this.filteredContacts.length > 0 ? this.filteredContacts : this.contacts;
        
        if (contacts.length === 0) {
            return `
                <div class="wa-empty-state">
                    <div class="wa-empty-icon">💬</div>
                    <h3>Nenhuma conversa</h3>
                    <p>${this.isConnected ? 'Nenhuma conversa encontrada' : 'Conecte o WhatsApp para ver suas conversas'}</p>
                </div>
            `;
        }

        return contacts.map(contact => `
            <div class="wa-chat-item ${this.currentChat?.id === contact.id ? 'active' : ''}" 
                 data-contact-id="${contact.id}">
                <div class="wa-chat-avatar">
                    <div class="avatar-placeholder">${contact.name.charAt(0).toUpperCase()}</div>
                    <div class="wa-chat-status ${contact.online ? 'online' : 'offline'}"></div>
                </div>
                <div class="wa-chat-info">
                    <div class="wa-chat-header">
                        <div class="wa-chat-name">${contact.name}</div>
                        <div class="wa-chat-time">${contact.lastMessageTime || ''}</div>
                </div>
                    <div class="wa-chat-preview">
                        <div class="wa-chat-message">${contact.lastMessage || 'Nenhuma mensagem'}</div>
                    ${this.unreadCounts[contact.id] ? `
                            <div class="wa-unread-badge">${this.unreadCounts[contact.id]}</div>
                    ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderChatArea() {
        const contact = this.currentChat;
        const messages = this.messages[contact.id] || [];
        
        return `
            <div class="wa-chat-container">
                <!-- Chat Header -->
                <div class="wa-chat-header">
                    <div class="wa-chat-contact">
                        <div class="wa-chat-avatar">
                            <div class="avatar-placeholder">${contact.name.charAt(0).toUpperCase()}</div>
                    </div>
                        <div class="wa-chat-details">
                            <div class="wa-chat-name">${contact.name}</div>
                            <div class="wa-chat-status-text">
                                ${contact.online ? 'online' : 'offline'}
                                ${this.typingUsers.has(contact.id) ? ' - digitando...' : ''}
                        </div>
                    </div>
                </div>
            </div>
            
                <!-- Messages Area -->
                <div class="wa-messages-container" id="chat-messages">
                ${this.renderMessages(messages)}
            </div>
            
                <!-- Input Area -->
                <div class="wa-input-container">
                    <div class="wa-input-wrapper">
                        <button class="wa-input-btn" onclick="whatsappModule.toggleEmojiPicker()">
                            😊
                        </button>
                        <div class="wa-input-box">
                            <textarea class="wa-message-input" 
                              id="message-input"
                                      placeholder="Digite uma mensagem"
                              rows="1"></textarea>
                        </div>
                        <button class="wa-send-btn" onclick="whatsappModule.sendMessage()">
                            ➤
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderWelcomeScreen() {
        return `
            <div class="wa-welcome-screen">
                <div class="wa-welcome-content">
                    <div class="wa-welcome-icon">💬</div>
                    <h1>SACMAX - WhatsApp</h1>
                    <p>Selecione uma conversa para começar a enviar mensagens</p>
                    <div class="wa-welcome-stats">
                        <div class="wa-stat">
                            <span class="wa-stat-number">${this.contacts.length}</span>
                            <span class="wa-stat-label">Contatos</span>
                    </div>
                        <div class="wa-stat">
                            <span class="wa-stat-number">${Object.keys(this.messages).length}</span>
                            <span class="wa-stat-label">Conversas</span>
                        </div>
                        </div>
                </div>
            </div>
        `;
    }

    renderMessages(messages) {
        if (messages.length === 0) {
            return `
                <div class="wa-empty-chat">
                    <div class="wa-empty-chat-icon">💬</div>
                    <p>Nenhuma mensagem ainda</p>
                    <p>Envie uma mensagem para começar a conversa</p>
                </div>
            `;
        }

        // Ordenar mensagens por timestamp (mais recentes primeiro)
        const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);

        return sortedMessages.map(message => `
            <div class="wa-message ${message.isOutgoing ? 'outgoing' : 'incoming'}" data-message-id="${message.id}">
                    <div class="wa-message-content">
                    <div class="wa-message-text">${message.text}</div>
                        <div class="wa-message-time">
                        ${message.time}
                        ${message.isOutgoing ? `
                                <span class="wa-message-status">
                                ${message.status === 'sent' ? '✓' : ''}
                                ${message.status === 'delivered' ? '✓✓' : ''}
                                ${message.status === 'read' ? '✓✓' : ''}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async init() {
        this.setupEventListeners();
        
        // Carregar contatos automaticamente
        // await this.loadRealContacts(); // REMOVIDO - usar apenas WebSocket
        
        // Verificar status do WhatsApp
        await this.checkWhatsAppStatus();
    }

    destroy() {
        if (this.ws) {
            this.ws.close();
        }
    }

    setupEventListeners() {
        setTimeout(() => {
            this.setupSearch();
            this.setupMessageInput();
            this.setupContactClicks();
        }, 100);
    }

    setupContactClicks() {
        // Adicionar event listeners para cliques nos contatos
        const contactItems = document.querySelectorAll('.wa-chat-item');
        contactItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const contactId = item.getAttribute('data-contact-id');
                if (contactId) {
                    this.selectContact(contactId);
                }
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('contact-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.filterContacts();
            });
        }
    }

    setupMessageInput() {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            messageInput.addEventListener('input', (e) => {
                this.autoResizeTextarea(e.target);
            });
            
            // Focar no input quando o chat for carregado
            messageInput.focus();
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    updateContactsList() {
        const contactsList = document.getElementById('contacts-list');
        if (contactsList) {
            contactsList.innerHTML = this.renderContactsList();
            // Reconfigurar event listeners após atualizar a lista
            this.setupContactClicks();
        }
    }

    filterContacts() {
        const searchInput = document.getElementById('contact-search');
        if (searchInput) {
            this.searchTerm = searchInput.value.toLowerCase();
            
            if (this.searchTerm.trim() === '') {
                this.filteredContacts = [];
            } else {
        this.filteredContacts = this.contacts.filter(contact =>
                    contact.name.toLowerCase().includes(this.searchTerm) ||
                    contact.phone.includes(this.searchTerm) ||
                    contact.lastMessage.toLowerCase().includes(this.searchTerm)
        );
            }
        
        this.updateContactsList();
        }
    }

    async selectContact(contactId) {
        console.log(`🎯 Tentando selecionar contato: ${contactId}`);
        const contact = this.contacts.find(c => c.id === contactId);
        if (contact) {
            this.currentChat = contact;
        this.markAsRead(contactId);
            
            // Carrega mensagens se não existirem
            if (!this.messages[contactId]) {
            await this.loadMessagesForContact(contactId);
            }
            
        this.updateChatArea();
        this.scrollToBottom();
            
            console.log(`✅ Chat selecionado: ${contact.name}`);
        } else {
            console.error(`❌ Contato não encontrado: ${contactId}`);
        }
    }

    markAsRead(contactId) {
        this.unreadCounts[contactId] = 0;
        this.updateContactsList();
    }

    updateChatArea() {
        const chatArea = document.querySelector('.wa-chat-area');
        if (chatArea) {
            chatArea.innerHTML = this.currentChat ? this.renderChatArea() : this.renderWelcomeScreen();
            this.setupMessageInput();
            
            // Manter foco no input após atualizar
            setTimeout(() => {
                const messageInput = document.getElementById('message-input');
                if (messageInput) {
                    messageInput.focus();
                }
            }, 50);
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                // Com flex-direction: column-reverse, as mensagens mais recentes ficam no topo
                messagesContainer.scrollTop = 0;
            }
        }, 100);
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        if (!messageInput || !this.currentChat) return;

        const text = messageInput.value.trim();
        if (!text) return;

        const message = {
            id: Date.now().toString(),
            text: text,
            time: formatTime(new Date()),
            isOutgoing: true,
            status: 'sending',
            timestamp: Date.now()
        };

        // Adiciona mensagem à lista
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        this.messages[this.currentChat.id].push(message);

        // Limpa input e mantém foco
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.focus(); // Manter foco no input

        // Atualiza chat
        this.updateChatArea();
        this.scrollToBottom();

        // Garantir que o input mantenha o foco após enviar
        setTimeout(() => {
            const messageInput = document.getElementById('message-input');
            if (messageInput) {
                messageInput.focus();
            }
        }, 100);

                // Envia mensagem via backend
        try {
            const response = await fetch('http://localhost:5000/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionName: 'sacmax',
                    number: this.currentChat.phone,
                    text: text
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    message.status = 'sent';
                    console.log('✅ Mensagem enviada com sucesso via backend');
                    
                    // Atualizar última mensagem do contato
                    this.currentChat.lastMessage = text;
                    this.currentChat.lastMessageTime = message.time;
                    this.updateContactsList();
                } else {
                    console.error('❌ Erro ao enviar mensagem:', result.error);
                    message.status = 'error';
                }
            } else {
                console.error('❌ Erro ao enviar mensagem:', response.status);
                message.status = 'error';
            }
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            message.status = 'error';
            
            // Simular envio bem-sucedido para demonstração
        setTimeout(() => {
            message.status = 'sent';
                this.currentChat.lastMessage = text;
                this.currentChat.lastMessageTime = message.time;
                this.updateContactsList();
                this.updateChatArea();
        }, 1000);
        }

        // Analisar e salvar feedback automaticamente
        this.analyzeMessageAsFeedback(text);

        // Atualiza interface
        this.updateChatArea();
    }

    async analyzeMessageAsFeedback(text) {
        try {
            if (!this.currentChat) return;
            
            const feedbackData = {
                contact_name: this.currentChat.name,
                contact_phone: this.currentChat.phone,
                text: text,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch('http://localhost:5000/api/feedback/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('✅ Feedback analisado e salvo:', result.feedback.sentiment);
            } else {
                console.log('⚠️ Feedback não pôde ser salvo:', result.message);
            }
        } catch (error) {
            console.error('❌ Erro ao analisar feedback:', error);
        }
    }

    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
        
        if (this.showEmojiPicker) {
            this.showEmojiPanel();
        } else {
            this.hideEmojiPanel();
        }
    }

    showEmojiPanel() {
        const emojis = ['😊', '👍', '❤️', '😂', '😍', '😭', '😡', '🤔', '👏', '🙏', '🎉', '🔥', '💯', '✨', '🌟'];
        
        let emojiHTML = '<div class="emoji-panel">';
        emojis.forEach(emoji => {
            emojiHTML += `<span class="emoji-item" onclick="whatsappModule.insertEmoji('${emoji}')">${emoji}</span>`;
        });
        emojiHTML += '</div>';
        
        const inputContainer = document.querySelector('.wa-input-container');
        if (inputContainer) {
            const existingPanel = inputContainer.querySelector('.emoji-panel');
            if (existingPanel) {
                existingPanel.remove();
            }
            inputContainer.insertAdjacentHTML('beforeend', emojiHTML);
        }
    }

    hideEmojiPanel() {
        const emojiPanel = document.querySelector('.emoji-panel');
        if (emojiPanel) {
            emojiPanel.remove();
        }
    }

    insertEmoji(emoji) {
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            const cursorPos = messageInput.selectionStart;
            const textBefore = messageInput.value.substring(0, cursorPos);
            const textAfter = messageInput.value.substring(cursorPos);
            messageInput.value = textBefore + emoji + textAfter;
            messageInput.focus();
            messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        }
        this.hideEmojiPanel();
        this.showEmojiPicker = false;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
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

    // NOVO: Obter texto do status
    getStatusText() {
        if (!this.isWhatsAppEnabled) {
            return 'Desativado (Ative via Settings)';
        }
        
        switch (this.whatsappStatus) {
            case 'paused': return 'Pausado';
            case 'starting': return 'Iniciando...';
            case 'qr_ready': return 'QR Code Pronto';
            case 'ready': return 'Conectado 24/7';
            case 'loading': return 'Carregando...';
            case 'authenticated': return 'Autenticado';
            case 'disconnected': return 'Desconectado';
            case 'error': return 'Erro';
            default: return 'Desconhecido';
        }
    }

    // NOVO: Gerar QR Code
    async generateQRCode() {
        try {
            if (!this.isWhatsAppEnabled) {
                this.showError('WhatsApp não está ativado. Ative primeiro via Settings.');
                return;
            }

            const generateBtn = document.getElementById('generate-qr-btn');
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<span class="btn-icon">⏳</span> Gerando...';

            // Primeiro, solicitar geração do QR Code
            const response = await fetch(`${this.whatsappUrl}/api/whatsapp/generate-qr`, {
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
                }, 3000);
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

    // NOVO: Verificar QR Code
    async checkQRCode() {
        try {
            const response = await fetch(`${this.whatsappUrl}/api/whatsapp/qr`);
            const data = await response.json();

            if (data.success) {
                const qrContainer = document.getElementById('qr-container');
                qrContainer.style.display = 'block';
                document.getElementById('qr-code').innerHTML = `<img src="${data.qr}" alt="QR Code WhatsApp" />`;
                
                this.whatsappStatus = 'qr_ready';
                this.updateStatus();
                
                console.log('✅ QR Code exibido');
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
}

// Adiciona estilos específicos do módulo WhatsApp
const whatsappStyles = `
    .wa-main-container {
        display: flex;
        height: calc(100vh - 120px);
        background: #f0f0f0;
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
