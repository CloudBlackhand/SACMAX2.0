# Dockerfile para SacsMax - Sistema com Node.js e Python
FROM node:18-alpine

# Instalar Python e dependências do sistema
RUN apk add --no-cache \
    python3 \
    py3-pip \
    gcc \
    musl-dev \
    postgresql-dev \
    python3-dev \
    curl \
    && ln -sf python3 /usr/bin/python

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e instalar dependências Node.js
COPY package*.json ./
RUN npm ci --only=production

# Copiar requirements.txt e instalar dependências Python
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copiar todo o código
COPY . .

# Criar diretórios necessários
RUN mkdir -p uploads logs whatsapp_sessions frontend/dist

# Instalar dependências do frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

# Voltar para o diretório raiz
WORKDIR /app

# Expor porta
EXPOSE 8000

# Script de inicialização
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
