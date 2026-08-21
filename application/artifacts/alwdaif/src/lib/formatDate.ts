function arabicPlural(n: number, singular: string, dual: string, plural: string, elevenPlus: string): string {
  if (n === 1) return singular;
  if (n === 2) return dual;
  if (n >= 3 && n <= 10) return `${n} ${plural}`;
  return `${n} ${elevenPlus}`;
}

export function formatTimeAgo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "";
  try {
    const past = new Date(dateInput);
    if (isNaN(past.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - past.getTime();
    if (diffMs < 0) return "الآن";

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return "الآن";
    if (diffMins < 60) return `منذ ${arabicPlural(diffMins, "دقيقة", "دقيقتين", "دقائق", "دقيقة")}`;
    if (diffHours < 24) return `منذ ${arabicPlural(diffHours, "ساعة", "ساعتين", "ساعات", "ساعة")}`;
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${arabicPlural(diffDays, "يوم", "يومين", "أيام", "يومًا")}`;
    if (diffWeeks < 5) return `منذ ${arabicPlural(diffWeeks, "أسبوع", "أسبوعين", "أسابيع", "أسبوعًا")}`;
    if (diffMonths < 12) return `منذ ${arabicPlural(diffMonths, "شهر", "شهرين", "أشهر", "شهرًا")}`;
    return `منذ ${arabicPlural(diffYears, "سنة", "سنتين", "سنوات", "سنة")}`;
  } catch {
    return "";
  }
}

export function formatRelativeDate(dateStr: string, createdAt?: Date | string | null): string {
  try {
    const publishDate = createdAt ? new Date(createdAt) : new Date(dateStr);
    if (isNaN(publishDate.getTime())) return dateStr;

    const now = new Date();
    const diffMs = now.getTime() - publishDate.getTime();
    if (diffMs < 0) return "الآن";

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return "الآن";
    if (diffMins < 60) return `منذ ${arabicPlural(diffMins, "دقيقة", "دقيقتين", "دقائق", "دقيقة")}`;
    if (diffHours < 24) return `منذ ${arabicPlural(diffHours, "ساعة", "ساعتين", "ساعات", "ساعة")}`;
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${arabicPlural(diffDays, "يوم", "يومين", "أيام", "يومًا")}`;
    if (diffWeeks < 5) return `منذ ${arabicPlural(diffWeeks, "أسبوع", "أسبوعين", "أسابيع", "أسبوعًا")}`;
    if (diffMonths < 12) return `منذ ${arabicPlural(diffMonths, "شهر", "شهرين", "أشهر", "شهرًا")}`;
    if (diffYears < 2) return `منذ سنة`;

    return publishDate.toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}
