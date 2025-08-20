// Módulo Excel - Upload e processamento de arquivos Excel

class ExcelModule {
    constructor() {
        this.uploadedFile = null;
        this.processedData = null;
        this.isProcessing = false;
        this.uploadProgress = 0;
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">📁</span>
                    <h2 class="module-title">Upload de Excel</h2>
                </div>
                
                <!-- Área de Upload -->
                <div class="card">
                    <h3>📤 Fazer Upload do Arquivo Excel</h3>
                    <p class="upload-description">
                        Arraste e solte seu arquivo Excel aqui ou clique para selecionar. 
                        Formatos suportados: .xlsx, .xls
                    </p>
                    
                    <div class="upload-area" id="upload-area">
                        <div class="upload-content">
                            <div class="upload-icon">📁</div>
                            <h4>Arraste seu arquivo Excel aqui</h4>
                            <p>ou clique para selecionar</p>
                            <input type="file" id="file-input" accept=".xlsx,.xls" class="file-input" />
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="upload-progress hidden" id="upload-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <p class="progress-text" id="progress-text">Processando...</p>
                    </div>
                </div>
                
                <!-- Configurações de Processamento -->
                <div class="card" id="processing-options" style="display: none;">
                    <h3>⚙️ Configurações de Processamento</h3>
                    
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label class="form-label">Planilha (Sheet):</label>
                            <select class="form-input" id="sheet-select">
                                <option value="">Selecione uma planilha</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Linha de Cabeçalho:</label>
                            <input type="number" class="form-input" id="header-row" value="1" min="1" />
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Coluna do Nome:</label>
                            <select class="form-input" id="name-column">
                                <option value="">Selecione a coluna</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Coluna do Telefone:</label>
                            <select class="form-input" id="phone-column">
                                <option value="">Selecione a coluna</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Mapeamento de Colunas:</label>
                        <div class="column-mapping" id="column-mapping">
                            <!-- Mapeamento será gerado dinamicamente -->
                        </div>
                    </div>
                    
                    <div class="processing-actions">
                        <button class="btn btn-primary" id="process-btn" onclick="this.processExcel()">
                            🔄 Processar Dados
                        </button>
                        <button class="btn btn-secondary" onclick="this.resetUpload()">
                            🔄 Novo Upload
                        </button>
                    </div>
                </div>
                
                <!-- Preview dos Dados -->
                <div class="card" id="data-preview" style="display: none;">
                    <h3>👀 Preview dos Dados</h3>
                    <div class="preview-controls">
                        <div class="preview-info">
                            <span id="preview-count">0</span> registros encontrados
                        </div>
                        <div class="preview-actions">
                            <button class="btn btn-success" onclick="this.importData()">
                                ✅ Importar Todos
                            </button>
                            <button class="btn btn-secondary" onclick="this.exportPreview()">
                                📥 Exportar Preview
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="data-table" id="preview-table">
                            <thead>
                                <tr id="table-header">
                                    <!-- Cabeçalhos serão gerados dinamicamente -->
                                </tr>
                            </thead>
                            <tbody id="table-body">
                                <!-- Dados serão gerados dinamicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Histórico de Uploads -->
                <div class="card">
                    <h3>📋 Histórico de Uploads</h3>
                    <div class="upload-history" id="upload-history">
                        ${this.renderUploadHistory()}
                    </div>
                </div>
                
                <!-- Instruções -->
                <div class="card">
                    <h3>📖 Instruções</h3>
                    <div class="instructions">
                        <div class="instruction-item">
                            <h4>📋 Formato do Arquivo</h4>
                            <ul>
                                <li>Arquivo deve estar em formato Excel (.xlsx ou .xls)</li>
                                <li>Primeira linha deve conter os cabeçalhos das colunas</li>
                                <li>Dados devem começar na segunda linha</li>
                                <li>Telefones devem estar no formato: (11) 99999-9999</li>
                            </ul>
                        </div>
                        
                        <div class="instruction-item">
                            <h4>🔧 Colunas Obrigatórias</h4>
                            <ul>
                                <li><strong>Nome:</strong> Nome completo do contato</li>
                                <li><strong>Telefone:</strong> Número de telefone com DDD</li>
                                <li><strong>Email:</strong> Endereço de email (opcional)</li>
                                <li><strong>Empresa:</strong> Nome da empresa (opcional)</li>
                            </ul>
                        </div>
                        
                        <div class="instruction-item">
                            <h4>⚠️ Limitações</h4>
                            <ul>
                                <li>Máximo de 10.000 registros por upload</li>
                                <li>Tamanho máximo do arquivo: 10MB</li>
                                <li>Processamento pode levar alguns minutos</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderUploadHistory() {
        const history = this.getUploadHistory();
        
        if (history.length === 0) {
            return '<p class="no-history">Nenhum upload realizado ainda</p>';
        }

        return history.map(upload => `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-file">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${upload.filename}</span>
                    </div>
                    <div class="history-details">
                        <span class="upload-date">${upload.date}</span>
                        <span class="upload-status ${upload.status}">${upload.statusText}</span>
                        <span class="upload-count">${upload.records} registros</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-sm btn-secondary" onclick="this.downloadFile('${upload.id}')">
                        📥 Download
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="this.deleteUpload('${upload.id}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    init() {
        this.setupEventListeners();
        this.loadUploadHistory();
    }

    destroy() {
        // Limpa event listeners se necessário
    }

    setupEventListeners() {
        // Aguarda o DOM estar pronto
        setTimeout(() => {
            this.setupFileUpload();
            this.setupDragAndDrop();
        }, 100);
    }

    setupFileUpload() {
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');
        
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileSelect(file);
                }
            });
        }
        
        if (uploadArea) {
            uploadArea.addEventListener('click', () => {
                fileInput?.click();
            });
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('upload-area');
        
        if (!uploadArea) return;
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    async handleFileSelect(file) {
        // Valida o arquivo
        if (!this.validateFile(file)) {
            return;
        }
        
        this.uploadedFile = file;
        this.showProcessingOptions();
        
        try {
            // Simula leitura do arquivo
            await this.readExcelFile(file);
        } catch (error) {
            this.showError('Erro ao ler arquivo: ' + error.message);
        }
    }

    validateFile(file) {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        
        const allowedExtensions = ['.xlsx', '.xls'];
        
        if (!allowedTypes.includes(file.type) && 
            !allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
            this.showError('Tipo de arquivo não suportado. Use arquivos Excel (.xlsx ou .xls)');
            return false;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB
            this.showError('Arquivo muito grande. Tamanho máximo: 10MB');
            return false;
        }
        
        return true;
    }

    async readExcelFile(file) {
        this.showProgress();
        
        try {
            // Simula processamento do arquivo
            await this.simulateFileProcessing();
            
            // Dados mock para demonstração
            this.processedData = {
                sheets: ['Planilha1', 'Planilha2'],
                headers: ['Nome', 'Telefone', 'Email', 'Empresa', 'Cargo'],
                data: [
                    ['João Silva', '(11) 99999-9999', 'joao@email.com', 'Empresa A', 'Gerente'],
                    ['Maria Santos', '(11) 88888-8888', 'maria@email.com', 'Empresa B', 'Analista'],
                    ['Pedro Costa', '(11) 77777-7777', 'pedro@email.com', 'Empresa C', 'Diretor'],
                    ['Ana Oliveira', '(11) 66666-6666', 'ana@email.com', 'Empresa D', 'Coordenadora'],
                    ['Carlos Lima', '(11) 55555-5555', 'carlos@email.com', 'Empresa E', 'Supervisor']
                ]
            };
            
            this.populateProcessingOptions();
            this.hideProgress();
            
        } catch (error) {
            this.hideProgress();
            throw error;
        }
    }

    async simulateFileProcessing() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                this.updateProgress(progress);
            }, 200);
        });
    }

    showProgress() {
        const progress = document.getElementById('upload-progress');
        if (progress) {
            progress.classList.remove('hidden');
        }
    }

    hideProgress() {
        const progress = document.getElementById('upload-progress');
        if (progress) {
            progress.classList.add('hidden');
        }
    }

    updateProgress(percent) {
        this.uploadProgress = percent;
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Processando... ${Math.round(percent)}%`;
        }
    }

    showProcessingOptions() {
        const options = document.getElementById('processing-options');
        if (options) {
            options.style.display = 'block';
        }
    }

    populateProcessingOptions() {
        if (!this.processedData) return;
        
        // Popula seleção de planilhas
        const sheetSelect = document.getElementById('sheet-select');
        if (sheetSelect) {
            sheetSelect.innerHTML = '<option value="">Selecione uma planilha</option>' +
                this.processedData.sheets.map(sheet => 
                    `<option value="${sheet}">${sheet}</option>`
                ).join('');
        }
        
        // Popula seleção de colunas
        const nameColumn = document.getElementById('name-column');
        const phoneColumn = document.getElementById('phone-column');
        
        if (nameColumn && phoneColumn) {
            const options = this.processedData.headers.map((header, index) => 
                `<option value="${index}">${header}</option>`
            ).join('');
            
            nameColumn.innerHTML = '<option value="">Selecione a coluna</option>' + options;
            phoneColumn.innerHTML = '<option value="">Selecione a coluna</option>' + options;
        }
        
        // Gera mapeamento de colunas
        this.generateColumnMapping();
    }

    generateColumnMapping() {
        const mappingContainer = document.getElementById('column-mapping');
        if (!mappingContainer || !this.processedData) return;
        
        mappingContainer.innerHTML = this.processedData.headers.map((header, index) => `
            <div class="mapping-item">
                <label class="mapping-label">${header}:</label>
                <select class="mapping-select" data-column="${index}">
                    <option value="">Não mapear</option>
                    <option value="name">Nome</option>
                    <option value="phone">Telefone</option>
                    <option value="email">Email</option>
                    <option value="company">Empresa</option>
                    <option value="position">Cargo</option>
                </select>
            </div>
        `).join('');
    }

    async processExcel() {
        if (!this.processedData) {
            this.showError('Nenhum arquivo carregado');
            return;
        }
        
        this.isProcessing = true;
        this.showProgress();
        
        try {
            // Simula processamento
            await this.simulateDataProcessing();
            
            this.showDataPreview();
            this.hideProgress();
            this.isProcessing = false;
            
        } catch (error) {
            this.hideProgress();
            this.isProcessing = false;
            this.showError('Erro ao processar dados: ' + error.message);
        }
    }

    async simulateDataProcessing() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                this.updateProgress(progress);
            }, 150);
        });
    }

    showDataPreview() {
        const preview = document.getElementById('data-preview');
        if (preview) {
            preview.style.display = 'block';
            this.populatePreviewTable();
        }
    }

    populatePreviewTable() {
        if (!this.processedData) return;
        
        // Popula cabeçalho
        const tableHeader = document.getElementById('table-header');
        if (tableHeader) {
            tableHeader.innerHTML = this.processedData.headers.map(header => 
                `<th>${header}</th>`
            ).join('');
        }
        
        // Popula dados
        const tableBody = document.getElementById('table-body');
        if (tableBody) {
            tableBody.innerHTML = this.processedData.data.map(row => 
                `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
            ).join('');
        }
        
        // Atualiza contador
        const previewCount = document.getElementById('preview-count');
        if (previewCount) {
            previewCount.textContent = this.processedData.data.length;
        }
    }

    async importData() {
        if (!this.processedData) return;
        
        try {
            this.showProgress();
            
            // Simula importação
            await this.simulateImport();
            
            this.hideProgress();
            this.showSuccess(`✅ ${this.processedData.data.length} registros importados com sucesso!`);
            
            // Adiciona ao histórico
            this.addToHistory({
                filename: this.uploadedFile.name,
                records: this.processedData.data.length,
                status: 'success',
                statusText: 'Importado'
            });
            
        } catch (error) {
            this.hideProgress();
            this.showError('Erro ao importar dados: ' + error.message);
        }
    }

    async simulateImport() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 25;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                this.updateProgress(progress);
            }, 100);
        });
    }

    resetUpload() {
        this.uploadedFile = null;
        this.processedData = null;
        this.isProcessing = false;
        this.uploadProgress = 0;
        
        // Limpa campos
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        
        // Esconde seções
        const options = document.getElementById('processing-options');
        const preview = document.getElementById('data-preview');
        
        if (options) options.style.display = 'none';
        if (preview) preview.style.display = 'none';
        
        // Remove classes
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) uploadArea.classList.remove('drag-over');
    }

    exportPreview() {
        if (!this.processedData) return;
        
        // Cria CSV
        const csv = this.convertToCSV();
        this.downloadCSV(csv, 'preview_dados.csv');
    }

    convertToCSV() {
        if (!this.processedData) return '';
        
        const headers = this.processedData.headers.join(',');
        const rows = this.processedData.data.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        return `${headers}\n${rows}`;
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

    getUploadHistory() {
        const history = localStorage.getItem('sacsmax_upload_history');
        return history ? JSON.parse(history) : [];
    }

    addToHistory(upload) {
        const history = this.getUploadHistory();
        const newUpload = {
            id: Date.now().toString(),
            date: new Date().toLocaleString('pt-BR'),
            ...upload
        };
        
        history.unshift(newUpload);
        
        // Mantém apenas os últimos 10 uploads
        if (history.length > 10) {
            history.splice(10);
        }
        
        localStorage.setItem('sacsmax_upload_history', JSON.stringify(history));
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyContainer = document.getElementById('upload-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.renderUploadHistory();
        }
    }

    loadUploadHistory() {
        this.updateHistoryDisplay();
    }

    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `<strong>Erro:</strong> ${message}`;
        
        const container = document.querySelector('.module-container');
        if (container) {
            container.insertBefore(alert, container.firstChild);
            
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }
    }

    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `<strong>Sucesso:</strong> ${message}`;
        
        const container = document.querySelector('.module-container');
        if (container) {
            container.insertBefore(alert, container.firstChild);
            
            setTimeout(() => {
                alert.remove();
            }, 5000);
        }
    }
}

// Adiciona estilos específicos do módulo Excel
const excelStyles = `
    .upload-description {
        color: #6c757d;
        margin-bottom: 1.5rem;
    }

    .upload-area {
        border: 3px dashed #dee2e6;
        border-radius: 12px;
        padding: 3rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: #f8f9fa;
    }

    .upload-area:hover,
    .upload-area.drag-over {
        border-color: #667eea;
        background: #f0f4ff;
    }

    .upload-content {
        pointer-events: none;
    }

    .upload-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.6;
    }

    .upload-area h4 {
        margin-bottom: 0.5rem;
        color: #495057;
    }

    .upload-area p {
        color: #6c757d;
        margin: 0;
    }

    .file-input {
        display: none;
    }

    .upload-progress {
        margin-top: 1.5rem;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        width: 0%;
        transition: width 0.3s ease;
    }

    .progress-text {
        text-align: center;
        color: #6c757d;
        margin: 0;
    }

    .column-mapping {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .mapping-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .mapping-label {
        font-weight: 500;
        color: #495057;
    }

    .mapping-select {
        padding: 0.5rem;
        border: 2px solid #e9ecef;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    .processing-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }

    .preview-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .preview-info {
        font-weight: 500;
        color: #495057;
    }

    .preview-actions {
        display: flex;
        gap: 0.5rem;
    }

    .table-container {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #e9ecef;
        border-radius: 8px;
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e9ecef;
    }

    .data-table th {
        background: #f8f9fa;
        font-weight: 600;
        color: #495057;
        position: sticky;
        top: 0;
    }

    .data-table tr:hover {
        background: #f8f9fa;
    }

    .upload-history {
        max-height: 300px;
        overflow-y: auto;
    }

    .history-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 0.5rem;
    }

    .history-info {
        flex: 1;
    }

    .history-file {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }

    .file-icon {
        font-size: 1.2rem;
    }

    .file-name {
        font-weight: 500;
        color: #495057;
    }

    .history-details {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: #6c757d;
    }

    .upload-status {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
    }

    .upload-status.success {
        background: #d4edda;
        color: #155724;
    }

    .upload-status.error {
        background: #f8d7da;
        color: #721c24;
    }

    .history-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
    }

    .no-history {
        text-align: center;
        color: #6c757d;
        font-style: italic;
    }

    .instructions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .instruction-item h4 {
        color: #495057;
        margin-bottom: 1rem;
    }

    .instruction-item ul {
        list-style: none;
        padding: 0;
    }

    .instruction-item li {
        padding: 0.5rem 0;
        border-bottom: 1px solid #e9ecef;
        color: #6c757d;
    }

    .instruction-item li:last-child {
        border-bottom: none;
    }

    .instruction-item li strong {
        color: #495057;
    }
`;

// Adiciona os estilos ao documento
if (!document.getElementById('excel-styles')) {
    const style = document.createElement('style');
    style.id = 'excel-styles';
    style.textContent = excelStyles;
    document.head.appendChild(style);
}

export default ExcelModule;
