// Módulo Dashboard - Visão geral do sistema SacsMax

class DashboardModule {
    constructor() {
        this.stats = {
            totalContacts: 0,
            activeChats: 0,
            pendingMessages: 0,
            resolvedTickets: 0,
            todayMessages: 0,
            botResponses: 0
        };
        this.recentActivity = [];
        this.charts = {};
    }

    render() {
        return `
            <div class="module-container fade-in">
                <div class="module-header">
                    <span class="module-icon">📊</span>
                    <h2 class="module-title">Dashboard</h2>
                </div>
                
                <!-- Cards de Estatísticas -->
                <div class="grid grid-3">
                    <div class="card stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <h3 class="stat-number" id="total-contacts">${this.stats.totalContacts}</h3>
                            <p class="stat-label">Total de Contatos</p>
                        </div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">💬</div>
                        <div class="stat-content">
                            <h3 class="stat-number" id="active-chats">${this.stats.activeChats}</h3>
                            <p class="stat-label">Chats Ativos</p>
                        </div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">⏳</div>
                        <div class="stat-content">
                            <h3 class="stat-number" id="pending-messages">${this.stats.pendingMessages}</h3>
                            <p class="stat-label">Mensagens Pendentes</p>
                        </div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <h3 class="stat-number" id="resolved-tickets">${this.stats.resolvedTickets}</h3>
                            <p class="stat-label">Tickets Resolvidos</p>
                        </div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <h3 class="stat-number" id="today-messages">${this.stats.todayMessages}</h3>
                            <p class="stat-label">Mensagens Hoje</p>
                        </div>
                    </div>
                    
                    <div class="card stat-card">
                        <div class="stat-icon">🤖</div>
                        <div class="stat-content">
                            <h3 class="stat-number" id="bot-responses">${this.stats.botResponses}</h3>
                            <p class="stat-label">Respostas do Bot</p>
                        </div>
                    </div>
                </div>
                
                <!-- Gráficos e Atividade Recente -->
                <div class="grid grid-2">
                    <div class="card">
                        <h3>📈 Atividade dos Últimos 7 Dias</h3>
                        <div class="chart-container">
                            <canvas id="activity-chart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3>🕒 Atividade Recente</h3>
                        <div class="activity-list" id="activity-list">
                            ${this.renderRecentActivity()}
                        </div>
                    </div>
                </div>
                
                <!-- Ações Rápidas -->
                <div class="card">
                    <h3>⚡ Ações Rápidas</h3>
                    <div class="quick-actions">
                        <button class="btn btn-primary" onclick="window.SacsMaxApp.switchModule('excel')">
                            📁 Fazer Upload de Excel
                        </button>
                        <button class="btn btn-success" onclick="window.SacsMaxApp.switchModule('whatsapp')">
                            💬 Abrir WhatsApp
                        </button>
                        <button class="btn btn-secondary" onclick="window.SacsMaxApp.switchModule('bot')">
                            🤖 Configurar Bot
                        </button>
                        <button class="btn btn-secondary" onclick="window.SacsMaxApp.switchModule('contacts')">
                            👥 Gerenciar Contatos
                        </button>
                    </div>
                </div>
                
                <!-- Status do Sistema -->
                <div class="card">
                    <h3>🔧 Status do Sistema</h3>
                    <div class="system-status">
                        <div class="status-item">
                            <span class="status-indicator online"></span>
                            <span>Backend API</span>
                        </div>
                        <div class="status-item">
                            <span class="status-indicator online"></span>
                            <span>WhatsApp Web</span>
                        </div>
                        <div class="status-item">
                            <span class="status-indicator online"></span>
                            <span>Bot de Atendimento</span>
                        </div>
                        <div class="status-item">
                            <span class="status-indicator online"></span>
                            <span>Banco de Dados</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRecentActivity() {
        if (this.recentActivity.length === 0) {
            return '<p class="no-activity">Nenhuma atividade recente</p>';
        }

        return this.recentActivity.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <p class="activity-text">${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    init() {
        this.loadStats();
        this.loadRecentActivity();
        this.setupCharts();
        this.startAutoRefresh();
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    async loadStats() {
        try {
            // Simula carregamento de dados da API
            const response = await fetch('/api/dashboard/stats');
            if (response.ok) {
                this.stats = await response.json();
            } else {
                // Dados mock para demonstração
                this.stats = {
                    totalContacts: 1247,
                    activeChats: 23,
                    pendingMessages: 8,
                    resolvedTickets: 156,
                    todayMessages: 89,
                    botResponses: 67
                };
            }
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
            // Usa dados mock em caso de erro
            this.stats = {
                totalContacts: 1247,
                activeChats: 23,
                pendingMessages: 8,
                resolvedTickets: 156,
                todayMessages: 89,
                botResponses: 67
            };
            this.updateStatsDisplay();
        }
    }

    async loadRecentActivity() {
        try {
            // Simula carregamento de atividade recente
            const response = await fetch('/api/dashboard/activity');
            if (response.ok) {
                this.recentActivity = await response.json();
            } else {
                // Dados mock para demonstração
                this.recentActivity = [
                    {
                        icon: '💬',
                        text: 'Novo contato adicionado: João Silva',
                        time: '2 minutos atrás'
                    },
                    {
                        icon: '✅',
                        text: 'Ticket #1234 resolvido',
                        time: '5 minutos atrás'
                    },
                    {
                        icon: '📁',
                        text: 'Arquivo Excel processado com sucesso',
                        time: '10 minutos atrás'
                    },
                    {
                        icon: '🤖',
                        text: 'Bot respondeu 15 mensagens automaticamente',
                        time: '15 minutos atrás'
                    },
                    {
                        icon: '👥',
                        text: 'Sincronização de contatos concluída',
                        time: '1 hora atrás'
                    }
                ];
            }
            this.updateActivityDisplay();
        } catch (error) {
            console.error('Erro ao carregar atividade recente:', error);
            // Usa dados mock em caso de erro
            this.recentActivity = [
                {
                    icon: '💬',
                    text: 'Novo contato adicionado: João Silva',
                    time: '2 minutos atrás'
                },
                {
                    icon: '✅',
                    text: 'Ticket #1234 resolvido',
                    time: '5 minutos atrás'
                }
            ];
            this.updateActivityDisplay();
        }
    }

    updateStatsDisplay() {
        Object.keys(this.stats).forEach(key => {
            const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (element) {
                element.textContent = this.stats[key];
            }
        });
    }

    updateActivityDisplay() {
        const activityList = document.getElementById('activity-list');
        if (activityList) {
            activityList.innerHTML = this.renderRecentActivity();
        }
    }

    setupCharts() {
        // Simula criação de gráfico de atividade
        const canvas = document.getElementById('activity-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            
            // Dados mock para o gráfico
            const data = [12, 19, 15, 25, 22, 30, 28];
            const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
            
            // Desenha o gráfico simples
            this.drawSimpleChart(ctx, data, labels);
        }
    }

    drawSimpleChart(ctx, data, labels) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Limpa o canvas
        ctx.clearRect(0, 0, width, height);
        
        // Encontra o valor máximo
        const maxValue = Math.max(...data);
        
        // Desenha as linhas do gráfico
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Desenha os pontos
        ctx.fillStyle = '#667eea';
        data.forEach((value, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - padding - (value / maxValue) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Desenha os labels
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        labels.forEach((label, index) => {
            const x = padding + (index / (data.length - 1)) * chartWidth;
            const y = height - 10;
            ctx.fillText(label, x, y);
        });
    }

    startAutoRefresh() {
        // Atualiza dados a cada 30 segundos
        this.refreshInterval = setInterval(() => {
            this.loadStats();
            this.loadRecentActivity();
        }, 30000);
    }
}

// Adiciona estilos específicos do dashboard
const dashboardStyles = `
    .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        transition: transform 0.3s ease;
    }

