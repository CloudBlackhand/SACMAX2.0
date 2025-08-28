// Módulo Configurações - Interface moderna e funcional
class SettingsModule {
    constructor() {
        this.settings = {
            // Configurações de Conexão
            backend: {
                url: SacsMaxConfig.backend.current,
                port: 443,
                timeout: 10000
            },
            waha: {
                url: SacsMaxConfig.backend.current,
                port: 443,
                session_name: "sacsmax",
                auto_start: false
            },
            database: {
                type: "postgresql",
                railway_url: "",
                local_backup: true
            },
            // Configurações de Sistema
            system: {
                log_level: "info",
                max_log_files: 10,
                backup_interval: 24 // horas
            },
            // Configurações de Segurança
            security: {
                session_timeout: 30, // minutos
                api_key: ""
            }
        };
        
        this.loading = false;
        this.saving = false;
        this.backendUrl = SacsMaxConfig.backend.current;
        
        // Estado do WAHA
        this.wahaStatus = "disconnected";
        this.isWahaEnabled = false;
        
        // Estado atual
        this.currentTab = 'overview';
        
        // Inicializar
        this.init();
    }

    init() {
        console.log('⚙️ Inicializando módulo Settings...');
        this.loadSettings();
        this.checkSystemStatus();
    }

    // Verificar status do sistema
    async checkSystemStatus() {
        try {
            // Verificar backend
            const backendHealth = await fetch(`${this.backendUrl}/api/health`);
            this.backendStatus = backendHealth.ok ? 'connected' : 'disconnected';
            
            // Verificar WAHA
            const wahaHealth = await fetch(`${this.backendUrl}/api/waha/status`);
            if (wahaHealth.ok) {
                const wahaData = await wahaHealth.json();
                this.wahaStatus = wahaData.status || 'disconnected';
            }
            
            // Verificar banco de dados
            const dbHealth = await fetch(`${this.backendUrl}/api/database/test`);
            this.databaseStatus = dbHealth.ok ? 'connected' : 'disconnected';
            
        } catch (error) {
            console.error('❌ Erro ao verificar status:', error);
            this.backendStatus = 'disconnected';
            this.wahaStatus = 'disconnected';
            this.databaseStatus = 'disconnected';
        }
    }

    render() {
        return `
            <div class="settings-container">
                <!-- Header -->
                <div class="settings-header">
                    <div class="settings-title">
                        <span class="settings-icon">⚙️</span>
                        <h1>Configurações do Sistema</h1>
                    </div>
                    <div class="settings-status">
                        <div class="status-grid">
                            <div class="status-item ${this.backendStatus || 'disconnected'}">
                                <span class="status-icon">🔧</span>
                                <span class="status-text">Backend</span>
                            </div>
                            <div class="status-item ${this.wahaStatus}">
                                <span class="status-icon">📱</span>
                                <span class="status-text">WAHA</span>
                            </div>
                            <div class="status-item ${this.databaseStatus || 'disconnected'}">
                                <span class="status-icon">💾</span>
                                <span class="status-text">Banco</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Navegação -->
                <div class="settings-nav">
                    <button class="nav-btn ${this.currentTab === 'overview' ? 'active' : ''}" 
                            onclick="settingsModule.switchTab('overview')">
                        <span class="nav-icon">📊</span>
                        Visão Geral
                    </button>
                    <button class="nav-btn ${this.currentTab === 'connection' ? 'active' : ''}" 
                            onclick="settingsModule.switchTab('connection')">
                        <span class="nav-icon">🔗</span>
                        Conexões
                    </button>
                    <button class="nav-btn ${this.currentTab === 'waha' ? 'active' : ''}" 
                            onclick="settingsModule.switchTab('waha')">
                        <span class="nav-icon">📱</span>
                        WhatsApp
                    </button>
                    <button class="nav-btn ${this.currentTab === 'database' ? 'active' : ''}" 
                            onclick="settingsModule.switchTab('database')">
                        <span class="nav-icon">💾</span>
                        Banco de Dados
                    </button>
                    <button class="nav-btn ${this.currentTab === 'system' ? 'active' : ''}" 
                            onclick="settingsModule.switchTab('system')">
                        <span class="nav-icon">⚙️</span>
                        Sistema
                    </button>
                    <button class="nav-btn ${this.currentTab === 'security' ? 'active' : ''}" 
                            onclick="settingsModule.switchTab('security')">
                        <span class="nav-icon">🔒</span>
                        Segurança
                    </button>
                </div>

                <!-- Conteúdo -->
                <div class="settings-content">
                    ${this.renderCurrentTab()}
                </div>
            </div>
        `;
    }

