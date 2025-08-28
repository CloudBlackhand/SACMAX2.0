// Teste do módulo WhatsApp
console.log('🧪 Testando módulo WhatsApp...');

// Simular o ambiente do navegador
global.window = {
    location: {
        origin: 'http://localhost:5000'
    }
};

// Carregar o módulo WhatsApp
const WhatsAppModule = require('./frontend/modules/whatsapp.js');

// Criar instância
const whatsappModule = new WhatsAppModule();

console.log('✅ Módulo WhatsApp carregado');
console.log('📱 Estado inicial:', {
    isConnected: whatsappModule.isConnected,
    currentChat: whatsappModule.currentChat,
    sessionStatus: whatsappModule.sessionStatus
});

// Testar criação de chat
console.log('\n💬 Testando criação de chat...');
whatsappModule.createNewChat('11999999999', 'Cliente Teste');

console.log('✅ Chat criado:', {
    currentChat: whatsappModule.currentChat,
    messages: whatsappModule.messages
});

console.log('\n🎯 Teste concluído com sucesso!');
