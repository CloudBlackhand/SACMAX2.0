// Módulo Contacts - Gerenciamento de contatos (dados do PostgreSQL)
// Versão: 2.1 - Timestamp: 2025-08-21 02:28:00 - FORÇANDO RECARREGAMENTO

class ContactsModule {
    constructor() {
        console.log('🔧 ContactsModule v2.1: Construtor chamado');
        this.contacts = [];
        this.filteredContacts = [];
        this.searchTerm = '';
        this.currentContact = null;
        this.editMode = false;
        this.sortBy = 'nome_cliente';
        this.sortOrder = 'asc';
        this.selectedContacts = new Set();
        this.loading = false;
    }

    async init() {
        console.log('🚀 ContactsModule v2.1: Inicializando...');
        await this.loadContactsFromDatabase();
        this.setupEventListeners();
        console.log('✅ ContactsModule v2.1: Inicializado com sucesso!');
    }

    async loadContactsFromDatabase() {
        console.log('📊 Carregando dados do PostgreSQL...');
        this.loading = true;
        try {
            const response = await fetch('/api/contacts/produtividade');
            console.log('📡 Resposta da API:', response.status);
            const data = await response.json();
            console.log('📋 Dados recebidos:', data);
            
            if (data.success && data.contacts && data.contacts.length > 0) {
                this.contacts = data.contacts.map(contact => ({
                    id: contact.id.toString(),
                    sa: contact.sa,
                    nome_cliente: contact.nome_cliente,
                    telefone: contact.telefone1 || contact.telefone2 || 'N/A',
                    tecnico: contact.tecnico,
                    servico: contact.servico,
                    status: contact.status,
                    data: contact.data,
                    endereco: contact.endereco,
                    documento: contact.documento,
                    plano: contact.plano,
                    obs: contact.obs,
                    created_at: contact.created_at
                }));
                this.filteredContacts = [...this.contacts];
                console.log(`✅ Carregados ${this.contacts.length} contatos do PostgreSQL:`, this.contacts);
            } else {
                console.error('❌ Nenhum dado encontrado na tabela produtividade');
                this.contacts = [];
                this.filteredContacts = [];
            }
        } catch (error) {
            console.error('❌ Erro ao carregar contatos:', error);
            this.contacts = [];
            this.filteredContacts = [];
        } finally {
            this.loading = false;
        }
    }

