// Módulo Feedback - Gestão de feedbacks dos clientes

class FeedbackModule {
    constructor() {
        this.feedbacks = [];
        this.filter = 'all'; // all, positive, negative, neutral
        this.searchTerm = '';
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">📊</span>
                    <h2 class="module-title">Gestão de Feedbacks</h2>
                    <div class="feedback-stats">
                        <span class="stat positive">${this.getPositiveCount()} Positivos</span>
                        <span class="stat negative">${this.getNegativeCount()} Negativos</span>
                        <span class="stat neutral">${this.getNeutralCount()} Neutros</span>
                    </div>
                </div>
                
                <div class="feedback-controls">
                    <div class="filter-buttons">
                        <button class="filter-btn ${this.filter === 'all' ? 'active' : ''}" onclick="this.setFilter('all')">
                            Todos (${this.feedbacks.length})
                        </button>
                        <button class="filter-btn ${this.filter === 'positive' ? 'active' : ''}" onclick="this.setFilter('positive')">
                            Positivos (${this.getPositiveCount()})
                        </button>
                        <button class="filter-btn ${this.filter === 'negative' ? 'active' : ''}" onclick="this.setFilter('negative')">
                            Negativos (${this.getNegativeCount()})
                        </button>
                        <button class="filter-btn ${this.filter === 'neutral' ? 'active' : ''}" onclick="this.setFilter('neutral')">
                            Neutros (${this.getNeutralCount()})
                        </button>
                    </div>
                    
                    <div class="search-container">
                        <input type="text" 
                               class="search-input" 
                               id="feedback-search"
                               placeholder="Buscar feedbacks..."
                               value="${this.searchTerm}" />
                    </div>
                </div>
                
                <div class="feedback-list" id="feedback-list">
                    ${this.renderFeedbackList()}
                </div>
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
                    <p>Não há feedbacks para os filtros selecionados</p>
                </div>
            `;
        }

        return filteredFeedbacks.map(feedback => `
            <div class="feedback-item ${feedback.sentiment}" 
                 ondblclick="this.openChat('${feedback.contactId}')"
                 onclick="this.selectFeedback('${feedback.id}')">
                <div class="feedback-header">
                    <div class="feedback-contact">
                        <div class="contact-avatar">
                            <img src="${feedback.contactAvatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNkYzM1NDUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAxMkMxNC4yMSAxMiAxNiAxMC4yMSAxNiA4UzE0LjIxIDQgMTIgNCA4IDUuNzkgOCA4czEuNzkgNCA0IDR6bTAgMmMtMi42NyAwLTggMS4zNC04IDR2MmgxNnYtMmMwLTIuNjYtNS4zMy00LTgtNHoiLz4KPC9zdmc+Cjwvc3ZnPgo="}" 
                                 alt="${feedback.contactName}" />
                        </div>
                        <div class="contact-info">
                            <div class="contact-name">${feedback.contactName}</div>
                            <div class="contact-phone">${feedback.contactPhone}</div>
                        </div>
                    </div>
                    <div class="feedback-meta">
                        <div class="feedback-date">${feedback.date}</div>
                        <div class="sentiment-badge ${feedback.sentiment}">
                            ${this.getSentimentIcon(feedback.sentiment)}
                            ${this.getSentimentText(feedback.sentiment)}
                        </div>
                    </div>
                </div>
                
