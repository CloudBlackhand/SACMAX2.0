/**
 * Serviço Frontend de Verificação de Conectividade
 * Equipe Desktop Internet - Elimina redundâncias e otimiza verificações
 */

class FrontendNetworkService {
    constructor() {
        this.baseURL = window.location.origin;
        this.cache = new Map();
        this.cacheDuration = 5000;
        this.listeners = new Set();
        this.monitoring = false;
        this.monitorInterval = null;
    }

    /**
     * Verifica conectividade com cache otimizado
     */
    async checkConnection() {
        const cacheKey = 'connection_status';
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.cacheDuration)) {
            return cached.data;
        }

        try {
            const response = await fetch('/api/network/status');
            const data = await response.json();
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            const offlineStatus = {
                connected: false,
                successRate: 0,
                overall: {
                    title: "❌ Sem Conexão",
                    message: "Verifique sua conexão com a internet",
                    type: "error"
                },
                troubleshooting: [
                    "Verifique seu cabo de rede ou Wi-Fi",
                    "Reinicie seu modem/roteador",
                    "Contate sua operadora"
                ],
                error: error.message
            };

            this.cache.set(cacheKey, {
                data: offlineStatus,
                timestamp: Date.now()
            });

            return offlineStatus;
        }
    }

    /**
     * Inicia monitoramento em tempo real
     */
    startMonitoring(callback, interval = 10000) {
        if (this.monitoring) return;

        this.monitoring = true;
        this.listeners.add(callback);

        const monitor = async () => {
            try {
                const status = await this.checkConnection();
                
                // Notificar todos os listeners
                this.listeners.forEach(listener => {
                    try {
                        listener(status);
                    } catch (e) {
                        console.error('Erro no listener:', e);
                    }
                });
            } catch (error) {
                console.error('Erro no monitoramento:', error);
            }
        };

        // Executar imediatamente
        monitor();

        // Configurar intervalo
        this.monitorInterval = setInterval(monitor, interval);
    }

    /**
     * Para monitoramento
     */
    stopMonitoring(callback = null) {
        if (callback) {
            this.listeners.delete(callback);
        } else {
            this.listeners.clear();
        }

        if (this.listeners.size === 0 && this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
            this.monitoring = false;
        }
    }

    /**
     * Verifica conexão antes de executar ação
     */
    async checkBeforeAction(actionName = 'ação') {
        const status = await this.checkConnection();
        
        if (!status.connected) {
            throw new Error(`Sem conexão com internet. Não é possível ${actionName}.`);
        }

        if (status.successRate < 50) {
            throw new Error(`Conexão instável. Tente novamente em alguns segundos.`);
        }

        return status;
    }

    /**
     * Exibe notificação visual de status
     */
    showConnectionAlert(status, container = null) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `network-alert network-${status.overall.type}`;
        alertDiv.innerHTML = `
            <div class="network-alert-content">
                <strong>${status.overall.title}</strong>
                <p>${status.overall.message}</p>
                ${status.troubleshooting ? `
                    <div class="network-tips">
                        <strong>Dicas de solução:</strong>
                        <ul>
                            ${status.troubleshooting.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <button class="network-alert-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Estilos CSS para o alerta
        if (!document.getElementById('network-alert-styles')) {
            const style = document.createElement('style');
            style.id = 'network-alert-styles';
            style.textContent = `
                .network-alert {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 400px;
                    z-index: 10000;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease-out;
                }
                
                .network-success {
                    background: #d4edda;
                    border: 1px solid #c3e6cb;
                    color: #155724;
                }
                
                .network-warning {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                }
                
                .network-error {
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    color: #721c24;
                }
                
                .network-alert-content {
                    padding: 15px;
                    position: relative;
                }
                
                .network-alert-close {
                    position: absolute;
                    top: 5px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: inherit;
                }
                
                .network-tips {
                    margin-top: 10px;
                    font-size: 0.9em;
                }
                
                .network-tips ul {
                    margin: 5px 0 0 20px;
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
            document.head.appendChild(style);
        }

        const targetContainer = container || document.body;
        targetContainer.appendChild(alertDiv);

        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 10000);

        return alertDiv;
    }

    /**
     * Integração com templates - verifica antes de carregar
     */
    async loadTemplateWithCheck(url, templateName = 'template') {
        await this.checkBeforeAction(`carregar ${templateName}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao carregar ${templateName}: ${response.statusText}`);
        }
        
        return response.json();
    }

    /**
     * Verifica antes de envio em massa
     */
    async validateMassSend(contacts) {
        const status = await this.checkBeforeAction('enviar mensagens em massa');
        
        if (!contacts || contacts.length === 0) {
            throw new Error('Nenhum contato selecionado');
        }

        if (contacts.length > 100 && status.successRate < 80) {
            throw new Error('Conexão instável para envio em massa. Reduza o número de contatos.');
        }

        return status;
    }

    /**
     * Retorna indicador visual de status
     */
    getConnectionIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'connection-indicator';
        indicator.innerHTML = `
            <span class="connection-status">Verificando...</span>
            <div class="connection-spinner"></div>
        `;

        // Estilos
        const style = document.createElement('style');
        style.textContent = `
            .connection-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .connection-indicator.online {
                background: #d4edda;
                color: #155724;
            }
            
            .connection-indicator.offline {
                background: #f8d7da;
                color: #721c24;
            }
            
            .connection-indicator.warning {
                background: #fff3cd;
                color: #856404;
            }
            
            .connection-spinner {
                width: 12px;
                height: 12px;
                border: 2px solid #ccc;
                border-top: 2px solid #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .connection-indicator.online .connection-spinner,
            .connection-indicator.offline .connection-spinner {
                display: none;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;

        if (!document.querySelector('#connection-indicator-styles')) {
            style.id = 'connection-indicator-styles';
            document.head.appendChild(style);
        }

        // Atualizar com status real
        this.checkConnection().then(status => {
            this.updateConnectionIndicator(indicator, status);
        });

        // Monitorar mudanças
        this.startMonitoring(status => {
            this.updateConnectionIndicator(indicator, status);
        }, 30000); // Atualizar a cada 30 segundos

        return indicator;
    }

    updateConnectionIndicator(indicator, status) {
        const statusEl = indicator.querySelector('.connection-status');
        const spinner = indicator.querySelector('.connection-spinner');

        if (status.connected && status.successRate >= 80) {
            indicator.className = 'connection-indicator online';
            statusEl.textContent = 'Online';
        } else if (status.connected && status.successRate >= 50) {
            indicator.className = 'connection-indicator warning';
            statusEl.textContent = 'Conexão instável';
        } else {
            indicator.className = 'connection-indicator offline';
            statusEl.textContent = 'Offline';
        }
    }
}

// Instância global do serviço
window.networkService = new FrontendNetworkService();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendNetworkService;
}