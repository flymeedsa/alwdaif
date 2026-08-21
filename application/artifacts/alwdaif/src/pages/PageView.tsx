import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import type { Page } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";
import { FileText, Calendar, Shield, FileCheck, Info } from "lucide-react";

const PAGE_META: Record<string, { icon: any; gradient: string; badge: string }> = {
  "privacy-policy":  { icon: Shield,    gradient: "from-blue-600 to-indigo-600",   badge: "سياسة الخصوصية" },
  "terms":           { icon: FileCheck, gradient: "from-emerald-600 to-teal-600",  badge: "الشروط والأحكام" },
  "usage-agreement": { icon: FileCheck, gradient: "from-emerald-600 to-teal-600",  badge: "اتفاقية الاستخدام" },
  "about":           { icon: Info,      gradient: "from-violet-600 to-purple-600", badge: "عن الموقع" },
};

export default function PageView() {
  usePageTitle("الصفحة");
  const [, rawParams] = useRoute("/page/:slug");
  const params = rawParams as { slug?: string } | null;
  const slug = params?.slug ?? "";

  const { data: page, isLoading, error } = useQuery<Page>({
    queryKey: ["/api/pages", slug],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${slug}`);
      if (!res.ok) throw new Error("Page not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const meta = PAGE_META[slug] ?? { icon: FileText, gradient: "from-primary to-primary/80", badge: "صفحة" };
  const Icon = meta.icon;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !page) {
    return (
      <Layout>
        <div className="text-center py-32">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold mb-2">الصفحة غير موجودة</h1>
          <p className="text-muted-foreground">عذراً، الصفحة التي تبحث عنها غير متوفرة.</p>
        </div>
      </Layout>
    );
  }

  const updatedDate = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <Layout>
      <Helmet>
        <title>{page.title}</title>
      </Helmet>

      <div dir="rtl">
        {/* ── Hero Banner ── */}
        <div className={`relative overflow-hidden bg-gradient-to-l ${meta.gradient} text-white`}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-8 w-56 h-56 rounded-full bg-white/5" />

          <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-16">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <Icon className="w-3.5 h-3.5" />
                {meta.badge}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">{page.title}</h1>
            {updatedDate && (
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Calendar className="w-3.5 h-3.5" />
                آخر تحديث: {updatedDate}
              </div>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* top accent bar */}
            <div className={`h-1 bg-gradient-to-l ${meta.gradient}`} />

            <div className="p-6 md:p-10">
              <div
                className="
                  prose prose-base dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
                  prose-p:text-muted-foreground prose-p:leading-8 prose-p:my-3
                  prose-li:text-muted-foreground prose-li:leading-7
                  prose-ul:my-4 prose-ul:space-y-1
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground
                  [&_*]:!color-inherit
                "
                style={{ direction: "rtl" }}
                dangerouslySetInnerHTML={{ __html: page.content || "" }}
              />
            </div>

            {/* Footer of card */}
            <div className="border-t border-border/50 bg-muted/30 px-6 md:px-10 py-4">
              <p className="text-xs text-muted-foreground text-center">
                جميع الحقوق محفوظة لـ إعلانات الوظائف {new Date().getFullYear()} ©
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
