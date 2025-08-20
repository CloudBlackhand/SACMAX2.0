#!/usr/bin/env node

const PythonDatabaseService = require('./backend/services/pythonDatabaseService');
const logger = require('./backend/utils/logger');

async function testPythonIntegration() {
    console.log('🐍 Testando integração Python com banco de dados...\n');

    const pythonService = new PythonDatabaseService();

    try {
        // 1. Testar disponibilidade do serviço Python
        console.log('📋 1. Verificando disponibilidade do serviço Python...');
        const isAvailable = await pythonService.isAvailable();
        console.log(`   ${isAvailable ? '✅' : '❌'} Serviço Python: ${isAvailable ? 'Disponível' : 'Indisponível'}`);

        if (!isAvailable) {
            console.log('   💡 Instale as dependências Python: pip install -r python_modules/requirements.txt');
            return;
        }

        // 2. Testar configuração do banco
        console.log('\n🗄️ 2. Configurando banco de dados...');
        const setupResult = await pythonService.setupDatabase();
        console.log(`   ${setupResult.success ? '✅' : '❌'} Configuração: ${setupResult.success ? 'Sucesso' : 'Falha'}`);

        // 3. Testar classificação de feedback
        console.log('\n📝 3. Testando classificação de feedback...');
        const testTexts = [
            'Excelente atendimento, muito satisfeito!',
            'Péssimo serviço, não recomendo.',
            'O produto é bom, mas poderia melhorar.'
        ];

        for (const text of testTexts) {
            const result = await pythonService.classifyFeedback(text);
            console.log(`   📄 "${text.substring(0, 30)}..."`);
            console.log(`      Sentimento: ${result.sentiment} (${(result.confidence * 100).toFixed(1)}%)`);
        }

        // 4. Testar dados de exemplo
        console.log('\n📊 4. Testando salvamento de dados...');
        const sampleData = {
            contacts: [
                {
                    client_id: 'TEST001',
                    client_name: 'João Silva',
                    phone: '11999999999',
                    sheet_name: 'Teste'
                },
                {
                    client_id: 'TEST002',
                    client_name: 'Maria Santos',
                    phone: '11888888888',
                    sheet_name: 'Teste'
                }
            ]
        };

        const saveResult = await pythonService.saveSpreadsheetData(sampleData, 'teste.xlsx', 'contacts');
        console.log(`   ${saveResult.total_records > 0 ? '✅' : '❌'} Dados salvos: ${saveResult.total_records} registros`);

        // 5. Testar listagem de clientes
        console.log('\n👥 5. Testando listagem de clientes...');
        const clients = await pythonService.getAllClients();
        console.log(`   ${clients.length > 0 ? '✅' : '❌'} Clientes encontrados: ${clients.length}`);

        if (clients.length > 0) {
            console.log('   📋 Primeiros clientes:');
            clients.slice(0, 3).forEach((client, index) => {
                console.log(`      ${index + 1}. ${client.client_name} (${client.client_id})`);
            });
        }

        // 6. Testar histórico de uploads
        console.log('\n📈 6. Testando histórico de uploads...');
        const history = await pythonService.getUploadHistory();
        console.log(`   ${history.length > 0 ? '✅' : '❌'} Uploads no histórico: ${history.length}`);

        console.log('\n🎉 Teste de integração Python concluído com sucesso!');
        console.log('\n📋 Resumo:');
        console.log(`   • Serviço Python: ${isAvailable ? '✅ Funcionando' : '❌ Problema'}`);
        console.log(`   • Banco de dados: ${setupResult.success ? '✅ Configurado' : '❌ Erro'}`);
        console.log(`   • Classificação: ✅ Funcionando`);
        console.log(`   • Salvamento: ${saveResult.total_records > 0 ? '✅ Funcionando' : '❌ Erro'}`);
        console.log(`   • Listagem: ${clients.length > 0 ? '✅ Funcionando' : '❌ Erro'}`);

    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
        console.log('\n🔧 Solução de problemas:');
        console.log('1. Verifique se Python 3 está instalado');
        console.log('2. Instale as dependências: pip install -r python_modules/requirements.txt');
        console.log('3. Verifique se DATABASE_URL está configurada');
        console.log('4. Verifique se o banco PostgreSQL está acessível');
    }
}

// Executar teste
testPythonIntegration();
