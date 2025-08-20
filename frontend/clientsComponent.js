/**
 * SACSMAX - Componente de Clientes
 * Aba de gestão de clientes com visualização unificada e upload de planilhas
 */

class ClientsComponent {
    constructor(apiService) {
        this.apiService = apiService;
        this.clients = [];
        this.uploadedData = [];
        this.isProcessing = false;
        this.currentView = 'list'; // 'list' ou 'upload'
    }

    // Renderizar componente principal
    render() {
        return `
            <div class="clients-container">
                ${this.renderHeader()}
                ${this.renderTabs()}
                ${this.currentView === 'list' ? this.renderClientList() : this.renderUploadSection()}
            </div>
        `;
    }

    renderHeader() {
        return `
            <div class="clients-header">
                <h2>Gestão de Clientes</h2>
                <p>Visualize e gerencie todos os seus clientes em um único lugar</p>
            </div>
        `;
    }

    renderTabs() {
        return `
            <div class="clients-tabs">
                <button class="tab-button ${this.currentView === 'list' ? 'active' : ''}" 
                        onclick="clientsComponent.switchView('list')">
                    Lista de Clientes
                </button>
                <button class="tab-button ${this.currentView === 'upload' ? 'active' : ''}" 
                        onclick="clientsComponent.switchView('upload')">
                    Upload de Planilha
                </button>
            </div>
        `;
    }

    renderClientList() {
        const totalClients = this.clients.length;
        const importedCount = this.clients.filter(c => c.source === 'excel').length;
        const manualCount = this.clients.filter(c => c.source === 'manual').length;

        return `
            <div class="client-list-section">
                <div class="stats-cards">
                    <div class="stat-card">
                        <h3>${totalClients}</h3>
                        <p>Total de Clientes</p>
                    </div>
                    <div class="stat-card">
                        <h3>${importedCount}</h3>
                        <p>Importados via Excel</p>
                    </div>
                    <div class="stat-card">
                        <h3>${manualCount}</h3>
                        <p>Cadastrados Manualmente</p>
                    </div>
                </div>

                <div class="client-list">
                    ${this.renderFilterToolbar()}
                    <div id="client-list-container">
                        ${this.renderClientTable()}
                    </div>
                </div>
            </div>
        `;
    }

    renderFilterToolbar() {
        return `
            <div class="filter-toolbar">
                <div class="toolbar-section">
                    <div class="search-group">
                        <input type="text" id="client-search" placeholder="Buscar clientes..." 
                               onkeyup="clientsComponent.filterClients()" class="search-input">
                        <button class="btn btn-icon" onclick="clientsComponent.clearSearch()" title="Limpar busca">❌</button>
                    </div>
                </div>
                
                <div class="toolbar-section">
                    <div class="filter-group">
                        <label>Origem:</label>
                        <select id="source-filter" onchange="clientsComponent.filterClients()">
                            <option value="">Todas as origens</option>
                            <option value="excel">Importados via Excel</option>
                            <option value="manual">Cadastrados Manualmente</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Período:</label>
                        <select id="date-filter" onchange="clientsComponent.filterClients()">
                            <option value="">Todos os períodos</option>
                            <option value="today">Hoje</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mês</option>
                            <option value="year">Este ano</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Ordenar por:</label>
                        <select id="sort-by" onchange="clientsComponent.sortClients()">
                            <option value="name">Nome (A-Z)</option>
                            <option value="name_desc">Nome (Z-A)</option>
                            <option value="date">Data de cadastro (mais recente)</option>
                            <option value="date_asc">Data de cadastro (mais antigo)</option>
                            <option value="source">Origem</option>
                        </select>
                    </div>
                </div>
                
                <div class="toolbar-section">
                    <button class="btn btn-primary" onclick="clientsComponent.refreshClients()" title="Atualizar lista">🔄</button>
                    <button class="btn btn-secondary" onclick="clientsComponent.exportData()" title="Exportar dados">📥</button>
                </div>
            </div>
        `;
    }

    renderClientTable() {
        if (this.clients.length === 0) {
            return `
                <div class="empty-state">
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Faça upload de uma planilha ou adicione clientes manualmente</p>
                </div>
            `;
        }

        return `
            <table class="client-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Telefone</th>
                        <th>Email</th>
                        <th>Origem</th>
                        <th>Data de Cadastro</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.clients.map(client => this.renderClientRow(client)).join('')}
                </tbody>
            </table>
        `;
    }

