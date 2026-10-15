import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const SITE_URL = process.env.SITE_URL || "https://www.alwdaif.com";

function getGmailTransporter() {
  const pass = process.env.GMAIL_APP_PASSWORD;
  const user = process.env.GMAIL_USER || "flymeedsa@gmail.com";
  if (!pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendWeeklySummaryEmailGmail(data: {
  email: string;
  displayName?: string | null;
  weekLabel: string;
  narrative: string;
  statsSnapshot: string;
  aiAdvice: string;
  topJobsData?: string | null;
}) {
  const transporter = getGmailTransporter();
  if (!transporter) throw new Error("GMAIL_APP_PASSWORD not set");

  const gmailUser = process.env.GMAIL_USER || "flymeedsa@gmail.com";
  const name = data.displayName || "العضو الكريم";

  let topJobsRows = "";
  try {
    const jobs: Array<{ id: number; title: string; company: string; category: string; viewCount: number }> =
      data.topJobsData ? JSON.parse(data.topJobsData) : [];
    topJobsRows = jobs
      .slice(0, 5)
      .map(
        (j, i) => `
          <tr>
            <td style="padding:8px 4px;color:#6b7280;font-size:13px;width:24px;text-align:center;">${i + 1}</td>
            <td style="padding:8px 12px 8px 4px;">
              <a href="${SITE_URL}/jobs/${j.id}" style="color:#1e40af;font-weight:600;font-size:13px;text-decoration:none;">${j.title}</a>
              <div style="color:#9ca3af;font-size:12px;margin-top:2px;">${j.company}</div>
            </td>
          </tr>`
      )
      .join("");
  } catch {}

  const summaryUrl = `${SITE_URL}/weekly-summary`;
  const unsubscribeUrl = `${SITE_URL}/weekly-summary?unsubscribe=1`;

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#f9fafb;padding:24px 16px;">
      <div style="background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:32px 36px 28px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
            <span style="font-size:24px;">✨</span>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">الملخص الأسبوعي</h1>
          </div>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">${data.weekLabel}</p>
        </div>
        <div style="padding:32px 36px;">
          <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.7;">
            مرحباً <strong>${name}</strong>،<br>
            إليك ملخص هذا الأسبوع من منصة <strong>إعلانات الوظائف</strong> لسوق العمل السعودي.
          </p>
          <div style="background:#f0f9ff;border-radius:12px;padding:20px;border-right:4px solid #3b82f6;margin-bottom:24px;">
            <p style="margin:0;color:#1e3a5f;font-size:14px;line-height:1.9;">${data.narrative}</p>
          </div>
          <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;border-right:4px solid #22c55e;margin-bottom:24px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#16a34a;">أبرز الأرقام</p>
            <p style="margin:0;color:#166534;font-size:14px;line-height:1.8;">${data.statsSnapshot}</p>
          </div>
          ${topJobsRows ? `
          <div style="margin-bottom:24px;">
            <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 12px;">💼 أبرز وظائف الأسبوع</p>
            <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:10px;overflow:hidden;">
              <tbody>${topJobsRows}</tbody>
            </table>
            <div style="margin-top:10px;text-align:center;">
              <a href="${summaryUrl}" style="font-size:13px;color:#1e40af;text-decoration:none;">عرض جميع الوظائف ←</a>
            </div>
          </div>` : ""}
          <div style="background:#fffbeb;border-radius:12px;padding:20px;border-right:4px solid #f59e0b;margin-bottom:28px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#d97706;">💡 نصيحة الأسبوع للباحثين عن عمل</p>
            <p style="margin:0;color:#78350f;font-size:14px;line-height:1.9;">${data.aiAdvice}</p>
          </div>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${summaryUrl}" style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;">
              عرض الملخص الكامل
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
          <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;line-height:1.8;">
            إعلانات الوظائف — منصة البحث عن عمل في المملكة العربية السعودية<br>
            <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">إلغاء الاشتراك في الملخص الأسبوعي</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"إعلانات الوظائف" <${gmailUser}>`,
    to: data.email,
    subject: `الملخص الأسبوعي لسوق العمل — ${data.weekLabel}`,
    html,
  });
}

