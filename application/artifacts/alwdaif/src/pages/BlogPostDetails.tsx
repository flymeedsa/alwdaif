import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Calendar, User, Clock, ArrowRight, Share2, Bookmark, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@shared/schema";
import { formatRelativeDate } from "@/lib/formatDate";
import { toDisplayUrl } from "@/lib/mediaUrl";
import { usePageTitle } from "@/hooks/usePageTitle";
import { buildBlogPostingJsonLd } from "@/lib/structuredData";

export default function BlogPostDetails() {
  const [, rawParams] = useRoute("/blog/:id");
  const params = rawParams as { id?: string } | null;
  const postId = params?.id ? parseInt(params.id) : null;

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", postId],
    queryFn: async () => {
      const res = await fetch(`/api/blog/${postId}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: !!postId,
  });

  const { data: relatedPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/related", postId, post?.category],
    queryFn: async () => {
      const res = await fetch(`/api/blog?status=published&limit=50`);
      if (!res.ok) return [];
      const all: BlogPost[] = await res.json();
      const others = all.filter((p) => p.id !== postId && p.status === "published");
      const sameCategory = others.filter((p) => p.category === post?.category);
      const combined = [
        ...sameCategory,
        ...others.filter((p) => p.category !== post?.category),
      ];
      return combined.slice(0, 3);
    },
    enabled: !!postId && !!post,
  });

  usePageTitle(post?.title || "المقالة");

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-2xl text-foreground font-bold">المقال غير موجود</h1>
          <Button className="mt-4" onClick={() => window.history.back()}>العودة للمدونة</Button>
        </div>
      </Layout>
    );
  }

  const formattedDate = formatRelativeDate(post.date, post.createdAt);

  const postJsonLd = buildBlogPostingJsonLd({
    id: post.id,
    title: post.title,
    author: post.author,
    excerpt: post.excerpt,
    image: toDisplayUrl(post.image) || undefined,
    date: post.date,
    createdAt: post.createdAt,
    category: post.category,
    pageUrl: `https://www.alwdaif.com/blog/${post.slug || post.id}`,
  });

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | مدونة إعلانات الوظائف</title>
        <meta name="description" content={post.excerpt || `اقرأ مقالة: ${post.title} — نصائح وإرشادات وظيفية متخصصة.`} />
        <link rel="canonical" href={`https://www.alwdaif.com/blog/${post.slug || post.id}`} />
        <script type="application/ld+json">{JSON.stringify(postJsonLd)}</script>
      </Helmet>
      <div className="max-w-[1115px] mx-auto">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 font-bold"
        >
          <ArrowRight className="h-5 w-5" />
          <span>العودة للمدونة</span>
        </button>

        {/* Post Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-4 py-1.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-sm shadow-primary/20">
              {post.category}
            </span>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>5 دقائق قراءة</span>
            </div>
          </div>

          <h1 className="text-xl md:text-[28px] font-bold text-foreground leading-tight mb-5 md:mb-8">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-foreground font-bold">{post.author}</div>
                <div className="text-muted-foreground text-sm flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${
                    (post.viewCount || 0) >= 500 ? "text-red-500" :
                    (post.viewCount || 0) >= 250 ? "text-orange-500" :
                    "text-muted-foreground"
                  }`}>
                    <Eye className="h-3 w-3" />
                    <span>{post.viewCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-xl text-muted-foreground hover:text-primary">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-xl text-muted-foreground hover:text-primary">
                <Bookmark className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        <div className="relative h-[200px] md:h-[500px] rounded-2xl md:rounded-[2.5rem] overflow-hidden mb-8 md:mb-12 border border-border shadow-lg">
          <img
            src={toDisplayUrl(post.image) || "https://images.unsplash.com/photo-1454165833767-131f4211593d?q=80&w=1200&auto=format&fit=crop"}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Post Content */}
        <div className="bg-card border border-border rounded-2xl md:rounded-[2rem] p-5 md:p-12 shadow-sm mb-8 md:mb-10">
          <div className="prose dark:prose-invert max-w-none">
            {post.excerpt && (
              <div className="bg-primary/5 border border-primary/15 rounded-xl md:rounded-[1.5rem] p-4 md:p-8 mb-6 md:mb-8">
                <p className="font-bold text-foreground text-base md:text-xl leading-loose">
                  {post.excerpt}
                </p>
              </div>
            )}
            <div
              className="text-foreground/80 leading-loose text-sm md:text-base"
              dangerouslySetInnerHTML={{ __html: post.content || "" }}
            />
          </div>
        </div>

        {/* Source */}
        {post.source && (
          <div className="mb-10 p-4 md:p-6 bg-muted/40 border border-border/50 rounded-2xl flex items-center gap-3">
            <span className="text-sm font-bold text-muted-foreground shrink-0">المصدر:</span>
            <span className="text-sm text-foreground font-medium">{post.source}</span>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full" />
              مقالات ذات صلة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map(rp => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.id}`}
                  className="group block bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors shadow-sm"
                >
                  <div className="h-36 overflow-hidden">
                    <img
                      src={toDisplayUrl(rp.image) || "https://images.unsplash.com/photo-1454165833767-131f4211593d?q=80&w=600&auto=format&fit=crop"}
                      alt={rp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                      {rp.category}
                    </span>
                    <h3 className="text-sm font-bold text-foreground mt-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {rp.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatRelativeDate(rp.date, rp.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="text-center pt-4">
          <Button
            className="rounded-2xl px-8 md:px-10 h-12 md:h-14 font-bold text-base md:text-lg"
            onClick={() => window.history.back()}
          >
            العودة للمدونة
          </Button>
        </div>
      </div>
    </Layout>
  );
}
