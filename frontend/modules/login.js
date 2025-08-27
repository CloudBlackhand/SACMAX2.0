// Módulo de Login Simples
class LoginModule {
    constructor() {
        this.backendUrl = window.location.origin;
        this.isLoggedIn = false;
        this.currentUser = null;
        this.sessionToken = localStorage.getItem('session_token');
    }

    render() {
        return `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-logo">
                            <h1>🔐 SacsMax</h1>
                            <p>Sistema de Gestão de SAC</p>
                        </div>
                    </div>
                    
                    <div class="login-form">
                        <div class="form-group">
                            <label for="username">👤 Usuário</label>
                            <input type="text" id="username" placeholder="Digite seu usuário" />
                        </div>
                        
                        <div class="form-group">
                            <label for="password">🔒 Senha</label>
                            <input type="password" id="password" placeholder="Digite sua senha" />
                        </div>
                        
                        <button class="btn btn-primary login-btn" onclick="loginModule.authenticate()">
                            🚀 Entrar
                        </button>
                        
                        <div class="login-info">
                            <p><strong>Usuários de teste:</strong></p>
                            <ul>
                                <li><strong>admin</strong> / admin123</li>
                                <li><strong>user</strong> / user123</li>
                                <li><strong>manager</strong> / manager123</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        // Verificar se já está logado
        if (this.sessionToken) {
            const isValid = await this.validateSession();
            if (isValid) {
                this.showMainApp();
                return;
            } else {
                localStorage.removeItem('session_token');
                this.sessionToken = null;
            }
        }
        
        this.showLoginScreen();
    }

    showLoginScreen() {
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = this.render();
            this.setupEventListeners();
        } else {
            // Fallback: criar container se não existir
            const container = document.createElement('div');
            container.id = 'app';
            document.body.appendChild(container);
            container.innerHTML = this.render();
            this.setupEventListeners();
        }
    }

    showMainApp() {
        // Limpar container de login
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = '';
        }
        
        // Inicializar a aplicação principal
        if (window.SacsMaxApp) {
            window.SacsMaxApp.setupApp();
        }
    }

    setupEventListeners() {
        setTimeout(() => {
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            if (usernameInput && passwordInput) {
                // Enter para fazer login
                const handleEnter = (e) => {
                    if (e.key === 'Enter') {
                        this.authenticate();
                    }
                };
                
                usernameInput.addEventListener('keypress', handleEnter);
                passwordInput.addEventListener('keypress', handleEnter);
                
                // Focar no primeiro campo
                usernameInput.focus();
            }
        }, 100);
    }

    async authenticate() {
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!username || !password) {
            this.showNotification('Preencha usuário e senha', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${this.backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Salvar token e dados do usuário
                this.sessionToken = data.session_token;
                this.currentUser = data.user;
                this.isLoggedIn = true;
                
                localStorage.setItem('session_token', this.sessionToken);
                localStorage.setItem('user_data', JSON.stringify(this.currentUser));
                
                this.showNotification('Login realizado com sucesso!', 'success');
                
                // Mostrar aplicação principal
                setTimeout(() => {
                    this.showMainApp();
                }, 1000);
                
            } else {
                this.showNotification(data.message || 'Erro no login', 'error');
            }
            
        } catch (error) {
            console.error('Erro no login:', error);
            this.showNotification('Erro de conexão', 'error');
        }
    }

    async validateSession() {
        if (!this.sessionToken) return false;
        
        try {
            const response = await fetch(`${this.backendUrl}/api/auth/validate?session_token=${this.sessionToken}`);
            const data = await response.json();
            
            if (data.success && data.valid) {
                this.currentUser = data.user;
                this.isLoggedIn = true;
                return true;
            } else {
                return false;
            }
            
        } catch (error) {
            console.error('Erro na validação de sessão:', error);
            return false;
        }
    }

    async logout() {
        if (this.sessionToken) {
            try {
                await fetch(`${this.backendUrl}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ session_token: this.sessionToken })
                });
            } catch (error) {
                console.error('Erro no logout:', error);
            }
        }
        
        // Limpar dados locais
        localStorage.removeItem('session_token');
        localStorage.removeItem('user_data');
        
        this.sessionToken = null;
        this.currentUser = null;
        this.isLoggedIn = false;
        
        // Voltar para tela de login
        this.showLoginScreen();
    }

    showNotification(message, type = 'info') {
        // Criar notificação simples
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Instância global
window.loginModule = new LoginModule();