export async function sendWeeklySummaryEmail(data: {
  email: string;
  displayName?: string | null;
  weekLabel: string;
  narrative: string;
  statsSnapshot: string;
  aiAdvice: string;
  topJobsData?: string | null;
}) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not set");
    const resend = new Resend(apiKey);
    const name = data.displayName || "العضو الكريم";

    let topJobsRows = "";
    try {
      const jobs: Array<{ id: number; title: string; company: string; category: string; viewCount: number }> =
        data.topJobsData ? JSON.parse(data.topJobsData) : [];
      topJobsRows = jobs
        .slice(0, 5)
        .map(
          (j, i) => `
          <tr>
            <td style="padding:8px 4px;color:#6b7280;font-size:13px;width:24px;text-align:center;">${i + 1}</td>
            <td style="padding:8px 12px 8px 4px;">
              <a href="${SITE_URL}/jobs/${j.id}" style="color:#1e40af;font-weight:600;font-size:13px;text-decoration:none;">${j.title}</a>
              <div style="color:#9ca3af;font-size:12px;margin-top:2px;">${j.company}</div>
            </td>
          </tr>`
        )
        .join("");
    } catch {}

    const summaryUrl = `${SITE_URL}/weekly-summary`;
    const unsubscribeUrl = `${SITE_URL}/weekly-summary?unsubscribe=1`;

    const result = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: data.email,
      subject: `الملخص الأسبوعي لسوق العمل — ${data.weekLabel}`,
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#f9fafb;padding:24px 16px;">
          <div style="background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);padding:32px 36px 28px;">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <span style="font-size:24px;">✨</span>
                <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">الملخص الأسبوعي</h1>
              </div>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">${data.weekLabel}</p>
            </div>

            <div style="padding:32px 36px;">
              <!-- Greeting -->
              <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.7;">
                مرحباً <strong>${name}</strong>،<br>
                إليك ملخص هذا الأسبوع من منصة <strong>إعلانات الوظائف</strong> لسوق العمل السعودي.
              </p>

              <!-- Narrative -->
              <div style="background:#f0f9ff;border-radius:12px;padding:20px;border-right:4px solid #3b82f6;margin-bottom:24px;">
                <p style="margin:0;color:#1e3a5f;font-size:14px;line-height:1.9;">${data.narrative}</p>
              </div>

              <!-- Stats Snapshot -->
              <div style="background:#f0fdf4;border-radius:12px;padding:16px 20px;border-right:4px solid #22c55e;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#16a34a;">أبرز الأرقام</p>
                <p style="margin:0;color:#166534;font-size:14px;line-height:1.8;">${data.statsSnapshot}</p>
              </div>

              ${topJobsRows ? `
              <!-- Top Jobs -->
              <div style="margin-bottom:24px;">
                <p style="font-size:14px;font-weight:700;color:#111827;margin:0 0 12px;">💼 أبرز وظائف الأسبوع</p>
                <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:10px;overflow:hidden;">
                  <tbody>${topJobsRows}</tbody>
                </table>
                <div style="margin-top:10px;text-align:center;">
                  <a href="${summaryUrl}" style="font-size:13px;color:#1e40af;text-decoration:none;">عرض جميع الوظائف ←</a>
                </div>
              </div>` : ""}

              <!-- AI Advice -->
              <div style="background:#fffbeb;border-radius:12px;padding:20px;border-right:4px solid #f59e0b;margin-bottom:28px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#d97706;">💡 نصيحة الأسبوع للباحثين عن عمل</p>
                <p style="margin:0;color:#78350f;font-size:14px;line-height:1.9;">${data.aiAdvice}</p>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${summaryUrl}" style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;">
                  عرض الملخص الكامل
                </a>
              </div>

              <!-- Footer -->
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
              <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;line-height:1.8;">
                إعلانات الوظائف — منصة البحث عن عمل في المملكة العربية السعودية<br>
                <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">إلغاء الاشتراك في الملخص الأسبوعي</a>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (result.error) console.error("Resend error (weekly):", result.error);
    return result;
  } catch (error: any) {
    console.error("sendWeeklySummaryEmail error:", error);
    return { error: error.message };
  }
}

export async function sendPasswordResetEmail(data: { email: string; resetUrl: string; displayName?: string }) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY not set');
    const resend = new Resend(apiKey);
    const name = data.displayName || 'العضو الكريم';
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: data.email,
      subject: 'استعادة كلمة المرور — إعلانات الوظائف',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 32px 16px;">
          <div style="background: #fff; border-radius: 16px; padding: 36px; border: 1px solid #e5e7eb; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
            <h1 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0 0 8px;">استعادة كلمة المرور</h1>
            <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px;">مرحباً ${name}، تلقينا طلب استعادة كلمة المرور لحسابك.</p>
            <a href="${data.resetUrl}" style="display: inline-block; background: #1e40af; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; margin-bottom: 24px;">تعيين كلمة مرور جديدة</a>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب استعادة كلمة المرور، تجاهل هذه الرسالة.</p>
            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
            <p style="color: #d1d5db; font-size: 12px; margin: 0; text-align: center;">إعلانات الوظائف — منصة البحث عن عمل في المملكة العربية السعودية</p>
          </div>
        </div>
      `,
    });
    if (result.error) console.error('Resend error (reset):', result.error);
    return result;
  } catch (error: any) {
    console.error('sendPasswordResetEmail error:', error);
    return { error: error.message };
  }
}

export async function sendContactEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    
    const resend = new Resend(apiKey);

    const subjectMap: Record<string, string> = {
      'inquiry': 'استفسار',
      'ad': 'اعلان',
      'request': 'طلب'
    };

    const subjectText = subjectMap[data.subject] || data.subject;

    console.log('Attempting to send email to flymeedsa@gmail.com');

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'flymeedsa@gmail.com',
      replyTo: data.email,
      subject: `رسالة جديدة من الموقع: ${subjectText}`,
      text: `الاسم: ${data.firstName} ${data.lastName}\nالبريد الإلكتروني: ${data.email}\nالموضوع: ${subjectText}\nالرسالة:\n${data.message}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif;">
          <h2>رسالة اتصال جديدة</h2>
          <p><strong>الاسم:</strong> ${data.firstName} ${data.lastName}</p>
          <p><strong>البريد الإلكتروني:</strong> ${data.email}</p>
          <p><strong>الموضوع:</strong> ${subjectText}</p>
          <p><strong>الرسالة:</strong></p>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
      `
    });

    if (result.error) {
      console.error('Resend API Error:', JSON.stringify(result.error, null, 2));
    } else {
      console.log('Email sent successfully:', JSON.stringify(result.data, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('Resend API Exception:', error);
    return { error: error.message || 'Unknown error' };
  }
}
