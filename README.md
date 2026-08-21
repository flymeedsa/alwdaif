# منصة إعلانات الوظائف

المستودع المرجعي لتطوير ونشر منصة إعلانات الوظائف.

## البيئات

- التطوير: Codex ومساحة العمل المحلية.
- مصدر الكود: GitHub.
- الإنتاج: Cloudways فقط.
- البيانات: MariaDB داخل Cloudways.
- الملفات المرفوعة: `public_html/uploads` داخل تطبيق Cloudways.

لا يعتمد إصدار الإنتاج على Replit أو أي مضيف سابق، ولا يحتوي موجه Cloudways
على proxy إلى خدمة خارجية.

## هيكل المشروع

- `application/artifacts/alwdaif`: واجهة React/Vite الفعلية.
- `application/artifacts/api-server`: المصدر التاريخي للـAPI ومرجع العقود.
- `cloudways/public_html`: تنفيذ PHP النشط لمسارات الإنتاج.
- `cloudways/migration`: مخطط MariaDB وأدوات ترحيل البيانات.
- `.github/workflows/deploy-cloudways.yml`: البناء والنشر الآلي.

## بدء التطوير

```powershell
cd application
pnpm install --frozen-lockfile
$env:PORT = '4173'
$env:BASE_PATH = '/'
$env:API_PROXY_TARGET = 'https://phpstack-564460-6624296.cloudwaysapps.com'
pnpm --filter '@workspace/alwdaif' dev
```

انسخ `application/.env.example` إلى ملف محلي عند الحاجة ولا تحفظ الأسرار في
Git. فحص الواجهة وبناؤها:

```powershell
pnpm --dir application --filter '@workspace/alwdaif' typecheck
$env:PORT = '4173'
$env:BASE_PATH = '/'
pnpm --dir application --filter '@workspace/alwdaif' build
```

## النشر

أي دمج إلى `master` يشغل GitHub Actions، يبني الواجهة، يمنع نشر أي إصدار يحتوي
مرجعاً للمضيف السابق، يحفظ نسخة رجوع في `private_html/releases`، ثم ينشر
الإصدار ويفحص صحة MariaDB والصفحة الرئيسية.

تفاصيل التشغيل والرجوع موجودة في `cloudways/README.md`.
