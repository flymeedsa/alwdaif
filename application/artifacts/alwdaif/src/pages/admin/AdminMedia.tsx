import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Image, Upload, Trash2, Search, Copy, Check,
  FileImage, Film, File, X, RotateCcw, Building2,
  BookOpen, FolderOpen, Folder, Move, AlertTriangle
} from "lucide-react";
import type { Media } from "@shared/schema";
import { cn } from "@/lib/utils";

function toDisplayUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/objects")) return url;
  return `/api/objects${url.replace(/^\/objects/, "")}`;
}

type Tab = "organizations" | "blog" | "general" | "trash";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "organizations", label: "مكتبة الجهات",   icon: <Building2 className="h-4 w-4" /> },
  { id: "blog",          label: "مكتبة المدونة",   icon: <BookOpen className="h-4 w-4" /> },
  { id: "general",       label: "مكتبة عامة",      icon: <FolderOpen className="h-4 w-4" /> },
  { id: "trash",         label: "سلة المحذوفات",   icon: <Trash2 className="h-4 w-4" /> },
];

const CATEGORY_LABELS: Record<string, string> = {
  organizations: "مكتبة الجهات",
  blog: "مكتبة المدونة",
  general: "مكتبة عامة",
};

export default function AdminMedia() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; permanent: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isTrash = activeTab === "trash";

  const { data: mediaItems = [], isLoading } = useQuery<Media[]>({
    queryKey: ["/api/admin/media", activeTab],
    queryFn: async () => {
      const url = isTrash
        ? "/api/admin/media/trash"
        : `/api/admin/media?category=${activeTab}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch media");
      return res.json();
    },
  });

  const invalidateAll = () => {
    TABS.forEach(t => queryClient.invalidateQueries({ queryKey: ["/api/admin/media", t.id] }));
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create media");
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: "تم الرفع", description: "تم رفع الملف بنجاح" }); },
    onError: () => toast({ title: "خطأ", description: "فشل في رفع الملف", variant: "destructive" }),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, category }: { id: number; category: string }) => {
      const res = await fetch(`/api/admin/media/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to move");
      return res.json();
    },
    onSuccess: (_, { category }) => {
      invalidateAll();
      setSelectedMedia(null);
      toast({ title: "تم النقل", description: `تم نقل الصورة إلى ${CATEGORY_LABELS[category]}` });
    },
  });

  const softDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      invalidateAll();
      setSelectedMedia(null);
      setDeleteTarget(null);
      toast({ title: "تم الحذف", description: "تم نقل الملف إلى سلة المحذوفات" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/media/${id}/restore`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to restore");
    },
    onSuccess: () => {
      invalidateAll();
      setSelectedMedia(null);
      toast({ title: "تمت الاستعادة", description: "تم نقل الملف إلى المكتبة العامة" });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/media/${id}/permanent`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to permanently delete");
    },
    onSuccess: () => {
      invalidateAll();
      setSelectedMedia(null);
      setDeleteTarget(null);
      toast({ title: "تم الحذف النهائي", description: "تم حذف الملف نهائياً" });
    },
  });

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    for (const file of Array.from(files)) {
      try {
        const urlResponse = await fetch("/api/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
        });
        if (!urlResponse.ok) throw new Error("Failed to get upload URL");
        const { uploadURL, objectPath } = await urlResponse.json();
        await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        await createMutation.mutateAsync({
          name: file.name.replace(/\.[^/.]+$/, ""),
          filename: file.name,
          objectPath,
          url: objectPath,
          mimeType: file.type,
          size: file.size,
          category: isTrash ? "general" : activeTab,
        });
      } catch {
        toast({ title: "خطأ", description: `فشل في رفع ${file.name}`, variant: "destructive" });
      }
    }
    setIsUploading(false);
    e.target.value = "";
  }, [createMutation, toast, activeTab, isTrash]);

  const copyToClipboard = (item: Media) => {
    navigator.clipboard.writeText(toDisplayUrl(item.url));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "تم النسخ", description: "تم نسخ رابط الصورة" });
  };

  const getFileIcon = (mimeType?: string | null) => {
    if (!mimeType) return <File className="h-8 w-8 text-muted-foreground/70" />;
    if (mimeType.startsWith("image/")) return <FileImage className="h-8 w-8 text-blue-400" />;
    if (mimeType.startsWith("video/")) return <Film className="h-8 w-8 text-purple-400" />;
    return <File className="h-8 w-8 text-muted-foreground/70" />;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date?: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  };

  const daysLeft = (deletedAt?: Date | string | null) => {
    if (!deletedAt) return 30;
    const d = 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, d);
  };

  const filteredMedia = mediaItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="مكتبة الوسائط">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <a href="/admin/settings" className="p-2 hover:bg-muted rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">مكتبة الوسائط</h2>
            <p className="text-muted-foreground text-sm mt-0.5">رفع وإدارة الصور والملفات المستخدمة في الموقع</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.id !== "trash" && (
                <span className="text-xs bg-muted rounded-full px-1.5 py-0.5 text-muted-foreground">
                  {mediaItems.length > 0 && activeTab === tab.id ? mediaItems.length : ""}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        {activeTab === "trash" ? (
          <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>الملفات في سلة المحذوفات تُحذف تلقائياً بعد 30 يوماً من تاريخ الحذف</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
              <Input
                placeholder="بحث في الوسائط..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted/50 border-border pr-10"
              />
            </div>
            <label className="cursor-pointer">
              <input type="file" multiple accept="image/*,video/*,application/pdf" onChange={handleFileUpload} className="hidden" />
              <Button asChild disabled={isUploading} className="gap-2">
                <span><Upload className="h-4 w-4" />{isUploading ? "جاري الرفع..." : "رفع ملفات"}</span>
              </Button>
            </label>
          </div>
        )}

        {/* Grid */}
        <Card className="bg-card border-border">
          <CardContent className="pt-5">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-14">
                {isTrash
                  ? <Folder className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  : <Image className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />}
                <p className="text-muted-foreground">{isTrash ? "سلة المحذوفات فارغة" : "لا توجد ملفات في هذه المكتبة"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all border-2 border-transparent hover:border-primary/50"
                    data-testid={`media-item-${item.id}`}
                  >
                    {item.mimeType?.startsWith("image/") ? (
                      <img src={toDisplayUrl(item.url)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                        {getFileIcon(item.mimeType)}
                      </div>
                    )}
                    {isTrash && (
                      <div className="absolute top-1 right-1 bg-amber-500/90 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        {daysLeft((item as any).deletedAt)}ي
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-background/90 rounded-lg px-2 py-1 text-xs text-foreground font-medium max-w-[80%] text-center truncate">
                        {item.name}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-[10px] truncate">{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
          <DialogContent className="max-w-2xl" dir="rtl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>تفاصيل الملف</DialogTitle>
            </DialogHeader>
            {selectedMedia && (
              <div className="space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center">
                  {selectedMedia.mimeType?.startsWith("image/") ? (
                    <img src={toDisplayUrl(selectedMedia.url)} alt={selectedMedia.name} className="max-w-full max-h-full object-contain" />
                  ) : getFileIcon(selectedMedia.mimeType)}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs mb-1">الاسم</p><p className="text-foreground font-medium">{selectedMedia.name}</p></div>
                  <div><p className="text-muted-foreground text-xs mb-1">النوع</p><p className="text-foreground">{selectedMedia.mimeType || "غير معروف"}</p></div>
                  <div><p className="text-muted-foreground text-xs mb-1">الحجم</p><p className="text-foreground">{formatFileSize(selectedMedia.size)}</p></div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">التصنيف</p>
                    <p className="text-foreground">{isTrash ? "سلة المحذوفات" : CATEGORY_LABELS[(selectedMedia as any).category] || "مكتبة عامة"}</p>
                  </div>
                  {isTrash && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">يُحذف بعد</p>
                      <p className="text-amber-500 font-medium">{daysLeft((selectedMedia as any).deletedAt)} يوم</p>
                    </div>
                  )}
                  <div><p className="text-muted-foreground text-xs mb-1">تاريخ الرفع</p><p className="text-foreground">{formatDate(selectedMedia.createdAt)}</p></div>
                </div>

                {!isTrash && (
                  <>
                    <div>
                      <p className="text-muted-foreground text-xs mb-2">رابط الملف</p>
                      <div className="flex gap-2">
                        <Input value={toDisplayUrl(selectedMedia.url)} readOnly className="bg-muted/50 text-foreground text-left text-xs" dir="ltr" />
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(selectedMedia)} className="gap-1 shrink-0">
                          {copiedId === selectedMedia.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          نسخ
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-xs mb-2">نقل إلى مكتبة أخرى</p>
                      <Select
                        value={(selectedMedia as any).category || "general"}
                        onValueChange={(val) => moveMutation.mutate({ id: selectedMedia.id, category: val })}
                        disabled={moveMutation.isPending}
                      >
                        <SelectTrigger className="bg-muted/50 border-border">
                          <SelectValue placeholder="اختر المكتبة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="organizations">مكتبة الجهات</SelectItem>
                          <SelectItem value="blog">مكتبة المدونة</SelectItem>
                          <SelectItem value="general">مكتبة عامة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-1">
                  <Button variant="outline" onClick={() => setSelectedMedia(null)}>إغلاق</Button>
                  <div className="flex gap-2">
                    {isTrash ? (
                      <>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => restoreMutation.mutate(selectedMedia.id)}
                          disabled={restoreMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4" />
                          استعادة
                        </Button>
                        <Button
                          variant="destructive"
                          className="gap-2"
                          onClick={() => setDeleteTarget({ id: selectedMedia.id, permanent: true })}
                        >
                          <Trash2 className="h-4 w-4" />
                          حذف نهائي
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => setDeleteTarget({ id: selectedMedia.id, permanent: false })}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteTarget?.permanent ? "حذف نهائي" : "نقل إلى سلة المحذوفات"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.permanent
                  ? "سيتم حذف الملف نهائياً ولا يمكن استعادته. هل أنت متأكد؟"
                  : "سيتم نقل الملف إلى سلة المحذوفات وسيُحذف تلقائياً بعد 30 يوماً. يمكنك استعادته قبل ذلك."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>تراجع</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => {
                  if (!deleteTarget) return;
                  if (deleteTarget.permanent) permanentDeleteMutation.mutate(deleteTarget.id);
                  else softDeleteMutation.mutate(deleteTarget.id);
                }}
              >
                {deleteTarget?.permanent ? "حذف نهائياً" : "نعم، احذف"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
