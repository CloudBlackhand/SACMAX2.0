# Configuração do Sistema de Gestão de Feedback

## Visão Geral
Este documento descreve a configuração e uso do sistema completo de gestão de feedback de clientes, incluindo categorização automática, chat individual, templates de mensagens e envio de mensagens em massa.

## Estrutura do Banco de Dados

### Tabelas Principais

1. **customer_feedback**: Armazena os feedbacks recebidos dos clientes
   - id (uuid, primary key)
   - client_id (uuid, foreign key)
   - message (text)
   - category (text: positive, negative, neutral)
   - sentiment_score (float)
   - source (text: whatsapp, email, etc.)
   - is_manual (boolean)
   - created_at, updated_at

2. **message_templates**: Templates pré-definidos para respostas
   - id (uuid, primary key)
   - name (text)
   - category (text)
   - template (text)
   - variables (jsonb)
   - is_active (boolean)
   - created_at, updated_at

3. **feedback_responses**: Respostas enviadas aos feedbacks
   - id (uuid, primary key)
   - feedback_id (uuid, foreign key)
   - template_id (uuid, foreign key)
   - response_text (text)
   - sent_at (timestamp)

4. **active_chats**: Chats ativos com clientes
   - id (uuid, primary key)
   - client_id (uuid, foreign key)
   - started_at (timestamp)
   - last_message_at (timestamp)
   - status (text)

5. **chat_messages**: Mensagens do chat
   - id (uuid, primary key)
   - chat_id (uuid, foreign key)
   - sender (text: user, client)
   - message (text)
   - message_type (text: text, image, etc.)
   - created_at

6. **mass_campaigns**: Campanhas de mensagens em massa
   - id (uuid, primary key)
   - name (text)
   - template_id (uuid, foreign key)
   - message_content (text)
   - target_filter (jsonb)
   - status (text: pending, running, completed)
   - sent_contacts (integer)
   - failed_contacts (integer)
   - created_at, completed_at

7. **campaign_contacts**: Contatos das campanhas
   - id (uuid, primary key)
   - campaign_id (uuid, foreign key)
   - client_id (uuid, foreign key)
   - status (text: pending, sent, failed)
   - sent_at (timestamp)
   - error_message (text)

## Instalação e Configuração

### 1. Executar o Schema SQL
Execute o arquivo `feedback_schema.sql` no seu banco Supabase:

```bash
psql -h seu-host.supabase.co -U postgres -d postgres -f feedback_schema.sql
```

### 2. Verificar Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão configuradas no seu `.env`:

```env
SUPABASE_URL=seu-url-supabase
SUPABASE_ANON_KEY=seu-anon-key
SUPABASE_SERVICE_ROLE_KEY=seu-service-key
```

### 3. Instalar Dependências
O sistema usa as seguintes dependências:

```bash
# Backend
npm install express multer

# Frontend (já incluído via CDN)
# Bootstrap 5.3.0
# Chart.js
# Font Awesome 6.0.0
```

## Uso da API

### Endpoints de Feedback

#### Listar Feedbacks
```http
GET /api/feedback
Query Parameters:
- category: positive|negative|neutral
- clientId: uuid
- dateFrom: YYYY-MM-DD
- dateTo: YYYY-MM-DD
```

#### Adicionar Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "clientId": "uuid",
  "message": "texto do feedback",
  "source": "whatsapp"
}
```

#### Atualizar Categoria
```http
PUT /api/feedback/{id}/category
Content-Type: application/json

{
  "category": "positive"
}
```

### Endpoints de Templates

#### Listar Templates
```http
GET /api/templates
Query Parameters:
- category: positive|negative|neutral
```

#### Criar Template
```http
POST /api/templates
Content-Type: application/json

{
  "name": "Agradecimento Positivo",
  "category": "positive",
  "template": "Olá {{client_name}}, agradecemos seu feedback positivo!",
  "variables": ["client_name", "phone"]
}
```

### Endpoints de Chat

#### Iniciar Chat
```http
POST /api/chat/start
Content-Type: application/json

{
  "clientId": "uuid"
}
```

#### Enviar Mensagem
```http
POST /api/chat/{chatId}/message
Content-Type: application/json

