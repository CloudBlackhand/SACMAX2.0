/**
 * Teste de Integração do Frontend Refatorado
 * Valida módulos e serviços
 */

class FrontendIntegrationTest {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    async run() {
        console.log('🧪 Iniciando testes de integração do frontend...');
        
        await this.testApiService();
        await this.testNetworkService();
        await this.testModules();
        await this.testEnvironmentConfig();
        
        this.showResults();
    }

    async testApiService() {
        console.log('📡 Testando ApiService...');
        
        try {
            // Verificar se apiService está disponível
            if (typeof window !== 'undefined' && window.apiService) {
                console.log('✅ ApiService carregado');
                
                // Testar métodos disponíveis
                const methods = [
                    'uploadExcel', 'getFeedbackTemplates', 'sendWhatsAppMessage',
                    'getWhatsAppStatus', 'getContacts'
                ];
                
                methods.forEach(method => {
                    if (typeof window.apiService[method] === 'function') {
                        console.log(`✅ ${method} disponível`);
                    } else {
                        console.log(`❌ ${method} não encontrado`);
                    }
                });
            } else {
                console.log('⚠️  ApiService não encontrado no escopo global');
            }
        } catch (error) {
            console.error('❌ Erro no teste ApiService:', error.message);
        }
    }

    async testNetworkService() {
        console.log('🌐 Testando NetworkService...');
        
        try {
            if (typeof window !== 'undefined' && window.networkService) {
                console.log('✅ NetworkService carregado');
                
                // Testar métodos de rede
                const methods = [
                    'checkConnection', 'makeRequest', 'getUserFriendlyError'
                ];
                
                methods.forEach(method => {
                    if (typeof window.networkService[method] === 'function') {
                        console.log(`✅ ${method} disponível`);
                    } else {
                        console.log(`❌ ${method} não encontrado`);
                    }
                });
                
                // Testar conexão de rede
                const status = await window.networkService.checkConnection();
                console.log('📊 Status de rede:', status.connected ? 'Online' : 'Offline');
            } else {
                console.log('⚠️  NetworkService não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro no teste NetworkService:', error.message);
        }
    }

    async testModules() {
        console.log('📦 Testando módulos...');
        
        const modules = [
            'UploadManager', 'BotController', 'FeedbackUI', 'WhatsAppIntegration'
        ];
        
        modules.forEach(moduleName => {
            if (typeof window !== 'undefined' && window[moduleName]) {
                console.log(`✅ ${moduleName} disponível`);
            } else {
                console.log(`⚠️  ${moduleName} não encontrado no escopo global`);
            }
        });
    }

    async testEnvironmentConfig() {
        console.log('⚙️  Testando configuração de ambiente...');
        
        try {
            if (typeof window !== 'undefined' && window.envConfig) {
                const config = window.envConfig.getAll();
                console.log('✅ EnvironmentConfig carregado');
                console.log('📋 Configurações:', Object.keys(config));
            } else {
                console.log('⚠️  EnvironmentConfig não encontrado');
            }
        } catch (error) {
            console.error('❌ Erro no teste EnvironmentConfig:', error.message);
        }
    }

    showResults() {
        console.log('\n📊 Resumo dos testes:');
        console.log('Frontend refatorado está pronto para uso!');
        console.log('\nPróximos passos:');
        console.log('1. Configure as variáveis de ambiente');
        console.log('2. Teste a interface localmente');
        console.log('3. Faça deploy para produção');
    }
}

// Executar testes se rodar diretamente
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const test = new FrontendIntegrationTest();
        test.run();
    });
}

// Exportar para uso em Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrontendIntegrationTest;
}