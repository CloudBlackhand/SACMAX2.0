// Configuração da API
const API_BASE_URL = '/api/feedback';

// Estado global
let currentChatId = null;
let currentClientId = null;

// Navegação entre seções
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
    
    // Carregar dados específicos da seção
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'feedback':
            loadFeedbacks();
            break;
        case 'templates':
            loadTemplates();
            break;
        case 'campaigns':
            loadCampaigns();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('positive-count').textContent = 
                data.data.byCategory.find(c => c.category === 'positive')?.count || 0;
            document.getElementById('negative-count').textContent = 
                data.data.byCategory.find(c => c.category === 'negative')?.count || 0;
            document.getElementById('total-count').textContent = data.data.total;
            
            loadCategoryChart(data.data.byCategory);
            loadRecentFeedbacks(data.data.recent);
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function loadCategoryChart(data) {
    const ctx = document.getElementById('category-chart').getContext('2d');
    
    const chartData = {
        labels: ['Positivo', 'Negativo', 'Neutro'],
        datasets: [{
            data: [
                data.find(c => c.category === 'positive')?.count || 0,
                data.find(c => c.category === 'negative')?.count || 0,
                data.find(c => c.category === 'neutral')?.count || 0
            ],
            backgroundColor: ['#28a745', '#dc3545', '#6c757d']
        }]
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function loadRecentFeedbacks(feedbacks) {
    const container = document.getElementById('recent-feedbacks');
    container.innerHTML = '';
    
    feedbacks.slice(0, 5).forEach(feedback => {
        const div = document.createElement('div');
        div.className = 'mb-2 p-2 border rounded';
        div.innerHTML = `
            <small class="text-muted">${new Date(feedback.created_at).toLocaleDateString()}</small>
            <div class="text-truncate">${feedback.message}</div>
            <span class="badge bg-${feedback.category === 'positive' ? 'success' : feedback.category === 'negative' ? 'danger' : 'secondary'}">${feedback.category}</span>
        `;
        container.appendChild(div);
    });
}

// Feedbacks
async function loadFeedbacks() {
    try {
        const params = new URLSearchParams();
        const category = document.getElementById('category-filter').value;
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        
        if (category) params.append('category', category);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        
        const response = await fetch(`${API_BASE_URL}/feedback?${params}`);
        const data = await response.json();
        
        if (data.success) {
            displayFeedbacks(data.data);
        }
    } catch (error) {
        console.error('Erro ao carregar feedbacks:', error);
    }
}

function displayFeedbacks(feedbacks) {
    const container = document.getElementById('feedbacks-container');
    container.innerHTML = '';
    
    if (feedbacks.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhum feedback encontrado.</p>';
        return;
    }
    
    feedbacks.forEach(feedback => {
        const card = document.createElement('div');
        card.className = `card mb-3 feedback-card ${feedback.category}-feedback`;
        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="card-title">${feedback.clients?.client_name || 'Cliente não identificado'}</h6>
                        <small class="text-muted">${new Date(feedback.created_at).toLocaleString()}</small>
                    </div>
                    <div>
                        <span class="badge bg-${feedback.category === 'positive' ? 'success' : feedback.category === 'negative' ? 'danger' : 'secondary'}">${feedback.category}</span>
                    </div>
                </div>
                <p class="card-text mt-2">${feedback.message}</p>
                <div class="mt-2">
                    <button class="btn btn-sm btn-primary" onclick="openChat(${feedback.client_id})">
                        <i class="fas fa-comment"></i> Iniciar Chat
                    </button>
                    <select class="form-select form-select-sm d-inline-block w-auto" onchange="updateCategory(${feedback.id}, this.value)">
                        <option value="positive" ${feedback.category === 'positive' ? 'selected' : ''}>Positivo</option>
                        <option value="negative" ${feedback.category === 'negative' ? 'selected' : ''}>Negativo</option>
                        <option value="neutral" ${feedback.category === 'neutral' ? 'selected' : ''}>Neutro</option>
                    </select>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function clearFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    loadFeedbacks();
}

// Templates
async function loadTemplates() {
    try {
        const response = await fetch(`${API_BASE_URL}/templates`);
        const data = await response.json();
        
        if (data.success) {
            displayTemplates(data.data);
            updateTemplateSelect(data.data);
        }
    } catch (error) {
        console.error('Erro ao carregar templates:', error);
    }
}

function displayTemplates(templates) {
    const container = document.getElementById('templates-container');
    container.innerHTML = '';
    
    templates.forEach(template => {
        const div = document.createElement('div');
        div.className = 'card mb-3';
        div.innerHTML = `
            <div class="card-body">
                <h6 class="card-title">${template.name}</h6>
                <span class="badge bg-${template.category === 'positive' ? 'success' : template.category === 'negative' ? 'danger' : 'secondary'}">${template.category}</span>
                <div class="template-preview mt-2">${template.template}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateTemplateSelect(templates) {
    const select = document.getElementById('campaign-template');
    select.innerHTML = '<option value="">Sem template</option>';
    
    templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        select.appendChild(option);
    });
}

// Chat
async function openChat(clientId) {
    currentClientId = clientId;
    
    try {
        const [clientResponse, chatResponse] = await Promise.all([
            fetch(`/api/supabase/clients/${clientId}`),
            fetch(`${API_BASE_URL}/chat/${clientId}/history`)
        ]);
        
        const clientData = await clientResponse.json();
        const chatData = await chatResponse.json();
        
        if (clientData.success) {
            const client = clientData.data;
            document.getElementById('client-info').innerHTML = `
                <h6>${client.client_name}</h6>
                <p class="mb-1"><strong>Telefone:</strong> ${client.phone}</p>
                <p class="mb-1"><strong>Endereço:</strong> ${client.additional_info?.address || 'Não informado'}</p>
            `;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('chatModal'));
        modal.show();
        
        // Iniciar novo chat se não existir
        if (chatData.data.length === 0) {
            const startResponse = await fetch(`${API_BASE_URL}/chat/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId })
            });
            const startData = await startResponse.json();
            if (startData.success) {
                currentChatId = startData.data.id;
            }
        } else {
            currentChatId = chatData.data[0].id;
            loadChatMessages(chatData.data[0].chat_messages);
        }
    } catch (error) {
        console.error('Erro ao abrir chat:', error);
    }
}

