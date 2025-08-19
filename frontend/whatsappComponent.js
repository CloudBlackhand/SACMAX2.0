/**
 * WhatsApp Component - Interface completa replicando WhatsApp Web
 * @version 1.0.0
 * @description Componente modular que replica 100% a interface e funcionalidades do WhatsApp
 */

class WhatsAppComponent {
    constructor(targetContainer = null) {
        this.targetContainer = targetContainer;
        this.currentContact = null;
        this.messages = [];
        this.isTyping = false;
        this.socket = null;
        this.attachments = [];
        this.init();
    }

    init() {
        this.injectStyles();
        this.createContainer();
        this.setupEventListeners();
        this.startStatusPolling();
    }

    injectStyles() {
        const styles = `
            .whatsapp-container {
                display: flex;
                height: 600px;
                max-height: 80vh;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: #f0f2f5;
                border: 1px solid #e5e5e5;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .whatsapp-sidebar {
                width: 30%;
                max-width: 420px;
                background: #fff;
                border-right: 1px solid #e5e5e5;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }

            .whatsapp-header {
                background: #075e54;
                color: white;
                padding: 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .whatsapp-search {
                padding: 8px 15px;
                background: #f0f2f5;
                border: none;
                border-radius: 8px;
                width: 100%;
                margin: 10px 15px;
                font-size: 14px;
            }

            .whatsapp-contacts {
                flex: 1;
                overflow-y: auto;
            }

            .whatsapp-contact {
                display: flex;
                align-items: center;
                padding: 12px 15px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.2s;
            }

            .whatsapp-contact:hover {
                background: #f5f5f5;
            }

            .whatsapp-contact.active {
                background: #e7f3ff;
            }

            .whatsapp-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                font-weight: bold;
                color: #555;
            }

            .whatsapp-contact-info {
                flex: 1;
            }

            .whatsapp-contact-name {
                font-weight: 500;
                color: #333;
                margin-bottom: 3px;
            }

            .whatsapp-contact-preview {
                font-size: 13px;
                color: #666;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .whatsapp-chat {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: #e5ddd5;
                min-height: 0;
            }

            .whatsapp-chat-header {
                background: #075e54;
                color: white;
                padding: 15px;
                display: flex;
                align-items: center;
            }

            .whatsapp-chat-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #ddd;
                margin-right: 15px;
            }

            .whatsapp-chat-info h4 {
                margin: 0;
                font-size: 16px;
            }

            .whatsapp-chat-info p {
                margin: 0;
                font-size: 12px;
                opacity: 0.8;
            }

            .whatsapp-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #e5ddd5;
            }

            .whatsapp-message {
                max-width: 65%;
                margin: 4px 0;
                padding: 8px 12px;
                border-radius: 7.5px;
                position: relative;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.4;
            }

            .whatsapp-message.sent {
                background: #dcf8c6;
                margin-left: auto;
                border-bottom-right-radius: 0;
            }

            .whatsapp-message.received {
                background: white;
                margin-right: auto;
                border-bottom-left-radius: 0;
                box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
            }

            .whatsapp-message-content {
                margin-bottom: 4px;
            }

            .whatsapp-message-meta {
                font-size: 11px;
                color: #667781;
                text-align: right;
            }

            .whatsapp-message.sent .whatsapp-message-meta {
                color: #3b4a54;
            }

            .whatsapp-message-status {
                display: inline-block;
                margin-left: 4px;
            }

            .whatsapp-message-status.read {
                color: #4fc3f7;
            }

            .whatsapp-message-status.delivered {
                color: #667781;
            }

            .whatsapp-message-status.sent {
                color: #667781;
            }

            .whatsapp-input-container {
                background: #f0f2f5;
                padding: 10px 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .whatsapp-attachment-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: background 0.2s;
            }

            .whatsapp-attachment-btn:hover {
                background: #e5e5e5;
            }

            .whatsapp-message-input {
                flex: 1;
                background: white;
                border: none;
                border-radius: 21px;
                padding: 9px 12px;
                font-size: 15px;
                outline: none;
            }

            .whatsapp-send-btn {
                background: #075e54;
                border: none;
                border-radius: 50%;
                width: 42px;
                height: 42px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }

            .whatsapp-send-btn:hover {
                background: #064e47;
            }

            .whatsapp-send-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
            }

            .whatsapp-typing {
                font-size: 12px;
                color: #667781;
                padding: 5px 15px;
                font-style: italic;
            }

            .whatsapp-attachment-preview {
                display: flex;
                align-items: center;
                background: white;
                padding: 8px 12px;
                border-radius: 12px;
                margin-bottom: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .whatsapp-attachment-file {
                display: flex;
                align-items: center;
                gap: 8px;
                background: white;
                padding: 8px 12px;
                border-radius: 8px;
                margin: 4px 0;
                max-width: 200px;
            }

            .whatsapp-attachment-icon {
                width: 32px;
                height: 32px;
                background: #f0f2f5;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .whatsapp-attachment-info {
                font-size: 13px;
            }

            .whatsapp-attachment-name {
                font-weight: 500;
                color: #333;
            }

            .whatsapp-attachment-size {
                font-size: 11px;
                color: #667781;
            }

            .whatsapp-client-panel {
                width: 300px;
                background: white;
                border-left: 1px solid #e5e5e5;
                padding: 20px;
                overflow-y: auto;
            }

            .whatsapp-client-info {
                text-align: center;
                margin-bottom: 20px;
            }

            .whatsapp-client-avatar {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: #ddd;
                margin: 0 auto 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
                color: #555;
            }

            .whatsapp-client-name {
                font-size: 18px;
                font-weight: 500;
                margin-bottom: 5px;
            }

            .whatsapp-client-phone {
                color: #667781;
                font-size: 14px;
            }

            .whatsapp-client-details {
                margin-top: 20px;
            }

            .whatsapp-detail-item {
                padding: 10px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .whatsapp-detail-label {
                font-size: 12px;
                color: #667781;
                margin-bottom: 2px;
            }

            .whatsapp-detail-value {
                font-size: 14px;
                color: #333;
            }

            .whatsapp-file-input {
                display: none;
            }

            .whatsapp-file-drop {
                border: 2px dashed #ddd;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                color: #667781;
                cursor: pointer;
                transition: all 0.2s;
            }

            .whatsapp-file-drop:hover {
                border-color: #075e54;
                background: #f8f9fa;
            }

            .whatsapp-file-drop.dragover {
                border-color: #075e54;
                background: #e7f3ff;
            }

            .whatsapp-reply-container {
                background: white;
                border-radius: 7.5px 7.5px 0 0;
                padding: 8px 12px;
                margin-bottom: 1px;
                border-left: 4px solid #075e54;
                display: none;
            }

            .whatsapp-reply-author {
                font-size: 12px;
                color: #075e54;
                font-weight: 500;
            }

            .whatsapp-reply-content {
                font-size: 13px;
                color: #333;
                margin-top: 2px;
            }

            .whatsapp-reply-close {
                position: absolute;
                right: 8px;
                top: 8px;
                cursor: pointer;
                color: #667781;
                font-size: 16px;
            }

            .whatsapp-message-actions {
                position: absolute;
                right: 5px;
                top: 5px;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .whatsapp-message:hover .whatsapp-message-actions {
                opacity: 1;
            }

            .whatsapp-message-action {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 50%;
                color: #667781;
                font-size: 12px;
            }

            .whatsapp-message-action:hover {
                background: rgba(0,0,0,0.1);
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'whatsapp-component';
        container.className = 'whatsapp-container';
        container.innerHTML = `
            <div class="whatsapp-sidebar">
                <div class="whatsapp-header">
                    <h3>Conversas</h3>
                    <div>
                        <button class="whatsapp-attachment-btn" onclick="this.searchInput()">🔍</button>
                    </div>
                </div>
                <input type="text" class="whatsapp-search" placeholder="Pesquisar conversas..." onkeyup="this.filterContacts(this.value)">
                <div class="whatsapp-contacts" id="whatsapp-contacts"></div>
            </div>

            <div class="whatsapp-chat">
                <div class="whatsapp-chat-header" id="whatsapp-chat-header" style="display: none;">
                    <div class="whatsapp-chat-avatar" id="whatsapp-chat-avatar"></div>
                    <div class="whatsapp-chat-info">
                        <h4 id="whatsapp-chat-name">Selecione um contato</h4>
                        <p id="whatsapp-chat-status">Online</p>
                    </div>
                </div>

                <div class="whatsapp-messages" id="whatsapp-messages">
                    <div style="text-align: center; color: #667781; margin-top: 50px;">
                        Selecione um contato para iniciar conversa
                    </div>
                </div>

                <div id="whatsapp-typing" class="whatsapp-typing" style="display: none;">
                    Digitando...
                </div>

                <div class="whatsapp-input-container">
                    <button class="whatsapp-attachment-btn" onclick="this.openAttachmentMenu()" title="Anexar arquivo">📎</button>
                    <input type="text" class="whatsapp-message-input" id="whatsapp-message-input" 
                           placeholder="Digite uma mensagem..." onkeypress="this.handleKeyPress(event)">
                    <button class="whatsapp-send-btn" id="whatsapp-send-btn" onclick="this.sendMessage()" disabled>
                        ➤
                    </button>
                </div>

                <div class="whatsapp-reply-container" id="whatsapp-reply-container">
                    <div class="whatsapp-reply-close" onclick="this.cancelReply()">×</div>
                    <div class="whatsapp-reply-author" id="whatsapp-reply-author"></div>
                    <div class="whatsapp-reply-content" id="whatsapp-reply-content"></div>
                </div>
            </div>

            <div class="whatsapp-client-panel" id="whatsapp-client-panel" style="display: none;">
                <div class="whatsapp-client-info">
                    <div class="whatsapp-client-avatar" id="whatsapp-client-avatar">👤</div>
                    <div class="whatsapp-client-name" id="whatsapp-client-name">Cliente</div>
                    <div class="whatsapp-client-phone" id="whatsapp-client-phone">+55 00 00000-0000</div>
                </div>

                <div class="whatsapp-client-details">
                    <div class="whatsapp-detail-item">
                        <div class="whatsapp-detail-label">Nome Completo</div>
                        <div class="whatsapp-detail-value" id="whatsapp-client-fullname">-</div>
                    </div>
                    <div class="whatsapp-detail-item">
                        <div class="whatsapp-detail-label">Telefone</div>
                        <div class="whatsapp-detail-value" id="whatsapp-client-phone-detail">-</div>
                    </div>
                    <div class="whatsapp-detail-item">
                        <div class="whatsapp-detail-label">Email</div>
                        <div class="whatsapp-detail-value" id="whatsapp-client-email">-</div>
                    </div>
                    <div class="whatsapp-detail-item">
                        <div class="whatsapp-detail-label">Endereço</div>
                        <div class="whatsapp-detail-value" id="whatsapp-client-address">-</div>
                    </div>
                    <div class="whatsapp-detail-item">
                        <div class="whatsapp-detail-label">Última Interação</div>
                        <div class="whatsapp-detail-value" id="whatsapp-client-last-interaction">-</div>
                    </div>
                    <div class="whatsapp-detail-item">
                        <div class="whatsapp-detail-label">Status do Cliente</div>
                        <div class="whatsapp-detail-value" id="whatsapp-client-status">Ativo</div>
                    </div>
                </div>
            </div>

            <input type="file" id="whatsapp-file-input" class="whatsapp-file-input" multiple 
                   accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" onchange="this.handleFileSelect(event)">
        `;

        if (this.targetContainer) {
            this.targetContainer.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
    }

    setupEventListeners() {
        const messageInput = document.getElementById('whatsapp-message-input');
        const sendBtn = document.getElementById('whatsapp-send-btn');

        messageInput.addEventListener('input', () => {
            sendBtn.disabled = !messageInput.value.trim();
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // File drag and drop
        const messagesContainer = document.getElementById('whatsapp-messages');
        messagesContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            messagesContainer.classList.add('dragover');
        });

        messagesContainer.addEventListener('dragleave', () => {
            messagesContainer.classList.remove('dragover');
        });

        messagesContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            messagesContainer.classList.remove('dragover');
            this.handleFileDrop(e);
        });
    }

    async loadContacts(contacts) {
        const contactsContainer = document.getElementById('whatsapp-contacts');
        contactsContainer.innerHTML = '';

        contacts.forEach(contact => {
            const contactDiv = document.createElement('div');
            contactDiv.className = 'whatsapp-contact';
            contactDiv.dataset.contactId = contact.id;
            contactDiv.dataset.phone = contact.phone;

            const initials = contact.name.split(' ').map(n => n[0]).join('').toUpperCase();

            contactDiv.innerHTML = `
                <div class="whatsapp-avatar">${initials}</div>
                <div class="whatsapp-contact-info">
                    <div class="whatsapp-contact-name">${contact.name}</div>
                    <div class="whatsapp-contact-preview">${contact.lastMessage || 'Clique para conversar'}</div>
                </div>
            `;

            contactDiv.addEventListener('click', () => {
                this.selectContact(contact);
            });

            contactsContainer.appendChild(contactDiv);
        });
    }

    selectContact(contact) {
        this.currentContact = contact;
        
        // Atualizar contato selecionado
        document.querySelectorAll('.whatsapp-contact').forEach(el => el.classList.remove('active'));
        document.querySelector(`[data-contact-id="${contact.id}"]`).classList.add('active');

        // Atualizar header do chat
        const chatHeader = document.getElementById('whatsapp-chat-header');
        chatHeader.style.display = 'flex';
        document.getElementById('whatsapp-chat-name').textContent = contact.name;
        document.getElementById('whatsapp-chat-status').textContent = 'Online';

        // Atualizar painel do cliente
        const clientPanel = document.getElementById('whatsapp-client-panel');
        clientPanel.style.display = 'block';
        this.updateClientPanel(contact);

        // Carregar mensagens
        this.loadMessages(contact.id);
    }

    updateClientPanel(contact) {
        document.getElementById('whatsapp-client-avatar').textContent = 
            contact.name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('whatsapp-client-name').textContent = contact.name;
        document.getElementById('whatsapp-client-phone').textContent = contact.phone;
        document.getElementById('whatsapp-client-fullname').textContent = contact.name;
        document.getElementById('whatsapp-client-phone-detail').textContent = contact.phone;
        document.getElementById('whatsapp-client-email').textContent = contact.email || 'Não informado';
        document.getElementById('whatsapp-client-address').textContent = contact.address || 'Não informado';
        document.getElementById('whatsapp-client-last-interaction').textContent = 
            new Date().toLocaleDateString('pt-BR');
    }

    async loadMessages(contactId) {
        try {
            const response = await fetch(`/api/whatsapp/messages/${contactId}`);
            const data = await response.json();
            this.messages = data.messages || [];
            this.renderMessages();
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            this.messages = this.getMockMessages(contactId);
            this.renderMessages();
        }
    }

    getMockMessages(contactId) {
        return [
            {
                id: 1,
                content: 'Olá! Como posso ajudar você?',
                sender: 'me',
                timestamp: new Date(Date.now() - 3600000),
                status: 'read',
                type: 'text'
            },
            {
                id: 2,
                content: 'Preciso de suporte técnico para minha internet',
                sender: 'contact',
                timestamp: new Date(Date.now() - 1800000),
                status: 'delivered',
                type: 'text'
            }
        ];
    }

    renderMessages() {
        const messagesContainer = document.getElementById('whatsapp-messages');
        messagesContainer.innerHTML = '';

        this.messages.forEach(message => {
            const messageDiv = this.createMessageElement(message);
            messagesContainer.appendChild(messageDiv);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `whatsapp-message ${message.sender === 'me' ? 'sent' : 'received'}`;
        messageDiv.dataset.messageId = message.id;

        let content = '';
        
        if (message.type === 'text') {
            content = `<div class="whatsapp-message-content">${this.escapeHtml(message.content)}</div>`;
        } else if (message.type === 'image') {
            content = `
                <div class="whatsapp-message-content">
                    <img src="${message.content}" style="max-width: 200px; border-radius: 8px;">
                </div>
            `;
        } else if (message.type === 'file') {
            content = `
                <div class="whatsapp-attachment-file">
                    <div class="whatsapp-attachment-icon">📄</div>
                    <div class="whatsapp-attachment-info">
                        <div class="whatsapp-attachment-name">${message.filename}</div>
                        <div class="whatsapp-attachment-size">${this.formatFileSize(message.size)}</div>
                    </div>
                </div>
            `;
        }

        const statusIcon = this.getStatusIcon(message.status);
        const time = new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            ${content}
            <div class="whatsapp-message-meta">
                ${time}
                ${message.sender === 'me' ? `<span class="whatsapp-message-status ${message.status}">${statusIcon}</span>` : ''}
            </div>
            <div class="whatsapp-message-actions">
                <button class="whatsapp-message-action" onclick="this.replyToMessage('${message.id}')" title="Responder">↩️</button>
            </div>
        `;

        return messageDiv;
    }

