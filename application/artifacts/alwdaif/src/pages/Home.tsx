import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import JobCard from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Briefcase, Users, MessageSquare, Building2, Sparkles, FileText, Linkedin, CheckCircle2, ChevronLeft, Clock, X, ArrowLeft, UserCheck, MapPin, Calendar, ClipboardCheck } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp.png";
import type { Job, Organization, Result } from "@shared/schema";
import { formatRelativeDate } from "@/lib/formatDate";
import { isJobClosed } from "@/lib/jobUtils";
import OrgActionCard from "@/components/OrgActionCard";
import MarketIndicators from "@/components/MarketIndicators";
import LatestUpdatesCard from "@/components/LatestUpdatesCard";

const RECENT_SEARCHES_KEY = "recentJobSearches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"); } catch { return []; }
}
function saveRecentSearch(term: string) {
  const recent = getRecentSearches().filter(t => t !== term);
  recent.unshift(term);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}
function removeRecentSearch(term: string) {
  const recent = getRecentSearches().filter(t => t !== term);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
}

const SEARCH_CATEGORIES = [
  { value: "all", label: "الكل" },
  { value: "civil", label: "مدنية" },
  { value: "military", label: "عسكرية" },
  { value: "companies", label: "شركات" },
];
interface JobWithOrg extends Job {
  organization?: Organization | null;
}

interface HomepageSettings {
  sections: {
    [key: string]: { enabled: boolean; order: number };
  };
  hero: {
    title: string;
    subtitle: string;
    showSearch: boolean;
  };
  stats: {
    showJobsCount: boolean;
    showOrgsCount: boolean;
    showResultsCount: boolean;
    showBlogCount: boolean;
  };
  latest_jobs: { count: number };
  featured: { count: number };
}

