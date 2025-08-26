// Módulo Disparo de Mensagens - 100% Funcional (PostgreSQL + WhatsApp)
// Filosofia: Python responsável por TUDO, JS apenas frontend

class MessagesModule {
    constructor() {
        this.backendUrl = window.location.origin;
        this.whatsappUrl = 'http://localhost:3001';
        this.contacts = [];
        this.filteredContacts = [];
        this.selectedContacts = new Set();
        this.messageText = '';
        this.loading = false;
        this.sending = false;
        this.logs = [];
        this.progress = {
            total: 0,
            sent: 0,
            failed: 0,
            current: null
        };
        this.cache = {
            data: null,
            lastUpdate: null,
            cacheTimeout: 300000, // 5 minutos
            isInitialized: false
        };
        this.connectionHealth = {
            isConnected: false,
            autoReconnect: true,
            reconnectAttempts: 0,
            maxAttempts: 5,
            timeout: 10000 // 10 segundos
        };
    }

    render() {
        return `
            <div class="module-container fade-in">
                <!-- Header Moderno -->
                <div class="messages-header">
                    <div class="header-gradient">
                        <div class="header-content">
                            <div class="header-left">
                                <div class="header-icon">📤</div>
                                <div class="header-text">
                                    <h1 class="module-title">Disparo de Mensagens</h1>
                                    <p class="module-subtitle">Envio em massa inteligente via WhatsApp</p>
                                </div>
                            </div>
                            <div class="header-right">
                                <div class="connection-badge ${this.loading ? 'loading' : 'connected'}">
                                    <span class="badge-dot"></span>
                                    <span class="badge-text">${this.loading ? 'Conectando...' : 'Conectado'}</span>
                                </div>
                                <button class="btn btn-primary" onclick="messagesModule.loadContacts()">
                                    <span class="btn-icon">🔄</span>
                                    Atualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Dashboard Stats -->
                <div class="stats-dashboard">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.contacts.length}</div>
                            <div class="stat-label">Total de Contatos</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.selectedContacts.size}</div>
                            <div class="stat-label">Selecionados</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📤</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.progress.sent}</div>
                            <div class="stat-label">Enviadas</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">❌</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.progress.failed}</div>
                            <div class="stat-label">Falhas</div>
                        </div>
                    </div>
                </div>

                <!-- Progress Bar (quando enviando) -->
                ${this.sending ? `
                    <div class="progress-section">
                        <div class="progress-header">
                            <h3>📤 Enviando Mensagens</h3>
                            <span class="progress-text">${this.progress.sent}/${this.progress.total} enviadas</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.progress.sent / this.progress.total) * 100}%"></div>
                        </div>
                        <div class="progress-details">
                            <span class="current-contact">${this.progress.current || 'Aguardando...'}</span>
                        </div>
                    </div>
                ` : ''}

                <!-- Main Content Grid -->
                <div class="messages-grid">
                    <!-- Left Column: Filtros e Contatos -->
                    <div class="left-column">
                        <!-- Filtros Avançados -->
                        <div class="filters-card">
                            <div class="card-header">
                                <h3>🔍 Filtros Inteligentes</h3>
                                <button class="btn btn-sm" onclick="messagesModule.clearFilters()">
                                    <span class="btn-icon">🗑️</span>
                                    Limpar
                                </button>
                            </div>
                            
                            <div class="filters-content">
                                <div class="filter-row">
                            <div class="filter-group">
                                        <label>🔎 Buscar</label>
                                        <input type="text" id="search-contacts" placeholder="Nome, telefone, SA..." />
                            </div>
                            <div class="filter-group">
                                        <label>📊 Status</label>
                                        <select id="status-filter">
                                            <option value="">Todos os status</option>
                                            <option value="ativo">Ativo</option>
                                            <option value="pendente">Pendente</option>
                                            <option value="concluido">Concluído</option>
                                        </select>
                            </div>
                                </div>
                                
                                <div class="filter-row">
                            <div class="filter-group">
                                        <label>👨‍🔧 Técnico</label>
                                        <select id="technician-filter">
                                            <option value="">Todos os técnicos</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                        <label>🔧 Serviço</label>
                                        <select id="service-filter">
                                            <option value="">Todos os serviços</option>
                                </select>
                            </div>
                                </div>
                                
                                <div class="filter-actions">
                                    <button class="btn btn-primary" onclick="messagesModule.applyFilters()">
                                        <span class="btn-icon">🔍</span>
                                        Aplicar Filtros
                            </button>
                                </div>
                        </div>
                    </div>

                        <!-- Lista de Contatos -->
                        <div class="contacts-card">
                            <div class="card-header">
                                <div class="header-left">
                                    <h3>📋 Contatos</h3>
                                    <span class="contacts-count">${this.filteredContacts.length} encontrados</span>
                            </div>
                                <div class="header-right">
                                    <button class="btn btn-sm" onclick="messagesModule.selectAllContacts()">
                                        <span class="btn-icon">☑️</span>
                                        Todos
                                    </button>
                                    <button class="btn btn-sm" onclick="messagesModule.deselectAllContacts()">
                                        <span class="btn-icon">❌</span>
                                        Nenhum
                                    </button>
                        </div>
                            </div>
                            
                            <div class="contacts-list" id="contacts-list">
                                ${this.renderContactsList()}
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Mensagem e Envio -->
                    <div class="right-column">
                    <!-- Configuração da Mensagem -->
                        <div class="message-card">
                            <div class="card-header">
                                <h3>💬 Mensagem</h3>
                                <div class="message-stats">
                                    <span class="char-count">0 caracteres</span>
                                    <span class="selected-count">${this.selectedContacts.size} selecionados</span>
                            </div>
                            </div>
                            
                            <div class="message-content">
                            <div class="message-editor">
                                    <textarea id="message-text" placeholder="Digite sua mensagem aqui...&#10;&#10;Variáveis disponíveis:&#10;{nome} - Nome do cliente&#10;{telefone} - Telefone do cliente&#10;{sa} - Número do SA&#10;{tecnico} - Nome do técnico&#10;{servico} - Tipo de serviço&#10;{data} - Data do serviço"></textarea>
                                </div>
                                
                                <!-- Templates Rápidos -->
                                <div class="templates-section">
                                    <h4>📝 Templates</h4>
                                    <div class="templates-grid">
                                        <button class="template-btn" onclick="messagesModule.loadTemplate('agendamento')">
                                            <span class="template-icon">📅</span>
                                            <span class="template-title">Agendamento</span>
                                        </button>
                                        <button class="template-btn" onclick="messagesModule.loadTemplate('lembrete')">
                                            <span class="template-icon">⏰</span>
                                            <span class="template-title">Lembrete</span>
                                        </button>
                                        <button class="template-btn" onclick="messagesModule.loadTemplate('confirmacao')">
                                            <span class="template-icon">✅</span>
                                            <span class="template-title">Confirmação</span>
                                        </button>
                                        <button class="template-btn" onclick="messagesModule.loadTemplate('promocao')">
                                            <span class="template-icon">🎉</span>
                                            <span class="template-title">Promoção</span>
                                        </button>
                            </div>
                                </div>
                            </div>
                        </div>

                        <!-- Ações de Envio -->
                        <div class="send-card">
                            <div class="card-header">
                                <h3>🚀 Enviar</h3>
                                <div class="send-status" id="send-status">
                                    <span class="status-dot ready"></span>
                                    <span class="status-text">Pronto</span>
                        </div>
                    </div>

                            <div class="send-actions">
                                <button class="btn btn-secondary" onclick="messagesModule.testMessage()" ${this.selectedContacts.size === 0 ? 'disabled' : ''}>
                                    <span class="btn-icon">🧪</span>
                                    Testar (1 contato)
                            </button>
                                <button class="btn btn-primary btn-large" onclick="messagesModule.sendMessages()" ${this.selectedContacts.size === 0 ? 'disabled' : ''}>
                                    <span class="btn-icon">📤</span>
                                    Enviar para ${this.selectedContacts.size} contatos
                            </button>
                        </div>
                    </div>

                        <!-- Logs em Tempo Real -->
                        <div class="logs-card">
                            <div class="card-header">
                                <h3>📋 Logs</h3>
                                <button class="btn btn-sm" onclick="messagesModule.clearLogs()">
                                    <span class="btn-icon">🗑️</span>
                                    Limpar
                                </button>
                            </div>
                            
                            <div class="logs-content" id="messages-logs">
                                ${this.renderSystemLogs()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderContactsList() {
        if (this.loading) {
            return '<div class="loading">Carregando contatos do PostgreSQL...</div>';
        }

        if (this.filteredContacts.length === 0) {
            return '<div class="no-data">Nenhum contato encontrado</div>';
        }

        return this.filteredContacts.map(contact => `
            <div class="contact-item ${this.selectedContacts.has(contact.id) ? 'selected' : ''}" data-id="${contact.id}">
                <div class="contact-checkbox">
                    <input type="checkbox" 
                           id="contact-${contact.id}" 
                           ${this.selectedContacts.has(contact.id) ? 'checked' : ''}
                           onchange="messagesModule.toggleContact('${contact.id}')" />
                </div>
                
                <div class="contact-info">
                    <div class="contact-main">
                        <div class="contact-name">${contact.nome_cliente || 'N/A'}</div>
                        <div class="contact-phone">${contact.telefone1 || contact.telefone2 || 'N/A'}</div>
                    </div>
                    
                    <div class="contact-details">
                        <div class="detail-item">
                            <span class="detail-label">SA:</span>
                            <span class="detail-value">${contact.sa || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Técnico:</span>
                            <span class="detail-value">${contact.tecnico || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Serviço:</span>
                            <span class="detail-value">${contact.servico || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="status-badge ${contact.status?.toLowerCase()}">${contact.status || 'Pendente'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderSystemLogs() {
        const logs = JSON.parse(localStorage.getItem('messages_logs') || '[]');
        if (logs.length === 0) {
            return '<div class="no-logs">Nenhum log disponível</div>';
        }

        return logs.slice(-10).reverse().map(log => `
            <div class="log-item ${log.type}">
                <div class="log-message">${log.message}</div>
                <div class="log-time">${log.time}</div>
            </div>
        `).join('');
    }

    async init() {
        this.setupEventListeners();
        
        // NOVO: Verificar conectividade antes de carregar dados
        await this.checkConnectionAndLoad();
        
        // IMPORTANTE: Forçar atualização da interface após inicialização
        setTimeout(() => {
            this.updateContactsDisplay();
            this.updateLogsDisplay();
        }, 100);
        
        this.addLog('info', 'Módulo Disparo de Mensagens inicializado com cache');
    }

    // NOVO: Verificar conectividade e carregar dados
    async checkConnectionAndLoad() {
        try {
            console.log('🔌 Verificando conectividade (Messages)...');
            
            // Health check simples
            const response = await fetch(`${this.backendUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                console.log('✅ Conectado ao servidor (Messages), carregando dados...');
                await this.initializeCache();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Erro de conectividade (Messages):', error.message);
            
            // Tentar novamente em 3 segundos
            setTimeout(() => {
                this.checkConnectionAndLoad();
            }, 3000);
        }
    }

    // NOVO: Sistema de cache inteligente
    async initializeCache() {
        // Verificar conectividade primeiro
        if (!this.connectionHealth.isConnected) {
            console.log('🔌 Aguardando conexão (Messages)...');
            await this.performHealthCheck();
            
            if (!this.connectionHealth.isConnected) {
                console.error('❌ Sem conexão, não é possível carregar dados (Messages)');
                this.showConnectionError();
                return;
            }
        }

        if (this.cache.isInitialized && this.isCacheValid()) {
            console.log('💾 Usando dados do cache (Messages)');
            this.contacts = this.cache.data;
            this.filteredContacts = [...this.contacts];
            this.updateFilters();
            this.updateContactsDisplay();
            this.addLog('info', `💾 ${this.contacts.length} registros carregados do cache (Messages)`);
            return;
        }

        await this.loadContacts();
    }

    isCacheValid() {
        if (!this.cache.data || !this.cache.lastUpdate) return false;
        const now = Date.now();
        return (now - this.cache.lastUpdate) < this.cache.cacheTimeout;
    }

    updateCache(data) {
        this.cache.data = data;
        this.cache.lastUpdate = Date.now();
        this.cache.isInitialized = true;
        console.log('💾 Cache atualizado (Messages):', this.cache);
    }

    // NOVO: Forçar atualização (ignora cache)
    async forceRefresh() {
        this.cache.isInitialized = false;
        this.cache.data = null;
        this.cache.lastUpdate = null;
        await this.loadContacts();
    }

    // NOVO: Mostrar erro de conexão
    showConnectionError() {
        const contactsList = document.querySelector('.contacts-list');
        if (contactsList) {
            contactsList.innerHTML = `
                <div class="connection-error">
                    <div class="error-icon">🔌</div>
                    <div class="error-title">Sem conexão com o servidor</div>
                    <div class="error-message">Verificando conexão automaticamente...</div>
                    <button class="btn btn-retry" onclick="messagesModule.forceReconnect()">
                        🔄 Tentar Reconectar
                    </button>
                </div>
            `;
        }
    }

    // NOVO: Forçar reconexão
    async forceReconnect() {
        console.log('🔄 Forçando reconexão (Messages)...');
        this.connectionHealth.reconnectAttempts = 0;
        this.connectionHealth.autoReconnect = true;
        
        await this.performHealthCheck();
        
        if (this.connectionHealth.isConnected) {
            await this.initializeCache();
        }
    }

    setupEventListeners() {
        setTimeout(() => {
            const searchInput = document.getElementById('search-contacts');
            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                    this.applyFilters();
                    }, 500); // Debounce de 500ms
                });
            }

            const messageText = document.getElementById('message-text');
            if (messageText) {
                messageText.addEventListener('input', (e) => {
                    this.messageText = e.target.value;
                    this.updateCharCount();
                    this.setupCharCounter();
                });
            }

            // Adicionar listeners para filtros
            const statusFilter = document.getElementById('status-filter');
            if (statusFilter) {
                statusFilter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }

            const technicianFilter = document.getElementById('technician-filter');
            if (technicianFilter) {
                technicianFilter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }

            const serviceFilter = document.getElementById('service-filter');
            if (serviceFilter) {
                serviceFilter.addEventListener('change', () => {
                    this.applyFilters();
                });
            }
        }, 100);
    }

    setupCharCounter() {
        const messageInput = document.getElementById('message-text');
        if (messageInput) {
            const charCount = messageInput.value.length;
            const charCountElement = document.querySelector('.char-count');
            if (charCountElement) {
                charCountElement.textContent = `${charCount} caracteres`;
            }
        }
    }

    async loadContacts() {
        this.loading = true;
        this.updateConnectionStatus();

        try {
            const response = await fetch(`${this.backendUrl}/api/productivity/contacts`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                this.contacts = (data.contacts || []).map((contact, index) => ({
                    ...contact,
                    id: `contact_${index}`
                }));
                this.filteredContacts = [...this.contacts];
                this.updateFilters();
                this.updateCache(this.contacts); // Atualiza cache
                this.addLog('success', `${this.contacts.length} contatos carregados do PostgreSQL`);
            } else {
                    throw new Error(data.message || 'Erro na resposta do servidor');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Erro ao carregar contatos');
            }
        } catch (error) {
            this.addLog('error', `Erro: ${error.message}`);
            this.contacts = [];
            this.filteredContacts = [];
        } finally {
            this.loading = false;
            this.updateConnectionStatus();
        }
    }

    updateFilters() {
        // Atualiza filtros de técnico
        const technicians = [...new Set(this.contacts.map(c => c.tecnico).filter(Boolean))];
        const technicianSelect = document.getElementById('technician-filter');
        if (technicianSelect) {
            technicianSelect.innerHTML = '<option value="">Todos os técnicos</option>' + 
                technicians.map(tech => `<option value="${tech}">${tech}</option>`).join('');
        }

        // Atualiza filtros de serviço
        const services = [...new Set(this.contacts.map(c => c.servico).filter(Boolean))];
        const serviceSelect = document.getElementById('service-filter');
        if (serviceSelect) {
            serviceSelect.innerHTML = '<option value="">Todos os serviços</option>' + 
                services.map(service => `<option value="${service}">${service}</option>`).join('');
        }
    }

    async applyFilters() {
        const searchTerm = document.getElementById('search-contacts')?.value || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const technicianFilter = document.getElementById('technician-filter')?.value || '';
        const serviceFilter = document.getElementById('service-filter')?.value || '';

        // Construir URL com parâmetros
        const params = new URLSearchParams();
        if (searchTerm) params.append('q', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        if (technicianFilter) params.append('tecnico', technicianFilter);
        if (serviceFilter) params.append('servico', serviceFilter);
        params.append('limit', '1000');

        try {
            const response = await fetch(`${this.backendUrl}/api/productivity/search?${params}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.filteredContacts = (data.contacts || []).map((contact, index) => ({
                        ...contact,
                        id: `contact_${index}`
                    }));
                    this.updateContactsDisplay();
                    this.addLog('info', `Filtros aplicados: ${this.filteredContacts.length} contatos encontrados`);
                } else {
                    throw new Error(data.message || 'Erro na busca');
                }
            } else {
                throw new Error('Erro na requisição de busca');
            }
        } catch (error) {
            this.addLog('error', `Erro na busca: ${error.message}`);
            // Fallback para filtro local
            this.applyLocalFilters();
        }
    }

    applyLocalFilters() {
        const searchTerm = document.getElementById('search-contacts')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const technicianFilter = document.getElementById('technician-filter')?.value || '';
        const serviceFilter = document.getElementById('service-filter')?.value || '';

        this.filteredContacts = this.contacts.filter(contact => {
            const matchesSearch = !searchTerm || 
                (contact.nome_cliente?.toLowerCase().includes(searchTerm)) ||
                (contact.telefone1?.includes(searchTerm)) ||
                (contact.telefone2?.includes(searchTerm)) ||
                (contact.sa?.toLowerCase().includes(searchTerm));

            const matchesStatus = !statusFilter || contact.status?.toLowerCase() === statusFilter.toLowerCase();
            const matchesTechnician = !technicianFilter || contact.tecnico === technicianFilter;
            const matchesService = !serviceFilter || contact.servico === serviceFilter;

            return matchesSearch && matchesStatus && matchesTechnician && matchesService;
        });

        this.updateContactsDisplay();
        this.addLog('info', `Filtros locais aplicados: ${this.filteredContacts.length} contatos encontrados`);
    }

    async clearFilters() {
        document.getElementById('search-contacts').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('technician-filter').value = '';
        document.getElementById('service-filter').value = '';
        
        // Recarregar todos os contatos
        await this.loadContacts();
        this.addLog('info', 'Filtros limpos');
    }

    toggleContact(contactId) {
        if (this.selectedContacts.has(contactId)) {
            this.selectedContacts.delete(contactId);
        } else {
            this.selectedContacts.add(contactId);
        }
        
        this.updateSelectedCount();
        this.updateSendButton();
    }

    selectAllContacts() {
        this.filteredContacts.forEach(contact => {
            this.selectedContacts.add(contact.id);
        });
        this.updateContactsDisplay();
        this.updateSelectedCount();
        this.updateSendButton();
        this.addLog('info', 'Todos os contatos selecionados');
    }

    deselectAllContacts() {
        this.selectedContacts.clear();
        this.updateContactsDisplay();
        this.updateSelectedCount();
        this.updateSendButton();
        this.addLog('info', 'Todos os contatos desmarcados');
    }

    loadTemplate(templateType) {
        const templates = {
            agendamento: `Olá {nome}! 👋

Confirmamos seu agendamento para o serviço {servico}.

📅 Data: {data}
👨‍🔧 Técnico: {tecnico}
📋 SA: {sa}

Em caso de dúvidas, entre em contato conosco.

Obrigado! 🙏`,
            
            lembrete: `Olá {nome}! ⏰

Lembramos que você tem um serviço agendado:

📅 Data: {data}
👨‍🔧 Técnico: {tecnico}
📋 SA: {sa}
🔧 Serviço: {servico}

Por favor, confirme sua disponibilidade.

Obrigado! 🙏`,
            
            confirmacao: `Olá {nome}! ✅

Seu serviço foi concluído com sucesso!

📋 SA: {sa}
👨‍🔧 Técnico: {tecnico}
🔧 Serviço: {servico}

Agradecemos sua confiança! 🙏`,
            
            promocao: `Olá {nome}! 🎉

Temos uma promoção especial para você!

📋 SA: {sa}
🔧 Serviço: {servico}

Entre em contato para mais detalhes!

Obrigado! 🙏`
        };

        const messageText = document.getElementById('message-text');
        if (messageText && templates[templateType]) {
            messageText.value = templates[templateType];
            this.messageText = templates[templateType];
            this.updateCharCount();
            this.addLog('info', `Template "${templateType}" carregado`);
        }
    }

    updateCharCount() {
        const charCount = document.querySelector('.char-count');
        if (charCount) {
            charCount.textContent = `${this.messageText.length} caracteres`;
        }
    }

    updateSelectedCount() {
        const selectedCount = document.querySelector('.selected-count');
        if (selectedCount) {
            selectedCount.textContent = `${this.selectedContacts.size} contatos selecionados`;
        }
    }

    updateSendButton() {
        const sendButton = document.querySelector('.btn-send');
        if (sendButton) {
            sendButton.disabled = this.selectedContacts.size === 0;
            sendButton.innerHTML = `
                <span class="btn-icon">📤</span>
                Enviar para ${this.selectedContacts.size} contatos
            `;
        }

        const testButton = document.querySelector('.btn-test');
        if (testButton) {
            testButton.disabled = this.selectedContacts.size === 0;
        }
    }

    updateConnectionStatus() {
        const statusIndicator = document.querySelector('.connection-status .status-indicator');
        if (statusIndicator) {
            statusIndicator.className = `status-indicator ${this.loading ? 'loading' : 'connected'}`;
            const statusText = statusIndicator.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = this.loading ? 'Carregando...' : 'Conectado ao PostgreSQL';
            }
        }
    }

    updateContactsDisplay() {
        const contactsList = document.getElementById('contacts-list');
        if (contactsList) {
            contactsList.innerHTML = this.renderContactsList();
        }

        const contactsCount = document.querySelector('.contacts-count');
        if (contactsCount) {
            contactsCount.textContent = `${this.filteredContacts.length} contatos encontrados`;
        }
    }

    async testMessage() {
        if (this.selectedContacts.size === 0) {
            this.addLog('error', 'Nenhum contato selecionado para teste');
            return;
        }

        if (!this.messageText.trim()) {
            this.addLog('error', 'Digite uma mensagem para o teste');
            return;
        }

        this.sending = true;
        this.updateSendStatus('Testando...');

        try {
            const selectedContact = this.contacts.find(c => c.id === Array.from(this.selectedContacts)[0]);
            const message = this.replaceVariables(this.messageText, selectedContact);

            const response = await fetch(`${this.backendUrl}/api/send-message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionName: 'sacmax',
                    number: selectedContact.telefone1 || selectedContact.telefone2,
                    text: message
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.addLog('success', `Teste enviado com sucesso para ${selectedContact.nome_cliente}`);
                } else {
                    throw new Error(data.message || 'Erro no envio');
                }
            } else {
                throw new Error('Erro na requisição');
            }
        } catch (error) {
            this.addLog('error', `Erro no teste: ${error.message}`);
        } finally {
            this.sending = false;
            this.updateSendStatus('Pronto');
        }
    }

    async sendMessages() {
        if (this.selectedContacts.size === 0) {
            this.addLog('warning', 'Nenhum contato selecionado');
            return;
        }

        const messageText = document.getElementById('message-text').value.trim();
        if (!messageText) {
            this.addLog('warning', 'Mensagem não pode estar vazia');
            return;
        }

        const confirmed = confirm(`Enviar mensagem para ${this.selectedContacts.size} contatos?`);
        if (!confirmed) return;

        this.sending = true;
        this.progress = {
            total: this.selectedContacts.size,
            sent: 0,
            failed: 0,
            current: null
        };
        this.updateSendStatus('Enviando...');
        this.addLog('info', `Iniciando envio para ${this.selectedContacts.size} contatos`);

        const selectedContacts = this.contacts.filter(c => this.selectedContacts.has(c.id));
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < selectedContacts.length; i++) {
            const contact = selectedContacts[i];
            this.progress.current = contact.nome_cliente;
            this.updateProgress();
            
            try {
                const personalizedMessage = this.replaceVariables(messageText, contact);
                
                const response = await fetch(`${this.backendUrl}/api/send-message`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionName: 'sacmax',
                        number: contact.telefone1 || contact.telefone2,
                        text: personalizedMessage
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        successCount++;
                        this.progress.sent++;
                        this.addLog('success', `✅ Enviado para ${contact.nome_cliente} (${contact.telefone1 || contact.telefone2})`);
                    } else {
                        errorCount++;
                        this.progress.failed++;
                        this.addLog('error', `❌ Falha ao enviar para ${contact.nome_cliente}: ${data.message}`);
                    }
                } else {
                    errorCount++;
                    this.progress.failed++;
                    this.addLog('error', `❌ Erro na requisição para ${contact.nome_cliente}`);
                }

                // Aguardar 1 segundo entre mensagens
                if (i < selectedContacts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                errorCount++;
                this.progress.failed++;
                this.addLog('error', `❌ Erro ao enviar para ${contact.nome_cliente}: ${error.message}`);
            }
        }

        this.sending = false;
        this.progress.current = null;
        this.updateSendStatus('Concluído');
        this.addLog('info', `🎉 Envio concluído! ${successCount} sucessos, ${errorCount} falhas`);
        
        // Atualizar estatísticas
        this.updateStats();
    }

    updateProgress() {
        // Forçar re-render para mostrar progresso
        const container = document.querySelector('.module-container');
        if (container) {
            container.innerHTML = this.render();
        }
    }

    updateStats() {
        // Atualizar estatísticas no dashboard
        const statCards = document.querySelectorAll('.stat-number');
        if (statCards.length >= 4) {
            statCards[2].textContent = this.progress.sent;
            statCards[3].textContent = this.progress.failed;
        }
    }

    replaceVariables(text, contact) {
        return text
            .replace(/{nome}/g, contact.nome_cliente || 'Cliente')
            .replace(/{telefone}/g, contact.telefone1 || contact.telefone2 || 'N/A')
            .replace(/{sa}/g, contact.sa || 'N/A')
            .replace(/{tecnico}/g, contact.tecnico || 'N/A')
            .replace(/{servico}/g, contact.servico || 'N/A')
            .replace(/{data}/g, contact.data || 'N/A');
    }

    updateSendStatus(status) {
        const statusElement = document.getElementById('send-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    addLog(type, message) {
        const logs = JSON.parse(localStorage.getItem('messages_logs') || '[]');
        logs.push({
            type: type,
            message: message,
            time: formatTime(new Date())
        });

        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }

        localStorage.setItem('messages_logs', JSON.stringify(logs));
        this.updateLogsDisplay();
    }

    updateLogsDisplay() {
        const logsList = document.getElementById('messages-logs');
        if (logsList) {
            logsList.innerHTML = this.renderSystemLogs();
        }
    }

    clearLogs() {
        localStorage.removeItem('messages_logs');
        this.addLog('info', 'Logs limpos com sucesso');
    }
}

// Estilos modernos e responsivos
const messagesStyles = `
    .module-container {
        padding: 0;
        background: #f8f9fa;
        min-height: 100vh;
    }

    /* Header Moderno */
    .messages-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 0;
        margin-bottom: 0;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }

    .header-gradient {
        padding: 32px 24px;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1400px;
        margin: 0 auto;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 20px;
    }

    .header-icon {
        width: 64px;
        height: 64px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        backdrop-filter: blur(10px);
    }

    .module-title {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        color: white;
    }

    .module-subtitle {
        margin: 4px 0 0 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .connection-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        backdrop-filter: blur(10px);
    }

    .badge-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #27ae60;
    }

    .connection-badge.loading .badge-dot {
        background: #f39c12;
        animation: pulse 1.5s infinite;
    }

    .badge-text {
        font-size: 14px;
        font-weight: 500;
    }

    /* Dashboard Stats */
    .stats-dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
    }

    .stat-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 16px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
        font-size: 32px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }

    .stat-content {
        flex: 1;
    }

    .stat-number {
        font-size: 28px;
        font-weight: 700;
        color: #2c3e50;
        line-height: 1;
    }

    .stat-label {
        font-size: 14px;
        color: #7f8c8d;
        margin-top: 4px;
    }

    /* Progress Section */
    .progress-section {
        background: white;
        margin: 0 24px 24px 24px;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }

    .progress-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #2c3e50;
    }

    .progress-text {
        font-size: 14px;
        color: #7f8c8d;
        font-weight: 500;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #ecf0f1;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .progress-details {
        text-align: center;
    }

    .current-contact {
        font-size: 14px;
        color: #2c3e50;
        font-weight: 500;
    }

    /* Main Grid */
    .messages-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        padding: 0 24px 24px 24px;
        max-width: 1400px;
        margin: 0 auto;
    }

    .left-column, .right-column {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    /* Cards */
    .filters-card, .contacts-card, .message-card, .send-card, .logs-card {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #ecf0f1;
        background: #f8f9fa;
    }

    .card-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #2c3e50;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .contacts-count {
        font-size: 14px;
        color: #7f8c8d;
        background: #ecf0f1;
        padding: 4px 12px;
        border-radius: 12px;
    }

    /* Buttons */
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        font-size: 14px;
    }

    .btn-sm {
        padding: 8px 16px;
        font-size: 12px;
    }

    .btn-large {
        padding: 16px 32px;
        font-size: 16px;
    }

    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
        background: #ecf0f1;
        color: #2c3e50;
    }

    .btn-secondary:hover {
        background: #d5dbdb;
        transform: translateY(-1px);
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
    }

    /* Filters */
    .filters-content {
        padding: 24px;
    }

    .filter-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .filter-group label {
        font-weight: 600;
        color: #2c3e50;
        font-size: 14px;
    }

    .filter-group input,
    .filter-group select {
        padding: 12px;
        border: 2px solid #ecf0f1;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.3s ease;
    }

    .filter-group input:focus,
    .filter-group select:focus {
        outline: none;
        border-color: #667eea;
    }

    .filter-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 16px;
    }

    /* Contacts List */
    .contacts-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 0;
    }

    .contact-item {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid #ecf0f1;
        transition: background-color 0.2s ease;
    }

    .contact-item:hover {
        background: #f8f9fa;
    }

    .contact-item:last-child {
        border-bottom: none;
    }

    .contact-checkbox {
        margin-right: 16px;
        transform: scale(1.2);
    }

    .contact-info {
        flex: 1;
    }

    .contact-name {
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 4px;
        font-size: 14px;
    }

    .contact-details {
        font-size: 12px;
        color: #7f8c8d;
        display: flex;
        gap: 16px;
    }

    /* Message Editor */
    .message-content {
        padding: 24px;
    }

    .message-editor {
        margin-bottom: 24px;
    }

    .message-editor textarea {
        width: 100%;
        min-height: 120px;
        padding: 16px;
        border: 2px solid #ecf0f1;
        border-radius: 12px;
        font-size: 14px;
        resize: vertical;
        transition: border-color 0.3s ease;
        font-family: inherit;
    }

    .message-editor textarea:focus {
        outline: none;
        border-color: #667eea;
    }

    .message-stats {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: #7f8c8d;
    }

    /* Templates */
    .templates-section {
        margin-top: 24px;
    }

    .templates-section h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #2c3e50;
    }

    .templates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
    }

    .template-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        border: 2px solid #ecf0f1;
        border-radius: 12px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .template-btn:hover {
        border-color: #667eea;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .template-icon {
        font-size: 24px;
        margin-bottom: 8px;
    }

    .template-title {
        font-size: 12px;
        font-weight: 600;
        color: #2c3e50;
    }

    /* Send Actions */
    .send-actions {
        display: flex;
        gap: 12px;
        padding: 24px;
    }

    .send-status {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .status-dot.ready {
        background: #27ae60;
    }

    .status-dot.sending {
        background: #f39c12;
        animation: pulse 1.5s infinite;
    }

    .status-text {
        font-size: 14px;
        color: #7f8c8d;
    }

    /* Logs */
    .logs-content {
        max-height: 300px;
        overflow-y: auto;
        padding: 24px;
        background: #f8f9fa;
    }

    .log-item {
        padding: 12px 0;
        border-bottom: 1px solid #ecf0f1;
        font-size: 14px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
    }

    .log-item:last-child {
        border-bottom: none;
    }

    .log-time {
        color: #7f8c8d;
        font-size: 12px;
        min-width: 80px;
    }

    .log-message {
        color: #2c3e50;
        flex: 1;
    }

    .log-success {
        color: #27ae60;
    }

    .log-error {
        color: #e74c3c;
    }

    .log-warning {
        color: #f39c12;
    }

    .log-info {
        color: #3498db;
    }

    /* Responsive */
    @media (max-width: 1200px) {
        .messages-grid {
            grid-template-columns: 1fr;
        }
        
        .stats-dashboard {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }
    }

    @media (max-width: 768px) {
        .header-content {
            flex-direction: column;
            gap: 20px;
            text-align: center;
        }
        
        .filter-row {
            grid-template-columns: 1fr;
        }
        
        .send-actions {
            flex-direction: column;
        }
        
        .stats-dashboard {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .fade-in {
        animation: fadeIn 0.5s ease-out;
    }
`;

if (!document.getElementById('messages-styles')) {
    const style = document.createElement('style');
    style.id = 'messages-styles';
    style.textContent = messagesStyles;
    document.head.appendChild(style);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessagesModule;
}

// Variável global para acesso direto
window.messagesModule = new MessagesModule();