    renderClientRow(client) {
        const sourceBadge = client.source === 'excel' 
            ? '<span class="badge badge-excel">Excel</span>'
            : '<span class="badge badge-manual">Manual</span>';

        return `
            <tr>
                <td>${client.name || 'N/A'}</td>
                <td>${this.formatPhone(client.phone)}</td>
                <td>${client.email || 'N/A'}</td>
                <td>${sourceBadge}</td>
                <td>${this.formatDate(client.created_at)}</td>
                <td>
                    <button class="btn btn-sm" onclick="clientsComponent.viewClient('${client.id}')">Ver</button>
                    <button class="btn btn-sm btn-danger" onclick="clientsComponent.deleteClient('${client.id}')">Excluir</button>
                </td>
            </tr>
        `;
    }

    renderUploadSection() {
        return `
            <div class="upload-section">
                <div class="upload-card">
                    <h3>Upload de Planilha de Clientes</h3>
                    <p>Selecione um arquivo Excel (.xlsx, .xls) com os dados dos clientes</p>
                    
                    <div class="upload-area" id="upload-area">
                        <div class="upload-icon">📁</div>
                        <h4>Arraste o arquivo ou clique para selecionar</h4>
                        <p>Formatos suportados: Excel (.xlsx, .xls)</p>
                        <input type="file" id="file-input" accept=".xlsx,.xls" style="display: none;">
                    </div>

                    <div id="upload-status" style="display: none;">
                        <div class="processing-indicator">
                            <div class="spinner"></div>
                            <p>Processando arquivo...</p>
                        </div>
                    </div>

                    <div id="validation-results" style="display: none;">
                        <div class="validation-summary">
                            <h4>Resumo da Validação</h4>
                            <div class="validation-stats">
                                <div class="stat">
                                    <span class="number" id="total-records">0</span>
                                    <span class="label">Total no arquivo</span>
                                </div>
                                <div class="stat">
                                    <span class="number" id="valid-records">0</span>
                                    <span class="label">Válidos</span>
                                </div>
                                <div class="stat">
                                    <span class="number" id="duplicate-file">0</span>
                                    <span class="label">Duplicatas no arquivo</span>
                                </div>
                                <div class="stat">
                                    <span class="number" id="duplicate-db">0</span>
                                    <span class="label">Já existem no banco</span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="duplicate-details" style="display: none;">
                            <h5>Detalhes das Duplicatas</h5>
                            <div id="duplicate-list"></div>
                        </div>

                        <div class="upload-actions">
                            <button class="btn btn-success" id="confirm-upload" onclick="clientsComponent.confirmUpload()" disabled>
                                Confirmar Upload (${0} clientes)
                            </button>
                            <button class="btn btn-secondary" onclick="clientsComponent.cancelUpload()">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Métodos de controle
    async switchView(view) {
        this.currentView = view;
        if (view === 'list') {
            await this.loadClients();
        }
        this.updateUI();
    }

    async loadClients() {
        try {
            this.showLoading();
            const response = await this.apiService.request('/clients');
            this.clients = response.clients || [];
            this.updateUI();
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showError('Erro ao carregar clientes');
        } finally {
            this.hideLoading();
        }
    }

    async refreshClients() {
        await this.loadClients();
    }

    filterClients() {
        const searchTerm = document.getElementById('client-search').value.toLowerCase();
        const filtered = this.clients.filter(client => 
            client.name?.toLowerCase().includes(searchTerm) ||
            client.phone?.includes(searchTerm) ||
            client.email?.toLowerCase().includes(searchTerm)
        );
        this.renderFilteredTable(filtered);
    }

    renderFilteredTable(filteredClients) {
        const container = document.getElementById('client-list-container');
        if (filteredClients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Tente ajustar sua busca</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <table class="client-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Telefone</th>
                            <th>Email</th>
                            <th>Origem</th>
                            <th>Data de Cadastro</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredClients.map(client => this.renderClientRow(client)).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    async handleFileSelect(file) {
        if (!file) return;

        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type)) {
            this.showError('Por favor, selecione um arquivo Excel válido');
            return;
        }

        this.showProcessing();
        
        try {
            const validationResult = await this.validateExcelFile(file);
            this.displayValidationResults(validationResult);
        } catch (error) {
            console.error('Erro ao validar arquivo:', error);
            this.showError('Erro ao processar arquivo');
        } finally {
            this.hideProcessing();
        }
    }

    async validateExcelFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await this.apiService.request('/excel/validate', {
            method: 'POST',
            body: formData,
            headers: {}
        });
        
        return response;
    }

    displayValidationResults(result) {
        document.getElementById('upload-status').style.display = 'none';
        document.getElementById('validation-results').style.display = 'block';
        
        document.getElementById('total-records').textContent = result.totalRecords || 0;
        document.getElementById('valid-records').textContent = result.validRecords || 0;
        document.getElementById('duplicate-file').textContent = result.duplicateInFile || 0;
        document.getElementById('duplicate-db').textContent = result.duplicateInDb || 0;
        
        const confirmBtn = document.getElementById('confirm-upload');
        confirmBtn.textContent = `Confirmar Upload (${result.validRecords || 0} clientes)`;
        confirmBtn.disabled = (result.validRecords || 0) === 0;
        
        if (result.duplicates && result.duplicates.length > 0) {
            this.displayDuplicateDetails(result.duplicates);
        }
    }

    displayDuplicateDetails(duplicates) {
        const container = document.getElementById('duplicate-details');
        const list = document.getElementById('duplicate-list');
        
        container.style.display = 'block';
        list.innerHTML = duplicates.map(dup => `
            <div class="duplicate-item">
                <strong>${dup.name || 'N/A'}</strong> - ${dup.phone}
                <span class="duplicate-reason">(${dup.reason})</span>
            </div>
        `).join('');
    }

    async confirmUpload() {
        try {
            this.showProcessing();
            const response = await this.apiService.request('/clients/upload-batch', {
                method: 'POST',
                body: JSON.stringify({ data: this.uploadedData })
            });
            
            if (response.success) {
                this.showSuccess(`Upload concluído: ${response.inserted} clientes adicionados`);
                this.switchView('list');
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            this.showError('Erro ao realizar upload');
        } finally {
            this.hideProcessing();
        }
    }

    cancelUpload() {
        document.getElementById('validation-results').style.display = 'none';
        document.getElementById('upload-status').style.display = 'none';
        document.getElementById('file-input').value = '';
    }

    // Métodos de filtragem e ordenação
    filterClients() {
        const searchTerm = document.getElementById('client-search').value.toLowerCase();
        const sourceFilter = document.getElementById('source-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        
        let filtered = [...this.clients];
        
        // Filtro de busca
        if (searchTerm) {
            filtered = filtered.filter(client => 
                client.name?.toLowerCase().includes(searchTerm) ||
                client.phone?.includes(searchTerm) ||
                client.email?.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtro por origem
        if (sourceFilter) {
            filtered = filtered.filter(client => client.source === sourceFilter);
        }
        
        // Filtro por data
        if (dateFilter) {
            const today = new Date();
            filtered = filtered.filter(client => {
                const clientDate = new Date(client.created_at);
                switch (dateFilter) {
                    case 'today':
                        return clientDate.toDateString() === today.toDateString();
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return clientDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                        return clientDate >= monthAgo;
                    case 'year':
                        const yearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
                        return clientDate >= yearAgo;
                    default:
                        return true;
                }
            });
        }
        
        this.filteredClients = filtered;
        this.sortClients();
    }

    sortClients() {
        const sortBy = document.getElementById('sort-by').value;
        let sorted = [...(this.filteredClients || this.clients)];
        
        switch (sortBy) {
            case 'name':
                sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                break;
            case 'name_desc':
                sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
                break;
            case 'date':
                sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'date_asc':
                sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'source':
                sorted.sort((a, b) => (a.source || '').localeCompare(b.source || ''));
                break;
        }
        
        this.renderFilteredTable(sorted);
    }

    clearSearch() {
        document.getElementById('client-search').value = '';
        document.getElementById('source-filter').value = '';
        document.getElementById('date-filter').value = '';
        document.getElementById('sort-by').value = 'name';
        this.filteredClients = null;
        this.renderFilteredTable(this.clients);
    }

    exportData() {
        const dataToExport = this.filteredClients || this.clients;
        const csvContent = this.convertToCSV(dataToExport);
        this.downloadCSV(csvContent, 'clientes.csv');
    }

    convertToCSV(data) {
        const headers = ['Nome', 'Telefone', 'Email', 'Origem', 'Data de Cadastro'];
        const csvRows = [headers.join(',')];
        
        data.forEach(client => {
            const row = [
                client.name || '',
                client.phone || '',
                client.email || '',
                client.source || '',
                this.formatDate(client.created_at) || ''
            ];
            csvRows.push(row.map(field => `"${field}"`).join(','));
        });
        
        return csvRows.join('\n');
    }

    downloadCSV(csvContent, fileName) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    renderFilteredTable(filteredClients) {
        const container = document.getElementById('client-list-container');
        if (filteredClients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Nenhum cliente encontrado</h3>
                    <p>Ajuste os filtros ou tente uma nova busca</p>
                    <button class="btn btn-secondary" onclick="clientsComponent.clearSearch()">Limpar filtros</button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="results-info">
                    <span>Mostrando ${filteredClients.length} de ${this.clients.length} clientes</span>
                </div>
                <table class="client-table">
                    <thead>
                        <tr>
                            <th onclick="clientsComponent.toggleSort('name')" class="sortable">
                                Nome <span class="sort-indicator">↕</span>
                            </th>
                            <th onclick="clientsComponent.toggleSort('phone')" class="sortable">
                                Telefone <span class="sort-indicator">↕</span>
                            </th>
                            <th onclick="clientsComponent.toggleSort('email')" class="sortable">
                                Email <span class="sort-indicator">↕</span>
                            </th>
                            <th onclick="clientsComponent.toggleSort('source')" class="sortable">
                                Origem <span class="sort-indicator">↕</span>
                            </th>
                            <th onclick="clientsComponent.toggleSort('created_at')" class="sortable">
                                Data de Cadastro <span class="sort-indicator">↕</span>
                            </th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredClients.map(client => this.renderClientRow(client)).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    toggleSort(column) {
        const currentSort = document.getElementById('sort-by').value;
        let newSort;
        
        if (currentSort === column) {
            newSort = column + '_desc';
        } else if (currentSort === column + '_desc') {
            newSort = column;
        } else {
            newSort = column;
        }
        
        document.getElementById('sort-by').value = newSort;
        this.sortClients();
    }

    // Métodos auxiliares
    formatPhone(phone) {
        if (!phone) return 'N/A';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
        }
        return phone;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR');
        } catch {
            return dateString;
        }
    }

    showLoading() {
        const container = document.getElementById('client-list-container');
        if (container) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Carregando clientes...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        // Loading é removido quando os dados são carregados
    }

    showError(message) {
        const container = document.getElementById('client-list-container');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <h3>Erro</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="clientsComponent.refreshClients()">Tentar novamente</button>
                </div>
            `;
        }
    }

    showSuccess(message) {
        // Implementar toast ou notificação
        alert(message);
    }

    showProcessing() {
        document.getElementById('upload-status').style.display = 'block';
    }

    hideProcessing() {
        document.getElementById('upload-status').style.display = 'none';
    }

    updateUI() {
        const container = document.querySelector('.clients-container');
        if (container) {
            container.innerHTML = this.render();
            this.attachEventListeners();
        }
    }

    attachEventListeners() {
        // Upload handlers
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileSelect(files[0]);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files[0]);
            });
        }

        // Event listeners para filtros
        const searchInput = document.getElementById('client-search');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.filterClients();
                }
            });
        }
    }

    // Métodos de ação
    async viewClient(clientId) {
        console.log('Visualizar cliente:', clientId);
        // Implementar modal de detalhes do cliente
    }

    async deleteClient(clientId) {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                await this.apiService.request(`/clients/${clientId}`, {
                    method: 'DELETE'
                });
                this.showSuccess('Cliente excluído com sucesso');
                await this.loadClients();
            } catch (error) {
                this.showError('Erro ao excluir cliente');
            }
        }
    }

    // Inicialização
    init(container) {
        this.container = container;
        this.filteredClients = null;
        container.innerHTML = this.render();
        this.attachEventListeners();
        this.loadClients();
    }
}

