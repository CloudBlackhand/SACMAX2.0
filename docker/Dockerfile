# Multi-stage build para otimização
FROM node:18-alpine AS base

# Instalar dependências do sistema necessárias para compilação
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    libc6-compat

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para melhor cache)
COPY package*.json ./
COPY python_modules/requirements.txt ./python_modules/

# Instalar dependências Python antes (mais rápido)
RUN pip3 install --no-cache-dir -r python_modules/requirements.txt

# Instalar dependências Node.js com tratamento de erros
RUN npm ci --only=production --no-audit --no-fund || \
    (echo "npm ci falhou, tentando npm install..." && npm install --only=production --no-audit --no-fund)

# Copiar código fonte
COPY . .

# Criar diretórios necessários com permissões corretas
RUN mkdir -p uploads logs config && \
    chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente para produção
ENV NODE_ENV=production

# Comando de inicialização
CMD ["npm", "start"]