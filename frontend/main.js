// SacsMax Frontend - Sistema de Gestão de SAC
// Arquivo principal - Ponto de entrada da aplicação

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
                <button class="nav-btn active" data-module="dashboard">
                    <span class="icon">📊</span>
                    Dashboard
                </button>
                <button class="nav-btn" data-module="excel">
                    <span class="icon">📁</span>
                    Upload Excel
                </button>
                <button class="nav-btn" data-module="whatsapp">
                    <span class="icon">💬</span>
                    WhatsApp
                </button>
                <button class="nav-btn" data-module="bot">
                    <span class="icon">🤖</span>
                    Configurar Bot
                </button>
                <button class="nav-btn" data-module="contacts">
                    <span class="icon">👥</span>
                    Contatos
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
                <button class="nav-btn" data-module="feedback">
                    <span class="icon">📊</span>
                    Feedback
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
                padding: 1rem 2rem;
                background: linear-gradient(90deg, #2c3e50, #3498db);
                color: white;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .logo h1 {
                font-size: 1.8rem;
                margin-bottom: 0.2rem;
            }

            .logo span {
                font-size: 0.9rem;
                opacity: 0.8;
            }

            .main-nav {
                display: flex;
                gap: 0.5rem;
            }

            .nav-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.5rem;
                border: none;
                background: rgba(255,255,255,0.1);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .nav-btn:hover {
                background: rgba(255,255,255,0.2);
                transform: translateY(-2px);
            }

            .nav-btn.active {
                background: rgba(255,255,255,0.3);
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }

            .nav-btn .icon {
                font-size: 1.2rem;
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
                padding: 2rem;
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

            /* Estilos para o módulo de mensagens */
            .messages-grid {
                display: grid;
                gap: 2rem;
            }

            .filter-section, .results-section, .message-section, .actions-section, .history-section {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1.5rem;
                border: 1px solid #e9ecef;
            }

            .filter-controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }

            .filter-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .filter-group label {
                font-weight: 500;
                color: #495057;
            }

            .contacts-list {
                max-height: 300px;
                overflow-y: auto;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                background: white;
            }

            .contact-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                border-bottom: 1px solid #f1f3f4;
                transition: background-color 0.2s;
            }

            .contact-item:hover {
                background-color: #f8f9fa;
            }

            .contact-item:last-child {
                border-bottom: none;
            }

            .contact-info {
                flex: 1;
            }

            .contact-name {
                font-weight: 600;
                color: #2c3e50;
            }

            .contact-phone, .contact-email {
                font-size: 0.9rem;
                color: #6c757d;
                margin-top: 0.25rem;
            }

            .contact-meta {
                display: flex;
                gap: 0.5rem;
                margin-right: 1rem;
            }

            .contact-status {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 500;
            }

            .contact-status.active {
                background: #d4edda;
                color: #155724;
            }

            .contact-status.inactive {
                background: #f8d7da;
                color: #721c24;
            }

            .contact-group {
                padding: 0.25rem 0.5rem;
                background: #e2e3e5;
                border-radius: 4px;
                font-size: 0.8rem;
            }

            .message-config {
                display: grid;
                gap: 1.5rem;
            }

            .template-selector, .message-editor, .scheduling {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .message-variables {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: #e9ecef;
                border-radius: 4px;
                font-size: 0.85rem;
            }

            .schedule-options {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .schedule-options label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
            }

            .action-buttons {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .history-list {
                max-height: 200px;
                overflow-y: auto;
            }

            .history-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                border-bottom: 1px solid #f1f3f4;
            }

            .history-info {
                flex: 1;
            }

            .history-contact {
                font-weight: 600;
                color: #2c3e50;
            }

            .history-phone, .history-time {
                font-size: 0.85rem;
                color: #6c757d;
            }

            .history-status {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 500;
            }

            .history-status.sent {
                background: #d4edda;
                color: #155724;
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: #6c757d;
                text-align: center;
            }

            .empty-state .icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }

            /* Progress overlay */
            .progress-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .progress-container {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                min-width: 300px;
            }

            .progress-message {
                margin-bottom: 1rem;
                font-weight: 500;
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
                background: linear-gradient(135deg, #667eea, #764ba2);
                width: 0%;
                transition: width 0.3s ease;
            }

            /* Modal */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            }

            .modal {
                background: white;
                border-radius: 12px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                width: 90%;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid #e9ecef;
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6c757d;
            }

            .modal-content {
                padding: 1.5rem;
            }

            .preview-container {
                max-height: 400px;
                overflow-y: auto;
            }

            .message-preview {
                padding: 1rem;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                margin-bottom: 1rem;
                background: #f8f9fa;
            }

            /* Estilos para WhatsApp Settings */
            .qr-code-section {
                margin-bottom: 2rem;
            }

            .qr-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                padding: 2rem;
                border: 2px dashed #dee2e6;
                border-radius: 12px;
                background: #f8f9fa;
            }

            .qr-code-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                padding: 2rem;
                color: #6c757d;
            }

            .qr-icon {
                font-size: 4rem;
            }

            .qr-actions {
                display: flex;
                gap: 1rem;
            }

            .whatsapp-status {
                margin: 1.5rem 0;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #dc3545;
            }

            .status-dot.connected {
                background: #28a745;
            }

            .status-dot.connecting {
                background: #ffc107;
                animation: pulse 1s infinite;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .whatsapp-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }

            /* Notificações */
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 1rem;
                min-width: 300px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
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
                color: #212529;
            }

            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                margin-left: auto;
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

            .module-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #e9ecef;
            }

            .module-title {
                font-size: 1.8rem;
                font-weight: 600;
                color: #2c3e50;
            }

            .module-icon {
                font-size: 2rem;
            }

            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }

            .btn-primary {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }

            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
            }

            .btn-success {
                background: #28a745;
                color: white;
            }

            .btn-danger {
                background: #dc3545;
                color: white;
            }

            .card {
                background: white;
                border-radius: 8px;
                padding: 1.5rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-bottom: 1rem;
            }

            .form-group {
                margin-bottom: 1.5rem;
            }

            .form-label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #495057;
            }

            .form-input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s ease;
            }

            .form-input:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            .grid {
                display: grid;
                gap: 1.5rem;
            }

            .grid-2 {
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            }

            .grid-3 {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }

            .alert {
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
            }

            .alert-success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .alert-error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .alert-info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }

            .hidden {
                display: none !important;
            }

            .fade-in {
                animation: fadeIn 0.5s ease-in;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Estilos adicionais para os módulos */
            .stat-value {
                font-size: 2rem;
                font-weight: bold;
                color: #2c3e50;
                margin: 0.5rem 0;
            }

            .stat-change {
                font-size: 0.9rem;
                font-weight: 500;
            }

            .stat-change.positive {
                color: #28a745;
            }

            .stat-change.negative {
                color: #dc3545;
            }

            .upload-area {
                border: 2px dashed #dee2e6;
                border-radius: 12px;
                padding: 3rem;
                text-align: center;
                background: #f8f9fa;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .upload-area:hover, .upload-area.dragover {
                border-color: #667eea;
                background: #e8f4fd;
            }

            .upload-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                display: block;
            }

            .whatsapp-container {
                display: grid;
                grid-template-columns: 300px 1fr;
                gap: 2rem;
                height: 600px;
            }

            .contacts-list {
                background: white;
                border-radius: 8px;
                padding: 1rem;
                border: 1px solid #e9ecef;
            }

            .contact-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                border-radius: 8px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .contact-item:hover, .contact-item.active {
                background: #f8f9fa;
            }

            .contact-avatar {
                width: 40px;
                height: 40px;
                background: #667eea;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }

            .chat-area {
                background: white;
                border-radius: 8px;
                border: 1px solid #e9ecef;
                display: flex;
                flex-direction: column;
            }

            .chat-header {
                padding: 1rem;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .messages-area {
                flex: 1;
                padding: 1rem;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .message {
                max-width: 70%;
                padding: 0.75rem;
                border-radius: 12px;
                word-wrap: break-word;
            }

            .message.incoming {
                background: #f1f3f4;
                align-self: flex-start;
            }

            .message.outgoing {
                background: #667eea;
                color: white;
                align-self: flex-end;
            }

            .message-time {
                font-size: 0.8rem;
                opacity: 0.7;
                margin-top: 0.25rem;
            }

            .message-input {
                padding: 1rem;
                border-top: 1px solid #e9ecef;
                display: flex;
                gap: 0.5rem;
            }

            .message-input input {
                flex: 1;
                padding: 0.75rem;
                border: 1px solid #e9ecef;
                border-radius: 8px;
            }

            .message-input button {
                padding: 0.75rem 1rem;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }

            .no-chat {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #6c757d;
            }

            .no-chat .icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }

            .contacts-toolbar {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
                align-items: center;
            }

            .contacts-table table {
                width: 100%;
                border-collapse: collapse;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }

            .contacts-table th,
            .contacts-table td {
                padding: 1rem;
                text-align: left;
                border-bottom: 1px solid #e9ecef;
            }

            .contacts-table th {
                background: #f8f9fa;
                font-weight: 600;
                color: #495057;
            }

            .status-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 500;
            }

            .status-badge.active {
                background: #d4edda;
                color: #155724;
            }

            .status-badge.inactive {
                background: #f8d7da;
                color: #721c24;
            }

            .settings-nav {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 2rem;
                border-bottom: 1px solid #e9ecef;
            }

            .settings-nav-btn {
                padding: 1rem 2rem;
                border: none;
                background: none;
                cursor: pointer;
                border-bottom: 3px solid transparent;
                transition: all 0.3s ease;
            }

            .settings-nav-btn.active {
                border-bottom-color: #667eea;
                color: #667eea;
                font-weight: 600;
            }

            .settings-section {
                display: none;
            }

            .settings-section.active {
                display: block;
            }

            .form-control {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e9ecef;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s ease;
            }

            .form-control:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }

            /* Estilos para WhatsApp Connection */
            .whatsapp-status-indicator {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-left: auto;
            }

            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #dc3545;
            }

            .status-dot.connected {
                background: #28a745;
            }

            .status-dot.connecting {
                background: #ffc107;
                animation: pulse 1s infinite;
            }

            .whatsapp-connection {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 400px;
            }

            .connection-card {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 100%;
            }

            .connection-card h3 {
                margin-bottom: 1rem;
                color: #2c3e50;
            }

            .connection-card p {
                margin-bottom: 2rem;
                color: #6c757d;
            }

            .qr-container {
                margin: 2rem 0;
                padding: 2rem;
                border: 2px dashed #dee2e6;
                border-radius: 12px;
                background: #f8f9fa;
            }

            .loading-qr {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                color: #6c757d;
            }

            .loading-qr .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .contacts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .whatsapp-actions {
                margin-top: 2rem;
                text-align: center;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Estilos para Google Sheets */
            .upload-tabs {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 1rem;
            }

            .tab-btn {
                background: none;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                color: #6c757d;
                transition: all 0.3s ease;
            }

            .tab-btn.active {
                background: #667eea;
                color: white;
            }

            .tab-btn:hover:not(.active) {
                background: #f8f9fa;
                color: #495057;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            .sheets-connection {
                max-width: 800px;
                margin: 0 auto;
            }

            .sheets-form {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                margin-bottom: 2rem;
            }

            .sheets-form h3 {
                margin-bottom: 1rem;
                color: #2c3e50;
            }

            .sheets-form p {
                margin-bottom: 2rem;
                color: #6c757d;
            }

            .sheets-preview {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }

            .sheets-info {
                background: #f8f9fa;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1.5rem;
            }

            .sheets-info p {
                margin: 0.5rem 0;
                color: #495057;
            }

            .sheets-sample h4 {
                margin-bottom: 1rem;
                color: #2c3e50;
            }

            .table-container {
                overflow-x: auto;
                border: 1px solid #dee2e6;
                border-radius: 8px;
            }

            .data-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.9rem;
            }

            .data-table th,
            .data-table td {
                padding: 0.75rem;
                text-align: left;
                border-bottom: 1px solid #dee2e6;
            }

            .data-table th {
                background: #f8f9fa;
                font-weight: 600;
                color: #495057;
            }

            .data-table tr:hover {
                background: #f8f9fa;
            }

            .sheets-actions {
                margin-top: 2rem;
                display: flex;
                gap: 1rem;
                justify-content: center;
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

            /* Estilos para opções de autenticação */
            .auth-options {
                margin: 1.5rem 0;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }

            .auth-option {
                display: flex;
                align-items: flex-start;
                margin-bottom: 1rem;
                padding: 0.75rem;
                border-radius: 6px;
                transition: background-color 0.2s;
            }

            .auth-option:hover {
                background: #e9ecef;
            }

            .auth-option:last-child {
                margin-bottom: 0;
            }

            .auth-option input[type="radio"] {
                margin-right: 0.75rem;
                margin-top: 0.25rem;
            }

            .auth-option label {
                flex: 1;
                cursor: pointer;
                line-height: 1.4;
            }

            .auth-option strong {
                color: #2c3e50;
                display: block;
                margin-bottom: 0.25rem;
            }

            .auth-option small {
                color: #6c757d;
                font-size: 0.875rem;
            }

            /* Estilos específicos para o módulo de contatos */
            .module-stats {
                display: flex;
                gap: 1rem;
                margin-left: auto;
            }

            .stat-badge {
                background: rgba(255,255,255,0.2);
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 500;
            }

            .loading-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                color: #6c757d;
            }

            .loading-container .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }

            .contacts-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                gap: 1rem;
            }

            .search-section {
                flex: 1;
                max-width: 400px;
            }

            .actions-section {
                display: flex;
                gap: 0.5rem;
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem;
                color: #6c757d;
                text-align: center;
            }

            .empty-state .icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }

            .empty-state h3 {
                margin-bottom: 0.5rem;
                color: #495057;
            }
        `;
        document.head.appendChild(style);
    }

    loadModules() {
        // Carrega todos os módulos diretamente (sem import dinâmico)
        const moduleNames = ['dashboard', 'excel', 'whatsapp', 'bot', 'contacts', 'messages', 'feedback', 'settings'];
        
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
            dashboard: () => new DashboardModule(),
            excel: () => new ExcelModule(),
            whatsapp: () => new WhatsAppModule(),
            bot: () => new BotModule(),
            contacts: () => {
                console.log('🔧 Carregando módulo Contacts v2.1...');
                return new ContactsModule();
            },
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
                        this.switchModule('dashboard');
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
            // Atualiza a referência do módulo atual
            this.modules[moduleName] = module;
            
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
        this.switchModule('dashboard');
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

// ========================================
// MÓDULOS DA APLICAÇÃO
// ========================================

// Dashboard Module
class DashboardModule {
    constructor() {
        this.stats = {
            totalContacts: 1250,
            activeChats: 45,
            pendingMessages: 12,
            totalRevenue: 125000
        };
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">📊</span>
                    <h2 class="module-title">Dashboard</h2>
                </div>
                
                <div class="grid grid-3">
                    <div class="card">
                        <h3>👥 Total de Contatos</h3>
                        <div class="stat-value">${this.stats.totalContacts.toLocaleString()}</div>
                        <div class="stat-change positive">+12% este mês</div>
                    </div>
                    
                    <div class="card">
                        <h3>💬 Chats Ativos</h3>
                        <div class="stat-value">${this.stats.activeChats}</div>
                        <div class="stat-change positive">+5 hoje</div>
                    </div>
                    
                    <div class="card">
                        <h3>📨 Mensagens Pendentes</h3>
                        <div class="stat-value">${this.stats.pendingMessages}</div>
                        <div class="stat-change negative">-3 desde ontem</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>📈 Receita Total</h3>
                    <div class="stat-value">R$ ${this.stats.totalRevenue.toLocaleString()}</div>
                    <canvas id="revenue-chart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
    }

    init() {
        this.drawChart();
    }

    drawChart() {
        const canvas = document.getElementById('revenue-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = [12000, 15000, 18000, 22000, 25000, 28000];
        
        ctx.fillStyle = '#667eea';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Desenha gráfico simples
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * canvas.width;
            const y = canvas.height - (value / 30000) * canvas.height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    }

    destroy() {
        // Cleanup se necessário
    }
}

// Excel Module
class ExcelModule {
    constructor() {
        this.uploadHistory = [];
        this.googleSheetsData = null;
        this.isLoading = false;
        this.errorMessage = null;
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">📁</span>
                    <h2 class="module-title">Upload Excel & Google Sheets</h2>
                </div>
                
                <!-- Tabs para diferentes tipos de upload -->
                <div class="upload-tabs">
                    <button class="tab-btn active" data-tab="excel" onclick="window.SacsMaxApp.currentModule.switchTab('excel')">
                        📁 Upload Excel
                    </button>
                    <button class="tab-btn" data-tab="sheets" onclick="window.SacsMaxApp.currentModule.switchTab('sheets')">
                        📊 Google Sheets
                    </button>
                </div>
                
                <!-- Tab Excel -->
                <div id="excel-tab" class="tab-content active">
                    <div class="upload-area" id="upload-area">
                        <div class="upload-content">
                            <span class="upload-icon">📁</span>
                            <h3>Arraste e solte arquivos Excel aqui</h3>
                            <p>ou clique para selecionar</p>
                            <input type="file" id="file-input" accept=".xlsx,.xls" style="display: none;">
                        </div>
                    </div>
                </div>
                
                <!-- Tab Google Sheets -->
                <div id="sheets-tab" class="tab-content">
                    <div class="sheets-connection">
                        <div class="sheets-form">
                            <h3>🔗 Conectar Google Sheets</h3>
                            <p>Escolha como conectar com sua planilha</p>
                            
                            <!-- Opções de Autenticação -->
                            <div class="auth-options">
                                <div class="auth-option">
                                    <input type="radio" id="auth-app" name="auth-type" value="app" checked>
                                    <label for="auth-app">
                                        <strong>🔐 Autenticação da Aplicação</strong><br>
                                        <small>Para planilhas compartilhadas com o email da aplicação</small>
                                    </label>
                                </div>
                                
                                <div class="auth-option">
                                    <input type="radio" id="auth-user" name="auth-type" value="user">
                                    <label for="auth-user">
                                        <strong>👤 Sua Conta Google</strong><br>
                                        <small>Para planilhas privadas - você fará login</small>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">URL da Planilha</label>
                                <input type="url" id="sheets-url" class="form-input" 
                                       placeholder="https://docs.google.com/spreadsheets/d/...">
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Intervalo (opcional)</label>
                                <input type="text" id="sheets-range" class="form-input" 
                                       placeholder="A:Z" value="A:Z">
                            </div>
                            
                            <div class="sheets-actions">
                                <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.authenticateGoogleSheets()">
                                    🔐 Autenticar
                                </button>
                                <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.connectGoogleSheets()">
                                    ${this.isLoading ? '🔄 Conectando...' : '🔗 Conectar Planilha'}
                                </button>
                            </div>
                            
                            ${this.errorMessage ? `
                                <div class="alert alert-error">
                                    ❌ ${this.errorMessage}
                                </div>
                            ` : ''}
                        </div>
                        
                        ${this.googleSheetsData ? `
                            <div class="sheets-preview">
                                <h3>📊 Visualização dos Dados</h3>
                                <div class="sheets-info">
                                    <p><strong>Planilha:</strong> ${this.googleSheetsData.spreadsheet_info?.title || 'Sem título'}</p>
                                    <p><strong>Registros:</strong> ${this.googleSheetsData.processed_data?.total_records || 0}</p>
                                    <p><strong>Colunas:</strong> ${this.googleSheetsData.processed_data?.columns?.join(', ') || 'Nenhuma'}</p>
                                </div>
                                
                                <div class="sheets-sample">
                                    <h4>Primeiras 5 linhas:</h4>
                                    <div class="table-container">
                                        <table class="data-table">
                                            <thead>
                                                <tr>
                                                    ${this.googleSheetsData.processed_data?.columns?.map(col => `<th>${col}</th>`).join('') || ''}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${this.googleSheetsData.processed_data?.sample_data?.map(row => `
                                                    <tr>
                                                        ${this.googleSheetsData.processed_data?.columns?.map(col => `<td>${row[col] || ''}</td>`).join('') || ''}
                                                    </tr>
                                                `).join('') || ''}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                <div class="sheets-actions">
                                    <button class="btn btn-success" onclick="window.SacsMaxApp.currentModule.importGoogleSheetsData()">
                                        📥 Importar Dados
                                    </button>
                                    <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.clearGoogleSheetsData()">
                                        🗑️ Limpar
                                    </button>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="upload-options" style="display: none;">
                    <h3>Configurações de Importação</h3>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label class="form-label">Planilha</label>
                            <select class="form-input" id="sheet-select">
                                <option value="0">Planilha 1</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Coluna de Telefone</label>
                            <select class="form-input" id="phone-column">
                                <option value="A">Coluna A</option>
                                <option value="B">Coluna B</option>
                                <option value="C">Coluna C</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.processFile()">
                        📊 Processar Arquivo
                    </button>
                </div>
                
                <div class="upload-history">
                    <h3>Histórico de Uploads</h3>
                    <div class="history-list">
                        ${this.uploadHistory.map(item => `
                            <div class="history-item">
                                <div class="history-info">
                                    <div class="history-name">${item.name}</div>
                                    <div class="history-date">${item.date}</div>
                                </div>
                                <div class="history-status ${item.status}">
                                    ${item.status === 'success' ? '✅' : '❌'} ${item.records} registros
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.setupDragAndDrop();
        this.setupTabs();
    }

    setupTabs() {
        // Configura event listeners para as tabs
        setTimeout(() => {
            const tabButtons = document.querySelectorAll('.tab-btn');
            console.log(`Found ${tabButtons.length} tab buttons`);
            
            tabButtons.forEach((btn, index) => {
                const tabName = btn.getAttribute('data-tab');
                console.log(`Tab button ${index}: data-tab="${tabName}"`);
                
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Tab clicked: ${tabName}`);
                    if (tabName) {
                        this.switchTab(tabName);
                    }
                });
            });
        }, 100); // Pequeno delay para garantir que o DOM foi renderizado
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
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
                this.handleFile(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
    }

    handleFile(file) {
        // Simula processamento
        this.uploadHistory.push({
            name: file.name,
            date: new Date().toLocaleDateString(),
            status: 'success',
            records: Math.floor(Math.random() * 100) + 50
        });
        
        // Atualiza a interface através do app principal
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
    }

    switchTab(tabName) {
        try {
            console.log(`Attempting to switch to tab: ${tabName}`);
            
            // Remove classe active de todas as tabs
            const allTabBtns = document.querySelectorAll('.tab-btn');
            const allTabContents = document.querySelectorAll('.tab-content');
            
            allTabBtns.forEach(btn => btn.classList.remove('active'));
            allTabContents.forEach(content => content.classList.remove('active'));
            
            // Adiciona classe active na tab selecionada
            const targetTab = document.getElementById(`${tabName}-tab`);
            const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
            
            if (targetTab) {
                targetTab.classList.add('active');
                console.log(`Tab content activated: ${tabName}-tab`);
            } else {
                console.error(`Tab content not found: ${tabName}-tab`);
            }
            
            if (targetBtn) {
                targetBtn.classList.add('active');
                console.log(`Tab button activated: ${tabName}`);
            } else {
                console.error(`Tab button not found: [data-tab="${tabName}"]`);
            }
            
        } catch (error) {
            console.error('Erro ao trocar tab:', error);
        }
    }

    async authenticateGoogleSheets() {
        const authType = document.querySelector('input[name="auth-type"]:checked').value;
        const useUserAuth = authType === 'user';
        
        this.isLoading = true;
        this.errorMessage = null;
        this.updateInterface();
        
        try {
            const response = await fetch('/api/sheets/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    use_user_auth: useUserAuth
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`✅ ${result.message}`, 'success');
            } else {
                this.errorMessage = result.error || 'Erro na autenticação';
                this.showNotification(`❌ ${result.message}`, 'error');
            }
            
        } catch (error) {
            this.errorMessage = 'Erro de conexão: ' + error.message;
            this.showNotification(`❌ Erro de conexão: ${error.message}`, 'error');
        }
        
        this.isLoading = false;
        this.updateInterface();
    }

    async connectGoogleSheets() {
        const url = document.getElementById('sheets-url').value.trim();
        const range = document.getElementById('sheets-range').value.trim() || 'A:Z';
        
        if (!url) {
            this.errorMessage = 'Por favor, insira a URL da planilha';
            this.updateInterface();
            return;
        }
        
        this.isLoading = true;
        this.errorMessage = null;
        this.updateInterface();
        
        try {
            const response = await fetch('/api/sheets/read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    range_name: range
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.googleSheetsData = result.data;
                this.errorMessage = null;
            } else {
                this.errorMessage = result.error || 'Erro ao conectar com a planilha';
                this.googleSheetsData = null;
            }
            
        } catch (error) {
            this.errorMessage = 'Erro de conexão: ' + error.message;
            this.googleSheetsData = null;
        }
        
        this.isLoading = false;
        this.updateInterface();
    }

    importGoogleSheetsData() {
        if (!this.googleSheetsData) return;
        
        // Simula importação dos dados
        const totalRecords = this.googleSheetsData.processed_data?.total_records || 0;
        
        this.uploadHistory.push({
            name: `${this.googleSheetsData.spreadsheet_info?.title || 'Google Sheets'}.csv`,
            date: new Date().toLocaleDateString(),
            status: 'success',
            records: totalRecords
        });
        
        // Limpa os dados
        this.googleSheetsData = null;
        this.errorMessage = null;
        
        // Atualiza a interface
        this.updateInterface();
        
        // Mostra notificação
        this.showNotification(`✅ ${totalRecords} registros importados com sucesso!`, 'success');
    }

    clearGoogleSheetsData() {
        this.googleSheetsData = null;
        this.errorMessage = null;
        document.getElementById('sheets-url').value = '';
        document.getElementById('sheets-range').value = 'A:Z';
        this.updateInterface();
    }

    updateInterface() {
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
    }

    showNotification(message, type = 'info') {
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
    }

    processFile() {
        alert('Arquivo processado com sucesso!');
    }

    destroy() {
        // Cleanup se necessário
    }
}

