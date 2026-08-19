param(
    [string]$OutputPath = "cloudways-deploy.zip"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$clientBuild = Join-Path $projectRoot "dist\client"
$bridgeRoot = Join-Path $PSScriptRoot "public_html"
$stagingRoot = Join-Path $PSScriptRoot ".staging"
$resolvedOutput = Join-Path $PSScriptRoot $OutputPath
$cloudwaysRoot = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$resolvedStaging = [System.IO.Path]::GetFullPath($stagingRoot)

if (-not $resolvedStaging.StartsWith($cloudwaysRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to use a staging directory outside the Cloudways package directory."
}

if (-not (Test-Path -LiteralPath $clientBuild)) {
    throw "Missing dist/client. Run the production build before packaging."
}

if (Test-Path -LiteralPath $stagingRoot) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $stagingRoot | Out-Null
Get-ChildItem -LiteralPath $clientBuild -Force | Copy-Item -Destination $stagingRoot -Recurse -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot ".htaccess") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "index.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "upload-handler.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "local-api.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "search-api.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "admin-auth.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "admin-content.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "community-auth.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "community-api.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "support-api.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "orders-api.php") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "search-fetch-r2.js") -Destination $stagingRoot -Force
Copy-Item -LiteralPath (Join-Path $bridgeRoot "hero-copy-r4.css") -Destination $stagingRoot -Force
$uploadStaging = Join-Path $stagingRoot "uploads"
New-Item -ItemType Directory -Path $uploadStaging -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $bridgeRoot "uploads\.htaccess") -Destination $uploadStaging -Force

if (Test-Path -LiteralPath $resolvedOutput) {
    Remove-Item -LiteralPath $resolvedOutput -Force
}

Compress-Archive -Path (Join-Path $stagingRoot "*") -DestinationPath $resolvedOutput -CompressionLevel Optimal
Remove-Item -LiteralPath $stagingRoot -Recurse -Force

Write-Output $resolvedOutput
