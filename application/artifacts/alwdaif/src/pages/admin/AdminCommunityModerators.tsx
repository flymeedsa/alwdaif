import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Shield,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCommunityModerators() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editModerator, setEditModerator] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: moderators = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/moderators"]
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/members"]
  });

  const { data: permissions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/moderator-permissions"]
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/community/categories"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/community/moderators", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/moderators"] });
      resetForm();
      toast({ title: "تم إضافة المشرف بنجاح" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/admin/community/moderators/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/moderators"] });
      resetForm();
      toast({ title: "تم تحديث المشرف بنجاح" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/community/moderators/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/moderators"] });
      toast({ title: "تم إزالة المشرف بنجاح" });
    }
  });

  const resetForm = () => {
    setSelectedMember("");
    setSelectedPermission("");
    setSelectedCategory("");
    setEditModerator(null);
    setDialogOpen(false);
  };

  const handleEdit = (moderator: any) => {
    setEditModerator(moderator);
    setSelectedMember(String(moderator.memberId));
    setSelectedPermission(String(moderator.permissionId || ""));
    setSelectedCategory(moderator.categoryId ? String(moderator.categoryId) : "");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!editModerator && !selectedMember) {
      toast({ title: "يرجى اختيار عضو", variant: "destructive" });
      return;
    }
    if (!selectedPermission) {
      toast({ title: "يرجى اختيار الصلاحيات", variant: "destructive" });
      return;
    }
    const categoryId = selectedCategory ? parseInt(selectedCategory) : null;
    if (editModerator) {
      updateMutation.mutate({
        id: editModerator.id,
        permissionId: parseInt(selectedPermission),
        categoryId
      });
    } else {
      createMutation.mutate({
        memberId: parseInt(selectedMember),
        permissionId: parseInt(selectedPermission),
        categoryId
      });
    }
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "جميع الأقسام";
    return (categories as any[]).find((c: any) => c.id === categoryId)?.name || "غير محدد";
  };

  const getMember = (memberId: number) => {
    return members.find((m: any) => m.id === memberId);
  };

  const getPermission = (permissionId: number) => {
    return permissions.find((p: any) => p.id === permissionId);
  };

  const nonModeratorMembers = members.filter(
    (m: any) => !moderators.some((mod: any) => mod.memberId === m.id)
  );

  const filteredModerators = moderators.filter((mod: any) => {
    const member = getMember(mod.memberId);
    return member?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AdminLayout title="مشرفين المجتمع">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/community">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">مشرفين المجتمع</h1>
            <p className="text-gray-500 dark:text-gray-400">
              إدارة مشرفين المجتمع وصلاحياتهم
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-orange-500 to-orange-600"
            data-testid="button-add-moderator"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مشرف
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle>جميع المشرفين ({filteredModerators.length})</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في المشرفين..."
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
                    <TableHead className="text-right">المشرف</TableHead>
                    <TableHead className="text-right">نطاق الإشراف</TableHead>
                    <TableHead className="text-right">مستوى الصلاحيات</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ التعيين</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModerators.map((moderator: any) => {
                    const member = getMember(moderator.memberId);
                    const permission = getPermission(moderator.permissionId);
                    return (
                      <TableRow key={moderator.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member?.avatar} />
                              <AvatarFallback>
                                <User className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{member?.displayName || "غير معروف"}</span>
                                <Shield className="h-4 w-4 text-orange-500" />
                              </div>
                              <span className="text-sm text-gray-500">@{member?.username || "unknown"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {getCategoryName(moderator.categoryId)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {permission?.name || "غير محدد"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={moderator.isActive !== false ? "default" : "secondary"}>
                            {moderator.isActive !== false ? "نشط" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {moderator.createdAt ? new Date(moderator.createdAt).toLocaleDateString("ar-SA") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(moderator)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من إزالة هذا المشرف؟")) {
                                  deleteMutation.mutate(moderator.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editModerator ? "تعديل المشرف" : "إضافة مشرف جديد"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!editModerator && (
                <div>
                  <Label>اختر العضو</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عضو ليصبح مشرفاً" />
                    </SelectTrigger>
                    <SelectContent>
                      {nonModeratorMembers.map((member: any) => (
                        <SelectItem key={member.id} value={String(member.id)}>
                          {member.displayName} (@{member.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>مستوى الصلاحيات</Label>
                <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستوى الصلاحيات" />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions.map((perm: any) => (
                      <SelectItem key={perm.id} value={String(perm.id)}>
                        <div className="flex flex-col">
                          <span>{perm.name}</span>
                          {perm.description && (
                            <span className="text-xs text-gray-500">{perm.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نطاق الإشراف</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الأقسام (مشرف عام)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الأقسام (مشرف عام)</SelectItem>
                    {(categories as any[]).map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">اتركه فارغاً لمنح صلاحية الإشراف على جميع الأقسام</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-orange-500 to-orange-600"
                >
                  {editModerator ? "حفظ التغييرات" : "إضافة"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
