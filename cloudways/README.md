# Cloudways production deployment

Cloudways is the only production runtime. The frontend is built from
`application/artifacts/alwdaif`, the API runs in PHP, data is stored in
MariaDB, and uploaded files are stored below `public_html/uploads`.

## Local release

```powershell
$env:PORT = '4173'
$env:BASE_PATH = '/'
pnpm --dir application --filter '@workspace/alwdaif' build
python cloudways/deploy_release.py
```

The deployment script publishes hashed assets first, saves a remote rollback
copy under `releases/<timestamp>`, and activates `index.php` last.

## GitHub deployment

Merging to `main` runs `.github/workflows/deploy-cloudways.yml`. Configure the
four Cloudways SFTP secrets in the protected `production` environment. The
workflow builds, checks for references to the previous runtime, deploys, and
runs health checks.
