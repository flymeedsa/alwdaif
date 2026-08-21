import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";
import {
  Search,
  Trash2,
  Edit,
  ArrowLeft,
  Pin,
  Star,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCommunityPosts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editPost, setEditPost] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: posts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/posts"]
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/community/categories"]
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/members"]
  });

  const updatePostMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/admin/community/posts/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      setEditDialogOpen(false);
      toast({ title: "تم تحديث الموضوع بنجاح" });
    }
  });

  const restorePostMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/trash/community/${id}/restore`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      toast({ title: "تم الاسترجاع", description: "تم نقل الموضوع للمنشورة" });
    }
  });

  const trashPostMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/admin/community/posts/${id}`, { status: "trash" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      toast({ title: "تم النقل إلى المهملات" });
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/community/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      toast({ title: "تم الحذف النهائي" });
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: number; isPinned: boolean }) => {
      return apiRequest("PATCH", `/api/admin/community/posts/${id}`, { isPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      toast({ title: "تم تحديث حالة التثبيت" });
    }
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: number; isFeatured: boolean }) => {
      return apiRequest("PATCH", `/api/admin/community/posts/${id}`, { isFeatured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      toast({ title: "تم تحديث حالة التميز" });
    }
  });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ id, isLocked }: { id: number; isLocked: boolean }) => {
      return apiRequest("PATCH", `/api/admin/community/posts/${id}`, { isLocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      toast({ title: "تم تحديث حالة القفل" });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/community/posts/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/posts"] });
      toast({ title: "تم تحديث الحالة" });
    }
  });

  const filteredPosts = posts.filter((post: any) => {
    const matchesTab = activeTab === "all" || post.status === activeTab;
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: posts.length,
    published: posts.filter((p: any) => p.status === "published").length,
    draft: posts.filter((p: any) => p.status === "draft").length,
    trash: posts.filter((p: any) => p.status === "trash").length,
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
  };

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    published: { label: "منشور", variant: "default" },
    draft: { label: "مسودة", variant: "secondary" },
    trash: { label: "محذوف", variant: "destructive" },
  };

  const getMemberName = (memberId: number) => {
    const member = members.find((m: any) => m.id === memberId);
    return member?.displayName || member?.username || "غير معروف";
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c: any) => c.id === categoryId);
    return category?.name || "غير مصنف";
  };

  return (
    <AdminLayout title="مواضيع المجتمع">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/community">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">مواضيع المجتمع</h1>
            <p className="text-gray-500 dark:text-gray-400">
              إدارة جميع مواضيع ومنشورات المجتمع
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث في المواضيع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
              data-testid="input-search-posts"
            />
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

        <Card>
          <CardHeader>
            <CardTitle>جميع المواضيع ({filteredPosts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">الكاتب</TableHead>
                    <TableHead className="text-right">القسم</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المشاهدات</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post: any) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {post.isPinned && <Pin className="h-4 w-4 text-blue-500" />}
                          {post.isFeatured && <Star className="h-4 w-4 text-yellow-500" />}
                          {post.isLocked && <Lock className="h-4 w-4 text-red-500" />}
                          <Link href={`/community/post/${post.id}`}>
                            <span className="font-medium hover:text-primary cursor-pointer transition-colors">
                              {post.title}
                            </span>
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>{getMemberName(post.memberId)}</TableCell>
                      <TableCell>{getCategoryName(post.categoryId)}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[post.status]?.variant || "secondary"}>
                          {statusLabels[post.status]?.label || post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{post.viewsCount || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePinMutation.mutate({ id: post.id, isPinned: !post.isPinned })}
                            title={post.isPinned ? "إلغاء التثبيت" : "تثبيت"}
                          >
                            <Pin className={`h-4 w-4 ${post.isPinned ? "text-blue-500" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFeatureMutation.mutate({ id: post.id, isFeatured: !post.isFeatured })}
                            title={post.isFeatured ? "إلغاء التميز" : "تمييز"}
                          >
                            <Star className={`h-4 w-4 ${post.isFeatured ? "text-yellow-500" : ""}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleLockMutation.mutate({ id: post.id, isLocked: !post.isLocked })}
                            title={post.isLocked ? "فتح" : "قفل"}
                          >
                            {post.isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatusMutation.mutate({ 
                              id: post.id, 
                              status: post.status === "published" ? "hidden" : "published" 
                            })}
                            title={post.status === "published" ? "إخفاء" : "نشر"}
                          >
                            {post.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditPost(post);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {post.status === "trash" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                              title="استرجاع"
                              onClick={() => restorePostMutation.mutate(post.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            title={post.status === "trash" ? "حذف نهائي" : "نقل للمهملات"}
                            onClick={() => {
                              if (post.status === "trash") {
                                if (confirm("هل أنت متأكد من الحذف النهائي؟")) {
                                  deletePostMutation.mutate(post.id);
                                }
                              } else {
                                trashPostMutation.mutate(post.id);
                              }
                            }}
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
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تعديل الموضوع</DialogTitle>
            </DialogHeader>
            {editPost && (
              <div className="space-y-4">
                <div>
                  <Label>العنوان</Label>
                  <Input
                    value={editPost.title}
                    onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>المحتوى</Label>
                  <Textarea
                    value={editPost.content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')}
                    onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                    rows={6}
                  />
                </div>
                <div>
                  <Label>القسم</Label>
                  <Select
                    value={String(editPost.categoryId)}
                    onValueChange={(value) => setEditPost({ ...editPost, categoryId: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => {
                      const rawContent = editPost.content;
                      const isHtml = /<[a-z][\s\S]*>/i.test(rawContent);
                      const content = isHtml
                        ? rawContent
                        : rawContent.split(/\n\n+/).map((p: string) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
                      updatePostMutation.mutate({ id: editPost.id, title: editPost.title, content, categoryId: editPost.categoryId });
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    حفظ التغييرات
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
