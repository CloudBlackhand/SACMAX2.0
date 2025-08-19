/**
 * Serviço de Verificação de Conectividade para Internet
 * Equipe Desktop Internet - Sistema otimizado de verificação de rede
 */

class NetworkService {
    constructor() {
        this.endpoints = [
            'https://www.google.com',
            'https://www.cloudflare.com',
            'https://www.microsoft.com',
            'https://8.8.8.8',
            'https://1.1.1.1'
        ];
        this.cache = new Map();
        this.lastCheck = null;
        this.cacheDuration = 5000; // 5 segundos
    }

    /**
     * Verifica conectividade com múltiplos endpoints
     */
    async checkConnectivity() {
        const now = Date.now();
        
        // Usar cache se ainda válido
        if (this.lastCheck && (now - this.lastCheck) < this.cacheDuration) {
            return this.cache.get('connectivity');
        }

        const results = await Promise.allSettled(
            this.endpoints.map(endpoint => this.testEndpoint(endpoint))
        );

        const successfulTests = results.filter(
            result => result.status === 'fulfilled' && result.value.success
        ).length;

        const connectivity = {
            connected: successfulTests > 0,
            successRate: (successfulTests / this.endpoints.length) * 100,
            timestamp: new Date().toISOString(),
            details: results.map((result, index) => ({
                endpoint: this.endpoints[index],
                status: result.status === 'fulfilled' ? 'success' : 'failed',
                latency: result.status === 'fulfilled' ? result.value.latency : null,
                error: result.status === 'rejected' ? result.reason : null
            }))
        };

        this.cache.set('connectivity', connectivity);
        this.lastCheck = now;

        return connectivity;
    }

    /**
     * Testa conexão com um endpoint específico
     */
    async testEndpoint(url) {
        const start = Date.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            return {
                success: true,
                latency: Date.now() - start
            };
        } catch (error) {
            return {
                success: false,
                latency: Date.now() - start,
                error: error.message
            };
        }
    }

    /**
     * Verifica status da conexão local
     */
    async checkLocalNetwork() {
        try {
            const response = await fetch('/api/health', {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            
            return {
                localServer: response.ok,
                status: response.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                localServer: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Retorna mensagens personalizadas baseadas no status
     */
    getConnectionMessage(status) {
        const messages = {
            online: {
                title: "✅ Conexão Estável",
                message: "Sua conexão com a internet está funcionando perfeitamente.",
                type: "success"
            },
            unstable: {
                title: "⚠️ Conexão Instável",
                message: "Sua conexão está lenta ou intermitente. Algumas funcionalidades podem ser afetadas.",
                type: "warning"
            },
            offline: {
                title: "❌ Sem Conexão",
                message: "Verifique sua conexão com a internet. O sistema está operando em modo offline.",
                type: "error"
            },
            server_down: {
                title: "🔴 Servidor Indisponível",
                message: "Nossos servidores estão temporariamente fora do ar. Tente novamente em alguns minutos.",
                type: "error"
            }
        };

        if (!status.connected) return messages.offline;
        if (status.successRate < 50) return messages.server_down;
        if (status.successRate < 80) return messages.unstable;
        return messages.online;
    }

    /**
     * Monitora conectividade em tempo real
     */
    startMonitoring(callback, interval = 10000) {
        const monitor = async () => {
            try {
                const status = await this.checkConnectivity();
                const localStatus = await this.checkLocalNetwork();
                
                const fullStatus = {
                    ...status,
                    local: localStatus,
                    overall: this.getConnectionMessage(status)
                };

                if (callback) callback(fullStatus);
            } catch (error) {
                console.error('Erro no monitoramento:', error);
                if (callback) callback({
                    connected: false,
                    error: error.message,
                    overall: this.getConnectionMessage({ connected: false })
                });
            }
        };

        // Executar imediatamente
        monitor();

        // Configurar intervalo
        return setInterval(monitor, interval);
    }

    /**
     * Retorna sugestões de solução baseadas no problema
     */
    getTroubleshootingTips(status) {
        const tips = [];

        if (!status.connected) {
            tips.push("Verifique se seu cabo de rede ou Wi-Fi está conectado");
            tips.push("Reinicie seu modem/roteador");
            tips.push("Verifique se outros dispositivos têm internet");
            tips.push("Contate sua operadora de internet");
        }

        if (status.successRate < 80) {
            tips.push("Feche aplicativos que podem estar consumindo banda");
            tips.push("Evite downloads simultâneos");
            tips.push("Teste a conexão em outro horário");
        }

        if (status.local && !status.local.localServer) {
            tips.push("Verifique se o servidor local está rodando");
            tips.push("Atualize a página (F5)");
            tips.push("Verifique o console do navegador para erros");
        }

        return tips;
    }
}

module.exports = NetworkService;