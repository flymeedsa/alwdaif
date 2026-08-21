import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { Link } from "wouter";
import {
  Briefcase,
  Building2,
  FolderOpen,
  Flag,
  ArrowLeft,
  Plus,
  FileText,
  Info,
  UserCheck,
  ClipboardCheck,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminJobsHub() {
  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/jobs");
      return res.json();
    },
  });

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/organizations"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/organizations");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: reports = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/job-reports"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/job-reports");
      return res.json();
    },
  });

  const { data: employerReports = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/employer-job-reports"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/employer-job-reports");
      return res.json();
    },
  });

  const { data: employerJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/employer-jobs", "published"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/employer-jobs?status=published");
      return res.json();
    },
  });

  const { data: pendingEmployerJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/employer-jobs", "pending"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/employer-jobs?status=pending");
      return res.json();
    },
  });

  const { data: results = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/results"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/results");
      return res.json();
    },
  });

  const allReports = [
    ...(Array.isArray(reports) ? reports : []),
    ...(Array.isArray(employerReports) ? employerReports : []),
  ];
  const pendingReports = allReports.filter((r: any) => r.status === "pending").length;

  const latestPublished = (Array.isArray(jobs) ? jobs : [])
    .filter((j: any) => j.status === "published")
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const latestEmployerPublished = (Array.isArray(employerJobs) ? employerJobs : [])
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const latestResults = (Array.isArray(results) ? results : [])
    .filter((r: any) => r.status === "published")
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const cards = [
    {
      title: "الوظائف الحكومية والشركات الكبرى",
      description: "إدارة جميع إعلانات الوظائف المنشورة",
      icon: Briefcase,
      count: Array.isArray(jobs) ? jobs.length : 0,
      href: "/admin/jobs-hub/jobs",
      gradient: "from-blue-500 to-blue-600",
      badge: null,
    },
    {
      title: "وظائف أصحاب العمل",
      description: "مراجعة ونشر الإعلانات المُضافة من أصحاب العمل",
      icon: UserCheck,
      count: Array.isArray(employerJobs) ? employerJobs.length : 0,
      href: "/admin/jobs-hub/employer-jobs",
      gradient: "from-violet-500 to-violet-600",
      badge: Array.isArray(pendingEmployerJobs) && pendingEmployerJobs.length > 0 ? pendingEmployerJobs.length : null,
    },
    {
      title: "نتائج التوظيف",
      description: "إدارة إعلانات نتائج القبول والتعيين والتجنيد",
      icon: ClipboardCheck,
      count: Array.isArray(results) ? results.length : 0,
      href: "/admin/jobs-hub/results",
      gradient: "from-amber-500 to-amber-600",
      badge: null,
    },
    {
      title: "التصنيفات",
      description: "إدارة تصنيفات وأقسام الوظائف",
      icon: FolderOpen,
      count: Array.isArray(categories) ? categories.length : 0,
      href: "/admin/jobs-hub/categories",
      gradient: "from-orange-500 to-orange-600",
      badge: null,
    },
    {
      title: "الجهات",
      description: "إدارة الجهات والمنظمات المُعلِنة",
      icon: Building2,
      count: Array.isArray(organizations) ? organizations.length : 0,
      href: "/admin/jobs-hub/organizations",
      gradient: "from-green-500 to-green-600",
      badge: null,
    },
    {
      title: "بلاغات الوظائف",
      description: "مراجعة البلاغات المُرسلة على الإعلانات الوظيفية",
      icon: Flag,
      count: allReports.length,
      href: "/admin/jobs-hub/reports",
      gradient: "from-rose-500 to-rose-600",
      badge: pendingReports > 0 ? pendingReports : null,
    },
  ];

  return (
    <AdminLayout title="إدارة الوظائف">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">إدارة الوظائف</h1>
            <p className="text-gray-500 dark:text-gray-400">
              إدارة جميع جوانب الإعلانات الوظيفية
            </p>
          </div>
          <div className="mr-auto">
            <Link href="/admin/jobs-hub/jobs/new">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium" data-testid="button-add-job">
                <Plus className="h-4 w-4" />
                أضف وظيفة جديدة
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 overflow-hidden group"
                data-testid={`card-jobs-${card.href.split("/").pop()}`}
              >
                <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="relative">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-white`}
                      >
                        <card.icon className="h-6 w-6" />
                      </div>
                      {card.badge !== null && (
                        <Badge className="absolute -top-2 -left-2 h-5 min-w-5 px-1 text-xs bg-red-500 text-white border-0">
                          {card.badge}
                        </Badge>
                      )}
                    </div>
                    <span
                      className="text-3xl font-bold text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors"
                      data-testid={`text-count-${card.href.split("/").pop()}`}
                    >
                      {card.count}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* آخر 5 وظائف منشورة */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <FileText className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-base">آخر الوظائف المنشورة</CardTitle>
                  {latestPublished.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      أحدث {latestPublished.length} وظيفة منشورة
                    </p>
                  )}
                </div>
              </div>
              <Link href="/admin/jobs-hub/jobs">
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  عرض الكل
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-7 7 7 7"/><path d="M19 12H5"/></svg>
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {latestPublished.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Info className="h-8 w-8 opacity-30" />
                <p className="text-sm">لا توجد وظائف منشورة حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestPublished.map((job: any) => {
                  const orgLogo = job.organization?.logo || job.logo;
                  const orgName = job.organization?.name || job.organizationName || job.company;
                  return (
                    <div key={job.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* شعار الجهة */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                          {orgLogo ? (
                            <img src={orgLogo} alt={orgName || ""} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{job.title}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {orgName && <span className="text-xs text-muted-foreground">{orgName}</span>}
                            {job.city && (
                              <>
                                <span className="text-muted-foreground/40 text-xs">·</span>
                                <span className="text-xs text-muted-foreground">{job.city}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                        <span className="text-xs text-muted-foreground hidden sm:block ml-3">
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString("ar-SA") : ""}
                        </span>
                        <Link href={`/jobs/post/${job.id}`}>
                          <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="عرض">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </Link>
                        <Link href={`/admin/jobs-hub/jobs/edit/${job.id}${job.category === "results" ? "?isResult=true" : ""}`}>
                          <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="تعديل">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        {/* آخر 5 نتائج توظيف منشورة */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <ClipboardCheck className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-base">آخر نتائج التوظيف المنشورة</CardTitle>
                  {latestResults.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      أحدث {latestResults.length} إعلان نتيجة منشور
                    </p>
                  )}
                </div>
              </div>
              <Link href="/admin/jobs-hub/results">
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  إدارة الكل
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-7 7 7 7"/><path d="M19 12H5"/></svg>
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {latestResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Info className="h-8 w-8 opacity-30" />
                <p className="text-sm">لا توجد نتائج منشورة حالياً</p>
                <Link href="/admin/jobs-hub/results">
                  <button className="mt-1 text-xs text-primary hover:underline">أضف أول نتيجة</button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestResults.map((result: any) => (
                  <div key={result.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-amber-500/20 bg-amber-500/10 flex items-center justify-center">
                        <ClipboardCheck className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{result.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">{result.org}</span>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-amber-600 dark:text-amber-400">{result.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                      <span className="text-xs text-muted-foreground hidden sm:block ml-3">
                        {result.date}
                      </span>
                      <Link href="/admin/jobs-hub/results">
                        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="إدارة النتائج">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* آخر 5 وظائف أصحاب العمل المنشورة */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <UserCheck className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <CardTitle className="text-base">آخر وظائف أصحاب العمل</CardTitle>
                  {latestEmployerPublished.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      أحدث {latestEmployerPublished.length} وظيفة منشورة من أصحاب العمل
                    </p>
                  )}
                </div>
              </div>
              <Link href="/admin/jobs-hub/employer-jobs">
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  عرض الكل
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-7 7 7 7"/><path d="M19 12H5"/></svg>
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {latestEmployerPublished.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Info className="h-8 w-8 opacity-30" />
                <p className="text-sm">لا توجد وظائف منشورة من أصحاب العمل حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestEmployerPublished.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{job.title}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {job.company && <span className="text-xs text-muted-foreground">{job.company}</span>}
                          {job.region && job.region !== "كل المدن" && (
                            <>
                              <span className="text-muted-foreground/40 text-xs">·</span>
                              <span className="text-xs text-muted-foreground">{job.region}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                      <span className="text-xs text-muted-foreground hidden sm:block ml-3">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString("ar-SA") : ""}
                      </span>
                      <Link href={`/jobs/employer/${job.id}`}>
                        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="عرض">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