    .stat-card:hover {
        transform: translateY(-5px);
    }

    .stat-icon {
        font-size: 2.5rem;
        opacity: 0.8;
    }

    .stat-number {
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
    }

    .stat-label {
        margin: 0;
        opacity: 0.9;
        font-size: 0.9rem;
    }

    .chart-container {
        margin-top: 1rem;
        text-align: center;
    }

    .activity-list {
        max-height: 300px;
        overflow-y: auto;
    }

    .activity-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid #e9ecef;
    }

    .activity-item:last-child {
        border-bottom: none;
    }

    .activity-icon {
        font-size: 1.5rem;
        width: 40px;
        text-align: center;
    }

    .activity-text {
        margin: 0;
        font-weight: 500;
    }

    .activity-time {
        font-size: 0.8rem;
        color: #6c757d;
    }

    .no-activity {
        text-align: center;
        color: #6c757d;
        font-style: italic;
    }

    .quick-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    .system-status {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .status-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 8px;
    }

    .status-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #28a745;
        animation: pulse 2s infinite;
    }

    .status-indicator.offline {
        background: #dc3545;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;

// Adiciona os estilos ao documento
if (!document.getElementById('dashboard-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-styles';
    style.textContent = dashboardStyles;
    document.head.appendChild(style);
}

export default DashboardModule;