    getStatusIcon(status) {
        switch(status) {
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '';
        }
    }

    sendMessage() {
        const input = document.getElementById('whatsapp-message-input');
        const content = input.value.trim();
        
        if (!content || !this.currentContact) return;

        const message = {
            id: Date.now(),
            content: content,
            sender: 'me',
            timestamp: new Date(),
            status: 'sent',
            type: 'text',
            replyTo: this.replyingTo
        };

        this.messages.push(message);
        this.renderMessages();
        this.sendToServer(message);

        input.value = '';
        document.getElementById('whatsapp-send-btn').disabled = true;
        this.cancelReply();
    }

    async sendToServer(message) {
        try {
            const response = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: this.currentContact.id,
                    message: message
                })
            });

            const data = await response.json();
            
            if (data.success) {
                message.id = data.messageId;
                message.status = 'delivered';
                this.renderMessages();
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    }

    openAttachmentMenu() {
        document.getElementById('whatsapp-file-input').click();
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => this.handleFileUpload(file));
    }

    handleFileDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        files.forEach(file => this.handleFileUpload(file));
    }

    async handleFileUpload(file) {
        if (!this.currentContact) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('contactId', this.currentContact.id);

        try {
            const response = await fetch('/api/whatsapp/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                const message = {
                    id: Date.now(),
                    content: data.url,
                    filename: file.name,
                    size: file.size,
                    sender: 'me',
                    timestamp: new Date(),
                    status: 'sent',
                    type: this.getFileType(file.type)
                };

                this.messages.push(message);
                this.renderMessages();
            }
        } catch (error) {
            console.error('Erro ao enviar arquivo:', error);
        }
    }

    getFileType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    replyToMessage(messageId) {
        const message = this.messages.find(m => m.id.toString() === messageId.toString());
        if (!message) return;

        this.replyingTo = message;
        
        const replyContainer = document.getElementById('whatsapp-reply-container');
        const replyAuthor = document.getElementById('whatsapp-reply-author');
        const replyContent = document.getElementById('whatsapp-reply-content');

        replyAuthor.textContent = message.sender === 'me' ? 'Você' : this.currentContact.name;
        replyContent.textContent = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
        
        replyContainer.style.display = 'block';
        document.getElementById('whatsapp-message-input').focus();
    }

    cancelReply() {
        this.replyingTo = null;
        document.getElementById('whatsapp-reply-container').style.display = 'none';
    }

    filterContacts(searchTerm) {
        const contacts = document.querySelectorAll('.whatsapp-contact');
        contacts.forEach(contact => {
            const name = contact.querySelector('.whatsapp-contact-name').textContent.toLowerCase();
            const preview = contact.querySelector('.whatsapp-contact-preview').textContent.toLowerCase();
            const show = name.includes(searchTerm.toLowerCase()) || preview.includes(searchTerm.toLowerCase());
            contact.style.display = show ? 'flex' : 'none';
        });
    }

    startStatusPolling() {
        setInterval(() => {
            if (this.currentContact) {
                this.updateContactStatus();
            }
        }, 30000);
    }

    async updateContactStatus() {
        try {
            const response = await fetch(`/api/whatsapp/status/${this.currentContact.id}`);
            const data = await response.json();
            
            if (data.lastSeen) {
                const lastSeen = new Date(data.lastSeen);
                const now = new Date();
                const diff = now - lastSeen;
                
                let status = 'Online';
                if (diff > 60000) {
                    status = `Visto por último ${this.formatLastSeen(diff)}`;
                }
                
                document.getElementById('whatsapp-chat-status').textContent = status;
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    }

    formatLastSeen(diff) {
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'agora';
        if (minutes < 60) return `há ${minutes} min`;
        if (hours < 24) return `há ${hours} h`;
        return `há ${days} d`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    show() {
        const container = document.getElementById('whatsapp-component');
        if (container) container.style.display = 'flex';
    }

    hide() {
        const container = document.getElementById('whatsapp-component');
        if (container) container.style.display = 'none';
    }

    openChat(contact) {
        this.selectContact(contact);
        this.show();
    }
}

// Exportar para uso global
window.WhatsAppComponent = WhatsAppComponent;