// CSS para o componente de clientes
const clientsCSS = `}]}
    .clients-container {
        max-width: 100%;
        margin: 0 auto;
        padding: 20px;
    }

    .clients-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 10px;
        margin-bottom: 30px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .clients-header h2 {
        margin: 0 0 10px 0;
        font-size: 2.5em;
        font-weight: 300;
    }

    .clients-header p {
        margin: 0;
        opacity: 0.9;
        font-size: 1.1em;
    }

    .clients-tabs {
        display: flex;
        margin-bottom: 30px;
        border-bottom: 2px solid #e0e0e0;
    }

    .tab-button {
        padding: 15px 30px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        color: #666;
        transition: all 0.3s ease;
        border-bottom: 3px solid transparent;
    }

    .tab-button.active {
        color: #667eea;
        border-bottom-color: #667eea;
        font-weight: 600;
    }

    .stats-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
    }

    .stat-card {
        background: white;
        padding: 25px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-align: center;
    }

    .stat-card h3 {
        font-size: 2em;
        font-weight: bold;
        color: #667eea;
        margin-bottom: 4px;
    }

    .stat-card p {
        color: #666;
        font-size: 0.875em;
    }

    .filter-toolbar {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
        align-items: center;
    }

    .toolbar-section {
        display: flex;
        gap: 10px;
        align-items: center;
    }

    .search-group {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .filter-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .filter-group label {
        font-size: 12px;
        font-weight: 600;
        color: #666;
    }

    .search-input, .filter-select {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.3s ease;
    }

    .search-input:focus, .filter-select:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }

    .results-info {
        background: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 15px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        font-size: 14px;
        color: #666;
    }

    .client-table {
        width: 100%;
        background: white;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border-collapse: collapse;
    }

    .client-table th,
    .client-table td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    .client-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #333;
    }

    .client-table th.sortable {
        cursor: pointer;
        user-select: none;
        transition: background-color 0.2s;
    }

    .client-table th.sortable:hover {
        background: #e9ecef;
    }

    .sort-indicator {
        margin-left: 5px;
        opacity: 0.5;
        font-size: 12px;
    }

    .client-table tr:hover {
        background: #f8f9fa;
    }

    .badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.75em;
        font-weight: 500;
    }

    .badge-excel {
        background: #dbeafe;
        color: #1e40af;
    }

    .badge-manual {
        background: #dcfce7;
        color: #166534;
    }

    .empty-state, .loading-state, .error-state {
        background: white;
        padding: 60px 20px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-align: center;
    }

    .empty-state h3, .error-state h3 {
        margin: 0 0 10px 0;
        color: #333;
    }

    .empty-state p, .error-state p {
        margin: 0 0 20px 0;
        color: #666;
    }

    .upload-section {
        max-width: 600px;
        margin: 0 auto;
    }

    .upload-card {
        background: white;
        padding: 40px;
        border-radius: 10px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .upload-area {
        border: 2px dashed #ddd;
        border-radius: 10px;
        padding: 60px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 20px;
    }

    .upload-area:hover,
    .upload-area.dragover {
        border-color: #667eea;
        background: #f8f9fa;
    }

    .upload-icon {
        font-size: 48px;
        color: #667eea;
        margin-bottom: 15px;
    }

    .validation-summary {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 16px 0;
    }

    .validation-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-top: 12px;
    }

    .stat {
        text-align: center;
    }

    .stat .number {
        display: block;
        font-size: 1.5em;
        font-weight: bold;
        color: #1f2937;
    }

    .stat .label {
        font-size: 0.875em;
        color: #6b7280;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .btn {
        padding: 12px 24px;
        border: none;
        border-radius: 25px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-block;
        text-align: center;
    }

    .btn-primary {
        background: #667eea;
        color: white;
    }

    .btn-primary:hover {
        background: #5a6fd8;
        transform: translateY(-1px);
    }

    .btn-secondary {
        background: #6c757d;
        color: white;
    }

    .btn-secondary:hover {
        background: #5a6268;
    }

    .btn-danger {
        background: #dc3545;
        color: white;
        padding: 8px 16px;
        font-size: 12px;
    }

    .btn-danger:hover {
        background: #c82333;
    }

    .btn-sm {
        padding: 8px 16px;
        font-size: 12px;
    }

    .btn-icon {
        padding: 8px;
        border-radius: 50%;
        font-size: 14px;
        width: 36px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .duplicate-item {
        padding: 10px;
        border-bottom: 1px solid #eee;
        font-size: 14px;
    }

    .duplicate-reason {
        color: #dc3545;
        font-size: 12px;
    }

    @media (max-width: 768px) {
        .clients-container {
            padding: 10px;
        }

        .clients-header {
            padding: 20px;
        }

        .clients-header h2 {
            font-size: 2em;
        }

        .clients-tabs {
            flex-direction: column;
        }

        .tab-button {
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
            border-radius: 0;
        }

        .filter-toolbar {
            flex-direction: column;
            align-items: stretch;
        }

        .toolbar-section {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
        }

        .search-group {
            width: 100%;
        }

        .filter-group {
            width: 100%;
        }

        .stats-cards {
            grid-template-columns: 1fr;
        }

        .client-table {
            font-size: 14px;
            overflow-x: auto;
            display: block;
        }

        .client-table th,
        .client-table td {
            padding: 10px;
            min-width: 120px;
            white-space: nowrap;
        }

        .upload-card {
            padding: 20px;
        }

        .upload-area {
            padding: 30px;
        }
    }
`;

// Adicionar CSS ao documento
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = clientsCSS;
    document.head.appendChild(style);
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ClientsComponent = ClientsComponent;
}