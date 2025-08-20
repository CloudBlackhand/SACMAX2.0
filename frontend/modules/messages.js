// Módulo de Disparo de Mensagens
// Permite enviar mensagens filtradas por data

class MessagesModule {
    constructor() {
        this.contacts = [];
        this.templates = [];
        this.scheduledMessages = [];
        this.loadData();
    }

    async loadData() {
        // Carrega dados do localStorage
        this.contacts = JSON.parse(localStorage.getItem('sacsmax_contacts') || '[]');
        this.templates = JSON.parse(localStorage.getItem('sacsmax_templates') || '[]');
        this.scheduledMessages = JSON.parse(localStorage.getItem('sacsmax_scheduled_messages') || '[]');
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">📤</span>
                    <h2 class="module-title">Disparo de Mensagens</h2>
                </div>
                
                <div class="messages-grid">
                    <!-- Filtros -->
                    <div class="filter-section">
                        <h3>🔍 Filtros de Seleção</h3>
                        <div class="filter-controls">
                            <div class="filter-group">
                                <label>Data Inicial:</label>
                                <input type="date" id="start-date" class="form-control">
                            </div>
                            <div class="filter-group">
                                <label>Data Final:</label>
                                <input type="date" id="end-date" class="form-control">
                            </div>
                            <div class="filter-group">
                                <label>Status:</label>
                                <select id="status-filter" class="form-control">
                                    <option value="">Todos</option>
                                    <option value="active">Ativos</option>
                                    <option value="inactive">Inativos</option>
                                    <option value="pending">Pendentes</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>Grupo:</label>
                                <select id="group-filter" class="form-control">
                                    <option value="">Todos</option>
                                    <option value="vip">VIP</option>
                                    <option value="regular">Regular</option>
                                    <option value="new">Novos</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.applyFilters()">
                                🔍 Aplicar Filtros
                            </button>
                        </div>
                    </div>

                    <!-- Resultados dos Filtros -->
                    <div class="results-section">
                        <div class="results-header">
                            <h3>📋 Contatos Selecionados</h3>
                            <div class="results-stats">
                                <span id="selected-count">0</span> contatos selecionados
                            </div>
                        </div>
                        <div class="contacts-list" id="filtered-contacts">
                            <!-- Lista de contatos será carregada aqui -->
                        </div>
                    </div>

                    <!-- Configuração da Mensagem -->
                    <div class="message-section">
                        <h3>💬 Configurar Mensagem</h3>
                        <div class="message-config">
                            <div class="template-selector">
                                <label>Template de Mensagem:</label>
                                <select id="message-template" class="form-control" onchange="window.SacsMaxApp.currentModule.loadTemplate()">
                                    <option value="">Selecione um template</option>
                                    <option value="custom">Mensagem Personalizada</option>
                                </select>
                            </div>
                            <div class="message-editor">
                                <label>Mensagem:</label>
                                <textarea id="message-text" class="form-control" rows="6" placeholder="Digite sua mensagem aqui..."></textarea>
                                <div class="message-variables">
                                    <small>Variáveis disponíveis: {nome}, {empresa}, {telefone}, {data}</small>
                                </div>
                            </div>
                            <div class="scheduling">
                                <label>Agendamento:</label>
                                <div class="schedule-options">
                                    <label>
                                        <input type="radio" name="schedule" value="now" checked> Enviar agora
                                    </label>
                                    <label>
                                        <input type="radio" name="schedule" value="later"> Agendar para:
                                    </label>
                                    <input type="datetime-local" id="schedule-time" class="form-control" disabled>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Ações -->
                    <div class="actions-section">
                        <div class="action-buttons">
                            <button class="btn btn-success" onclick="window.SacsMaxApp.currentModule.sendMessages()">
                                📤 Enviar Mensagens
                            </button>
                            <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.previewMessages()">
                                👁️ Pré-visualizar
                            </button>
                            <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.saveTemplate()">
                                💾 Salvar como Template
                            </button>
                        </div>
                    </div>

                    <!-- Histórico -->
                    <div class="history-section">
                        <h3>📊 Histórico de Disparos</h3>
                        <div class="history-list" id="message-history">
                            <!-- Histórico será carregado aqui -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.setupEventListeners();
        this.loadTemplates();
        this.loadHistory();
        this.setupDateDefaults();
    }

