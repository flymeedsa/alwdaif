import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { Link } from "wouter";
import { 
  MessageSquare, 
  FolderOpen, 
  Shield, 
  Key,
  ArrowLeft,
  Flag,
  UserCheck,
  Award
} from "lucide-react";

export default function AdminCommunityHub() {
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin/community/stats"]
  });

  const { data: postsData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/community/posts"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/community/posts");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const latestPosts = (Array.isArray(postsData) ? postsData : [])
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const cards = [
    {
      title: "مواضيع المجتمع",
      description: "إدارة جميع المواضيع والمنشورات",
      icon: MessageSquare,
      count: stats?.totalPosts || 0,
      href: "/admin/community/posts",
      gradient: "from-blue-500 to-blue-600",
      badge: null,
    },
    {
      title: "أقسام المجتمع",
      description: "إدارة أقسام وتصنيفات المجتمع",
      icon: FolderOpen,
      count: stats?.totalCategories || 0,
      href: "/admin/community/categories",
      gradient: "from-green-500 to-green-600",
      badge: null,
    },
    {
      title: "مشرفين المجتمع",
      description: "إدارة المشرفين وتعيين صلاحياتهم",
      icon: Shield,
      count: stats?.totalModerators || 0,
      href: "/admin/community/moderators",
      gradient: "from-orange-500 to-orange-600",
      badge: null,
    },
    {
      title: "صلاحيات المشرفين",
      description: "تحديد صلاحيات ومستويات الإشراف",
      icon: Key,
      count: stats?.totalPermissions || 0,
      href: "/admin/community/permissions",
      gradient: "from-red-500 to-red-600",
      badge: null,
    },
    {
      title: "بلاغات المجتمع",
      description: "مراجعة البلاغات المُرسلة من الأعضاء",
      icon: Flag,
      count: stats?.totalReports || 0,
      href: "/admin/community/reports",
      gradient: "from-rose-500 to-rose-600",
      badge: stats?.pendingReports > 0 ? stats.pendingReports : null,
    },
    {
      title: "طلبات الإشراف",
      description: "مراجعة طلبات الأعضاء لإشراف الأقسام",
      icon: UserCheck,
      count: stats?.totalModeratorRequests || 0,
      href: "/admin/community/moderator-requests",
      gradient: "from-purple-500 to-purple-600",
      badge: stats?.pendingModeratorRequests > 0 ? stats.pendingModeratorRequests : null,
    },
    {
      title: "رتب الأعضاء",
      description: "إنشاء وإدارة رتب أعضاء المجتمع",
      icon: Award,
      count: null,
      href: "/admin/community/ranks",
      gradient: "from-yellow-500 to-orange-500",
      badge: null,
    },
  ];

  return (
    <AdminLayout title="إدارة المجتمع">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">إدارة المجتمع</h1>
            <p className="text-gray-500 dark:text-gray-400">
              إدارة جميع جوانب مجتمع الموقع
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 overflow-hidden group"
                data-testid={`card-community-${card.href.split('/').pop()}`}
              >
                <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="relative">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-foreground`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                      {card.badge !== null && (
                        <Badge className="absolute -top-2 -left-2 h-5 min-w-5 px-1 text-xs bg-red-500 text-white border-0">
                          {card.badge}
                        </Badge>
                      )}
                    </div>
                    <span 
                      className="text-3xl font-bold text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors"
                      data-testid={`text-count-${card.href.split('/').pop()}`}
                    >
                      {card.count}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* آخر 5 مواضيع */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">آخر المواضيع</CardTitle>
                  {latestPosts.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">أحدث {latestPosts.length} موضوع</p>
                  )}
                </div>
              </div>
              <Link href="/admin/community/posts">
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  عرض الكل
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 5-7 7 7 7"/><path d="M19 12H5"/></svg>
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {latestPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <MessageSquare className="h-8 w-8 opacity-30" />
                <p className="text-sm">لا توجد مواضيع حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestPosts.map((post: any) => (
                  <div key={post.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{post.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {post.authorName && <span className="text-xs text-muted-foreground">{post.authorName}</span>}
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-muted-foreground">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString("ar-SA") : "—"}
                          </span>
                          {post.isPinned && <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">مثبت</Badge>}
                          {post.isFeatured && <Badge className="text-xs px-1.5 py-0 h-4 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">مميز</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                      <Link href="/admin/community/posts">
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
