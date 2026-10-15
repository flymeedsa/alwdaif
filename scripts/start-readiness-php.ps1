$ErrorActionPreference = 'Stop'
$readinessRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'application/.runtime/readiness'
$projectRoot = Split-Path -Parent $PSScriptRoot
$mariaBin = Join-Path $readinessRoot 'mariadb/mariadb-10.11.16-winx64/bin'
$dataPath = Join-Path $readinessRoot 'data'
$siteRoot = Join-Path $readinessRoot 'site'
$phpExe = (Get-Command php).Source
$phpExt = Join-Path (Split-Path $phpExe) 'ext'
if (!(Test-Path (Join-Path $mariaBin 'mariadb-install-db.exe'))) { throw 'Verified MariaDB archive must be extracted first' }
if (!(Test-Path $dataPath)) {
  & (Join-Path $mariaBin 'mariadb-install-db.exe') "--datadir=$dataPath" '--password=readiness-local-only' '--port=33317'
  if ($LASTEXITCODE -ne 0) { throw 'Fixture database initialization failed' }
}
if (!(Get-NetTCPConnection -LocalPort 33317 -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath (Join-Path $mariaBin 'mariadbd.exe') -ArgumentList "--defaults-file=$dataPath/my.ini",'--bind-address=127.0.0.1','--port=33317' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $readinessRoot 'db.stdout.log') -RedirectStandardError (Join-Path $readinessRoot 'db.stderr.log') | Out-Null
}
$ready=$false
for($attempt=0;$attempt -lt 20;$attempt++) {
  if(Get-NetTCPConnection -LocalPort 33317 -State Listen -ErrorAction SilentlyContinue){$ready=$true;break}
  Start-Sleep -Milliseconds 500
}
if(!$ready){throw 'Isolated MariaDB did not start'}
& $phpExe -d "extension_dir=$phpExt" -d extension=pdo_mysql (Join-Path $projectRoot 'tests/php-fixture/bootstrap.php')
if($LASTEXITCODE -ne 0){throw 'Fixture schema setup failed'}
New-Item -ItemType Directory -Path "$siteRoot/public_html","$siteRoot/private_html" -Force | Out-Null
Copy-Item "$projectRoot/cloudways/public_html/*.php" "$siteRoot/public_html/" -Force
Copy-Item "$projectRoot/cloudways/public_html/frontend-routes.json" "$siteRoot/public_html/" -Force
Copy-Item "$projectRoot/tests/php-fixture/config.php" "$siteRoot/private_html/alwdaif-migration-config.php" -Force
Copy-Item "$projectRoot/application/artifacts/alwdaif/dist/public/*" "$siteRoot/public_html/" -Recurse -Force
Copy-Item "$projectRoot/application/artifacts/alwdaif/dist/public/index.html" "$siteRoot/public_html/spa-index.html" -Force
if (!(Get-NetTCPConnection -LocalPort 22861 -State Listen -ErrorAction SilentlyContinue)) {
  Start-Process -FilePath $phpExe -ArgumentList '-d',"extension_dir=`"$phpExt`"",'-d','extension=pdo_mysql','-d','extension=mbstring','-d','extension=fileinfo','-S','127.0.0.1:22861','-t',"$siteRoot/public_html","$projectRoot/tests/php-fixture/router.php" -WindowStyle Hidden -RedirectStandardOutput (Join-Path $readinessRoot 'php.stdout.log') -RedirectStandardError (Join-Path $readinessRoot 'php.stderr.log') | Out-Null
}
$httpReady = $false
for ($attempt=0; $attempt -lt 20; $attempt++) {
  try {
    $response = Invoke-WebRequest 'http://127.0.0.1:22861/api/_cloudways/health' -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200 -and ($response.Content | ConvertFrom-Json).status -eq 'ok') { $httpReady=$true; break }
  } catch { Start-Sleep -Milliseconds 500 }
}
if (!$httpReady) { throw 'Fixture HTTP/database health check failed' }
Write-Output 'Test runtime verified: http://127.0.0.1:22861 ; isolated MariaDB: 127.0.0.1:33317'
