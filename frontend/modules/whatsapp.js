// Módulo WhatsApp - Interface idêntica ao WhatsApp Web

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
    }

    render() {
        return `
            <div class="whatsapp-web-container">
                <!-- Header do WhatsApp -->
                <div class="wa-header">
                    <div class="wa-header-left">
                        <div class="wa-profile-pic">
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNkYzM1NDUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMSAxMiAxNiAxMC4yMSAxNiA4UzE0LjIxIDQgMTIgNCA4IDUuNzkgOCA4czEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiLz4KPC9zdmc+Cjwvc3ZnPgo=" alt="Profile" />
                        </div>
                        <div class="wa-header-title">
                            <h2>SACMAX - Comunicação</h2>
                            <span class="wa-status">${this.isConnected ? 'Sistema Ativo' : 'Sistema Inativo'}</span>
                        </div>
                    </div>
                    <div class="wa-header-right">
                        <button class="wa-header-btn" onclick="this.toggleStatus()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </button>
                        <button class="wa-header-btn" onclick="this.showNewChat()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                        </button>
                        <button class="wa-header-btn" onclick="this.showMenu()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="wa-main-container">
                    <!-- Sidebar com Lista de Contatos -->
                    <div class="wa-sidebar">
                        <!-- Search Bar -->
                        <div class="wa-search-container">
                            <div class="wa-search-box">
                                <div class="wa-search-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                    </svg>
                                </div>
                                <input type="text" 
                                       class="wa-search-input" 
                                       id="contact-search"
                                       placeholder="Pesquisar ou começar uma nova conversa"
                                       value="${this.searchTerm}" />
                                <button class="wa-search-filter" onclick="this.showFilterMenu()">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                                    </svg>
                            </button>
                            </div>
                        </div>
                        
                        <!-- Lista de Contatos -->
                        <div class="wa-chats-list" id="contacts-list">
                            ${this.renderContactsList()}
                        </div>
                    </div>
                    
                    <!-- Área de Chat -->
                                    <div class="wa-chat-area">
                        ${this.currentChat ? this.renderChatArea() : this.renderWelcomeScreen()}
                    </div>
                
                ${this.currentChat ? this.renderClientInfoPanel() : ''}
                </div>
                
                <!-- Menu de Anexos -->
                <div class="wa-attachment-menu" id="attachment-menu" style="display: none;">
                    <div class="wa-attachment-item" onclick="this.attachDocument()">
                        <div class="wa-attachment-icon document">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                            </svg>
                        </div>
                        <span>Documento</span>
                                </div>
                    <div class="wa-attachment-item" onclick="this.attachCamera()">
                        <div class="wa-attachment-icon camera">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0 -6.4 0"/>
                                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                            </svg>
                            </div>
                        <span>Câmera</span>
                            </div>
                    <div class="wa-attachment-item" onclick="this.attachGallery()">
                        <div class="wa-attachment-icon gallery">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                            </svg>
                                </div>
                        <span>Galeria</span>
                            </div>
                    <div class="wa-attachment-item" onclick="this.attachAudio()">
                        <div class="wa-attachment-icon audio">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
                            </svg>
                            </div>
                        <span>Áudio</span>
                        </div>
                    <div class="wa-attachment-item" onclick="this.attachLocation()">
                        <div class="wa-attachment-icon location">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                        </div>
                        <span>Localização</span>
                    </div>
                    <div class="wa-attachment-item" onclick="this.attachContact()">
                        <div class="wa-attachment-icon contact">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1l-1.7 2.26V16h-1.5v6h5zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6.5h1.5V22h4z"/>
                            </svg>
                        </div>
                        <span>Contato</span>
                    </div>
                </div>
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
                    <p>Toque no botão de nova conversa para começar</p>
                </div>
            `;
        }

        return contacts.map(contact => `
            <div class="wa-chat-item ${this.currentChat?.id === contact.id ? 'active' : ''}" 
                 onclick="this.selectContact('${contact.id}')">
                <div class="wa-chat-avatar">
                    <img src="${contact.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMwMEE4N0QiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMSAxMiAxNiAxMC4yMSAxNiA4UzE0LjIxIDQgMTIgNCA4IDUuNzkgOCA4czEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiLz4KPC9zdmc+Cjwvc3ZnPgo="}" 
                         alt="${contact.name}" />
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
                            <img src="${contact.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMwMEE4N0QiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMSAxMiAxNiAxMC4yMSAxNiA4UzE0LjIxIDQgMTIgNCA4IDUuNzkgOCA4czEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiLz4KPC9zdmc+Cjwvc3ZnPgo="}" 
                             alt="${contact.name}" />
                    </div>
                        <div class="wa-chat-details">
                            <div class="wa-chat-name">${contact.name}</div>
                            <div class="wa-chat-status-text">
                                ${contact.online ? 'online' : 'offline'}
                                ${this.typingUsers.has(contact.id) ? ' - digitando...' : ''}
                        </div>
                    </div>
                </div>
                    <div class="wa-chat-actions">
                        <button class="wa-chat-btn" onclick="this.searchChat()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                    </button>
                        <button class="wa-chat-btn" onclick="this.showChatMenu()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                    </button>
                </div>
            </div>
            
                <!-- Messages Area -->
                <div class="wa-messages-container" id="chat-messages">
                ${this.renderMessages(messages)}
            </div>
            
                <!-- Input Area -->
                <div class="wa-input-container">
                    <div class="wa-input-wrapper">
                        <button class="wa-input-btn" onclick="this.toggleEmojiPicker()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                            </svg>
                        </button>
                        <button class="wa-input-btn" onclick="this.toggleAttachmentMenu()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                            </svg>
                        </button>
                        <div class="wa-input-box">
                            <textarea class="wa-message-input" 
                              id="message-input"
                                      placeholder="Digite uma mensagem"
                              rows="1"></textarea>
                        </div>
                        <button class="wa-send-btn" onclick="this.sendMessage()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
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
                    <div class="wa-welcome-icon">
                        <svg width="250" height="250" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                    </div>
                    <h1>SACMAX - Sistema de Comunicação</h1>
                    <p>Plataforma empresarial para gestão de atendimento e comunicação com clientes.</p>
                    <div class="wa-welcome-features">
                        <div class="wa-feature">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>Gestão centralizada de conversas e atendimentos.</span>
                        </div>
                        <div class="wa-feature">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>Análise automática de sentimentos e feedbacks.</span>
                        </div>
                        <div class="wa-feature">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            <span>Interface profissional para equipes de suporte.</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderClientInfoPanel() {
        if (!this.currentChat) return '';
        
        return `
            <div class="wa-client-info-panel">
                <div class="wa-client-info-header">
                    <h3>Informações do Cliente</h3>
                    <button class="wa-close-info" onclick="this.closeClientInfo()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                    </button>
                        </div>
                
                <div class="wa-client-info-content">
                    <div class="wa-client-info-section">
                        <h4>Dados Pessoais</h4>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Nome:</span>
                            <span class="wa-info-value">${this.currentChat.name}</span>
                        </div>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Documento:</span>
                            <span class="wa-info-value">${this.currentChat.documento || 'N/A'}</span>
                        </div>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Telefone 1:</span>
                            <span class="wa-info-value">${this.currentChat.telefone1 || 'N/A'}</span>
                        </div>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Telefone 2:</span>
                            <span class="wa-info-value">${this.currentChat.telefone2 || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="wa-client-info-section">
                        <h4>Dados do Serviço</h4>
                        <div class="wa-info-item">
                            <span class="wa-info-label">SA:</span>
                            <span class="wa-info-value">${this.currentChat.sa || 'N/A'}</span>
                        </div>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Serviço:</span>
                            <span class="wa-info-value">${this.currentChat.servico || 'N/A'}</span>
                        </div>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Técnico:</span>
                            <span class="wa-info-value">${this.currentChat.tecnico || 'N/A'}</span>
                        </div>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Status:</span>
                            <span class="wa-info-value wa-status-badge ${this.currentChat.status?.toLowerCase() || 'unknown'}">${this.currentChat.status || 'N/A'}</span>
                        </div>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Plano:</span>
                            <span class="wa-info-value">${this.currentChat.plano || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="wa-client-info-section">
                        <h4>Localização</h4>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Endereço:</span>
                            <span class="wa-info-value">${this.currentChat.endereco || 'N/A'}</span>
                        </div>
                        <div class="wa-info-item">
                            <span class="wa-info-label">Data:</span>
                            <span class="wa-info-value">${this.currentChat.data ? new Date(this.currentChat.data).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                    </div>
                    
                    ${this.currentChat.obs ? `
                        <div class="wa-client-info-section">
                            <h4>Observações</h4>
                            <div class="wa-info-item">
                                <span class="wa-info-value">${this.currentChat.obs}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="wa-client-info-actions">
                    <button class="wa-action-btn" onclick="this.exportClientInfo()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        Exportar Dados
                        </button>
                    <button class="wa-action-btn" onclick="this.editClientInfo()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        Editar
                        </button>
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

        return messages.map(message => {
            let messageContent = '';
            
            switch (message.type) {
                case 'document':
                    messageContent = `
                        <div class="wa-message-text">
                            <strong>📄 ${message.fileName}</strong>
                            <div class="message-file-info">
                                <svg class="message-file-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                                </svg>
                                ${message.fileSize}
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'image':
                    messageContent = `
                        <div class="wa-message-text">
                            <strong>🖼️ ${message.fileName}</strong>
                            <div class="message-file-info">
                                <svg class="message-file-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z"/>
                                </svg>
                                ${message.fileSize}
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'audio':
                    messageContent = `
                        <div class="wa-message-text">
                            <strong>🎵 ${message.fileName}</strong>
                            <div class="message-file-info">
                                <svg class="message-file-icon" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,3V12.26C11.5,12.09 11,12 10.5,12C7.46,12 5,14.46 5,17.5C5,20.54 7.46,23 10.5,23C13.54,23 16,20.54 16,17.5V6H22V3H12Z"/>
                                </svg>
                                ${message.fileSize}
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'location':
                    messageContent = `
                        <div class="wa-message-text">
                            <strong>📍 Localização</strong>
                            <div class="location-preview">
                                Latitude: ${message.latitude}<br>
                                Longitude: ${message.longitude}
                            </div>
                        </div>
                    `;
                    break;
                    
                case 'contact':
                    messageContent = `
                        <div class="wa-message-text">
                            <strong>👤 Contato</strong>
                            <div class="contact-preview">
                                <div class="contact-avatar-small">
                                    ${message.contactName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div><strong>${message.contactName}</strong></div>
                                    <div>${message.contactPhone}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                    
                default:
                    messageContent = `<div class="wa-message-text">${message.text}</div>`;
            }
            
            return `
                <div class="wa-message ${message.isOutgoing ? 'outgoing' : 'incoming'} ${message.type || ''}" data-message-id="${message.id}">
                    <div class="wa-message-content">
                        ${messageContent}
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
            `;
        }).join('');
    }

    async init() {
        await this.loadContacts();
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

    async selectContact(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (contact) {
            this.currentChat = contact;
        this.markAsRead(contactId);
            
            // Carrega mensagens do banco de dados
            await this.loadMessagesForContact(contactId);
            
        this.updateChatArea();
        this.scrollToBottom();
            
            console.log(`✅ Chat selecionado: ${contact.name}`);
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

        // Salva mensagem no banco de dados
        try {
            const response = await fetch('/api/messages/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contact_id: this.currentChat.id,
                    text: text,
                    is_outgoing: true,
                    type: 'text'
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    message.id = result.message_id.toString();
                    console.log('✅ Mensagem salva no banco de dados');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao salvar mensagem no banco:', error);
        }

        // Analisa sentimento da mensagem
        try {
            await this.analyzeMessageSentiment(text, this.currentChat.id);
        } catch (error) {
            console.error('❌ Erro ao analisar sentimento:', error);
        }

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

    async analyzeMessageSentiment(text, contactId) {
        try {
            const response = await fetch('/api/feedback/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    contact_id: contactId,
                    contact_name: this.currentChat.name,
                    contact_phone: this.currentChat.phone,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                const feedback = await response.json();
                
                // Salva feedback se for relevante
                if (feedback.sentiment !== 'neutral' || feedback.keywords.length > 0) {
                    this.saveFeedback(feedback);
                }
                
                return feedback;
            }
        } catch (error) {
            console.error('Erro ao analisar sentimento:', error);
        }
        return null;
    }

    saveFeedback(feedback) {
        // Salva feedback no localStorage
        const savedFeedbacks = JSON.parse(localStorage.getItem('sacsmax_feedbacks') || '[]');
        savedFeedbacks.push(feedback);
        localStorage.setItem('sacsmax_feedbacks', JSON.stringify(savedFeedbacks));
        
        // Notifica o módulo de feedback se estiver ativo
        const feedbackModule = window.SacsMaxApp?.modules?.feedback;
        if (feedbackModule && feedbackModule.loadFeedbacks) {
            feedbackModule.loadFeedbacks();
        }
    }

    updateMessageStatus(messageId, status) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const statusElement = messageElement.querySelector('.wa-message-status');
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

    // Métodos do WhatsApp Web - Funcionalidades Completas
    toggleStatus() {
        const statusOptions = [
            'Sistema Ativo',
            'Em Atendimento',
            'Ausente',
            'Não Perturbe',
            'Disponível'
        ];
        
        const currentStatus = document.querySelector('.wa-status').textContent;
        const currentIndex = statusOptions.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statusOptions.length;
        const newStatus = statusOptions[nextIndex];
        
        document.querySelector('.wa-status').textContent = newStatus;
        this.showInfo(`Status alterado para: ${newStatus}`);
    }

    showNewChat() {
        const contactName = prompt('Nome do contato:');
        if (contactName) {
            const contactPhone = prompt('Telefone do contato:');
            if (contactPhone) {
                const newContact = {
                    id: Date.now().toString(),
                    name: contactName,
                    phone: contactPhone,
                    lastMessage: 'Nova conversa iniciada',
                    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    unread: 0
                };
                
                this.contacts.push(newContact);
                this.renderContactsList();
                this.selectContact(newContact.id);
                this.showInfo(`Nova conversa criada com ${contactName}`);
            }
        }
    }

    showMenu() {
        const menuOptions = [
            'Novo Grupo',
            'Nova Transmissão',
            'Dispositivos Vinculados',
            'Mensagens Favoritas',
            'Configurações',
            'Sobre o SACMAX'
        ];
        
        const selected = prompt(`Menu SACMAX:\n${menuOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEscolha uma opção (1-${menuOptions.length}):`);
        
        if (selected) {
            const index = parseInt(selected) - 1;
            if (index >= 0 && index < menuOptions.length) {
                this.showInfo(`Opção selecionada: ${menuOptions[index]}`);
            }
        }
    }

    showFilterMenu() {
        const filterOptions = [
            'Todos os Chats',
            'Não Lidos',
            'Grupos',
            'Contatos',
            'Canais'
        ];
        
        const selected = prompt(`Filtros:\n${filterOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEscolha um filtro (1-${filterOptions.length}):`);
        
        if (selected) {
            const index = parseInt(selected) - 1;
            if (index >= 0 && index < filterOptions.length) {
                this.currentFilter = filterOptions[index];
                this.renderContactsList();
                this.showInfo(`Filtro aplicado: ${filterOptions[index]}`);
            }
        }
    }

    searchChat() {
        const searchTerm = prompt('Digite o termo para buscar no chat atual:');
        if (searchTerm && this.currentChat) {
            const messages = this.messages[this.currentChat.id] || [];
            const foundMessages = messages.filter(msg => 
                msg.text.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (foundMessages.length > 0) {
                this.showInfo(`Encontradas ${foundMessages.length} mensagens com "${searchTerm}"`);
                // Destacar mensagens encontradas
                this.highlightSearchResults(searchTerm);
            } else {
                this.showInfo(`Nenhuma mensagem encontrada com "${searchTerm}"`);
            }
        }
    }

    showChatMenu() {
        if (!this.currentChat) return;
        
        const menuOptions = [
            'Ver Contato',
            'Mensagens Favoritas',
            'Silenciar Notificações',
            'Limpar Conversa',
            'Exportar Chat',
            'Bloquear Contato'
        ];
        
        const selected = prompt(`Menu do Chat - ${this.currentChat.name}:\n${menuOptions.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\nEscolha uma opção (1-${menuOptions.length}):`);
        
        if (selected) {
            const index = parseInt(selected) - 1;
            if (index >= 0 && index < menuOptions.length) {
                this.executeChatAction(menuOptions[index]);
            }
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
            emojiHTML += `<span class="emoji-item" onclick="this.insertEmoji('${emoji}')">${emoji}</span>`;
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

    toggleAttachmentMenu() {
        this.showAttachmentMenu = !this.showAttachmentMenu;
        const menu = document.getElementById('attachment-menu');
        if (menu) {
            menu.style.display = this.showAttachmentMenu ? 'flex' : 'none';
        }
    }

    attachDocument() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.txt,.xlsx,.xls';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.sendDocument(file);
            }
        };
        input.click();
        this.toggleAttachmentMenu();
    }

    attachCamera() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'camera';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.sendImage(file);
            }
        };
        input.click();
        this.toggleAttachmentMenu();
    }

    attachGallery() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                this.sendImage(file);
            });
        };
        input.click();
        this.toggleAttachmentMenu();
    }

    attachAudio() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.sendAudio(file);
            }
        };
        input.click();
        this.toggleAttachmentMenu();
    }

    attachLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.sendLocation(latitude, longitude);
                },
                (error) => {
                    this.showInfo('Erro ao obter localização: ' + error.message);
                }
            );
        } else {
            this.showInfo('Geolocalização não suportada pelo navegador');
        }
        this.toggleAttachmentMenu();
    }

    attachContact() {
        const contactName = prompt('Nome do contato:');
        if (contactName) {
            const contactPhone = prompt('Telefone do contato:');
            if (contactPhone) {
                this.sendContact(contactName, contactPhone);
            }
        }
        this.toggleAttachmentMenu();
    }

    // Métodos auxiliares para funcionalidades
    sendDocument(file) {
        const message = {
            id: Date.now().toString(),
            type: 'document',
            fileName: file.name,
            fileSize: this.formatFileSize(file.size),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: true,
            status: 'sent'
        };
        
        this.addMessageToChat(message);
        this.showInfo(`Documento "${file.name}" enviado`);
    }

    sendImage(file) {
        const message = {
            id: Date.now().toString(),
            type: 'image',
            fileName: file.name,
            fileSize: this.formatFileSize(file.size),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: true,
            status: 'sent'
        };
        
        this.addMessageToChat(message);
        this.showInfo(`Imagem "${file.name}" enviada`);
    }

    sendAudio(file) {
        const message = {
            id: Date.now().toString(),
            type: 'audio',
            fileName: file.name,
            fileSize: this.formatFileSize(file.size),
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: true,
            status: 'sent'
        };
        
        this.addMessageToChat(message);
        this.showInfo(`Áudio "${file.name}" enviado`);
    }

    sendLocation(latitude, longitude) {
        const message = {
            id: Date.now().toString(),
            type: 'location',
            latitude: latitude,
            longitude: longitude,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: true,
            status: 'sent'
        };
        
        this.addMessageToChat(message);
        this.showInfo('Localização enviada');
    }

    sendContact(name, phone) {
        const message = {
            id: Date.now().toString(),
            type: 'contact',
            contactName: name,
            contactPhone: phone,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOutgoing: true,
            status: 'sent'
        };
        
        this.addMessageToChat(message);
        this.showInfo(`Contato "${name}" enviado`);
    }

    addMessageToChat(message) {
        if (!this.currentChat) return;
        
        if (!this.messages[this.currentChat.id]) {
            this.messages[this.currentChat.id] = [];
        }
        this.messages[this.currentChat.id].push(message);
        this.updateChatArea();
        this.scrollToBottom();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    highlightSearchResults(searchTerm) {
        const messages = document.querySelectorAll('.wa-message-text');
        messages.forEach(msg => {
            const text = msg.textContent;
            if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
                msg.style.backgroundColor = '#fff3cd';
                msg.style.border = '1px solid #ffeaa7';
            }
        });
    }

    executeChatAction(action) {
        switch (action) {
            case 'Ver Contato':
                this.showContactInfo();
                break;
            case 'Mensagens Favoritas':
                this.showInfo('Funcionalidade de mensagens favoritas');
                break;
            case 'Silenciar Notificações':
                this.showInfo('Notificações silenciadas para este chat');
                break;
            case 'Limpar Conversa':
                if (confirm('Tem certeza que deseja limpar esta conversa?')) {
                    this.clearChat();
                }
                break;
            case 'Exportar Chat':
                this.exportChat();
                break;
            case 'Bloquear Contato':
                this.showInfo('Contato bloqueado');
                break;
        }
    }

    showContactInfo() {
        if (!this.currentChat) return;
        
        const info = `
            Informações do Contato:
            
            Nome: ${this.currentChat.name}
            Telefone: ${this.currentChat.phone}
            Status: Online
            Última vez visto: ${new Date().toLocaleString('pt-BR')}
        `;
        
        alert(info);
    }

    clearChat() {
        if (!this.currentChat) return;
        
        this.messages[this.currentChat.id] = [];
        this.updateChatArea();
        this.showInfo('Conversa limpa');
    }

    exportChat() {
        if (!this.currentChat) return;
        
        const messages = this.messages[this.currentChat.id] || [];
        const chatData = {
            contact: this.currentChat.name,
            phone: this.currentChat.phone,
            exportDate: new Date().toISOString(),
            messages: messages
        };
        
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_${this.currentChat.name}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showInfo('Chat exportado com sucesso');
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
        const statusIndicator = document.querySelector('.wa-status');
        if (statusIndicator) {
            statusIndicator.textContent = this.isConnected ? 'Conectado' : 'Desconectado';
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

    async loadContacts() {
        try {
            const response = await fetch('/api/contacts/produtividade');
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.contacts) {
                    this.contacts = data.contacts.map(contact => ({
                        id: contact.id.toString(),
                        name: contact.nome_cliente,
                        phone: contact.telefone1 || contact.telefone2 || 'N/A',
                        email: contact.documento,
                        company: contact.servico,
                        avatar: null,
                        online: Math.random() > 0.5, // Simulação de status online
                        lastMessage: 'Cliente da produtividade',
                        lastMessageTime: contact.data ? new Date(contact.data).toLocaleDateString('pt-BR') : 'N/A',
                        // Dados completos da produtividade
                        sa: contact.sa,
                        tecnico: contact.tecnico,
                        servico: contact.servico,
                        status: contact.status,
                        data: contact.data,
                        endereco: contact.endereco,
                        documento: contact.documento,
                        telefone1: contact.telefone1,
                        telefone2: contact.telefone2,
                        plano: contact.plano,
                        obs: contact.obs
                    }));
                    
                    // Inicializa contadores de não lidas
                    this.contacts.forEach(contact => {
                        if (!this.unreadCounts[contact.id]) {
                            this.unreadCounts[contact.id] = Math.floor(Math.random() * 3);
                        }
                    });
                    
                    console.log(`✅ Carregados ${this.contacts.length} contatos do banco de dados`);
                } else {
                    throw new Error(data.error || 'Erro ao carregar contatos');
                }
            } else {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar contatos do banco:', error);
            
            // Fallback para dados mock
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

        // Inicializa contadores de não lidas
        this.contacts.forEach(contact => {
            if (!this.unreadCounts[contact.id]) {
                this.unreadCounts[contact.id] = Math.floor(Math.random() * 3);
            }
        });
        }
    }

    loadMessages() {
        // Carrega mensagens do localStorage como cache
        const savedMessages = localStorage.getItem('sacsmax_messages');
        if (savedMessages) {
            this.messages = JSON.parse(savedMessages);
        } else {
            this.messages = {};
        }
    }

    async loadMessagesForContact(contactId) {
        try {
            const response = await fetch(`/api/messages/${contactId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.messages) {
                    this.messages[contactId] = data.messages;
                    // Atualiza cache
                    localStorage.setItem('sacsmax_messages', JSON.stringify(this.messages));
                    console.log(`✅ Carregadas ${data.messages.length} mensagens para o contato ${contactId}`);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao carregar mensagens do banco:', error);
        }
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
    .whatsapp-web-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #f0f0f0;
    }

    .wa-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: #dc3545;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .wa-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .wa-profile-pic {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
    }

    .wa-profile-pic img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .wa-header-title h2 {
        margin: 0;
        font-size: 18px;
    }

    .wa-header-title .wa-status {
        font-size: 14px;
        opacity: 0.8;
    }

    .wa-header-right {
        display: flex;
        gap: 10px;
    }

    .wa-header-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: background 0.2s ease;
    }

    .wa-header-btn:hover {
        background: rgba(255,255,255,0.2);
    }

    .wa-main-container {
        display: flex;
        height: calc(100% - 60px); /* Adjust for header height */
    }

    .wa-sidebar {
        width: 350px;
        border-right: 1px solid #e0e0e0;
        display: flex;
        flex-direction: column;
        background: #f0f0f0;
    }

    .wa-search-container {
        padding: 10px 15px;
        border-bottom: 1px solid #e0e0e0;
    }

    .wa-search-box {
        display: flex;
        align-items: center;
        background: #e0e0e0;
        border-radius: 20px;
        padding: 5px 10px;
    }

    .wa-search-icon {
        margin-right: 10px;
        color: #666;
    }

    .wa-search-input {
        flex: 1;
        border: none;
        background: none;
        padding: 5px 0;
        font-size: 14px;
        outline: none;
    }

    .wa-search-filter {
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        padding: 5px;
    }

    .wa-chats-list {
        flex: 1;
        overflow-y: auto;
    }

    .wa-chat-item {
        display: flex;
        align-items: center;
        padding: 10px 15px;
        cursor: pointer;
        transition: background 0.2s ease;
        border-bottom: 1px solid #e0e0e0;
    }

    .wa-chat-item:hover {
        background: #e0e0e0;
    }

    .wa-chat-item.active {
        background: #d0e6f7;
    }

    .wa-chat-avatar {
        position: relative;
        margin-right: 10px;
    }

    .wa-chat-avatar img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .wa-chat-status {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
    }

    .wa-chat-status.online {
        background: #4CAF50; /* Green for online */
    }

    .wa-chat-status.offline {
        background: #9E9E9E; /* Gray for offline */
    }

    .wa-chat-info {
        flex: 1;
        min-width: 0;
    }

    .wa-chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .wa-chat-name {
        font-weight: 500;
        color: #333;
        font-size: 14px;
    }

    .wa-chat-time {
        font-size: 12px;
        color: #999;
    }

    .wa-chat-preview {
        display: flex;
        align-items: center;
        margin-top: 5px;
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
        background: #128C7E; /* WhatsApp green for unread */
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        margin-left: 10px;
    }

    .wa-chat-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #f0f0f0;
    }

    .wa-chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #f0f0f0;
    }

    .wa-chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        border-bottom: 1px solid #e0e0e0;
        background: #e0e0e0;
    }

    .wa-chat-contact {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .wa-chat-details {
        display: flex;
        flex-direction: column;
    }

    .wa-chat-name {
        font-weight: 500;
        color: #333;
        font-size: 16px;
    }

    .wa-chat-status-text {
        font-size: 13px;
        color: #666;
    }

    .wa-chat-actions {
        display: flex;
        gap: 10px;
    }

    .wa-chat-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: background 0.2s ease;
    }

    .wa-chat-btn:hover {
        background: rgba(0,0,0,0.1);
    }

    .wa-messages-container {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        background: #f0f0f0;
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
        padding: 8px 12px;
        border-radius: 15px;
        position: relative;
    }

    .wa-message.outgoing .wa-message-content {
        background: #dcf8c6; /* WhatsApp green for outgoing messages */
        color: #333;
        border-bottom-right-radius: 5px;
    }

    .wa-message.incoming .wa-message-content {
        background: #fff;
        color: #333;
        border-bottom-left-radius: 5px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .wa-message-text {
        margin-bottom: 5px;
        line-height: 1.4;
    }

    .wa-message-time {
        font-size: 10px;
        opacity: 0.7;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .wa-message-status {
        font-size: 12px;
    }

    .wa-input-container {
        padding: 10px 15px;
        border-top: 1px solid #e0e0e0;
        background: #f0f0f0;
    }

    .wa-input-wrapper {
        display: flex;
        align-items: flex-end;
        gap: 10px;
        background: #fff;
        border-radius: 25px;
        padding: 5px 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .wa-input-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        transition: background 0.2s ease;
    }

    .wa-input-btn:hover {
        background: #e0e0e0;
    }

    .wa-input-box {
        flex: 1;
    }

    .wa-message-input {
        width: 100%;
        border: none;
        background: none;
        padding: 8px 10px;
        font-size: 14px;
        resize: none;
        outline: none;
        height: 30px; /* Initial height */
        overflow-y: hidden;
    }

    .wa-message-input:focus {
        outline: none;
    }

    .wa-send-btn {
        background: #25D366; /* WhatsApp green for send button */
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .wa-send-btn:hover {
        background: #128C7E;
    }

    .wa-send-btn:active {
        background: #075e54;
    }

    .wa-welcome-screen {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f0f0;
    }

    .wa-welcome-content {
        text-align: center;
        max-width: 400px;
    }

    .wa-welcome-icon {
        font-size: 4rem;
        margin-bottom: 15px;
    }

    .wa-welcome-content h1 {
        color: #333;
        margin-bottom: 10px;
        font-size: 24px;
    }

    .wa-welcome-content p {
        color: #666;
        margin-bottom: 20px;
        font-size: 16px;
    }

    .wa-welcome-features {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .wa-feature {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #666;
        font-size: 14px;
    }

    .wa-feature svg {
        width: 20px;
        height: 20px;
        color: #666;
    }

    .wa-empty-state {
        text-align: center;
        padding: 30px 20px;
        color: #666;
    }

    .wa-empty-icon {
        font-size: 3rem;
        margin-bottom: 15px;
    }

    .wa-empty-chat {
        text-align: center;
        padding: 30px 20px;
        color: #666;
    }

    .wa-empty-chat-icon {
        font-size: 3rem;
        margin-bottom: 15px;
    }

    .wa-attachment-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 1000;
    }

    .wa-attachment-menu .wa-attachment-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 15px 20px;
        cursor: pointer;
        transition: background 0.2s ease;
        border-bottom: 1px solid #e0e0e0;
    }

    .wa-attachment-menu .wa-attachment-item:last-child {
        border-bottom: none;
    }

    .wa-attachment-menu .wa-attachment-item:hover {
        background: #e0e0e0;
    }

    .wa-attachment-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wa-attachment-icon.document {
        color: #075e54; /* WhatsApp green for document */
    }

    .wa-attachment-icon.camera {
        color: #128C7E; /* WhatsApp green for camera */
    }

    .wa-attachment-icon.gallery {
        color: #075e54; /* WhatsApp green for gallery */
    }

    .wa-attachment-icon.audio {
        color: #128C7E; /* WhatsApp green for audio */
    }

    .wa-attachment-icon.location {
        color: #128C7E; /* WhatsApp green for location */
    }

    .wa-attachment-icon.contact {
        color: #128C7E; /* WhatsApp green for contact */
    }

    .emoji-panel {
        position: absolute;
        bottom: 100%;
        left: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 0.5rem;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.25rem;
        z-index: 1000;
        max-width: 200px;
    }

    .emoji-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.2rem;
        transition: background-color 0.2s ease;
    }

    .emoji-item:hover {
        background: #f0f0f0;
    }

    .wa-message.document {
        background: #e3f2fd;
        border: 1px solid #bbdefb;
    }

    .wa-message.image {
        background: #f3e5f5;
        border: 1px solid #e1bee7;
    }

    .wa-message.audio {
        background: #e8f5e8;
        border: 1px solid #c8e6c9;
    }

    .wa-message.location {
        background: #fff3e0;
        border: 1px solid #ffcc80;
    }

    .wa-message.contact {
        background: #fce4ec;
        border: 1px solid #f8bbd9;
    }

    .message-file-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        color: #666;
    }

    .message-file-icon {
        width: 16px;
        height: 16px;
    }

    .location-preview {
        background: #f5f5f5;
        border-radius: 4px;
        padding: 0.5rem;
        margin-top: 0.25rem;
        font-size: 0.8rem;
        color: #666;
    }

    .contact-preview {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.25rem;
        padding: 0.5rem;
        background: #f5f5f5;
        border-radius: 4px;
    }

    .contact-avatar-small {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #dc3545;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 0.7rem;
        font-weight: bold;
    }

    .wa-client-info-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 350px;
        height: 100vh;
        background: white;
        border-left: 1px solid #e0e0e0;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        z-index: 1000;
        overflow-y: auto;
        animation: slideInRight 0.3s ease;
    }

    .wa-client-info-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
    }

    .wa-client-info-header h3 {
        margin: 0;
        color: #333;
        font-size: 1.1rem;
    }

    .wa-close-info {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
        transition: background-color 0.2s ease;
    }

    .wa-close-info:hover {
        background: #e9ecef;
    }

    .wa-client-info-content {
        padding: 1rem;
    }

    .wa-client-info-section {
        margin-bottom: 1.5rem;
    }

    .wa-client-info-section h4 {
        margin: 0 0 0.75rem 0;
        color: #495057;
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .wa-info-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f8f9fa;
    }

    .wa-info-item:last-child {
        border-bottom: none;
    }

    .wa-info-label {
        font-weight: 500;
        color: #666;
        font-size: 0.85rem;
        min-width: 100px;
    }

    .wa-info-value {
        color: #333;
        font-size: 0.85rem;
        text-align: right;
        flex: 1;
        word-break: break-word;
    }

    .wa-status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
    }

    .wa-status-badge.finalizado {
        background: #d4edda;
        color: #155724;
    }

    .wa-status-badge.reagendado {
        background: #fff3cd;
        color: #856404;
    }

    .wa-status-badge.ca-vencido {
        background: #f8d7da;
        color: #721c24;
    }

    .wa-status-badge.unknown {
        background: #e2e3e5;
        color: #383d41;
    }

    .wa-client-info-actions {
        padding: 1rem;
        border-top: 1px solid #e0e0e0;
        background: #f8f9fa;
        display: flex;
        gap: 0.5rem;
    }

    .wa-action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        border: 1px solid #dc3545;
        background: white;
        color: #dc3545;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s ease;
        flex: 1;
        justify-content: center;
    }

    .wa-action-btn:hover {
        background: #dc3545;
        color: white;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
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
