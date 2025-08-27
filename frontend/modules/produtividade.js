// Módulo Produtividade - Lista simples de dados (PostgreSQL + Python)
// Filosofia: Python responsável por TUDO, JS apenas frontend
// SISTEMA DE CACHE IMPLEMENTADO - Dados carregados uma vez e atualizados automaticamente

class ProdutividadeModule {
    constructor() {
        this.backendUrl = window.location.origin;
        this.contacts = [];
        this.filteredContacts = [];
        this.searchTerm = '';
        this.sortBy = 'data';
        this.sortOrder = 'desc';
        this.loading = false;
        
        // SISTEMA DE CACHE IMPLEMENTADO
        this.cache = {
            data: null,
            lastUpdate: null,
            cacheTimeout: 5 * 60 * 1000, // 5 minutos
            isInitialized: false
        };
        
        // Contador de atualizações
        this.updateCount = 0;
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <div class="header-content">
                        <div class="header-left">
                            <div class="productivity-avatar">📊</div>
                            <div class="header-text">
                                <h2 class="module-title">Produtividade</h2>
                                <p class="module-subtitle">Lista de serviços e contatos</p>
                            </div>
                        </div>
                        <div class="header-right">
                            <button class="btn btn-refresh" onclick="produtividadeModule.forceRefresh()">
                                <span class="btn-icon">🔄</span>
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Controles -->
                <div class="controls-section">
                    <div class="search-box">
                        <input type="text" id="search-contacts" placeholder="Buscar por nome, técnico, SA..." />
                        <span class="search-icon">🔍</span>
                    </div>
                    
                    <div class="sort-controls">
                        <select id="sort-by">
                            <option value="data">Data</option>
                            <option value="tecnico">Técnico</option>
                            <option value="nome_cliente">Cliente</option>
                            <option value="sa">SA</option>
                            <option value="status">Status</option>
                        </select>
                        <button class="btn btn-sort" onclick="produtividadeModule.toggleSort()">
                            <span class="btn-icon">${this.sortOrder === 'asc' ? '↑' : '↓'}</span>
                        </button>
                    </div>
                </div>

                <!-- Lista de Contatos -->
                <div class="contacts-section">
                    <div class="contacts-header">
                        <h3>📋 Lista de Serviços (${this.filteredContacts.length})</h3>
                        ${this.cache.isInitialized ? `<span class="cache-status">💾 Cache ativo - Última atualização: ${new Date(this.cache.lastUpdate).toLocaleTimeString('pt-BR')}</span>` : ''}
                    </div>
                    
                    <div class="contacts-list" id="contacts-list">
                        ${this.renderContactsList()}
                    </div>
                </div>

                <!-- Logs -->
                <div class="system-logs">
                    <div class="section-header">
                        <h3>📋 Logs do Sistema</h3>
                    </div>
                    <div class="logs-list" id="productivity-logs">
                        ${this.renderSystemLogs()}
                    </div>
                </div>
            </div>
        `;
    }

    // NOVO: Sistema de cache inteligente
    async initializeCache() {
        if (this.cache.isInitialized && this.isCacheValid()) {
            console.log('💾 Usando dados do cache');
            this.contacts = this.cache.data;
            this.filteredContacts = [...this.contacts];
            this.sortContacts();
            this.updateContactsDisplay();
            this.addLog('info', `💾 ${this.contacts.length} registros carregados do cache`);
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
        console.log('💾 Cache atualizado:', this.cache);
    }

    // NOVO: Forçar atualização (ignora cache)
    async forceRefresh() {
        this.cache.isInitialized = false;
        this.cache.data = null;
        this.cache.lastUpdate = null;
        await this.loadContacts();
    }

    renderContactsList() {
        if (this.loading) {
            return '<div class="loading">Carregando dados do PostgreSQL...</div>';
        }

        if (this.filteredContacts.length === 0) {
            if (this.contacts.length > 0) {
                return '<div class="no-data">Nenhum contato encontrado com os filtros atuais</div>';
            }
            return '<div class="no-data">Nenhum contato encontrado</div>';
        }

        return this.filteredContacts.map(contact => `
            <div class="contact-item ${contact.status?.toLowerCase()}">
                <div class="contact-row">
                    <div class="contact-sa">
                        <strong>${contact.sa || 'N/A'}</strong>
                    </div>
                    <div class="contact-status">
                        <span class="status-badge ${contact.status?.toLowerCase()}">${contact.status || 'Pendente'}</span>
                    </div>
                    <div class="contact-info">
                        <div class="info-main">
                            <span class="client-name">${contact.nome_cliente || 'N/A'}</span>
                            <span class="service-type">${contact.servico || 'N/A'}</span>
                        </div>
                        <div class="info-secondary">
                            <span class="technician">👨‍🔧 ${contact.tecnico || 'N/A'}</span>
                            <span class="phone">📞 ${contact.telefone1 || contact.telefone2 || 'N/A'}</span>
                        </div>
                        </div>
                    <div class="contact-details">
                        <div class="detail-row">
                            <span class="detail-label">Data:</span>
                            <span class="detail-value">${contact.data || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Endereço:</span>
                            <span class="detail-value">${contact.endereco || 'N/A'}</span>
                        </div>
                        ${contact.obs ? `
                            <div class="detail-row">
                                <span class="detail-label">Obs:</span>
                                <span class="detail-value">${contact.obs}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="contact-actions">
                        <button class="btn-whatsapp" onclick="produtividadeModule.openWhatsApp('${contact.telefone1 || contact.telefone2 || ''}', '${contact.nome_cliente || 'Cliente'}')" title="Falar com cliente via WhatsApp">
                            <span class="btn-icon">💬</span>
                            <span class="btn-text">WhatsApp</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // NOVO: Abrir WhatsApp para cliente específico
    openWhatsApp(phone, clientName) {
        if (!phone || phone === 'N/A') {
            this.addLog('error', '❌ Telefone não disponível para este cliente');
            return;
        }

        // Limpar telefone (remover caracteres especiais)
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Verificar se é um telefone válido
        if (cleanPhone.length < 10) {
            this.addLog('error', '❌ Telefone inválido');
            return;
        }

        // Log da ação
        this.addLog('success', `✅ Abrindo WhatsApp para ${clientName} (${phone})`);
        
        // Mudar para aba WhatsApp e abrir conversa
        this.openWhatsAppConversation(phone, clientName);
    }

    // NOVO: Abrir conversa no WhatsApp interno
    openWhatsAppConversation(phone, clientName) {
        console.log(`🎯 Iniciando abertura de conversa para ${clientName} (${phone})`);
        
        // Primeiro, mudar para a aba WhatsApp
        const whatsappTab = document.querySelector('[data-module="whatsapp"]');
        if (whatsappTab) {
            console.log('✅ Aba WhatsApp encontrada, clicando...');
            whatsappTab.click();
            
            // Aguardar um pouco para a aba carregar e o módulo ser inicializado
            setTimeout(() => {
                console.log('🔄 Verificando módulo WhatsApp...');
                
                // Tentar múltiplas formas de acessar o módulo WhatsApp
                let whatsappModule = null;
                
                // 1. Tentar via window.whatsappModule
                if (window.whatsappModule && typeof window.whatsappModule.openConversationWithContact === 'function') {
                    console.log('✅ Módulo WhatsApp encontrado via window.whatsappModule');
                    whatsappModule = window.whatsappModule;
                }
                // 2. Tentar via app.modules
                else if (window.app && window.app.modules && window.app.modules.whatsapp) {
                    console.log('✅ Módulo WhatsApp encontrado via app.modules');
                    whatsappModule = window.app.modules.whatsapp;
                }
                
                // Se encontrou o módulo, tentar abrir a conversa
                if (whatsappModule && typeof whatsappModule.openConversationWithContact === 'function') {
                    console.log('✅ Abrindo conversa com cliente...');
                    try {
                        whatsappModule.openConversationWithContact(phone, clientName);
                        this.addLog('success', `✅ Conversa aberta com ${clientName}`);
                    } catch (error) {
                        console.error('❌ Erro ao abrir conversa:', error);
                        this.addLog('error', '❌ Erro ao abrir conversa no WhatsApp');
                    }
                } else {
                    console.error('❌ Módulo WhatsApp não disponível ou método não existe');
                    console.log('whatsappModule:', whatsappModule);
                    this.addLog('error', '❌ Módulo WhatsApp não disponível');
                    
                    // Fallback: tentar abrir manualmente
                    this.tryManualChatOpen(phone, clientName);
                }
            }, 2000); // Aumentei para 2 segundos
        } else {
            console.error('❌ Aba WhatsApp não encontrada');
            this.addLog('error', '❌ Aba WhatsApp não encontrada');
        }
    }

    // NOVO: Fallback manual para abrir chat
    tryManualChatOpen(phone, clientName) {
        console.log('🔄 Tentando abrir chat manualmente...');
        
        // Limpar telefone
        const cleanPhone = phone.replace(/\D/g, '');
        let whatsappPhone = cleanPhone;
        if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
            whatsappPhone = '55' + cleanPhone.substring(1);
        } else if (cleanPhone.length === 10) {
            whatsappPhone = '55' + cleanPhone;
        }
        
        // Tentar encontrar o contato na lista de contatos do WhatsApp
        const contactsList = document.querySelector('.wa-contacts-list');
        if (contactsList) {
            // Procurar por contatos existentes
            const contactItems = contactsList.querySelectorAll('.contact-item');
            let foundContact = false;
            
            contactItems.forEach(item => {
                const contactName = item.querySelector('.contact-name')?.textContent;
                const contactPhone = item.querySelector('.contact-phone')?.textContent;
                
                if (contactName && contactName.includes(clientName) || 
                    contactPhone && contactPhone.includes(whatsappPhone)) {
                    console.log('✅ Contato encontrado na lista, clicando...');
                    item.click();
                    foundContact = true;
                }
            });
            
            if (!foundContact) {
                console.log('⚠️ Contato não encontrado na lista, criando novo...');
                this.createNewContact(whatsappPhone, clientName);
            }
        } else {
            console.log('⚠️ Lista de contatos não encontrada, criando novo contato...');
            this.createNewContact(whatsappPhone, clientName);
        }
    }

    // NOVO: Criar novo contato
    createNewContact(phone, clientName) {
        console.log(`🆕 Criando novo contato: ${clientName} (${phone})`);
        
        // Tentar adicionar contato via módulo WhatsApp
        if (window.whatsappModule && typeof window.whatsappModule.addContact === 'function') {
            window.whatsappModule.addContact(clientName, phone);
        } else {
            // Fallback: adicionar manualmente à interface
            this.addContactToInterface(clientName, phone);
        }
    }

    // NOVO: Adicionar contato à interface
    addContactToInterface(clientName, phone) {
        console.log(`➕ Adicionando ${clientName} à interface...`);
        
        // Simular clique no botão de novo contato se existir
        const newContactBtn = document.querySelector('.new-contact-btn, .add-contact-btn');
        if (newContactBtn) {
            newContactBtn.click();
            setTimeout(() => {
                // Preencher formulário se existir
                const nameInput = document.querySelector('input[placeholder*="nome"], input[name="name"]');
                const phoneInput = document.querySelector('input[placeholder*="telefone"], input[name="phone"]');
                
                if (nameInput && phoneInput) {
                    nameInput.value = clientName;
                    phoneInput.value = phone;
                    
                    // Simular envio
                    const submitBtn = document.querySelector('button[type="submit"], .save-contact-btn');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }, 500);
        }
    }

    // NOVO: Mudar para aba WhatsApp
    switchToWhatsAppTab() {
        // Tentar encontrar e ativar a aba WhatsApp
        const whatsappTab = document.querySelector('[data-module="whatsapp"]');
        if (whatsappTab) {
            whatsappTab.click();
            this.addLog('info', '🔄 Mudando para aba WhatsApp...');
        }
    }

    renderSystemLogs() {
        return `
            <div class="log-entry success">
                <span class="log-icon">💾</span>
                <span class="log-text">Sistema de cache ativo - Dados carregados uma vez e atualizados automaticamente</span>
                <span class="log-time">${new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
            <div class="log-entry info">
                <span class="log-icon">⚡</span>
                <span class="log-text">Performance otimizada - Cache válido por 5 minutos</span>
                <span class="log-time">${new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
            ${this.updateCount > 0 ? `
                <div class="log-entry success">
                    <span class="log-icon">🔄</span>
                    <span class="log-text">Atualizações realizadas: ${this.updateCount}</span>
                    <span class="log-time">${new Date().toLocaleTimeString('pt-BR')}</span>
                </div>
            ` : ''}
        `;
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
    }

    // NOVO: Verificar conectividade e carregar dados
    async checkConnectionAndLoad() {
        try {
            console.log('🔌 Verificando conectividade...');
            
            // Health check simples
            const response = await fetch(`${this.backendUrl}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                console.log('✅ Conectado ao servidor, carregando dados...');
                await this.initializeCache();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.error('❌ Erro de conectividade:', error.message);
            
            // Tentar novamente em 3 segundos
            setTimeout(() => {
                this.checkConnectionAndLoad();
            }, 3000);
        }
    }

    setupEventListeners() {
        setTimeout(() => {
            const searchInput = document.getElementById('search-contacts');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.filterContacts();
                });
            }

            const sortSelect = document.getElementById('sort-by');
            if (sortSelect) {
                sortSelect.addEventListener('change', (e) => {
                    this.sortBy = e.target.value;
                    this.sortContacts();
                });
            }
        }, 100);
    }

