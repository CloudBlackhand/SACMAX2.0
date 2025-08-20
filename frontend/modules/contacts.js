// Módulo Contacts - Gerenciamento de contatos

class ContactsModule {
    constructor() {
        this.contacts = [];
        this.filteredContacts = [];
        this.searchTerm = '';
        this.currentContact = null;
        this.editMode = false;
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        this.selectedContacts = new Set();
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">👥</span>
                    <h2 class="module-title">Gerenciar Contatos</h2>
                    <div class="contacts-actions">
                        <button class="btn btn-primary" onclick="this.showAddContactModal()">
                            ➕ Novo Contato
                        </button>
                        <button class="btn btn-secondary" onclick="this.exportContacts()">
                            📥 Exportar
                        </button>
                    </div>
                </div>
                
                <!-- Filtros e Busca -->
                <div class="card">
                    <div class="filters-container">
                        <div class="search-section">
                            <input type="text" 
                                   class="search-input" 
                                   id="contact-search"
                                   placeholder="🔍 Buscar contatos..."
                                   value="${this.searchTerm}" />
                        </div>
                        
                        <div class="filter-controls">
                            <select class="form-input" id="sort-select" onchange="this.handleSort()">
                                <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Ordenar por Nome</option>
                                <option value="company" ${this.sortBy === 'company' ? 'selected' : ''}>Ordenar por Empresa</option>
                                <option value="created" ${this.sortBy === 'created' ? 'selected' : ''}>Ordenar por Data</option>
                                <option value="lastContact" ${this.sortBy === 'lastContact' ? 'selected' : ''}>Ordenar por Último Contato</option>
                            </select>
                            
                            <button class="btn btn-sm btn-secondary" onclick="this.toggleSortOrder()">
                                ${this.sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                        
                        <div class="bulk-actions" id="bulk-actions" style="display: none;">
                            <span class="selected-count">0 selecionados</span>
                            <button class="btn btn-sm btn-danger" onclick="this.deleteSelected()">
                                🗑️ Excluir Selecionados
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="this.exportSelected()">
                                📥 Exportar Selecionados
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Lista de Contatos -->
                <div class="card">
                    <div class="contacts-table-container">
                        <table class="contacts-table" id="contacts-table">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" id="select-all" onchange="this.toggleSelectAll()" />
                                    </th>
                                    <th>Nome</th>
                                    <th>Telefone</th>
                                    <th>Email</th>
                                    <th>Empresa</th>
                                    <th>Status</th>
                                    <th>Último Contato</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="contacts-tbody">
                                ${this.renderContactsTable()}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Paginação -->
                    <div class="pagination" id="pagination">
                        ${this.renderPagination()}
                    </div>
                </div>
                
                <!-- Estatísticas -->
                <div class="grid grid-3">
                    <div class="card stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <h3>${this.contacts.length}</h3>
                            <p>Total de Contatos</p>
                        </div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <h3>${this.getActiveContactsCount()}</h3>
                            <p>Contatos Ativos</p>
                        </div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <h3>${this.getRecentContactsCount()}</h3>
                            <p>Novos este Mês</p>
                        </div>
                    </div>
                </div>
                
                <!-- Modal Adicionar/Editar Contato -->
                <div class="modal" id="contact-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>${this.editMode ? '✏️ Editar Contato' : '➕ Novo Contato'}</h3>
                            <button class="modal-close" onclick="this.closeContactModal()">×</button>
                        </div>
                        <div class="modal-body">
                            <form id="contact-form">
                                <div class="grid grid-2">
                                    <div class="form-group">
                                        <label class="form-label">Nome Completo *</label>
                                        <input type="text" class="form-input" id="contact-name" required />
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Telefone *</label>
                                        <input type="tel" class="form-input" id="contact-phone" required />
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-input" id="contact-email" />
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Empresa</label>
                                        <input type="text" class="form-input" id="contact-company" />
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Cargo</label>
                                        <input type="text" class="form-input" id="contact-position" />
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Status</label>
                                        <select class="form-input" id="contact-status">
                                            <option value="active">Ativo</option>
                                            <option value="inactive">Inativo</option>
                                            <option value="prospect">Prospecto</option>
                                            <option value="customer">Cliente</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Observações</label>
                                    <textarea class="form-input" id="contact-notes" rows="3"
                                            placeholder="Observações sobre o contato..."></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Tags</label>
                                    <input type="text" class="form-input" id="contact-tags"
                                           placeholder="Separe as tags com vírgula" />
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="this.closeContactModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="this.saveContact()">
                                ${this.editMode ? '💾 Atualizar' : '➕ Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Modal de Detalhes do Contato -->
                <div class="modal" id="contact-details-modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>👤 Detalhes do Contato</h3>
                            <button class="modal-close" onclick="this.closeDetailsModal()">×</button>
                        </div>
                        <div class="modal-body" id="contact-details-content">
                            <!-- Conteúdo será preenchido dinamicamente -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" onclick="this.closeDetailsModal()">Fechar</button>
                            <button class="btn btn-primary" onclick="this.editContactFromDetails()">✏️ Editar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderContactsTable() {
        const contacts = this.filteredContacts.length > 0 ? this.filteredContacts : this.contacts;
        
        if (contacts.length === 0) {
            return `
                <tr>
                    <td colspan="8" class="no-contacts">
                        <div class="no-contacts-content">
                            <div class="no-contacts-icon">👥</div>
                            <p>Nenhum contato encontrado</p>
                            <button class="btn btn-primary" onclick="this.showAddContactModal()">
                                ➕ Adicionar Primeiro Contato
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }

        return contacts.map(contact => `
            <tr class="contact-row" data-id="${contact.id}">
                <td>
                    <input type="checkbox" class="contact-checkbox" 
                           value="${contact.id}" 
                           ${this.selectedContacts.has(contact.id) ? 'checked' : ''}
                           onchange="this.toggleContactSelection('${contact.id}')" />
                </td>
                <td>
                    <div class="contact-name-cell">
                        <div class="contact-avatar">
                            ${this.getContactInitials(contact.name)}
                        </div>
                        <div class="contact-info">
                            <div class="contact-name">${contact.name}</div>
                            ${contact.position ? `<div class="contact-position">${contact.position}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <a href="tel:${contact.phone}" class="contact-phone">${contact.phone}</a>
                </td>
                <td>
                    ${contact.email ? `<a href="mailto:${contact.email}" class="contact-email">${contact.email}</a>` : '-'}
                </td>
                <td>${contact.company || '-'}</td>
                <td>
                    <span class="status-badge status-${contact.status}">
                        ${this.getStatusText(contact.status)}
                    </span>
                </td>
                <td>${this.formatDate(contact.lastContact)}</td>
                <td>
                    <div class="contact-actions">
                        <button class="btn btn-sm btn-secondary" onclick="this.showContactDetails('${contact.id}')" title="Ver detalhes">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="this.editContact('${contact.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="this.deleteContact('${contact.id}')" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.contacts.length / 10);
        if (totalPages <= 1) return '';

        let pagination = '<div class="pagination-controls">';
        
        // Botão anterior
        pagination += '<button class="btn btn-sm btn-secondary">← Anterior</button>';
        
        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            pagination += `<button class="btn btn-sm ${i === 1 ? 'btn-primary' : 'btn-secondary'}">${i}</button>`;
        }
        
        // Botão próximo
        pagination += '<button class="btn btn-sm btn-secondary">Próximo →</button>';
        
        pagination += '</div>';
        return pagination;
    }

    init() {
        this.loadContacts();
        this.setupEventListeners();
    }

    destroy() {
        // Limpa event listeners se necessário
    }

    setupEventListeners() {
        setTimeout(() => {
            this.setupSearch();
            this.setupFormValidation();
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

    setupFormValidation() {
        const form = document.getElementById('contact-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveContact();
            });
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
                    position: 'Gerente',
                    status: 'active',
                    notes: 'Cliente importante',
                    tags: ['vip', 'cliente'],
                    lastContact: new Date().toISOString(),
                    created: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Maria Santos',
                    phone: '(11) 88888-8888',
                    email: 'maria@email.com',
                    company: 'Empresa B',
                    position: 'Analista',
                    status: 'customer',
                    notes: 'Interessada em novos produtos',
                    tags: ['prospecto'],
                    lastContact: new Date(Date.now() - 86400000).toISOString(),
                    created: new Date(Date.now() - 172800000).toISOString()
                },
                {
                    id: '3',
                    name: 'Pedro Costa',
                    phone: '(11) 77777-7777',
                    email: 'pedro@email.com',
                    company: 'Empresa C',
                    position: 'Diretor',
                    status: 'prospect',
                    notes: 'Primeiro contato realizado',
                    tags: ['diretor'],
                    lastContact: new Date(Date.now() - 259200000).toISOString(),
                    created: new Date(Date.now() - 259200000).toISOString()
                }
            ];
        }
        
        this.sortContacts();
        this.updateContactsTable();
    }

    filterContacts() {
        if (!this.searchTerm.trim()) {
            this.filteredContacts = [];
            this.updateContactsTable();
            return;
        }

        const searchLower = this.searchTerm.toLowerCase();
        this.filteredContacts = this.contacts.filter(contact =>
            contact.name.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower) ||
            contact.phone.includes(searchTerm) ||
            contact.company?.toLowerCase().includes(searchLower)
        );
        
        this.updateContactsTable();
    }

    sortContacts() {
        this.contacts.sort((a, b) => {
            let aValue, bValue;
            
            switch (this.sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'company':
                    aValue = (a.company || '').toLowerCase();
                    bValue = (b.company || '').toLowerCase();
                    break;
                case 'created':
                    aValue = new Date(a.created);
                    bValue = new Date(b.created);
                    break;
                case 'lastContact':
                    aValue = new Date(a.lastContact);
                    bValue = new Date(b.lastContact);
                    break;
                default:
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
            }
            
            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    handleSort() {
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            this.sortBy = sortSelect.value;
            this.sortContacts();
            this.updateContactsTable();
        }
    }

    toggleSortOrder() {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.sortContacts();
        this.updateContactsTable();
    }

    updateContactsTable() {
        const tbody = document.getElementById('contacts-tbody');
        if (tbody) {
            tbody.innerHTML = this.renderContactsTable();
        }
        
        const pagination = document.getElementById('pagination');
        if (pagination) {
            pagination.innerHTML = this.renderPagination();
        }
    }

    showAddContactModal() {
        this.editMode = false;
        this.currentContact = null;
        this.resetContactForm();
        this.showContactModal();
    }

    editContact(contactId) {
        this.editMode = true;
        this.currentContact = this.contacts.find(c => c.id === contactId);
        
        if (this.currentContact) {
            this.fillContactForm(this.currentContact);
            this.showContactModal();
        }
    }

    showContactModal() {
        const modal = document.getElementById('contact-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeContactModal() {
        const modal = document.getElementById('contact-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    resetContactForm() {
        const form = document.getElementById('contact-form');
        if (form) {
            form.reset();
        }
    }

    fillContactForm(contact) {
        document.getElementById('contact-name').value = contact.name || '';
        document.getElementById('contact-phone').value = contact.phone || '';
        document.getElementById('contact-email').value = contact.email || '';
        document.getElementById('contact-company').value = contact.company || '';
        document.getElementById('contact-position').value = contact.position || '';
        document.getElementById('contact-status').value = contact.status || 'active';
        document.getElementById('contact-notes').value = contact.notes || '';
        document.getElementById('contact-tags').value = contact.tags?.join(', ') || '';
    }

    saveContact() {
        const formData = this.getContactFormData();
        
        if (!this.validateContactForm(formData)) {
            return;
        }
        
        if (this.editMode && this.currentContact) {
            // Atualiza contato existente
            Object.assign(this.currentContact, formData);
            this.currentContact.updated = new Date().toISOString();
        } else {
            // Cria novo contato
            const newContact = {
                id: Date.now().toString(),
                ...formData,
                created: new Date().toISOString(),
                lastContact: new Date().toISOString()
            };
            this.contacts.push(newContact);
        }
        
        this.saveContacts();
        this.sortContacts();
        this.updateContactsTable();
        this.closeContactModal();
        
        const message = this.editMode ? 'Contato atualizado com sucesso!' : 'Contato adicionado com sucesso!';
        this.showNotification(message, 'success');
    }

    getContactFormData() {
        return {
            name: document.getElementById('contact-name')?.value || '',
            phone: document.getElementById('contact-phone')?.value || '',
            email: document.getElementById('contact-email')?.value || '',
            company: document.getElementById('contact-company')?.value || '',
            position: document.getElementById('contact-position')?.value || '',
            status: document.getElementById('contact-status')?.value || 'active',
            notes: document.getElementById('contact-notes')?.value || '',
            tags: document.getElementById('contact-tags')?.value.split(',').map(t => t.trim()).filter(t => t) || []
        };
    }

    validateContactForm(data) {
        if (!data.name.trim()) {
            this.showNotification('Nome é obrigatório', 'error');
            return false;
        }
        
        if (!data.phone.trim()) {
            this.showNotification('Telefone é obrigatório', 'error');
            return false;
        }
        
        if (data.email && !this.isValidEmail(data.email)) {
            this.showNotification('Email inválido', 'error');
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    deleteContact(contactId) {
        if (confirm('Tem certeza que deseja excluir este contato?')) {
            this.contacts = this.contacts.filter(c => c.id !== contactId);
            this.saveContacts();
            this.updateContactsTable();
            this.showNotification('Contato excluído com sucesso!', 'success');
        }
    }

    showContactDetails(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        const detailsContent = document.getElementById('contact-details-content');
        if (detailsContent) {
            detailsContent.innerHTML = this.renderContactDetails(contact);
        }
        
        const modal = document.getElementById('contact-details-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    renderContactDetails(contact) {
        return `
            <div class="contact-details">
                <div class="contact-header">
                    <div class="contact-avatar-large">
                        ${this.getContactInitials(contact.name)}
                    </div>
                    <div class="contact-info-large">
                        <h3>${contact.name}</h3>
                        <p class="contact-position">${contact.position || 'Cargo não informado'}</p>
                        <span class="status-badge status-${contact.status}">
                            ${this.getStatusText(contact.status)}
                        </span>
                    </div>
                </div>
                
                <div class="contact-details-grid">
                    <div class="detail-item">
                        <label>Telefone:</label>
                        <a href="tel:${contact.phone}">${contact.phone}</a>
                    </div>
                    
                    <div class="detail-item">
                        <label>Email:</label>
                        ${contact.email ? `<a href="mailto:${contact.email}">${contact.email}</a>` : 'Não informado'}
                    </div>
                    
                    <div class="detail-item">
                        <label>Empresa:</label>
                        <span>${contact.company || 'Não informado'}</span>
                    </div>
                    
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge status-${contact.status}">
                            ${this.getStatusText(contact.status)}
                        </span>
                    </div>
                    
                    <div class="detail-item">
                        <label>Data de Criação:</label>
                        <span>${this.formatDate(contact.created)}</span>
                    </div>
                    
                    <div class="detail-item">
                        <label>Último Contato:</label>
                        <span>${this.formatDate(contact.lastContact)}</span>
                    </div>
                </div>
                
                ${contact.notes ? `
                    <div class="detail-section">
                        <h4>Observações</h4>
                        <p>${contact.notes}</p>
                    </div>
                ` : ''}
                
                ${contact.tags && contact.tags.length > 0 ? `
                    <div class="detail-section">
                        <h4>Tags</h4>
                        <div class="tags-container">
                            ${contact.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    closeDetailsModal() {
        const modal = document.getElementById('contact-details-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    editContactFromDetails() {
        this.closeDetailsModal();
        if (this.currentContact) {
            this.editContact(this.currentContact.id);
        }
    }

    toggleSelectAll() {
        const selectAll = document.getElementById('select-all');
        const checkboxes = document.querySelectorAll('.contact-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll.checked;
            if (selectAll.checked) {
                this.selectedContacts.add(checkbox.value);
            } else {
                this.selectedContacts.delete(checkbox.value);
            }
        });
        
        this.updateBulkActions();
    }

    toggleContactSelection(contactId) {
        if (this.selectedContacts.has(contactId)) {
            this.selectedContacts.delete(contactId);
        } else {
            this.selectedContacts.add(contactId);
        }
        
        this.updateBulkActions();
    }

    updateBulkActions() {
        const bulkActions = document.getElementById('bulk-actions');
        const selectedCount = document.querySelector('.selected-count');
        
        if (bulkActions) {
            if (this.selectedContacts.size > 0) {
                bulkActions.style.display = 'flex';
                if (selectedCount) {
                    selectedCount.textContent = `${this.selectedContacts.size} selecionados`;
                }
            } else {
                bulkActions.style.display = 'none';
            }
        }
    }

    deleteSelected() {
        if (this.selectedContacts.size === 0) return;
        
        if (confirm(`Tem certeza que deseja excluir ${this.selectedContacts.size} contato(s)?`)) {
            this.contacts = this.contacts.filter(c => !this.selectedContacts.has(c.id));
            this.selectedContacts.clear();
            this.saveContacts();
            this.updateContactsTable();
            this.updateBulkActions();
            this.showNotification('Contatos excluídos com sucesso!', 'success');
        }
    }

    exportContacts() {
        const contactsToExport = this.selectedContacts.size > 0 
            ? this.contacts.filter(c => this.selectedContacts.has(c.id))
            : this.contacts;
        
        const csv = this.convertToCSV(contactsToExport);
        this.downloadCSV(csv, 'contatos.csv');
        
        this.showNotification('Contatos exportados com sucesso!', 'success');
    }

    exportSelected() {
        this.exportContacts();
    }

    convertToCSV(contacts) {
        const headers = ['Nome', 'Telefone', 'Email', 'Empresa', 'Cargo', 'Status', 'Observações', 'Tags'];
        const rows = contacts.map(contact => [
            contact.name,
            contact.phone,
            contact.email || '',
            contact.company || '',
            contact.position || '',
            this.getStatusText(contact.status),
            contact.notes || '',
            contact.tags?.join('; ') || ''
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        
        return csvContent;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    saveContacts() {
        localStorage.setItem('sacsmax_contacts', JSON.stringify(this.contacts));
    }

    getContactInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Ativo',
            'inactive': 'Inativo',
            'prospect': 'Prospecto',
            'customer': 'Cliente'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return 'Nunca';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    getActiveContactsCount() {
        return this.contacts.filter(c => c.status === 'active' || c.status === 'customer').length;
    }

    getRecentContactsCount() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        return this.contacts.filter(c => new Date(c.created) > oneMonthAgo).length;
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

// Adiciona estilos específicos do módulo Contacts
const contactsStyles = `
    .contacts-actions {
        display: flex;
        gap: 1rem;
    }

    .filters-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .search-section {
        flex: 1;
        min-width: 300px;
    }

    .filter-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }

    .bulk-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 0.5rem 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .selected-count {
        font-weight: 500;
        color: #495057;
    }

    .contacts-table-container {
        overflow-x: auto;
    }

    .contacts-table {
        width: 100%;
        border-collapse: collapse;
    }

    .contacts-table th,
    .contacts-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #e9ecef;
    }

    .contacts-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
        position: sticky;
        top: 0;
    }

    .contacts-table tr:hover {
        background: #f8f9fa;
    }

    .contact-name-cell {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .contact-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .contact-info {
        display: flex;
        flex-direction: column;
    }

    .contact-name {
        font-weight: 500;
        color: #495057;
    }

    .contact-position {
        font-size: 0.8rem;
        color: #6c757d;
    }

    .contact-phone,
    .contact-email {
        color: #667eea;
        text-decoration: none;
    }

    .contact-phone:hover,
    .contact-email:hover {
        text-decoration: underline;
    }

    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .status-active {
        background: #d4edda;
        color: #155724;
    }

    .status-inactive {
        background: #f8d7da;
        color: #721c24;
    }

    .status-prospect {
        background: #fff3cd;
        color: #856404;
    }

    .status-customer {
        background: #cce5ff;
        color: #004085;
    }

    .contact-actions {
        display: flex;
        gap: 0.5rem;
    }

    .no-contacts {
        text-align: center;
        padding: 3rem;
    }

    .no-contacts-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .no-contacts-icon {
        font-size: 3rem;
        opacity: 0.5;
    }

    .pagination {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }

    .pagination-controls {
        display: flex;
        gap: 0.5rem;
    }

    .contact-details {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .contact-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .contact-avatar-large {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1.5rem;
    }

    .contact-info-large h3 {
        margin: 0 0 0.5rem 0;
        color: #495057;
    }

    .contact-info-large .contact-position {
        margin: 0 0 1rem 0;
        color: #6c757d;
    }

    .contact-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .detail-item label {
        font-weight: 500;
        color: #495057;
        font-size: 0.9rem;
    }

    .detail-item a {
        color: #667eea;
        text-decoration: none;
    }

    .detail-item a:hover {
        text-decoration: underline;
    }

    .detail-section {
        border-top: 1px solid #e9ecef;
        padding-top: 1rem;
    }

    .detail-section h4 {
        margin: 0 0 1rem 0;
        color: #495057;
    }

    .tags-container {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .tag {
        background: #e9ecef;
        color: #495057;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
    }
`;

// Adiciona os estilos ao documento
if (!document.getElementById('contacts-styles')) {
    const style = document.createElement('style');
    style.id = 'contacts-styles';
    style.textContent = contactsStyles;
    document.head.appendChild(style);
}

export default ContactsModule;
