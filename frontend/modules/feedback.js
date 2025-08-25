// Módulo Feedback - Gestão de feedbacks dos clientes (100% Funcional)

class FeedbackModule {
    constructor() {
        this.feedbacks = [];
        this.filter = 'all'; // all, positive, negative, neutral
        this.searchTerm = '';
        this.loading = false;
        this.stats = { positive: 0, negative: 0, neutral: 0, total: 0 };
        
        // URLs do backend
        this.backendUrl = 'http://localhost:5000';
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">📊</span>
                    <h2 class="module-title">Gestão de Feedbacks</h2>
                    <div class="feedback-stats">
                        <span class="stat positive">${this.stats.positive} Positivos</span>
                        <span class="stat negative">${this.stats.negative} Negativos</span>
                        <span class="stat neutral">${this.stats.neutral} Neutros</span>
                        <span class="stat total">${this.stats.total} Total</span>
                    </div>
                </div>
                
                <div class="feedback-controls">
                    <div class="filter-buttons">
                        <button class="filter-btn ${this.filter === 'all' ? 'active' : ''}" onclick="feedbackModule.setFilter('all')">
                            Todos (${this.stats.total})
                        </button>
                        <button class="filter-btn ${this.filter === 'positive' ? 'active' : ''}" onclick="feedbackModule.setFilter('positive')">
                            Positivos (${this.stats.positive})
                        </button>
                        <button class="filter-btn ${this.filter === 'negative' ? 'active' : ''}" onclick="feedbackModule.setFilter('negative')">
                            Negativos (${this.stats.negative})
                        </button>
                        <button class="filter-btn ${this.filter === 'neutral' ? 'active' : ''}" onclick="feedbackModule.setFilter('neutral')">
                            Neutros (${this.stats.neutral})
                        </button>
                    </div>
                    
                    <div class="search-container">
                        <input type="text" 
                               class="search-input" 
                               id="feedback-search"
                               placeholder="Buscar feedbacks..."
                               value="${this.searchTerm}" />
                    </div>
                    
                    <button class="btn btn-primary" onclick="feedbackModule.refreshFeedbacks()">
                        🔄 Atualizar
                    </button>
                </div>
                
                <div class="feedback-content">
                    ${this.loading ? this.renderLoading() : this.renderFeedbackList()}
                </div>
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Carregando feedbacks...</p>
            </div>
        `;
    }

    renderFeedbackList() {
        const filteredFeedbacks = this.getFilteredFeedbacks();
        
        if (filteredFeedbacks.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>Nenhum feedback encontrado</h3>
                    <p>${this.feedbacks.length === 0 ? 'Nenhum feedback foi analisado ainda' : 'Nenhum feedback para os filtros selecionados'}</p>
                    ${this.feedbacks.length === 0 ? `
                        <button class="btn btn-secondary" onclick="feedbackModule.createSampleFeedbacks()">
                            Criar Feedbacks de Exemplo
                        </button>
                    ` : ''}
                </div>
            `;
        }