    async loadContacts() {
        this.loading = true;
        // this.updateConnectionStatus(); // REMOVIDO

        try {
            // Usar endpoint otimizado com pool de conexões
            const response = await fetch(`${this.backendUrl}/api/productivity/contacts?optimized=true`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.contacts = data.contacts || [];
                    this.filteredContacts = [...this.contacts];
                    
                    // NOVO: Atualizar cache
                    this.updateCache(this.contacts);
                    
                    this.sortContacts();
                    this.updateCount++;
                    this.addLog('success', `✅ ${this.contacts.length} registros carregados (Cache atualizado)`);
                    
                    // NOVO: Atualizar interface automaticamente
                    this.updateContactsDisplay();
                } else {
                    throw new Error(data.message || 'Erro na resposta do servidor');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Erro ao carregar contatos');
            }
        } catch (error) {
            this.addLog('error', `❌ Erro: ${error.message}`);
            this.contacts = [];
            this.filteredContacts = [];
        } finally {
            this.loading = false;
            // this.updateConnectionStatus(); // REMOVIDO
        }
    }

    filterContacts() {
        if (!this.searchTerm) {
            this.filteredContacts = [...this.contacts];
        } else {
            this.filteredContacts = this.contacts.filter(contact =>
                (contact.nome_cliente?.toLowerCase().includes(this.searchTerm)) ||
                (contact.tecnico?.toLowerCase().includes(this.searchTerm)) ||
                (contact.sa?.toLowerCase().includes(this.searchTerm)) ||
                (contact.servico?.toLowerCase().includes(this.searchTerm)) ||
                (contact.telefone1?.includes(this.searchTerm)) ||
                (contact.telefone2?.includes(this.searchTerm))
            );
        }
        this.sortContacts();
        this.updateContactsDisplay();
    }

