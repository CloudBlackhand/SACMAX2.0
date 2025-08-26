# Dockerfile alternativo para SacsMax - Usando imagem Python oficial
FROM python:3.11-slim

# Instalar Node.js
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e instalar dependências Node.js
COPY package*.json ./
RUN npm ci --only=production

# Copiar requirements.txt e instalar dependências Python
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

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
