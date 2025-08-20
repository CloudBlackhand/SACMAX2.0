# SacsMax Frontend

Frontend completo do sistema SacsMax - Sistema de Gestão de SAC, desenvolvido em JavaScript puro sem dependências de frameworks.

## 🚀 Características

- **Zero HTML**: Interface totalmente gerada via JavaScript
- **Modular**: Sistema de módulos independentes
- **Responsivo**: Design adaptável para diferentes dispositivos
- **Moderno**: Interface com gradientes e animações
- **Funcional**: Todas as funcionalidades implementadas

## 📋 Módulos Disponíveis

### 📊 Dashboard
- Visão geral do sistema
- Estatísticas em tempo real
- Gráficos de atividade
- Ações rápidas

### 📁 Upload Excel
- Drag & drop de arquivos
- Preview dos dados
- Mapeamento de colunas
- Histórico de uploads

### 💬 WhatsApp
- Interface de chat completa
- Lista de contatos
- Busca e filtros
- Configurações de auto-resposta

### 🤖 Configurar Bot
- Respostas automáticas
- Palavras-chave
- Horário de funcionamento
- Teste em tempo real

### 👥 Gerenciar Contatos
- CRUD completo de contatos
- Busca e filtros
- Exportação de dados
- Tags e observações

### ⚙️ Configurações
- Configurações gerais
- Notificações
- Segurança
- Integrações
- Aparência
- Backup e restauração

## 🛠️ Tecnologias

- **JavaScript ES6+**: Lógica principal
- **CSS3**: Estilos e animações
- **HTML5**: Estrutura mínima
- **LocalStorage**: Persistência de dados
- **Canvas API**: Gráficos simples

## 📦 Instalação

### Desenvolvimento Local

```bash
# Clone o repositório
git clone https://github.com/sacsmax/frontend.git
cd frontend

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev
```

### Deploy no Railway

```bash
# Faça push para o repositório
git push origin main

# O Railway detectará automaticamente e fará o deploy
```

## 🌐 Deploy

### Railway (Recomendado)

1. Conecte seu repositório ao Railway
2. Configure as variáveis de ambiente (se necessário)
3. Deploy automático a cada push

### Outras Plataformas

O frontend é estático e pode ser deployado em qualquer plataforma:

- **Vercel**: `vercel --prod`
- **Netlify**: Arraste a pasta para o dashboard
- **GitHub Pages**: Ative nas configurações do repositório
- **Firebase Hosting**: `firebase deploy`

## 🎨 Personalização

### Cores

As cores principais podem ser alteradas no arquivo `main.js`:

```javascript
// Variáveis CSS customizáveis
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}
```

### Temas

O sistema suporta temas claro e escuro, configuráveis no módulo Settings.

## 📱 Responsividade

O frontend é totalmente responsivo e funciona em:

- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Porta do servidor (Railway define automaticamente)
PORT=3000

# URL da API backend (se necessário)
API_URL=https://sacsmax-backend.railway.app
```

### Configurações do Sistema

Todas as configurações são salvas no localStorage do navegador e podem ser acessadas através do módulo Settings.

## 📊 Funcionalidades

### Dashboard
- ✅ Estatísticas em tempo real
- ✅ Gráficos de atividade
- ✅ Status do sistema
- ✅ Ações rápidas

### Excel
- ✅ Upload drag & drop
- ✅ Preview de dados
- ✅ Mapeamento de colunas
- ✅ Exportação CSV

### WhatsApp
- ✅ Interface de chat
- ✅ Lista de contatos
- ✅ Busca e filtros
- ✅ Configurações

### Bot
- ✅ Respostas automáticas
- ✅ Palavras-chave
- ✅ Horário de funcionamento
- ✅ Teste em tempo real

### Contatos
- ✅ CRUD completo
- ✅ Busca avançada
- ✅ Exportação
- ✅ Tags e observações

### Configurações
- ✅ Configurações gerais
- ✅ Notificações
- ✅ Segurança
- ✅ Integrações
- ✅ Backup/restauração

## 🚀 Performance

- **Carregamento**: < 2s
- **Tamanho**: ~500KB (não comprimido)
- **Dependências**: Mínimas
- **Compatibilidade**: Todos os navegadores modernos

## 🔒 Segurança

- Dados salvos localmente (localStorage)
- Sem exposição de dados sensíveis
- Validação de formulários
- Sanitização de inputs

## 📈 Roadmap

- [ ] Integração com API backend
- [ ] Autenticação de usuários
- [ ] Sincronização em tempo real
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Temas customizáveis
- [ ] Relatórios avançados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- **Email**: suporte@sacsmax.com
- **Documentação**: [docs.sacsmax.com](https://docs.sacsmax.com)
- **Issues**: [GitHub Issues](https://github.com/sacsmax/frontend/issues)

---

**SacsMax** - Sistema de Gestão de SAC Completo 🚀
