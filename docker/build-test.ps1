# Teste de build Docker para Windows PowerShell
Write-Host "🐳 Iniciando teste de build Docker..." -ForegroundColor Cyan

# Verificar se Docker está instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker não está instalado" -ForegroundColor Red
    exit 1
}

# Parar containers anteriores
Write-Host "🧹 Limpando containers anteriores..." -ForegroundColor Yellow
docker-compose down --remove-orphans 2>$null

# Remover imagens antigas
Write-Host "🗑️ Removendo imagens antigas..." -ForegroundColor Yellow
docker rmi sacsmax-automation:latest 2>$null

# Build da imagem
Write-Host "🔨 Construindo imagem Docker..." -ForegroundColor Green
docker build -f docker\Dockerfile -t sacsmax-automation:latest .

# Verificar se o build foi bem-sucedido
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build concluído com sucesso!" -ForegroundColor Green
    
    # Testar a imagem
    Write-Host "🧪 Testando a imagem..." -ForegroundColor Cyan
    docker run --rm -it --name test-sacsmax sacsmax-automation:latest npm --version
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Imagem testada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Falha no teste da imagem" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Build falhou" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Todos os testes concluídos!" -ForegroundColor Green