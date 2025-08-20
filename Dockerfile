# Dockerfile simples para Railway
FROM node:20-slim

# Instalar dependências básicas
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY python_modules/requirements.txt ./python_modules/

# Instalar dependências
RUN npm install --omit=dev
RUN pip3 install -r python_modules/requirements.txt

# Copiar código fonte
COPY . .

# Criar diretórios
RUN mkdir -p uploads logs config

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicialização
CMD ["npm", "start"]
