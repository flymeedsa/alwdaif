import React, { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import JobCard, { isJobClosed } from "@/components/JobCard";
import OrgActionCard from "@/components/OrgActionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Search, X, CheckCircle2, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Job, Organization } from "@shared/schema";
import { usePageTitle } from "@/hooks/usePageTitle";

interface JobWithOrg extends Job {
  organization?: Organization | null;
}


export default function Jobs() {
  usePageTitle("الوظائف");
  const [, rawCategoryParams] = useRoute("/jobs/:category?");
  const [, rawCompanyParams] = useRoute("/jobs/company/:company");
  const categoryParams = rawCategoryParams as { category?: string } | null;
  const companyParams = rawCompanyParams as { company?: string } | null;
  const [location, setLocation] = useLocation();

  const routeCategory = categoryParams?.category;
  const company = companyParams?.company ? decodeURIComponent(companyParams.company) : undefined;

  const [visibleJobs, setVisibleJobs] = useState(12);
  const [localSearch, setLocalSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");

  const [urlSearchQuery, setUrlSearchQuery] = useState<string | null>(null);
  const [urlCategory, setUrlCategory] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchValue = params.get("search");
    const categoryValue = params.get("category");
    setUrlSearchQuery(searchValue);
    setUrlCategory(categoryValue);
    setLocalSearch(searchValue || "");
    setVisibleJobs(12);
    setActiveTab("open");
  }, [location]);

  const activeCategory = urlCategory || (routeCategory && routeCategory !== "company" ? routeCategory : null) || "all";

  const buildApiUrl = useCallback((search: string | null, cat: string) => {
    const params = new URLSearchParams();
    if (search && search.trim()) params.set("search", search.trim());
    if (cat && cat !== "all") params.set("category", cat);
    return `/api/jobs${params.toString() ? "?" + params.toString() : ""}`;
  }, []);

  const { data: jobs = [], isLoading } = useQuery<JobWithOrg[]>({
    queryKey: ["/api/jobs", urlSearchQuery, activeCategory, company],
    queryFn: () => {
      if (company) return fetch(`/api/jobs`).then(r => r.json());
      return fetch(buildApiUrl(urlSearchQuery, activeCategory)).then(r => r.json());
    },
  });

  const filteredJobs = company
    ? jobs.filter(j => j.company === company)
    : jobs;

  const openJobs = filteredJobs.filter(j => !isJobClosed(j));
  const closedJobs = filteredJobs.filter(j => isJobClosed(j));

  const tabJobs = activeTab === "open" ? openJobs : closedJobs;
  const displayedJobs = tabJobs.slice(0, visibleJobs);

  const handleSearch = () => {
    if (localSearch.trim()) {
      const params = new URLSearchParams();
      params.set("search", localSearch.trim());
      if (activeCategory && activeCategory !== "all") params.set("category", activeCategory);
      setLocation(`/jobs?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== "all") params.set("category", activeCategory);
      setLocation(`/jobs${params.toString() ? "?" + params.toString() : ""}`);
    }
  };

  const clearSearch = () => {
    setLocalSearch("");
    const params = new URLSearchParams();
    if (activeCategory && activeCategory !== "all") params.set("category", activeCategory);
    setLocation(`/jobs${params.toString() ? "?" + params.toString() : ""}`);
  };

  const handleCategoryTab = (cat: string) => {
    const params = new URLSearchParams();
    if (urlSearchQuery) params.set("search", urlSearchQuery);
    if (cat !== "all") params.set("category", cat);
    setLocation(`/jobs${params.toString() ? "?" + params.toString() : ""}`);
  };

  function handleTabChange(tab: "open" | "closed") {
    setActiveTab(tab);
    setVisibleJobs(12);
  }

  const pageTitle = company
    ? `وظائف ${company}`
    : activeCategory === "civil"
      ? "وظائف مدنية"
      : activeCategory === "military"
        ? "وظائف عسكرية"
        : activeCategory === "companies"
          ? "وظائف شركات"
          : activeCategory === "results"
            ? "نتائج التوظيف"
            : urlSearchQuery
              ? `نتائج البحث: ${urlSearchQuery}`
              : "جميع الوظائف";

  const showTabs = activeCategory !== "results" && !company;

  return (
    <Layout>
      <Helmet>
        <title>{pageTitle} | إعلانات الوظائف</title>
        <meta name="description" content={
          company
            ? `تصفح وظائف ${company} المتاحة في المملكة العربية السعودية.`
            : activeCategory === "civil"
              ? "أحدث الوظائف الحكومية والمدنية في المملكة العربية السعودية. فرص عمل حكومية محدّثة يومياً."
              : activeCategory === "military"
                ? "أحدث الوظائف والرتب العسكرية في المملكة العربية السعودية. تصفح الفرص العسكرية المتاحة الآن."
                : activeCategory === "companies"
                  ? "وظائف القطاع الخاص وكبرى الشركات في السعودية. ابحث عن فرصتك المناسبة."
                  : urlSearchQuery
                    ? `نتائج البحث عن "${urlSearchQuery}" في إعلانات الوظائف السعودية.`
                    : "تصفح آلاف الوظائف الحكومية والعسكرية وشركات المملكة العربية السعودية المحدّثة يومياً."
        } />
        <link rel="canonical" href={`https://www.alwdaif.com/jobs${activeCategory && activeCategory !== "all" ? `/${activeCategory}` : ""}`} />
      </Helmet>
      <div className="bg-primary/5 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold font-heading mb-2" data-testid="text-jobs-title">
            {pageTitle}
          </h1>
          <p className="text-muted-foreground" data-testid="text-jobs-subtitle">
            {company ? "عرض الوظائف المعلنة لهذه الجهة فقط" : "تصفح أحدث الفرص الوظيفية المتاحة"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl p-6 md:p-8">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {!company && (
              <div className="mb-6 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ابحث عن وظيفة..."
                      className="h-11 pr-10 rounded-xl"
                      dir="rtl"
                      value={localSearch}
                      onChange={e => setLocalSearch(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSearch()}
                      data-testid="input-jobs-search"
                    />
                  </div>
                  {urlSearchQuery && (
                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl shrink-0" onClick={clearSearch} data-testid="button-clear-search">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button className="h-11 px-5 rounded-xl font-bold shrink-0" onClick={handleSearch} data-testid="button-jobs-search">
                    بحث
                  </Button>
                </div>

                {urlSearchQuery && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>نتائج البحث عن:</span>
                    <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold text-xs">
                      {urlSearchQuery}
                    </span>
                    <button onClick={clearSearch} className="text-xs underline hover:text-foreground">
                      مسح البحث
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── tabs + count ── */}
            {showTabs && (
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
                  <button
                    onClick={() => handleTabChange("open")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === "open"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="tab-open-jobs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    وظائف مفتوحة
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === "open"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                      {openJobs.length}
                    </span>
                  </button>
                  <button
                    onClick={() => handleTabChange("closed")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === "closed"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid="tab-closed-jobs"
                  >
                    <Lock className="h-3.5 w-3.5 text-gray-400" />
                    وظائف مغلقة
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      activeTab === "closed"
                        ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                      {closedJobs.length}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Label className="whitespace-nowrap hidden sm:block text-sm">الترتيب حسب:</Label>
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-[110px] sm:w-[140px]">
                      <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="popular">الأكثر مشاهدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {!showTabs && (
              <div className="flex items-center justify-between mb-6 gap-2">
                <span className="text-muted-foreground text-sm shrink-0" data-testid="text-jobs-count">
                  تم العثور على {filteredJobs.length} وظيفة
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Label className="whitespace-nowrap hidden sm:block">الترتيب حسب:</Label>
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-[110px] sm:w-[140px]">
                      <SelectValue placeholder="الترتيب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="popular">الأكثر مشاهدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : displayedJobs.length > 0 ? (
              <>
                {company && (
                  <div className="mb-6">
                    <OrgActionCard
                      org={displayedJobs[0]?.organization || null}
                      jobCompany={company}
                      jobLogo={displayedJobs[0]?.logo || null}
                      variant="compact"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedJobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <JobCard job={job} />
                    </React.Fragment>
                  ))}
                </div>

                {visibleJobs < tabJobs.length && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      variant="outline"
                      className="w-full max-w-[400px] border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground h-12 font-bold text-lg"
                      onClick={() => setVisibleJobs(prev => prev + 12)}
                      data-testid="button-load-more"
                    >
                      تحميل المزيد
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24 bg-muted/20 rounded-2xl border border-dashed border-border">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-6">
                  {activeTab === "closed"
                    ? <Lock className="h-10 w-10 text-gray-400/40" />
                    : <Briefcase className="h-10 w-10 text-primary/40" />
                  }
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {urlSearchQuery
                    ? `لا توجد نتائج لـ "${urlSearchQuery}"`
                    : activeTab === "closed"
                      ? "لا توجد وظائف مغلقة"
                      : "لا يوجد وظائف في هذا التصنيف"
                  }
                </h3>
                <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                  {urlSearchQuery
                    ? "جرّب كلمة بحث مختلفة أو تصفح الأقسام الأخرى"
                    : activeTab === "closed"
                      ? "لا توجد وظائف مغلقة حالياً في هذا التصنيف"
                      : "نعتذر، لا توجد إعلانات وظيفية متاحة حالياً. يمكنك العودة لاحقاً أو تصفح الأقسام الأخرى."
                  }
                </p>
                {urlSearchQuery ? (
                  <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10" onClick={clearSearch}>
                    مسح البحث
                  </Button>
                ) : (
                  <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/10" onClick={() => setLocation("/jobs")}>
                    تصفح كل الوظائف
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
