import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Search, FileText, RotateCcw } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function AdminBlog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blog", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/trash/blogs/${id}/restore`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to restore");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "تم الاسترجاع", description: "تم نقل المقالة للمسودة" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل استرجاع المقالة", variant: "destructive" });
    },
  });

  const trashMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "trash" }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to trash");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "تم النقل إلى المهملات" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل نقل المقالة للمهملات", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog"] });
      toast({ title: "تم الحذف النهائي", description: "تم حذف المقالة نهائياً" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حذف المقالة", variant: "destructive" });
    },
  });

  const filteredPosts = posts.filter((post) => {
    const matchesTab = activeTab === "all" || post.status === activeTab;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: posts.length,
    published: posts.filter(p => p.status === "published").length,
    draft: posts.filter(p => p.status === "draft").length,
    trash: posts.filter(p => p.status === "trash").length,
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    published: { label: "منشور", class: "bg-green-500/20 text-green-400" },
    draft: { label: "مسودة", class: "bg-yellow-500/20 text-yellow-400" },
    trash: { label: "محذوف", class: "bg-red-500/20 text-red-400" },
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
  };

  return (
    <AdminLayout title="المقالات">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/admin/blog" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">المقالات</h2>
            <p className="text-muted-foreground text-sm mt-0.5">إضافة وتعديل وحذف مقالات المدونة</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Link href="/admin/blog/new">
            <Button className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold shadow-xl shadow-primary/20 gap-2 transition-all hover:shadow-primary/30 active:scale-[0.98] text-base rounded-xl" data-testid="button-add-post">
              <Plus className="h-5 w-5" />
              إضافة مقالة جديدة
            </Button>
          </Link>
          <div className="flex flex-1 gap-4 justify-end">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
              <Input
                placeholder="بحث في المقالات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 bg-muted/50 border-border text-foreground pr-11 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all text-base rounded-xl"
                data-testid="input-search-posts"
              />
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={handleTabChange} dir="rtl">
            <TabsList className="text-foreground">
              <TabsTrigger value="all">الكل ({counts.all})</TabsTrigger>
              <TabsTrigger value="published">منشور ({counts.published})</TabsTrigger>
              <TabsTrigger value="draft">مسودة ({counts.draft})</TabsTrigger>
              <TabsTrigger value="trash">المهملات ({counts.trash})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              قائمة المقالات ({filteredPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد مقالات</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-right text-base">العنوان</TableHead>
                      <TableHead className="text-muted-foreground text-right text-base">القسم</TableHead>
                      <TableHead className="text-muted-foreground text-right text-base">الكاتب</TableHead>
                      <TableHead className="text-muted-foreground text-right text-base">التاريخ</TableHead>
                      <TableHead className="text-muted-foreground text-right text-base">الحالة</TableHead>
                      <TableHead className="text-muted-foreground text-right text-base">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => (
                      <TableRow key={post.id} className="border-border hover:bg-muted h-16">
                        <TableCell className="text-foreground font-medium max-w-xs truncate text-base">{post.title}</TableCell>
                        <TableCell className="text-muted-foreground text-base">{post.category}</TableCell>
                        <TableCell className="text-muted-foreground text-base">{post.author}</TableCell>
                        <TableCell className="text-muted-foreground text-base">{post.date}</TableCell>
                        <TableCell className="text-base">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium",
                            statusLabels[post.status]?.class || "bg-gray-500/20 text-gray-400"
                          )}>
                            {statusLabels[post.status]?.label || post.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/blog/${post.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                data-testid={`button-view-${post.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/admin/blog/edit/${post.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                data-testid={`button-edit-${post.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            {post.status === "trash" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => restoreMutation.mutate(post.id)}
                                className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                data-testid={`button-restore-${post.id}`}
                                title="استرجاع"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (post.status === "trash") {
                                  if (confirm("هل أنت متأكد من الحذف النهائي؟")) deleteMutation.mutate(post.id);
                                } else {
                                  trashMutation.mutate(post.id);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              data-testid={`button-delete-${post.id}`}
                              title={post.status === "trash" ? "حذف نهائي" : "نقل للمهملات"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
