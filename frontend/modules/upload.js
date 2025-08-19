/**
 * SACSMAX - Módulo de Upload
 * Gerenciamento de uploads de arquivos Excel e mídia
 */

import { apiService } from '../services/apiService.js';
import { Formatters } from '../utils/formatters.js';

class UploadManager {
    constructor() {
        this.uploadArea = null;
        this.fileInput = null;
        this.uploadedContacts = [];
    }

    init() {
        this.createUploadSection();
        this.bindEvents();
    }

    createUploadSection() {
        const uploadSection = document.createElement('div');
        uploadSection.className = 'section';
        uploadSection.id = 'upload-section';
        
        uploadSection.innerHTML = `
            <h2>Upload de Contatos</h2>
            <div class="upload-area" id="upload-area">
                <div class="upload-icon">📁</div>
                <h3>Arraste o arquivo Excel aqui</h3>
                <p>ou <button type="button" class="btn btn-success" id="select-file-btn">selecione um arquivo</button></p>
                <input type="file" id="file-input" accept=".xlsx,.xls,.csv" style="display: none;">
            </div>
            <div id="upload-status"></div>
            <div id="contacts-preview" style="display: none;">
                <h3>Pré-visualização de Contatos</h3>
                <div class="contacts-list" id="contacts-list"></div>
                <button type="button" class="btn btn-success" id="confirm-upload-btn">Confirmar Upload</button>
            </div>
        `;

        document.querySelector('.content').appendChild(uploadSection);
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
    }

    bindEvents() {
        if (this.uploadArea) {
            this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        const selectFileBtn = document.getElementById('select-file-btn');
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', () => this.fileInput.click());
        }

        const confirmUploadBtn = document.getElementById('confirm-upload-btn');
        if (confirmUploadBtn) {
            confirmUploadBtn.addEventListener('click', this.confirmUpload.bind(this));
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        const statusDiv = document.getElementById('upload-status');
        
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            this.showStatus('Por favor, selecione um arquivo Excel válido (.xlsx, .xls ou .csv)', 'error');
            return;
        }

        this.showStatus('Processando arquivo...', 'info');

        try {
            const result = await apiService.uploadExcel(file);
            
            if (result.success && result.contacts) {
                this.uploadedContacts = result.contacts;
                this.showContactsPreview(result.contacts);
                this.showStatus(`Arquivo processado com sucesso! ${result.contacts.length} contatos encontrados.`, 'success');
            } else {
                this.showStatus(result.message || 'Erro ao processar arquivo', 'error');
            }
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            this.showStatus('Erro ao fazer upload do arquivo', 'error');
        }
    }

    showContactsPreview(contacts) {
        const previewDiv = document.getElementById('contacts-preview');
        const contactsList = document.getElementById('contacts-list');
        
        contactsList.innerHTML = '';
        
        contacts.slice(0, 10).forEach(contact => {
            const contactDiv = document.createElement('div');
            contactDiv.className = 'contact-item';
            contactDiv.innerHTML = `
                <div>
                    <strong>${Formatters.escapeHtml(contact.nome || contact.name || 'Sem nome')}</strong>
                    <br>
                    <small>${Formatters.escapeHtml(contact.telefone || contact.phone || 'Sem telefone')}</small>
                </div>
                <div class="status-indicator status-online"></div>
            `;
            contactsList.appendChild(contactDiv);
        });

        if (contacts.length > 10) {
            const moreDiv = document.createElement('div');
            moreDiv.className = 'contact-item';
            moreDiv.innerHTML = `<em>... e mais ${contacts.length - 10} contatos</em>`;
            contactsList.appendChild(moreDiv);
        }

        previewDiv.style.display = 'block';
    }

    confirmUpload() {
        // Disparar evento global para notificar outros módulos
        window.dispatchEvent(new CustomEvent('contactsUploaded', {
            detail: { contacts: this.uploadedContacts }
        }));
        
        this.showStatus('Contatos confirmados e prontos para uso!', 'success');
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('upload-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            statusDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }

    getContacts() {
        return this.uploadedContacts;
    }
}

// Exportar para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UploadManager };
} else {
    // Exportar global para uso em scripts tradicionais
    window.UploadManager = UploadManager;
}