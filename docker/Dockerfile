# Multi-stage build para otimização
FROM node:18-alpine AS base

# Instalação de dependências Python minimalistas
RUN apk add --no-cache python3 py3-pip

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY python_modules/requirements.txt ./

# Instalar dependências Node.js
RUN npm ci --only=production

# Instalar dependências Python minimalistas
RUN pip3 install --no-cache-dir -r requirements.txt

# Copiar código fonte
COPY . .

# Criar diretórios necessários
RUN mkdir -p uploads logs

# Expor porta
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "start"]