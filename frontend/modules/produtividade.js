// Módulo Produtividade - Lista simples de dados (PostgreSQL + Python)
// Filosofia: Python responsável por TUDO, JS apenas frontend

class ProdutividadeModule {
    constructor() {
        this.backendUrl = window.location.origin;
        this.contacts = [];
        this.filteredContacts = [];
        this.searchTerm = '';
        this.sortBy = 'data';
        this.sortOrder = 'desc';
        this.loading = false;
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
                            <button class="btn btn-refresh" onclick="produtividadeModule.loadContacts()">
                                <span class="btn-icon">🔄</span>
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Status de Conexão -->
                <div class="connection-status">
                    <div class="status-indicator ${this.loading ? 'loading' : 'connected'}">
                        <span class="status-dot"></span>
                        <span class="status-text">${this.loading ? 'Carregando...' : 'Conectado ao PostgreSQL'}</span>
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

    renderContactsList() {
        if (this.loading) {
            return '<div class="loading">Carregando dados do PostgreSQL...</div>';
        }

        if (this.filteredContacts.length === 0) {
            return '<div class="no-data">Nenhum contato encontrado</div>';
        }

        return this.filteredContacts.map(contact => `
            <div class="contact-item ${contact.status?.toLowerCase()}">
                <div class="contact-header">
                    <div class="contact-sa">
                        <strong>SA: ${contact.sa || 'N/A'}</strong>
                    </div>
                    <div class="contact-status">
                        <span class="status-badge ${contact.status?.toLowerCase()}">${contact.status || 'Pendente'}</span>
                    </div>
                </div>
                
                <div class="contact-body">
                    <div class="contact-info">
                        <div class="info-row">
                            <span class="info-label">Cliente:</span>
                            <span class="info-value">${contact.nome_cliente || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Técnico:</span>
                            <span class="info-value">${contact.tecnico || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Serviço:</span>
                            <span class="info-value">${contact.servico || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Telefone:</span>
                            <span class="info-value">${contact.telefone1 || contact.telefone2 || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Endereço:</span>
                            <span class="info-value">${contact.endereco || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Plano:</span>
                            <span class="info-value">${contact.plano || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="contact-details">
                        <div class="detail-item">
                            <span class="detail-label">Data:</span>
                            <span class="detail-value">${contact.data || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Documento:</span>
                            <span class="detail-value">${contact.documento || 'N/A'}</span>
                        </div>
                        ${contact.obs ? `
                            <div class="detail-item full-width">
                                <span class="detail-label">Observações:</span>
                                <span class="detail-value">${contact.obs}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderSystemLogs() {
        const logs = JSON.parse(localStorage.getItem('productivity_logs') || '[]');
        if (logs.length === 0) {
            return '<div class="no-logs">Nenhum log disponível</div>';
        }

        return logs.slice(-5).reverse().map(log => `
            <div class="log-item ${log.type}">
                <div class="log-message">${log.message}</div>
                <div class="log-time">${log.time}</div>
            </div>
        `).join('');
    }

    init() {
        this.loadContacts();
        this.setupEventListeners();
        this.addLog('info', 'Módulo Produtividade inicializado');
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
        this.updateConnectionStatus();

        try {
            // Usar endpoint otimizado com pool de conexões
            const response = await fetch(`${this.backendUrl}/api/productivity/contacts?optimized=true`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.contacts = data.contacts || [];
                    this.filteredContacts = [...this.contacts];
                    this.sortContacts();
                    this.addLog('success', `✅ ${this.contacts.length} registros carregados (Pool de Conexões ativo)`);
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
            this.updateConnectionStatus();
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

        const contactsHeader = document.querySelector('.contacts-header h3');
        if (contactsHeader) {
            contactsHeader.textContent = `📋 Lista de Serviços (${this.filteredContacts.length})`;
        }
    }

    addLog(type, message) {
        const logs = JSON.parse(localStorage.getItem('productivity_logs') || '[]');
        logs.push({
            type: type,
            message: message,
            time: formatTime(new Date())
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
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-weight: 600;
    }

    .status-indicator.connected {
        color: #28a745;
    }

    .status-indicator.loading {
        color: #ffc107;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #28a745;
        animation: pulse 2s infinite;
    }

    .status-indicator.loading .status-dot {
        background: #ffc107;
    }

    .controls-section {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .search-box {
        position: relative;
        flex: 1;
        max-width: 400px;
    }

    .search-box input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
    }

    .search-icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: #6c757d;
    }

    .sort-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .sort-controls select {
        padding: 0.75rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
    }

    .btn-sort {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.75rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-sort:hover {
        background: #5a6fd8;
    }

    .contacts-section {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .contacts-header {
        margin-bottom: 2rem;
    }

    .contacts-header h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #2c3e50;
    }

    .contacts-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
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

    .contact-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .contact-sa {
        font-size: 1.1rem;
        color: #2c3e50;
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

    .contact-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .contact-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .info-row {
        display: flex;
        gap: 0.5rem;
    }

    .info-label {
        font-weight: 600;
        color: #6c757d;
        min-width: 80px;
    }

    .info-value {
        color: #2c3e50;
    }

    .contact-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .detail-item {
        display: flex;
        gap: 0.5rem;
    }

    .detail-item.full-width {
        grid-column: 1 / -1;
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
    }

    .log-item {
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .log-item:last-child {
        border-bottom: none;
    }

    .log-item.success {
        background: #d4edda;
        border-left: 4px solid #28a745;
    }

    .log-item.error {
        background: #f8d7da;
        border-left: 4px solid #dc3545;
    }

    .log-item.info {
        background: #e7f3ff;
        border-left: 4px solid #17a2b8;
    }

    .log-message {
        margin-bottom: 0.25rem;
        font-weight: 500;
    }

    .log-time {
        font-size: 0.8rem;
        color: #6c757d;
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

        .contact-body {
            grid-template-columns: 1fr;
            gap: 1rem;
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
