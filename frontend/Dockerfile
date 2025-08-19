# Multi-stage build para frontend otimizado
FROM node:18-alpine AS builder

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Instalar dependências
RUN npm ci --only=production --silent

# Copiar código fonte
COPY frontend/ ./frontend/

# Build otimizado
RUN cd frontend && npm run build

# Estágio de produção
FROM nginx:alpine AS production

# Configuração do nginx
COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY frontend/default.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Configurações de segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]