// WhatsApp Module
class WhatsAppModule {
    constructor() {
        this.contacts = [
            { id: 1, name: 'João Silva', phone: '+55 11 99999-9999', status: 'online' },
            { id: 2, name: 'Maria Santos', phone: '+55 11 88888-8888', status: 'offline' },
            { id: 3, name: 'Pedro Costa', phone: '+55 11 77777-7777', status: 'online' }
        ];
        this.selectedContact = null;
        this.messages = [];
        this.whatsappStatus = 'disconnected'; // disconnected, connecting, connected
        this.qrCode = null;
        this.sessionData = null;
        this.connectionInterval = null;
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">💬</span>
                    <h2 class="module-title">WhatsApp</h2>
                    <div class="whatsapp-status-indicator">
                        <span class="status-dot ${this.whatsappStatus}"></span>
                        <span class="status-text">${this.getStatusText()}</span>
                    </div>
                </div>
                
                <!-- Seção de Conexão WhatsApp -->
                ${this.whatsappStatus === 'disconnected' ? `
                    <div class="whatsapp-connection">
                        <div class="connection-card">
                            <h3>🔗 Conectar WhatsApp</h3>
                            <p>Para usar o WhatsApp, você precisa conectar sua conta primeiro.</p>
                            <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.initiateWhatsAppConnection()">
                                🔄 Iniciar Conexão WhatsApp
                            </button>
                        </div>
                    </div>
                ` : this.whatsappStatus === 'connecting' ? `
                    <div class="whatsapp-connection">
                        <div class="connection-card">
                            <h3>📱 Conectando WhatsApp</h3>
                            <div class="qr-container">
                                ${this.qrCode ? `
                                    <div class="qr-code">
                                        <div class="qr-image">
                                            <div style="width: 200px; height: 200px; background: #f0f0f0; border: 2px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                                                📱
                                            </div>
                                        </div>
                                        <p>Escaneie o QR Code com seu WhatsApp</p>
                                        <small>Este código expira em 2 minutos</small>
                                    </div>
                                ` : `
                                    <div class="loading-qr">
                                        <div class="spinner"></div>
                                        <p>Gerando QR Code...</p>
                                    </div>
                                `}
                            </div>
                            <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.cancelConnection()">
                                ❌ Cancelar Conexão
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="whatsapp-container">
                        <div class="contacts-list">
                            <div class="contacts-header">
                                <h3>Contatos</h3>
                                <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.refreshContacts()">
                                    🔄 Atualizar
                                </button>
                            </div>
                            ${this.contacts.map(contact => `
                                <div class="contact-item ${this.selectedContact?.id === contact.id ? 'active' : ''}" 
                                     onclick="window.SacsMaxApp.currentModule.selectContact(${contact.id})">
                                    <div class="contact-avatar">${contact.name.charAt(0)}</div>
                                    <div class="contact-info">
                                        <div class="contact-name">${contact.name}</div>
                                        <div class="contact-status ${contact.status}">${contact.status}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="chat-area">
                            ${this.selectedContact ? `
                                <div class="chat-header">
                                    <h3>${this.selectedContact.name}</h3>
                                    <span class="status ${this.selectedContact.status}">${this.selectedContact.status}</span>
                                </div>
                                <div class="messages-area" id="messages-area">
                                    ${this.messages.map(msg => `
                                        <div class="message ${msg.type}">
                                            <div class="message-content">${msg.content}</div>
                                            <div class="message-time">${msg.time}</div>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="message-input">
                                    <input type="text" id="message-input" placeholder="Digite sua mensagem..." onkeypress="if(event.key==='Enter') window.SacsMaxApp.currentModule.sendMessage()">
                                    <button onclick="window.SacsMaxApp.currentModule.sendMessage()">📤</button>
                                </div>
                            ` : `
                                <div class="no-chat">
                                    <span class="icon">💬</span>
                                    <p>Selecione um contato para iniciar o chat</p>
                                </div>
                            `}
                        </div>
                    </div>
                `}
                
                <!-- Botão de Desconexão -->
                ${this.whatsappStatus === 'connected' ? `
                    <div class="whatsapp-actions">
                        <button class="btn btn-danger" onclick="window.SacsMaxApp.currentModule.disconnectWhatsApp()">
                            ❌ Desconectar WhatsApp
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    init() {
        // Verifica se há sessão salva
        this.checkSavedSession();
    }

    getStatusText() {
        const statusMap = {
            'disconnected': 'Desconectado',
            'connecting': 'Conectando...',
            'connected': 'Conectado'
        };
        return statusMap[this.whatsappStatus] || 'Desconhecido';
    }

    checkSavedSession() {
        const savedSession = localStorage.getItem('whatsapp_session');
        if (savedSession) {
            try {
                this.sessionData = JSON.parse(savedSession);
                // Verifica se a sessão ainda é válida
                if (this.sessionData.expiresAt && new Date() < new Date(this.sessionData.expiresAt)) {
                    this.whatsappStatus = 'connected';
                    this.startConnectionMonitoring();
                } else {
                    localStorage.removeItem('whatsapp_session');
                }
            } catch (error) {
                localStorage.removeItem('whatsapp_session');
            }
        }
    }

    initiateWhatsAppConnection() {
        this.whatsappStatus = 'connecting';
        this.generateQRCode();
        this.startConnectionMonitoring();
        
        // Atualiza a interface
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
    }

    generateQRCode() {
        // Simula geração de QR Code
        setTimeout(() => {
            this.qrCode = {
                code: 'sample-qr-code-' + Date.now(),
                expiresAt: new Date(Date.now() + 2 * 60 * 1000) // 2 minutos
            };
            
            // Atualiza a interface
            if (window.SacsMaxApp) {
                window.SacsMaxApp.updateCurrentModule();
            }
        }, 2000);
    }

    startConnectionMonitoring() {
        // Para qualquer monitoramento anterior
        if (this.connectionInterval) {
            clearInterval(this.connectionInterval);
        }

        this.connectionInterval = setInterval(() => {
            this.checkConnectionStatus();
        }, 3000); // Verifica a cada 3 segundos
    }

    checkConnectionStatus() {
        // Simula verificação de status de conexão
        if (this.whatsappStatus === 'connecting') {
            // Simula que o usuário escaneou o QR Code
            if (Math.random() > 0.7) { // 30% de chance de conectar
                this.onConnectionSuccess();
            }
        } else if (this.whatsappStatus === 'connected') {
            // Verifica se ainda está conectado
            if (Math.random() > 0.95) { // 5% de chance de desconectar
                this.onConnectionLost();
            }
        }
    }

    onConnectionSuccess() {
        this.whatsappStatus = 'connected';
        this.qrCode = null;
        
        // Salva dados da sessão
        this.sessionData = {
            connectedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
            sessionId: 'session-' + Date.now()
        };
        
        localStorage.setItem('whatsapp_session', JSON.stringify(this.sessionData));
        
        // Para o monitoramento de conexão
        if (this.connectionInterval) {
            clearInterval(this.connectionInterval);
        }
        
        // Atualiza a interface
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
        
        // Mostra notificação
        this.showNotification('WhatsApp conectado com sucesso!', 'success');
    }

    onConnectionLost() {
        this.whatsappStatus = 'disconnected';
        this.qrCode = null;
        this.sessionData = null;
        
        localStorage.removeItem('whatsapp_session');
        
        // Para o monitoramento de conexão
        if (this.connectionInterval) {
            clearInterval(this.connectionInterval);
        }
        
        // Atualiza a interface
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
        
        // Mostra notificação
        this.showNotification('Conexão com WhatsApp perdida', 'error');
    }

    cancelConnection() {
        this.whatsappStatus = 'disconnected';
        this.qrCode = null;
        
        // Para o monitoramento de conexão
        if (this.connectionInterval) {
            clearInterval(this.connectionInterval);
        }
        
        // Atualiza a interface
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
    }

    disconnectWhatsApp() {
        if (confirm('Tem certeza que deseja desconectar o WhatsApp?')) {
            this.onConnectionLost();
        }
    }

    refreshContacts() {
        // Simula atualização de contatos
        this.showNotification('Contatos atualizados!', 'success');
    }

    showNotification(message, type = 'info') {
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
    }

    selectContact(contactId) {
        this.selectedContact = this.contacts.find(c => c.id === contactId);
        this.messages = [
            { type: 'incoming', content: 'Olá! Como posso ajudar?', time: '10:30' },
            { type: 'outgoing', content: 'Preciso de informações sobre o produto', time: '10:32' }
        ];
        // Atualiza a interface através do app principal
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (content) {
            this.messages.push({
                type: 'outgoing',
                content: content,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
            input.value = '';
            // Atualiza a interface através do app principal
            if (window.SacsMaxApp) {
                window.SacsMaxApp.updateCurrentModule();
            }
        }
    }

    destroy() {
        // Limpa o intervalo de monitoramento
        if (this.connectionInterval) {
            clearInterval(this.connectionInterval);
            this.connectionInterval = null;
        }
    }
}

// Bot Module
class BotModule {
    constructor() {
        this.config = {
            name: 'SacsMax Bot',
            welcomeMessage: 'Olá! Como posso ajudá-lo hoje?',
            workingHours: { start: '08:00', end: '18:00' },
            autoReplies: [
                { keyword: 'preço', reply: 'Nossos preços variam conforme o produto. Qual você tem interesse?' },
                { keyword: 'entrega', reply: 'Entregamos em até 24h na sua região.' }
            ]
        };
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">🤖</span>
                    <h2 class="module-title">Configurar Bot</h2>
                </div>
                
                <div class="grid grid-2">
                    <div class="card">
                        <h3>Configurações Básicas</h3>
                        <div class="form-group">
                            <label class="form-label">Nome do Bot</label>
                            <input type="text" class="form-input" value="${this.config.name}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mensagem de Boas-vindas</label>
                            <textarea class="form-input" rows="3">${this.config.welcomeMessage}</textarea>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>Horário de Funcionamento</h3>
                        <div class="form-group">
                            <label class="form-label">Início</label>
                            <input type="time" class="form-input" value="${this.config.workingHours.start}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fim</label>
                            <input type="time" class="form-input" value="${this.config.workingHours.end}">
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Respostas Automáticas</h3>
                    <div class="auto-replies">
                        ${this.config.autoReplies.map((reply, index) => `
                            <div class="reply-item">
                                <div class="form-group">
                                    <label class="form-label">Palavra-chave</label>
                                    <input type="text" class="form-input" value="${reply.keyword}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Resposta</label>
                                    <textarea class="form-input" rows="2">${reply.reply}</textarea>
                                </div>
                                <button class="btn btn-danger" onclick="window.SacsMaxApp.currentModule.removeReply(${index})">❌</button>
                            </div>
                        `).join('')}
                        <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.addReply()">
                            ➕ Adicionar Resposta
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Teste do Bot</h3>
                    <div class="test-area">
                        <input type="text" class="form-input" id="test-input" placeholder="Digite uma mensagem para testar...">
                        <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.testBot()">Testar</button>
                        <div id="test-result" class="test-result"></div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        // Setup event listeners
    }

    addReply() {
        this.config.autoReplies.push({ keyword: '', reply: '' });
        // Atualiza a interface através do app principal
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
    }

    removeReply(index) {
        this.config.autoReplies.splice(index, 1);
        // Atualiza a interface através do app principal
        if (window.SacsMaxApp) {
            window.SacsMaxApp.updateCurrentModule();
        }
    }

    testBot() {
        const input = document.getElementById('test-input');
        const message = input.value.toLowerCase();
        const result = document.getElementById('test-result');
        
        const reply = this.config.autoReplies.find(r => message.includes(r.keyword));
        
        if (reply) {
            result.innerHTML = `<div class="alert alert-success">🤖 ${reply.reply}</div>`;
        } else {
            result.innerHTML = `<div class="alert alert-info">🤖 ${this.config.welcomeMessage}</div>`;
        }
    }

    destroy() {
        // Cleanup se necessário
    }
}

// Contacts Module
class ContactsModule {
    constructor() {
        this.contacts = [
            { id: 1, name: 'João Silva', phone: '+55 11 99999-9999', email: 'joao@email.com', status: 'active' },
            { id: 2, name: 'Maria Santos', phone: '+55 11 88888-8888', email: 'maria@email.com', status: 'active' },
            { id: 3, name: 'Pedro Costa', phone: '+55 11 77777-7777', email: 'pedro@email.com', status: 'inactive' }
        ];
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">👥</span>
                    <h2 class="module-title">Contatos</h2>
                </div>
                
                <div class="contacts-toolbar">
                    <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.addContact()">
                        ➕ Adicionar Contato
                    </button>
                    <input type="text" class="form-input" placeholder="Buscar contatos..." id="search-contacts">
                </div>
                
                <div class="contacts-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Telefone</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.contacts.map(contact => `
                                <tr>
                                    <td>${contact.name}</td>
                                    <td>${contact.phone}</td>
                                    <td>${contact.email}</td>
                                    <td>
                                        <span class="status-badge ${contact.status}">
                                            ${contact.status === 'active' ? '✅ Ativo' : '❌ Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.editContact(${contact.id})">
                                            ✏️
                                        </button>
                                        <button class="btn btn-danger" onclick="window.SacsMaxApp.currentModule.deleteContact(${contact.id})">
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    init() {
        // Setup event listeners
    }

    addContact() {
        const name = prompt('Nome do contato:');
        const phone = prompt('Telefone:');
        const email = prompt('Email:');
        
        if (name && phone) {
            this.contacts.push({
                id: Date.now(),
                name: name,
                phone: phone,
                email: email || '',
                status: 'active'
            });
            // Atualiza a interface através do app principal
            if (window.SacsMaxApp) {
                window.SacsMaxApp.updateCurrentModule();
            }
        }
    }

    editContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (contact) {
            const name = prompt('Nome:', contact.name);
            const phone = prompt('Telefone:', contact.phone);
            const email = prompt('Email:', contact.email);
            
            if (name && phone) {
                contact.name = name;
                contact.phone = phone;
                contact.email = email || '';
                // Atualiza a interface através do app principal
                if (window.SacsMaxApp) {
                    window.SacsMaxApp.updateCurrentModule();
                }
            }
        }
    }

    deleteContact(id) {
        if (confirm('Tem certeza que deseja excluir este contato?')) {
            this.contacts = this.contacts.filter(c => c.id !== id);
            // Atualiza a interface através do app principal
            if (window.SacsMaxApp) {
                window.SacsMaxApp.updateCurrentModule();
            }
        }
    }

    destroy() {
        // Cleanup se necessário
    }
}

// Messages Module
class MessagesModule {
    constructor() {
        this.contacts = [
            { id: 1, name: 'João Silva', phone: '+55 11 99999-9999', status: 'active' },
            { id: 2, name: 'Maria Santos', phone: '+55 11 88888-8888', status: 'active' },
            { id: 3, name: 'Pedro Costa', phone: '+55 11 77777-7777', status: 'inactive' }
        ];
        this.templates = [];
        this.scheduledMessages = [];
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">📤</span>
                    <h2 class="module-title">Disparo de Mensagens</h2>
                </div>
                
                <div class="messages-grid">
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
                                </select>
                            </div>
                            <button class="btn btn-primary" onclick="window.SacsMaxApp.currentModule.applyFilters()">
                                🔍 Aplicar Filtros
                            </button>
                        </div>
                    </div>

                    <div class="message-section">
                        <h3>💬 Configurar Mensagem</h3>
                        <div class="message-config">
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

                    <div class="actions-section">
                        <div class="action-buttons">
                            <button class="btn btn-success" onclick="window.SacsMaxApp.currentModule.sendMessages()">
                                📤 Enviar Mensagens
                            </button>
                            <button class="btn btn-secondary" onclick="window.SacsMaxApp.currentModule.previewMessages()">
                                👁️ Pré-visualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.setupDateDefaults();
    }

    setupDateDefaults() {
        const today = new Date();
        const startDate = document.getElementById('start-date');
        const endDate = document.getElementById('end-date');
        
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        if (startDate) startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
        if (endDate) endDate.value = today.toISOString().split('T')[0];
    }

    applyFilters() {
        alert('Filtros aplicados!');
    }

    sendMessages() {
        const messageText = document.getElementById('message-text')?.value;
        if (!messageText?.trim()) {
            alert('Digite uma mensagem primeiro!');
            return;
        }
        alert('Mensagens enviadas com sucesso!');
    }

    previewMessages() {
        const messageText = document.getElementById('message-text')?.value;
        if (!messageText?.trim()) {
            alert('Digite uma mensagem primeiro!');
            return;
        }
        alert('Pré-visualização: ' + messageText);
    }

    destroy() {
        // Cleanup se necessário
    }
}

// Settings Module
class SettingsModule {
    constructor() {
        this.settings = {
            general: {
                companyName: 'SacsMax',
                timezone: 'America/Sao_Paulo',
                language: 'pt-BR'
            },
            whatsapp: {
                qrCodeEnabled: true,
                autoReconnect: true,
                sessionTimeout: 60
            }
        };
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">⚙️</span>
                    <h2 class="module-title">Configurações</h2>
                </div>
                
                <div class="settings-nav">
                    <button class="settings-nav-btn active" data-section="general">
                        🏢 Geral
                    </button>
                    <button class="settings-nav-btn" data-section="whatsapp">
                        📱 WhatsApp
                    </button>
                </div>
                
                <div class="settings-section active" id="general-section">
                    <div class="card">
                        <h3>🏢 Configurações Gerais</h3>
                        <div class="grid grid-2">
                            <div class="form-group">
                                <label class="form-label">Nome da Empresa</label>
                                <input type="text" class="form-input" value="${this.settings.general.companyName}">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fuso Horário</label>
                                <select class="form-input">
                                    <option value="America/Sao_Paulo" selected>Brasília (GMT-3)</option>
                                    <option value="America/Manaus">Manaus (GMT-4)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
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
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        this.setupSettingsNavigation();
    }

    setupSettingsNavigation() {
        const navButtons = document.querySelectorAll('.settings-nav-btn');
        const sections = document.querySelectorAll('.settings-section');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                
                // Remove active class from all buttons and sections
                navButtons.forEach(b => b.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked button and corresponding section
                btn.classList.add('active');
                document.getElementById(`${section}-section`).classList.add('active');
            });
        });
    }

    generateQRCode() {
        const qrDisplay = document.getElementById('qr-code-display');
        if (qrDisplay) {
            qrDisplay.innerHTML = `
                <div class="qr-code">
                    <div class="qr-image">
                        <div style="width: 200px; height: 200px; background: #f0f0f0; border: 2px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                            📱
                        </div>
                    </div>
                    <p>Escaneie o QR Code com seu WhatsApp</p>
                    <small>Este código expira em 2 minutos</small>
                </div>
            `;
        }
    }

    checkConnection() {
        alert('Verificando conexão com WhatsApp...');
    }

    destroy() {
        // Cleanup se necessário
    }
}

// Inicializa a aplicação quando o script for carregado
const app = new SacsMaxApp();

// Exporta para uso global
window.SacsMaxApp = app;
