import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Search, Ban, CheckCircle, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminBannedMembers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: members = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/community/members"],
  });

  const banMutation = useMutation({
    mutationFn: async ({ id, isBanned }: { id: number; isBanned: boolean }) => {
      return apiRequest("PATCH", `/api/admin/community/members/${id}`, { isBanned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/members"] });
      toast({ title: "تم تحديث حالة الحظر" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/community/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/members"] });
      toast({ title: "تم حذف العضو" });
    },
  });

  const bannedMembers = (Array.isArray(members) ? members : [])
    .filter((m: any) => m.isBanned)
    .filter((m: any) =>
      m.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <AdminLayout title="الأعضاء المحظورين">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/admin/members" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h1 className="text-2xl font-bold">الأعضاء المحظورين</h1>
            <p className="text-gray-500 dark:text-gray-400">عرض وإدارة الأعضاء المحظورين</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle>الأعضاء المحظورين ({bannedMembers.length})</CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في الأعضاء..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : bannedMembers.length === 0 ? (
              <div className="text-center py-12">
                <Ban className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">لا يوجد أعضاء محظورين</h3>
                <p className="text-muted-foreground">القائمة فارغة حالياً</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العضو</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bannedMembers.map((member: any) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-medium">{member.displayName}</span>
                              <span className="text-sm text-gray-500 block">@{member.username}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">محظور</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => banMutation.mutate({ id: member.id, isBanned: false })}
                              title="إلغاء الحظر"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا العضو؟")) {
                                  deleteMutation.mutate(member.id);
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
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
