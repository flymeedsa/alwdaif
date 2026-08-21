import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Briefcase, Eye, Search, RotateCcw, ChevronLeft, ChevronRight, ArrowLeft, Lock, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@shared/schema";
import { cn } from "@/lib/utils";
import { isJobClosed } from "@/lib/jobUtils";
import { adminFetch } from "@/lib/adminAuth";

const PAGE_SIZE = 20;

export default function AdminJobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: () => fetch("/api/admin/jobs", { credentials: "include" }).then(r => r.json()),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      adminFetch(`/api/admin/jobs/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async r => { if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || r.status.toString()); } return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({ title: "تم التحديث", description: "تم تحديث الوظيفة بنجاح" });
    },
    onError: (err: any) => toast({ title: "خطأ", description: err?.message || "فشل في تحديث الوظيفة", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      adminFetch(`/api/admin/jobs/${id}`, { method: "DELETE" })
        .then(r => { if (!r.ok) throw new Error(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      toast({ title: "تم الحذف", description: "تم حذف الوظيفة نهائياً" });
    },
    onError: () => toast({ title: "خطأ", description: "فشل في حذف الوظيفة", variant: "destructive" }),
  });

  const categoryLabels: Record<string, string> = {
    civil: "مدنية", military: "عسكرية", companies: "شركات", company: "شركات", results: "نتائج التوظيف",
  };

  const statusConfig: Record<string, { label: string; cls: string }> = {
    published: { label: "منشور", cls: "bg-green-500/15 text-green-500 border-green-500/25" },
    draft:     { label: "مسودة", cls: "bg-amber-500/15 text-amber-500 border-amber-500/25" },
    trash:     { label: "محذوف", cls: "bg-red-500/15 text-red-500 border-red-500/25" },
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesTab =
      activeTab === "all"      ? true :
      activeTab === "open"     ? job.status === "published" && !isJobClosed(job) :
      activeTab === "closed"   ? job.status === "published" && isJobClosed(job) :
      job.status === activeTab;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedJobs = filteredJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const publishedJobs = jobs.filter(j => j.status === "published");
  const counts = {
    all:       jobs.length,
    open:      publishedJobs.filter(j => !isJobClosed(j)).length,
    closed:    publishedJobs.filter(j => isJobClosed(j)).length,
    published: publishedJobs.length,
    draft:     jobs.filter(j => j.status === "draft").length,
    trash:     jobs.filter(j => j.status === "trash").length,
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setCurrentPage(1);
  };

  const handleSearch = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) { if (end < totalPages - 1) pages.push("..."); pages.push(totalPages); }
    return pages;
  };

  return (
    <AdminLayout title="الوظائف">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <Link href="/admin/jobs-hub">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">الوظائف</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة جميع إعلانات الوظائف المنشورة</p>
          </div>
        </div>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <Link href="/admin/jobs-hub/jobs/new">
              <Button className="h-11 px-6 shrink-0 gap-2" data-testid="button-add-job">
                <Plus className="h-4 w-4" />
                إضافة وظيفة
              </Button>
            </Link>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في الوظائف..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-11 pr-10"
                data-testid="input-search-jobs"
              />
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={handleTabChange} dir="rtl">
            <TabsList>
              <TabsTrigger value="all">الكل ({counts.all})</TabsTrigger>
              <TabsTrigger value="open" className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                مفتوحة ({counts.open})
              </TabsTrigger>
              <TabsTrigger value="closed" className="gap-1.5">
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                مغلقة ({counts.closed})
              </TabsTrigger>
              <TabsTrigger value="published">منشور ({counts.published})</TabsTrigger>
              <TabsTrigger value="draft">مسودة ({counts.draft})</TabsTrigger>
              <TabsTrigger value="trash">المهملات ({counts.trash})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-5 w-5 text-primary" />
              قائمة الوظائف ({filteredJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد وظائف</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">الجهة</TableHead>
                      <TableHead className="text-right">التصنيف</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJobs.map((job) => (
                      <TableRow key={job.id} className="h-16">
                        <TableCell className="font-medium max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {job.logo
                                ? <img src={job.logo} alt="" className="w-full h-full object-contain p-1" />
                                : <Briefcase className="h-4 w-4 text-primary" />}
                            </div>
                            <span className="truncate text-sm">{job.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{job.company}</TableCell>
                        <TableCell>
                          <span className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium border border-primary/20">
                            {categoryLabels[job.category] || job.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{job.date}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium border w-fit",
                              statusConfig[job.status]?.cls || "bg-muted text-muted-foreground"
                            )}>
                              {statusConfig[job.status]?.label || job.status}
                            </span>
                            {job.status === "published" && isJobClosed(job) && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 w-fit border border-gray-300 dark:border-gray-600">
                                <Lock className="h-2.5 w-2.5" />
                                مغلقة
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link href={`/jobs/post/${job.id}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-view-${job.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/jobs-hub/jobs/edit/${job.id}${job.category === "results" ? "?isResult=true" : ""}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-edit-${job.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            {job.status === "trash" && (
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-green-500 hover:text-green-500 hover:bg-green-500/10"
                                onClick={() => updateMutation.mutate({ id: job.id, data: { status: "draft" } })}
                                data-testid={`button-restore-${job.id}`}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (job.status === "trash") {
                                  if (confirm("هل أنت متأكد من الحذف النهائي؟")) deleteMutation.mutate(job.id);
                                } else {
                                  updateMutation.mutate({ id: job.id, data: { status: "trash" } });
                                }
                              }}
                              data-testid={`button-delete-${job.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border" dir="rtl">
                    <Button
                      variant="outline" size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage === 1}
                      data-testid="btn-prev-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    {renderPageNumbers().map((p, i) =>
                      p === "..." ? (
                        <span key={`dots-${i}`} className="text-muted-foreground px-1">...</span>
                      ) : (
                        <Button
                          key={p}
                          variant={safePage === p ? "default" : "outline"}
                          size="sm"
                          className="h-8 min-w-[2rem] px-2"
                          onClick={() => goToPage(p as number)}
                          data-testid={`btn-page-${p}`}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline" size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage === totalPages}
                      data-testid="btn-next-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
