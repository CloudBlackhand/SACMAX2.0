class CacheInterface {
    constructor() {
        this.apiUrl = '/api/cache';
        this.init();
    }

    init() {
        this.createInterface();
        this.loadStats();
    }

    createInterface() {
        const container = document.createElement('div');
        container.id = 'cache-interface';
        container.innerHTML = `
            <div class="cache-panel">
                <h3>Gerenciamento de Cache</h3>
                <div class="cache-stats" id="cache-stats">
                    <div class="loading">Carregando estatísticas...</div>
                </div>
                <div class="cache-actions">
                    <button id="clear-cache-btn" class="btn btn-danger">
                        <i class="fas fa-trash"></i> Limpar Cache
                    </button>
                    <button id="refresh-stats-btn" class="btn btn-secondary">
                        <i class="fas fa-sync"></i> Atualizar
                    </button>
                </div>
                <div id="cache-message" class="cache-message"></div>
            </div>
        `;

        // Adicionar CSS
        if (!document.getElementById('cache-styles')) {
            const style = document.createElement('style');
            style.id = 'cache-styles';
            style.textContent = `
                .cache-panel {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .cache-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .stat-card {
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    text-align: center;
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                }
                .stat-label {
                    font-size: 14px;
                    color: #6c757d;
                }
                .cache-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .cache-message {
                    margin-top: 15px;
                    padding: 10px;
                    border-radius: 4px;
                    display: none;
                }
                .cache-message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .cache-message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                }
                .btn-danger {
                    background: #dc3545;
                    color: white;
                }
                .btn-danger:hover {
                    background: #c82333;
                }
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                .btn-secondary:hover {
                    background: #5a6268;
                }
                .loading {
                    text-align: center;
                    color: #6c757d;
                }
            `;
            document.head.appendChild(style);
        }

        // Adicionar ao container principal
        const mainContainer = document.querySelector('.main-container') || document.body;
        mainContainer.appendChild(container);

        // Event listeners
        document.getElementById('clear-cache-btn').addEventListener('click', () => this.clearCache());
        document.getElementById('refresh-stats-btn').addEventListener('click', () => this.loadStats());
    }

    async loadStats() {
        const statsContainer = document.getElementById('cache-stats');
        const messageContainer = document.getElementById('cache-message');
        
        try {
            statsContainer.innerHTML = '<div class="loading">Carregando...</div>';
            
            const response = await fetch(this.apiUrl + '/stats');
            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                statsContainer.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalFiles}</div>
                        <div class="stat-label">Arquivos em Cache</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalSizeFormatted}</div>
                        <div class="stat-label">Tamanho Total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.usagePercentage}%</div>
                        <div class="stat-label">Uso do Cache</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.maxSizeFormatted}</div>
                        <div class="stat-label">Limite Máximo</div>
                    </div>
                `;
            } else {
                throw new Error(data.error || 'Erro ao carregar estatísticas');
            }
        } catch (error) {
            statsContainer.innerHTML = `<div class="error">Erro: ${error.message}</div>`;
        }
    }

    async clearCache() {
        const button = document.getElementById('clear-cache-btn');
        const messageContainer = document.getElementById('cache-message');
        
        if (!confirm('Tem certeza que deseja limpar todo o cache?')) return;
        
        try {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Limpando...';
            
            const response = await fetch(this.apiUrl + '/clear', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('adminToken') || ''),
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage(data.message, 'success');
                this.loadStats();
            } else {
                this.showMessage(data.error || 'Erro ao limpar cache', 'error');
            }
        } catch (error) {
            this.showMessage('Erro de conexão: ' + error.message, 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-trash"></i> Limpar Cache';
        }
    }

    showMessage(message, type) {
        const messageContainer = document.getElementById('cache-message');
        messageContainer.textContent = message;
        messageContainer.className = `cache-message ${type}`;
        messageContainer.style.display = 'block';
        
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

// Inicializar quando o DOM estiver pronto
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.cacheInterface = new CacheInterface();
        });
    } else {
        window.cacheInterface = new CacheInterface();
    }
}

module.exports = CacheInterface;