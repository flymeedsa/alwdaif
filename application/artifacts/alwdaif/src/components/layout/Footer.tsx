import { Link } from "wouter";
import { Youtube, Twitter, Music2, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Page } from "@shared/schema";

export default function Footer() {
  const { data: pages = [] } = useQuery<Page[]>({
    queryKey: ["/api/pages"],
    queryFn: async () => {
      const res = await fetch("/api/pages");
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <footer className="mt-auto border-t border-border/70 bg-card/40" dir="rtl">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Right: Logo */}
          <Link href="/" className="flex items-center md:order-first cursor-pointer" data-testid="link-footer-logo-wrapper">
            <img
              src="/logo.png"
              alt="شعار إعلانات الوظائف"
              className="h-10 w-auto max-w-[400px] object-contain"
              data-testid="img-footer-logo"
            />
          </Link>

          {/* Center: Copyright */}
          <div className="text-center text-xs md:text-sm text-muted-foreground md:flex-1" data-testid="text-footer-copyright">
            جميع الحقوق محفوظة إعلانات الوظائف 2026 ©
          </div>

          {/* Left: Social */}
          <div className="flex items-center gap-4 md:order-last" data-testid="group-footer-social">
            <a
              href="https://whatsapp.com/channel/0029VaDUMpy7j6g6y8FRU11S"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors group"
              aria-label="واتساب"
              data-testid="link-social-whatsapp"
            >
              <Send className="h-5 w-5 rotate-[-45deg]" />
            </a>
            <a
              href="https://x.com/alwdaif1"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
              aria-label="تويتر"
              data-testid="link-social-twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
              aria-label="تيك توك"
              data-testid="link-social-tiktok"
            >
              <Music2 className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
              aria-label="يوتيوب"
              data-testid="link-social-youtube"
            >
              <Youtube className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      {/* Short footer nav bar — desktop only */}
      <div className="border-t border-border/40 bg-muted/20 hidden md:block">
        <div className="px-4 py-3 md:px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
          <Link href="/pages/about" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-about">من نحن</Link>
          <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-faq">الأسئلة الشائعة</Link>
          <Link href="/pages/contact" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-contact">اتصل بنا</Link>
          <Link href="/pages/terms" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-terms">الشروط والأحكام</Link>
          <Link href="/pages/privacy" className="text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-privacy">سياسة الخصوصية</Link>
          {pages
            .filter(p => !["terms","privacy","about","contact","faq"].includes(p.slug))
            .map((page) => (
              <Link
                key={page.id}
                href={`/page/${page.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid={`link-footer-page-${page.slug}`}
              >
                {page.title}
              </Link>
            ))}
        </div>
      </div>
      {/* Bottom legal bar */}
      <div className="border-t border-border/30 bg-muted/10">
        <div className="px-4 py-2 md:px-6 flex items-center justify-center text-[11px] text-muted-foreground/60 text-center">يتم تشغيل الموقع من قبل مؤسسة برقيات الرقمية س.ت: 7040429818</div>
      </div>
    </footer>
  );
}