        return filteredFeedbacks.map(feedback => `
            <div class="feedback-item ${feedback.sentiment}" 
                 ondblclick="feedbackModule.openChat('${feedback.contact_phone}')"
                 onclick="feedbackModule.selectFeedback('${feedback.id}')">
                <div class="feedback-header">
                    <div class="feedback-contact">
                        <div class="contact-avatar">
                            <div class="avatar-placeholder">${feedback.contact_name.charAt(0).toUpperCase()}</div>
                        </div>
                        <div class="contact-info">
                            <div class="contact-name">${feedback.contact_name}</div>
                            <div class="contact-phone">${feedback.contact_phone}</div>
                        </div>
                    </div>
                    <div class="feedback-meta">
                        <div class="feedback-date">${this.formatDate(feedback.timestamp)}</div>
                        <div class="sentiment-badge ${feedback.sentiment}">
                            ${this.getSentimentIcon(feedback.sentiment)}
                            ${this.getSentimentText(feedback.sentiment)}
                            <span class="score">(${(feedback.score * 100).toFixed(1)}%)</span>
                        </div>
                    </div>
                </div>
                
                <div class="feedback-content">
                    <div class="feedback-text">${feedback.text}</div>
                    <div class="feedback-keywords">
                        ${feedback.keywords && feedback.keywords.length > 0 ? 
                            feedback.keywords.map(keyword => `
                            <span class="keyword">${keyword}</span>
                            `).join('') : 
                            '<span class="no-keywords">Nenhuma palavra-chave identificada</span>'
                        }
                    </div>
                </div>
                
                <div class="feedback-actions">
                    <button class="action-btn" onclick="feedbackModule.viewDetails('${feedback.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        Detalhes
                    </button>
                    <button class="action-btn" onclick="feedbackModule.openChat('${feedback.contact_phone}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                        Chat
                    </button>
                    <button class="action-btn" onclick="feedbackModule.exportFeedback('${feedback.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        Exportar
                    </button>
                </div>
            </div>
        `).join('');
    }

    getSentimentIcon(sentiment) {
        switch (sentiment) {
            case 'positive': return '👍';
            case 'negative': return '👎';
            case 'neutral': return '😐';
            default: return '📊';
        }
    }

    getSentimentText(sentiment) {
        switch (sentiment) {
            case 'positive': return 'Positivo';
            case 'negative': return 'Negativo';
            case 'neutral': return 'Neutro';
            default: return 'Indefinido';
        }
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Data não disponível';
        
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return timestamp;
        }
    }

    getFilteredFeedbacks() {
        let filtered = this.feedbacks;
        
        // Filtro por sentimento
        if (this.filter !== 'all') {
            filtered = filtered.filter(f => f.sentiment === this.filter);
        }
        
        // Filtro por busca
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(f => 
                f.contact_name.toLowerCase().includes(term) ||
                f.text.toLowerCase().includes(term) ||
                (f.keywords && f.keywords.some(k => k.toLowerCase().includes(term)))
            );
        }
        
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    async init() {
        this.setupEventListeners();
        await this.loadFeedbacks();
        await this.loadStats();
    }

    setupEventListeners() {
        setTimeout(() => {
            const searchInput = document.getElementById('feedback-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchTerm = e.target.value;
                    this.updateFeedbackList();
                });
            }
        }, 100);
    }

    async loadFeedbacks() {
        try {
            this.loading = true;
            this.updateFeedbackList();
            
            const response = await fetch(`${this.backendUrl}/api/feedback/list?limit=100`);
            const data = await response.json();
            
            if (data.success) {
                this.feedbacks = data.feedbacks || [];
                console.log(`✅ Carregados ${this.feedbacks.length} feedbacks do backend`);
            } else {
                console.error('❌ Erro ao carregar feedbacks:', data.message);
                this.feedbacks = [];
            }
        } catch (error) {
            console.error('❌ Erro ao carregar feedbacks:', error);
            this.feedbacks = [];
        } finally {
            this.loading = false;
            this.updateFeedbackList();
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.backendUrl}/api/feedback/stats`);
            const data = await response.json();
            
            if (data.success) {
                this.stats = data.stats || { positive: 0, negative: 0, neutral: 0, total: 0 };
                console.log('✅ Estatísticas carregadas:', this.stats);
            } else {
                console.error('❌ Erro ao carregar estatísticas:', data.message);
                this.stats = { positive: 0, negative: 0, neutral: 0, total: 0 };
            }
        } catch (error) {
            console.error('❌ Erro ao carregar estatísticas:', error);
            this.stats = { positive: 0, negative: 0, neutral: 0, total: 0 };
        }
    }

    async refreshFeedbacks() {
        await this.loadFeedbacks();
        await this.loadStats();
        this.updateFeedbackList();
        this.showNotification('Feedbacks atualizados!', 'success');
    }

    setFilter(filter) {
        this.filter = filter;
        this.updateFeedbackList();
    }

    updateFeedbackList() {
        const feedbackContent = document.querySelector('.feedback-content');
        if (feedbackContent) {
            feedbackContent.innerHTML = this.loading ? this.renderLoading() : this.renderFeedbackList();
        }
    }

    selectFeedback(feedbackId) {
        // Remove seleção anterior
        document.querySelectorAll('.feedback-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Adiciona seleção atual
        const selectedItem = document.querySelector(`[onclick*="${feedbackId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }

    openChat(contactPhone) {
        // Salva o contato selecionado
        localStorage.setItem('selected_contact_phone', contactPhone);
        
        // Muda para o módulo WhatsApp
        window.SacsMaxApp.switchModule('whatsapp');
        
        // Notifica o módulo WhatsApp para abrir o chat
        setTimeout(() => {
            const whatsappModule = window.SacsMaxApp.modules.whatsapp;
            if (whatsappModule && whatsappModule.selectContact) {
                // Encontra o contato pelo telefone
                const contact = whatsappModule.contacts.find(c => c.phone === contactPhone);
                if (contact) {
                    whatsappModule.selectContact(contact.id);
                }
            }
        }, 500);
    }

    viewDetails(feedbackId) {
        const feedback = this.feedbacks.find(f => f.id === feedbackId);
        if (feedback) {
            const details = `
Detalhes do Feedback:

Cliente: ${feedback.contact_name}
Telefone: ${feedback.contact_phone}
Data: ${this.formatDate(feedback.timestamp)}
Sentimento: ${this.getSentimentText(feedback.sentiment)} (${(feedback.score * 100).toFixed(1)}%)
Analisado em: ${this.formatDate(feedback.analyzed_at)}

Mensagem:
${feedback.text}

Palavras-chave: ${feedback.keywords ? feedback.keywords.join(', ') : 'Nenhuma identificada'}
            `;
            
            alert(details);
        }
    }

    exportFeedback(feedbackId) {
        const feedback = this.feedbacks.find(f => f.id === feedbackId);
        if (feedback) {
            const data = {
                cliente: feedback.contact_name,
                telefone: feedback.contact_phone,
                data: this.formatDate(feedback.timestamp),
                sentimento: this.getSentimentText(feedback.sentiment),
                score: (feedback.score * 100).toFixed(1) + '%',
                mensagem: feedback.text,
                palavras_chave: feedback.keywords || [],
                analisado_em: this.formatDate(feedback.analyzed_at)
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `feedback_${feedback.contact_name}_${feedback.timestamp}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showNotification('Feedback exportado com sucesso!', 'success');
        }
    }

    async createSampleFeedbacks() {
        try {
            const sampleMessages = [
                {
                    contact_name: 'João Silva',
                    contact_phone: '5511999999999',
                    text: 'Excelente atendimento! O técnico foi muito profissional e resolveu meu problema rapidamente. Recomendo muito!'
                },
                {
                    contact_name: 'Maria Santos',
                    contact_phone: '5511888888888',
                    text: 'Demorou muito para resolver meu problema. Não estou satisfeita com o serviço. Muito decepcionada.'
                },
                {
                    contact_name: 'Pedro Costa',
                    contact_phone: '5511777777777',
                    text: 'O serviço foi adequado. Resolveu o problema, mas poderia ter sido mais rápido. Tudo bem.'
                }
            ];

            for (const message of sampleMessages) {
                await this.analyzeAndSaveMessage(message);
            }

            await this.refreshFeedbacks();
            this.showNotification('Feedbacks de exemplo criados!', 'success');
        } catch (error) {
            console.error('Erro ao criar feedbacks de exemplo:', error);
            this.showNotification('Erro ao criar feedbacks de exemplo', 'error');
        }
    }

    async analyzeAndSaveMessage(messageData) {
        try {
            const response = await fetch(`${this.backendUrl}/api/feedback/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...messageData,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Erro ao analisar e salvar mensagem:', error);
            return false;
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

// Estilos específicos do módulo Feedback
const feedbackStyles = `
    .feedback-stats {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
    }

    .stat {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .stat.positive {
        background: #d4edda;
        color: #155724;
    }

    .stat.negative {
        background: #f8d7da;
        color: #721c24;
    }

    .stat.neutral {
        background: #e2e3e5;
        color: #383d41;
    }

    .stat.total {
        background: #d1ecf1;
        color: #0c5460;
    }

    .feedback-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .filter-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.9rem;
    }

    .filter-btn:hover {
        background: #f8f9fa;
    }

    .filter-btn.active {
        background: #dc3545;
        color: white;
        border-color: #dc3545;
    }

    .search-container {
        flex: 1;
        max-width: 300px;
    }

    .search-input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 0.9rem;
    }

    .feedback-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
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

    .feedback-item {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .feedback-item:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transform: translateY(-1px);
    }

    .feedback-item.selected {
        border-color: #dc3545;
        box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
    }

    .feedback-item.positive {
        border-left: 4px solid #28a745;
    }

    .feedback-item.negative {
        border-left: 4px solid #dc3545;
    }

    .feedback-item.neutral {
        border-left: 4px solid #6c757d;
    }

    .feedback-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    .feedback-contact {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .contact-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
    }

    .avatar-placeholder {
        width: 100%;
        height: 100%;
        background: #dc3545;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
    }

    .contact-info {
        display: flex;
        flex-direction: column;
    }

    .contact-name {
        font-weight: 500;
        color: #333;
        font-size: 0.9rem;
    }

    .contact-phone {
        font-size: 0.8rem;
        color: #666;
    }

    .feedback-meta {
        text-align: right;
    }

    .feedback-date {
        font-size: 0.8rem;
        color: #666;
        margin-bottom: 0.25rem;
    }

    .sentiment-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .sentiment-badge.positive {
        background: #d4edda;
        color: #155724;
    }

    .sentiment-badge.negative {
        background: #f8d7da;
        color: #721c24;
    }

    .sentiment-badge.neutral {
        background: #e2e3e5;
        color: #383d41;
    }

    .score {
        font-size: 0.7rem;
        opacity: 0.8;
    }

    .feedback-content {
        margin-bottom: 1rem;
    }

    .feedback-text {
        color: #333;
        line-height: 1.5;
        margin-bottom: 0.75rem;
    }

    .feedback-keywords {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .keyword {
        background: #f8f9fa;
        color: #495057;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
    }

    .no-keywords {
        color: #999;
        font-style: italic;
        font-size: 0.75rem;
    }

    .feedback-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    .action-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid #ddd;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s ease;
    }

    .action-btn:hover {
        background: #f8f9fa;
        border-color: #dc3545;
        color: #dc3545;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: #666;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }

    .btn-primary {
        background: #dc3545;
        color: white;
    }

    .btn-primary:hover {
        background: #c82333;
    }

    .btn-secondary {
        background: #6c757d;
        color: white;
    }

    .btn-secondary:hover {
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
`;

// Adiciona os estilos ao documento
if (!document.getElementById('feedback-styles')) {
    const style = document.createElement('style');
    style.id = 'feedback-styles';
    style.textContent = feedbackStyles;
    document.head.appendChild(style);
}

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackModule;
}

// Variável global para acesso direto
window.feedbackModule = new FeedbackModule();
