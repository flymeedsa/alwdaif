$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $projectRoot ".runtime"
$nodeExe = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$pnpmExe = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
$nativeModules = "C:\CodexRuntime\alwdaif-node-native\node_modules"
$postgresRoot = "C:\CodexRuntime\alwdaif-postgres16"
$postgresBin = Join-Path $postgresRoot "pgsql\bin"
$postgresData = Join-Path $postgresRoot "data"
$postgresLog = Join-Path $postgresRoot "postgres.log"
$envFile = Join-Path $projectRoot ".env.local"

if (!(Test-Path -LiteralPath $nodeExe)) { throw "Node.js runtime not found: $nodeExe" }
if (!(Test-Path -LiteralPath $pnpmExe)) { throw "pnpm runtime not found: $pnpmExe" }
if (!(Test-Path -LiteralPath (Join-Path $postgresBin "pg_ctl.exe"))) { throw "PostgreSQL runtime not found: $postgresRoot" }
if (!(Test-Path -LiteralPath $envFile)) { throw ".env.local is missing" }

$openAiLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^\s*OPENAI_API_KEY\s*=' } | Select-Object -First 1
if ($openAiLine -and $openAiLine -match '^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$') {
  $env:OPENAI_API_KEY = $Matches[1].Trim().Trim('"').Trim("'")
}

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

$env:PGHOST = "127.0.0.1"
$env:PGPORT = "55432"
$env:PGUSER = "postgres"
$env:DATABASE_URL = "postgresql://postgres@127.0.0.1:55432/alwdaif"
$env:PORT = "5000"
$env:SESSION_SECRET = "local-session-only-change-before-public-deployment"
$env:SESSION_COOKIE_SECURE = "false"
$env:SITE_URL = "http://alwdaif.localhost:22860"
$env:NODE_ENV = "production"
$env:RUN_BACKGROUND_JOBS = "false"
$env:LOCAL_OBJECT_DIR = Join-Path $runtimeDir "objects"
$env:NODE_PATH = $nativeModules
$env:ESBUILD_BINARY_PATH = Join-Path $nativeModules "@esbuild\win32-x64\esbuild.exe"
$env:Path = "$(Split-Path $nodeExe);$(Split-Path $pnpmExe);$env:Path"

& (Join-Path $postgresBin "pg_isready.exe") -d alwdaif -q
if ($LASTEXITCODE -ne 0) {
  & (Join-Path $postgresBin "pg_ctl.exe") -D $postgresData -l $postgresLog -o '"-p 55432 -h 127.0.0.1"' -w start
  if ($LASTEXITCODE -ne 0) { throw "PostgreSQL failed to start" }
}

Push-Location $projectRoot
try {
  & $pnpmExe --filter "@workspace/api-server" run build
  if ($LASTEXITCODE -ne 0) { throw "API build failed" }
} finally {
  Pop-Location
}

function Get-ListenerPid([int]$Port) {
  $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) { return $listener.OwningProcess }
  return $null
}

if (!(Get-ListenerPid 5000)) {
  Start-Process -FilePath $nodeExe `
    -ArgumentList "--enable-source-maps", ".\dist\index.mjs" `
    -WorkingDirectory (Join-Path $projectRoot "artifacts\api-server") `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtimeDir "api.stdout.log") `
    -RedirectStandardError (Join-Path $runtimeDir "api.stderr.log") | Out-Null
}

$env:PORT = "22860"
$env:BASE_PATH = "/"
$env:API_PROXY_TARGET = "http://127.0.0.1:5000"
$env:NODE_ENV = "development"
if (!(Get-ListenerPid 22860)) {
  Start-Process -FilePath $pnpmExe `
    -ArgumentList "--filter", "@workspace/alwdaif", "run", "dev" `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput (Join-Path $runtimeDir "web.stdout.log") `
    -RedirectStandardError (Join-Path $runtimeDir "web.stderr.log") | Out-Null
}

$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/healthz" -TimeoutSec 2
    if ($health.status -eq "ok") { $ready = $true; break }
  } catch {}
  Start-Sleep -Milliseconds 500
}
if (!$ready) { throw "The local API did not become ready" }

Write-Host "alwdaif is running locally:"
Write-Host "  http://alwdaif.localhost:22860"
Write-Host "Fallback link:"
Write-Host "  http://127.0.0.1:22860"
