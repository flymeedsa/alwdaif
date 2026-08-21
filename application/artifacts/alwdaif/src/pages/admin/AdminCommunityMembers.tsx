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
  Ban,
  CheckCircle,
  Shield,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminCommunityMembers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editMember, setEditMember] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedPermission, setSelectedPermission] = useState("");

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/members"]
  });

  const { data: permissions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/moderator-permissions"]
  });

  const { data: moderators = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/moderators"]
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/admin/community/members/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/members"] });
      setEditDialogOpen(false);
      toast({ title: "تم تحديث العضو بنجاح" });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/community/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/members"] });
      toast({ title: "تم حذف العضو بنجاح" });
    }
  });

  const banMemberMutation = useMutation({
    mutationFn: async ({ id, isBanned }: { id: number; isBanned: boolean }) => {
      return apiRequest("PATCH", `/api/admin/community/members/${id}`, { isBanned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/members"] });
      toast({ title: "تم تحديث حالة الحظر" });
    }
  });

  const promoteMutation = useMutation({
    mutationFn: async (data: { memberId: number; permissionId: number }) => {
      return apiRequest("POST", "/api/admin/community/moderators", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/moderators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/members"] });
      setPromoteDialogOpen(false);
      setSelectedMember(null);
      setSelectedPermission("");
      toast({ title: "تم تعيين العضو كمشرف بنجاح" });
    }
  });

  const filteredMembers = members.filter((member: any) =>
    member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isModerator = (memberId: number) => {
    return moderators.some((mod: any) => mod.memberId === memberId && mod.isActive);
  };

  const handlePromote = (member: any) => {
    setSelectedMember(member);
    setPromoteDialogOpen(true);
  };

  const handlePromoteSubmit = () => {
    if (!selectedPermission) {
      toast({ title: "يرجى اختيار مستوى الصلاحيات", variant: "destructive" });
      return;
    }
    promoteMutation.mutate({
      memberId: selectedMember.id,
      permissionId: parseInt(selectedPermission)
    });
  };

  return (
    <AdminLayout title="الأعضاء">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/admin/members" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h1 className="text-2xl font-bold">الأعضاء</h1>
            <p className="text-gray-500 dark:text-gray-400">
              إدارة جميع أعضاء المنصة
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle>جميع الأعضاء ({filteredMembers.length})</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في الأعضاء..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  data-testid="input-search-members"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العضو</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">المواضيع</TableHead>
                    <TableHead className="text-right">التعليقات</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.displayName}</span>
                              {isModerator(member.id) && (
                                <Shield className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                            <span className="text-sm text-gray-500">@{member.username}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.postsCount || 0}</TableCell>
                      <TableCell>{member.commentsCount || 0}</TableCell>
                      <TableCell>
                        {member.isBanned ? (
                          <Badge variant="destructive">محظور</Badge>
                        ) : member.isVerified ? (
                          <Badge variant="default">موثق</Badge>
                        ) : (
                          <Badge variant="secondary">نشط</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!isModerator(member.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handlePromote(member)}
                              title="تعيين كمشرف"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => banMemberMutation.mutate({ 
                              id: member.id, 
                              isBanned: !member.isBanned 
                            })}
                            title={member.isBanned ? "إلغاء الحظر" : "حظر"}
                          >
                            {member.isBanned ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditMember(member);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا العضو؟")) {
                                deleteMemberMutation.mutate(member.id);
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل العضو</DialogTitle>
            </DialogHeader>
            {editMember && (
              <div className="space-y-4">
                <div>
                  <Label>اسم العرض</Label>
                  <Input
                    value={editMember.displayName}
                    onChange={(e) => setEditMember({ ...editMember, displayName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>النبذة</Label>
                  <Input
                    value={editMember.bio || ""}
                    onChange={(e) => setEditMember({ ...editMember, bio: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => updateMemberMutation.mutate(editMember)}
                    className="bg-gradient-to-r from-purple-500 to-purple-600"
                  >
                    حفظ التغييرات
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعيين كمشرف</DialogTitle>
            </DialogHeader>
            {selectedMember && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400">
                  سيتم تعيين <strong>{selectedMember.displayName}</strong> كمشرف في المجتمع.
                </p>
                <div>
                  <Label>مستوى الصلاحيات</Label>
                  <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستوى الصلاحيات" />
                    </SelectTrigger>
                    <SelectContent>
                      {permissions.map((perm: any) => (
                        <SelectItem key={perm.id} value={String(perm.id)}>
                          {perm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPromoteDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button
                    onClick={handlePromoteSubmit}
                    className="bg-gradient-to-r from-orange-500 to-orange-600"
                  >
                    تعيين كمشرف
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
