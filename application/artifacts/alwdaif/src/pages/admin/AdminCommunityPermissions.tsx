import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";
import { 
  Search, 
  Trash2, 
  Edit,
  ArrowLeft,
  Plus,
  Key,
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const defaultPermissions = {
  canManagePosts: false,
  canManageComments: false,
  canManageMembers: false,
  canBanMembers: false,
  canManageCategories: false,
  canPinPosts: false,
  canFeaturePosts: false,
  canLockPosts: false
};

const permissionLabels: Record<string, string> = {
  canManagePosts: "إدارة المواضيع",
  canManageComments: "إدارة التعليقات",
  canManageMembers: "إدارة الأعضاء",
  canBanMembers: "حظر الأعضاء",
  canManageCategories: "إدارة الأقسام",
  canPinPosts: "تثبيت المواضيع",
  canFeaturePosts: "تمييز المواضيع",
  canLockPosts: "قفل المواضيع"
};

export default function AdminCommunityPermissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPermission, setEditPermission] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    isActive: true,
    ...defaultPermissions
  });

  const { data: permissions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/moderator-permissions"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/community/moderator-permissions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/moderator-permissions"] });
      resetForm();
      toast({ title: "تم إضافة مستوى الصلاحيات بنجاح" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/admin/community/moderator-permissions/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/moderator-permissions"] });
      resetForm();
      toast({ title: "تم تحديث مستوى الصلاحيات بنجاح" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/community/moderator-permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/moderator-permissions"] });
      toast({ title: "تم حذف مستوى الصلاحيات بنجاح" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      isActive: true,
      ...defaultPermissions
    });
    setEditPermission(null);
    setDialogOpen(false);
  };

  const handleEdit = (permission: any) => {
    setEditPermission(permission);
    setFormData({
      name: permission.name,
      slug: permission.slug,
      description: permission.description || "",
      isActive: permission.isActive !== false,
      canManagePosts: permission.canManagePosts || false,
      canManageComments: permission.canManageComments || false,
      canManageMembers: permission.canManageMembers || false,
      canBanMembers: permission.canBanMembers || false,
      canManageCategories: permission.canManageCategories || false,
      canPinPosts: permission.canPinPosts || false,
      canFeaturePosts: permission.canFeaturePosts || false,
      canLockPosts: permission.canLockPosts || false
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "يرجى إدخال اسم مستوى الصلاحيات", variant: "destructive" });
      return;
    }
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-");
    const data = { ...formData, slug };
    
    if (editPermission) {
      updateMutation.mutate({ id: editPermission.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredPermissions = permissions.filter((perm: any) =>
    perm.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const countActivePermissions = (perm: any) => {
    return Object.keys(defaultPermissions).filter(key => perm[key]).length;
  };

  return (
    <AdminLayout title="صلاحيات المشرفين">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/community">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">صلاحيات المشرفين</h1>
            <p className="text-gray-500 dark:text-gray-400">
              تحديد مستويات صلاحيات المشرفين
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-red-500 to-red-600"
            data-testid="button-add-permission"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستوى صلاحيات
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle>مستويات الصلاحيات ({filteredPermissions.length})</CardTitle>
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
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">عدد الصلاحيات</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((perm: any) => (
                    <TableRow key={perm.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <Key className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                          <span className="font-medium">{perm.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {perm.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {countActivePermissions(perm)} / {Object.keys(defaultPermissions).length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={perm.isActive !== false ? "default" : "secondary"}>
                          {perm.isActive !== false ? "نشط" : "معطل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(perm)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف مستوى الصلاحيات هذا؟")) {
                                deleteMutation.mutate(perm.id);
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>{editPermission ? "تعديل مستوى الصلاحيات" : "إضافة مستوى صلاحيات جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>اسم المستوى</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: مشرف عام"
                  />
                </div>
                <div>
                  <Label>الرمز (slug)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="مثال: super-moderator"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر لهذا المستوى..."
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">الصلاحيات</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div 
                      key={key} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-800/50"
                    >
                      <span className="font-medium">{label}</span>
                      <Switch
                        checked={formData[key as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="font-medium">مستوى نشط</span>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-red-500 to-red-600"
                >
                  {editPermission ? "حفظ التغييرات" : "إضافة"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