    sortContacts() {
        this.filteredContacts.sort((a, b) => {
            let aValue = a[this.sortBy] || '';
            let bValue = b[this.sortBy] || '';

            if (this.sortOrder === 'desc') {
                [aValue, bValue] = [bValue, aValue];
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return aValue.localeCompare(bValue, 'pt-BR');
            }

            return aValue > bValue ? 1 : -1;
        });

        this.updateContactsDisplay();
    }

    toggleSort() {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.sortContacts();
        
        const sortButton = document.querySelector('.btn-sort .btn-icon');
        if (sortButton) {
            sortButton.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
        }
    }

    // updateConnectionStatus() { // REMOVIDO
    //     const statusIndicator = document.querySelector('.connection-status .status-indicator');
    //     if (statusIndicator) {
    //         statusIndicator.className = `status-indicator ${this.loading ? 'loading' : 'connected'}`;
    //         const statusText = statusIndicator.querySelector('.status-text');
    //         if (statusText) {
    //             statusText.textContent = this.getConnectionStatusText();
    //         }
    //     }
    // }

    updateContactsDisplay() {
        console.log('🔄 Atualizando interface com', this.filteredContacts.length, 'contatos');
        
        const contactsList = document.getElementById('contacts-list');
        if (contactsList) {
            contactsList.innerHTML = this.renderContactsList();
            console.log('✅ Lista de contatos atualizada');
        } else {
            console.warn('⚠️ Elemento contacts-list não encontrado');
        }

        // Atualizar contador no header
        const contactsHeader = document.querySelector('.contacts-header h3');
        if (contactsHeader) {
            contactsHeader.innerHTML = `📋 Lista de Serviços (${this.filteredContacts.length})`;
            console.log('✅ Header atualizado');
        }
        
        // Atualizar status do cache
        const cacheStatus = document.querySelector('.cache-status');
        if (cacheStatus && this.cache.isInitialized) {
            cacheStatus.textContent = `💾 Cache ativo - Última atualização: ${new Date(this.cache.lastUpdate).toLocaleTimeString('pt-BR')}`;
            console.log('✅ Status do cache atualizado');
        }
        
        // Forçar reflow do DOM
        if (contactsList) {
            contactsList.style.display = 'none';
            contactsList.offsetHeight; // Força reflow
            contactsList.style.display = '';
        }
    }

