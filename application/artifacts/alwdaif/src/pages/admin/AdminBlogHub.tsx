import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { Link } from "wouter";
import { FileText, Folder, ArrowLeft, PenLine } from "lucide-react";

export default function AdminBlogHub() {
  const { data: postsData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/blog"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/blog");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: categoriesData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const posts = Array.isArray(postsData) ? postsData : [];
  const blogCategories = Array.isArray(categoriesData)
    ? categoriesData.filter((c: any) => c.type === "blog")
    : [];

  const latestPosts = posts
    .filter((p: any) => p.status === "published")
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const cards = [
    {
      title: "المقالات",
      description: "إضافة وتعديل وحذف مقالات المدونة",
      icon: FileText,
      count: posts.length,
      href: "/admin/blog/posts",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "تصنيفات المدونة",
      description: "إدارة تصنيفات وأقسام المدونة",
      icon: Folder,
      count: blogCategories.length,
      href: "/admin/blog/categories",
      gradient: "from-emerald-500 to-emerald-600",
    },
  ];

  return (
    <AdminLayout title="المدونة">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">المدونة</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة مقالات وتصنيفات المدونة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 overflow-hidden group"
                data-testid={`card-blog-${card.href.split("/").pop()}`}
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

        {/* آخر 5 مقالات منشورة */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <PenLine className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <CardTitle className="text-base">آخر المقالات المنشورة</CardTitle>
                  {latestPosts.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">أحدث {latestPosts.length} مقالة</p>
                  )}
                </div>
              </div>
              <Link href="/admin/blog/posts">
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
                <FileText className="h-8 w-8 opacity-30" />
                <p className="text-sm">لا توجد مقالات منشورة حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestPosts.map((post: any) => (
                  <div key={post.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                        {post.featuredImage || post.image ? (
                          <img src={post.featuredImage || post.image} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{post.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {post.author && <span className="text-xs text-muted-foreground">{post.author}</span>}
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs text-muted-foreground">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString("ar-SA") : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mr-2">
                      <Link href={`/admin/blog/edit/${post.id}`}>
                        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="تعديل">
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
