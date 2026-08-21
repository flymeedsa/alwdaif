import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { Link } from "wouter";
import { Users, Ban, ArrowLeft, User, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminMembersHub() {
  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/members"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/community/members");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const allMembers = Array.isArray(members) ? members : [];
  const total = allMembers.length;
  const banned = allMembers.filter((m: any) => m.isBanned).length;

  const latestMembers = [...allMembers]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const cards = [
    {
      title: "الأعضاء",
      description: "إدارة جميع أعضاء المنصة",
      icon: Users,
      count: total,
      href: "/admin/members/list",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "الأعضاء المحظورين",
      description: "عرض وإدارة الأعضاء المحظورين",
      icon: Ban,
      count: banned,
      href: "/admin/members/banned",
      gradient: "from-red-500 to-red-600",
    },
  ];

  return (
    <AdminLayout title="الأعضاء">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">الأعضاء</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة أعضاء المنصة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 overflow-hidden group"
                data-testid={`card-members-${card.href.split("/").pop()}`}
              >
                <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-white`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors">
                      {card.count}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* آخر الأعضاء المسجلين */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">آخر الأعضاء المسجلين</CardTitle>
                  {latestMembers.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">أحدث {latestMembers.length} عضو مسجل</p>
                  )}
                </div>
              </div>
              <Link href="/admin/members/list">
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  عرض الكل
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-7 7 7 7"/><path d="M19 12H5"/></svg>
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {latestMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Users className="h-8 w-8 opacity-30" />
                <p className="text-sm">لا يوجد أعضاء مسجلين حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestMembers.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{member.displayName || member.username}</span>
                          {member.isBanned && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4">محظور</Badge>
                          )}
                          {member.isVerified && !member.isBanned && (
                            <Badge className="text-xs px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/20">موثق</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">@{member.username}</span>
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-muted-foreground">
                            {member.createdAt ? new Date(member.createdAt).toLocaleDateString("ar-SA") : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 mr-2">
                      <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                        <span title="المواضيع">{member.postsCount || 0} موضوع</span>
                      </div>
                      <Link href="/admin/members/list">
                        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="إدارة">
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
      </div>
    </AdminLayout>
  );
}