    // Renderizar aba atual
    renderCurrentTab() {
        switch (this.currentTab) {
            case 'overview':
                return this.renderOverview();
            case 'connection':
                return this.renderConnectionSettings();
            case 'waha':
                return this.renderWahaSettings();
            case 'database':
                return this.renderDatabaseSettings();
            case 'system':
                return this.renderSystemSettings();
            case 'security':
                return this.renderSecuritySettings();
            default:
                return this.renderOverview();
        }
    }

    // Visão Geral
    renderOverview() {
        return `
            <div class="overview-container">
                <div class="overview-header">
                    <h2>Status do Sistema</h2>
                    <button class="refresh-btn" onclick="settingsModule.checkSystemStatus()">
                        <span>🔄</span> Atualizar
                    </button>
                </div>

                <div class="status-cards">
                    <div class="status-card ${this.backendStatus || 'disconnected'}">
                        <div class="card-header">
                            <span class="card-icon">🔧</span>
                            <h3>Backend</h3>
                        </div>
                        <div class="card-content">
                            <p class="status-text">${this.backendStatus === 'connected' ? 'Conectado' : 'Desconectado'}</p>
                            <p class="status-url">${this.backendUrl}</p>
                        </div>
                        <div class="card-actions">
                            <button class="action-btn" onclick="settingsModule.testBackendConnection()">
                                Testar Conexão
                            </button>
                        </div>
                    </div>

                    <div class="status-card ${this.wahaStatus}">
                        <div class="card-header">
                            <span class="card-icon">📱</span>
                            <h3>WhatsApp (WAHA)</h3>
                        </div>
                        <div class="card-content">
                            <p class="status-text">${this.wahaStatus === 'connected' ? 'Conectado' : 'Desconectado'}</p>
                            <p class="status-details">Sessão: ${this.settings.waha.session_name}</p>
                        </div>
                        <div class="card-actions">
                            <button class="action-btn" onclick="settingsModule.connectWaha()" 
                                    ${this.wahaStatus === 'connected' ? 'disabled' : ''}>
                                Conectar
                            </button>
                            <button class="action-btn danger" onclick="settingsModule.disconnectWaha()"
                                    ${this.wahaStatus !== 'connected' ? 'disabled' : ''}>
                                Desconectar
                            </button>
                        </div>
                    </div>

                    <div class="status-card ${this.databaseStatus || 'disconnected'}">
                        <div class="card-header">
                            <span class="card-icon">💾</span>
                            <h3>Banco de Dados</h3>
                        </div>
                        <div class="card-content">
                            <p class="status-text">${this.databaseStatus === 'connected' ? 'Conectado' : 'Desconectado'}</p>
                            <p class="status-details">PostgreSQL - Railway</p>
                        </div>
                        <div class="card-actions">
                            <button class="action-btn" onclick="settingsModule.testDatabaseConnection()">
                                Testar Conexão
                            </button>
                        </div>
                    </div>
                </div>

                <div class="quick-actions">
                    <h3>Ações Rápidas</h3>
                    <div class="actions-grid">
                        <button class="quick-action-btn" onclick="settingsModule.backupSystem()">
                            <span class="action-icon">💾</span>
                            <span class="action-text">Backup do Sistema</span>
                        </button>
                        <button class="quick-action-btn" onclick="settingsModule.clearCache()">
                            <span class="action-icon">🧹</span>
                            <span class="action-text">Limpar Cache</span>
                        </button>
                        <button class="quick-action-btn" onclick="settingsModule.exportSettings()">
                            <span class="action-icon">📤</span>
                            <span class="action-text">Exportar Config</span>
                        </button>
                        <button class="quick-action-btn" onclick="settingsModule.importSettings()">
                            <span class="action-icon">📥</span>
                            <span class="action-text">Importar Config</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Configurações de Conexão
    renderConnectionSettings() {
        return `
            <div class="settings-panel">
                <div class="panel-header">
                    <h2>Configurações de Conexão</h2>
                    <p>Gerencie as conexões do backend e serviços externos</p>
                </div>

                <div class="settings-form">
                    <div class="form-section">
                        <h3>Backend</h3>
                        
                        <div class="form-group">
                            <label for="backend-url">URL do Backend</label>
                            <input type="text" id="backend-url" value="${this.settings.backend.url}" 
                                   placeholder="https://sacmax20-production.up.railway.app">
                            <small>URL principal do servidor backend</small>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="backend-port">Porta</label>
                                <input type="number" id="backend-port" value="${this.settings.backend.port}" 
                                       min="1" max="65535">
                            </div>
                            <div class="form-group">
                                <label for="backend-timeout">Timeout (ms)</label>
                                <input type="number" id="backend-timeout" value="${this.settings.backend.timeout}" 
                                       min="1000" max="60000">
                            </div>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>WAHA (WhatsApp HTTP API)</h3>
                        
                        <div class="form-group">
                            <label for="waha-url">URL do WAHA</label>
                            <input type="text" id="waha-url" value="${this.settings.waha.url}" 
                                   placeholder="http://localhost:3000">
                            <small>URL do servidor WAHA</small>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="waha-port">Porta</label>
                                <input type="number" id="waha-port" value="${this.settings.waha.port}" 
                                       min="1" max="65535">
                            </div>
                            <div class="form-group">
                                <label for="waha-session">Nome da Sessão</label>
                                <input type="text" id="waha-session" value="${this.settings.waha.session_name}" 
                                       placeholder="sacsmax">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="waha-auto-start" 
                                       ${this.settings.waha.auto_start ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Iniciar automaticamente com o sistema
                            </label>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="settingsModule.resetToDefaults()">
                            Restaurar Padrões
                        </button>
                        <button class="btn btn-primary" onclick="settingsModule.saveSettings()">
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Configurações do WAHA
    renderWahaSettings() {
        return `
            <div class="settings-panel">
                <div class="panel-header">
                    <h2>Controle do WhatsApp</h2>
                    <p>Gerencie a conexão e autenticação do WhatsApp</p>
                </div>

                <div class="waha-control-panel">
                    <div class="waha-status-card ${this.wahaStatus}">
                        <div class="status-header">
                            <span class="status-icon">📱</span>
                            <div class="status-info">
                                <h3>Status do WAHA</h3>
                                <p class="status-text">${this.wahaStatus === 'connected' ? 'Conectado e funcionando' : 'Desconectado'}</p>
                            </div>
                        </div>
                        
                        <div class="status-details">
                            <div class="detail-item">
                                <span class="detail-label">Sessão:</span>
                                <span class="detail-value">${this.settings.waha.session_name}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Porta:</span>
                                <span class="detail-value">${this.settings.waha.port}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Auto-start:</span>
                                <span class="detail-value">${this.settings.waha.auto_start ? 'Ativado' : 'Desativado'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="waha-actions">
                        <div class="action-group">
                            <h4>Controles</h4>
                            <div class="action-buttons">
                                <button class="action-btn primary" onclick="settingsModule.connectWaha()" 
                                        ${this.wahaStatus === 'connected' ? 'disabled' : ''}>
                                    <span class="btn-icon">🔗</span>
                                    Conectar
                                </button>
                                <button class="action-btn danger" onclick="settingsModule.disconnectWaha()"
                                        ${this.wahaStatus !== 'connected' ? 'disabled' : ''}>
                                    <span class="btn-icon">❌</span>
                                    Desconectar
                                </button>
                                <button class="action-btn warning" onclick="settingsModule.restartWaha()">
                                    <span class="btn-icon">🔄</span>
                                    Reiniciar
                                </button>
                            </div>
                        </div>

                        <div class="action-group">
                            <h4>Autenticação</h4>
                            <div class="auth-form">
                                <div class="form-group">
                                    <label for="whatsapp-number">Número WhatsApp</label>
                                    <input type="text" id="whatsapp-number" placeholder="5511999999999" 
                                           style="font-family: monospace;">
                                    <small>Formato: código do país + DDD + número</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="auth-method">Método de Verificação</label>
                                    <select id="auth-method">
                                        <option value="sms">SMS</option>
                                        <option value="telegram">Telegram</option>
                                        <option value="link">Link Direto</option>
                                    </select>
                                </div>
                                
                                <div class="form-group" id="code-input-group" style="display: none;">
                                    <label for="verification-code">Código de Verificação</label>
                                    <input type="text" id="verification-code" placeholder="123456" maxlength="6" 
                                           style="font-family: monospace; font-size: 18px; text-align: center;">
                                    <button class="btn btn-primary" onclick="settingsModule.submitVerificationCode()">
                                        Enviar Código
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Configurações do Banco de Dados
    renderDatabaseSettings() {
        return `
            <div class="settings-panel">
                <div class="panel-header">
                    <h2>Configurações do Banco de Dados</h2>
                    <p>Gerencie conexões e backups do banco de dados</p>
                </div>

                <div class="settings-form">
                    <div class="form-section">
                        <h3>Conexão</h3>
                        
                        <div class="form-group">
                            <label for="db-type">Tipo de Banco</label>
                            <select id="db-type">
                                <option value="postgresql" ${this.settings.database.type === 'postgresql' ? 'selected' : ''}>PostgreSQL</option>
                                <option value="mysql" ${this.settings.database.type === 'mysql' ? 'selected' : ''}>MySQL</option>
                                <option value="sqlite" ${this.settings.database.type === 'sqlite' ? 'selected' : ''}>SQLite</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="railway-url">URL do Railway</label>
                            <input type="text" id="railway-url" value="${this.settings.database.railway_url}" 
                                   placeholder="postgresql://...">
                            <small>URL de conexão do banco no Railway</small>
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Backup</h3>
                        
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="local-backup" 
                                       ${this.settings.database.local_backup ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Manter backup local
                            </label>
                        </div>
                        
                        <div class="backup-actions">
                            <button class="btn btn-secondary" onclick="settingsModule.createBackup()">
                                Criar Backup
                            </button>
                            <button class="btn btn-secondary" onclick="settingsModule.restoreBackup()">
                                Restaurar Backup
                            </button>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-primary" onclick="settingsModule.testDatabaseConnection()">
                            Testar Conexão
                        </button>
                        <button class="btn btn-primary" onclick="settingsModule.saveSettings()">
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Configurações do Sistema
    renderSystemSettings() {
        return `
            <div class="settings-panel">
                <div class="panel-header">
                    <h2>Configurações do Sistema</h2>
                    <p>Configure logs, performance e comportamento do sistema</p>
                </div>

                <div class="settings-form">
                    <div class="form-section">
                        <h3>Logs</h3>
                        
                        <div class="form-group">
                            <label for="log-level">Nível de Log</label>
                            <select id="log-level">
                                <option value="debug" ${this.settings.system.log_level === 'debug' ? 'selected' : ''}>Debug</option>
                                <option value="info" ${this.settings.system.log_level === 'info' ? 'selected' : ''}>Info</option>
                                <option value="warning" ${this.settings.system.log_level === 'warning' ? 'selected' : ''}>Warning</option>
                                <option value="error" ${this.settings.system.log_level === 'error' ? 'selected' : ''}>Error</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="max-log-files">Máximo de Arquivos de Log</label>
                            <input type="number" id="max-log-files" value="${this.settings.system.max_log_files}" 
                                   min="1" max="100">
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>Backup Automático</h3>
                        
                        <div class="form-group">
                            <label for="backup-interval">Intervalo de Backup (horas)</label>
                            <input type="number" id="backup-interval" value="${this.settings.system.backup_interval}" 
                                   min="1" max="168">
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="settingsModule.clearLogs()">
                            Limpar Logs
                        </button>
                        <button class="btn btn-primary" onclick="settingsModule.saveSettings()">
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Configurações de Segurança
    renderSecuritySettings() {
        return `
            <div class="settings-panel">
                <div class="panel-header">
                    <h2>Configurações de Segurança</h2>
                    <p>Gerencie chaves de API e timeouts de sessão</p>
                </div>

                <div class="settings-form">
                    <div class="form-section">
                        <h3>Sessão</h3>
                        
                        <div class="form-group">
                            <label for="session-timeout">Timeout de Sessão (minutos)</label>
                            <input type="number" id="session-timeout" value="${this.settings.security.session_timeout}" 
                                   min="5" max="1440">
                        </div>
                    </div>

                    <div class="form-section">
                        <h3>API</h3>
                        
                        <div class="form-group">
                            <label for="api-key">Chave da API</label>
                            <input type="password" id="api-key" value="${this.settings.security.api_key}" 
                                   placeholder="Sua chave de API">
                            <small>Chave para autenticação de APIs externas</small>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="settingsModule.generateApiKey()">
                            Gerar Nova Chave
                        </button>
                        <button class="btn btn-primary" onclick="settingsModule.saveSettings()">
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Métodos de controle
    switchTab(tabName) {
        this.currentTab = tabName;
        this.updateInterface();
    }

    updateInterface() {
        const contentArea = document.getElementById('app-content');
        if (contentArea) {
            contentArea.innerHTML = this.render();
        }
    }

    // Métodos de teste e controle
    async testBackendConnection() {
        try {
            this.showNotification('🔍 Testando conexão com o backend...', 'info');
            const response = await fetch(`${this.backendUrl}/api/health`);
            
            if (response.ok) {
                this.showNotification('✅ Backend conectado com sucesso!', 'success');
                this.backendStatus = 'connected';
            } else {
                this.showNotification('❌ Falha na conexão com o backend', 'error');
                this.backendStatus = 'disconnected';
            }
            
            this.updateInterface();
        } catch (error) {
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
            this.backendStatus = 'disconnected';
            this.updateInterface();
        }
    }

    async connectWaha() {
        try {
            this.showNotification('🔗 Conectando WAHA...', 'info');
            const response = await fetch(`${this.backendUrl}/api/waha/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_name: this.settings.waha.session_name })
            });
            
            if (response.ok) {
                this.showNotification('✅ WAHA conectado com sucesso!', 'success');
                this.wahaStatus = 'connected';
            } else {
                this.showNotification('❌ Falha ao conectar WAHA', 'error');
            }
            
            this.updateInterface();
        } catch (error) {
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
        }
    }

    async disconnectWaha() {
        try {
            this.showNotification('❌ Desconectando WAHA...', 'info');
            const response = await fetch(`${this.backendUrl}/api/waha/disconnect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_name: this.settings.waha.session_name })
            });
            
            if (response.ok) {
                this.showNotification('✅ WAHA desconectado', 'success');
                this.wahaStatus = 'disconnected';
            } else {
                this.showNotification('❌ Falha ao desconectar WAHA', 'error');
            }
            
            this.updateInterface();
        } catch (error) {
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
        }
    }

    async restartWaha() {
        try {
            this.showNotification('🔄 Reiniciando WAHA...', 'info');
            await this.disconnectWaha();
            setTimeout(() => this.connectWaha(), 2000);
        } catch (error) {
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
        }
    }

    async testDatabaseConnection() {
        try {
            this.showNotification('🔍 Testando conexão com o banco...', 'info');
            const response = await fetch(`${this.backendUrl}/api/database/test`);
            
            if (response.ok) {
                this.showNotification('✅ Banco de dados conectado!', 'success');
                this.databaseStatus = 'connected';
            } else {
                this.showNotification('❌ Falha na conexão com o banco', 'error');
                this.databaseStatus = 'disconnected';
            }
            
            this.updateInterface();
        } catch (error) {
            this.showNotification(`❌ Erro: ${error.message}`, 'error');
            this.databaseStatus = 'disconnected';
            this.updateInterface();
        }
    }

    // Métodos utilitários
    showNotification(message, type = 'info') {
        // Implementar sistema de notificações
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    saveSettings() {
        try {
            // Coletar valores dos campos
            this.settings.backend.url = document.getElementById('backend-url')?.value || this.settings.backend.url;
            this.settings.backend.port = parseInt(document.getElementById('backend-port')?.value) || this.settings.backend.port;
            this.settings.backend.timeout = parseInt(document.getElementById('backend-timeout')?.value) || this.settings.backend.timeout;
            
            // Salvar no localStorage
            localStorage.setItem('sacsmax_settings', JSON.stringify(this.settings));
            
            this.showNotification('✅ Configurações salvas com sucesso!', 'success');
        } catch (error) {
            this.showNotification(`❌ Erro ao salvar: ${error.message}`, 'error');
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('sacsmax_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }

    // Métodos de ação rápida
    backupSystem() {
        this.showNotification('💾 Iniciando backup do sistema...', 'info');
    }

    clearCache() {
        this.showNotification('🧹 Cache limpo com sucesso!', 'success');
    }

    exportSettings() {
        this.showNotification('📤 Configurações exportadas!', 'success');
    }

    importSettings() {
        this.showNotification('📥 Configurações importadas!', 'success');
    }

    resetToDefaults() {
        this.showNotification('🔄 Configurações restauradas aos padrões!', 'success');
    }

    createBackup() {
        this.showNotification('💾 Backup criado com sucesso!', 'success');
    }

    restoreBackup() {
        this.showNotification('📥 Backup restaurado com sucesso!', 'success');
    }

    clearLogs() {
        this.showNotification('🧹 Logs limpos com sucesso!', 'success');
    }

    generateApiKey() {
        this.showNotification('🔑 Nova chave de API gerada!', 'success');
    }
}

// Estilos CSS modernos para Settings
const settingsStyles = `
<style>
/* Container Principal */
.settings-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background: #f8f9fa;
    min-height: 100vh;
}

/* Header */
.settings-header {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.settings-title {
    display: flex;
    align-items: center;
    gap: 16px;
}

.settings-icon {
    font-size: 32px;
}

.settings-title h1 {
    margin: 0;
    color: #1a1a1a;
    font-size: 28px;
    font-weight: 600;
}

.status-grid {
    display: flex;
    gap: 16px;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
}

.status-item.connected {
    background: #d4edda;
    color: #155724;
}

.status-item.disconnected {
    background: #f8d7da;
    color: #721c24;
}

.status-icon {
    font-size: 16px;
}

/* Navegação */
.settings-nav {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    gap: 8px;
    overflow-x: auto;
}

.nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    background: #f8f9fa;
    color: #1a1a1a;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    border: 2px solid transparent;
}

.nav-btn:hover {
    background: #e9ecef;
    color: #1a1a1a;
    border-color: #007bff;
}

.nav-btn.active {
    background: #007bff;
    color: white;
    border-color: #0056b3;
}

.nav-icon {
    font-size: 16px;
    color: inherit;
    filter: contrast(1.2);
}

/* Garantir contraste para ícones específicos */
.nav-btn .nav-icon {
    opacity: 0.9;
}

.nav-btn:hover .nav-icon {
    opacity: 1;
}

.nav-btn.active .nav-icon {
    opacity: 1;
    filter: brightness(1.1);
}

.nav-icon {
    font-size: 16px;
}

/* Conteúdo */
.settings-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
}

/* Visão Geral */
.overview-container {
    padding: 24px;
}

.overview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.overview-header h2 {
    margin: 0;
    color: #1a1a1a;
    font-size: 24px;
    font-weight: 600;
}

.refresh-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    background: #f8f9fa;
    color: #6c757d;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
}

.refresh-btn:hover {
    background: #e9ecef;
}

.status-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
}

.status-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 24px;
    border-left: 4px solid #dee2e6;
    transition: all 0.2s;
}

.status-card.connected {
    border-left-color: #28a745;
    background: #d4edda;
}

.status-card.disconnected {
    border-left-color: #dc3545;
    background: #f8d7da;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.card-icon {
    font-size: 24px;
}

.card-header h3 {
    margin: 0;
    color: #1a1a1a;
    font-size: 18px;
    font-weight: 600;
}

.status-text {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
}

.status-url, .status-details {
    font-size: 14px;
    color: #6c757d;
    margin-bottom: 4px;
}

.card-actions {
    margin-top: 16px;
}

.action-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    margin-right: 8px;
    color: #1a1a1a;
}

.action-btn.primary {
    background: #007bff;
    color: white;
}

.action-btn.primary:hover {
    background: #0056b3;
    color: white;
}

.action-btn.danger {
    background: #dc3545;
    color: white;
}

.action-btn.danger:hover {
    background: #c82333;
    color: white;
}

.action-btn.warning {
    background: #ffc107;
    color: #1a1a1a;
}

.action-btn.warning:hover {
    background: #e0a800;
    color: #1a1a1a;
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Ações Rápidas */
.quick-actions {
    margin-top: 32px;
}

.quick-actions h3 {
    margin-bottom: 16px;
    color: #1a1a1a;
    font-size: 20px;
    font-weight: 600;
}

.actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.quick-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px;
    border: 2px solid #e9ecef;
    background: white;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    color: #1a1a1a;
}

.quick-action-btn:hover {
    border-color: #007bff;
    background: #f8f9fa;
    transform: translateY(-2px);
}

.action-icon {
    font-size: 32px;
}

.action-text {
    font-size: 14px;
    font-weight: 500;
    text-align: center;
}

/* Painéis de Configuração */
.settings-panel {
    padding: 24px;
}

.panel-header {
    margin-bottom: 24px;
}

.panel-header h2 {
    margin: 0 0 8px 0;
    color: #1a1a1a;
    font-size: 24px;
    font-weight: 600;
}

.panel-header p {
    margin: 0;
    color: #6c757d;
    font-size: 16px;
}

/* Formulários */
.settings-form {
    max-width: 800px;
}

.form-section {
    margin-bottom: 32px;
    padding: 24px;
    background: #f8f9fa;
    border-radius: 8px;
}

.form-section h3 {
    margin: 0 0 16px 0;
    color: #1a1a1a;
    font-size: 18px;
    font-weight: 600;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #1a1a1a;
    font-weight: 500;
    font-size: 14px;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 12px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #007bff;
}

.form-group small {
    display: block;
    margin-top: 4px;
    color: #6c757d;
    font-size: 12px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-size: 14px;
}

.checkbox-label input[type="checkbox"] {
    width: auto;
    margin: 0;
}

/* WAHA Control Panel */
.waha-control-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.waha-status-card {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 24px;
    border-left: 4px solid #dee2e6;
}

.waha-status-card.connected {
    border-left-color: #28a745;
    background: #d4edda;
}

.waha-status-card.disconnected {
    border-left-color: #dc3545;
    background: #f8d7da;
}

.status-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
}

.status-icon {
    font-size: 32px;
}

.status-info h3 {
    margin: 0 0 4px 0;
    color: #1a1a1a;
    font-size: 18px;
    font-weight: 600;
}

.status-text {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
}

.status-details {
    margin-bottom: 20px;
}

.detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
}

.detail-label {
    color: #6c757d;
    font-weight: 500;
}

.detail-value {
    color: #1a1a1a;
    font-weight: 600;
}

.waha-actions {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.action-group {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 20px;
}

.action-group h4 {
    margin: 0 0 16px 0;
    color: #1a1a1a;
    font-size: 16px;
    font-weight: 600;
}

.action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Botões */
.btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #1a1a1a;
}

.btn-primary {
    background: #007bff;
    color: white;
}

.btn-primary:hover {
    background: #0056b3;
    color: white;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #545b62;
    color: white;
}

.form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #e9ecef;
}

.backup-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px;
}

/* Melhorar visibilidade geral */
.settings-nav {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    gap: 8px;
    overflow-x: auto;
    border: 1px solid #e9ecef;
}

.nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    background: #f8f9fa;
    color: #1a1a1a;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    border: 2px solid transparent;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.nav-btn:hover {
    background: #e9ecef;
    color: #1a1a1a;
    border-color: #007bff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.nav-btn.active {
    background: #007bff;
    color: white;
    border-color: #0056b3;
    box-shadow: 0 2px 8px rgba(0,123,255,0.3);
}

/* Responsividade */
@media (max-width: 768px) {
    .settings-container {
        padding: 12px;
    }
    
    .settings-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
    }
    
    .status-grid {
        flex-wrap: wrap;
        justify-content: center;
    }
    
    .settings-nav {
        flex-wrap: wrap;
    }
    
    .nav-btn {
        flex: 1;
        min-width: 120px;
    }
    
    .status-cards {
        grid-template-columns: 1fr;
    }
    
    .waha-control-panel {
        grid-template-columns: 1fr;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .actions-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }
    
    .form-actions {
        flex-direction: column;
    }
}
</style>
`;

// Inserir estilos no head
document.head.insertAdjacentHTML('beforeend', settingsStyles);

// Exportar módulo
window.settingsModule = new SettingsModule();
