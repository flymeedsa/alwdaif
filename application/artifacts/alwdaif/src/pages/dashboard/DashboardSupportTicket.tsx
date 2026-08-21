import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { getCommunityToken } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  HeadphonesIcon, ChevronRight, CheckCircle, AlertCircle,
  Loader2, Send, RotateCcw, User, ShieldCheck, Info,
  Clock, Hash, Tag, FileText,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  open:        { label: "مفتوحة",        dot: "bg-amber-500",  badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  in_progress: { label: "قيد المعالجة", dot: "bg-blue-500",   badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  pending:     { label: "معلقة",         dot: "bg-purple-500", badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  closed:      { label: "مغلقة",         dot: "bg-gray-400",   badge: "bg-muted text-muted-foreground border-border" },
};

const TYPE_LABELS: Record<string, string> = {
  account: "مشكلة في الحساب", service: "مشكلة في خدمة",
  inquiry: "استفسار", complaint: "شكوى", other: "أخرى",
};

export default function DashboardSupportTicket() {
  usePageTitle("تذكرة الدعم");
  const { id } = useParams<{ id: string }>();
  const { data: authData } = useCommunityAuth();
  const token = getCommunityToken();
  const authHeaders = token ? { "X-Community-Token": token } : {};
  const qc = useQueryClient();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [reply, setReply] = useState("");
  const [reopenMsg, setReopenMsg] = useState("");
  const [showReopen, setShowReopen] = useState(false);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/support/tickets", id],
    queryFn: async () => {
      const res = await fetch(`/api/support/tickets/${id}`, { credentials: "include", headers: authHeaders });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!authData?.authenticated && !!id,
    refetchInterval: 30000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.replies?.length]);

  const replyMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await fetch(`/api/support/tickets/${id}/reply`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/support/tickets", id] });
      setReply("");
    },
    onError: (e: any) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  });

  const reopenMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await fetch(`/api/support/tickets/${id}/reopen`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/support/tickets", id] });
      qc.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setShowReopen(false);
      setReopenMsg("");
      toast({ title: "تم إعادة فتح التذكرة" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  });

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
    </DashboardLayout>
  );

  if (!data) return (
    <DashboardLayout>
      <div className="text-center py-20 text-muted-foreground" dir="rtl">التذكرة غير موجودة</div>
    </DashboardLayout>
  );

  const { ticket, replies = [] } = data;
  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
  const isClosed = ticket.status === "closed";

  return (
    <DashboardLayout>
      <div className="space-y-4" dir="rtl">

        {/* ── Back link ── */}
        <Link href="/dashboard/support" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="w-4 h-4" />
          العودة للدعم الفني
        </Link>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">

          {/* ── Left: Conversation ── */}
          <div className="space-y-4 min-w-0">

            {/* Notices */}
            {ticket.status === "in_progress" && ticket.lastAdminReplyAt && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2.5 text-sm text-amber-700 dark:text-amber-400">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>تم الرد من الإدارة. ستُغلق التذكرة تلقائياً خلال 24 ساعة إذا لم يتم الرد.</span>
              </div>
            )}
            {isClosed && (
              <div className="rounded-xl border border-border bg-muted/30 p-3 flex gap-2.5 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>هذه التذكرة مغلقة. يمكنك إعادة فتحها إذا كانت المشكلة لا تزال قائمة.</span>
              </div>
            )}

            {/* Conversation bubbles */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4 space-y-5 min-h-[200px]" dir="rtl">
                {replies.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">لا توجد ردود بعد</p>
                )}
                {replies.map((r: any) => {
                  const isMember = r.senderType === "member";
                  const isSystem = r.senderType === "system";

                  if (isSystem) return (
                    <div key={r.id} className="flex justify-center">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{r.message}</span>
                    </div>
                  );

                  return (
                    <div
                      key={r.id}
                      className={`flex gap-2.5 ${isMember ? "flex-row" : "flex-row-reverse"}`}
                      data-testid={`reply-${r.id}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isMember ? "bg-primary/10" : "bg-indigo-500/10"
                      }`}>
                        {isMember
                          ? <User className="w-4 h-4 text-primary" />
                          : <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        }
                      </div>

                      {/* Bubble */}
                      <div className={`max-w-[78%] flex flex-col gap-1 ${isMember ? "items-start" : "items-end"}`}>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="font-medium">{isMember ? "أنت" : "فريق الدعم"}</span>
                          <span className="opacity-40">·</span>
                          <span>{format(new Date(r.createdAt), "dd/MM HH:mm", { locale: ar })}</span>
                        </div>
                        <div className={`px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed text-right ${
                          isMember
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                            : "bg-muted rounded-2xl rounded-tl-md"
                        }`}>
                          {r.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-border p-3 bg-muted/20">
                {isClosed ? (
                  !showReopen ? (
                    <Button variant="outline" className="w-full gap-2" onClick={() => setShowReopen(true)} data-testid="button-reopen-ticket">
                      <RotateCcw className="w-4 h-4" />
                      إعادة فتح التذكرة
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="سبب إعادة الفتح (اختياري)…"
                        rows={2}
                        value={reopenMsg}
                        onChange={e => setReopenMsg(e.target.value)}
                        className="resize-none bg-background"
                        data-testid="textarea-reopen-message"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setShowReopen(false)}>إلغاء</Button>
                        <Button size="sm" className="gap-2" onClick={() => reopenMutation.mutate(reopenMsg)} disabled={reopenMutation.isPending}>
                          {reopenMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                          <RotateCcw className="w-3 h-3" />
                          إعادة الفتح
                        </Button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="اكتب ردك هنا… (Ctrl+Enter للإرسال)"
                      rows={2}
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      className="flex-1 resize-none bg-background"
                      data-testid="textarea-reply"
                      onKeyDown={e => {
                        if (e.key === "Enter" && e.ctrlKey && reply.trim()) replyMutation.mutate(reply);
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => replyMutation.mutate(reply)}
                      disabled={!reply.trim() || replyMutation.isPending}
                      data-testid="button-send-reply"
                    >
                      {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Ticket info panel ── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-l from-indigo-600 to-violet-600 p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <HeadphonesIcon className="w-4 h-4 opacity-80" />
                <span className="text-xs font-mono opacity-80">{ticket.ticketNumber}</span>
              </div>
              <h2 className="font-bold text-sm leading-snug line-clamp-2">{ticket.subject}</h2>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              <InfoRow icon={<span className={`w-2 h-2 rounded-full ${cfg.dot}`} />} label="الحالة">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </InfoRow>

              <InfoRow icon={<Tag className="w-3.5 h-3.5 text-muted-foreground" />} label="النوع">
                <span className="text-sm">{TYPE_LABELS[ticket.type] ?? ticket.type}</span>
              </InfoRow>

              {ticket.orderNumber && (
                <InfoRow icon={<Hash className="w-3.5 h-3.5 text-muted-foreground" />} label="رقم الطلب">
                  <span className="text-sm font-mono">{ticket.orderNumber}</span>
                </InfoRow>
              )}

              <InfoRow icon={<Clock className="w-3.5 h-3.5 text-muted-foreground" />} label="آخر تحديث">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: ar })}
                </span>
              </InfoRow>

              <InfoRow icon={<FileText className="w-3.5 h-3.5 text-muted-foreground" />} label="عدد الردود">
                <span className="text-sm">{replies.filter((r: any) => r.senderType !== "system").length}</span>
              </InfoRow>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-5 flex items-center justify-center shrink-0">{icon}</div>
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