function loadChatMessages(messages) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';
    
    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.sender === 'user' ? 'sent' : 'received'}`;
        div.textContent = msg.message;
        container.appendChild(div);
    });
    
    container.scrollTop = container.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message || !currentChatId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/chat/${currentChatId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender: 'user',
                message: message
            })
        });
        
        const data = await response.json();
        if (data.success) {
            input.value = '';
            loadChatMessages([data.data]);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}

// Campanhas
async function loadCampaigns() {
    // Carregar templates para campanhas
    await loadTemplates();
}

// Form handlers
document.getElementById('template-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('template-name').value,
        category: document.getElementById('template-category').value,
        template: document.getElementById('template-content').value,
        variables: ['client_name', 'phone']
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('addTemplateModal')).hide();
            loadTemplates();
            document.getElementById('template-form').reset();
        }
    } catch (error) {
        console.error('Erro ao criar template:', error);
    }
});

document.getElementById('campaign-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('campaign-name').value,
        templateId: document.getElementById('campaign-template').value || null,
        messageContent: document.getElementById('campaign-message').value,
        targetFilter: {
            region: document.getElementById('campaign-region').value,
            dateFrom: document.getElementById('campaign-date-from').value
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Campanha criada com sucesso!');
            document.getElementById('campaign-form').reset();
        }
    } catch (error) {
        console.error('Erro ao criar campanha:', error);
    }
});

document.getElementById('import-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_BASE_URL}/contacts/import`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Contatos importados com sucesso!');
            e.target.reset();
        }
    } catch (error) {
        console.error('Erro ao importar contatos:', error);
    }
});

// Funções auxiliares
async function updateCategory(feedbackId, category) {
    try {
        const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}/category`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category })
        });
        
        const data = await response.json();
        if (data.success) {
            loadFeedbacks();
        }
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
    }
}

// Event listeners para navegação
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = e.target.getAttribute('href').substring(1);
        showSection(sectionId);
    });
});

// Enter key para chat
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Inicializar
loadDashboard();