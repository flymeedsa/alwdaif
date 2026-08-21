import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, MessageSquare, BookOpen, Calendar, User, Tag } from "lucide-react";
import { toDisplayUrl } from "@/lib/mediaUrl";
import { FEATURE_FLAGS } from "@/config/featureFlags";

export default function LatestUpdatesCard() {
  const { data: communityPosts = [] } = useQuery({
    queryKey: ["/api/community/posts/latest"],
    queryFn: async () => {
      const res = await fetch("/api/community/posts?limit=3");
      const data = await res.json();
      return Array.isArray(data) ? data.slice(0, 3) : [];
    },
    enabled: FEATURE_FLAGS.community,
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["/api/blog/latest"],
    queryFn: async () => {
      const res = await fetch("/api/blog?status=published&limit=3");
      const data = await res.json();
      return Array.isArray(data) ? data.slice(0, 3) : [];
    },
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <section className="mb-8">
      <div className="bg-card border border-border rounded-[2rem] shadow-xl overflow-hidden relative">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* ─── Community Section ─── */}
          {FEATURE_FLAGS.community && <div className="p-4 md:p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm shadow-blue-500/20 flex items-center justify-center">
                <MessageSquare className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">آخر مواضيع المجتمع</h3>
              </div>
              <Link
                href="/community"
                className="text-[10px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors bg-blue-500/10 hover:bg-blue-500/15 rounded-full px-2.5 py-1"
              >
                المزيد
                <ArrowLeft className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-1">
              {communityPosts.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">لا توجد مواضيع حالياً</p>
              )}
              {communityPosts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/community/post/${post.id}`}
                  className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-500/[0.04] border border-transparent hover:border-blue-500/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-500/5 border border-blue-200/50 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-black text-blue-500">
                      {(post.member?.name || "ع")[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground group-hover:text-blue-500 transition-colors line-clamp-1 leading-snug">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.member?.name || "عضو"}
                      </span>
                      <span className="text-border">|</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground/40 group-hover:text-blue-500 group-hover:-translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>}

          {/* Divider */}
          {FEATURE_FLAGS.community && <div className="flex items-center justify-center gap-3 px-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>}

          {/* ─── Blog Section ─── */}
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-500/20 flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-foreground">آخر المقالات</h3>
              </div>
              <Link
                href="/blog"
                className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 flex items-center gap-1 transition-colors bg-emerald-500/10 hover:bg-emerald-500/15 rounded-full px-2.5 py-1"
              >
                المزيد
                <ArrowLeft className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-1">
              {blogPosts.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">لا توجد مقالات حالياً</p>
              )}
              {blogPosts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.id}`}
                  className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-500/[0.04] border border-transparent hover:border-emerald-500/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-md overflow-hidden border border-border shrink-0 bg-muted">
                    <img
                      src={toDisplayUrl(post.image) || "https://images.unsplash.com/photo-1454165833767-131f4211593d?q=80&w=100&auto=format&fit=crop"}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-1 leading-snug">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {post.category}
                      </span>
                      <span className="text-border">|</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:-translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