    setupEventListeners() {
        // Configuração de agendamento
        const scheduleRadios = document.querySelectorAll('input[name="schedule"]');
        const scheduleTime = document.getElementById('schedule-time');
        
        scheduleRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'later') {
                    scheduleTime.disabled = false;
                } else {
                    scheduleTime.disabled = true;
                }
            });
        });

        // Filtros automáticos
        const filterInputs = document.querySelectorAll('#start-date, #end-date, #status-filter, #group-filter');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => {
                setTimeout(() => this.applyFilters(), 100);
            });
        });
    }

    setupDateDefaults() {
        const today = new Date();
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        
        // Define data inicial como 30 dias atrás
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];
        
        // Aplica filtros iniciais
        this.applyFilters();
    }

    applyFilters() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const statusFilter = document.getElementById('status-filter').value;
        const groupFilter = document.getElementById('group-filter').value;

        let filteredContacts = this.contacts.filter(contact => {
            // Filtro por data
            if (startDate && endDate) {
                const contactDate = new Date(contact.created_at || contact.date_added || Date.now());
                const start = new Date(startDate);
                const end = new Date(endDate);
                
                if (contactDate < start || contactDate > end) {
                    return false;
                }
            }

            // Filtro por status
            if (statusFilter && contact.status !== statusFilter) {
                return false;
            }

            // Filtro por grupo
            if (groupFilter && contact.group !== groupFilter) {
                return false;
            }

            return true;
        });

        this.displayFilteredContacts(filteredContacts);
    }

    displayFilteredContacts(contacts) {
        const container = document.getElementById('filtered-contacts');
        const countElement = document.getElementById('selected-count');
        
        countElement.textContent = contacts.length;

        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="icon">📭</span>
                    <p>Nenhum contato encontrado com os filtros aplicados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contacts.map(contact => `
            <div class="contact-item" data-contact-id="${contact.id}">
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-phone">${contact.phone}</div>
                    <div class="contact-email">${contact.email || 'N/A'}</div>
                </div>
                <div class="contact-meta">
                    <span class="contact-status ${contact.status || 'active'}">${contact.status || 'Ativo'}</span>
                    <span class="contact-group">${contact.group || 'Regular'}</span>
                </div>
                <div class="contact-actions">
                    <input type="checkbox" class="contact-checkbox" checked>
                </div>
            </div>
        `).join('');
    }

    loadTemplates() {
        const templateSelect = document.getElementById('message-template');
        
        // Adiciona templates padrão
        const defaultTemplates = [
            { id: 'welcome', name: 'Boas-vindas', text: 'Olá {nome}! Bem-vindo à {empresa}.' },
            { id: 'reminder', name: 'Lembrete', text: 'Olá {nome}, não esqueça do seu compromisso hoje!' },
            { id: 'promotion', name: 'Promoção', text: 'Olá {nome}! Temos uma oferta especial para você!' }
        ];

        defaultTemplates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            templateSelect.appendChild(option);
        });

        // Adiciona templates salvos
        this.templates.forEach(template => {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            templateSelect.appendChild(option);
        });
    }

    loadTemplate() {
        const templateId = document.getElementById('message-template').value;
        const messageText = document.getElementById('message-text');
        
        if (!templateId || templateId === 'custom') {
            return;
        }

        // Busca template
        const template = this.templates.find(t => t.id === templateId) || 
                        this.getDefaultTemplate(templateId);
        
        if (template) {
            messageText.value = template.text;
        }
    }

    getDefaultTemplate(templateId) {
        const templates = {
            'welcome': { text: 'Olá {nome}! Bem-vindo à {empresa}. Como posso ajudá-lo hoje?' },
            'reminder': { text: 'Olá {nome}, não esqueça do seu compromisso agendado para hoje!' },
            'promotion': { text: 'Olá {nome}! Temos uma oferta especial para você: 20% de desconto!' }
        };
        return templates[templateId];
    }

    previewMessages() {
        const messageText = document.getElementById('message-text').value;
        const selectedContacts = this.getSelectedContacts();
        
        if (!messageText.trim()) {
            alert('Digite uma mensagem primeiro!');
            return;
        }

        if (selectedContacts.length === 0) {
            alert('Selecione pelo menos um contato!');
            return;
        }

        const preview = selectedContacts.map(contact => {
            const personalizedMessage = this.personalizeMessage(messageText, contact);
            return `
                <div class="message-preview">
                    <strong>Para: ${contact.name} (${contact.phone})</strong>
                    <p>${personalizedMessage}</p>
                </div>
            `;
        }).join('');

        this.showModal('Pré-visualização das Mensagens', `
            <div class="preview-container">
                ${preview}
            </div>
        `);
    }

    sendMessages() {
        const messageText = document.getElementById('message-text').value;
        const selectedContacts = this.getSelectedContacts();
        const scheduleType = document.querySelector('input[name="schedule"]:checked').value;
        const scheduleTime = document.getElementById('schedule-time').value;

        if (!messageText.trim()) {
            alert('Digite uma mensagem primeiro!');
            return;
        }

        if (selectedContacts.length === 0) {
            alert('Selecione pelo menos um contato!');
            return;
        }

        if (scheduleType === 'later' && !scheduleTime) {
            alert('Selecione uma data e hora para agendamento!');
            return;
        }

        // Simula envio
        this.showProgress('Enviando mensagens...', selectedContacts.length);
        
        let sentCount = 0;
        const totalCount = selectedContacts.length;

        selectedContacts.forEach((contact, index) => {
            setTimeout(() => {
                const personalizedMessage = this.personalizeMessage(messageText, contact);
                
                // Simula envio
                this.logMessage({
                    id: Date.now() + index,
                    contact_id: contact.id,
                    contact_name: contact.name,
                    contact_phone: contact.phone,
                    message: personalizedMessage,
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    scheduled_for: scheduleType === 'later' ? scheduleTime : null
                });

                sentCount++;
                this.updateProgress(sentCount, totalCount);

                if (sentCount === totalCount) {
                    this.hideProgress();
                    alert(`✅ ${sentCount} mensagens enviadas com sucesso!`);
                    this.loadHistory();
                }
            }, index * 500); // Simula delay entre envios
        });
    }

    getSelectedContacts() {
        const checkboxes = document.querySelectorAll('.contact-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => {
            const contactItem = checkbox.closest('.contact-item');
            const contactId = contactItem.dataset.contactId;
            return this.contacts.find(c => c.id == contactId);
        }).filter(Boolean);
    }

    personalizeMessage(message, contact) {
        return message
            .replace(/{nome}/g, contact.name || 'Cliente')
            .replace(/{empresa}/g, 'SacsMax')
            .replace(/{telefone}/g, contact.phone || '')
            .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'));
    }

    saveTemplate() {
        const messageText = document.getElementById('message-text').value;
        
        if (!messageText.trim()) {
            alert('Digite uma mensagem primeiro!');
            return;
        }

        const templateName = prompt('Digite o nome do template:');
        if (!templateName) return;

        const template = {
            id: 'template_' + Date.now(),
            name: templateName,
            text: messageText,
            created_at: new Date().toISOString()
        };

        this.templates.push(template);
        localStorage.setItem('sacsmax_templates', JSON.stringify(this.templates));
        
        // Recarrega templates
        this.loadTemplates();
        alert('Template salvo com sucesso!');
    }

    logMessage(messageData) {
        this.scheduledMessages.push(messageData);
        localStorage.setItem('sacsmax_scheduled_messages', JSON.stringify(this.scheduledMessages));
    }

    loadHistory() {
        const container = document.getElementById('message-history');
        
        if (this.scheduledMessages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="icon">📭</span>
                    <p>Nenhum disparo realizado ainda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.scheduledMessages
            .slice(-10) // Últimas 10 mensagens
            .reverse()
            .map(message => `
                <div class="history-item">
                    <div class="history-info">
                        <div class="history-contact">${message.contact_name}</div>
                        <div class="history-phone">${message.contact_phone}</div>
                        <div class="history-time">${new Date(message.sent_at).toLocaleString('pt-BR')}</div>
                    </div>
                    <div class="history-status ${message.status}">
                        ${message.status === 'sent' ? '✅ Enviado' : '⏳ Agendado'}
                    </div>
                </div>
            `).join('');
    }

    showProgress(message, total) {
        const progress = document.createElement('div');
        progress.id = 'progress-overlay';
        progress.innerHTML = `
            <div class="progress-container">
                <div class="progress-message">${message}</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill"></div>
                </div>
                <div class="progress-text" id="progress-text">0 / ${total}</div>
            </div>
        `;
        document.body.appendChild(progress);
    }

    updateProgress(current, total) {
        const fill = document.getElementById('progress-fill');
        const text = document.getElementById('progress-text');
        
        if (fill && text) {
            const percentage = (current / total) * 100;
            fill.style.width = percentage + '%';
            text.textContent = `${current} / ${total}`;
        }
    }

    hideProgress() {
        const progress = document.getElementById('progress-overlay');
        if (progress) {
            progress.remove();
        }
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    destroy() {
        // Cleanup se necessário
    }
}

export default MessagesModule;