{
  "sender": "user",
  "message": "texto da mensagem",
  "messageType": "text"
}
```

#### Histórico do Chat
```http
GET /api/chat/{clientId}/history
```

### Endpoints de Campanhas

#### Criar Campanha
```http
POST /api/campaigns
Content-Type: application/json

{
  "name": "Campanha de Agradecimento",
  "templateId": "uuid",
  "messageContent": "Olá {{client_name}}, obrigado pelo seu feedback!",
  "targetFilter": {
    "region": "São Paulo",
    "dateFrom": "2024-01-01"
  }
}
```

#### Executar Campanha
```http
POST /api/campaigns/{id}/execute
```

### Importar Contatos
```http
POST /api/contacts/import
Content-Type: multipart/form-data

file: arquivo.xlsx ou .csv
```

## Interface de Usuário

### Acesso à Interface
Acesse a interface de gestão de feedback em:
```
http://localhost:3000/feedback.html
```

### Funcionalidades da Interface

1. **Dashboard**: Visualização geral dos feedbacks com gráficos e estatísticas
2. **Feedbacks**: Listagem completa com filtros e ações
3. **Templates**: Gerenciamento de templates de mensagens
4. **Campanhas**: Criação e execução de campanhas em massa
5. **Chat Individual**: Interface de chat com clientes

### Templates de Mensagens Pré-definidas

#### Feedbacks Positivos
- **Agradecimento Simples**: "Olá {{client_name}}, muito obrigado pelo seu feedback positivo! É um prazer atendê-lo."
- **Recomendação**: "{{client_name}}, ficamos felizes com seu feedback! Continue nos recomendando aos seus amigos."

#### Feedbacks Negativos
- **Desculpa**: "{{client_name}}, sentimos muito pela sua experiência. Vamos resolver isso imediatamente."
- **Solução**: "Olá {{client_name}}, agradecemos seu feedback. Já estamos tomando providências para melhorar nosso serviço."

#### Feedbacks Neutros
- **Agradecimento**: "{{client_name}}, agradecemos seu feedback. Estamos sempre buscando melhorar nosso atendimento."

## Integração com WhatsApp

Para integrar com o WhatsApp, você pode usar o serviço existente:

```javascript
// Exemplo de envio via WhatsApp
const whatsappService = require('./services/whatsapp');

// Enviar mensagem
await whatsappService.sendMessage(phone, message);

// Receber mensagens
whatsappService.on('message', async (message) => {
  // Processar mensagem como feedback
  await feedbackService.addFeedback(clientId, message.body, 'whatsapp');
});
```

## Monitoramento e Estatísticas

### Métricas Disponíveis
- Total de feedbacks por categoria
- Taxa de resposta
- Tempo médio de resposta
- Efetividade das campanhas
- Satisfação do cliente

### Dashboard de Monitoramento
Acesse as estatísticas em tempo real através do endpoint:
```http
GET /api/stats
```

## Segurança e Privacidade

- Todos os dados são armazenados de forma criptografada
- Acesso restrito via autenticação JWT
- Logs de auditoria para todas as ações
- Conformidade com LGPD (Lei Geral de Proteção de Dados)

## Solução de Problemas

### Erros Comuns

1. **Conexão com Supabase falhou**
   - Verifique as variáveis de ambiente
   - Confirme as credenciais do Supabase
   - Verifique a conectividade de rede

2. **Templates não aparecem**
   - Verifique se os templates estão ativos (is_active = true)
   - Confirme a categoria dos templates

3. **Campanhas não executam**
   - Verifique os filtros de segmentação
   - Confirme se há contatos válidos
   - Verifique os logs de erro

### Logs
Os logs são salvos em:
- Backend: `./logs/feedback.log`
- Frontend: Console do navegador (F12)

## Suporte

Para suporte técnico ou dúvidas sobre a implementação:
1. Verifique este documento
2. Consulte os logs de erro
3. Abra uma issue no repositório
4. Contate a equipe de desenvolvimento

## Próximos Passos

1. Configurar webhooks para receber feedbacks automáticos
2. Implementar IA para análise de sentimentos avançada
3. Criar relatórios personalizados
4. Integrar com sistemas de CRM externos
5. Implementar notificações em tempo real