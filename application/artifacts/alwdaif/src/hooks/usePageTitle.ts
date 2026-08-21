import { useEffect } from "react";
import { useSeoContext } from "@/contexts/SeoContext";

const SITE_NAME = "إعلانات الوظائف";

export function usePageTitle(title?: string) {
  const seo = useSeoContext();

  useEffect(() => {
    if (seo?.title) {
      return;
    }
    document.title = title || SITE_NAME;

    return () => {
      document.title = SITE_NAME;
    };
  }, [title, seo]);
}
