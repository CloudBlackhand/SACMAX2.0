// SacsMax - Sistema de Gestão de SAC
// Versão 2.0 - Frontend Principal

// Função utilitária global para formatação de data/hora com fuso horário fixo de São Paulo
function formatDateTime(date, options = {}) {
    const defaultOptions = {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };
    
    try {
        return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(date);
    } catch (error) {
        // Fallback para caso o fuso horário não seja suportado
        return date.toLocaleTimeString('pt-BR', defaultOptions);
    }
}

function formatTime(date) {
    return formatDateTime(date, { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    return formatDateTime(date, { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

class SacsMaxApp {
    constructor() {
        this.currentModule = null;
        this.modules = {};
        this.init();
    }

    init() {
        // Aguarda o DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.createAppStructure();
        this.loadModules();
        this.setupNavigation();
        this.setupEventListeners();
        this.loadDefaultModule();
    }

    createAppStructure() {
        // Remove qualquer conteúdo existente
        document.body.innerHTML = '';
        
        // Cria a estrutura principal da aplicação
        const appContainer = document.createElement('div');
        appContainer.id = 'sacsmax-app';
        appContainer.className = 'app-container';
        
        // Header
        const header = document.createElement('header');
        header.className = 'app-header';
        header.innerHTML = `
            <div class="logo">
                <h1>📞 SacsMax</h1>
                <span>Sistema de Gestão de SAC - Desktop</span>
            </div>
            <nav class="main-nav">
                <button class="nav-btn active" data-module="excel">
                    <span class="icon">📁</span>
                    Upload Excel
                </button>
                <button class="nav-btn" data-module="bot">
                    <span class="icon">🤖</span>
                    Configurar Bot
                </button>
                <button class="nav-btn" data-module="whatsapp">
                    <span class="icon">💬</span>
                    WhatsApp
                </button>
                <button class="nav-btn" data-module="produtividade">
                    <span class="icon">📊</span>
                    Produtividade
                </button>
                <button class="nav-btn" data-module="messages">
                    <span class="icon">📤</span>
                    Disparo de Mensagens
                </button>
                <button class="nav-btn" data-module="feedback">
                    <span class="icon">📊</span>
                    Feedbacks
                </button>
                <button class="nav-btn" data-module="settings">
                    <span class="icon">⚙️</span>
                    Configurações
                </button>
            </nav>
            <div class="user-info">
                <span class="user-name">Técnico</span>
                <button class="logout-btn" id="logout-btn">🚪</button>
            </div>
        `;
        
        // Main content area
        const main = document.createElement('main');
        main.className = 'app-main';
        main.id = 'app-content';
        
        // Loading indicator
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.innerHTML = `
            <div class="spinner"></div>
            <p>Carregando SacsMax...</p>
        `;
        main.appendChild(loading);
        
        appContainer.appendChild(header);
        appContainer.appendChild(main);
        document.body.appendChild(appContainer);
        
        // Aplica estilos
        this.applyStyles();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
            }

            .app-container {
                display: flex;
                flex-direction: column;
                height: 100vh;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
            }

            .app-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(90deg, #2c3e50, #3498db);
                color: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                min-height: 4rem;
                max-height: 5rem;
            }

            .logo h1 {
                font-size: 1.5rem;
                margin-bottom: 0.1rem;
                line-height: 1.2;
            }

            .logo span {
                font-size: 0.8rem;
                opacity: 0.8;
                line-height: 1.1;
            }

            .main-nav {
                display: flex;
                gap: 0.4rem;
                flex-wrap: wrap;
                justify-content: center;
            }

            .nav-btn {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.6rem 1rem;
                border: none;
                background: rgba(255,255,255,0.1);
                color: white;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.8rem;
                white-space: nowrap;
                min-width: fit-content;
            }

            .nav-btn:hover {
                background: rgba(255,255,255,0.2);
                transform: translateY(-1px);
            }

            .nav-btn.active {
                background: rgba(255,255,255,0.3);
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }

            .nav-btn .icon {
                font-size: 1rem;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .user-name {
                font-weight: 500;
            }

            .logout-btn {
                background: rgba(255,255,255,0.1);
                border: none;
                color: white;
                padding: 0.5rem;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1.2rem;
            }

            .logout-btn:hover {
                background: rgba(255,255,255,0.2);
                transform: scale(1.1);
            }

            .app-main {
                flex: 1;
                padding: 1.5rem;
                overflow-y: auto;
                background: #f8f9fa;
            }

            .loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                gap: 1rem;
            }

            .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .module-container {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                min-height: 500px;
            }

            .module-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #e9ecef;
            }

            .module-icon {
                font-size: 2rem;
            }

            .module-title {
                font-size: 1.8rem;
                color: #2c3e50;
                margin: 0;
            }

            .fade-in {
                animation: fadeIn 0.5s ease-in;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Responsividade para telas menores */
            @media (max-width: 1200px) {
                .app-header {
                    padding: 0.6rem 1rem;
                }
                
                .logo h1 {
                    font-size: 1.3rem;
                }
                
                .logo span {
                    font-size: 0.7rem;
                }
                
                .nav-btn {
                    padding: 0.5rem 0.8rem;
                    font-size: 0.75rem;
                }
                
                .nav-btn .icon {
                    font-size: 0.9rem;
                }
            }

            @media (max-width: 768px) {
                .app-header {
                    flex-direction: column;
                    padding: 0.5rem;
                    min-height: auto;
                    max-height: none;
                }
                
                .logo {
                    margin-bottom: 0.5rem;
                }
                
                .logo h1 {
                    font-size: 1.2rem;
                }
                
                .main-nav {
                    gap: 0.3rem;
                    width: 100%;
                    justify-content: center;
                }
                
                .nav-btn {
                    padding: 0.4rem 0.6rem;
                    font-size: 0.7rem;
                    flex: 1;
                    min-width: auto;
                    max-width: 120px;
                }
                
                .nav-btn .icon {
                    font-size: 0.8rem;
                }
                
                .user-info {
                    margin-top: 0.5rem;
                }
                
                .app-main {
                    padding: 1rem;
                }
            }

            @media (max-width: 480px) {
                .app-header {
                    padding: 0.4rem;
                }
                
                .logo h1 {
                    font-size: 1.1rem;
                }
                
                .logo span {
                    font-size: 0.6rem;
                }
                
                .main-nav {
                    gap: 0.2rem;
                }
                
                .nav-btn {
                    padding: 0.3rem 0.5rem;
                    font-size: 0.65rem;
                    max-width: 100px;
                }
                
                .nav-btn .icon {
                    font-size: 0.7rem;
                }
            }

            .alert {
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
            }

            .alert-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }

            .btn-primary {
                background: #3498db;
                color: white;
            }

            .btn-primary:hover {
                background: #2980b9;
                transform: translateY(-2px);
            }

            .btn-secondary {
                background: #95a5a6;
                color: white;
            }

            .btn-secondary:hover {
                background: #7f8c8d;
                transform: translateY(-2px);
            }

            .btn-success {
                background: #27ae60;
                color: white;
            }

            .btn-success:hover {
                background: #229954;
                transform: translateY(-2px);
            }

            .btn-danger {
                background: #e74c3c;
                color: white;
            }

            .btn-danger:hover {
                background: #c0392b;
                transform: translateY(-2px);
            }

            .btn-info {
                background: #17a2b8;
                color: white;
            }

            .btn-info:hover {
                background: #138496;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(style);
    }

    loadModules() {
        // Carrega todos os módulos diretamente (sem import dinâmico)
        const moduleNames = ['excel', 'bot', 'whatsapp', 'produtividade', 'messages', 'feedback', 'settings'];
        
        for (const moduleName of moduleNames) {
            try {
                const module = this.loadModule(moduleName);
                this.modules[moduleName] = module;
            } catch (error) {
                console.error(`Erro ao carregar módulo ${moduleName}:`, error);
                // Cria um módulo de fallback
                this.modules[moduleName] = this.createFallbackModule(moduleName);
            }
        }
    }

    loadModule(moduleName) {
        // Carregamento direto dos módulos (sem import dinâmico)
        const moduleMap = {
            excel: () => new ExcelModule(),
            bot: () => new BotModule(),
            whatsapp: () => new WhatsAppModule(),
            produtividade: () => new ProdutividadeModule(),
            messages: () => new MessagesModule(),
            feedback: () => new FeedbackModule(),
            settings: () => new SettingsModule()
        };

        if (moduleMap[moduleName]) {
            try {
                const module = moduleMap[moduleName]();
                console.log(`✅ Módulo ${moduleName} carregado com sucesso`);
                return module;
            } catch (error) {
                console.error(`❌ Erro ao carregar módulo ${moduleName}:`, error);
                return this.createFallbackModule(moduleName);
            }
        }
        
        return this.createFallbackModule(moduleName);
    }

    createFallbackModule(moduleName) {
        return {
            render: () => {
                return `
                    <div class="module-container fade-in">
                        <div class="module-header">
                            <span class="module-icon">⚠️</span>
                            <h2 class="module-title">Módulo ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}</h2>
                        </div>
                        <div class="alert alert-error">
                            <strong>Erro:</strong> Este módulo não pôde ser carregado. 
                            Verifique se o arquivo <code>modules/${moduleName}.js</code> existe.
                        </div>
                    </div>
                `;
            },
            init: () => console.log(`Módulo ${moduleName} inicializado (fallback)`),
            destroy: () => console.log(`Módulo ${moduleName} destruído (fallback)`)
        };
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const moduleName = btn.dataset.module;
                this.switchModule(moduleName);
                
                // Atualiza botões ativos
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    setupEventListeners() {
        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Tem certeza que deseja sair?')) {
                    this.logout();
                }
            });
        }

        // Teclas de atalho
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchModule('excel');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchModule('excel');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchModule('whatsapp');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchModule('bot');
                        break;
                    case '5':
                        e.preventDefault();
                        this.switchModule('contacts');
                        break;
                    case '6':
                        e.preventDefault();
                        this.switchModule('messages');
                        break;
                    case '7':
                        e.preventDefault();
                        this.switchModule('settings');
                        break;
                }
            }
        });
    }

    switchModule(moduleName) {
        try {
            // Destrói módulo atual
            if (this.currentModule && this.modules[this.currentModule] && this.modules[this.currentModule].destroy) {
                this.modules[this.currentModule].destroy();
            }

            // Carrega novo módulo
            const module = this.modules[moduleName];
            if (!module) {
                throw new Error(`Módulo ${moduleName} não encontrado`);
            }

            // Verifica se o módulo tem método render
            if (typeof module.render !== 'function') {
                throw new Error(`Módulo ${moduleName} não tem método render`);
            }

            const content = document.getElementById('app-content');
            if (!content) {
                throw new Error('Elemento app-content não encontrado');
            }

            content.innerHTML = module.render();
            
            // Inicializa o módulo
            if (module.init && typeof module.init === 'function') {
                module.init();
            }

            this.currentModule = moduleName;
            
            // Adiciona classe de animação
            const container = content.querySelector('.module-container');
            if (container) {
                container.classList.add('fade-in');
            }

        } catch (error) {
            console.error('Erro ao trocar módulo:', error);
            this.showError('Erro ao carregar módulo: ' + error.message);
        }
    }

    loadDefaultModule() {
        this.switchModule('excel');
    }

    showError(message) {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="module-container">
                <div class="alert alert-error">
                    <strong>Erro:</strong> ${message}
                </div>
                <button class="btn btn-primary" onclick="location.reload()">
                    🔄 Recarregar Aplicação
                </button>
            </div>
        `;
    }

    // Método para atualizar apenas o conteúdo do módulo atual
    updateCurrentModule() {
        if (this.currentModule && this.modules[this.currentModule]) {
            const module = this.modules[this.currentModule];
            const content = document.getElementById('app-content');
            if (content && typeof module.render === 'function') {
                content.innerHTML = module.render();
                if (module.init && typeof module.init === 'function') {
                    module.init();
                }
            }
        }
    }

    logout() {
        // Limpa dados da sessão
        localStorage.removeItem('sacsmax_token');
        localStorage.removeItem('sacsmax_user');
        
        // Redireciona para login (ou recarrega)
        window.location.reload();
    }
}

// Inicializa a aplicação quando o script for carregado
const app = new SacsMaxApp();

// Exporta para uso global
window.SacsMaxApp = app;
