const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando testes de integração do SacsMax Optimizado...\n');

// Teste 1: Verificar estrutura de arquivos
console.log('📁 Verificando estrutura de arquivos...');
const requiredFiles = [
  'package.json',
  'backend/server.js',
  'backend/services/supabaseOptimizedService.js',
  'frontend/webInterface.js',
  'supabase_optimized_schema.sql'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - Não encontrado`);
    allFilesExist = false;
  }
});

// Teste 2: Verificar dependências
console.log('\n📦 Verificando dependências...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const requiredDeps = ['express', 'cors', '@supabase/supabase-js', 'multer'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep} - OK`);
  } else {
    console.log(`❌ ${dep} - Não encontrado`);
    allFilesExist = false;
  }
});

// Teste 3: Verificar integração Supabase
console.log('🔗 Verificando integração Supabase...');
try {
  const supabaseService = require('../backend/services/supabaseOptimizedService.js');
  if (supabaseService) {
    console.log('✅ Supabase Service - OK');
    
    // Verificar métodos principais
    const methods = [
      'upsertClientOptimized',
      'processSpreadsheetDataOptimized', 
      'getAllSentContacts',
      'getDashboardStats'
    ];
    
    methods.forEach(method => {
      if (typeof supabaseService[method] === 'function') {
        console.log(`✅ ${method}() - OK`);
      } else {
        console.log(`❌ ${method}() - Não encontrado`);
        allFilesExist = false;
      }
    });
  }
} catch (error) {
  console.log('❌ Erro ao carregar Supabase Service:', error.message);
  allFilesExist = false;
}

// Teste 4: Verificar estrutura do banco de dados
console.log('\n🗄️ Verificando estrutura do banco de dados...');
try {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'supabase_optimized_schema.sql'), 'utf8');
  
  const requiredTables = [
    'upload_sessions',
    'clients_optimized',
    'sent_contacts',
    'client_metrics'
  ];
  
  requiredTables.forEach(table => {
    if (schema.includes(`CREATE TABLE ${table}`)) {
      console.log(`✅ Tabela ${table} - OK`);
    } else {
      console.log(`❌ Tabela ${table} - Não encontrada`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Erro ao verificar schema:', error.message);
  allFilesExist = false;
}

// Teste 5: Verificar interface web
console.log('\n🌐 Verificando interface web...');
try {
  const webInterface = fs.readFileSync(path.join(__dirname, '..', 'frontend/webInterface.js'), 'utf8');
  
  const requiredFeatures = [
    'Contatos Enviados',
    'loadSentContacts',
    'sent-contacts-table-body',
    'contacts-search'
  ];
  
  requiredFeatures.forEach(feature => {
    if (webInterface.includes(feature)) {
      console.log(`✅ ${feature} - OK`);
    } else {
      console.log(`❌ ${feature} - Não encontrado`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Erro ao verificar interface web:', error.message);
  allFilesExist = false;
}

// Resultado final
console.log('\n📊 Resultado dos Testes:');
if (allFilesExist) {
  console.log('✅ TODOS OS TESTES PASSARAM!');
  console.log('🎉 O sistema está pronto para deploy no Railway!');
  console.log('\nPróximos passos:');
  console.log('1. Configure as variáveis de ambiente no Railway');
  console.log('2. Execute: npm install');
  console.log('3. Execute: npm start');
  console.log('4. Acesse: https://your-app.railway.app');
} else {
  console.log('❌ ALGUNS TESTES FALHARAM!');
  console.log('Por favor, verifique os arquivos listados acima.');
  process.exit(1);
}