import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, BookOpen, Clock, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { BlogPost, Category } from "@shared/schema";
import { toDisplayUrl } from "@/lib/mediaUrl";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Blog() {
  usePageTitle("المدونة");
  const [visiblePosts, setVisiblePosts] = useState(10);
  const [activeCategory, setActiveCategory] = useState("الكل");

  const { data: rawCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/blog-categories"],
    queryFn: async () => {
      const res = await fetch("/api/blog-categories");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const categories = [
    "الكل",
    ...rawCategories.filter((c) => c.isActive).map((c) => c.name),
  ];

  const { data: rawPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
    queryFn: async () => {
      const res = await fetch("/api/blog");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const dbPosts = Array.isArray(rawPosts) ? rawPosts : [];

  const blogPosts = dbPosts.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt || "",
    category: p.category,
    author: p.author,
    date: p.date,
    image: p.image || undefined,
    viewCount: p.viewCount || 0,
  }));

  const filteredPosts =
    activeCategory === "الكل"
      ? blogPosts
      : blogPosts.filter((post) => post.category === activeCategory);

  const displayedPosts = filteredPosts.slice(0, visiblePosts);

  return (
    <Layout>
      <Helmet>
        <title>مدونة وظيفية | نصائح التوظيف والسيرة الذاتية | إعلانات الوظائف</title>
        <meta name="description" content="مقالات ونصائح وظيفية متخصصة في السوق السعودي: كيفية كتابة السيرة الذاتية، التحضير للمقابلات، والتسجيل في منصات التوظيف الحكومية." />
        <link rel="canonical" href="https://www.alwdaif.com/blog" />
      </Helmet>

      {/* Header */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10">
        <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
            <BookOpen className="h-4 w-4" />
            <span>مدونة إعلانات الوظائف</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-heading mb-4 text-foreground leading-tight">
            دليلك الشامل للنجاح المهني
          </h1>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setVisiblePosts(10); }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl p-6 md:p-8">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/8 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          {displayedPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayedPosts.map((post, index) => (
                <div key={post.id} className="contents">
                  <Link href={`/blog/${post.id}`} className="block h-full">
                  <div className="group bg-background border border-border hover:border-primary/30 rounded-2xl overflow-hidden transition-all cursor-pointer hover:shadow-md h-full flex flex-col">
                    <div className="relative h-40 overflow-hidden flex-shrink-0">
                      <img
                        src={toDisplayUrl(post.image) || "https://images.unsplash.com/photo-1454165833767-131f4211593d?q=80&w=800&auto=format&fit=crop"}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h2 className="text-[16px] font-bold text-foreground group-hover:text-primary transition-colors leading-relaxed mb-2">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="border-t border-border pt-4 mt-auto">
                        <div className="flex flex-wrap items-center justify-between gap-4 text-[12px] text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 font-bold">
                              {post.category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-primary" />
                              <span>{post.author}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${
                              (post.viewCount || 0) >= 500 ? "text-red-500" :
                              (post.viewCount || 0) >= 250 ? "text-orange-500" :
                              "text-muted-foreground"
                            }`}>
                              <Eye className="h-3.5 w-3.5" />
                              <span>{post.viewCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{post.date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-primary font-bold group-hover:text-foreground transition-colors">
                            <span>اقرأ المقالة</span>
                            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">لا توجد مقالات حالياً</h3>
              <p className="text-muted-foreground">نعمل على إضافة مقالات جديدة قريباً. تابعنا للحصول على آخر التحديثات.</p>
            </div>
          )}
        </div>
      </div>

      {/* Load More */}
      {visiblePosts < blogPosts.length && (
        <div className="mt-16 flex justify-center">
          <Button
            variant="outline"
            className="group relative overflow-hidden w-full max-w-[450px] border-primary/40 text-primary hover:text-primary-foreground h-14 rounded-2xl font-bold text-lg transition-all duration-500"
            onClick={() => setVisiblePosts((prev) => prev + 10)}
          >
            <span className="relative z-10 flex items-center gap-2">
              اكتشف المزيد من المقالات
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          </Button>
        </div>
      )}

    </Layout>
  );
}
