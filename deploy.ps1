# ============================================
# MatrixAPI 一键部署脚本
# 目标服务器: 43.154.77.5
# 在 PowerShell 中右键 → "以 PowerShell 运行"
# ============================================

$SERVER = "43.154.77.5"
$USER = "root"
$PASSWORD = "@Mzy510525"
$PROJECT_DIR = "C:\Users\Administrator\e:\token_API"
$REMOTE_DIR = "/opt/matrix-api"

Write-Host "🚀 MatrixAPI 一键部署开始" -ForegroundColor Cyan

# 1. 检查 SSH 密钥
$keyPath = "$env:USERPROFILE\.ssh\id_ed25519.pub"
if (-not (Test-Path $keyPath)) {
    Write-Host "❌ SSH 密钥不存在，请先运行: ssh-keygen -t ed25519" -ForegroundColor Red
    exit 1
}

Write-Host "✅ SSH 密钥已存在" -ForegroundColor Green

# 2. 复制公钥到服务器
Write-Host "📋 复制 SSH 密钥到服务器..." -ForegroundColor Yellow
$keyContent = Get-Content $keyPath -Raw
ssh $USER"@"$SERVER "mkdir -p ~/.ssh && echo '$keyContent' >> ~/.ssh/authorized_keys" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  SSH 密钥复制失败，尝试密码登录..." -ForegroundColor Yellow
    # 使用 sshpass 或提示手动输入
    $pubKey = Get-Content $keyPath -Raw
    ssh $USER"@"$SERVER "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
}

# 3. 安装 Docker（如果没装）
Write-Host "🐳 检查 Docker..." -ForegroundColor Yellow
$dockerCheck = ssh $USER"@"$SERVER "which docker" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "📦 安装 Docker..." -ForegroundColor Yellow
    ssh $USER"@"$SERVER "curl -fsSL https://get.docker.com | sh"
} else {
    Write-Host "✅ Docker 已安装" -ForegroundColor Green
}

# 4. 创建远程目录
Write-Host "📁 创建项目目录..." -ForegroundColor Yellow
ssh $USER"@"$SERVER "mkdir -p $REMOTE_DIR"

# 5. 上传项目文件（排除不需要的目录）
Write-Host "📤 上传项目文件到服务器..." -ForegroundColor Yellow
$excludeList = @('node_modules', '.next', 'dist', '.git', 'dev.db')
$excludeArgs = $excludeList | ForEach-Object { "--exclude=$_" }
scp -r -o StrictHostKeyChecking=no `
    "backend" `
    "frontend" `
    "nginx" `
    "docker-compose.yml" `
    $USER"@"$SERVER":$REMOTE_DIR/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 上传失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 项目文件上传完成" -ForegroundColor Green

# 6. 远程部署
Write-Host "🏗️  远程构建和启动..." -ForegroundColor Yellow
ssh $USER"@"$SERVER @"
cd $REMOTE_DIR
export OPENAI_API_KEY="sk-zHnceNpfUBAdct7O70dU5XlJeICxbC2M89C5bY7VvOCeO5jP"

# 启动所有服务
docker compose up --build -d

# 等待数据库就绪
echo '⏳ 等待数据库就绪...'
sleep 15

# 初始化数据库
echo '🗄️  初始化数据库...'
docker compose exec -T backend npx prisma db push --accept-data-loss
docker compose exec -T backend npx ts-node prisma/seed.ts

# 检查状态
echo '📊 服务状态:'
docker compose ps
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉✅🎉✅🎉✅🎉✅🎉✅🎉✅🎉✅" -ForegroundColor Green
    Write-Host "  部署成功！" -ForegroundColor Green
    Write-Host "  访问: http://$SERVER" -ForegroundColor Cyan
    Write-Host "  管理: http://$SERVER/dashboard" -ForegroundColor Cyan
    Write-Host "  API:  http://$SERVER/v1/chat/completions" -ForegroundColor Cyan
    Write-Host "🎉✅🎉✅🎉✅🎉✅🎉✅🎉✅🎉✅" -ForegroundColor Green
} else {
    Write-Host "❌ 部署失败，请检查上面的错误信息" -ForegroundColor Red
}
