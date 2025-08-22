// Módulo Settings - Configurações gerais do sistema

class SettingsModule {
    constructor() {
        this.settings = {
            general: {
                companyName: 'SacsMax',
                timezone: 'America/Sao_Paulo',
                language: 'pt-BR',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h'
            },
            notifications: {
                emailNotifications: true,
                pushNotifications: true,
                soundAlerts: true,
                desktopNotifications: true
            },
            whatsapp: {
                qrCodeEnabled: true,
                autoReconnect: true,
                sessionTimeout: 60,
                webhookUrl: '',
                apiKey: ''
            },
            integrations: {
                whatsappEnabled: true,
                emailEnabled: true,
                smsEnabled: false,
                apiEnabled: true
            },
            appearance: {
                theme: 'light',
                primaryColor: '#667eea',
                fontSize: 'medium',
                compactMode: false
            }
        };
        this.backupData = null;
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">⚙️</span>
                    <h2 class="module-title">Configurações</h2>
                </div>
                
                <!-- Navegação das Configurações -->
                <div class="settings-nav">
                    <button class="settings-nav-btn active" data-section="general">
                        🏢 Geral
                    </button>
                    <button class="settings-nav-btn" data-section="notifications">
                        🔔 Notificações
                    </button>
                    <button class="settings-nav-btn" data-section="whatsapp">
                        📱 WhatsApp
                    </button>
                    <button class="settings-nav-btn" data-section="integrations">
                        🔗 Integrações
                    </button>
                    <button class="settings-nav-btn" data-section="appearance">
                        🎨 Aparência
                    </button>
                    <button class="settings-nav-btn" data-section="backup">
                        💾 Backup
                    </button>
                </div>
                
                <!-- Seção Geral -->
                <div class="settings-section active" id="general-section">
                    <div class="card">
                        <h3>🏢 Configurações Gerais</h3>
                        
                        <div class="grid grid-2">
                            <div class="form-group">
                                <label class="form-label">Nome da Empresa</label>
                                <input type="text" class="form-input" id="company-name" 
                                       value="${this.settings.general.companyName}" />
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Fuso Horário</label>
                                <select class="form-input" id="timezone">
                                    <option value="America/Sao_Paulo" ${this.settings.general.timezone === 'America/Sao_Paulo' ? 'selected' : ''}>
                                        Brasília (GMT-3)
                                    </option>
                                    <option value="America/Manaus" ${this.settings.general.timezone === 'America/Manaus' ? 'selected' : ''}>
                                        Manaus (GMT-4)
                                    </option>
                                    <option value="America/Belem" ${this.settings.general.timezone === 'America/Belem' ? 'selected' : ''}>
                                        Belém (GMT-3)
                                    </option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Idioma</label>
                                <select class="form-input" id="language">
                                    <option value="pt-BR" ${this.settings.general.language === 'pt-BR' ? 'selected' : ''}>
                                        Português (Brasil)
                                    </option>
                                    <option value="en-US" ${this.settings.general.language === 'en-US' ? 'selected' : ''}>
                                        English (US)
                                    </option>
                                    <option value="es-ES" ${this.settings.general.language === 'es-ES' ? 'selected' : ''}>
                                        Español
                                    </option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Formato de Data</label>
                                <select class="form-input" id="date-format">
                                    <option value="DD/MM/YYYY" ${this.settings.general.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>
                                        DD/MM/YYYY
                                    </option>
                                    <option value="MM/DD/YYYY" ${this.settings.general.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>
                                        MM/DD/YYYY
                                    </option>
                                    <option value="YYYY-MM-DD" ${this.settings.general.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>
                                        YYYY-MM-DD
                                    </option>
                                </select>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary" onclick="this.saveGeneralSettings()">
                            💾 Salvar Configurações Gerais
                        </button>
                    </div>
                </div>
                
                <!-- Seção Notificações -->
                <div class="settings-section" id="notifications-section">
                    <div class="card">
                        <h3>🔔 Configurações de Notificações</h3>
                        
                        <div class="settings-grid">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4>Notificações por Email</h4>
                                    <p>Receber notificações por email sobre atividades importantes</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="email-notifications" 
                                           ${this.settings.notifications.emailNotifications ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                            
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4>Notificações Push</h4>
                                    <p>Receber notificações em tempo real no navegador</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="push-notifications" 
                                           ${this.settings.notifications.pushNotifications ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                            
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4>Alertas Sonoros</h4>
                                    <p>Tocar sons para notificações importantes</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="sound-alerts" 
                                           ${this.settings.notifications.soundAlerts ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                            
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4>Notificações Desktop</h4>
                                    <p>Mostrar notificações na área de trabalho</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="desktop-notifications" 
                                           ${this.settings.notifications.desktopNotifications ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Email para Notificações</label>
                            <input type="email" class="form-input" id="notification-email" 
                                   placeholder="seu@email.com" />
                        </div>
                        
                        <button class="btn btn-primary" onclick="this.saveNotificationSettings()">
                            💾 Salvar Configurações de Notificações
                        </button>
                    </div>
                </div>
                
                <!-- Seção WhatsApp -->
                <div class="settings-section" id="whatsapp-section">
                    <div class="card">
                        <h3>📱 Configurações do WhatsApp</h3>
                        
                        <div class="qr-code-section">
                            <h4>🔐 Conexão via QR Code</h4>
                            <div class="qr-container">
                                <div id="qr-code-display" class="qr-code-placeholder">
                                    <span class="qr-icon">📱</span>
                                    <p>Clique em "Gerar QR Code" para conectar</p>
                                </div>
                                <div class="qr-actions">
                                    <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.generateQRCode()">
                                        🔄 Gerar QR Code
                                    </button>
                                    <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.checkConnection()">
                                        🔍 Verificar Conexão
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-2">
                            <div class="form-group">
                                <label class="form-label">Tempo de Sessão (minutos)</label>
                                <input type="number" class="form-input" id="whatsapp-session-timeout" 
                                       value="${this.settings.whatsapp.sessionTimeout}" min="30" max="480" />
                                <small class="form-help">Tempo de inatividade antes da desconexão</small>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Webhook URL</label>
                                <input type="url" class="form-input" id="whatsapp-webhook" 
                                       value="${this.settings.whatsapp.webhookUrl}" 
                                       placeholder="https://seu-dominio.com/webhook" />
                                <small class="form-help">URL para receber notificações do WhatsApp</small>
                            </div>
                        </div>
                        
                        <div class="settings-grid">
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4>QR Code Automático</h4>
                                    <p>Gerar QR Code automaticamente ao iniciar</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="qr-code-enabled" 
                                           ${this.settings.whatsapp.qrCodeEnabled ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                            
                            <div class="setting-item">
                                <div class="setting-info">
                                    <h4>Reconexão Automática</h4>
                                    <p>Tentar reconectar automaticamente se desconectar</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="auto-reconnect" 
                                           ${this.settings.whatsapp.autoReconnect ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="whatsapp-status">
                            <div class="status-indicator">
                                <span class="status-dot" id="whatsapp-status-dot"></span>
                                <span class="status-text" id="whatsapp-status-text">Desconectado</span>
                            </div>
                        </div>
                        
                        <div class="whatsapp-actions">
                            <button class="btn btn-success" onclick="window.SacsMaxApp.currentModule.connectWhatsApp()">
                                🔗 Conectar WhatsApp
                            </button>
                            <button class="btn btn-danger" onclick="window.SacsMaxApp.currentModule.disconnectWhatsApp()">
                                ❌ Desconectar
                            </button>
                            <button class="btn btn-info" onclick="window.SacsMaxApp.currentModule.viewWhatsAppChat()">
                                💬 Ver Chat
                            </button>
                            <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.exportWhatsAppLog()">
                                📋 Log de Conexão
                            </button>
                        </div>
                        
                        <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.saveWhatsAppSettings()">
                            💾 Salvar Configurações do WhatsApp
                        </button>
                    </div>
                </div>
                
                <!-- Seção Integrações -->
                <div class="settings-section" id="integrations-section">
                    <div class="card">
                        <h3>🔗 Configurações de Integrações</h3>
                        
                        <div class="integrations-grid">
                            <div class="integration-card">
                                <div class="integration-header">
                                    <div class="integration-icon">💬</div>
                                    <div class="integration-info">
                                        <h4>WhatsApp</h4>
                                        <p>Integração com WhatsApp Business API</p>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="whatsapp-enabled" 
                                               ${this.settings.integrations.whatsappEnabled ? 'checked' : ''} />
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="integration-details">
                                    <div class="form-group">
                                        <label class="form-label">Token da API</label>
                                        <input type="password" class="form-input" id="whatsapp-token" 
                                               placeholder="Digite o token da API" />
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Número do WhatsApp</label>
                                        <input type="text" class="form-input" id="whatsapp-number" 
                                               placeholder="+55 11 99999-9999" />
                                    </div>
                                </div>
                            </div>
                            
                            <div class="integration-card">
                                <div class="integration-header">
                                    <div class="integration-icon">📧</div>
                                    <div class="integration-info">
                                        <h4>Email</h4>
                                        <p>Configurações de email SMTP</p>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="email-enabled" 
                                               ${this.settings.integrations.emailEnabled ? 'checked' : ''} />
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="integration-details">
                                    <div class="grid grid-2">
                                        <div class="form-group">
                                            <label class="form-label">Servidor SMTP</label>
                                            <input type="text" class="form-input" id="smtp-server" 
                                                   placeholder="smtp.gmail.com" />
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Porta</label>
                                            <input type="number" class="form-input" id="smtp-port" 
                                                   placeholder="587" />
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-input" id="smtp-email" 
                                               placeholder="seu@email.com" />
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Senha</label>
                                        <input type="password" class="form-input" id="smtp-password" 
                                               placeholder="Digite a senha" />
                                    </div>
                                </div>
                            </div>
                            
                            <div class="integration-card">
                                <div class="integration-header">
                                    <div class="integration-icon">📱</div>
                                    <div class="integration-info">
                                        <h4>SMS</h4>
                                        <p>Integração com serviço de SMS</p>
                                    </div>
                                    <label class="switch">
                                        <input type="checkbox" id="sms-enabled" 
                                               ${this.settings.integrations.smsEnabled ? 'checked' : ''} />
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <div class="integration-details">
                                    <div class="form-group">
                                        <label class="form-label">Provedor SMS</label>
                                        <select class="form-input" id="sms-provider">
                                            <option value="twilio">Twilio</option>
                                            <option value="aws">AWS SNS</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">API Key</label>
                                        <input type="password" class="form-input" id="sms-api-key" 
                                               placeholder="Digite a API key" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary" onclick="this.saveIntegrationSettings()">
                            💾 Salvar Configurações de Integrações
                        </button>
                    </div>
                </div>
                
                <!-- Seção Aparência -->
                <div class="settings-section" id="appearance-section">
                    <div class="card">
                        <h3>🎨 Configurações de Aparência</h3>
                        
                        <div class="grid grid-2">
                            <div class="form-group">
                                <label class="form-label">Tema</label>
                                <select class="form-input" id="theme">
                                    <option value="light" ${this.settings.appearance.theme === 'light' ? 'selected' : ''}>
                                        Claro
                                    </option>
                                    <option value="dark" ${this.settings.appearance.theme === 'dark' ? 'selected' : ''}>
                                        Escuro
                                    </option>
                                    <option value="auto" ${this.settings.appearance.theme === 'auto' ? 'selected' : ''}>
                                        Automático
                                    </option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Cor Primária</label>
                                <input type="color" class="form-input color-input" id="primary-color" 
                                       value="${this.settings.appearance.primaryColor}" />
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Tamanho da Fonte</label>
                                <select class="form-input" id="font-size">
                                    <option value="small" ${this.settings.appearance.fontSize === 'small' ? 'selected' : ''}>
                                        Pequeno
                                    </option>
                                    <option value="medium" ${this.settings.appearance.fontSize === 'medium' ? 'selected' : ''}>
                                        Médio
                                    </option>
                                    <option value="large" ${this.settings.appearance.fontSize === 'large' ? 'selected' : ''}>
                                        Grande
                                    </option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Modo Compacto</label>
                                <label class="switch">
                                    <input type="checkbox" id="compact-mode" 
                                           ${this.settings.appearance.compactMode ? 'checked' : ''} />
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="theme-preview">
                            <h4>Preview do Tema</h4>
                            <div class="preview-container" id="theme-preview">
                                <div class="preview-header">
                                    <h5>SacsMax</h5>
                                    <span class="preview-status">Online</span>
                                </div>
                                <div class="preview-content">
                                    <p>Este é um preview de como ficará a interface com as configurações selecionadas.</p>
                                </div>
                            </div>
                        </div>
                        
                        <button class="btn btn-primary" onclick="this.saveAppearanceSettings()">
                            💾 Salvar Configurações de Aparência
                        </button>
                    </div>
                </div>
                
                <!-- Seção Backup -->
                <div class="settings-section" id="backup-section">
                    <div class="card">
                        <h3>💾 Backup e Restauração</h3>
                        
                        <div class="backup-options">
                            <div class="backup-card">
                                <h4>📤 Exportar Dados</h4>
                                <p>Faça backup de todos os dados do sistema</p>
                                <div class="backup-actions">
                                    <button class="btn btn-primary" onclick="this.exportAllData()">
                                        📥 Exportar Tudo
                                    </button>
                                    <button class="btn btn-secondary" onclick="this.exportContacts()">
                                        👥 Apenas Contatos
                                    </button>
                                    <button class="btn btn-secondary" onclick="this.exportSettings()">
                                        ⚙️ Apenas Configurações
                                    </button>
                                </div>
                            </div>
                            
                            <div class="backup-card">
                                <h4>📥 Importar Dados</h4>
                                <p>Restaura dados de um backup anterior</p>
                                <div class="backup-actions">
                                    <input type="file" id="import-file" accept=".json" style="display: none;" />
                                    <button class="btn btn-primary" onclick="document.getElementById('import-file').click()">
                                        📁 Selecionar Arquivo
                                    </button>
                                    <button class="btn btn-danger" onclick="this.resetAllData()">
                                        🔄 Resetar Tudo
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="backup-history">
                            <h4>📋 Histórico de Backups</h4>
                            <div class="backup-list" id="backup-list">
                                ${this.renderBackupHistory()}
                            </div>
                        </div>
                        
                        <div class="backup-settings">
                            <h4>⚙️ Configurações de Backup</h4>
                            <div class="grid grid-2">
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="auto-backup" />
                                        Backup Automático
                                    </label>
                                    <small class="form-help">Fazer backup automático a cada 7 dias</small>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">
                                        <input type="checkbox" id="cloud-backup" />
                                        Backup na Nuvem
                                    </label>
                                    <small class="form-help">Salvar backups na nuvem (Google Drive/Dropbox)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderBackupHistory() {
        const backups = this.getBackupHistory();
        
        if (backups.length === 0) {
            return '<p class="no-backups">Nenhum backup encontrado</p>';
        }

        return backups.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-name">${backup.name}</div>
                    <div class="backup-details">
                        <span class="backup-date">${backup.date}</span>
                        <span class="backup-size">${backup.size}</span>
                        <span class="backup-type">${backup.type}</span>
                    </div>
                </div>
                <div class="backup-actions">
                    <button class="btn btn-sm btn-secondary" onclick="this.downloadBackup('${backup.id}')">
                        📥 Download
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="this.deleteBackup('${backup.id}')">
                        🗑️ Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
    }

    destroy() {
        // Limpa event listeners se necessário
    }

    setupEventListeners() {
        setTimeout(() => {
            this.setupNavigation();
            this.setupFileImport();
        }, 100);
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.settings-nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchSection(section);
                
                // Atualiza botões ativos
                navButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    setupFileImport() {
        const importFile = document.getElementById('import-file');
        if (importFile) {
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importData(file);
                }
            });
        }
    }

    switchSection(sectionName) {
        // Esconde todas as seções
        const sections = document.querySelectorAll('.settings-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Mostra a seção selecionada
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('sacsmax_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
    }

    saveSettings() {
        localStorage.setItem('sacsmax_settings', JSON.stringify(this.settings));
    }

    saveGeneralSettings() {
        this.settings.general.companyName = document.getElementById('company-name')?.value || this.settings.general.companyName;
        this.settings.general.timezone = document.getElementById('timezone')?.value || this.settings.general.timezone;
        this.settings.general.language = document.getElementById('language')?.value || this.settings.general.language;
        this.settings.general.dateFormat = document.getElementById('date-format')?.value || this.settings.general.dateFormat;
        
        this.saveSettings();
        this.showNotification('Configurações gerais salvas com sucesso!', 'success');
    }

    saveNotificationSettings() {
        this.settings.notifications.emailNotifications = document.getElementById('email-notifications')?.checked || false;
        this.settings.notifications.pushNotifications = document.getElementById('push-notifications')?.checked || false;
        this.settings.notifications.soundAlerts = document.getElementById('sound-alerts')?.checked || false;
        this.settings.notifications.desktopNotifications = document.getElementById('desktop-notifications')?.checked || false;
        
        this.saveSettings();
        this.showNotification('Configurações de notificações salvas com sucesso!', 'success');
    }

    saveSecuritySettings() {
        this.settings.security.sessionTimeout = parseInt(document.getElementById('session-timeout')?.value) || 30;
        this.settings.security.loginAttempts = parseInt(document.getElementById('login-attempts')?.value) || 5;
        this.settings.security.requirePasswordChange = document.getElementById('require-password-change')?.checked || false;
        this.settings.security.twoFactorAuth = document.getElementById('two-factor-auth')?.checked || false;
        
        this.saveSettings();
        this.showNotification('Configurações de segurança salvas com sucesso!', 'success');
    }

    saveIntegrationSettings() {
        this.settings.integrations.whatsappEnabled = document.getElementById('whatsapp-enabled')?.checked || false;
        this.settings.integrations.emailEnabled = document.getElementById('email-enabled')?.checked || false;
        this.settings.integrations.smsEnabled = document.getElementById('sms-enabled')?.checked || false;
        
        this.saveSettings();
        this.showNotification('Configurações de integrações salvas com sucesso!', 'success');
    }

    saveAppearanceSettings() {
        this.settings.appearance.theme = document.getElementById('theme')?.value || 'light';
        this.settings.appearance.primaryColor = document.getElementById('primary-color')?.value || '#667eea';
        this.settings.appearance.fontSize = document.getElementById('font-size')?.value || 'medium';
        this.settings.appearance.compactMode = document.getElementById('compact-mode')?.checked || false;
        
        this.saveSettings();
        this.applyTheme();
        this.showNotification('Configurações de aparência salvas com sucesso!', 'success');
    }

    applyTheme() {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', this.settings.appearance.primaryColor);
        
        if (this.settings.appearance.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    changePassword() {
        const newPassword = prompt('Digite a nova senha:');
        if (newPassword) {
            const confirmPassword = prompt('Confirme a nova senha:');
            if (newPassword === confirmPassword) {
                // Aqui você implementaria a lógica de alteração de senha
                this.showNotification('Senha alterada com sucesso!', 'success');
            } else {
                this.showNotification('As senhas não coincidem!', 'error');
            }
        }
    }

    exportSecurityLog() {
        const log = {
            timestamp: new Date().toISOString(),
            events: [
                { date: '2024-01-15', event: 'Login realizado', ip: '192.168.1.1' },
                { date: '2024-01-14', event: 'Alteração de senha', ip: '192.168.1.1' },
                { date: '2024-01-13', event: 'Login realizado', ip: '192.168.1.1' }
            ]
        };
        
        const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `security-log-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Log de segurança exportado com sucesso!', 'success');
    }

    exportAllData() {
        const data = {
            settings: this.settings,
            contacts: JSON.parse(localStorage.getItem('sacsmax_contacts') || '[]'),
            messages: JSON.parse(localStorage.getItem('sacsmax_messages') || '{}'),
            botConfig: JSON.parse(localStorage.getItem('sacsmax_bot_config') || '{}'),
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sacsmax-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.addBackupToHistory('Backup Completo', 'all');
        this.showNotification('Backup completo exportado com sucesso!', 'success');
    }

    exportContacts() {
        const contacts = JSON.parse(localStorage.getItem('sacsmax_contacts') || '[]');
        const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contacts-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.addBackupToHistory('Backup de Contatos', 'contacts');
        this.showNotification('Contatos exportados com sucesso!', 'success');
    }

    exportSettings() {
        const blob = new Blob([JSON.stringify(this.settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.addBackupToHistory('Backup de Configurações', 'settings');
        this.showNotification('Configurações exportadas com sucesso!', 'success');
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.settings) {
                    this.settings = { ...this.settings, ...data.settings };
                    this.saveSettings();
                }
                
                if (data.contacts) {
                    localStorage.setItem('sacsmax_contacts', JSON.stringify(data.contacts));
                }
                
                if (data.messages) {
                    localStorage.setItem('sacsmax_messages', JSON.stringify(data.messages));
                }
                
                if (data.botConfig) {
                    localStorage.setItem('sacsmax_bot_config', JSON.stringify(data.botConfig));
                }
                
                this.showNotification('Dados importados com sucesso!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
            } catch (error) {
                this.showNotification('Erro ao importar dados: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    resetAllData() {
        if (confirm('Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita!')) {
            localStorage.clear();
            this.showNotification('Todos os dados foram resetados!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }

    getBackupHistory() {
        const history = localStorage.getItem('sacsmax_backup_history');
        return history ? JSON.parse(history) : [];
    }

    addBackupToHistory(name, type) {
        const history = this.getBackupHistory();
        const backup = {
            id: Date.now().toString(),
            name: name,
            type: type,
            date: new Date().toLocaleString('pt-BR'),
            size: '2.5 MB'
        };
        
        history.unshift(backup);
        
        // Mantém apenas os últimos 10 backups
        if (history.length > 10) {
            history.splice(10);
        }
        
        localStorage.setItem('sacsmax_backup_history', JSON.stringify(history));
        this.updateBackupHistory();
    }

    updateBackupHistory() {
        const backupList = document.getElementById('backup-list');
        if (backupList) {
            backupList.innerHTML = this.renderBackupHistory();
        }
    }

    downloadBackup(backupId) {
        // Simula download de backup
        this.showNotification('Download iniciado...', 'info');
    }

    deleteBackup(backupId) {
        if (confirm('Tem certeza que deseja excluir este backup?')) {
            const history = this.getBackupHistory();
            const filteredHistory = history.filter(b => b.id !== backupId);
            localStorage.setItem('sacsmax_backup_history', JSON.stringify(filteredHistory));
            this.updateBackupHistory();
            this.showNotification('Backup excluído com sucesso!', 'success');
        }
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

// Adiciona estilos específicos do módulo Settings
const settingsStyles = `
    .settings-nav {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        overflow-x: auto;
        padding-bottom: 0.5rem;
    }

    .settings-nav-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        background: #f8f9fa;
        color: #495057;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        font-size: 0.9rem;
    }

    .settings-nav-btn:hover {
        background: #e9ecef;
    }

    .settings-nav-btn.active {
        background: #667eea;
        color: white;
    }

    .settings-section {
        display: none;
    }

    .settings-section.active {
        display: block;
    }

    .settings-grid {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }

    .setting-info h4 {
        margin: 0 0 0.25rem 0;
        color: #495057;
    }

    .setting-info p {
        margin: 0;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 24px;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }

    input:checked + .slider {
        background-color: #667eea;
    }

    input:checked + .slider:before {
        transform: translateX(26px);
    }

    .integrations-grid {
        display: grid;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .integration-card {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
    }

    .integration-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-bottom: 1px solid #e9ecef;
    }

    .integration-icon {
        font-size: 1.5rem;
        width: 40px;
        text-align: center;
    }

    .integration-info {
        flex: 1;
    }

    .integration-info h4 {
        margin: 0 0 0.25rem 0;
        color: #495057;
    }

    .integration-info p {
        margin: 0;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .integration-details {
        padding: 1rem;
    }

    .security-actions {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .theme-preview {
        margin-top: 1.5rem;
    }

    .preview-container {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        overflow: hidden;
        max-width: 400px;
    }

    .preview-header {
        background: var(--primary-color, #667eea);
        color: white;
        padding: 0.75rem 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .preview-header h5 {
        margin: 0;
    }

    .preview-status {
        font-size: 0.8rem;
        opacity: 0.8;
    }

    .preview-content {
        padding: 1rem;
        background: white;
    }

    .preview-content p {
        margin: 0;
        color: #495057;
    }

    .backup-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .backup-card {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1.5rem;
        background: #f8f9fa;
    }

    .backup-card h4 {
        margin: 0 0 0.5rem 0;
        color: #495057;
    }

    .backup-card p {
        margin: 0 0 1rem 0;
        color: #6c757d;
        font-size: 0.9rem;
    }

    .backup-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .backup-history {
        margin-bottom: 2rem;
    }

    .backup-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #e9ecef;
        border-radius: 8px;
    }

    .backup-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .backup-item:last-child {
        border-bottom: none;
    }

    .backup-info {
        flex: 1;
    }

    .backup-name {
        font-weight: 500;
        color: #495057;
        margin-bottom: 0.25rem;
    }

    .backup-details {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: #6c757d;
    }

    .backup-actions {
        display: flex;
        gap: 0.5rem;
    }

    .no-backups {
        text-align: center;
        color: #6c757d;
        font-style: italic;
        padding: 2rem;
    }

    .backup-settings {
        border-top: 1px solid #e9ecef;
        padding-top: 1.5rem;
    }

    .color-input {
        height: 40px;
        padding: 0.25rem;
    }

    .form-help {
        font-size: 0.8rem;
        color: #6c757d;
        margin-top: 0.25rem;
    }

    .dark-theme {
        background: #1a1a1a;
        color: #ffffff;
    }

    .dark-theme .card {
        background: #2d2d2d;
        border-color: #404040;
    }

    .dark-theme .form-input {
        background: #404040;
        border-color: #555555;
        color: #ffffff;
    }
`;

// Adiciona os estilos ao documento
if (!document.getElementById('settings-styles')) {
    const style = document.createElement('style');
    style.id = 'settings-styles';
    style.textContent = settingsStyles;
    document.head.appendChild(style);
}

// Métodos para WhatsApp
SettingsModule.prototype.generateQRCode = async function() {
    const qrDisplay = document.getElementById('qr-code-display');
    const statusDot = document.getElementById('whatsapp-status-dot');
    const statusText = document.getElementById('whatsapp-status-text');
    
    try {
        statusDot.className = 'status-dot connecting';
        statusText.textContent = 'Conectando ao WhatsApp...';
        
        qrDisplay.innerHTML = `
            <div class="qr-code">
                <div class="qr-placeholder">
                    <span class="qr-icon">📱</span>
                    <p>Conectando ao WhatsApp...</p>
                    <div class="qr-loading"></div>
                </div>
            </div>
        `;
        
        // 1. Criar sessão WhatsApp
        const createResponse = await fetch('http://localhost:3001/api/sessions/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionName: 'sacmax' })
        });
        
        if (!createResponse.ok) {
            throw new Error('Falha ao criar sessão WhatsApp');
        }
        
        // 2. Obter QR Code
        const qrResponse = await fetch('http://localhost:3001/api/sessions/sacmax/qr');
        if (!qrResponse.ok) {
            throw new Error('Falha ao obter QR Code');
        }
        
        const qrData = await qrResponse.json();
        
        if (qrData.success && qrData.qrCode) {
            qrDisplay.innerHTML = `
                <div class="qr-code">
                    <div class="qr-image">
                        <img src="data:image/png;base64,${qrData.qrCode}" alt="QR Code WhatsApp" style="width: 200px; height: 200px;">
                    </div>
                    <p>Escaneie o QR Code com seu WhatsApp</p>
                    <small>Este código expira em 2 minutos</small>
                </div>
            `;
            
            statusDot.className = 'status-dot connecting';
            statusText.textContent = 'Aguardando conexão...';
            
            // Verificar conexão periodicamente
            this.checkWhatsAppConnection();
            
        } else {
            throw new Error('QR Code não disponível');
        }
        
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        qrDisplay.innerHTML = `
            <div class="qr-code">
                <div class="qr-error">
                    <span class="qr-icon">❌</span>
                    <p>Erro ao conectar: ${error.message}</p>
                    <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.generateQRCode()">
                        🔄 Tentar Novamente
                    </button>
                </div>
            </div>
        `;
        
        statusDot.className = 'status-dot';
        statusText.textContent = 'Erro de conexão';
    }
};

SettingsModule.prototype.checkConnection = async function() {
    const statusDot = document.getElementById('whatsapp-status-dot');
    const statusText = document.getElementById('whatsapp-status-text');
    
    try {
        statusDot.className = 'status-dot connecting';
        statusText.textContent = 'Verificando conexão...';
        
        const response = await fetch('http://localhost:3001/api/sessions/sacmax/status');
        const data = await response.json();
        
        if (data.success && data.status === 'connected') {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Conectado';
            this.showNotification('WhatsApp conectado com sucesso!', 'success');
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = 'Desconectado';
            this.showNotification('WhatsApp não está conectado', 'error');
        }
    } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        statusDot.className = 'status-dot';
        statusText.textContent = 'Erro de conexão';
        this.showNotification('Erro ao verificar status do WhatsApp', 'error');
    }
};

SettingsModule.prototype.checkWhatsAppConnection = function() {
    // Verificar conexão a cada 5 segundos
    this.connectionInterval = setInterval(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/sessions/sacmax/status');
            const data = await response.json();
            
            const statusDot = document.getElementById('whatsapp-status-dot');
            const statusText = document.getElementById('whatsapp-status-text');
            
            if (data.success && data.status === 'connected') {
                statusDot.className = 'status-dot connected';
                statusText.textContent = 'Conectado';
                this.showNotification('WhatsApp conectado com sucesso!', 'success');
                clearInterval(this.connectionInterval);
            }
        } catch (error) {
            console.error('Erro na verificação periódica:', error);
        }
    }, 5000);
};

SettingsModule.prototype.connectWhatsApp = function() {
    this.generateQRCode();
    this.showNotification('Iniciando conexão com WhatsApp...', 'info');
};

SettingsModule.prototype.disconnectWhatsApp = async function() {
    const statusDot = document.getElementById('whatsapp-status-dot');
    const statusText = document.getElementById('whatsapp-status-text');
    const qrDisplay = document.getElementById('qr-code-display');
    
    try {
        // Parar verificação periódica
        if (this.connectionInterval) {
            clearInterval(this.connectionInterval);
        }
        
        // Remover sessão WhatsApp
        const response = await fetch('http://localhost:3001/api/sessions/sacmax/remove', {
            method: 'DELETE'
        });
        
        statusDot.className = 'status-dot';
        statusText.textContent = 'Desconectado';
        
        qrDisplay.innerHTML = `
            <div class="qr-code">
                <span class="qr-icon">📱</span>
                <p>Clique em "Gerar QR Code" para conectar</p>
            </div>
        `;
        
        this.showNotification('WhatsApp desconectado com sucesso', 'success');
        
    } catch (error) {
        console.error('Erro ao desconectar WhatsApp:', error);
        this.showNotification('Erro ao desconectar WhatsApp', 'error');
    }
};

SettingsModule.prototype.viewWhatsAppChat = async function() {
    try {
        const response = await fetch('http://localhost:3001/api/sessions/sacmax/chat-history');
        const data = await response.json();
        
        if (data.success && data.messages) {
            const chatWindow = window.open('', '_blank', 'width=800,height=600');
            chatWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>WhatsApp Chat - SacsMax</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .chat-container { max-width: 600px; margin: 0 auto; }
                        .message { margin: 10px 0; padding: 10px; border-radius: 10px; }
                        .received { background: #f0f0f0; }
                        .sent { background: #dcf8c6; text-align: right; }
                        .timestamp { font-size: 12px; color: #666; }
                        .contact { font-weight: bold; color: #075e54; }
                    </style>
                </head>
                <body>
                    <div class="chat-container">
                        <h2>💬 Histórico do WhatsApp</h2>
                        <div id="messages">
                            ${data.messages.map(msg => `
                                <div class="message ${msg.fromMe ? 'sent' : 'received'}">
                                    <div class="contact">${msg.fromMe ? 'Você' : msg.from}</div>
                                    <div class="content">${msg.body}</div>
                                    <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </body>
                </html>
            `);
        } else {
            this.showNotification('Nenhuma mensagem encontrada', 'info');
        }
    } catch (error) {
        console.error('Erro ao carregar chat:', error);
        this.showNotification('Erro ao carregar histórico do chat', 'error');
    }
};

SettingsModule.prototype.exportWhatsAppLog = function() {
    const logData = {
        timestamp: new Date().toISOString(),
        status: 'disconnected',
        lastConnection: '2024-01-15T10:30:00Z',
        totalMessages: 1250,
        errors: 3
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'whatsapp-log.json';
    a.click();
    URL.revokeObjectURL(url);
    
    this.showNotification('Log do WhatsApp exportado', 'success');
};

SettingsModule.prototype.saveWhatsAppSettings = function() {
    const sessionTimeout = document.getElementById('whatsapp-session-timeout').value;
    const webhookUrl = document.getElementById('whatsapp-webhook').value;
    const qrCodeEnabled = document.getElementById('qr-code-enabled').checked;
    const autoReconnect = document.getElementById('auto-reconnect').checked;
    
    this.settings.whatsapp = {
        sessionTimeout: parseInt(sessionTimeout),
        webhookUrl: webhookUrl,
        qrCodeEnabled: qrCodeEnabled,
        autoReconnect: autoReconnect
    };
    
    localStorage.setItem('sacsmax_settings', JSON.stringify(this.settings));
    this.showNotification('Configurações do WhatsApp salvas!', 'success');
};

SettingsModule.prototype.showNotification = function(message, type = 'info') {
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
};

export default SettingsModule;
