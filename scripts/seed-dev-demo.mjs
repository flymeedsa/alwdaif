import pg from "../application/artifacts/api-server/node_modules/pg/esm/index.mjs";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL ?? "";

if (process.env.NODE_ENV !== "development" || !/127\.0\.0\.1:55433\//.test(databaseUrl)) {
  throw new Error("This script is restricted to the local development database on 127.0.0.1:55433.");
}

const client = new Client({ connectionString: databaseUrl });
const now = Date.now();
const deadline = now + 1000 * 60 * 60 * 24 * 120;

await client.connect();
try {
  await client.query("BEGIN");

  const organizations = [
    ["[تجريبي] شركة أفق التقنية", "company", "جهة تجريبية لاختبار دليل الجهات والشركات.", "https://example.test/afaq"],
    ["[تجريبي] الهيئة الوطنية للخدمات", "government", "جهة تجريبية لاختبار الوظائف المدنية.", "https://example.test/services"],
    ["[تجريبي] قطاع الحماية والسلامة", "military", "جهة تجريبية لاختبار الوظائف العسكرية.", "https://example.test/safety"],
  ];
  const organizationIds = {};
  for (const [name, type, description, website] of organizations) {
    await client.query(
      `INSERT INTO organizations (name, type, description, website, is_active)
       SELECT $1::text, $2::text, $3::text, $4::text, TRUE WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = $1::text)`,
      [name, type, description, website],
    );
    const result = await client.query("SELECT id FROM organizations WHERE name = $1 LIMIT 1", [name]);
    organizationIds[name] = result.rows[0].id;
  }

  const jobs = [
    ["[تجريبي] مطور تطبيقات", "[تجريبي] شركة أفق التقنية", "companies", "الرياض", "فرصة تجريبية لاختبار وظائف الشركات."],
    ["[تجريبي] أخصائي خدمات حكومية", "[تجريبي] الهيئة الوطنية للخدمات", "civil", "جدة", "فرصة تجريبية لاختبار الوظائف المدنية."],
    ["[تجريبي] فني أنظمة أمنية", "[تجريبي] قطاع الحماية والسلامة", "military", "الدمام", "فرصة تجريبية لاختبار الوظائف العسكرية."],
  ];
  for (const [title, company, category, location, summary] of jobs) {
    await client.query(
      `INSERT INTO jobs (title, company, organization_id, category, date, location, description, summary, apply_url, source_url, status, is_featured, is_active, deadline_date)
       SELECT $1::text, $2::text, $3::integer, $4::text, CURRENT_DATE::text, $5::text, $6::text, $6::text, '/contact', '/contact', 'published', TRUE, TRUE, to_timestamp($7::double precision / 1000)
       WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE title = $1::text AND company = $2::text)`,
      [title, company, organizationIds[company], category, location, summary, deadline],
    );
  }

  const employerJobs = [
    ["[تجريبي] منسق عمليات", "شركة آفاق الأعمال", "الرياض", "الرياض", "full_time", "on_site"],
    ["[تجريبي] مصمم محتوى عن بعد", "استوديو نمو", "كل المناطق", "عن بعد", "part_time", "remote"],
  ];
  for (const [title, company, region, city, schedule, mode] of employerJobs) {
    await client.query(
      `INSERT INTO employer_jobs (title, company, region, city, work_schedule, work_mode, description, requirements, target_gender, target_nationality, contact_method, contact_value, submitter_name, submitter_email, status, deadline_date)
       SELECT $1::text, $2::text, $3::text, $4::text, $5::text, $6::text, 'إعلان تجريبي لاختبار قسم وظائف أصحاب العمل.', 'مهارات مناسبة للمجال والقدرة على التواصل.', 'all', 'all', 'url', '/contact', 'فريق الموقع', 'demo@example.test', 'published', to_timestamp($7::double precision / 1000)
       WHERE NOT EXISTS (SELECT 1 FROM employer_jobs WHERE title = $1::text AND company = $2::text)`,
      [title, company, region, city, schedule, mode, deadline],
    );
  }

  await client.query(
    `INSERT INTO results (title, org, organization_id, type, date, details, inquiry_url, status, is_active)
     SELECT '[تجريبي] نتائج الترشيح للمرحلة الأولى', $1, $2, 'ترشيح', CURRENT_DATE::text, 'نتيجة تجريبية لاختبار قسم نتائج التوظيف ولا تمثل نتيجة حقيقية.', '/contact', 'published', TRUE
     WHERE NOT EXISTS (SELECT 1 FROM results WHERE title = '[تجريبي] نتائج الترشيح للمرحلة الأولى'::text)`,
    ["[تجريبي] الهيئة الوطنية للخدمات", organizationIds["[تجريبي] الهيئة الوطنية للخدمات"]],
  );

  await client.query(
    `INSERT INTO blog_posts (title, slug, excerpt, content, source, category, author, date, status, is_published)
     SELECT $1::text, $2::text, $3::text, $4::text, 'محتوى تجريبي', 'saudi-job-market', 'فريق التحرير', CURRENT_DATE::text, 'published', TRUE
     WHERE NOT EXISTS (SELECT 1 FROM blog_posts WHERE slug = $2::text)`,
    ["[تجريبي] خطوات عملية للبحث عن وظيفة", "demo-local-job-search", "مقال تجريبي لاختبار صفحة المدونة.", "<h2>خطط لبحثك</h2><p>حدّد المجالات والجهات التي تناسب خبرتك، ثم تابع الإعلانات الرسمية باستمرار.</p><p><strong>تنبيه:</strong> هذا محتوى تجريبي لبيئة التطوير فقط.</p>"],
  );

  const courses = [
    ["[تجريبي] أساسيات كتابة السيرة الذاتية", "أكاديمية التطوير المهني", "دورة تجريبية لاختبار قسم البرامج والدورات.", "https://example.test/course/cv"],
    ["[تجريبي] مهارات المقابلة الوظيفية", "منصة التعلم المفتوح", "دورة تجريبية للتدرب على أسئلة المقابلات والاستعداد لها.", "https://example.test/course/interview"],
  ];
  for (const [title, provider, description, url] of courses) {
    await client.query(
      `INSERT INTO courses (title, provider, description, url, date, is_free, is_active, status)
       SELECT $1::text, $2::text, $3::text, $4::text, CURRENT_DATE::text, TRUE, TRUE, 'published'
       WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = $1::text)`,
      [title, provider, description, url],
    );
  }

  await client.query("COMMIT");
  const counts = await client.query(`SELECT
    (SELECT count(*) FROM organizations WHERE name LIKE '[تجريبي]%') AS organizations,
    (SELECT count(*) FROM jobs WHERE title LIKE '[تجريبي]%') AS jobs,
    (SELECT count(*) FROM employer_jobs WHERE title LIKE '[تجريبي]%') AS employer_jobs,
    (SELECT count(*) FROM results WHERE title LIKE '[تجريبي]%') AS results,
    (SELECT count(*) FROM blog_posts WHERE title LIKE '[تجريبي]%') AS blog_posts,
    (SELECT count(*) FROM courses WHERE title LIKE '[تجريبي]%') AS courses`);
  console.log(JSON.stringify({ scope: "development", demo: counts.rows[0] }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
