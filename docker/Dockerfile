# Multi-stage build para otimização
FROM node:18-alpine AS base

# Instalar dependências do sistema necessárias para compilação e Chrome
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    py3-wheel \
    py3-setuptools \
    make \
    g++ \
    gcc \
    musl-dev \
    linux-headers \
    libc6-compat \
    libffi-dev \
    openssl-dev \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    alsa-lib-dev \
    alsa-utils

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para melhor cache)
COPY package*.json ./
COPY python_modules/requirements.txt ./python_modules/

# Remove EXTERNALLY-MANAGED file to allow pip installs in Docker
RUN rm -f /usr/lib/python*/EXTERNALLY-MANAGED

# Atualizar pip e instalar dependências Python
RUN pip3 install --upgrade pip setuptools wheel && \
    pip3 install --no-cache-dir -r python_modules/requirements.txt

# Instalar dependências Node.js com tratamento de erros
RUN npm install --omit=dev --no-audit --no-fund

# Copiar código fonte
COPY . .

# Criar diretórios necessários com permissões corretas
RUN mkdir -p uploads logs config && \
    chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente para produção e configuração do Puppeteer
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_CACHE_DIR=/tmp/puppeteer

# Comando de inicialização
CMD ["npm", "start"]