import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Edit, Award, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const emptyForm = {
  name: "",
  color: "#3b82f6",
  icon: "🏅",
  minPosts: 0,
  isActive: true,
  sortOrder: 0,
};

export default function AdminCommunityRanks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRank, setEditRank] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const { data: ranks = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/ranks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/community/ranks");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/community/ranks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/ranks"] });
      resetForm();
      toast({ title: "تم إضافة الرتبة بنجاح" });
    },
    onError: () => toast({ title: "فشل في إضافة الرتبة", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/admin/community/ranks/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/ranks"] });
      resetForm();
      toast({ title: "تم تحديث الرتبة بنجاح" });
    },
    onError: () => toast({ title: "فشل في تحديث الرتبة", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/community/ranks/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/ranks"] });
      toast({ title: "تم حذف الرتبة بنجاح" });
    },
    onError: () => toast({ title: "فشل في حذف الرتبة", variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditRank(null);
    setDialogOpen(false);
  };

  const handleEdit = (rank: any) => {
    setEditRank(rank);
    setForm({
      name: rank.name,
      color: rank.color || "#3b82f6",
      icon: rank.icon || "🏅",
      minPosts: rank.minPosts ?? 0,
      isActive: rank.isActive !== false,
      sortOrder: rank.sortOrder ?? 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: "اسم الرتبة مطلوب", variant: "destructive" });
      return;
    }
    if (editRank) {
      updateMutation.mutate({ id: editRank.id, ...form, minPosts: Number(form.minPosts), sortOrder: Number(form.sortOrder) });
    } else {
      createMutation.mutate({ ...form, minPosts: Number(form.minPosts), sortOrder: Number(form.sortOrder) });
    }
  };

  const filtered = ranks.filter((r: any) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="رتب الأعضاء">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/community">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">رتب الأعضاء</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة رتب الأعضاء وشروط الترقية</p>
          </div>
          <Button
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="bg-gradient-to-r from-yellow-500 to-orange-500"
            data-testid="button-add-rank"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة رتبة
          </Button>
        </div>

        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>كيف تعمل الرتب:</strong> إذا كان الحد الأدنى للمواضيع = 0، تُعيَّن الرتبة يدوياً فقط من لوحة إدارة الأعضاء. إذا كان أكبر من 0، يرتقي العضو إليها تلقائياً عند بلوغ العدد المحدد.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle>جميع الرتب ({filtered.length})</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الرتبة</TableHead>
                    <TableHead className="text-right">الحد الأدنى للمواضيع</TableHead>
                    <TableHead className="text-right">الترتيب</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        لا توجد رتب حتى الآن
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map((rank: any) => (
                    <TableRow key={rank.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                            style={{ backgroundColor: rank.color + "22", border: `2px solid ${rank.color}` }}
                          >
                            {rank.icon || "🏅"}
                          </div>
                          <div>
                            <span className="font-semibold" style={{ color: rank.color }}>{rank.name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rank.minPosts === 0 ? (
                          <Badge variant="outline" className="text-muted-foreground">يدوي فقط</Badge>
                        ) : (
                          <span className="font-mono text-sm">{rank.minPosts} موضوع</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm text-muted-foreground">{rank.sortOrder ?? 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rank.isActive !== false ? "default" : "secondary"}>
                          {rank.isActive !== false ? "نشطة" : "معطلة"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(rank)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذه الرتبة؟")) deleteMutation.mutate(rank.id);
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>{editRank ? "تعديل الرتبة" : "إضافة رتبة جديدة"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>اسم الرتبة <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="مثال: عضو نشط"
                    data-testid="input-rank-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>الأيقونة (إيموجي)</Label>
                  <Input
                    value={form.icon}
                    onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                    placeholder="🏅"
                    data-testid="input-rank-icon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>لون الرتبة</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border border-border"
                      data-testid="input-rank-color"
                    />
                    <span className="text-sm font-mono text-muted-foreground">{form.color}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>معاينة</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: form.color + "22", color: form.color, border: `1px solid ${form.color}66` }}
                    >
                      {form.icon} {form.name || "اسم الرتبة"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>الحد الأدنى للمواضيع</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.minPosts}
                    onChange={e => setForm(p => ({ ...p, minPosts: parseInt(e.target.value) || 0 }))}
                    placeholder="0 = يدوي فقط"
                    data-testid="input-rank-min-posts"
                  />
                  <p className="text-xs text-muted-foreground">0 = تعيين يدوي من لوحة الأعضاء</p>
                </div>
                <div className="space-y-1.5">
                  <Label>الترتيب</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={e => setForm(p => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
                    data-testid="input-rank-sort-order"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40">
                <Label className="cursor-pointer">تفعيل الرتبة</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))}
                  data-testid="switch-rank-active"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={resetForm}>إلغاء</Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500"
                >
                  {editRank ? "حفظ التغييرات" : "إضافة"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
