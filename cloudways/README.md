# Cloudways Flexible deployment

This directory contains the no-downtime migration bridge for the existing
Cloudways Flexible server.

## Phase 1

- Copy the contents of `dist/client` into `cloudways/public_html`.
- Keep `.htaccess` and `index.php` in that directory.
- Deploy to a temporary Cloudways application URL for validation.
- Static assets are served by Cloudways; dynamic routes remain on the current
  production origin during the transition.

## Phase 2

- Port the D1 schema and queries to MariaDB.
- Replace the R2 binding with Cloudways/local or S3-compatible storage.
- Replace the bridge with the native PHP API only after route-by-route tests
  and data reconciliation pass.

The bridge must never be used to switch the production domain before the
temporary URL passes functional testing.

