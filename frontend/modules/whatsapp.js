// Módulo WhatsApp - Interface de chat e gerenciamento de mensagens

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
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">💬</span>
                    <h2 class="module-title">WhatsApp</h2>
                    <div class="connection-status">
                        <span class="status-indicator ${this.isConnected ? 'online' : 'offline'}"></span>
                        <span class="status-text">${this.isConnected ? 'Conectado' : 'Desconectado'}</span>
                    </div>
                </div>
                
                <div class="whatsapp-container">
                    <!-- Sidebar com Lista de Contatos -->
                    <div class="whatsapp-sidebar">
                        <!-- Header da Sidebar -->
                        <div class="sidebar-header">
                            <div class="search-container">
                                <input type="text" 
                                       class="search-input" 
                                       id="contact-search"
                                       placeholder="🔍 Buscar contatos..."
                                       value="${this.searchTerm}" />
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="this.connectWhatsApp()">
                                ${this.isConnected ? '🔌 Desconectar' : '🔗 Conectar'}
                            </button>
                        </div>
                        
                        <!-- Lista de Contatos -->
                        <div class="contacts-list" id="contacts-list">
                            ${this.renderContactsList()}
                        </div>
                    </div>
                    
                    <!-- Área de Chat -->
                    <div class="whatsapp-chat">
                        ${this.currentChat ? this.renderChatArea() : this.renderWelcomeScreen()}
                    </div>
                </div>
                
                <!-- Modal de Configurações -->
                <div class="modal" id="settings-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>⚙️ Configurações do WhatsApp</h3>
                            <button class="modal-close" onclick="this.closeSettingsModal()">×</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label class="form-label">Status de Conexão:</label>
                                <div class="connection-info">
                                    <span class="status-indicator ${this.isConnected ? 'online' : 'offline'}"></span>
                                    <span>${this.isConnected ? 'WhatsApp Web Conectado' : 'WhatsApp Web Desconectado'}</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Auto-resposta:</label>
                                <textarea class="form-input" id="auto-reply" rows="3" 
                                    placeholder="Digite a mensagem de auto-resposta..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Horário de Atendimento:</label>
                                <div class="time-settings">
                                    <input type="time" class="form-input" id="start-time" value="08:00" />
                                    <span>até</span>
                                    <input type="time" class="form-input" id="end-time" value="18:00" />
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">
                                    <input type="checkbox" id="auto-reply-enabled" />
                                    Ativar auto-resposta fora do horário
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="this.closeSettingsModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="this.saveSettings()">Salvar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderContactsList() {
        const contacts = this.filteredContacts.length > 0 ? this.filteredContacts : this.contacts;
        
        if (contacts.length === 0) {
            return `
                <div class="no-contacts">
                    <div class="no-contacts-icon">👥</div>
                    <p>Nenhum contato encontrado</p>
                    <button class="btn btn-primary" onclick="window.SacsMaxApp.switchModule('contacts')">
                        📥 Importar Contatos
                    </button>
                </div>
            `;
        }

        return contacts.map(contact => `
            <div class="contact-item ${this.currentChat?.id === contact.id ? 'active' : ''}" 
                 onclick="this.selectContact('${contact.id}')">
                <div class="contact-avatar">
                    <img src="${contact.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjdFRUEiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMSAxMiAxNiAxMC4yMSAxNiA4UzE0LjIxIDQgMTIgNCA4IDUuNzkgOCA4czEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiLz4KPC9zdmc+Cjwvc3ZnPgo='}" 
                         alt="${contact.name}" />
                    <div class="contact-status ${contact.online ? 'online' : 'offline'}"></div>
                </div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-last-message">${contact.lastMessage || 'Nenhuma mensagem'}</div>
                </div>
                <div class="contact-meta">
                    <div class="contact-time">${contact.lastMessageTime || ''}</div>
                    ${this.unreadCounts[contact.id] ? `
                        <div class="unread-badge">${this.unreadCounts[contact.id]}</div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderChatArea() {
        const contact = this.currentChat;
        const messages = this.messages[contact.id] || [];
        
        return `
            <div class="chat-header">
                <div class="chat-contact-info">
                    <div class="contact-avatar">
                        <img src="${contact.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2NjdFRUEiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMSAxMiAxNiAxMC4yMSAxNiA4UzE0LjIxIDQgMTIgNCA4IDUuNzkgOCA4czEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiLz4KPC9zdmc+Cjwvc3ZnPgo='}" 
                             alt="${contact.name}" />
                        <div class="contact-status ${contact.online ? 'online' : 'offline'}"></div>
                    </div>
                    <div class="contact-details">
                        <div class="contact-name">${contact.name}</div>
                        <div class="contact-status-text">
                            ${contact.online ? '🟢 Online' : '⚪ Offline'}
                            ${this.typingUsers.has(contact.id) ? ' - Digitando...' : ''}
                        </div>
                    </div>
                </div>
                <div class="chat-actions">
                    <button class="btn btn-sm btn-secondary" onclick="this.showContactInfo('${contact.id}')">
                        ℹ️
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="this.showSettingsModal()">
                        ⚙️
                    </button>
                </div>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                ${this.renderMessages(messages)}
            </div>
            
            <div class="chat-input-area">
                <div class="chat-input-container">
                    <textarea class="chat-input" 
                              id="message-input"
                              placeholder="Digite sua mensagem..."
                              rows="1"></textarea>
                    <div class="chat-input-actions">
                        <button class="btn btn-sm btn-secondary" onclick="this.attachFile()">
                            📎
                        </button>
                        <button class="btn btn-primary" onclick="this.sendMessage()">
                            📤
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderWelcomeScreen() {
        return `
            <div class="welcome-screen">
                <div class="welcome-content">
                    <div class="welcome-icon">💬</div>
                    <h2>Bem-vindo ao WhatsApp</h2>
                    <p>Selecione um contato para iniciar uma conversa</p>
                    
                    <div class="welcome-stats">
                        <div class="stat-item">
                            <span class="stat-number">${this.contacts.length}</span>
                            <span class="stat-label">Contatos</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.getTotalUnreadCount()}</span>
                            <span class="stat-label">Mensagens não lidas</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${this.getOnlineContactsCount()}</span>
                            <span class="stat-label">Online</span>
                        </div>
                    </div>
                    
                    <div class="welcome-actions">
                        <button class="btn btn-primary" onclick="window.SacsMaxApp.switchModule('contacts')">
                            👥 Gerenciar Contatos
                        </button>
                        <button class="btn btn-secondary" onclick="this.showSettingsModal()">
                            ⚙️ Configurações
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderMessages(messages) {
        if (messages.length === 0) {
            return `
                <div class="no-messages">
                    <div class="no-messages-icon">💬</div>
                    <p>Nenhuma mensagem ainda</p>
                    <p>Inicie uma conversa enviando uma mensagem!</p>
                </div>
            `;
        }

        return messages.map(message => `
            <div class="message ${message.isOutgoing ? 'outgoing' : 'incoming'}" data-message-id="${message.id}">
                <div class="message-content">
                    <div class="message-text">${message.text}</div>
                    <div class="message-time">
                        ${message.time}
                        ${message.isOutgoing ? `
                            <span class="message-status">
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

    init() {
        this.loadContacts();
        this.loadMessages();
        this.setupEventListeners();
        this.simulateConnection();
    }

    destroy() {
        if (this.connectionInterval) {
            clearInterval(this.connectionInterval);
        }
    }

    setupEventListeners() {
        setTimeout(() => {
            this.setupSearch();
            this.setupMessageInput();
        }, 100);
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
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    filterContacts() {
        if (!this.searchTerm.trim()) {
            this.filteredContacts = [];
            this.updateContactsList();
            return;
        }

        this.filteredContacts = this.contacts.filter(contact =>
            contact.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            contact.phone.includes(this.searchTerm)
        );
        
        this.updateContactsList();
    }

    updateContactsList() {
        const contactsList = document.getElementById('contacts-list');
        if (contactsList) {
            contactsList.innerHTML = this.renderContactsList();
        }
    }

    selectContact(contactId) {
        this.currentChat = this.contacts.find(c => c.id === contactId);
        this.markAsRead(contactId);
        this.updateChatArea();
        this.scrollToBottom();
    }

    markAsRead(contactId) {
        this.unreadCounts[contactId] = 0;
        this.updateContactsList();
    }

    updateChatArea() {
        const chatArea = document.querySelector('.whatsapp-chat');
        if (chatArea) {
            chatArea.innerHTML = this.currentChat ? this.renderChatArea() : this.renderWelcomeScreen();
            this.setupMessageInput();
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: true,
            status: 'sending'
        };

        // Adiciona mensagem à lista
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        this.messages[this.currentChat.id].push(message);

        // Limpa input
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Atualiza chat
        this.updateChatArea();
        this.scrollToBottom();

        // Simula envio
        setTimeout(() => {
            message.status = 'sent';
            this.updateMessageStatus(message.id, 'sent');
        }, 1000);

        setTimeout(() => {
            message.status = 'delivered';
            this.updateMessageStatus(message.id, 'delivered');
        }, 2000);

        // Simula resposta automática
        setTimeout(() => {
            this.simulateAutoReply();
        }, 3000);
    }

    updateMessageStatus(messageId, status) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const statusElement = messageElement.querySelector('.message-status');
            if (statusElement) {
                statusElement.textContent = status === 'sent' ? '✓' : '✓✓';
            }
        }
    }

    simulateAutoReply() {
        if (!this.currentChat) return;

        const autoReplies = [
            'Obrigado pelo contato! Em breve retornaremos.',
            'Sua mensagem foi recebida. Aguarde um momento.',
            'Estamos verificando sua solicitação.',
            'Obrigado! Nossa equipe entrará em contato em breve.'
        ];

        const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
        
        const message = {
            id: Date.now().toString(),
            text: randomReply,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: false
        };

        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        this.messages[this.currentChat.id].push(message);

        // Adiciona ao contador de não lidas
        this.unreadCounts[this.currentChat.id] = (this.unreadCounts[this.currentChat.id] || 0) + 1;

        this.updateChatArea();
        this.updateContactsList();
        this.scrollToBottom();
    }

    connectWhatsApp() {
        if (this.isConnected) {
            this.disconnectWhatsApp();
        } else {
            this.isConnected = true;
            this.showSuccess('WhatsApp Web conectado com sucesso!');
            this.updateConnectionStatus();
        }
    }

    disconnectWhatsApp() {
        this.isConnected = false;
        this.showInfo('WhatsApp Web desconectado');
        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        const statusIndicator = document.querySelector('.connection-status .status-indicator');
        const statusText = document.querySelector('.connection-status .status-text');
        
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.isConnected ? 'online' : 'offline'}`;
        }
        
        if (statusText) {
            statusText.textContent = this.isConnected ? 'Conectado' : 'Desconectado';
        }
    }

    simulateConnection() {
        // Simula mudanças de status de conexão
        this.connectionInterval = setInterval(() => {
            if (Math.random() > 0.95) {
                this.isConnected = !this.isConnected;
                this.updateConnectionStatus();
                
                if (this.isConnected) {
                    this.showInfo('WhatsApp Web reconectado automaticamente');
                } else {
                    this.showWarning('Conexão perdida. Tentando reconectar...');
                }
            }
        }, 30000);
    }

    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    saveSettings() {
        const autoReply = document.getElementById('auto-reply')?.value;
        const startTime = document.getElementById('start-time')?.value;
        const endTime = document.getElementById('end-time')?.value;
        const autoReplyEnabled = document.getElementById('auto-reply-enabled')?.checked;

        // Salva configurações
        localStorage.setItem('whatsapp_settings', JSON.stringify({
            autoReply,
            startTime,
            endTime,
            autoReplyEnabled
        }));

        this.showSuccess('Configurações salvas com sucesso!');
        this.closeSettingsModal();
    }

    attachFile() {
        // Simula anexo de arquivo
        this.showInfo('Funcionalidade de anexo em desenvolvimento');
    }

    showContactInfo(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (contact) {
            alert(`Informações do Contato:\n\nNome: ${contact.name}\nTelefone: ${contact.phone}\nEmail: ${contact.email || 'Não informado'}\nEmpresa: ${contact.company || 'Não informado'}`);
        }
    }

    loadContacts() {
        // Carrega contatos do localStorage ou usa dados mock
        const savedContacts = localStorage.getItem('sacsmax_contacts');
        if (savedContacts) {
            this.contacts = JSON.parse(savedContacts);
        } else {
            // Dados mock
            this.contacts = [
                {
                    id: '1',
                    name: 'João Silva',
                    phone: '(11) 99999-9999',
                    email: 'joao@email.com',
                    company: 'Empresa A',
                    avatar: null,
                    online: true,
                    lastMessage: 'Olá, preciso de ajuda',
                    lastMessageTime: '14:30'
                },
                {
                    id: '2',
                    name: 'Maria Santos',
                    phone: '(11) 88888-8888',
                    email: 'maria@email.com',
                    company: 'Empresa B',
                    avatar: null,
                    online: false,
                    lastMessage: 'Obrigado pelo atendimento',
                    lastMessageTime: '13:45'
                },
                {
                    id: '3',
                    name: 'Pedro Costa',
                    phone: '(11) 77777-7777',
                    email: 'pedro@email.com',
                    company: 'Empresa C',
                    avatar: null,
                    online: true,
                    lastMessage: 'Quando posso receber o orçamento?',
                    lastMessageTime: '12:20'
                }
            ];
        }

        // Inicializa contadores de não lidas
        this.contacts.forEach(contact => {
            if (!this.unreadCounts[contact.id]) {
                this.unreadCounts[contact.id] = Math.floor(Math.random() * 3);
            }
        });
    }

    loadMessages() {
        // Carrega mensagens do localStorage ou usa dados mock
        const savedMessages = localStorage.getItem('sacsmax_messages');
        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
        } else {
            // Mensagens mock
            this.messages = {
                '1': [
                    {
                        id: '1',
                        text: 'Olá, preciso de ajuda com meu pedido',
                        time: '14:30',
                        isOutgoing: false
                    },
                    {
                        id: '2',
                        text: 'Olá João! Como posso ajudá-lo?',
                        time: '14:31',
                        isOutgoing: true,
                        status: 'read'
                    }
                ]
            };
        }
    }

    getTotalUnreadCount() {
        return Object.values(this.unreadCounts).reduce((sum, count) => sum + count, 0);
    }

    getOnlineContactsCount() {
        return this.contacts.filter(contact => contact.online).length;
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
}

// Adiciona estilos específicos do módulo WhatsApp
const whatsappStyles = `
    .whatsapp-container {
        display: flex;
        height: calc(100vh - 200px);
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .whatsapp-sidebar {
        width: 350px;
        border-right: 1px solid #e9ecef;
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .search-container {
        flex: 1;
    }

    .search-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    .contacts-list {
        flex: 1;
        overflow-y: auto;
    }

    .contact-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-bottom: 1px solid #f8f9fa;
    }

    .contact-item:hover {
        background: #f8f9fa;
    }

    .contact-item.active {
        background: #e3f2fd;
    }

    .contact-avatar {
        position: relative;
        margin-right: 1rem;
    }

    .contact-avatar img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .contact-status {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
    }

    .contact-status.online {
        background: #28a745;
    }

    .contact-status.offline {
        background: #6c757d;
    }

    .contact-info {
        flex: 1;
        min-width: 0;
    }

    .contact-name {
        font-weight: 500;
        color: #495057;
        margin-bottom: 0.25rem;
    }

    .contact-last-message {
        font-size: 0.8rem;
        color: #6c757d;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .contact-meta {
        text-align: right;
        min-width: 60px;
    }

    .contact-time {
        font-size: 0.7rem;
        color: #6c757d;
        margin-bottom: 0.25rem;
    }

    .unread-badge {
        background: #667eea;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 500;
        margin: 0 auto;
    }

    .whatsapp-chat {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
        background: #f8f9fa;
    }

    .chat-contact-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .contact-details {
        display: flex;
        flex-direction: column;
    }

    .contact-status-text {
        font-size: 0.8rem;
        color: #6c757d;
    }

    .chat-actions {
        display: flex;
        gap: 0.5rem;
    }

    .chat-messages {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        background: #f0f2f5;
    }

    .message {
        margin-bottom: 1rem;
        display: flex;
    }

    .message.outgoing {
        justify-content: flex-end;
    }

    .message-content {
        max-width: 70%;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        position: relative;
    }

    .message.outgoing .message-content {
        background: #667eea;
        color: white;
        border-bottom-right-radius: 4px;
    }

    .message.incoming .message-content {
        background: white;
        color: #495057;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .message-text {
        margin-bottom: 0.25rem;
        line-height: 1.4;
    }

    .message-time {
        font-size: 0.7rem;
        opacity: 0.7;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .message-status {
        font-size: 0.8rem;
    }

    .chat-input-area {
        padding: 1rem;
        border-top: 1px solid #e9ecef;
        background: white;
    }

    .chat-input-container {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
        background: #f8f9fa;
        border-radius: 12px;
        padding: 0.5rem;
    }

    .chat-input {
        flex: 1;
        border: none;
        background: transparent;
        resize: none;
        padding: 0.5rem;
        font-family: inherit;
        font-size: 0.9rem;
        max-height: 120px;
        outline: none;
    }

    .chat-input-actions {
        display: flex;
        gap: 0.25rem;
    }

    .welcome-screen {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f2f5;
    }

    .welcome-content {
        text-align: center;
        max-width: 400px;
    }

    .welcome-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .welcome-content h2 {
        color: #495057;
        margin-bottom: 1rem;
    }

    .welcome-content p {
        color: #6c757d;
        margin-bottom: 2rem;
    }

    .welcome-stats {
        display: flex;
        justify-content: space-around;
        margin-bottom: 2rem;
    }

    .stat-item {
        text-align: center;
    }

    .stat-number {
        display: block;
        font-size: 1.5rem;
        font-weight: 600;
        color: #667eea;
    }

    .stat-label {
        font-size: 0.8rem;
        color: #6c757d;
    }

    .welcome-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .no-contacts {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    .no-contacts-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .no-messages {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    .no-messages-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .connection-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e9ecef;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6c757d;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #e9ecef;
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    .connection-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .time-settings {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
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
`;

// Adiciona os estilos ao documento
if (!document.getElementById('whatsapp-styles')) {
    const style = document.createElement('style');
    style.id = 'whatsapp-styles';
    style.textContent = whatsappStyles;
    document.head.appendChild(style);
}

export default WhatsAppModule;
