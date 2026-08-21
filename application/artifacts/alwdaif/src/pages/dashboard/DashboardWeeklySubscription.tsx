import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, BellOff, Sparkles, Calendar, Clock, CheckCircle, Newspaper, Briefcase, UserCheck, BarChart3, Users, MessageCircle, FileText, Bot } from "lucide-react";
import { apiRequest, getCommunityToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "wouter";

function authedFetch(url: string) {
  const token = getCommunityToken();
  const headers: Record<string, string> = {};
  if (token) headers["X-Community-Token"] = token;
  return fetch(url, { credentials: "include", headers }).then(r => r.json());
}

interface WeeklySummary {
  id: number;
  weekLabel: string;
  narrative: string;
  statsSnapshot: string;
  generatedAt: string;
}

export default function DashboardWeeklySubscription() {
  usePageTitle("الملخص الأسبوعي - لوحة التحكم");
  const { data: authData } = useCommunityAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: meData } = useQuery({
    queryKey: ["/api/community/me"],
    queryFn: () => authedFetch("/api/community/me"),
  });

  const memberId = meData?.member?.id;

  const { data: statusData, isLoading: statusLoading } = useQuery<{ subscribed: boolean }>({
    queryKey: ["/api/weekly-summary/subscription-status", memberId],
    queryFn: () => authedFetch("/api/weekly-summary/subscription-status"),
    enabled: !!memberId,
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["/api/weekly-summary/subscribers-count"],
    queryFn: () => fetch("/api/weekly-summary/subscribers-count").then(r => r.json()),
    staleTime: 30_000,
  });

  const { data: latestSummary } = useQuery<WeeklySummary | null>({
    queryKey: ["/api/weekly-summary/latest"],
    queryFn: () => fetch("/api/weekly-summary/latest").then(r => r.json()),
  });

  const isSubscribed = statusData?.subscribed ?? false;
  const subscribersCount = countData?.count ?? 0;

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const member = meData?.member;
      const res = await apiRequest("POST", "/api/weekly-summary/subscribe", {
        userId: String(member?.id),
        email: member?.email,
        displayName: member?.displayName || member?.username,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ["/api/weekly-summary/subscription-status", memberId],
        { subscribed: true, authenticated: true }
      );
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary/subscription-status", memberId] });
      toast({ title: "تم الاشتراك", description: "ستصلك الملخصات الأسبوعية على بريدك الإلكتروني كل جمعة" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في الاشتراك، تأكد من أن بريدك الإلكتروني مسجّل في حسابك", variant: "destructive" });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/weekly-summary/unsubscribe", { userId: String(memberId) });
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ["/api/weekly-summary/subscription-status", memberId],
        { subscribed: false, authenticated: true }
      );
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary/subscription-status", memberId] });
      toast({ title: "تم إلغاء الاشتراك", description: "لن تصلك ملخصات أسبوعية بعد الآن" });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في إلغاء الاشتراك", variant: "destructive" });
    },
  });

  const isPending = subscribeMutation.isPending || unsubscribeMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold">الملخص الأسبوعي</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">اشترك لتصلك تقارير سوق العمل كل أسبوع على بريدك</p>
        </div>

        {/* Subscription Card */}
        <Card className={`border-2 transition-colors ${isSubscribed ? "border-green-400 dark:border-green-600" : "border-border"}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${isSubscribed ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                {isSubscribed
                  ? <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  : <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold">
                    {isSubscribed ? "أنت مشترك في الملخص الأسبوعي" : "اشترك في الملخص الأسبوعي"}
                  </h2>
                  {isSubscribed && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">نشط</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {isSubscribed
                    ? `كل جمعة ستصلك رسالة بالبريد تحتوي على أبرز وظائف الأسبوع وتحليل ذكي لسوق العمل السعودي.`
                    : "اشترك ليصلك كل جمعة ملخص شامل عن سوق العمل السعودي مع أبرز الوظائف ونصائح مخصصة من الذكاء الاصطناعي."}
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    كل جمعة الساعة 1:00 ظهراً
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    مدعوم بالذكاء الاصطناعي
                  </div>
                </div>

                {statusLoading ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : isSubscribed ? (
                  <Button
                    variant="outline"
                    onClick={() => unsubscribeMutation.mutate()}
                    disabled={isPending}
                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                    data-testid="button-unsubscribe"
                  >
                    <BellOff className="h-4 w-4" />
                    {unsubscribeMutation.isPending ? "جارٍ الإلغاء..." : "إلغاء الاشتراك"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => subscribeMutation.mutate()}
                    disabled={isPending}
                    className="gap-2"
                    data-testid="button-subscribe"
                  >
                    <Mail className="h-4 w-4" />
                    {subscribeMutation.isPending ? "جارٍ الاشتراك..." : "اشترك الآن — مجاناً"}
                  </Button>
                )}

              </div>
            </div>

            {/* Subscriber count — visible to everyone */}
            {subscribersCount > 0 && (
              <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-center gap-2.5">
                <div className="flex -space-x-1.5 rtl:space-x-reverse">
                  {[...Array(Math.min(subscribersCount, 4))].map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center"
                    >
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground font-bold">
                    {subscribersCount.toLocaleString("ar-SA")}
                  </strong>
                  {" "}مشترك يستقبلون الملخص كل جمعة
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What's included */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold text-sm">ما يتضمّنه الملخص الأسبوعي:</h3>
            <ul className="space-y-2">
              {[
                { icon: Briefcase,     color: "text-blue-500",   text: "أبرز الوظائف الحكومية والشركات الأكثر مشاهدةً هذا الأسبوع" },
                { icon: UserCheck,     color: "text-orange-500", text: "وظائف أصحاب العمل — الإعلانات المقدّمة مباشرةً من الشركات" },
                { icon: BarChart3,     color: "text-green-500",  text: "مؤشرات سوق العمل: الوظيفة الأكثر تداولاً، الفئة الأنشط، الجهة الأكثر توظيفاً" },
                { icon: CheckCircle,   color: "text-primary",    text: "إحصائيات الأسبوع: إجمالي الوظائف، حكومية وشركات، وأعضاء المجتمع" },
                { icon: Users,         color: "text-purple-500", text: "أبرز مواضيع المجتمع الأكثر تفاعلاً من إعجابات وتعليقات" },
                { icon: FileText,      color: "text-violet-500", text: "أبرز المقالات المهنية الأكثر قراءةً في المدونة" },
                { icon: Bot,           color: "text-primary",    text: "نصيحة مهنية مخصصة من الذكاء الاصطناعي للباحثين عن عمل" },
              ].map(({ icon: Icon, color, text }, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                  <Icon className={`h-4 w-4 ${color} mt-0.5 shrink-0`} />
                  {text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Latest Summary Preview */}
        {latestSummary && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  آخر ملخص — {latestSummary.weekLabel}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {new Date(latestSummary.generatedAt).toLocaleDateString("ar-SA")}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                {latestSummary.narrative}
              </p>
              <div className="mt-3">
                <Link href="/weekly-summary">
                  <Button variant="outline" size="sm" className="gap-2 text-xs">
                    <Newspaper className="h-3.5 w-3.5" />
                    عرض الملخص الكامل
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
