/**
 * SACSMAX - Formatadores e Utilitários
 * Funções auxiliares para formatação e escape de dados
 */

/**
 * Formata tamanho de arquivo em bytes para formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado (KB, MB, GB)
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Formata última visualização para formato relativo
 * @param {Date|string} date - Data da última visualização
 * @returns {string} Tempo relativo (ex: "2 minutos atrás")
 */
function formatLastSeen(date) {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const lastSeen = new Date(date);
    const diffMs = now - lastSeen;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) {
        return 'agora mesmo';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
    } else if (diffHours < 24) {
        return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else if (diffDays < 7) {
        return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else {
        return lastSeen.toLocaleDateString('pt-BR');
    }
}

/**
 * Formata número de telefone para formato WhatsApp
 * @param {string} phone - Número de telefone
 * @returns {string} Telefone formatado
 */
function formatPhoneNumber(phone) {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Adiciona 55 se não tiver código do país
    if (cleaned.length === 11) {
        return '55' + cleaned;
    }
    
    return cleaned;
}

/**
 * Valida se é um email válido
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se válido, false caso contrário
 */
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Trunca texto para um número máximo de caracteres
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado com reticências se necessário
 */
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Formata data para padrão brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada (DD/MM/YYYY HH:MM)
 */
function formatDateTime(date) {
    if (!date) return '';
    
    const dt = new Date(date);
    return dt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Remove acentos e caracteres especiais
 * @param {string} text - Texto a ser normalizado
 * @returns {string} Texto sem acentos
 */
function normalizeText(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

/**
 * Cria um delay em milissegundos
 * @param {number} ms - Milissegundos para esperar
 * @returns {Promise} Promise que resolve após o delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce para otimizar chamadas frequentes
 * @param {Function} func - Função a ser debounced
 * @param {number} wait - Tempo de espera em ms
 * @returns {Function} Função debounced
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Verifica se está em ambiente de desenvolvimento
 * @returns {boolean} True se for desenvolvimento
 */
function isDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
}

// Exportar para uso em módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatFileSize,
        escapeHtml,
        formatLastSeen,
        formatPhoneNumber,
        isValidEmail,
        truncateText,
        formatDateTime,
        normalizeText,
        delay,
        debounce,
        isDevelopment
    };
} else {
    // Exportar global para uso em scripts tradicionais
    window.Formatters = {
        formatFileSize,
        escapeHtml,
        formatLastSeen,
        formatPhoneNumber,
        isValidEmail,
        truncateText,
        formatDateTime,
        normalizeText,
        delay,
        debounce,
        isDevelopment
    };
}