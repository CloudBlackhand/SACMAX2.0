# 🔗 Configuração Google Sheets API

## 📋 Pré-requisitos

1. **Conta Google** com acesso ao Google Sheets
2. **Projeto no Google Cloud Console**
3. **Credenciais OAuth2**

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Sheets API**

### 2. Configurar Credenciais OAuth2

1. Vá para **APIs & Services > Credentials**
2. Clique em **Create Credentials > OAuth 2.0 Client IDs**
3. Configure:
   - **Application type**: Desktop application
   - **Name**: SacsMax Sheets Integration
4. Baixe o arquivo JSON das credenciais

### 3. Configurar o Sistema

1. **Copie o arquivo de credenciais**:
   ```bash
   cp ~/Downloads/client_secret_*.json backend/credentials.json
   ```

2. **Instale as dependências**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Configure as variáveis de ambiente**:
   ```bash
   # Adicione ao .env
   GOOGLE_SHEETS_ENABLED=true
   ```

## 🔐 Autenticação para Planilhas Privadas

### Opção 1: Autenticação da Aplicação (Planilhas Compartilhadas)

1. **Compartilhe a planilha** com o email da aplicação
2. **Use a opção "Autenticação da Aplicação"** no frontend
3. **Cole a URL** e conecte normalmente

### Opção 2: Sua Conta Google (Planilhas Privadas)

1. **Inicie o backend**:
   ```bash
   python railway_startup.py
   ```

2. **Acesse o módulo Excel** no frontend
3. **Clique na aba "Google Sheets"**
4. **Selecione "Sua Conta Google"**
5. **Clique em "Autenticar"**
6. **Siga as instruções no terminal**:
   - Abra o link fornecido no navegador
   - Faça login com sua conta Google
   - Autorize o acesso
   - Cole o código de autorização no terminal

7. **Cole a URL da sua planilha privada**
8. **Clique em "Conectar Planilha"**

### 4. Primeira Autenticação

1. **Inicie o backend**:
   ```bash
   python railway_startup.py
   ```

2. **Acesse o módulo Excel** no frontend
3. **Clique na aba "Google Sheets"**
4. **Escolha o tipo de autenticação**:
   - **Aplicação**: Para planilhas compartilhadas
   - **Sua Conta**: Para planilhas privadas
5. **Cole a URL da sua planilha**
6. **Clique em "Conectar Planilha"**
7. **Autorize o acesso** na janela do Google

### 5. Estrutura da Planilha

A planilha deve ter:
- **Cabeçalhos na primeira linha**
- **Dados organizados em colunas**
- **Permissão de leitura** para o email da aplicação OU sua conta

### 📊 Exemplo de Planilha

```
Nome        | Telefone      | Email           | Status
João Silva  | 11999999999   | joao@email.com  | Ativo
Maria Santos| 11888888888   | maria@email.com | Inativo
```

## 🔧 Solução de Problemas

### Erro de Autenticação
- Verifique se o arquivo `credentials.json` está correto
- Certifique-se de que a API está ativada
- Tente deletar `token.pickle` e reautenticar
- Para planilhas privadas, use "Sua Conta Google"

### Erro de Permissão
- Verifique se a planilha tem permissão de leitura
- Certifique-se de que a URL está correta
- Para planilhas privadas, use autenticação com sua conta
- Teste com uma planilha pública primeiro

### Erro de Conexão
- Verifique se o backend está rodando
- Confirme se a porta 8000 está livre
- Teste a conectividade com a internet

## 📝 URLs de Exemplo

```
https://docs.google.com/spreadsheets/d/1islC9-Wt4y15Sfxc_SMmxAxjaYn92p7qssDPJJnKhBc/edit
```

## ✅ Teste

1. **Acesse**: http://localhost:3002
2. **Vá para**: Módulo Excel > Aba Google Sheets
3. **Escolha autenticação**:
   - **Aplicação**: Para planilhas compartilhadas
   - **Sua Conta**: Para planilhas privadas
4. **Autentique** se necessário
5. **Cole a URL** da sua planilha
6. **Clique em "Conectar Planilha"**
7. **Visualize os dados** na tabela
8. **Clique em "Importar Dados"**

## 🔒 Segurança

- **Nunca compartilhe** o arquivo `credentials.json`
- **Adicione** `credentials.json` e `token.pickle` ao `.gitignore`
- **Use variáveis de ambiente** em produção
- **Revogue credenciais** não utilizadas
- **Para planilhas privadas**, use sua própria conta Google

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do backend
2. Confirme a configuração das credenciais
3. Teste com uma planilha simples primeiro
4. Verifique as permissões da planilha
5. Para planilhas privadas, use "Sua Conta Google"
