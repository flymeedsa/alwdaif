import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { SeoSetting } from "@shared/schema";
import Footer from "./Footer";
import Header from "./Header";
import SmartAdBanner from "@/components/SmartAdBanner";
import { Helmet } from "react-helmet";
import { SeoContext } from "@/contexts/SeoContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const { data: seo } = useQuery<SeoSetting>({
    queryKey: [`/api/seo-settings${location}`],
    queryFn: async () => {
      const res = await fetch(`/api/seo/page?path=${encodeURIComponent(location)}`);
      if (!res.ok) return null;
      return res.json();
    }
  });

  const seoData = seo ?? null;

  const hideAdsOn = [
    "/login", "/admin/login", "/contact", "/pages/contact",
    "/privacy", "/pages/privacy", "/page/privacy-policy",
    "/terms", "/pages/terms", "/page/terms-of-use",
    "/page/usage-agreement", "/pages/about"
  ];

  return (
    <SeoContext.Provider value={seoData}>
      {/* Geo-targeting signals — tells Google this is a Saudi/GCC market site,
          which triggers higher-CPM advertisers bidding on GCC audiences */}
      <Helmet>
        <meta name="geo.region" content="SA" />
        <meta name="geo.placename" content="المملكة العربية السعودية" />
        <meta name="geo.position" content="23.8859;45.0792" />
        <meta name="ICBM" content="23.8859, 45.0792" />
      </Helmet>
      {seoData && (
        <Helmet>
          <title>{seoData.title}</title>
          {seoData.description && <meta name="description" content={seoData.description} />}
          {seoData.keywords && <meta name="keywords" content={seoData.keywords} />}
          {seoData.robots && <meta name="robots" content={seoData.robots} />}
          {seoData.canonicalUrl && <link rel="canonical" href={seoData.canonicalUrl} />}
          {seoData.ogImage && <meta property="og:image" content={seoData.ogImage} />}
        </Helmet>
      )}
      <div className="min-h-screen text-foreground app-shell" dir="rtl">
        <main className="w-full overflow-x-hidden flex flex-col min-h-screen">
          <div className="flex-1 w-full py-4 px-3 sm:py-5 sm:px-4 md:py-6 pb-20 md:pb-6">
            <div className="mx-auto w-full max-w-[1200px] rounded-2xl border border-border/70 bg-background/40 shadow-2xl shadow-black/35 overflow-hidden">
              <div className="bg-card/60 border-b border-border/70">
                <Header />
              </div>
              {!hideAdsOn.includes(location) && <SmartAdBanner />}
              <div className="p-3 sm:p-4 md:p-6">
                {children}
              </div>
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </SeoContext.Provider>
  );
}