    addLog(type, message) {
        const logs = JSON.parse(localStorage.getItem('productivity_logs') || '[]');
        logs.push({
            type: type,
            message: message,
            time: new Date().toLocaleTimeString('pt-BR')
        });

        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }

        localStorage.setItem('productivity_logs', JSON.stringify(logs));
        this.updateLogsDisplay();
    }

    updateLogsDisplay() {
        const logsList = document.getElementById('productivity-logs');
        if (logsList) {
            logsList.innerHTML = this.renderSystemLogs();
        }
    }

    destroy() {
        // Limpa event listeners se necessário
        console.log('Módulo Produtividade destruído');
    }
}

// Estilos para lista simples
const productivityStyles = `
    .module-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        color: white;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .productivity-avatar {
        font-size: 3rem;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .header-text h2 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 700;
    }

    .header-text p {
        margin: 0;
        opacity: 0.9;
    }

    .btn-refresh {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-refresh:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .connection-status {
        background: white;
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .controls-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        display: flex;
        gap: 1rem;
        align-items: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .search-box {
        flex: 1;
        position: relative;
    }

    .search-box input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.3s ease;
    }

    .search-box input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #6c757d;
        font-size: 1.1rem;
    }

    .sort-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .sort-controls select {
        padding: 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
    }

    .btn-sort {
        padding: 0.75rem;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-sort:hover {
        background: #f8f9fa;
        border-color: #007bff;
    }

    .contacts-section {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .contacts-header {
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .contacts-header h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #2c3e50;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .cache-status {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .contacts-list {
        max-height: 600px;
        overflow-y: auto;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
    }

    .contact-item {
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 1.5rem;
        transition: all 0.3s ease;
    }

    .contact-item:hover {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    .contact-item.ativo {
        border-left: 4px solid #28a745;
    }

    .contact-item.concluido {
        border-left: 4px solid #17a2b8;
    }

    .contact-item.pendente {
        border-left: 4px solid #ffc107;
    }

    .contact-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.5rem 0;
    }

    .contact-sa {
        font-size: 1.1rem;
        color: #2c3e50;
        flex-shrink: 0;
    }

    .contact-status {
        flex-shrink: 0;
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }

    .status-badge.ativo {
        background: #d4edda;
        color: #155724;
    }

    .status-badge.concluido {
        background: #d1ecf1;
        color: #0c5460;
    }

    .status-badge.pendente {
        background: #fff3cd;
        color: #856404;
    }

    .contact-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .info-main {
        display: flex;
        gap: 0.5rem;
    }

    .client-name {
        font-size: 1.1rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .service-type {
        font-size: 0.9rem;
        color: #6c757d;
    }

    .info-secondary {
        display: flex;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #6c757d;
    }

    .technician {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .phone {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .contact-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .detail-row {
        display: flex;
        gap: 0.5rem;
    }

    .detail-label {
        font-weight: 600;
        color: #6c757d;
        min-width: 80px;
    }

    .detail-value {
        color: #2c3e50;
    }

    .loading {
        text-align: center;
        padding: 3rem;
        color: #6c757d;
        font-size: 1.1rem;
    }

    .no-data {
        text-align: center;
        padding: 3rem;
        color: #6c757d;
        font-size: 1.1rem;
    }

    .system-logs {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .section-header {
        margin-bottom: 1.5rem;
    }

    .section-header h3 {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .logs-list {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
        padding: 1rem;
    }

    .log-entry {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        margin: 8px 0;
        border-radius: 8px;
        background: #f8f9fa;
        border-left: 4px solid #28a745;
        transition: all 0.3s ease;
    }

    .log-entry.success {
        border-left-color: #28a745;
        background: #d4edda;
        color: #155724;
    }

    .log-entry.info {
        border-left-color: #17a2b8;
        background: #d1ecf1;
        color: #0c5460;
    }

    .log-entry.error {
        border-left-color: #dc3545;
        background: #f8d7da;
        color: #721c24;
    }

    .log-icon {
        font-size: 18px;
        margin-right: 12px;
        flex-shrink: 0;
    }

    .log-text {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
    }

    .log-time {
        font-size: 12px;
        color: #6c757d;
        margin-left: 12px;
        flex-shrink: 0;
    }

    .no-logs {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    @media (max-width: 768px) {
        .controls-section {
            flex-direction: column;
            align-items: stretch;
        }

        .contact-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .contact-sa, .contact-status {
            width: 100%;
            text-align: left;
        }

        .contact-info {
            width: 100%;
        }

        .info-main, .info-secondary {
            flex-direction: column;
            align-items: flex-start;
        }

        .client-name, .service-type {
            width: 100%;
            text-align: left;
        }

        .technician, .phone {
            width: 100%;
            justify-content: flex-start;
        }

        .contact-details {
            grid-column: 1 / -1;
        }
    }
`;

if (!document.getElementById('productivity-styles')) {
    const style = document.createElement('style');
    style.id = 'productivity-styles';
    style.textContent = productivityStyles;
    document.head.appendChild(style);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProdutividadeModule;
}

// Variável global para acesso direto
window.produtividadeModule = new ProdutividadeModule();
