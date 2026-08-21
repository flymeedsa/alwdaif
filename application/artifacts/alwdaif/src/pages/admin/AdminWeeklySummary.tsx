import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Mail, Users, RefreshCw, ArrowLeft, Calendar, Newspaper,
  CheckCircle, Clock, ChevronDown, ChevronUp, Eye
} from "lucide-react";

interface Subscriber {
  id: number;
  userId: string;
  email: string;
  displayName: string | null;
  subscribedAt: string;
  isActive: boolean;
}

interface WeeklySummary {
  id: number;
  weekLabel: string;
  narrative: string;
  statsSnapshot: string;
  aiAdvice: string;
  generatedAt: string;
  topJobsData: string | null;
}

export default function AdminWeeklySummary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedSummary, setExpandedSummary] = useState<number | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  const { data: subscribers = [], isLoading: loadingSubscribers } = useQuery<Subscriber[]>({
    queryKey: ["/api/admin/weekly-summary/subscribers"],
    queryFn: () => fetch("/api/admin/weekly-summary/subscribers", { credentials: "include" }).then(r => r.json()),
  });

  const { data: summaries = [], isLoading: loadingSummaries } = useQuery<WeeklySummary[]>({
    queryKey: ["/api/weekly-summary/all"],
    queryFn: () => fetch("/api/weekly-summary/all").then(r => r.json()),
  });

  const generateMutation = useMutation<any, Error, boolean>({
    mutationFn: (replace = false) =>
      fetch("/api/admin/weekly-summary/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace }),
      }).then(async r => {
        if (r.status === 409) {
          const data = await r.json();
          if (data.conflict) throw Object.assign(new Error("conflict"), { conflict: true });
        }
        if (!r.ok) throw new Error("فشل التوليد");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary/all"] });
      toast({ title: "تم التوليد", description: "تم توليد الملخص الأسبوعي بنجاح" });
    },
    onError: (err: any) => {
      if (err.conflict) {
        setShowReplaceDialog(true);
      } else {
        toast({ title: "خطأ", description: "فشل في توليد الملخص", variant: "destructive" });
      }
    },
  });

  const activeCount = subscribers.filter(s => s.isActive).length;

  return (
    <AdminLayout title="الملخص الأسبوعي">
      <div className="space-y-6" dir="rtl">

        <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>يوجد ملخص لهذا اليوم</AlertDialogTitle>
              <AlertDialogDescription>
                تم توليد ملخص أسبوعي اليوم بالفعل. هل تريد استبداله بملخص جديد؟ سيُحذف الملخص الحالي نهائياً.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowReplaceDialog(false);
                  generateMutation.mutate(true);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                استبدال
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">الملخص الأسبوعي</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة المشتركين وتوليد الملخصات</p>
          </div>
          <Button
            onClick={() => generateMutation.mutate(false)}
            disabled={generateMutation.isPending}
            className="gap-2"
            data-testid="button-generate-summary"
          >
            <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
            {generateMutation.isPending ? "جارٍ التوليد..." : "توليد ملخص جديد"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إجمالي المشتركين</p>
                <p className="text-2xl font-bold">{loadingSubscribers ? "..." : activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">إيميلات نشطة</p>
                <p className="text-2xl font-bold">{loadingSubscribers ? "..." : activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Newspaper className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ملخصات مولّدة</p>
                <p className="text-2xl font-bold">{loadingSummaries ? "..." : summaries.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscribers List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                المشتركون في الملخص الأسبوعي
                {activeCount > 0 && (
                  <Badge variant="secondary">{activeCount}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubscribers ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : subscribers.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>لا يوجد مشتركون حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {subscribers.map(sub => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      data-testid={`row-subscriber-${sub.id}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(sub.displayName || sub.email).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sub.displayName || "—"}</p>
                        <p className="text-xs text-gray-500 truncate">{sub.email}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                        <Calendar className="h-3 w-3" />
                        {new Date(sub.subscribedAt).toLocaleDateString("ar-SA")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Summaries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                الملخصات السابقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSummaries ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : summaries.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>لا توجد ملخصات بعد</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {summaries.map((s, i) => (
                    <div key={s.id} className="rounded-lg border border-border overflow-hidden" data-testid={`card-summary-${s.id}`}>
                      <button
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-right"
                        onClick={() => setExpandedSummary(expandedSummary === s.id ? null : s.id)}
                      >
                        {i === 0 && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs shrink-0">أحدث</Badge>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.weekLabel}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(s.generatedAt).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link href="/weekly-summary">
                            <span className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" onClick={e => e.stopPropagation()}>
                              <Eye className="h-3.5 w-3.5" />
                            </span>
                          </Link>
                          {expandedSummary === s.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                        </div>
                      </button>
                      {expandedSummary === s.id && (
                        <div className="px-4 pb-4 border-t border-border bg-gray-50/50 dark:bg-gray-800/20">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-3 line-clamp-4">{s.narrative}</p>
                          {s.statsSnapshot && (
                            <div className="mt-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                              <p className="text-xs text-blue-700 dark:text-blue-300">{s.statsSnapshot}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-semibold">جدول الإرسال التلقائي</p>
              <p>يُولَّد الملخص الأسبوعي تلقائياً كل <strong>جمعة الساعة 1:00 ظهراً</strong> ويُرسَل بالإيميل لجميع المشتركين.</p>
              <p>يمكنك أيضاً توليد ملخص يدوياً في أي وقت بالضغط على زر "توليد ملخص جديد".</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
