const COUNTRY = "SA";
const COUNTRY_NAME = "المملكة العربية السعودية";

const WORK_SCHEDULE_MAP: Record<string, string> = {
  full_time:  "FULL_TIME",
  part_time:  "PART_TIME",
  contract:   "CONTRACTOR",
  temporary:  "TEMPORARY",
  intern:     "INTERN",
  volunteer:  "VOLUNTEER",
};

function isoDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  try { return new Date(value).toISOString(); } catch { return undefined; }
}

export function buildJobPostingJsonLd(params: {
  id: number | string;
  title: string;
  company: string;
  companyLogo?: string | null;
  description?: string | null;
  location?: string | null;
  city?: string | null;
  region?: string | null;
  applyUrl?: string | null;
  contactMethod?: string;
  contactValue?: string;
  createdAt?: string | Date | null;
  deadlineDate?: string | Date | null;
  workSchedule?: string | null;
  workMode?: string | null;
  pageUrl: string;
}) {
  const {
    title, company, companyLogo, description,
    location, city, region,
    applyUrl, contactMethod, contactValue,
    createdAt, deadlineDate,
    workSchedule, workMode, pageUrl,
  } = params;

  const addressLocality = city || region || location || COUNTRY_NAME;
  const descriptionText = description
    ? description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    : `وظيفة ${title} في ${company} — المملكة العربية السعودية`;

  const applyLink =
    applyUrl ||
    (contactMethod === "url" ? contactValue : undefined) ||
    (contactMethod === "email" ? `mailto:${contactValue}` : undefined) ||
    pageUrl;

  const employmentType = workSchedule
    ? WORK_SCHEDULE_MAP[workSchedule] ?? "OTHER"
    : undefined;

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    description: descriptionText,
    datePosted: isoDate(createdAt) ?? new Date().toISOString(),
    hiringOrganization: {
      "@type": "Organization",
      name: company,
      ...(companyLogo ? { logo: companyLogo } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: COUNTRY,
        addressLocality,
      },
    },
    url: pageUrl,
    directApply: !!(applyUrl || (contactMethod === "url")),
  };

  if (applyLink) ld.applicantLocationRequirements = { "@type": "Country", name: COUNTRY_NAME };
  if (applyLink) ld.jobLocationType = workMode === "remote" ? "TELECOMMUTE" : undefined;
  if (employmentType) ld.employmentType = employmentType;
  if (deadlineDate) {
    const iso = isoDate(deadlineDate);
    if (iso) ld.validThrough = iso;
  }
  if (applyLink && contactMethod !== "email" && contactMethod !== "phone") {
    ld.apply = applyLink;
  }

  Object.keys(ld).forEach(k => ld[k] === undefined && delete ld[k]);
  return ld;
}

export function buildBlogPostingJsonLd(params: {
  id: number | string;
  title: string;
  author?: string | null;
  excerpt?: string | null;
  image?: string | null;
  date?: string | null;
  createdAt?: string | Date | null;
  category?: string | null;
  pageUrl: string;
}) {
  const { title, author, excerpt, image, date, createdAt, category, pageUrl } = params;

  const publishedDate = isoDate(date) ?? isoDate(createdAt) ?? new Date().toISOString();

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: excerpt || `اقرأ مقالة: ${title} — مدونة إعلانات الوظائف`,
    author: {
      "@type": "Person",
      name: author || "فريق إعلانات الوظائف",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://www.alwdaif.com/#organization",
      name: "منصة إعلانات الوظائف",
      logo: {
        "@type": "ImageObject",
        url: "https://www.alwdaif.com/logo.png",
      },
    },
    datePublished: publishedDate,
    dateModified: publishedDate,
    inLanguage: "ar",
    url: pageUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };

  if (image) ld.image = { "@type": "ImageObject", url: image };
  if (category) ld.articleSection = category;

  Object.keys(ld).forEach(k => ld[k] === undefined && delete ld[k]);
  return ld;
}
