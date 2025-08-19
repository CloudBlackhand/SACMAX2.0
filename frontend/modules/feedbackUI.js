/**
 * SACSMAX - Módulo de Interface de Feedback
 * Gerenciamento de templates, estatísticas e interface de feedback
 */

import { apiService } from '../services/apiService.js';
import { Formatters } from '../utils/formatters.js';

class FeedbackUIManager {
    constructor() {
        this.templates = [];
        this.stats = {};
        this.recentFeedback = [];
    }

    init() {
        this.createFeedbackSection();
        this.bindEvents();
        this.loadInitialData();
    }

    createFeedbackSection() {
        const feedbackSection = document.createElement('div');
        feedbackSection.className = 'section';
        feedbackSection.id = 'feedback-section';
        
        feedbackSection.innerHTML = `
            <h2>Gerenciamento de Feedback</h2>
            
            <div class="status-card">
                <h3>Estatísticas de Feedback</h3>
                <div id="feedback-stats">
                    <div class="loading">Carregando estatísticas...</div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>Templates de Mensagem</h3>
                <div id="templates-list">
                    <div class="loading">Carregando templates...</div>
                </div>
                <button type="button" class="btn btn-success" id="add-template-btn">Adicionar Template</button>
            </div>
            
            <div class="status-card">
                <h3>Feedback Recentes</h3>
                <div id="recent-feedback">
                    <div class="loading">Carregando feedbacks...</div>
                </div>
            </div>
            
            <!-- Modal para adicionar template -->
            <div id="template-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; width: 90%; max-width: 500px;">
                    <h3>Adicionar Novo Template</h3>
                    <form id="template-form">
                        <div class="form-group">
                            <label>Nome do Template:</label>
                            <input type="text" id="template-name" required>
                        </div>
                        <div class="form-group">
                            <label>Mensagem:</label>
                            <textarea id="template-message" rows="4" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Tipo:</label>
                            <select id="template-type">
                                <option value="text">Texto</option>
                                <option value="image">Imagem</option>
                                <option value="sticker">Sticker</option>
                            </select>
                        </div>
                        <div class="button-group">
                            <button type="submit" class="btn btn-success">Salvar</button>
                            <button type="button" class="btn" id="cancel-template">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.querySelector('.content').appendChild(feedbackSection);
    }

    bindEvents() {
        const addTemplateBtn = document.getElementById('add-template-btn');
        const cancelTemplateBtn = document.getElementById('cancel-template');
        const templateForm = document.getElementById('template-form');

        if (addTemplateBtn) {
            addTemplateBtn.addEventListener('click', this.showTemplateModal.bind(this));
        }

        if (cancelTemplateBtn) {
            cancelTemplateBtn.addEventListener('click', this.hideTemplateModal.bind(this));
        }

        if (templateForm) {
            templateForm.addEventListener('submit', this.saveTemplate.bind(this));
        }
    }

    async loadInitialData() {
        await Promise.all([
            this.loadStats(),
            this.loadTemplates(),
            this.loadRecentFeedback()
        ]);
    }

    async loadStats() {
        try {
            this.stats = await apiService.getFeedbackStats();
            this.renderStats();
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            document.getElementById('feedback-stats').innerHTML = '<div class="alert alert-error">Erro ao carregar estatísticas</div>';
        }
    }

    async loadTemplates() {
        try {
            this.templates = await apiService.getFeedbackTemplates();
            this.renderTemplates();
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
            document.getElementById('templates-list').innerHTML = '<div class="alert alert-error">Erro ao carregar templates</div>';
        }
    }

    async loadRecentFeedback() {
        try {
            this.recentFeedback = await apiService.getRecentFeedback();
            this.renderRecentFeedback();
        } catch (error) {
            console.error('Erro ao carregar feedbacks:', error);
            document.getElementById('recent-feedback').innerHTML = '<div class="alert alert-error">Erro ao carregar feedbacks</div>';
        }
    }

    renderStats() {
        const statsDiv = document.getElementById('feedback-stats');
        
        if (!this.stats || Object.keys(this.stats).length === 0) {
            statsDiv.innerHTML = '<p>Nenhuma estatística disponível</p>';
            return;
        }

        statsDiv.innerHTML = `
            <div class="status-item">
                <span>Total de Mensagens Enviadas:</span>
                <span>${this.stats.totalMessages || 0}</span>
            </div>
            <div class="status-item">
                <span>Taxa de Resposta:</span>
                <span>${this.stats.responseRate || 0}%</span>
            </div>
            <div class="status-item">
                <span>Templates Ativos:</span>
                <span>${this.stats.activeTemplates || 0}</span>
            </div>
            <div class="status-item">
                <span>Campanhas Ativas:</span>
                <span>${this.stats.activeCampaigns || 0}</span>
            </div>
        `;
    }

    renderTemplates() {
        const templatesDiv = document.getElementById('templates-list');
        
        if (!this.templates || this.templates.length === 0) {
            templatesDiv.innerHTML = '<p>Nenhum template cadastrado</p>';
            return;
        }

        templatesDiv.innerHTML = '';
        
        this.templates.forEach(template => {
            const templateDiv = document.createElement('div');
            templateDiv.className = 'status-card';
            templateDiv.innerHTML = `
                <div class="status-item">
                    <strong>${Formatters.escapeHtml(template.name)}</strong>
                    <span class="badge badge-${template.type}">${template.type}</span>
                </div>
                <p>${Formatters.escapeHtml(Formatters.truncateText(template.message, 100))}</p>
                <div class="button-group">
                    <button class="btn btn-sm" onclick="feedbackUI.editTemplate('${template.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="feedbackUI.deleteTemplate('${template.id}')">Excluir</button>
                </div>
            `;
            templatesDiv.appendChild(templateDiv);
        });
    }

    renderRecentFeedback() {
        const feedbackDiv = document.getElementById('recent-feedback');
        
        if (!this.recentFeedback || this.recentFeedback.length === 0) {
            feedbackDiv.innerHTML = '<p>Nenhum feedback recente</p>';
            return;
        }

        feedbackDiv.innerHTML = '';
        
        this.recentFeedback.forEach(feedback => {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'contact-item';
            feedbackDiv.innerHTML = `
                <div>
                    <strong>${Formatters.escapeHtml(feedback.contactName || feedback.phone)}</strong>
                    <br>
                    <small>${Formatters.escapeHtml(Formatters.truncateText(feedback.message, 50))}</small>
                    <br>
                    <small>${Formatters.formatDateTime(feedback.timestamp)}</small>
                </div>
                <div class="status-indicator ${feedback.status === 'sent' ? 'status-online' : 'status-waiting'}"></div>
            `;
            feedbackDiv.appendChild(feedbackDiv);
        });
    }

    showTemplateModal() {
        const modal = document.getElementById('template-modal');
        if (modal) {
            modal.style.display = 'block';
            document.getElementById('template-name').focus();
        }
    }

    hideTemplateModal() {
        const modal = document.getElementById('template-modal');
        if (modal) {
            modal.style.display = 'none';
            document.getElementById('template-form').reset();
        }
    }

    async saveTemplate(e) {
        e.preventDefault();
        
        const name = document.getElementById('template-name').value;
        const message = document.getElementById('template-message').value;
        const type = document.getElementById('template-type').value;
        
        const template = { name, message, type };
        
        try {
            const result = await apiService.saveFeedbackTemplate(template);
            
            if (result.success) {
                this.showMessage('Template salvo com sucesso!', 'success');
                this.hideTemplateModal();
                await this.loadTemplates();
            } else {
                this.showMessage(result.message || 'Erro ao salvar template', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar template:', error);
            this.showMessage('Erro ao conectar com o servidor', 'error');
        }
    }

    async editTemplate(templateId) {
        // Implementar edição de template
        console.log('Editar template:', templateId);
    }

    async deleteTemplate(templateId) {
        if (confirm('Tem certeza que deseja excluir este template?')) {
            try {
                // Implementar exclusão de template
                console.log('Excluir template:', templateId);
                await this.loadTemplates();
            } catch (error) {
                console.error('Erro ao excluir template:', error);
            }
        }
    }

    showMessage(message, type = 'info') {
        // Similar ao método showMessage dos outros módulos
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type}`;
        messageDiv.textContent = message;
        
        const feedbackSection = document.getElementById('feedback-section');
        if (feedbackSection) {
            feedbackSection.insertBefore(messageDiv, feedbackSection.firstChild);
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 5000);
        }
    }

    refresh() {
        this.loadInitialData();
    }
}

// Exportar para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FeedbackUIManager };
} else {
    // Exportar global para uso em scripts tradicionais
    window.FeedbackUIManager = FeedbackUIManager;
}