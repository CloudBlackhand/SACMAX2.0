# Guia de Solução de Problemas - Docker Build

## Erro: "npm ci did not complete successfully"

### Causas Comuns e Soluções

#### 1. **Permissões de Arquivos**
**Problema**: Arquivos com permissões incorretas
**Solução**:
```bash
# Linux/Mac
chmod +x docker/build-test.sh
chmod 644 package*.json

# Windows (PowerShell)
# Não é necessário mudar permissões no Windows
```

#### 2. **Dependências de Sistema Ausentes**
**Problema**: Falta de compiladores C++ para node-gyp ou dependências Python
**Solução**: Use o Dockerfile atualizado que inclui:
- `make`, `g++`, `gcc`
- `python3`, `python3-dev`
- `py3-pip`, `py3-wheel`, `py3-setuptools`
- `musl-dev`, `linux-headers`, `libffi-dev`, `openssl-dev`

#### 2.1. **Erro pip3 install (exit code 1)**
**Problema**: Falha na instalação de pacotes Python como pandas, openpyxl
**Causa**: Falta de dependências de compilação para pacotes Python nativos
**Solução**:
```dockerfile
# Dependências completas para compilação Python
RUN apk add --no-cache \
    python3-dev py3-wheel py3-setuptools \
    gcc musl-dev linux-headers libffi-dev openssl-dev

# Atualizar pip antes da instalação
RUN pip3 install --upgrade pip setuptools wheel
```

#### 3. **WORKDIR Incorreto**
**Problema**: Arquivos não encontrados no diretório correto
**Solução**: Verifique o contexto de build:
```bash
# Certifique-se de estar na raiz do projeto
cd /caminho/para/SacsMax
docker build -f docker/Dockerfile -t sacsmax-automation .
```

#### 4. **Cache de Build Corrompido**
**Solução**:
```bash
# Limpar cache do Docker
docker system prune -a
docker builder prune
```

#### 5. **Problemas com node_modules**
**Solução**:
```bash
# Limpar node_modules local
rm -rf node_modules package-lock.json
npm install
```

## Build Alternativos

### Build com BuildKit (mais rápido)
```bash
DOCKER_BUILDKIT=1 docker build -f docker/Dockerfile -t sacsmax-automation .
```

### Build sem cache
```bash
docker build --no-cache -f docker/Dockerfile -t sacsmax-automation .
```

### Build para Debug
```bash
# Build até o ponto de falha
docker build -f docker/Dockerfile -t sacsmax-automation-debug . --target dependencies

# Executar container interativo para debug
docker run -it sacsmax-automation-debug sh
```

## Verificação de Dependências

### Testar Instalação Manual
```bash
# Criar container temporário
docker run -it node:18-alpine sh

# Dentro do container:
apk add --no-cache python3 py3-pip make g++
cd /tmp
npm init -y
npm install whatsapp-web.js
```

## Docker Compose Alternativos

### Desenvolvimento com Volume Bind
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  sacsmax-automation:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
```

## Configurações de Sistema

### Windows: Docker Desktop
1. Instale Docker Desktop
2. Configure WSL2 (recomendado)
3. Use PowerShell ou WSL terminal

### Linux: Permissões Docker
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
# Reboot necessário
```

## Logs e Debug

### Ver logs detalhados
```bash
docker build -f docker/Dockerfile -t sacsmax-automation . --progress=plain
```

### Inspecionar imagem
```bash
docker run -it --rm sacsmax-automation sh
ls -la /app
```

## Solução Rápida

Se todos os métodos falharem, use a abordagem de containerização manual:

1. **Build Local**:
```bash
npm install
npm run build
```

2. **Criar Container Manual**:
```bash
docker run -it -v $(pwd):/app -p 3000:3000 node:18-alpine sh -c "
  cd /app &&
  npm install --production &&
  npm start
"
```