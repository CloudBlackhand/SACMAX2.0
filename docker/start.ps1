# Script de inicialização do SacsMax Automation para Windows PowerShell

Write-Host "🚀 Iniciando SacsMax Automation..." -ForegroundColor Green

# Verificar se Docker está instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker não está instalado. Por favor, instale o Docker primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se Docker Compose está instalado
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro." -ForegroundColor Red
    exit 1
}

# Criar diretórios necessários
$directories = @("uploads", "logs", "config", "wwebjs_auth")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# Detectar ambiente
$env = $env:NODE_ENV
if (-not $env) {
    $env = "development"
}

Write-Host "🌍 Ambiente: $env" -ForegroundColor Cyan

if ($env -eq "production") {
    Write-Host "🏭 Iniciando em modo produção..." -ForegroundColor Yellow
    docker-compose -f docker-compose.yml up --build -d
} else {
    Write-Host "🔧 Iniciando em modo desenvolvimento..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml up --build
}

Write-Host "✅ SacsMax Automation iniciado!" -ForegroundColor Green
Write-Host "📱 Acesse: http://localhost:3000" -ForegroundColor Blue
Write-Host "📊 Terminal Interface: node frontend/terminalInterface.js" -ForegroundColor Magenta