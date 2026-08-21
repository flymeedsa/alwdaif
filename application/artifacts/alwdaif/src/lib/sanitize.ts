export function sanitizeHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(/\s*style="[^"]*"/gi, "")
    .replace(/\s*style='[^']*'/gi, "");
}