const DEFAULT_SETTINGS: HomepageSettings = {
  sections: {
    hero: { enabled: true, order: 1 },
    featured: { enabled: true, order: 2 },
    latest_jobs: { enabled: true, order: 3 },
    community: { enabled: false, order: 4 },
  },
  hero: {
    title: "ابحث عن وظيفتك اليوم",
    subtitle: "خيارك الأول للبحث عن الوظائف المدنية والعسكرية والشركات",
    showSearch: true,
  },
  stats: {
    showJobsCount: true,
    showOrgsCount: true,
    showResultsCount: true,
    showBlogCount: true,
  },
  latest_jobs: { count: 12 },
  featured: { count: 4 },
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/jobs/suggestions?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) setSuggestions(await res.json());
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  const { data: hpSettings } = useQuery<HomepageSettings | null>({
    queryKey: ["/api/homepage-settings"],
    queryFn: async () => {
      const res = await fetch("/api/homepage-settings");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const settings = hpSettings ?? DEFAULT_SETTINGS;

  const isSectionEnabled = (key: string) =>
    settings.sections[key]?.enabled !== false;

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<JobWithOrg[]>({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return res.json();
    },
    enabled: isSectionEnabled("latest_jobs"),
  });

  const { data: featuredJobs = [] } = useQuery<JobWithOrg[]>({
    queryKey: ["/api/jobs/featured"],
    queryFn: async () => {
      const res = await fetch("/api/jobs/featured");
      if (!res.ok) throw new Error("Failed to fetch featured jobs");
      return res.json();
    },
    enabled: isSectionEnabled("featured"),
  });

  const { data: employerJobsList = [] } = useQuery<any[]>({
    queryKey: ["/api/employer-jobs"],
    queryFn: async () => {
      const res = await fetch("/api/employer-jobs");
      if (!res.ok) throw new Error("Failed to fetch employer jobs");
      return res.json();
    },
  });

  const { data: publishedResults = [] } = useQuery<Result[]>({
    queryKey: ["/api/results"],
    queryFn: async () => {
      const res = await fetch("/api/results");
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleSearch = (term?: string) => {
    const q = (term ?? searchQuery).trim();
    if (!q) return;
    saveRecentSearch(q);
    setRecentSearches(getRecentSearches());
    setShowDropdown(false);
    const params = new URLSearchParams();
    params.set("search", q);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    setLocation(`/jobs?${params.toString()}`);
  };

  const handleQuickSearch = (term: string) => {
    const params = new URLSearchParams();
    params.set("search", term);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    setLocation(`/jobs?${params.toString()}`);
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    if (!searchQuery.trim()) {
      if (cat === "all") setLocation("/jobs");
      else setLocation(`/jobs?category=${cat}`);
    }
  };

  const latestCount = settings.latest_jobs?.count ?? 12;
  const featuredCount = settings.featured?.count ?? 4;
  const heroTitle = settings.hero?.title || "ابحث عن وظيفتك اليوم";
  const heroSubtitle = settings.hero?.subtitle || "خيارك الأول للبحث عن الوظائف المدنية والعسكرية والشركات";
  const showSearch = settings.hero?.showSearch !== false;

  return (
    <Layout>
      <Helmet>
        <title>منصة إعلانات الوظائف | وظائف حكومية وعسكرية وشركات السعودية</title>
        <meta name="description" content="ابحث عن أحدث الوظائف الحكومية والعسكرية وشركات المملكة. آلاف الفرص الوظيفية محدّثة يومياً في السعودية." />
        <link rel="canonical" href="https://www.alwdaif.com/" />
      </Helmet>
      {/* Hero Search Section */}
      {isSectionEnabled("hero") && (
        <section className="relative mb-10 -mt-4 md:mt-0 pt-6 md:pt-0">
          <div className="bg-gradient-to-b from-primary/15 to-transparent pt-8 pb-10 rounded-3xl border border-primary/10 overflow-hidden relative">
            <div className="container mx-auto px-4 relative z-10 text-center">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-heading mb-2 text-foreground">
                {heroTitle}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-xl mx-auto">
                {heroSubtitle}
              </p>

              {showSearch && (
                <div className="max-w-3xl mx-auto bg-card/60 backdrop-blur-xl border border-border/50 p-2 rounded-2xl shadow-2xl" ref={searchContainerRef}>
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                      <Input
                        placeholder="ابحث عن وظيفة..."
                        className="h-12 pr-12 rounded-xl w-full text-base"
                        dir="rtl"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          fetchSuggestions(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        data-testid="input-search-job"
                      />
                      {(showDropdown && (suggestions.length > 0 || (searchQuery.trim().length === 0 && recentSearches.length > 0))) && (
                        <div className="absolute top-full right-0 left-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                          {searchQuery.trim().length === 0 && recentSearches.length > 0 && (
                            <div>
                              <div className="px-3 py-2 text-xs font-bold text-muted-foreground border-b border-border/60 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                آخر عمليات البحث
                              </div>
                              {recentSearches.map((term) => (
                                <div key={term} className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer group" onClick={() => { setSearchQuery(term); handleSearch(term); }}>
                                  <div className="flex items-center gap-2 text-sm text-foreground">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    {term}
                                  </div>
                                  <button
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                                    onClick={(e) => { e.stopPropagation(); removeRecentSearch(term); setRecentSearches(getRecentSearches()); }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {suggestions.length > 0 && (
                            <div>
                              {recentSearches.length > 0 && searchQuery.trim().length === 0 ? null : (
                                <div className="px-3 py-2 text-xs font-bold text-muted-foreground border-b border-border/60 flex items-center gap-1.5">
                                  <Search className="h-3 w-3" />
                                  اقتراحات
                                </div>
                              )}
                              {suggestions.map((s) => (
                                <div key={s} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm" onClick={() => { setSearchQuery(s); handleSearch(s); }}>
                                  <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full md:w-auto h-12 px-8 font-bold text-base rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                      onClick={() => handleSearch()}
                      data-testid="button-search"
                    >
                      بحث
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 px-1 border-t border-border/40 pt-3">
                    <span className="text-[10px] md:text-xs text-muted-foreground font-medium">تصفية:</span>
                    {SEARCH_CATEGORIES.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => handleCategoryClick(cat.value)}
                        data-testid={`hero-category-${cat.value}`}
                        className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold border transition-all ${
                          selectedCategory === cat.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* AI Market Indicators */}
      <MarketIndicators />

      {/* Featured Jobs & Latest Jobs */}
      {(isSectionEnabled("featured") || isSectionEnabled("latest_jobs")) && (
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl p-6 md:p-8">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Featured Jobs */}
              {isSectionEnabled("featured") && featuredJobs.filter(j => !isJobClosed(j)).length > 0 && (
                <div className="mb-8 pb-8 border-b border-border">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="h-6 w-1 bg-primary rounded-full" />
                    <h2 className="text-sm md:text-xl font-bold font-heading text-foreground">وظائف مميزة</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featuredJobs.filter(j => !isJobClosed(j)).slice(0, featuredCount).map((job) => (
                      <JobCard key={job.id} job={job} variant="featured" />
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Jobs */}
              {isSectionEnabled("latest_jobs") && (
                <div>
                  <div className="flex items-center mb-6 px-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-1 bg-primary rounded-full" />
                      <h2 className="text-sm md:text-xl font-bold font-heading text-foreground">أحدث الوظائف الحكومية والشركات الكبرى</h2>
                    </div>
                  </div>

                  {jobsLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Briefcase className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">لا توجد وظائف متاحة حالياً</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jobs.filter(j => !isJobClosed(j)).slice(0, latestCount).map((job) => (
                          <JobCard key={job.id} job={job} />
                        ))}
                      </div>
                      <div className="mt-8 flex justify-center">
                        <Link href="/jobs" className="w-full max-w-[400px]">
                          <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground h-12 font-bold text-lg">
                            تصفح كل الوظائف
                          </Button>
                        </Link>
                      </div>

                      {/* Employer Jobs */}
                      {employerJobsList.length > 0 && (
                        <div className="mt-10">
                          <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-1 bg-violet-500 rounded-full" />
                              <h2 className="text-sm md:text-lg font-bold font-heading text-foreground">أحدث وظائف أصحاب العمل</h2>
                            </div>
                            <Link href="/jobs/employer">
                              <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-violet-600 border-border hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-xl text-xs h-9 px-3">
                                <UserCheck className="h-3.5 w-3.5" />
                                تصفح الكل
                              </Button>
                            </Link>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {employerJobsList.slice(0, 10).map((job: any) => {
                              const deadline = job.deadlineDate ? new Date(job.deadlineDate) : null;
                              const isClosed = deadline && deadline <= new Date();
                              return (
                                <Link key={job.id} href={`/jobs/employer/${job.id}`}>
                                  <div className="group bg-background border border-border rounded-xl p-3.5 hover:shadow-sm hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <h3 className="font-bold text-sm leading-snug line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex-1">{job.title}</h3>
                                      {isClosed && <span className="shrink-0 text-[10px] font-medium bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-2 py-0.5 rounded-full">منتهية</span>}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                      <Building2 className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{job.company}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {job.workSchedule && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                                          {job.workSchedule === "full_time" ? "دوام كامل" : "دوام جزئي"}
                                        </span>
                                      )}
                                      {job.workMode && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                          {job.workMode === "on_site" ? "حضوري" : "عن بعد"}
                                        </span>
                                      )}
                                      {job.region && job.region !== "كل المناطق" && job.region !== "كل المدن" && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                          <MapPin className="h-3 w-3" />{job.region}
                                        </span>
                                      )}
                                      {deadline && !isClosed && (
                                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mr-auto">
                                          <Calendar className="h-3 w-3" />{deadline.toLocaleDateString("ar-SA")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Employment Results */}
                      {publishedResults.length > 0 && (
                        <div className="mt-10">
                          <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-1 bg-amber-500 rounded-full" />
                              <h2 className="text-sm md:text-lg font-bold font-heading text-foreground">نتائج التوظيف</h2>
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                جديد
                              </span>
                            </div>
                            <Link href="/results">
                              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1 h-8 px-3">
                                عرض الكل
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {publishedResults.slice(0, 4).map((result) => (
                              <Link key={result.id} href="/results">
                                <div className="group bg-background border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-3.5 hover:shadow-sm hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer">
                                  <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                      <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-bold text-sm leading-snug line-clamp-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {result.title}
                                      </h3>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                        <Building2 className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{result.org}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        <span>{formatRelativeDate(result.date, result.createdAt)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                          {publishedResults.length > 4 && (
                            <div className="mt-4 flex justify-center">
                              <Link href="/results">
                                <Button variant="outline" className="gap-2 text-muted-foreground hover:text-foreground border-border hover:bg-accent rounded-xl h-11 px-6">
                                  <ClipboardCheck className="h-4 w-4" />
                                  عرض جميع النتائج ({publishedResults.length})
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Top hiring organizations */}
                      <div className="mt-10">
                        <div className="flex items-center gap-2 mb-4 px-1">
                          <div className="h-6 w-1 bg-amber-500 rounded-full" />
                          <h2 className="text-sm md:text-lg font-bold font-heading text-foreground">جهات توظيف نشطة</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Array.from(new Map(jobs.filter(j => j.organizationId || j.company).map(j => [j.organizationId || j.company, j])).entries())
                            .slice(0, 6)
                            .map(([_, job]) => (
                              <OrgActionCard
                                key={job.id}
                                org={job.organization || null}
                                jobCompany={job.company}
                                jobLogo={job.logo || null}
                                variant="compact"
                              />
                            ))}
                        </div>
                        <div className="mt-4 flex justify-center">
                          <Link href="/jobs/organizations">
                            <Button variant="outline" className="gap-2 text-muted-foreground hover:text-foreground border-border hover:bg-accent rounded-xl h-11 px-6">
                              <Building2 className="h-4 w-4" />
                              تصفح كل الجهات
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <LatestUpdatesCard />

      {/* WhatsApp + Services Promo */}
      <section className="mb-8 space-y-6">
        {/* WhatsApp Channel Card */}
        <div className="bg-gradient-to-r from-green-500/15 to-green-500/5 border border-green-500/25 rounded-2xl md:rounded-[2rem] p-5 md:p-8 shadow-md flex flex-col md:flex-row items-center gap-5 md:gap-6 group hover:border-green-500/50 transition-all duration-300">
          <div className="w-16 h-16 shrink-0 group-hover:scale-110 transition-transform duration-300">
            <img src={whatsappIcon} alt="WhatsApp" className="w-full h-full object-contain drop-shadow-lg" />
          </div>
          <div className="flex-1 text-center md:text-right">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-1">انضم لـ +9,000 مشترك في القناة الرسمية</h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">تصلك أحدث الوظائف العسكرية والمدنية والشركات فور صدورها مباشرة على جوالك.</p>
          </div>
          <a href="https://whatsapp.com/channel/0029VaDUMpy7j6g6y8FRU11S" target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Button className="h-12 px-8 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-base shadow-md shadow-green-500/20 flex items-center gap-2">
              انضم الآن مجاناً
            </Button>
          </a>
        </div>

        {/* Services Promo Card */}
        {false && <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-card shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/8 via-transparent to-blue-500/5 pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-0">
            {/* Illustration side (right in RTL) */}
            <div className="shrink-0 w-full md:w-[220px] flex items-center justify-center p-6 md:p-8">
              <div className="relative w-40 h-40 md:w-44 md:h-44">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-[spin_18s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/15 to-blue-500/10 border border-primary/20 flex items-center justify-center shadow-inner">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="absolute -top-1 right-6 w-9 h-9 rounded-xl bg-card border border-border shadow-md flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="absolute -bottom-1 right-4 w-9 h-9 rounded-xl bg-card border border-border shadow-md flex items-center justify-center">
                  <Linkedin className="w-4 h-4 text-[#0077b5]" />
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 -left-2 w-9 h-9 rounded-xl bg-card border border-border shadow-md flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 flex flex-col gap-4 p-6 md:py-8 md:px-6 text-right">
              <div className="inline-flex items-center gap-1.5 self-start bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                خدماتنا الاحترافية
              </div>

              <div>
                <h3 className="text-xl md:text-2xl font-black text-foreground mb-2 leading-snug">
                  طوّر مسيرتك المهنية<br className="hidden md:block" />
                  <span className="bg-gradient-to-l from-primary to-blue-400 bg-clip-text text-transparent"> بخطوة واحدة</span>
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                  نقدم لك حلولاً متكاملة تشمل السيرة الذاتية، التسجيل في جدارات وطاقات، وبناء ملفك على LinkedIn — كل ما تحتاجه للفوز بوظيفتك التالية.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "سيرة ذاتية ATS", icon: FileText },
                  { label: "تسجيل جدارات", icon: CheckCircle2 },
                  { label: "ملف LinkedIn", icon: Linkedin },
                ].map(({ label, icon: Icon }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-foreground/80 bg-muted border border-border px-3 py-1 rounded-full">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Link href="/store/services">
                  <Button className="h-11 px-6 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 group">
                    استكشف الخدمات
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <span className="text-xs text-muted-foreground font-medium">تبدأ من <span className="text-primary font-black">30 ر.س</span></span>
              </div>
            </div>
          </div>
        </div>}
      </section>

      {/* Community Section */}
      {false && isSectionEnabled("community") && (
        <section className="mb-16">
          <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl p-6 md:p-8">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex-1 text-center md:text-right space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                  <Users className="h-3.5 w-3.5" />
                  <span>مجتمع إعلانات الوظائف</span>
                </div>

                <h2 className="text-[18px] md:text-3xl font-black text-foreground leading-tight">
                  انضم إلى أكبر تجمع للباحثين عن عمل
                </h2>

                <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                  شارك تجاربك واستفسر عن المقابلات في بيئة داعمة وتفاعلية.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-xl">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-muted-foreground text-xs font-medium">+5,000 متصل</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 border border-border px-3 py-1.5 rounded-xl">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground text-xs font-medium">نقاشات يومية</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/community">
                    <Button className="h-12 px-8 font-black text-lg rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] group">
                      انضم للمجتمع
                      <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex-1 w-full max-w-xs relative hidden md:block">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3 pt-8">
                    <div className="bg-muted/50 backdrop-blur-md border border-border p-3 rounded-xl transform rotate-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">A</div>
                        <div className="h-1.5 w-12 bg-muted rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded" />
                    </div>
                    <div className="bg-muted/50 backdrop-blur-md border border-border p-3 rounded-xl transform -rotate-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold">M</div>
                        <div className="h-1.5 w-16 bg-muted rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted/50 backdrop-blur-md border border-border p-3 rounded-xl transform -rotate-6">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-[10px] font-bold">S</div>
                        <div className="h-1.5 w-10 bg-muted rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded" />
                    </div>
                    <div className="bg-muted/50 backdrop-blur-md border border-border p-3 rounded-xl transform rotate-2">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[10px] font-bold">K</div>
                        <div className="h-1.5 w-14 bg-muted rounded" />
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary p-4 rounded-2xl shadow-xl shadow-primary/40 text-center animate-bounce">
                  <Users className="h-6 w-6 text-primary-foreground mx-auto mb-1" />
                  <span className="block text-primary-foreground font-black text-xl">+50K</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

    </Layout>
  );
}
