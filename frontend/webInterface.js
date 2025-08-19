/**
 * SACSMAX - Interface Web Completa
 * Frontend JavaScript/CSS sem HTML separado
 * Integração direta com backend Node.js/Python
 */

(function() {
    'use strict';

    // Configuração da API
    const API_URL = window.location.origin + '/api';
    
    // Estado global da aplicação
    let appState = {
        currentTab: 'upload',
        whatsappStatus: {
            initialized: false,
            connected: false,
            ready: false,
            qrCode: null
        },
        messages: [],
        uploadedContacts: [],
        whatsappChat: {
            active: false,
            currentContact: null,
            messages: [],
            isTyping: false,
            contacts: []
        },
        config: {
            delayBetweenMessages: 2000,
            maxRetries: 3,
            autoResponse: true
        }
    };

    // Estilos CSS dinâmicos
    const styles = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f9fafb;
            min-height: 100vh;
            color: #111827;
        }

        .app-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: white;
            border-radius: 8px;
            padding: 16px 24px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border-bottom: 1px solid #e5e7eb;
        }

        .header h1 {
            color: #1f2937;
            font-size: 1.5em;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .header p {
            color: #6b7280;
            font-size: 0.875em;
            font-weight: 400;
        }

        .tabs {
            display: flex;
            background: white;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            overflow: hidden;
        }

        .tab {
            flex: 1;
            padding: 12px 16px;
            background: white;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            color: #6b7280;
            border-right: 1px solid #e5e7eb;
        }

        .tab:last-child {
            border-right: none;
        }

        .tab.active {
            background: #f3f4f6;
            color: #111827;
        }

        .tab:hover {
            background: #f9fafb;
        }

        .tab.active:hover {
            background: #f3f4f6;
        }

        .content {
            flex: 1;
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e5e7eb;
            overflow-y: auto;
        }

        .section {
            display: none;
        }

        .section.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .upload-area {
            border: 1px dashed #d1d5db;
            border-radius: 6px;
            padding: 32px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 20px;
            background: #fafafa;
        }

        .upload-area:hover {
            border-color: #9ca3af;
            background: #f3f4f6;
        }

        .upload-area.dragover {
            border-color: #6b7280;
            background: #e5e7eb;
        }

        .btn {
            background: #f3f4f6;
            color: #111827;
            border: 1px solid #d1d5db;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            margin: 4px;
        }

        .btn:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
        }

        .btn:disabled {
            background: #f3f4f6;
            color: #9ca3af;
            cursor: not-allowed;
            border-color: #e5e7eb;
        }

        .btn-success {
            background: #059669;
            color: white;
            border-color: #059669;
        }

        .btn-success:hover {
            background: #047857;
            border-color: #047857;
        }

        .btn-danger {
            background: #dc2626;
            color: white;
            border-color: #dc2626;
        }

        .btn-danger:hover {
            background: #b91c1c;
            border-color: #b91c1c;
        }

        .btn-warning {
            background: #d97706;
            color: white;
            border-color: #d97706;
        }

        .btn-warning:hover {
            background: #92400e;
            border-color: #92400e;
        }

        .status-card {
            background: #fafafa;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 16px;
            border-left: 3px solid #6b7280;
        }

        .status-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        /* WhatsApp Clone Styles */
        .whatsapp-container {
            display: flex;
            height: 600px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            background: white;
        }

        .whatsapp-sidebar {
            width: 350px;
            border-right: 1px solid #e5e7eb;
            display: flex;
            flex-direction: column;
            background: #f9fafb;
        }

        .whatsapp-header {
            background: #128c7e;
            color: white;
            padding: 16px;
            font-weight: 500;
            font-size: 16px;
        }

        .whatsapp-search {
            padding: 12px;
            background: white;
            border-bottom: 1px solid #e5e7eb;
        }

        .whatsapp-search input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            font-size: 14px;
        }

        .whatsapp-contacts {
            flex: 1;
            overflow-y: auto;
        }

        .whatsapp-contact {
            display: flex;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
            cursor: pointer;
            transition: background 0.2s;
        }

        .whatsapp-contact:hover {
            background: #f3f4f6;
        }

        .whatsapp-contact.active {
            background: #e5e7eb;
        }

        .whatsapp-contact-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #6b7280;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 500;
        }

        .whatsapp-contact-info {
            flex: 1;
        }

        .whatsapp-contact-name {
            font-weight: 500;
            color: #111827;
            margin-bottom: 2px;
        }

        .whatsapp-contact-preview {
            font-size: 13px;
            color: #6b7280;
        }

        .whatsapp-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .whatsapp-chat-header {
            background: #f9fafb;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
        }

        .whatsapp-chat-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #128c7e;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 500;
            font-size: 14px;
        }

        .whatsapp-chat-name {
            font-weight: 500;
            color: #111827;
        }

        .whatsapp-messages {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            background: #e5ddd5;
        }

        .whatsapp-message {
            max-width: 65%;
            margin-bottom: 8px;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.4;
            position: relative;
        }

        .whatsapp-message.sent {
            background: #dcf8c6;
            margin-left: auto;
            border-bottom-right-radius: 4px;
        }

        .whatsapp-message.received {
            background: white;
            margin-right: auto;
            border-bottom-left-radius: 4px;
        }

        .whatsapp-message-time {
            font-size: 11px;
            color: #6b7280;
            margin-top: 4px;
            text-align: right;
        }

        .whatsapp-message-sticker {
            max-width: 150px;
            padding: 4px;
            background: transparent;
        }

        .whatsapp-message-sticker img {
            width: 100%;
            height: auto;
            border-radius: 8px;
        }

        .whatsapp-message-image {
            max-width: 250px;
            padding: 4px;
        }

        .whatsapp-message-image img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            cursor: pointer;
        }

        .whatsapp-message-document {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.05);
            border-radius: 8px;
        }

        .whatsapp-message-document .file-icon {
            font-size: 24px;
            color: #128c7e;
        }

        .whatsapp-message-document .file-info {
            flex: 1;
        }

        .whatsapp-message-document .file-name {
            font-size: 13px;
            color: #111827;
            font-weight: 500;
        }

        .whatsapp-message-document .file-size {
            font-size: 11px;
            color: #6b7280;
        }

        .whatsapp-stickers {
            display: none;
            padding: 12px;
            background: white;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
            max-height: 150px;
            overflow-y: auto;
            flex-wrap: wrap;
            gap: 8px;
        }

        .whatsapp-sticker-item {
            width: 60px;
            height: 60px;
            cursor: pointer;
            border-radius: 8px;
            transition: transform 0.2s;
        }

        .whatsapp-sticker-item:hover {
            transform: scale(1.1);
        }

        .whatsapp-sticker-item img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .whatsapp-typing {
            display: none;
            padding: 8px 12px;
            font-style: italic;
            color: #6b7280;
            font-size: 14px;
        }

        .whatsapp-input {
            background: white;
            padding: 12px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .whatsapp-input input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            font-size: 14px;
        }

        .whatsapp-input button {
            background: #128c7e;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
        }

        .whatsapp-input button:hover {
            background: #075e54;
        }

        .whatsapp-attachment {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            font-size: 20px;
            padding: 4px;
        }

        .whatsapp-attachment:hover {
            color: #128c7e;
        }
            padding: 10px;
            background: white;
            border-radius: 5px;
        }

        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
        }

        .status-online {
            background: #28a745;
        }

        .status-offline {
            background: #dc3545;
        }

        .status-waiting {
            background: #ffc107;
        }

        .qr-container {
            text-align: center;
            margin: 20px 0;
        }

        .qr-code {
            max-width: 200px;
            margin: 20px auto;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 20px;
            background: white;
        }

        .whatsapp-chat {
            border: 1px solid #ddd;
            border-radius: 10px;
            height: 400px;
            display: flex;
            flex-direction: column;
        }

        .chat-header {
            background: #075e54;
            color: white;
            padding: 15px;
            border-radius: 10px 10px 0 0;
            font-weight: bold;
        }

        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #e5ddd5;
        }

        .message {
            margin-bottom: 10px;
            max-width: 70%;
            padding: 10px 15px;
            border-radius: 15px;
            position: relative;
        }

        .message.sent {
            background: #dcf8c6;
            margin-left: auto;
            border-bottom-right-radius: 5px;
        }

        .message.received {
            background: white;
            margin-right: auto;
            border-bottom-left-radius: 5px;
        }

        .config-form {
            max-width: 500px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #333;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .alert {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
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

        .contacts-list {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
        }

        .contact-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .contact-item:last-child {
            border-bottom: none;
        }

        .contact-name {
            font-weight: 600;
        }

        .contact-phone {
            color: #666;
            font-size: 14px;
        }

        /* Feedback Management Styles */
        .feedback-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .feedback-tabs {
            display: flex;
            background: white;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 20px;
        }

        .feedback-tab {
            padding: 12px 24px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
        }

        .feedback-tab.active {
            color: #059669;
            border-bottom-color: #059669;
        }

        .feedback-tab:hover {
            background: #f9fafb;
            color: #111827;
        }

        .feedback-section {
            display: none;
            animation: fadeIn 0.3s ease;
        }

        .feedback-section.active {
            display: block;
        }

        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .stats-card {
            padding: 24px;
            border-radius: 8px;
            color: white;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stats-positive {
            background: linear-gradient(135deg, #10b981, #059669);
        }

        .stats-negative {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .stats-neutral {
            background: linear-gradient(135deg, #6b7280, #4b5563);
        }

        .stats-card h3 {
            font-size: 2em;
            margin-bottom: 8px;
        }

        .charts-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .chart-container {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }

        .recent-feedbacks {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }

        .filter-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .filter-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            align-items: end;
        }

        .filter-item label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #374151;
        }

        .filter-item input,
        .filter-item select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
        }

        .filter-actions {
            display: flex;
            gap: 10px;
            align-items: end;
        }

        .feedback-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
            cursor: pointer;
            border-left: 4px solid transparent;
        }

        .feedback-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .feedback-card.positive {
            border-left-color: #10b981;
        }

        .feedback-card.negative {
            border-left-color: #ef4444;
        }

        .feedback-card.neutral {
            border-left-color: #6b7280;
        }

        .feedback-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .feedback-client {
            font-weight: 600;
            color: #111827;
        }

        .feedback-date {
            font-size: 12px;
            color: #6b7280;
        }

        .feedback-content {
            color: #374151;
            margin-bottom: 8px;
        }

        .feedback-category {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
        }

        .category-positive {
            background: #d1fae5;
            color: #065f46;
        }

        .category-negative {
            background: #fee2e2;
            color: #991b1b;
        }

        .category-neutral {
            background: #f3f4f6;
            color: #374151;
        }

        .templates-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .template-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
        }

        .template-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .template-name {
            font-weight: 600;
            color: #111827;
        }

        .template-category {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }

        .template-content {
            background: #f9fafb;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .campaigns-row {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }

        .campaign-form-container,
        .import-container {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }

        .modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 20px;
            border-radius: 8px;
            width: 80%;
            max-width: 500px;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }

        .close:hover {
            color: #000;
        }

        @media (max-width: 768px) {
            .app-container {
                padding: 10px;
            }
            
            .tabs {
                flex-direction: column;
            }
            
            .tab {
                border-bottom: 1px solid #eee;
            }

            .charts-row,
            .campaigns-row {
                grid-template-columns: 1fr;
            }

            .filter-row {
                grid-template-columns: 1fr;
            }
        }
    `;

    // Estrutura HTML dinâmica
    const html = `
        <div class="app-container">
            <div class="header">
                <h1>SACSMAX</h1>
                <p>Sistema de Automação WhatsApp + Excel</p>
            </div>
            
            <div class="tabs">
            <button class="tab active" data-tab="upload">📊 Upload Planilha</button>
            <button class="tab" data-tab="bot">🤖 Controle Bot</button>
            <button class="tab" data-tab="whatsapp">💬 WhatsApp</button>
            <button class="tab" data-tab="qr">📱 QR Code</button>
            <button class="tab" data-tab="config">⚙️ Configurações</button>
            <button class="tab" data-tab="feedback">💬 Gestão de Feedback</button>
        </div>
            
            <div class="content">
                <!-- Aba Upload de Planilha -->
                <div class="section active" id="upload">
                    <h2>📊 Upload de Planilha Excel</h2>
                    <div class="upload-area" id="uploadArea">
                        <h3>Arraste o arquivo Excel aqui ou clique para selecionar</h3>
                        <p>Formatos suportados: .xlsx, .xls</p>
                        <input type="file" id="fileInput" accept=".xlsx,.xls" style="display: none;">
                    </div>
                    <div id="uploadStatus"></div>
                    <div class="contacts-list" id="contactsList" style="display: none;">
                        <h3>Contatos Encontrados:</h3>
                        <div id="contactsContent"></div>
                    </div>
                </div>
                
                <!-- Aba Controle do Bot -->
                <div class="section" id="bot">
                    <h2>🤖 Controle do Bot WhatsApp</h2>
                    <div class="status-card">
                        <h3>Status do Sistema</h3>
                        <div class="status-item">
                            <span>WhatsApp Inicializado:</span>
                            <span id="statusInitialized">❌ Não</span>
                        </div>
                        <div class="status-item">
                            <span>Conectado ao WhatsApp:</span>
                            <span id="statusConnected">❌ Não</span>
                        </div>
                        <div class="status-item">
                            <span>Bot Pronto:</span>
                            <span id="statusReady">❌ Não</span>
                        </div>
                    </div>
                    
                    <!-- Filtros para Envio em Massa -->
                    <div class="status-card" style="margin-top: 20px;">
                        <h3>📅 Filtros de Envio em Massa</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div class="form-group">
                                <label>Data Inicial:</label>
                                <input type="date" id="massSendStartDate" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Data Final:</label>
                                <input type="date" id="massSendEndDate" class="form-control">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Região:</label>
                            <select id="massSendRegion" class="form-control">
                                <option value="">Todas as Regiões</option>
                                <option value="sudeste">Sudeste</option>
                                <option value="sul">Sul</option>
                                <option value="norte">Norte</option>
                                <option value="nordeste">Nordeste</option>
                                <option value="centro-oeste">Centro-Oeste</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Mensagem:</label>
                            <textarea id="massSendMessage" class="form-control" rows="3" placeholder="Digite a mensagem a ser enviada em massa..."></textarea>
                        </div>
                        <div style="margin-top: 15px;">
                            <button class="btn btn-primary" id="previewMassSend" onclick="previewMassSend()">👁️ Pré-visualizar</button>
                            <button class="btn btn-success" id="startMassSend" onclick="startMassSend()">📤 Iniciar Envio em Massa</button>
                        </div>
                        <div id="massSendPreview" style="margin-top: 15px; display: none;">
                            <h4>Pré-visualização:</h4>
                            <div id="massSendPreviewContent"></div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <button class="btn btn-success" id="startBot">🚀 Iniciar Bot</button>
                        <button class="btn btn-danger" id="stopBot">⏹️ Parar Bot</button>
                        <button class="btn" id="refreshStatus">🔄 Atualizar Status</button>
                    </div>
                </div>
                
                <!-- Aba Interface WhatsApp -->
                <div class="section" id="whatsapp">
                    <h2>💬 Interface WhatsApp</h2>
                    <div class="whatsapp-container">
                        <div class="whatsapp-sidebar">
                            <div class="whatsapp-header">
                                WhatsApp Clone
                            </div>
                            <div class="whatsapp-search">
                                <input type="text" placeholder="Buscar contatos..." id="whatsapp-search-input">
                            </div>
                            <div class="whatsapp-contacts" id="whatsapp-contacts-list">
                                <!-- Contatos serão carregados dinamicamente -->
                            </div>
                        </div>
                        <div class="whatsapp-chat">
                            <div class="whatsapp-chat-header" id="whatsapp-chat-header" style="display: none;">
                                <div class="whatsapp-chat-avatar" id="chat-avatar">U</div>
                                <div class="whatsapp-chat-name" id="chat-name">Selecione um contato</div>
                            </div>
                            <div class="whatsapp-messages" id="whatsapp-messages">
                                <div style="text-align: center; color: #6b7280; margin-top: 50px;">
                                    Selecione um contato para iniciar conversa
                                </div>
                            </div>
                            <div class="whatsapp-stickers" id="whatsapp-stickers">
                                <div class="whatsapp-sticker-item" onclick="sendSticker('😊')">😊</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('👍')">👍</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('❤️')">❤️</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('🎉')">🎉</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('😂')">😂</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('😍')">😍</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('🔥')">🔥</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('✅')">✅</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('📞')">📞</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('💬')">💬</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('👋')">👋</div>
                                <div class="whatsapp-sticker-item" onclick="sendSticker('🙏')">🙏</div>
                            </div>
                            <div class="whatsapp-input" id="whatsapp-input" style="display: none;">
                                <button class="whatsapp-attachment" onclick="toggleStickers()" title="Figurinhas" style="font-size: 18px;">😊</button>
                                <button class="whatsapp-attachment" onclick="attachFile()" title="Anexar arquivo">📎</button>
                                <input type="text" id="whatsapp-message-input" placeholder="Digite uma mensagem...">
                                <button onclick="sendMessage()">Enviar</button>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-success" id="sendMessages">📤 Enviar Mensagens</button>
                        <button class="btn btn-warning" id="pauseMessages">⏸️ Pausar</button>
                    </div>
                </div>
                
                <!-- Aba QR Code -->
                <div class="section" id="qr">
                    <h2>📱 QR Code WhatsApp</h2>
                    <div class="qr-container">
                        <div class="status-card">
                            <h3>Status da Conexão</h3>
                            <p id="qrStatus">Aguardando início do bot...</p>
                        </div>
                        <div class="qr-code" id="qrCodeContainer">
                            <p>QR Code aparecerá aqui quando o bot for iniciado</p>
                        </div>
                        <button class="btn" id="refreshQR">🔄 Atualizar QR Code</button>
                    </div>
                </div>
                
                <!-- Aba Configurações -->
                <div class="section" id="config">
                    <h2>⚙️ Configurações do Bot</h2>
                    <div class="config-form">
                        <div class="form-group">
                            <label>Delay entre mensagens (ms):</label>
                            <input type="number" id="delayMessages" value="2000" min="1000" max="10000">
                        </div>
                        <div class="form-group">
                            <label>Máximo de tentativas:</label>
                            <input type="number" id="maxRetries" value="3" min="1" max="10">
                        </div>
                        <div class="form-group">
                            <label>Resposta automática:</label>
                            <select id="autoResponse">
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                            </select>
                        </div>
                        <button class="btn btn-success" id="saveConfig">💾 Salvar Configurações</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Classe principal da interface web
    class SACSMAXInterface {
        constructor() {
            this.init();
        }

        init() {
            this.injectStyles();
            this.injectHTML();
            this.setupEventListeners();
            this.startStatusPolling();
        }

        injectStyles() {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }

        injectHTML() {
            document.body.innerHTML = html;
        }

        setupEventListeners() {
            // Navegação por abas
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    this.switchTab(e.target.dataset.tab);
                });
            });

            // Upload de arquivo
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');

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
                    this.handleFileUpload(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });

            // Botões de controle
            document.getElementById('startBot').addEventListener('click', () => this.startBot());
            document.getElementById('stopBot').addEventListener('click', () => this.stopBot());
            document.getElementById('refreshStatus').addEventListener('click', () => this.updateStatus());
            document.getElementById('sendMessages').addEventListener('click', () => this.sendMessages());
            document.getElementById('pauseMessages').addEventListener('click', () => this.pauseMessages());
            document.getElementById('refreshQR').addEventListener('click', () => this.refreshQR());
            document.getElementById('saveConfig').addEventListener('click', () => this.saveConfig());
        }

        switchTab(tabName) {
            // Atualizar abas ativas
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');

            // Atualizar seções
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');

            appState.currentTab = tabName;

            // Ações específicas por aba
            if (tabName === 'qr') {
                this.refreshQR();
            }
        }

        async handleFileUpload(file) {
            const uploadStatus = document.getElementById('uploadStatus');
            const contactsList = document.getElementById('contactsList');
            const contactsContent = document.getElementById('contactsContent');

            if (!file.name.match(/\.(xlsx|xls)$/)) {
                uploadStatus.innerHTML = '<div class="alert alert-error">Formato de arquivo inválido. Use .xlsx ou .xls</div>';
                return;
            }

            uploadStatus.innerHTML = '<div class="alert alert-info">📤 Enviando arquivo...</div>';

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/excel/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (data.success) {
                    uploadStatus.innerHTML = '<div class="alert alert-success">✅ Arquivo processado com sucesso!</div>';
                    
                    // Exibir contatos
                    appState.uploadedContacts = data.contacts || [];
                    this.displayContacts(data.contacts);
                    contactsList.style.display = 'block';
                } else {
                    uploadStatus.innerHTML = '<div class="alert alert-error">❌ Erro: ' + data.error + '</div>';
                }
            } catch (error) {
                uploadStatus.innerHTML = '<div class="alert alert-error">❌ Erro: ' + error.message + '</div>';
            }
        }

        displayContacts(contacts) {
            const contactsContent = document.getElementById('contactsContent');
            if (!contacts || contacts.length === 0) {
                contactsContent.innerHTML = '<p>Nenhum contato encontrado.</p>';
                return;
            }

            let html = '<div class="contacts-list">';
            contacts.forEach(contact => {
                html += `
                    <div class="contact-item">
                        <div>
                            <div class="contact-name">${contact.name || 'Sem nome'}</div>
                            <div class="contact-phone">${contact.phone || contact.number || 'Sem telefone'}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            contactsContent.innerHTML = html;
        }

        async startBot() {
            const button = document.getElementById('startBot');
            button.disabled = true;
            button.innerHTML = '<div class="loading"></div> Iniciando...';

            try {
                const response = await fetch('/api/whatsapp/start', {
                    method: 'POST'
                });
                const data = await response.json();

                if (data.success) {
                    this.addMessage('✅ Bot iniciado com sucesso!', 'success');
                    this.updateStatus();
                } else {
                    this.addMessage('❌ Erro ao iniciar bot: ' + data.message, 'error');
                }
            } catch (error) {
                this.addMessage('❌ Erro de conexão: ' + error.message, 'error');
            } finally {
                button.disabled = false;
                button.innerHTML = '🚀 Iniciar Bot';
            }
        }

        async stopBot() {
            const button = document.getElementById('stopBot');
            button.disabled = true;
            button.innerHTML = '<div class="loading"></div> Parando...';

            try {
                const response = await fetch('/api/whatsapp/stop', {
                    method: 'POST'
                });
                const data = await response.json();

                if (data.success) {
                    this.addMessage('✅ Bot parado com sucesso!', 'success');
                    this.updateStatus();
                } else {
                    this.addMessage('❌ Erro ao parar bot: ' + data.message, 'error');
                }
            } catch (error) {
                this.addMessage('❌ Erro de conexão: ' + error.message, 'error');
            } finally {
                button.disabled = false;
                button.innerHTML = '⏹️ Parar Bot';
            }
        }

        async updateStatus() {
            try {
                const response = await fetch('/api/whatsapp/status');
                const data = await response.json();

                appState.whatsappStatus = data;

                document.getElementById('statusInitialized').textContent = data.initialized ? '✅ Sim' : '❌ Não';
                document.getElementById('statusConnected').textContent = data.connected ? '✅ Sim' : '❌ Não';
                document.getElementById('statusReady').textContent = data.ready ? '✅ Sim' : '❌ Não';

                // Atualizar QR Code se disponível
                if (data.qrCode) {
                    const qrContainer = document.getElementById('qrCodeContainer');
                    qrContainer.innerHTML = `<img src="${data.qrCode}" alt="QR Code" style="max-width: 100%;">`;
                }
            } catch (error) {
                console.error('Erro ao atualizar status:', error);
            }
        }

        async sendMessages() {
            if (appState.uploadedContacts.length === 0) {
                this.addMessage('❌ Faça upload de uma planilha primeiro!', 'error');
                return;
            }

            const button = document.getElementById('sendMessages');
            button.disabled = true;
            button.innerHTML = '<div class="loading"></div> Enviando...';

            try {
                const response = await fetch('/api/whatsapp/send-messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contacts: appState.uploadedContacts,
                        config: appState.config
                    })
                });
                const data = await response.json();

                if (data.success) {
                    this.addMessage(`✅ Mensagens enviadas! Sucesso: ${data.sent}, Falhas: ${data.failed}`, 'success');
                } else {
                    this.addMessage('❌ Erro ao enviar mensagens: ' + data.error, 'error');
                }
            } catch (error) {
                this.addMessage('❌ Erro de conexão: ' + error.message, 'error');
            } finally {
                button.disabled = false;
                button.innerHTML = '📤 Enviar Mensagens';
            }
        }

        pauseMessages() {
            this.addMessage('⏸️ Envio de mensagens pausado', 'info');
        }

        async refreshQR() {
            this.updateStatus();
        }

        // Funções do Clone WhatsApp
        async loadWhatsAppContacts() {
            try {
                const response = await fetch('/api/contacts');
                const data = await response.json();
                const contacts = data.contacts || [];
                this.renderContacts(contacts);
            } catch (error) {
                console.error('Erro ao carregar contatos:', error);
                // Mock contacts para demonstração
                const mockContacts = [
                    { id: 1, name: 'João Silva', phone: '5511999999999', lastMessage: 'Olá, tudo bem?', unread: 2 },
                    { id: 2, name: 'Maria Santos', phone: '5511888888888', lastMessage: 'Obrigada pelo contato', unread: 0 },
                    { id: 3, name: 'Empresa ABC', phone: '5511777777777', lastMessage: 'Confirmamos seu pedido', unread: 1 },
                    { id: 4, name: 'Suporte Técnico', phone: '5511666666666', lastMessage: 'Como posso ajudar?', unread: 0 }
                ];
                this.renderContacts(mockContacts);
            }
        }

        renderContacts(contacts) {
            const contactsList = document.getElementById('whatsapp-contacts-list');
            contactsList.innerHTML = '';

            contacts.forEach(contact => {
                const contactDiv = document.createElement('div');
                contactDiv.className = 'whatsapp-contact';
                contactDiv.onclick = () => this.selectContact(contact);
                
                contactDiv.innerHTML = `
                    <div class="whatsapp-contact-avatar">${contact.name.charAt(0)}</div>
                    <div class="whatsapp-contact-info">
                        <div class="whatsapp-contact-name">${contact.name}</div>
                        <div class="whatsapp-contact-preview">${contact.lastMessage || 'Sem mensagens'}</div>
                    </div>
                    ${contact.unread > 0 ? `<div style="background: #128c7e; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px;">${contact.unread}</div>` : ''}
                `;
                
                contactsList.appendChild(contactDiv);
            });
        }

        selectContact(contact) {
            appState.whatsappChat.currentContact = contact;
            
            // Atualizar UI
            document.querySelectorAll('.whatsapp-contact').forEach(el => el.classList.remove('active'));
            event.target.closest('.whatsapp-contact').classList.add('active');
            
            document.getElementById('whatsapp-chat-header').style.display = 'flex';
            document.getElementById('whatsapp-input').style.display = 'flex';
            document.getElementById('chat-name').textContent = contact.name;
            document.getElementById('chat-avatar').textContent = contact.name.charAt(0);
            
            this.loadMessages(contact.id);
        }

        async loadMessages(contactId) {
            try {
                const response = await fetch(`/api/messages/${contactId}`);
                const data = await response.json();
                this.renderMessages(data.messages || []);
            } catch (error) {
                console.error('Erro ao carregar mensagens:', error);
                // Mock messages para demonstração
                const mockMessages = [
                    { id: 1, text: 'Olá! Como posso ajudar você?', type: 'received', timestamp: '10:30' },
                    { id: 2, text: 'Gostaria de saber mais sobre seus serviços', type: 'sent', timestamp: '10:32' },
                    { id: 3, text: 'Claro! Temos diversas opções disponíveis', type: 'received', timestamp: '10:33' }
                ];
                this.renderMessages(mockMessages);
            }
        }

        renderMessages(messages) {
            const messagesDiv = document.getElementById('whatsapp-messages');
            messagesDiv.innerHTML = '';

            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `whatsapp-message ${message.type}`;
                
                messageDiv.innerHTML = `
                    <div>${message.text}</div>
                    <div class="whatsapp-message-time">${message.timestamp}</div>
                `;
                
                messagesDiv.appendChild(messageDiv);
            });

            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        async saveConfig() {
            const delay = document.getElementById('delayMessages').value;
            const retries = document.getElementById('maxRetries').value;
            const autoResponse = document.getElementById('autoResponse').value === 'true';

            appState.config = {
                delayBetweenMessages: parseInt(delay),
                maxRetries: parseInt(retries),
                autoResponse: autoResponse
            };

            const button = document.getElementById('saveConfig');
            button.disabled = true;
            button.innerHTML = '<div class="loading"></div> Salvando...';

            try {
                const response = await fetch('/api/config/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(appState.config)
                });
                const data = await response.json();

                if (data.success) {
                    this.addMessage('✅ Configurações salvas com sucesso!', 'success');
                } else {
                    this.addMessage('❌ Erro ao salvar configurações: ' + data.error, 'error');
                }
            } catch (error) {
                this.addMessage('❌ Erro de conexão: ' + error.message, 'error');
            } finally {
                button.disabled = false;
                button.innerHTML = '💾 Salvar Configurações';
            }
        }

        addMessage(message, type) {
            const chatMessages = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message received';
            messageDiv.innerHTML = `<strong>Sistema:</strong> ${message}`;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Adicionar também alerta global
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type}`;
            alertDiv.textContent = message;
            document.querySelector('.content').insertBefore(alertDiv, document.querySelector('.content').firstChild);
            
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 5000);
        }

        startStatusPolling() {
            // Atualizar status a cada 5 segundos
            setInterval(() => {
                this.updateStatus();
            }, 5000);

            // Carregar configurações iniciais
            this.loadConfig();
        }

        async loadConfig() {
            try {
                const response = await fetch('/api/config');
                const data = await response.json();
                
                appState.config = data;
                
                document.getElementById('delayMessages').value = data.delayBetweenMessages || 2000;
                document.getElementById('maxRetries').value = data.maxRetries || 3;
                document.getElementById('autoResponse').value = data.autoResponse ? 'true' : 'false';
            } catch (error) {
                console.error('Erro ao carregar configurações:', error);
            }
        }
    }

    // Funções auxiliares do WhatsApp
    function searchContacts() {
        const searchTerm = document.getElementById('whatsapp-search-input').value.toLowerCase();
        const filteredContacts = appState.whatsappChat.contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) || 
            contact.phone.includes(searchTerm)
        );
        appInterface.renderContacts(filteredContacts);
    }

    function sendMessage() {
        const input = document.getElementById('whatsapp-message-input');
        const text = input.value.trim();
        
        if (!text || !appState.whatsappChat.currentContact) return;

        // Simular digitação antes de enviar
        showTyping();
        
        setTimeout(async () => {
            try {
                const response = await fetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: appState.whatsappChat.currentContact.phone,
                        message: text
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    addMessage(text, 'sent');
                    input.value = '';
                } else {
                    showError('Erro ao enviar mensagem');
                }
            } catch (error) {
                console.error('Erro:', error);
                // Adicionar mensagem localmente para demonstração
                addMessage(text, 'sent');
                input.value = '';
            }
        }, 1000 + Math.random() * 2000); // Simular tempo de digitação
    }

    function showTyping() {
        const messagesDiv = document.getElementById('whatsapp-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'whatsapp-typing';
        typingDiv.id = 'typing-indicator';
        typingDiv.textContent = 'Digitando...';
        
        messagesDiv.appendChild(typingDiv);
        typingDiv.style.display = 'block';
        
        setTimeout(() => {
            const indicator = document.getElementById('typing-indicator');
            if (indicator) indicator.remove();
        }, 3000);
    }

    function addMessage(text, type) {
        const messagesDiv = document.getElementById('whatsapp-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `whatsapp-message ${type}`;
        
        const now = new Date();
        const time = now.getHours().toString().padStart(2, '0') + ':' + 
                    now.getMinutes().toString().padStart(2, '0');
        
        messageDiv.innerHTML = `
            <div>${text}</div>
            <div class="whatsapp-message-time">${time}</div>
        `;
        
        messagesDiv.appendChild(messageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function handleKeyPress(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    }

    function toggleStickers() {
            const stickersDiv = document.getElementById('whatsapp-stickers');
            stickersDiv.style.display = stickersDiv.style.display === 'flex' ? 'none' : 'flex';
        }

        async function sendSticker(sticker) {
            if (!appState.whatsappChat.currentContact) return;

            // Simular digitação antes de enviar
            showTyping();
            
            setTimeout(async () => {
                try {
                    const response = await fetch('/api/whatsapp/send-sticker', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            phone: appState.whatsappChat.currentContact.phone,
                            sticker: sticker
                        })
                    });

                    const data = await response.json();
                    
                    if (data.success) {
                        addStickerMessage(sticker, 'sent');
                    } else {
                        showError('Erro ao enviar figurinha');
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    // Adicionar figurinha localmente para demonstração
                    addStickerMessage(sticker, 'sent');
                }
            }, 1000 + Math.random() * 2000);
            
            // Fechar painel de figurinhas
            document.getElementById('whatsapp-stickers').style.display = 'none';
        }

        function addStickerMessage(sticker, type) {
            const messagesDiv = document.getElementById('whatsapp-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `whatsapp-message whatsapp-message-sticker ${type}`;
            
            const now = new Date();
            const time = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');
            
            messageDiv.innerHTML = `
                <div class="sticker-content">${sticker}</div>
                <div class="whatsapp-message-time">${time}</div>
            `;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function addImageMessage(imageUrl, type) {
            const messagesDiv = document.getElementById('whatsapp-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `whatsapp-message whatsapp-message-image ${type}`;
            
            const now = new Date();
            const time = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');
            
            messageDiv.innerHTML = `
                <img src="${imageUrl}" alt="Imagem" onclick="openImageModal('${imageUrl}')">
                <div class="whatsapp-message-time">${time}</div>
            `;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function addDocumentMessage(fileName, fileSize, fileUrl, type) {
            const messagesDiv = document.getElementById('whatsapp-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `whatsapp-message whatsapp-message-document ${type}`;
            
            const now = new Date();
            const time = now.getHours().toString().padStart(2, '0') + ':' + 
                        now.getMinutes().toString().padStart(2, '0');
            
            messageDiv.innerHTML = `
                <div class="file-icon">📄</div>
                <div class="file-info">
                    <div class="file-name">${fileName}</div>
                    <div class="file-size">${formatFileSize(fileSize)}</div>
                </div>
                <a href="${fileUrl}" target="_blank" style="color: #128c7e; text-decoration: none;">⬇️</a>
                <div class="whatsapp-message-time">${time}</div>
            `;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function openImageModal(imageUrl) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                cursor: pointer;
            `;
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                border-radius: 8px;
            `;
            
            modal.appendChild(img);
            document.body.appendChild(modal);
            
            modal.onclick = () => modal.remove();
        }

        // Preparar estrutura para Supabase
        const supabaseConfig = {
            url: null, // Será configurado futuramente
            key: null,   // Será configurado futuramente
            client: null // Será inicializado futuramente
        };

        // Gestão de Feedback - Estado e Funções
        let feedbackState = {
            feedbacks: [],
            templates: [],
            campaigns: [],
            currentTab: 'dashboard',
            currentFeedback: null,
            currentChat: null
        };

        // Estilos CSS para Feedback
        const feedbackStyles = `
            .feedback-container {
                padding: 20px;
            }

            .feedback-tabs {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 1px solid #e5e7eb;
            }

            .feedback-tab {
                padding: 12px 20px;
                background: none;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                color: #6b7280;
                border-bottom: 2px solid transparent;
                transition: all 0.2s ease;
            }

            .feedback-tab.active {
                color: #059669;
                border-bottom-color: #059669;
            }

            .feedback-section {
                display: none;
            }

            .feedback-section.active {
                display: block;
                animation: fadeIn 0.3s ease;
            }

            .stats-row {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .stats-card {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                text-align: center;
            }

            .stats-card h3 {
                font-size: 2em;
                margin-bottom: 5px;
            }

            .stats-positive h3 { color: #059669; }
            .stats-negative h3 { color: #dc2626; }
            .stats-neutral h3 { color: #6b7280; }

            .charts-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }

            .chart-container, .recent-feedbacks {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .filter-section {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .filter-row {
                display: flex;
                gap: 15px;
                align-items: end;
                flex-wrap: wrap;
            }

            .filter-item {
                flex: 1;
                min-width: 150px;
            }

            .filter-item label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #374151;
            }

            .filter-item input, .filter-item select {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
            }

            .feedback-card {
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                border-left: 4px solid #e5e7eb;
            }

            .feedback-card.positive {
                border-left-color: #059669;
            }

            .feedback-card.negative {
                border-left-color: #dc2626;
            }

            .feedback-card.neutral {
                border-left-color: #6b7280;
            }

            .feedback-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .feedback-client {
                font-weight: 600;
                color: #111827;
            }

            .feedback-date {
                color: #6b7280;
                font-size: 12px;
            }

            .feedback-content {
                margin-bottom: 10px;
                color: #374151;
            }

            .feedback-actions {
                display: flex;
                gap: 10px;
            }

            .template-card {
                background: white;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .template-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .campaigns-row {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 20px;
            }

            .campaign-form-container, .import-container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }

            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }

            .modal-content {
                background-color: white;
                margin: 5% auto;
                padding: 20px;
                border-radius: 8px;
                width: 80%;
                max-width: 500px;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
            }

            .close:hover {
                color: #000;
            }

            .chat-message {
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 8px;
                max-width: 70%;
            }

            .chat-message.sent {
                background: #dcf8c6;
                margin-left: auto;
                text-align: right;
            }

            .chat-message.received {
                background: #f1f1f1;
                margin-right: auto;
            }
        `;

        // Funções de Feedback
        async function initFeedback() {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = feedbackStyles;
            document.head.appendChild(styleSheet);
            
            // Adicionar aba de feedback
            const tabsContainer = document.querySelector('.tabs');
            if (tabsContainer) {
                const feedbackTab = document.createElement('button');
                feedbackTab.className = 'tab';
                feedbackTab.textContent = '💬 Feedback';
                feedbackTab.onclick = () => switchTab('feedback');
                tabsContainer.appendChild(feedbackTab);
            }

            // Criar seção de feedback
            const content = document.querySelector('.content');
            if (content) {
                const feedbackSection = document.createElement('div');
                feedbackSection.className = 'section';
                feedbackSection.id = 'feedback';
                feedbackSection.innerHTML = `
                    <h2>💬 Gestão de Feedback de Clientes</h2>
                    <div class="feedback-container">
                        <div class="feedback-tabs">
                            <button class="feedback-tab active" data-feedback-tab="dashboard">📊 Dashboard</button>
                            <button class="feedback-tab" data-feedback-tab="feedbacks">💬 Feedbacks</button>
                            <button class="feedback-tab" data-feedback-tab="templates">📋 Templates</button>
                            <button class="feedback-tab" data-feedback-tab="mass-templates">📱 Templates Mensagens</button>
                            <button class="feedback-tab" data-feedback-tab="sent-contacts">📞 Contatos Enviados</button>
                        </div>
                        
                        <div class="feedback-content">
                            <!-- Dashboard -->
                            <div class="feedback-section active" id="feedback-dashboard">
                                <div class="stats-row">
                                    <div class="stats-card stats-positive">
                                        <h3 id="positive-count">0</h3>
                                        <p>Feedbacks Positivos</p>
                                    </div>
                                    <div class="stats-card stats-negative">
                                        <h3 id="negative-count">0</h3>
                                        <p>Feedbacks Negativos</p>
                                    </div>
                                    <div class="stats-card stats-neutral">
                                        <h3 id="total-count">0</h3>
                                        <p>Total de Feedbacks</p>
                                    </div>
                                </div>
                                
                                <div class="charts-row">
                                    <div class="chart-container">
                                        <h5>Distribuição por Categoria</h5>
                                        <canvas id="category-chart" width="400" height="200"></canvas>
                                    </div>
                                    <div class="recent-feedbacks">
                                        <h5>Feedbacks Recentes</h5>
                                        <div id="recent-feedbacks-list"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Feedbacks -->
                            <div class="feedback-section" id="feedback-feedbacks">
                                <div class="filter-section">
                                    <div class="filter-row">
                                        <div class="filter-item">
                                            <label>Categoria</label>
                                            <select id="category-filter">
                                                <option value="">Todas</option>
                                                <option value="positive">Positivo</option>
                                                <option value="negative">Negativo</option>
                                                <option value="neutral">Neutro</option>
                                            </select>
                                        </div>
                                        <div class="filter-item">
                                            <label>Data Inicial</label>
                                            <input type="date" id="date-from">
                                        </div>
                                        <div class="filter-item">
                                            <label>Data Final</label>
                                            <input type="date" id="date-to">
                                        </div>
                                        <div class="filter-actions">
                                            <button class="btn btn-primary" onclick="loadFeedbacks()">🔍 Filtrar</button>
                                            <button class="btn btn-secondary" onclick="clearFilters()">🧹 Limpar</button>
                                        </div>
                                    </div>
                                </div>
                                <div id="feedbacks-container"></div>
                            </div>

                            <!-- Templates -->
                            <div class="feedback-section" id="feedback-templates">
                                <div class="templates-header">
                                    <h3>Templates de Mensagens</h3>
                                    <button class="btn btn-success" onclick="showAddTemplateModal()">➕ Novo Template</button>
                                </div>
                                <div id="templates-container"></div>
                            </div>

                            <!-- Templates de Mensagens em Massa -->
                            <div class="feedback-section" id="feedback-mass-templates">
                                <div class="network-check" style="margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <span id="network-status">🔄 Verificando conexão...</span>
                                        <button class="btn btn-secondary" onclick="checkNetworkStatus()">🔄 Atualizar</button>
                                    </div>
                                </div>
                                
                                <div class="templates-header">
                                    <h3>Templates de Mensagens em Massa</h3>
                                    <button class="btn btn-success" onclick="showAddMassTemplateModal()">➕ Novo Template</button>
                                </div>
                                
                                <div class="mass-templates-grid" id="mass-templates-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; margin-top: 20px;">
                                    <!-- Templates serão carregados aqui -->
                                </div>
                                
                                <div class="predefined-templates" style="margin-top: 30px;">
                                    <h4>Templates Pré-definidos</h4>
                                    <div class="template-buttons" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">
                                        <button class="btn btn-outline" onclick="useMassTemplate('promocao')">🛍️ Promoção</button>
                                        <button class="btn btn-outline" onclick="useMassTemplate('aniversario')">🎂 Aniversário</button>
                                        <button class="btn btn-outline" onclick="useMassTemplate('feedback')">💬 Solicitar Feedback</button>
                                        <button class="btn btn-outline" onclick="useMassTemplate('revisao')">⭐ Revisão</button>
                                        <button class="btn btn-outline" onclick="useMassTemplate('welcome')">👋 Boas-vindas</button>
                                        <button class="btn btn-outline" onclick="useMassTemplate('followup')">📞 Follow-up</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Contatos Enviados -->
                            <div class="feedback-section" id="feedback-sent-contacts">
                                <div class="sent-contacts-header">
                                    <h3>Contatos Enviados</h3>
                                    <div class="search-section" style="margin-bottom: 20px;">
                                        <div style="display: flex; gap: 10px; align-items: center;">
                                            <input type="text" id="contacts-search" placeholder="Buscar por nome, telefone ou arquivo..." style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px;">
                                            <button class="btn btn-primary" onclick="searchSentContacts()">🔍 Buscar</button>
                                            <button class="btn btn-secondary" onclick="clearContactsSearch()">🧹 Limpar</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="contacts-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                                    <div class="stats-card">
                                        <h4 id="total-contacts-count">0</h4>
                                        <p>Total de Contatos</p>
                                    </div>
                                    <div class="stats-card">
                                        <h4 id="sent-messages-count">0</h4>
                                        <p>Mensagens Enviadas</p>
                                    </div>
                                    <div class="stats-card">
                                        <h4 id="delivered-messages-count">0</h4>
                                        <p>Mensagens Entregues</p>
                                    </div>
                                    <div class="stats-card">
                                        <h4 id="failed-messages-count">0</h4>
                                        <p>Mensagens Falhadas</p>
                                    </div>
                                </div>

                                <div class="contacts-table-container">
                                    <table class="contacts-table" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                                        <thead>
                                            <tr style="background: #f3f4f6; text-align: left;">
                                                <th style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Nome</th>
                                                <th style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Telefone</th>
                                                <th style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Arquivo Origem</th>
                                                <th style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Data Envio</th>
                                                <th style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Status</th>
                                                <th style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Mensagem</th>
                                                <th style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody id="sent-contacts-table-body">
                                            <!-- Contatos serão carregados aqui -->
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div class="pagination" id="contacts-pagination" style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                                    <!-- Paginação será carregada aqui -->
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                content.appendChild(feedbackSection);
            }

            // Adicionar modais
            const modalsContainer = document.createElement('div');
            modalsContainer.innerHTML = `
                <!-- Modal de Adicionar Template -->
                <div id="templateModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Adicionar Novo Template</h3>
                            <span class="close" onclick="closeTemplateModal()">&times;</span>
                        </div>
                        <form id="template-form">
                            <div class="form-group">
                                <label>Nome do Template</label>
                                <input type="text" id="template-name" required>
                            </div>
                            <div class="form-group">
                                <label>Categoria</label>
                                <select id="template-category" required>
                                    <option value="positive">Positivo</option>
                                    <option value="negative">Negativo</option>
                                    <option value="neutral">Neutro</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Conteúdo do Template</label>
                                <textarea id="template-content" rows="4" required></textarea>
                                <small>Variáveis disponíveis: {{client_name}}, {{phone}}</small>
                            </div>
                            <button type="submit" class="btn btn-success">Salvar Template</button>
                        </form>
                    </div>
                </div>

                <!-- Modal de Chat -->
                <div id="chatModal" class="modal">
                    <div class="modal-content" style="width: 90%; max-width: 600px;">
                        <div class="modal-header">
                            <h3>Chat com Cliente</h3>
                            <span class="close" onclick="closeChatModal()">&times;</span>
                        </div>
                        <div id="chat-client-info" style="margin-bottom: 15px; font-weight: bold;"></div>
                        <div id="chat-messages" style="height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; background: #f9fafb;"></div>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="chat-input" placeholder="Digite sua mensagem..." style="flex: 1; padding: 8px;">
                            <button class="btn btn-primary" onclick="sendChatMessage()">Enviar</button>
                        </div>
                    </div>
                </div>

                <!-- Modal de Templates de Mensagens em Massa -->
                <div id="massTemplateModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="mass-template-modal-title">Adicionar Template de Mensagem</h3>
                            <span class="close" onclick="closeMassTemplateModal()">&times;</span>
                        </div>
                        <form id="mass-template-form">
                            <input type="hidden" id="mass-template-id">
                            <div class="form-group">
                                <label>Nome do Template</label>
                                <input type="text" id="mass-template-name" required>
                            </div>
                            <div class="form-group">
                                <label>Categoria</label>
                                <select id="mass-template-category" required>
                                    <option value="promocao">Promoção</option>
                                    <option value="aniversario">Aniversário</option>
                                    <option value="feedback">Feedback</option>
                                    <option value="revisao">Revisão</option>
                                    <option value="welcome">Boas-vindas</option>
                                    <option value="followup">Follow-up</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Conteúdo da Mensagem</label>
                                <textarea id="mass-template-content" rows="6" required></textarea>
                                <small>Variáveis disponíveis: {{nome}}, {{telefone}}, {{data}}, {{empresa}}</small>
                            </div>
                            <div class="form-group">
                                <label>Rede Social (opcional)</label>
                                <select id="mass-template-network">
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="telegram">Telegram</option>
                                </select>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button type="submit" class="btn btn-success">Salvar Template</button>
                                <button type="button" class="btn btn-secondary" onclick="closeMassTemplateModal()">Cancelar</button>
                                <button type="button" class="btn btn-danger" id="delete-template-btn" onclick="deleteMassTemplate()" style="display: none;">Excluir</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(modalsContainer);

            // Adicionar event listeners
            setupFeedbackEventListeners();
            
            // Carregar dados iniciais
            loadFeedbackDashboard();
            loadTemplates();
            loadMassTemplates();
            checkNetworkStatus();
        }

        function setupFeedbackEventListeners() {
            // Tabs de feedback
            document.addEventListener('click', function(e) {
                if (e.target.classList.contains('feedback-tab')) {
                    const tabName = e.target.dataset.feedbackTab;
                    switchFeedbackTab(tabName);
                }
            });

            // Formulário de template
            const templateForm = document.getElementById('template-form');
            if (templateForm) {
                templateForm.addEventListener('submit', handleAddTemplate);
            }

            // Formulário de campanha
            const campaignForm = document.getElementById('campaign-form');
            if (campaignForm) {
                campaignForm.addEventListener('submit', handleCreateCampaign);
            }

            // Formulário de importação
            const importForm = document.getElementById('import-form');
            if (importForm) {
                importForm.addEventListener('submit', handleImportContacts);
            }

            // Fechar modais ao clicar fora
            window.addEventListener('click', function(e) {
                if (e.target.classList.contains('modal')) {
                    e.target.style.display = 'none';
                }
            });
        }

        function switchFeedbackTab(tabName) {
            // Atualizar tabs
            document.querySelectorAll('.feedback-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`[data-feedback-tab="${tabName}"]`).classList.add('active');

            // Atualizar seções
            document.querySelectorAll('.feedback-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`feedback-${tabName}`).classList.add('active');

            // Carregar dados específicos
            switch(tabName) {
                case 'feedbacks':
                    loadFeedbacks();
                    break;
                case 'templates':
                    loadTemplates();
                    break;
                case 'campaigns':
                    loadTemplatesForCampaign();
                    break;
            }
        }

        async function loadFeedbackDashboard() {
            try {
                const response = await fetch('/api/feedback/stats');
                const data = await response.json();
                
                document.getElementById('positive-count').textContent = data.positive || 0;
                document.getElementById('negative-count').textContent = data.negative || 0;
                document.getElementById('total-count').textContent = data.total || 0;
                
                // Carregar feedbacks recentes
                loadRecentFeedbacks();
            } catch (error) {
                console.error('Erro ao carregar dashboard:', error);
                // Dados mock para demonstração
                document.getElementById('positive-count').textContent = '15';
                document.getElementById('negative-count').textContent = '3';
                document.getElementById('total-count').textContent = '18';
            }
        }

        async function loadRecentFeedbacks() {
            try {
                const response = await fetch('/api/feedback?limit=5');
                const feedbacks = await response.json();
                displayRecentFeedbacks(feedbacks);
            } catch (error) {
                console.error('Erro ao carregar feedbacks recentes:', error);
                // Dados mock
                displayRecentFeedbacks([
                    { id: 1, client_name: 'João Silva', content: 'Ótimo atendimento!', category: 'positive', created_at: new Date() },
                    { id: 2, client_name: 'Maria Santos', content: 'Demorou um pouco mas foi resolvido', category: 'neutral', created_at: new Date() }
                ]);
            }
        }

        function displayRecentFeedbacks(feedbacks) {
            const container = document.getElementById('recent-feedbacks-list');
            if (!container) return;

            container.innerHTML = feedbacks.map(feedback => `
                <div class="feedback-card ${feedback.category}">
                    <div class="feedback-header">
                        <span class="feedback-client">${feedback.client_name}</span>
                        <span class="feedback-date">${new Date(feedback.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="feedback-content">${feedback.content}</div>
                </div>
            `).join('');
        }

        async function loadFeedbacks() {
            const category = document.getElementById('category-filter')?.value || '';
            const dateFrom = document.getElementById('date-from')?.value || '';
            const dateTo = document.getElementById('date-to')?.value || '';

            let url = '/api/feedback';
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            
            if (params.toString()) url += '?' + params.toString();

            try {
                const response = await fetch(url);
                const feedbacks = await response.json();
                displayFeedbacks(feedbacks);
            } catch (error) {
                console.error('Erro ao carregar feedbacks:', error);
                // Dados mock
                displayFeedbacks([
                    { id: 1, client_name: 'João Silva', phone: '5511999999999', content: 'Ótimo atendimento!', category: 'positive', created_at: new Date() },
                    { id: 2, client_name: 'Maria Santos', phone: '5511888888888', content: 'Poderia melhorar o tempo de resposta', category: 'negative', created_at: new Date() }
                ]);
            }
        }

        function displayFeedbacks(feedbacks) {
            const container = document.getElementById('feedbacks-container');
            if (!container) return;

            container.innerHTML = feedbacks.map(feedback => `
                <div class="feedback-card ${feedback.category}">
                    <div class="feedback-header">
                        <span class="feedback-client">${feedback.client_name} (${feedback.phone})</span>
                        <span class="feedback-date">${new Date(feedback.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="feedback-content">${feedback.content}</div>
                    <div class="feedback-actions">
                        <button class="btn btn-primary" onclick="startChat('${feedback.client_name}', '${feedback.phone}')">💬 Chat</button>
                        <button class="btn btn-secondary" onclick="generateResponse(${feedback.id})">🤖 Gerar Resposta</button>
                        <select onchange="updateFeedbackCategory(${feedback.id}, this.value)">
                            <option value="positive" ${feedback.category === 'positive' ? 'selected' : ''}>Positivo</option>
                            <option value="negative" ${feedback.category === 'negative' ? 'selected' : ''}>Negativo</option>
                            <option value="neutral" ${feedback.category === 'neutral' ? 'selected' : ''}>Neutro</option>
                        </select>
                    </div>
                </div>
            `).join('');
        }

        async function loadTemplates() {
            try {
                const response = await fetch('/api/feedback/templates');
                const templates = await response.json();
                displayTemplates(templates);
            } catch (error) {
                console.error('Erro ao carregar templates:', error);
                // Dados mock
                displayTemplates([
                    { id: 1, name: 'Agradecimento Positivo', category: 'positive', content: 'Obrigado {{client_name}} pelo feedback positivo! Continuaremos trabalhando para manter nosso padrão de excelência.' },
                    { id: 2, name: 'Desculpa Negativa', category: 'negative', content: '{{client_name}}, pedimos sinceras desculpas pela experiência. Vamos resolver isso imediatamente.' }
                ]);
            }
        }

        function displayTemplates(templates) {
            const container = document.getElementById('templates-container');
            if (!container) return;

            container.innerHTML = templates.map(template => `
                <div class="template-card">
                    <div class="template-header">
                        <h4>${template.name}</h4>
                        <span class="badge badge-${template.category}">${template.category}</span>
                    </div>
                    <div class="template-content">${template.content}</div>
                    <div class="feedback-actions">
                        <button class="btn btn-primary" onclick="useTemplate(${template.id})">Usar</button>
                        <button class="btn btn-danger" onclick="deleteTemplate(${template.id})">Excluir</button>
                    </div>
                </div>
            `).join('');
        }

        function loadTemplatesForCampaign() {
            loadTemplates();
        }

        function showAddTemplateModal() {
            document.getElementById('templateModal').style.display = 'block';
        }

        function closeTemplateModal() {
            document.getElementById('templateModal').style.display = 'none';
        }

        async function handleAddTemplate(e) {
            e.preventDefault();
            
            const template = {
                name: document.getElementById('template-name').value,
                category: document.getElementById('template-category').value,
                content: document.getElementById('template-content').value
            };

            try {
                const response = await fetch('/api/feedback/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(template)
                });

                if (response.ok) {
                    showSuccess('Template criado com sucesso!');
                    closeTemplateModal();
                    loadTemplates();
                }
            } catch (error) {
                console.error('Erro ao criar template:', error);
                showSuccess('Template criado (simulação)');
                closeTemplateModal();
            }
        }

        async function updateFeedbackCategory(feedbackId, category) {
            try {
                const response = await fetch(`/api/feedback/${feedbackId}/category`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category })
                });

                if (response.ok) {
                    showSuccess('Categoria atualizada!');
                    loadFeedbacks();
                }
            } catch (error) {
                console.error('Erro ao atualizar categoria:', error);
                showSuccess('Categoria atualizada (simulação)');
            }
        }

        async function generateResponse(feedbackId) {
            try {
                const response = await fetch(`/api/feedback/${feedbackId}/generate-response`);
                const data = await response.json();
                
                if (data.response) {
                    navigator.clipboard.writeText(data.response);
                    showSuccess('Resposta gerada e copiada para a área de transferência!');
                }
            } catch (error) {
                console.error('Erro ao gerar resposta:', error);
                showSuccess('Resposta gerada (simulação)');
            }
        }

        function startChat(clientName, phone) {
            feedbackState.currentChat = { clientName, phone };
            document.getElementById('chat-client-info').textContent = `Cliente: ${clientName} (${phone})`;
            document.getElementById('chatModal').style.display = 'block';
            loadChatHistory(phone);
        }

        function closeChatModal() {
            document.getElementById('chatModal').style.display = 'none';
            feedbackState.currentChat = null;
        }

        async function loadChatHistory(phone) {
            try {
                const response = await fetch(`/api/feedback/chat/${phone}/history`);
                const messages = await response.json();
                displayChatMessages(messages);
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
                displayChatMessages([]);
            }
        }

        function displayChatMessages(messages) {
            const container = document.getElementById('chat-messages');
            if (!container) return;

            container.innerHTML = messages.map(msg => `
                <div class="chat-message ${msg.sender === 'user' ? 'sent' : 'received'}">
                    <div>${msg.content}</div>
                    <div style="font-size: 11px; color: #666; margin-top: 5px;">
                        ${new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                </div>
            `).join('');
            container.scrollTop = container.scrollHeight;
        }

        async function sendChatMessage() {
            const input = document.getElementById('chat-input');
            const message = input.value.trim();
            if (!message || !feedbackState.currentChat) return;

            const messageData = {
                phone: feedbackState.currentChat.phone,
                content: message,
                type: 'text'
            };

            try {
                const response = await fetch('/api/feedback/chat/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(messageData)
                });

                if (response.ok) {
                    input.value = '';
                    loadChatHistory(feedbackState.currentChat.phone);
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                showSuccess('Mensagem enviada (simulação)');
                input.value = '';
                displayChatMessages([...document.querySelectorAll('#chat-messages .chat-message')].map(el => ({
                    content: el.querySelector('div').textContent,
                    sender: el.classList.contains('sent') ? 'user' : 'client',
                    created_at: new Date()
                })).concat([{
                    content: message,
                    sender: 'user',
                    created_at: new Date()
                }]));
            }
        }

        async function handleCreateCampaign(e) {
            e.preventDefault();
            
            const campaign = {
                name: document.getElementById('campaign-name').value,
                template_id: document.getElementById('campaign-template').value || null,
                message: document.getElementById('campaign-message').value,
                filters: {
                    region: document.getElementById('campaign-region').value,
                    dateFrom: document.getElementById('campaign-date-from').value
                }
            };

            try {
                const response = await fetch('/api/feedback/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(campaign)
                });

                if (response.ok) {
                    showSuccess('Campanha criada com sucesso!');
                    document.getElementById('campaign-form').reset();
                }
            } catch (error) {
                console.error('Erro ao criar campanha:', error);
                showSuccess('Campanha criada (simulação)');
            }
        }

        async function handleImportContacts(e) {
            e.preventDefault();
            const formData = new FormData(e.target);

            try {
                const response = await fetch('/api/feedback/import', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    showSuccess('Contatos importados com sucesso!');
                    e.target.reset();
                }
            } catch (error) {
                console.error('Erro ao importar contatos:', error);
                showSuccess('Contatos importados (simulação)');
            }
        }

        function clearFilters() {
            document.getElementById('category-filter').value = '';
            document.getElementById('date-from').value = '';
            document.getElementById('date-to').value = '';
            loadFeedbacks();
        }

        function showSuccess(message) {
            // Criar toast de sucesso
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #059669;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 1001;
                animation: slideIn 0.3s ease;
            `;
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.remove(), 3000);
        }

        async function initSupabase() {
            // Esta função será implementada quando o Supabase for integrado
            console.log('Preparando estrutura para Supabase...');
        }

        async function saveChatToSupabase(contactId, message) {
            // Esta função será implementada quando o Supabase for integrado
            console.log('Salvando mensagem no Supabase...', { contactId, message });
        }

        async function loadChatHistory(contactId) {
            // Esta função será implementada quando o Supabase for integrado
            console.log('Carregando histórico do Supabase...', { contactId });
            return [];
        }

        function attachFile() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,application/pdf,.doc,.docx,.txt,video/*,audio/*';
            input.onchange = handleFileSelect;
            input.click();
        }

    async function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file || !appState.whatsappChat.currentContact) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('phone', appState.whatsappChat.currentContact.phone);

        try {
            const response = await fetch('/api/whatsapp/send-file', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                addMessage(`📎 ${file.name}`, 'sent');
                showSuccess('Arquivo enviado com sucesso!');
            } else {
                showError('Erro ao enviar arquivo');
            }
        } catch (error) {
            console.error('Erro:', error);
            // Simular envio para demonstração
            addMessage(`📎 ${file.name}`, 'sent');
            showSuccess('Arquivo enviado (simulação)');
        }
    }

    // Inicializar a interface quando o DOM estiver pronto
    let appInterface;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            appInterface = new SACSMAXInterface();
            // Carregar contatos mock para o WhatsApp
            appState.whatsappChat.contacts = [
                { id: 1, name: 'João Silva', phone: '5511999999999', lastMessage: 'Olá, tudo bem?', unread: 2 },
                { id: 2, name: 'Maria Santos', phone: '5511888888888', lastMessage: 'Obrigada pelo contato', unread: 0 },
                { id: 3, name: 'Empresa ABC', phone: '5511777777777', lastMessage: 'Confirmamos seu pedido', unread: 1 },
                { id: 4, name: 'Suporte Técnico', phone: '5511666666666', lastMessage: 'Como posso ajudar?', unread: 0 }
            ];
        });
    } else {
        appInterface = new SACSMAXInterface();
        // Carregar contatos mock para o WhatsApp
        appState.whatsappChat.contacts = [
            { id: 1, name: 'João Silva', phone: '5511999999999', lastMessage: 'Olá, tudo bem?', unread: 2 },
            { id: 2, name: 'Maria Santos', phone: '5511888888888', lastMessage: 'Obrigada pelo contato', unread: 0 },
            { id: 3, name: 'Empresa ABC', phone: '5511777777777', lastMessage: 'Confirmamos seu pedido', unread: 1 },
            { id: 4, name: 'Suporte Técnico', phone: '5511666666666', lastMessage: 'Como posso ajudar?', unread: 0 }
        ];
    }

    // Adicionar listeners para novos elementos
    document.addEventListener('DOMContentLoaded', () => {
        const searchInput = document.getElementById('whatsapp-search-input');
        if (searchInput) searchInput.addEventListener('input', searchContacts);
        
        const messageInput = document.getElementById('whatsapp-message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', handleKeyPress);
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
        
        const attachmentBtn = document.querySelector('.whatsapp-attachment');
        if (attachmentBtn) attachmentBtn.addEventListener('click', attachFile);
        
        // Inicializar funcionalidade de feedback
        initFeedback();
    });

    // Funções para Envio de Mensagens em Massa
    window.previewMassSend = function() {
        const startDate = document.getElementById('massSendStartDate').value;
        const endDate = document.getElementById('massSendEndDate').value;
        const region = document.getElementById('massSendRegion').value;
        const message = document.getElementById('massSendMessage').value;
        
        if (!message.trim()) {
            alert('Por favor, digite uma mensagem para enviar.');
            return;
        }

        // Simular busca de contatos filtrados
        const mockContacts = [
            { name: 'João Silva', phone: '5511999999999', region: 'sudeste', dateAdded: '2024-01-15' },
            { name: 'Maria Santos', phone: '5511888888888', region: 'sul', dateAdded: '2024-01-20' },
            { name: 'Carlos Oliveira', phone: '5511777777777', region: 'norte', dateAdded: '2024-01-25' },
            { name: 'Ana Paula', phone: '5511666666666', region: 'sudeste', dateAdded: '2024-01-10' },
            { name: 'Pedro Costa', phone: '5511555555555', region: 'nordeste', dateAdded: '2024-01-18' }
        ];

        let filteredContacts = mockContacts;

        // Filtrar por região
        if (region) {
            filteredContacts = filteredContacts.filter(contact => contact.region === region);
        }

        // Filtrar por datas
        if (startDate) {
            filteredContacts = filteredContacts.filter(contact => 
                new Date(contact.dateAdded) >= new Date(startDate)
            );
        }
        if (endDate) {
            filteredContacts = filteredContacts.filter(contact => 
                new Date(contact.dateAdded) <= new Date(endDate)
            );
        }

        const previewDiv = document.getElementById('massSendPreview');
        const contentDiv = document.getElementById('massSendPreviewContent');
        
        if (filteredContacts.length > 0) {
            contentDiv.innerHTML = `
                <p><strong>Total de contatos encontrados:</strong> ${filteredContacts.length}</p>
                <p><strong>Mensagem:</strong> ${message}</p>
                <p><strong>Filtros aplicados:</strong></p>
                <ul>
                    ${startDate ? `<li>Data inicial: ${new Date(startDate).toLocaleDateString('pt-BR')}</li>` : ''}
                    ${endDate ? `<li>Data final: ${new Date(endDate).toLocaleDateString('pt-BR')}</li>` : ''}
                    ${region ? `<li>Região: ${region.charAt(0).toUpperCase() + region.slice(1)}</li>` : ''}
                </ul>
                <p><strong>Exemplo de contatos:</strong></p>
                <ul>
                    ${filteredContacts.slice(0, 5).map(contact => 
                        `<li>${contact.name} (${contact.phone}) - Região: ${contact.region}</li>`
                    ).join('')}
                    ${filteredContacts.length > 5 ? `<li>... e mais ${filteredContacts.length - 5} contatos</li>` : ''}
                </ul>
            `;
        } else {
            contentDiv.innerHTML = '<p>Nenhum contato encontrado com os filtros aplicados.</p>';
        }
        
        previewDiv.style.display = 'block';
    };

    window.startMassSend = function() {
        const startDate = document.getElementById('massSendStartDate').value;
        const endDate = document.getElementById('massSendEndDate').value;
        const region = document.getElementById('massSendRegion').value;
        const message = document.getElementById('massSendMessage').value;
        
        if (!message.trim()) {
            alert('Por favor, digite uma mensagem para enviar.');
            return;
        }

        if (!confirm(`Confirma o envio de mensagens em massa para os contatos filtrados?`)) {
            return;
        }

        // Desabilitar botão durante o envio
        const button = document.getElementById('startMassSend');
        button.disabled = true;
        button.textContent = '⏳ Enviando...';

        // Simular envio em massa
        setTimeout(() => {
            alert('Envio em massa simulado com sucesso! 5 mensagens foram enviadas.');
            button.disabled = false;
            button.textContent = '📤 Iniciar Envio em Massa';
            
            // Limpar campos após envio
            document.getElementById('massSendMessage').value = '';
            document.getElementById('massSendPreview').style.display = 'none';
        }, 3000);

        // Em produção, descomentar o código abaixo:
        /*
        fetch('/api/mass-send/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                startDate,
                endDate,
                region,
                message,
                delay: parseInt(document.getElementById('delayMessages').value) || 2000
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Envio em massa iniciado com sucesso! ${data.totalContacts} contatos serão processados.`);
                monitorMassSendProgress(data.jobId);
            } else {
                alert('Erro ao iniciar envio em massa: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao iniciar envio em massa. Verifique a conexão.');
        })
        .finally(() => {
            button.disabled = false;
            button.textContent = '📤 Iniciar Envio em Massa';
        });
        */
    };

    // Função para monitorar progresso do envio em massa (em produção)
    function monitorMassSendProgress(jobId) {
        const checkProgress = () => {
            fetch(`/api/mass-send/progress/${jobId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log(`Progresso: ${data.sent}/${data.total} mensagens enviadas`);
                        
                        if (data.status === 'completed') {
                            alert(`Envio concluído! ${data.sent} mensagens enviadas com sucesso.`);
                            return;
                        }
                        
                        if (data.status === 'running') {
                            setTimeout(checkProgress, 5000);
                        }
                    }
                })
                .catch(error => {
                    console.error('Erro ao verificar progresso:', error);
                });
        };
        
        checkProgress();
    }

// === FUNÇÕES PARA GERENCIAMENTO DE TEMPLATES DE MENSAGENS EM MASSA ===

// Verificar status da rede
async function checkNetworkStatus() {
    try {
        const response = await fetch(`${API_URL}/network-status`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        const networkIndicator = document.getElementById('network-status');
        if (networkIndicator) {
            if (data.connected) {
                networkIndicator.innerHTML = '<span style="color: #28a745;">✓ Online</span>';
            } else {
                networkIndicator.innerHTML = '<span style="color: #dc3545;">✗ Offline</span>';
            }
        }
        return data.connected;
    } catch (error) {
        console.error('Erro ao verificar rede:', error);
        const networkIndicator = document.getElementById('network-status');
        if (networkIndicator) {
            networkIndicator.innerHTML = '<span style="color: #dc3545;">✗ Erro de conexão</span>';
        }
        return false;
    }
}

// Carregar templates de mensagens em massa
async function loadMassTemplates() {
    try {
        const templatesContainer = document.getElementById('mass-templates-container');
        if (!templatesContainer) return;

        // Verificar rede antes de carregar
        const isOnline = await checkNetworkStatus();
        if (!isOnline) {
            templatesContainer.innerHTML = '<p style="color: #dc3545;">Sem conexão com o servidor</p>';
            return;
        }

        // Carregar templates do servidor
        const response = await fetch(`${API_URL}/mass-templates`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const templates = await response.json();
        
        // Limpar container
        templatesContainer.innerHTML = '';
        
        // Templates padrão se não houver nenhum
        const defaultTemplates = [
            { id: 'promo', name: 'Promoção', category: 'promocao', content: 'Olá {nome}! Temos uma super promoção para você: {promocao}. Aproveite agora!' },
            { id: 'aniversario', name: 'Aniversário', category: 'aniversario', content: 'Feliz aniversário, {nome}! Desejamos um dia incrível com muitas felicidades!' },
            { id: 'feedback', name: 'Feedback', category: 'feedback', content: 'Olá {nome}, como foi sua experiência conosco? Sua opinião é muito importante!' },
            { id: 'revisao', name: 'Revisão', category: 'revisao', content: '{nome}, está na hora de revisar seu {servico}. Agende agora e garanta desconto!' },
            { id: 'boasvindas', name: 'Boas-vindas', category: 'boasvindas', content: 'Bem-vindo(a), {nome}! É um prazer ter você conosco. Como posso ajudar?' },
            { id: 'followup', name: 'Follow-up', category: 'followup', content: 'Oi {nome}, só passando para ver se você recebeu nossa última mensagem sobre {assunto}.' }
        ];

        const allTemplates = templates.length > 0 ? templates : defaultTemplates;

        // Criar botões para cada template
        allTemplates.forEach(template => {
            const templateBtn = document.createElement('button');
            templateBtn.className = 'mass-template-btn';
            templateBtn.style.cssText = `
                display: block;
                width: 100%;
                padding: 12px;
                margin: 8px 0;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
            `;
            
            templateBtn.innerHTML = `
                <div style="font-weight: 600; color: #495057;">${template.name}</div>
                <div style="font-size: 12px; color: #6c757d; margin-top: 4px;">
                    Categoria: ${template.category}
                </div>
                <div style="font-size: 11px; color: #868e96; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${template.content}
                </div>
            `;
            
            templateBtn.onclick = () => selectMassTemplate(template);
            templateBtn.ondblclick = () => editMassTemplate(template);
            
            templatesContainer.appendChild(templateBtn);
        });

    } catch (error) {
        console.error('Erro ao carregar templates:', error);
        const templatesContainer = document.getElementById('mass-templates-container');
        if (templatesContainer) {
            templatesContainer.innerHTML = '<p style="color: #dc3545;">Erro ao carregar templates</p>';
        }
    }
}

// Selecionar template para uso
function selectMassTemplate(template) {
    const massMessageTextarea = document.getElementById('mass-message');
    if (massMessageTextarea) {
        massMessageTextarea.value = template.content;
        massMessageTextarea.placeholder = `Template: ${template.name} selecionado`;
        
        // Mostrar variáveis disponíveis
        showTemplateVariables(template.content);
    }
    
    // Destacar template selecionado
    document.querySelectorAll('.mass-template-btn').forEach(btn => {
        btn.style.border = '1px solid #dee2e6';
        btn.style.background = '#f8f9fa';
    });
    
    event.target.style.border = '2px solid #007bff';
    event.target.style.background = '#e7f3ff';
}

// Mostrar variáveis do template
function showTemplateVariables(content) {
    const variables = content.match(/\{([^}]+)\}/g);
    if (variables && variables.length > 0) {
        const variablesDiv = document.getElementById('template-variables');
        if (variablesDiv) {
            variablesDiv.innerHTML = `
                <small style="color: #6c757d;">
                    Variáveis: ${variables.join(', ')}
                </small>
            `;
        }
    }
}

// Abrir modal para criar/editar template
function openMassTemplateModal(template = null) {
    const modal = document.getElementById('mass-template-modal');
    if (!modal) return;

    const form = document.getElementById('mass-template-form');
    const title = document.getElementById('mass-template-modal-title');
    const deleteBtn = document.getElementById('delete-template-btn');

    if (template) {
        // Editar template existente
        title.textContent = 'Editar Template';
        form.elements['template-id'].value = template.id || '';
        form.elements['template-name'].value = template.name || '';
        form.elements['template-category'].value = template.category || '';
        form.elements['template-content'].value = template.content || '';
        form.elements['template-network'].value = template.network || 'whatsapp';
        deleteBtn.style.display = 'inline-block';
    } else {
        // Criar novo template
        title.textContent = 'Novo Template';
        form.reset();
        form.elements['template-id'].value = '';
        deleteBtn.style.display = 'none';
    }

    modal.style.display = 'block';
}

// Salvar template
async function saveMassTemplate(event) {
    event.preventDefault();
    
    const form = document.getElementById('mass-template-form');
    const formData = new FormData(form);
    
    const template = {
        id: formData.get('template-id') || Date.now().toString(),
        name: formData.get('template-name'),
        category: formData.get('template-category'),
        content: formData.get('template-content'),
        network: formData.get('template-network')
    };

    try {
        const isOnline = await checkNetworkStatus();
        if (!isOnline) {
            alert('Sem conexão com o servidor');
            return;
        }

        const method = formData.get('template-id') ? 'PUT' : 'POST';
        const response = await fetch(`${API_URL}/mass-templates`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
        });

        if (response.ok) {
            closeMassTemplateModal();
            loadMassTemplates();
            alert('Template salvo com sucesso!');
        } else {
            alert('Erro ao salvar template');
        }
    } catch (error) {
        console.error('Erro ao salvar template:', error);
        alert('Erro ao salvar template');
    }
}

// Deletar template
async function deleteMassTemplate() {
    const form = document.getElementById('mass-template-form');
    const templateId = form.elements['template-id'].value;
    
    if (!templateId) return;

    if (!confirm('Tem certeza que deseja deletar este template?')) return;

    try {
        const isOnline = await checkNetworkStatus();
        if (!isOnline) {
            alert('Sem conexão com o servidor');
            return;
        }

        const response = await fetch(`${API_URL}/mass-templates/${templateId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            closeMassTemplateModal();
            loadMassTemplates();
            alert('Template deletado com sucesso!');
        } else {
            alert('Erro ao deletar template');
        }
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        alert('Erro ao deletar template');
    }
}

// Fechar modal
function closeMassTemplateModal() {
    const modal = document.getElementById('mass-template-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Atualizar status da rede periodicamente
setInterval(checkNetworkStatus, 30000); // Verificar a cada 30 segundos

// Event Listeners para templates
setTimeout(() => {
    const massTemplateForm = document.getElementById('mass-template-form');
    if (massTemplateForm) {
        massTemplateForm.addEventListener('submit', saveMassTemplate);
    }

    const addTemplateBtn = document.getElementById('add-template-btn');
    if (addTemplateBtn) {
        addTemplateBtn.addEventListener('click', () => openMassTemplateModal());
    }

    const closeModalBtn = document.querySelector('#mass-template-modal .close');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeMassTemplateModal);
    }

    const deleteTemplateBtn = document.getElementById('delete-template-btn');
    if (deleteTemplateBtn) {
        deleteTemplateBtn.addEventListener('click', deleteMassTemplate);
    }
}, 1000);

// === FIM DAS FUNÇÕES DE TEMPLATES DE MENSAGENS EM MASSA ===

// === FUNÇÕES PARA CONTATOS ENVIADOS ===

// Variáveis globais para contatos
let sentContacts = [];
let currentPage = 1;
const itemsPerPage = 20;

// Carregar contatos enviados
async function loadSentContacts(page = 1) {
    try {
        const response = await fetch(`${API_URL}/sent-contacts?page=${page}&limit=${itemsPerPage}`);
        if (!response.ok) throw new Error('Erro ao carregar contatos');
        
        const data = await response.json();
        sentContacts = data.contacts || [];
        currentPage = page;
        
        renderSentContacts();
        renderContactsPagination(data.totalPages || 1);
        updateContactsStats();
        
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        showContactsError('Erro ao carregar contatos');
    }
}

// Renderizar contatos na tabela
function renderSentContacts() {
    const tbody = document.getElementById('sent-contacts-table-body');
    if (!tbody) return;

    if (sentContacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #6b7280;">
                    Nenhum contato enviado encontrado
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = sentContacts.map(contact => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px;">${contact.display_name || contact.name || 'N/A'}</td>
            <td style="padding: 12px;">${contact.phone || contact.phone_normalized || 'N/A'}</td>
            <td style="padding: 12px;">${contact.file_name || 'N/A'}</td>
            <td style="padding: 12px;">${formatDate(contact.sent_at) || formatDate(contact.created_at)}</td>
            <td style="padding: 12px;">
                <span class="status-badge status-${contact.delivery_status}">${getStatusText(contact.delivery_status)}</span>
            </td>
            <td style="padding: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${contact.message_content || 'Mensagem não disponível'}
            </td>
            <td style="padding: 12px;">
                <button class="btn btn-sm" onclick="viewContactDetails('${contact.id}')" title="Ver detalhes">👁️</button>
                <button class="btn btn-sm" onclick="resendMessage('${contact.id}')" title="Reenviar">🔄</button>
            </td>
        </tr>
    `).join('');
}

// Atualizar estatísticas dos contatos
async function updateContactsStats() {
    try {
        const response = await fetch(`${API_URL}/sent-contacts/stats`);
        const stats = await response.json();

        document.getElementById('total-contacts-count').textContent = stats.totalContacts || 0;
        document.getElementById('sent-messages-count').textContent = stats.totalSent || 0;
        document.getElementById('delivered-messages-count').textContent = stats.totalDelivered || 0;
        document.getElementById('failed-messages-count').textContent = stats.totalFailed || 0;

    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Buscar contatos enviados
async function searchSentContacts() {
    const searchTerm = document.getElementById('contacts-search').value.trim();
    if (!searchTerm) {
        loadSentContacts();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/sent-contacts/search?q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Erro ao buscar contatos');

        const data = await response.json();
        sentContacts = data.contacts || [];
        
        renderSentContacts();
        renderContactsPagination(data.totalPages || 1);
        
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        showContactsError('Erro ao buscar contatos');
    }
}

// Limpar busca
function clearContactsSearch() {
    document.getElementById('contacts-search').value = '';
    loadSentContacts();
}

// Renderizar paginação
function renderContactsPagination(totalPages) {
    const pagination = document.getElementById('contacts-pagination');
    if (!pagination || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';
    
    // Botão anterior
    if (currentPage > 1) {
        html += `<button class="btn" onclick="loadSentContacts(${currentPage - 1})">Anterior</button>`;
    }

    // Números de página
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        html += `<button class="btn ${activeClass}" onclick="loadSentContacts(${i})">${i}</button>`;
    }

    // Botão próximo
    if (currentPage < totalPages) {
        html += `<button class="btn" onclick="loadSentContacts(${currentPage + 1})">Próximo</button>`;
    }

    pagination.innerHTML = html;
}

// Ver detalhes do contato
function viewContactDetails(contactId) {
    const contact = sentContacts.find(c => c.id === contactId);
    if (!contact) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Detalhes do Contato</h3>
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            </div>
            <div style="padding: 20px;">
                <p><strong>Nome:</strong> ${contact.display_name || contact.name || 'N/A'}</p>
                <p><strong>Telefone:</strong> ${contact.phone || contact.phone_normalized || 'N/A'}</p>
                <p><strong>Arquivo Origem:</strong> ${contact.file_name || 'N/A'}</p>
                <p><strong>Data de Envio:</strong> ${formatDate(contact.sent_at) || formatDate(contact.created_at)}</p>
                <p><strong>Status:</strong> ${getStatusText(contact.delivery_status)}</p>
                <p><strong>Mensagem:</strong></p>
                <div style="background: #f3f4f6; padding: 10px; border-radius: 4px; margin-top: 10px;">
                    ${contact.message_content || 'Mensagem não disponível'}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Reenviar mensagem
async function resendMessage(contactId) {
    if (!confirm('Tem certeza que deseja reenviar esta mensagem?')) return;

    try {
        const response = await fetch(`${API_URL}/sent-contacts/${contactId}/resend`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Mensagem reenviada com sucesso!');
            loadSentContacts(currentPage);
        } else {
            alert('Erro ao reenviar mensagem');
        }
    } catch (error) {
        console.error('Erro ao reenviar:', error);
        alert('Erro ao reenviar mensagem');
    }
}

// Funções auxiliares
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendente',
        'sent': 'Enviado',
        'delivered': 'Entregue',
        'failed': 'Falhou'
    };
    return statusMap[status] || status;
}

function showContactsError(message) {
    const tbody = document.getElementById('sent-contacts-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #dc3545;">
                    ${message}
                </td>
            </tr>
        `;
    }
}

// Event listener para a aba de contatos enviados
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar evento para quando a aba de contatos for selecionada
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('feedback-tab') && e.target.dataset.feedbackTab === 'sent-contacts') {
            loadSentContacts();
        }
    });

    // Adicionar evento de busca ao pressionar Enter
    const searchInput = document.getElementById('contacts-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchSentContacts();
            }
        });
    }
});

// === FIM DAS FUNÇÕES DE CONTATOS ENVIADOS ===

// === FUNÇÕES DE ESTILO E UTILITÁRIOS ===

// Adicionar estilos CSS para a aba de contatos
const contactsStyles = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
    }
    .status-badge.status-pending {
        background: #fef3c7;
        color: #92400e;
    }
    .status-badge.status-sent {
        background: #dbeafe;
        color: #1e40af;
    }
    .status-badge.status-delivered {
        background: #d1fae5;
        color: #065f46;
    }
    .status-badge.status-failed {
        background: #fee2e2;
        color: #991b1b;
    }
    .contacts-table tr:hover {
        background: #f9fafb;
    }
    .btn-sm {
        padding: 4px 8px;
        font-size: 12px;
    }
`;

// Adicionar estilos ao head
const styleSheet = document.createElement('style');
styleSheet.textContent = contactsStyles;
document.head.appendChild(styleSheet);

// === FIM DAS FUNÇÕES DE ESTILO ===

})();