                <div class="feedback-content">
                    <div class="feedback-text">${feedback.text}</div>
                    <div class="feedback-keywords">
                        ${feedback.keywords.map(keyword => `
                            <span class="keyword">${keyword}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="feedback-actions">
                    <button class="action-btn" onclick="this.viewDetails('${feedback.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                        Detalhes
                    </button>
                    <button class="action-btn" onclick="this.openChat('${feedback.contactId}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                        </svg>
                        Chat
                    </button>
                    <button class="action-btn" onclick="this.exportFeedback('${feedback.id}')">
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
                f.contactName.toLowerCase().includes(term) ||
                f.text.toLowerCase().includes(term) ||
                f.keywords.some(k => k.toLowerCase().includes(term))
            );
        }
        
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getPositiveCount() {
        return this.feedbacks.filter(f => f.sentiment === 'positive').length;
    }

    getNegativeCount() {
        return this.feedbacks.filter(f => f.sentiment === 'negative').length;
    }

    getNeutralCount() {
        return this.feedbacks.filter(f => f.sentiment === 'neutral').length;
    }

    init() {
        this.loadFeedbacks();
        this.setupEventListeners();
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

    setFilter(filter) {
        this.filter = filter;
        this.updateFeedbackList();
    }

    updateFeedbackList() {
        const feedbackList = document.getElementById('feedback-list');
        if (feedbackList) {
            feedbackList.innerHTML = this.renderFeedbackList();
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

    openChat(contactId) {
        // Salva o contato selecionado
        localStorage.setItem('selected_contact_id', contactId);
        
        // Muda para o módulo WhatsApp
        window.SacsMaxApp.switchModule('whatsapp');
        
        // Notifica o módulo WhatsApp para abrir o chat
        setTimeout(() => {
            const whatsappModule = window.SacsMaxApp.modules.whatsapp;
            if (whatsappModule && whatsappModule.selectContact) {
                whatsappModule.selectContact(contactId);
            }
        }, 500);
    }

    viewDetails(feedbackId) {
        const feedback = this.feedbacks.find(f => f.id === feedbackId);
        if (feedback) {
            alert(`Detalhes do Feedback:\n\nCliente: ${feedback.contactName}\nTelefone: ${feedback.contactPhone}\nData: ${feedback.date}\nSentimento: ${this.getSentimentText(feedback.sentiment)}\n\nMensagem:\n${feedback.text}\n\nPalavras-chave: ${feedback.keywords.join(', ')}`);
        }
    }

    exportFeedback(feedbackId) {
        const feedback = this.feedbacks.find(f => f.id === feedbackId);
        if (feedback) {
            const data = {
                cliente: feedback.contactName,
                telefone: feedback.contactPhone,
                data: feedback.date,
                sentimento: this.getSentimentText(feedback.sentiment),
                mensagem: feedback.text,
                palavras_chave: feedback.keywords
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `feedback_${feedback.contactName}_${feedback.date}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    loadFeedbacks() {
        // Carrega feedbacks do localStorage ou usa dados mock
        const savedFeedbacks = localStorage.getItem('sacsmax_feedbacks');
        if (savedFeedbacks) {
            this.feedbacks = JSON.parse(savedFeedbacks);
        } else {
            // Dados mock
            this.feedbacks = [
                {
                    id: '1',
                    contactId: '1',
                    contactName: 'João Silva',
                    contactPhone: '(11) 99999-9999',
                    contactAvatar: null,
                    text: 'Excelente atendimento! O técnico foi muito profissional e resolveu meu problema rapidamente.',
                    sentiment: 'positive',
                    date: '2024-01-15 14:30',
                    keywords: ['atendimento', 'profissional', 'rápido']
                },
                {
                    id: '2',
                    contactId: '2',
                    contactName: 'Maria Santos',
                    contactPhone: '(11) 88888-8888',
                    contactAvatar: null,
                    text: 'Demorou muito para resolver meu problema. Não estou satisfeita com o serviço.',
                    sentiment: 'negative',
                    date: '2024-01-14 16:45',
                    keywords: ['demora', 'insatisfeita', 'problema']
                },
                {
                    id: '3',
                    contactId: '3',
                    contactName: 'Pedro Costa',
                    contactPhone: '(11) 77777-7777',
                    contactAvatar: null,
                    text: 'O serviço foi adequado. Resolveu o problema, mas poderia ter sido mais rápido.',
                    sentiment: 'neutral',
                    date: '2024-01-13 10:20',
                    keywords: ['adequado', 'resolvido', 'rápido']
                }
            ];
        }
    }
}

// Estilos específicos do módulo Feedback
const feedbackStyles = `
    .feedback-stats {
        display: flex;
        gap: 1rem;
        align-items: center;
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

    .feedback-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        gap: 1rem;
    }

    .filter-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
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

    .feedback-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
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

    .contact-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
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
`;

// Adiciona os estilos ao documento
if (!document.getElementById('feedback-styles')) {
    const style = document.createElement('style');
    style.id = 'feedback-styles';
    style.textContent = feedbackStyles;
    document.head.appendChild(style);
}

export default FeedbackModule;