    setupEventListeners() {
        // Event listeners serão configurados após o render
        setTimeout(() => {
            const searchInput = document.getElementById('search-contacts');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchTerm = e.target.value.toLowerCase();
                    this.filterContacts();
                });
            }
        }, 100);
    }

    filterContacts() {
        if (!this.searchTerm) {
            this.filteredContacts = [...this.contacts];
        } else {
            this.filteredContacts = this.contacts.filter(contact =>
                contact.nome_cliente?.toLowerCase().includes(this.searchTerm) ||
                contact.telefone?.includes(this.searchTerm) ||
                contact.sa?.toLowerCase().includes(this.searchTerm) ||
                contact.tecnico?.toLowerCase().includes(this.searchTerm)
            );
        }
        this.renderContactsTable();
    }

    renderContactsTable() {
        const tbody = document.querySelector('.contacts-table tbody');
        if (!tbody) return;

        tbody.innerHTML = this.filteredContacts.map(contact => `
            <tr>
                <td><strong>${contact.sa}</strong></td>
                <td>${contact.nome_cliente || 'N/A'}</td>
                <td>${contact.telefone || 'N/A'}</td>
                <td>${contact.tecnico || 'N/A'}</td>
                <td>${contact.servico || 'N/A'}</td>
                <td>
                    <span class="status-badge ${contact.status === 'Concluído' ? 'active' : 'inactive'}">
                        ${contact.status || 'Pendente'}
                    </span>
                </td>
                <td>${contact.data || 'N/A'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.viewContact('${contact.sa}')" title="Ver detalhes">
                        👁️
                    </button>
                    <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.editContact('${contact.sa}')" title="Editar">
                        ✏️
                    </button>
                </td>
            </tr>
        `).join('');
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">👥</span>
                    <h2 class="module-title">Contatos - Dados do PostgreSQL</h2>
                    <div class="module-stats">
                        <span class="stat-badge">📊 ${this.contacts.length} registros</span>
                        <span class="stat-badge">🔍 ${this.filteredContacts.length} filtrados</span>
                    </div>
                </div>
                
                ${this.loading ? `
                    <div class="loading-container">
                        <div class="spinner"></div>
                        <p>Carregando dados do PostgreSQL...</p>
                    </div>
                ` : `
                    <div class="contacts-toolbar">
                        <div class="search-section">
                            <input type="text" class="form-input" placeholder="Buscar por SA, nome, telefone ou técnico..." id="search-contacts">
                        </div>
                        <div class="actions-section">
                            <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.refreshContacts()">
                                🔄 Atualizar
                        </button>
                            <button class="btn btn-success" onclick="window.SacsMaxApp.currentModule.exportContacts()">
                            📥 Exportar
                        </button>
                    </div>
                </div>
                
                    <div class="contacts-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>SA</th>
                                    <th>Nome do Cliente</th>
                                    <th>Telefone</th>
                                    <th>Técnico</th>
                                    <th>Serviço</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.filteredContacts.map(contact => `
                                    <tr>
                                        <td><strong>${contact.sa}</strong></td>
                                        <td>${contact.nome_cliente || 'N/A'}</td>
                                        <td>${contact.telefone || 'N/A'}</td>
                                        <td>${contact.tecnico || 'N/A'}</td>
                                        <td>${contact.servico || 'N/A'}</td>
                                        <td>
                                            <span class="status-badge ${contact.status === 'Concluído' ? 'active' : 'inactive'}">
                                                ${contact.status || 'Pendente'}
                                            </span>
                                        </td>
                                        <td>${contact.data || 'N/A'}</td>
                                        <td>
                                            <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.viewContact('${contact.sa}')" title="Ver detalhes">
                                                👁️
                                            </button>
                                            <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.editContact('${contact.sa}')" title="Editar">
                                                ✏️
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    ${this.filteredContacts.length === 0 ? `
                        <div class="empty-state">
                            <span class="icon">📭</span>
                            <h3>Nenhum contato encontrado</h3>
                            <p>${this.searchTerm ? 'Tente ajustar os filtros de busca' : 'Nenhum dado na tabela produtividade'}</p>
                    </div>
                    ` : ''}
                `}
            </div>
        `;
    }

    async refreshContacts() {
        await this.loadContactsFromDatabase();
                this.filterContacts();
        this.showNotification('✅ Dados atualizados do PostgreSQL!', 'success');
    }

    viewContact(sa) {
        const contact = this.contacts.find(c => c.sa === sa);
        if (!contact) {
            this.showNotification('❌ Contato não encontrado', 'error');
            return;
        }

        const details = `
            <div class="contact-details">
                <h3>Detalhes do Contato - SA: ${contact.sa}</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Nome:</strong> ${contact.nome_cliente || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Telefone:</strong> ${contact.telefone || 'N/A'}
                </div>
                    <div class="detail-item">
                        <strong>Técnico:</strong> ${contact.tecnico || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Serviço:</strong> ${contact.servico || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> ${contact.status || 'Pendente'}
                    </div>
                    <div class="detail-item">
                        <strong>Data:</strong> ${contact.data || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Endereço:</strong> ${contact.endereco || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong> ${contact.email || 'N/A'}
                        </div>
                    </div>
            </div>
        `;

        alert(details.replace(/<[^>]*>/g, ''));
    }

    editContact(sa) {
        this.showNotification('⚠️ Edição ainda não implementada - dados do PostgreSQL', 'warning');
    }

    exportContacts() {
        if (this.filteredContacts.length === 0) {
            this.showNotification('❌ Nenhum contato para exportar', 'error');
            return;
        }

        const csvContent = [
            ['SA', 'Nome do Cliente', 'Telefone', 'Técnico', 'Serviço', 'Status', 'Data', 'Endereço', 'Email'],
            ...this.filteredContacts.map(contact => [
                contact.sa,
                contact.nome_cliente || '',
                contact.telefone || '',
                contact.tecnico || '',
                contact.servico || '',
                contact.status || '',
                contact.data || '',
                contact.endereco || '',
                contact.email || ''
            ])
        ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `contatos_produtividade_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

        this.showNotification(`✅ ${this.filteredContacts.length} contatos exportados!`, 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
                <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    destroy() {
        // Cleanup se necessário
        console.log('🗑️ ContactsModule destruído');
    }
}
