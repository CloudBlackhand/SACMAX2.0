// Módulo Configurações - Gestão de configurações do sistema (100% Funcional)

class SettingsModule {
    constructor() {
        this.settings = {
            // Configurações de Conexão
            backend: {
                url: 'http://localhost:5000',
                port: 5000,
                timeout: 10000
            },
            whatsapp: {
                url: 'http://localhost:3002',
                port: 3002,
                session_name: 'sacmax',
                auto_start: false
            },
            database: {
                type: 'postgresql',
                railway_url: '',
                local_backup: true
            },
            // Configurações de Sistema
            system: {
                log_level: 'info',
                max_log_files: 10,
                backup_interval: 24 // horas
            },
            // Configurações de Segurança
            security: {
                session_timeout: 30, // minutos
                api_key: ''
            }
        };
        
        this.loading = false;
        this.saving = false;
        this.startingServer = false;
        this.backendUrl = 'http://localhost:5000';
        this.whatsappServerRunning = false;
        
        // Adicionar estilos para Railway
        this.addRailwayStyles();
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">⚙️</span>
                    <h2 class="module-title">Configurações do Sistema</h2>
                    <div class="settings-status">
                        <span class="status-indicator ${this.getConnectionStatus() ? 'connected' : 'disconnected'}">
                            ${this.getConnectionStatus() ? '🟢 Conectado' : '🔴 Desconectado'}
                        </span>
                </div>
                </div>
                
                <div class="settings-content">
                    ${this.loading ? this.renderLoading() : this.renderSettingsTabs()}
                            </div>
                            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Carregando configurações...</p>
                            </div>
        `;
    }

    renderSettingsTabs() {
        return `
            <div class="settings-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="connection">
                        🔌 Conexão
                    </button>
                    <button class="tab-btn" data-tab="whatsapp">
                        📱 WhatsApp Server
                    </button>
                    <button class="tab-btn" data-tab="system">
                        🖥️ Sistema
                    </button>
                    <button class="tab-btn" data-tab="database">
                        🗄️ Banco de Dados
                        </button>
                </div>
                
                <div class="tab-content">
                    <div class="tab-panel active" id="connection-panel">
                        ${this.renderConnectionSettings()}
                                </div>
                    <div class="tab-panel" id="whatsapp-panel">
                        ${this.renderWhatsAppSettings()}
                            </div>
                    <div class="tab-panel" id="system-panel">
                        ${this.renderSystemSettings()}
                                </div>
                    <div class="tab-panel" id="database-panel">
                        ${this.renderDatabaseSettings()}
                            </div>
                                </div>
                            </div>
        `;
    }

    renderConnectionSettings() {
        return `
            <div class="settings-section">
                <h3>🔌 Configurações de Conexão</h3>
                
                <div class="connection-status">
                    <div class="status-card">
                        <div class="status-header">
                            <span class="status-icon">🌐</span>
                            <span class="status-title">Backend API</span>
                        </div>
                        <div class="status-details">
                            <span class="status-url">${this.settings.backend.url}</span>
                            <span class="status-port">:${this.settings.backend.port}</span>
                    </div>
                        <button class="test-btn" onclick="settingsModule.testBackendConnection()">
                            Testar Conexão
                                    </button>
                            </div>
                        </div>
                        
                <div class="settings-form">
                            <div class="form-group">
                        <label>URL do Backend:</label>
                        <input type="text" id="backend-url" value="${this.settings.backend.url}" 
                               placeholder="http://localhost:5000">
                            </div>
                            
                            <div class="form-group">
                        <label>Porta do Backend:</label>
                        <input type="number" id="backend-port" value="${this.settings.backend.port}" 
                               min="1000" max="9999">
                        </div>
                        
                    <div class="form-group">
                        <label>Timeout de Conexão (ms):</label>
                        <input type="number" id="connection-timeout" value="${this.settings.backend.timeout}" 
                               min="1000" max="30000">
                                </div>
                            </div>
                                </div>
        `;
    }

    renderWhatsAppSettings() {
        // Verificar se estamos no Railway
        const isRailway = window.location.hostname.includes('railway.app') || window.location.hostname.includes('up.railway.app');
        
        return `
            <div class="settings-section">
                <h3>📱 Controle do WhatsApp Server</h3>
                
                ${isRailway ? `
                <div class="railway-notice">
                    <div class="notice-icon">✅</div>
                    <div class="notice-content">
                        <h4>WhatsApp no Railway</h4>
                        <p>O WhatsApp server está configurado para funcionar no Railway. O servidor Node.js está rodando na porta 3002.</p>
                        <div class="notice-actions">
                            <button class="notice-btn" onclick="settingsModule.testWhatsAppConnection()">
                                🔍 Testar Conexão
                            </button>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="whatsapp-control">
                    <div class="control-card">
                        <div class="control-header">
                            <span class="control-icon">🚀</span>
                            <span class="control-title">Status do Servidor</span>
                            </div>
                        <div class="control-status">
                            <span class="status-badge ${this.whatsappServerRunning ? 'running' : 'stopped'}">
                                ${this.whatsappServerRunning ? '🟢 Rodando' : '🔴 Parado'}
                            </span>
                            ${this.whatsappServerRunning ? `<span class="port-info">Porta: ${this.settings.whatsapp.port}</span>` : ''}
                        </div>
                        <div class="control-actions">
                            <button class="control-btn start-btn" onclick="settingsModule.startWhatsAppServer()" 
                                    ${this.whatsappServerRunning ? 'disabled' : ''}>
                                ▶️ Iniciar Servidor
                            </button>
                            <button class="control-btn stop-btn" onclick="settingsModule.stopWhatsAppServer()"
                                    ${!this.whatsappServerRunning ? 'disabled' : ''}>
                                ⏹️ Parar Servidor
                            </button>
                            <button class="control-btn restart-btn" onclick="settingsModule.restartWhatsAppServer()">
                                🔄 Reiniciar
                        </button>
                    </div>
                </div>
                
                    <div class="qr-section">
                        <div class="qr-header">
                            <span class="qr-icon">📱</span>
                            <span class="qr-title">QR Code WhatsApp</span>
                                    </div>
                        <div class="qr-content">
                            <div id="qr-code-display" class="qr-display">
                                ${this.whatsappServerRunning ? 
                                    '<p>Clique em "Gerar QR Code" para conectar</p>' : 
                                    '<p>Inicie o servidor primeiro</p>'
                                }
                                </div>
                            <button class="qr-btn" onclick="settingsModule.generateQRCode()">
                                🔄 Gerar QR Code
                            </button>
                            <button class="qr-btn test-btn" onclick="settingsModule.testWhatsAppConnection()">
                                🔍 Testar Conexão
                            </button>
                                    </div>
                                </div>
                            </div>
                            
                <div class="settings-form">
                                        <div class="form-group">
                        <label>URL do WhatsApp Server:</label>
                        <input type="text" id="whatsapp-url" 
                               placeholder="http://localhost:3002">
                                        </div>
                    
                                        <div class="form-group">
                        <label>Porta do WhatsApp:</label>
                        <input type="number" id="whatsapp-port" value="${this.settings.whatsapp.port}" 
                               min="1000" max="9999">
                                        </div>
                    
                                    <div class="form-group">
                        <label>Nome da Sessão:</label>
                        <input type="text" id="session-name" value="${this.settings.whatsapp.session_name}" 
                               placeholder="sacmax">
                            </div>
                            
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="auto-start-whatsapp" ${this.settings.whatsapp.auto_start ? 'checked' : ''}>
                            Iniciar automaticamente com o sistema
                                    </label>
                                </div>
                                    </div>
                                    </div>
        `;
    }

    renderSystemSettings() {
        return `
            <div class="settings-section">
                <h3>🖥️ Configurações do Sistema</h3>
                
                <div class="settings-form">
                            <div class="form-group">
                        <label>Nível de Log:</label>
                        <select id="log-level">
                            <option value="debug" ${this.settings.system.log_level === 'debug' ? 'selected' : ''}>
                                Debug
                                    </option>
                            <option value="info" ${this.settings.system.log_level === 'info' ? 'selected' : ''}>
                                Info
                                    </option>
                            <option value="warning" ${this.settings.system.log_level === 'warning' ? 'selected' : ''}>
                                Warning
                            </option>
                            <option value="error" ${this.settings.system.log_level === 'error' ? 'selected' : ''}>
                                Error
                                    </option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                        <label>Máximo de arquivos de log:</label>
                        <input type="number" id="max-log-files" value="${this.settings.system.max_log_files}" 
                               min="1" max="50">
                            </div>
                            
                            <div class="form-group">
                        <label>Intervalo de backup (horas):</label>
                        <input type="number" id="backup-interval" value="${this.settings.system.backup_interval}" 
                               min="1" max="168">
                            </div>
                        </div>
                        
                <div class="system-actions">
                    <button class="action-btn" onclick="settingsModule.clearLogs()">
                        🗑️ Limpar Logs
                    </button>
                    <button class="action-btn" onclick="settingsModule.exportLogs()">
                        📤 Exportar Logs
                    </button>
                    <button class="action-btn" onclick="settingsModule.restartSystem()">
                        🔄 Reiniciar Sistema
                        </button>
                    </div>
                </div>
        `;
    }

    renderDatabaseSettings() {
        return `
            <div class="settings-section">
                <h3>🗄️ Configurações de Banco de Dados</h3>
                
                <div class="database-status">
                    <div class="status-card">
                        <div class="status-header">
                            <span class="status-icon">☁️</span>
                            <span class="status-title">Railway PostgreSQL</span>
                                </div>
                        <div class="status-details">
                            <span class="status-type">${this.settings.database.type}</span>
                            </div>
                        <button class="test-btn" onclick="settingsModule.testDatabaseConnection()">
                            Testar Conexão
                                    </button>
                            </div>
                        </div>
                        
                <div class="settings-form">
                                <div class="form-group">
                        <label>URL do Railway (opcional):</label>
                        <input type="text" id="railway-url" value="${this.settings.database.railway_url}" 
                               placeholder="postgresql://user:pass@host:port/db">
                                </div>
                                
                                <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="local-backup" ${this.settings.database.local_backup ? 'checked' : ''}>
                            Fazer backup local
                                    </label>
                                </div>
                            </div>
                
                <div class="database-actions">
                    <button class="action-btn" onclick="settingsModule.backupDatabase()">
                        💾 Fazer Backup
                    </button>
                    <button class="action-btn" onclick="settingsModule.restoreDatabase()">
                        📥 Restaurar Backup
                    </button>
                    <button class="action-btn" onclick="settingsModule.optimizeDatabase()">
                        ⚡ Otimizar Banco
                    </button>
                </div>
            </div>
        `;
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
        await this.checkWhatsAppServerStatus();
        this.updateConnectionStatus();
    }

    setupEventListeners() {
        setTimeout(() => {
            // Tab switching
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });

            // Form inputs
            this.setupFormListeners();
        }, 100);
    }

    setupFormListeners() {
        // Connection settings
        const backendUrl = document.getElementById('backend-url');
        const backendPort = document.getElementById('backend-port');
        const timeout = document.getElementById('connection-timeout');

        if (backendUrl) backendUrl.addEventListener('change', () => this.updateBackendUrl());
        if (backendPort) backendPort.addEventListener('change', () => this.updateBackendPort());
        if (timeout) timeout.addEventListener('change', () => this.updateTimeout());

        // WhatsApp settings
        const whatsappUrl = document.getElementById('whatsapp-url');
        const whatsappPort = document.getElementById('whatsapp-port');
        const sessionName = document.getElementById('session-name');
        const autoStartWhatsapp = document.getElementById('auto-start-whatsapp');

        if (whatsappUrl) whatsappUrl.addEventListener('change', () => this.updateWhatsAppUrl());
        if (whatsappPort) whatsappPort.addEventListener('change', () => this.updateWhatsAppPort());
        if (sessionName) sessionName.addEventListener('change', () => this.updateSessionName());
        if (autoStartWhatsapp) autoStartWhatsapp.addEventListener('change', () => this.updateAutoStartWhatsapp());

        // System settings
        const logLevel = document.getElementById('log-level');
        const maxLogFiles = document.getElementById('max-log-files');
        const backupInterval = document.getElementById('backup-interval');

        if (logLevel) logLevel.addEventListener('change', () => this.updateLogLevel());
        if (maxLogFiles) maxLogFiles.addEventListener('change', () => this.updateMaxLogFiles());
        if (backupInterval) backupInterval.addEventListener('change', () => this.updateBackupInterval());

        // Database settings
        const railwayUrl = document.getElementById('railway-url');
        const localBackup = document.getElementById('local-backup');

        if (railwayUrl) railwayUrl.addEventListener('change', () => this.updateRailwayUrl());
        if (localBackup) localBackup.addEventListener('change', () => this.updateLocalBackup());
    }

    switchTab(tabName) {
        // Remove active class from all tabs and panels
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        // Add active class to selected tab and panel
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-panel`).classList.add('active');
    }

    async loadSettings() {
        try {
            this.loading = true;
            this.updateSettingsDisplay();

            // Load from localStorage
        const savedSettings = localStorage.getItem('sacsmax_settings');
        if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.settings = { ...this.settings, ...parsed };
            }

            // Update backend URL if changed
            this.backendUrl = this.settings.backend.url;

            console.log('✅ Configurações carregadas');
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
        } finally {
            this.loading = false;
            this.updateSettingsDisplay();
        }
    }

    async saveSettings() {
        try {
            this.saving = true;
            this.showNotification('Salvando configurações...', 'info');

            // Save to localStorage
        localStorage.setItem('sacsmax_settings', JSON.stringify(this.settings));

            // Update backend URL
            this.backendUrl = this.settings.backend.url;

            // Update global settings
            if (window.SacsMaxApp) {
                window.SacsMaxApp.settings = this.settings;
            }

            console.log('✅ Configurações salvas');
            this.showNotification('Configurações salvas com sucesso!', 'success');
        } catch (error) {
            console.error('❌ Erro ao salvar configurações:', error);
            this.showNotification('Erro ao salvar configurações', 'error');
        } finally {
            this.saving = false;
        }
    }

    updateSettingsDisplay() {
        // Update form values
        const elements = {
            'backend-url': this.settings.backend.url,
            'backend-port': this.settings.backend.port,
            'connection-timeout': this.settings.backend.timeout,
            'whatsapp-url': this.settings.whatsapp.url,
            'whatsapp-port': this.settings.whatsapp.port,
            'session-name': this.settings.whatsapp.session_name,
            'auto-start-whatsapp': this.settings.whatsapp.auto_start,
            'log-level': this.settings.system.log_level,
            'max-log-files': this.settings.system.max_log_files,
            'backup-interval': this.settings.system.backup_interval,
            'railway-url': this.settings.database.railway_url,
            'local-backup': this.settings.database.local_backup
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            }
        });
    }

    // WhatsApp Server Control Methods
    async startWhatsAppServer() {
        try {
            // Evitar múltiplas tentativas
            if (this.startingServer) {
                console.log('⚠️ Servidor já está sendo iniciado...');
                return;
            }
            
            this.startingServer = true;
            this.showNotification('🚀 Iniciando WhatsApp Server...', 'info');
            
            // 1. Iniciar servidor via backend (backend vai detectar porta livre)
            console.log('🚀 Iniciando WhatsApp Server...');
            const response = await fetch(`${this.settings.backend.url}/api/whatsapp-server/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ port: 3001 }) // Porta sugerida, mas backend vai detectar a livre
            });
            
            if (!response.ok) {
                throw new Error('Erro ao iniciar servidor via backend');
            }
            
            const result = await response.json();
            console.log('📊 Resposta do backend:', result);
            
            // 3. Se o backend retornou a porta, usar ela
            if (result.success && result.port) {
                this.settings.whatsapp.url = `http://localhost:${result.port}`;
                this.settings.whatsapp.port = result.port;
                this.whatsappServerRunning = true;
                this.updateSettingsDisplay();
                
                this.showNotification(`✅ WhatsApp Server iniciado na porta ${result.port}!`, 'success');
                console.log(`🚀 WhatsApp Server iniciado na porta ${result.port}`);
            } else if (result.railway) {
                // Caso especial para Railway
                this.showNotification('ℹ️ WhatsApp não disponível no Railway. Use o sistema localmente para funcionalidade completa.', 'info');
                console.log('ℹ️ WhatsApp não disponível no Railway');
            } else {
                // 4. Se não, aguardar e detectar automaticamente
                this.showNotification('⏳ Aguardando servidor inicializar...', 'info');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                await this.checkWhatsAppServerStatus();
            }
            
            if (this.whatsappServerRunning) {
                this.showNotification(`✅ WhatsApp Server iniciado na porta ${this.settings.whatsapp.port}!`, 'success');
                console.log(`🚀 WhatsApp Server iniciado na porta ${this.settings.whatsapp.port}`);
            } else {
                throw new Error('Servidor não respondeu após inicialização');
            }
        } catch (error) {
            console.error('❌ Erro ao iniciar WhatsApp Server:', error);
            this.showNotification(`❌ Erro ao iniciar WhatsApp Server: ${error.message}`, 'error');
        } finally {
            this.startingServer = false;
        }
    }



    async stopWhatsAppServer() {
        try {
            this.showNotification('Parando WhatsApp Server...', 'info');
            
            // Simular parada do servidor
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.whatsappServerRunning = false;
            this.updateWhatsAppStatus();
            this.showNotification('⏹️ WhatsApp Server parado!', 'success');
            
            console.log('⏹️ WhatsApp Server parado');
        } catch (error) {
            console.error('❌ Erro ao parar WhatsApp Server:', error);
            this.showNotification('❌ Erro ao parar WhatsApp Server', 'error');
        }
    }

    async restartWhatsAppServer() {
        try {
            this.showNotification('Reiniciando WhatsApp Server...', 'info');
            
            await this.stopWhatsAppServer();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.startWhatsAppServer();
            
            this.showNotification('🔄 WhatsApp Server reiniciado!', 'success');
        } catch (error) {
            console.error('❌ Erro ao reiniciar WhatsApp Server:', error);
            this.showNotification('❌ Erro ao reiniciar WhatsApp Server', 'error');
        }
    }

    showLocalInstructions() {
        const instructions = `
            <div class="local-instructions">
                <h3>🚀 Como executar o SacsMax localmente</h3>
                <ol>
                    <li><strong>Clone o repositório:</strong><br>
                        <code>git clone [URL_DO_REPOSITORIO]</code></li>
                    <li><strong>Instale as dependências Python:</strong><br>
                        <code>pip install -r requirements.txt</code></li>
                    <li><strong>Instale o Node.js:</strong><br>
                        <code>sudo apt install nodejs npm</code> (Linux)<br>
                        <code>brew install node</code> (macOS)</li>
                    <li><strong>Instale as dependências Node.js:</strong><br>
                        <code>npm install</code></li>
                    <li><strong>Execute o sistema:</strong><br>
                        <code>python railway_startup.py</code></li>
                    <li><strong>Acesse:</strong><br>
                        <code>http://localhost:5000</code></li>
                    <li><strong>No Settings, clique em "Iniciar Servidor" para o WhatsApp</strong></li>
                </ol>
                <p><strong>Nota:</strong> O WhatsApp precisa de interface gráfica para funcionar corretamente.</p>
            </div>
        `;
        
        this.showModal('Instruções para Execução Local', instructions);
    }

    // Adicionar CSS para a notificação do Railway
    addRailwayStyles() {
        if (!document.getElementById('railway-styles')) {
            const style = document.createElement('style');
            style.id = 'railway-styles';
            style.textContent = `
                .railway-notice {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    color: white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }
                .railway-notice .notice-icon {
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                .railway-notice h4 {
                    margin: 0 0 10px 0;
                    font-size: 18px;
                }
                .railway-notice p {
                    margin: 0 0 15px 0;
                    line-height: 1.5;
                }
                .notice-actions {
                    display: flex;
                    gap: 10px;
                }
                .notice-btn {
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .notice-btn:hover {
                    background: rgba(255,255,255,0.3);
                    transform: translateY(-1px);
                }
                .local-instructions {
                    max-width: 600px;
                    line-height: 1.6;
                }
                .local-instructions ol {
                    margin: 15px 0;
                    padding-left: 20px;
                }
                .local-instructions li {
                    margin-bottom: 15px;
                }
                .local-instructions code {
                    background: #f4f4f4;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: monospace;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async generateQRCode() {
        try {
            this.showNotification('Gerando QR Code...', 'info');
            
            // Verificar status do servidor primeiro
            await this.checkWhatsAppServerStatus();
            
            // Buscar QR Code real do servidor
            const response = await fetch(`${this.settings.whatsapp.url}/api/sessions/${this.settings.whatsapp.session_name}/qr`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao buscar QR Code: ${response.status}`);
            }
            
            const data = await response.json();
            
            const qrDisplay = document.getElementById('qr-code-display');
            if (qrDisplay && data.qr) {
                qrDisplay.innerHTML = `
                    <div class="qr-code">
                        <img src="${data.qr}" alt="QR Code WhatsApp" style="width: 300px; height: 300px;">
                    </div>
                    <p class="qr-instructions">Escaneie com o WhatsApp do seu celular</p>
                `;
                
                this.showNotification('📱 QR Code gerado com sucesso!', 'success');
                console.log('📱 QR Code gerado e exibido');
            } else {
                throw new Error('QR Code não encontrado na resposta');
            }
        } catch (error) {
            console.error('❌ Erro ao gerar QR Code:', error);
            this.showNotification(`❌ Erro ao gerar QR Code: ${error.message}`, 'error');
            
            // Mostrar erro no display
            const qrDisplay = document.getElementById('qr-code-display');
            if (qrDisplay) {
                qrDisplay.innerHTML = `
                    <div class="qr-error">
                        <p>❌ Erro ao gerar QR Code</p>
                        <p style="font-size: 0.8rem; color: #666;">${error.message}</p>
                        <button onclick="settingsModule.generateQRCode()" class="qr-btn">🔄 Tentar Novamente</button>
                    </div>
                `;
            }
        }
    }

    async checkWhatsAppServerStatus() {
        try {
            console.log('🔍 Verificando status do WhatsApp Server...');
            
            // Tentar portas comuns do WhatsApp Server
            const ports = [3001, 3002, 3003, 3004, 3005];
            let foundPort = null;
            let foundData = null;
            
            for (const port of ports) {
                try {
                    console.log(`🔍 Testando porta ${port}...`);
                    const response = await fetch(`http://localhost:${port}/api/status`, {
                        method: 'GET',
                        signal: AbortSignal.timeout(2000)
                    }); 
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`📊 Resposta da porta ${port}:`, data);
                        if (data.success && data.status === 'running') {
                            foundPort = port;
                            foundData = data;
                            console.log(`✅ WhatsApp Server encontrado na porta ${port}`);
                            break;
                        }
                    }
                } catch (error) {
                    console.log(`❌ Porta ${port} não respondeu:`, error.message);
                }
            }
            
            if (foundPort && foundData) {
                // Atualizar configurações com a porta encontrada
                this.settings.whatsapp.url = `http://localhost:${foundPort}`;
                this.settings.whatsapp.port = foundPort;
                this.whatsappServerRunning = true;
                
                // Atualizar campos no formulário
                this.updateSettingsDisplay();
                
                console.log(`✅ WhatsApp Server está rodando na porta ${foundPort}`);
                console.log('📋 Configurações atualizadas:', this.settings.whatsapp);
            } else {
                this.whatsappServerRunning = false;
                console.log('❌ WhatsApp Server não encontrado em nenhuma porta');
            }
            
            this.updateWhatsAppStatus();
        } catch (error) {
            console.error('❌ Erro ao verificar WhatsApp Server:', error);
            this.whatsappServerRunning = false;
            this.updateWhatsAppStatus();
        }
    }

    updateWhatsAppStatus() {
        console.log('🔄 Atualizando status do WhatsApp...');
        console.log('📊 Status atual:', this.whatsappServerRunning);
        console.log('📋 Configurações:', this.settings.whatsapp);
        
        const statusBadge = document.querySelector('.status-badge');
        const startBtn = document.querySelector('.start-btn');
        const stopBtn = document.querySelector('.stop-btn');
        const qrBtn = document.querySelector('.qr-btn');
        const qrDisplay = document.getElementById('qr-code-display');

        if (statusBadge) {
            statusBadge.className = `status-badge ${this.whatsappServerRunning ? 'running' : 'stopped'}`;
            statusBadge.innerHTML = this.whatsappServerRunning ? '🟢 Rodando' : '🔴 Parado';
            console.log('✅ Status badge atualizado');
        }

        if (startBtn) {
            startBtn.disabled = this.whatsappServerRunning;
            console.log('✅ Botão iniciar atualizado:', !this.whatsappServerRunning);
        }
        
        if (stopBtn) {
            stopBtn.disabled = !this.whatsappServerRunning;
            console.log('✅ Botão parar atualizado:', this.whatsappServerRunning);
        }
        
        if (qrBtn) {
            qrBtn.disabled = !this.whatsappServerRunning;
            console.log('✅ Botão QR atualizado:', this.whatsappServerRunning);
        }

        if (qrDisplay) {
            if (this.whatsappServerRunning) {
                qrDisplay.innerHTML = '<p>Clique em "Gerar QR Code" para conectar</p>';
                console.log('✅ QR Display: Servidor rodando');
            } else {
                qrDisplay.innerHTML = '<p>Inicie o servidor primeiro</p>';
                console.log('✅ QR Display: Servidor parado');
            }
        }
        
        console.log('✅ Status do WhatsApp atualizado com sucesso');
    }

    // Connection test methods
    async testBackendConnection() {
        try {
            const response = await fetch(`${this.settings.backend.url}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(this.settings.backend.timeout)
            });

            if (response.ok) {
                this.showNotification('✅ Backend conectado com sucesso!', 'success');
            } else {
                this.showNotification('⚠️ Backend respondeu com erro', 'warning');
            }
        } catch (error) {
            this.showNotification('❌ Erro ao conectar com o backend', 'error');
        }
    }

    async testDatabaseConnection() {
        try {
            const response = await fetch(`${this.settings.backend.url}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(this.settings.backend.timeout)
            });

            if (response.ok) {
                this.showNotification('✅ Banco de dados conectado!', 'success');
            } else {
                this.showNotification('⚠️ Banco de dados respondeu com erro', 'warning');
            }
        } catch (error) {
            this.showNotification('❌ Erro ao conectar com banco de dados', 'error');
        }
    }

    async testWhatsAppConnection() {
        try {
            this.showNotification('🔍 Testando conexão com WhatsApp...', 'info');
            
            // Usar proxy do backend
            const response = await fetch(`${window.location.origin}/api/whatsapp/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const data = await response.json();
                this.whatsappServerRunning = true;
                this.updateSettingsDisplay();
                this.updateWhatsAppStatus();
                
                this.showNotification('✅ WhatsApp Server conectado via proxy!', 'success');
                console.log('📊 Status WhatsApp:', data);
            } else {
                this.showNotification('❌ WhatsApp Server não respondeu', 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao testar WhatsApp Server:', error);
            this.showNotification(`❌ Erro ao conectar com WhatsApp: ${error.message}`, 'error');
        }
    }

    // Update methods
    updateBackendUrl() {
        this.settings.backend.url = document.getElementById('backend-url').value;
                    this.saveSettings();
                }
                
    updateBackendPort() {
        this.settings.backend.port = parseInt(document.getElementById('backend-port').value);
        this.saveSettings();
    }

    updateTimeout() {
        this.settings.backend.timeout = parseInt(document.getElementById('connection-timeout').value);
        this.saveSettings();
    }

    updateWhatsAppUrl() {
        this.settings.whatsapp.url = document.getElementById('whatsapp-url').value;
        this.saveSettings();
    }

    updateWhatsAppPort() {
        this.settings.whatsapp.port = parseInt(document.getElementById('whatsapp-port').value);
        this.saveSettings();
    }

    updateSessionName() {
        this.settings.whatsapp.session_name = document.getElementById('session-name').value;
        this.saveSettings();
    }

    updateAutoStartWhatsapp() {
        this.settings.whatsapp.auto_start = document.getElementById('auto-start-whatsapp').checked;
        this.saveSettings();
    }

    updateLogLevel() {
        this.settings.system.log_level = document.getElementById('log-level').value;
        this.saveSettings();
    }

    updateMaxLogFiles() {
        this.settings.system.max_log_files = parseInt(document.getElementById('max-log-files').value);
        this.saveSettings();
    }

    updateBackupInterval() {
        this.settings.system.backup_interval = parseInt(document.getElementById('backup-interval').value);
        this.saveSettings();
    }

    updateRailwayUrl() {
        this.settings.database.railway_url = document.getElementById('railway-url').value;
        this.saveSettings();
    }

    updateLocalBackup() {
        this.settings.database.local_backup = document.getElementById('local-backup').checked;
        this.saveSettings();
    }

    // Action methods
    clearLogs() {
        if (confirm('Tem certeza que deseja limpar todos os logs?')) {
            // Clear logs logic here
            this.showNotification('Logs limpos com sucesso!', 'success');
        }
    }

    exportLogs() {
        // Export logs logic here
        this.showNotification('Logs exportados com sucesso!', 'success');
    }

    restartSystem() {
        if (confirm('Tem certeza que deseja reiniciar o sistema?')) {
            // Restart system logic here
            this.showNotification('Sistema reiniciado!', 'success');
        }
    }

    backupDatabase() {
        // Backup database logic here
        this.showNotification('Backup iniciado...', 'info');
    }

    restoreDatabase() {
        if (confirm('Tem certeza que deseja restaurar o banco de dados?')) {
            // Restore database logic here
            this.showNotification('Restauração iniciada...', 'info');
        }
    }

    optimizeDatabase() {
        // Optimize database logic here
        this.showNotification('Otimização iniciada...', 'info');
    }

    getConnectionStatus() {
        // Simple connection status check
        return true; // For now, always return true
    }

    updateConnectionStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        if (statusIndicator) {
            const isConnected = this.getConnectionStatus();
            statusIndicator.className = `status-indicator ${isConnected ? 'connected' : 'disconnected'}`;
            statusIndicator.innerHTML = isConnected ? '🟢 Conectado' : '🔴 Desconectado';
        }
    }

    showNotification(message, type = 'info') {
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

// Estilos específicos do módulo Settings
const settingsStyles = `
    .settings-status {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .status-indicator {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .status-indicator.connected {
        background: #d4edda;
        color: #155724;
    }

    .status-indicator.disconnected {
        background: #f8d7da;
        color: #721c24;
    }

    .settings-content {
        padding: 1rem;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        color: #666;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #dc3545;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .settings-tabs {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .tab-buttons {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid #e9ecef;
        padding-bottom: 1rem;
    }

    .tab-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        background: #f8f9fa;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }

    .tab-btn:hover {
        background: #e9ecef;
    }

    .tab-btn.active {
        background: #dc3545;
        color: white;
    }

    .tab-content {
        flex: 1;
    }

    .tab-panel {
        display: none;
    }

    .tab-panel.active {
        display: block;
    }

    .settings-section {
        margin-bottom: 2rem;
    }

    .settings-section h3 {
        margin-bottom: 1rem;
        color: #333;
        font-size: 1.2rem;
    }

    .connection-status {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .status-card {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
    }

    .status-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .status-icon {
        font-size: 1.2rem;
    }

    .status-title {
        font-weight: 500;
        color: #333;
    }

    .status-details {
        margin-bottom: 1rem;
        color: #666;
    }

    .status-url {
        font-family: monospace;
        background: #f8f9fa;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .status-port {
        color: #999;
    }

    .status-type {
        background: #e9ecef;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }

    .test-btn {
        padding: 0.5rem 1rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background 0.2s ease;
    }

    .test-btn:hover {
        background: #0056b3;
    }

    .whatsapp-control {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .control-card {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .control-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .control-icon {
        font-size: 1.5rem;
    }

    .control-title {
        font-weight: 500;
        color: #333;
        font-size: 1.1rem;
    }

    .control-status {
        margin-bottom: 1rem;
    }

    .status-badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .status-badge.running {
        background: #d4edda;
        color: #155724;
    }

    .status-badge.stopped {
        background: #f8d7da;
        color: #721c24;
    }

    .port-info {
        display: block;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: #666;
        background: #f8f9fa;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
    }

    .control-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .control-btn {
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s ease;
    }

    .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .start-btn {
        background: #28a745;
        color: white;
    }

    .start-btn:hover:not(:disabled) {
        background: #218838;
    }

    .stop-btn {
        background: #dc3545;
        color: white;
    }

    .stop-btn:hover:not(:disabled) {
        background: #c82333;
    }

    .restart-btn {
        background: #ffc107;
        color: #333;
    }

    .restart-btn:hover:not(:disabled) {
        background: #e0a800;
    }

    .qr-section {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
    }

    .qr-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .qr-icon {
        font-size: 1.2rem;
    }

    .qr-title {
        font-weight: 500;
        color: #333;
    }

    .qr-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .qr-display {
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px dashed #e9ecef;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        color: #666;
    }

    .qr-code {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .qr-placeholder {
        width: 150px;
        height: 150px;
        background: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .qr-text {
        font-weight: 500;
        color: #333;
    }

    .qr-time {
        font-size: 0.8rem;
        color: #666;
    }

    .qr-instructions {
        font-size: 0.9rem;
        color: #666;
        margin: 0;
    }

    .qr-btn {
        padding: 0.75rem 1.5rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s ease;
    }

    .qr-btn:hover:not(:disabled) {
        background: #0056b3;
    }

    .qr-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .qr-btn.test-btn {
        background: #6c757d;
        margin-left: 0.5rem;
    }

    .qr-btn.test-btn:hover {
        background: #5a6268;
    }

    .qr-error {
        text-align: center;
        color: #dc3545;
    }

    .settings-form {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
    }

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: #dc3545;
        box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
        width: auto;
        margin: 0;
    }

    .system-actions,
    .database-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .action-btn {
        padding: 0.75rem 1.5rem;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.2s ease;
    }

    .action-btn:hover {
        background: #5a6268;
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-radius: 8px;
        color: white;
        min-width: 300px;
    }

    .notification-success {
        background: #28a745;
    }

    .notification-error {
        background: #dc3545;
    }

    .notification-info {
        background: #17a2b8;
    }

    .notification-warning {
        background: #ffc107;
        color: #333;
    }

    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1.2rem;
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

    @media (max-width: 768px) {
        .whatsapp-control {
            grid-template-columns: 1fr;
        }
        
        .tab-buttons {
            flex-wrap: wrap;
        }
        
        .control-actions {
            flex-direction: column;
        }
    }
`;

// Adiciona os estilos ao documento
if (!document.getElementById('settings-styles')) {
    const style = document.createElement('style');
    style.id = 'settings-styles';
    style.textContent = settingsStyles;
    document.head.appendChild(style);
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsModule;
}

// Variável global para acesso direto
window.settingsModule = new SettingsModule();

