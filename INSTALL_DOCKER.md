# Instalação do Docker no Windows

## Opção 1: Docker Desktop (Recomendado)

### Pré-requisitos
- Windows 10 64-bit: Pro, Enterprise, ou Education (Build 16299 ou superior)
- Windows 11
- WSL2 (Windows Subsystem for Linux 2)

### Passos de Instalação

1. **Baixar Docker Desktop**
   - Acesse: https://docs.docker.com/desktop/windows/install/
   - Baixe o instalador Docker Desktop for Windows

2. **Instalar WSL2 (se necessário)**
   ```powershell
   # Como administrador no PowerShell
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   ```

3. **Instalar Docker Desktop**
   - Execute o instalador baixado
   - Reinicie o computador quando solicitado

4. **Verificar Instalação**
   ```powershell
   docker --version
   docker-compose --version
   ```

## Opção 2: Docker via WSL2

### Configuração do WSL2
1. **Instalar Ubuntu no WSL2**
   ```powershell
   wsl --install -d Ubuntu
   ```

2. **Instalar Docker no Ubuntu**
   ```bash
   # Dentro do WSL2 Ubuntu
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

3. **Verificar**
   ```bash
   docker --version
   docker run hello-world
   ```

## Configuração do Projeto

### Após instalar o Docker

1. **Abrir PowerShell ou Terminal**
   ```powershell
   cd C:\Users\Claudio\Desktop\sacs2.1\SacsMax
   ```

2. **Testar Build**
   ```powershell
   # Testar build de desenvolvimento
   npm run docker:build:dev

   # Testar build de produção
   npm run docker:build:prod

   # Ou usar os scripts de teste
   npm run docker:test:win
   ```

3. **Executar com Docker Compose**
   ```powershell
   # Desenvolvimento
   npm run docker:dev

   # Produção
   npm run docker:prod
   ```

## Solução de Problemas

### Docker não reconhecido
```powershell
# Verificar PATH
$env:PATH -split ';'

# Adicionar ao PATH (se necessário)
[Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files\Docker\Docker\resources\bin", [EnvironmentVariableTarget]::User)
```

### Permissões no Windows
```powershell
# Executar como administrador
Start-Process powershell -Verb RunAs
```

### WSL2 não disponível
```powershell
# Verificar versão do WSL
wsl --list --verbose

# Definir WSL2 como padrão
wsl --set-default-version 2
```

## Verificação Final

### Testar instalação completa
```powershell
# Testar todos os comandos
Get-Command docker
Get-Command docker-compose

# Testar build simples
docker run hello-world

# Testar projeto
cd C:\Users\Claudio\Desktop\sacs2.1\SacsMax
docker build -f docker/Dockerfile.dev -t sacsmax-test .
```