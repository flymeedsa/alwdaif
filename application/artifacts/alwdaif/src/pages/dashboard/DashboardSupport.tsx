import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "./DashboardLayout";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { getCommunityToken } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  HeadphonesIcon, Plus, Clock, CheckCircle, AlertCircle,
  Loader2, ChevronLeft, RefreshCw, LifeBuoy,
  Shield, Zap, MessageSquare, Send, Hash, HelpCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bar: string; badge: string }> = {
  open:        { label: "مفتوحة",        dot: "bg-amber-500",  bar: "bg-amber-500",  badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  in_progress: { label: "قيد المعالجة", dot: "bg-blue-500",   bar: "bg-blue-500",   badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  pending:     { label: "معلقة",         dot: "bg-purple-500", bar: "bg-purple-500", badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  closed:      { label: "مغلقة",         dot: "bg-gray-400",   bar: "bg-gray-400",   badge: "bg-muted text-muted-foreground border-border" },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  account:   { label: "مشكلة في الحساب",  icon: Shield,        color: "text-blue-500 bg-blue-500/10" },
  service:   { label: "مشكلة في خدمة",    icon: Zap,           color: "text-amber-500 bg-amber-500/10" },
  inquiry:   { label: "استفسار",           icon: MessageSquare, color: "text-indigo-500 bg-indigo-500/10" },
  complaint: { label: "شكوى",             icon: AlertCircle,   color: "text-red-500 bg-red-500/10" },
  other:     { label: "أخرى",             icon: LifeBuoy,      color: "text-gray-500 bg-gray-500/10" },
};

const TABS = [
  { key: "all",         label: "الكل" },
  { key: "open",        label: "مفتوحة" },
  { key: "in_progress", label: "قيد المعالجة" },
  { key: "pending",     label: "معلقة" },
  { key: "closed",      label: "مغلقة" },
];

export default function DashboardSupport() {
  usePageTitle("الدعم الفني");
  const { data: authData } = useCommunityAuth();
  const token = getCommunityToken();
  const authHeaders = token ? { "X-Community-Token": token } : {};
  const qc = useQueryClient();
  const { toast } = useToast();

  const [tab, setTab] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: "", type: "", message: "", orderNumber: "" });
  const [step, setStep] = useState(1);

  const { data: tickets = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/support/tickets"],
    queryFn: async () => {
      const res = await fetch("/api/support/tickets", { credentials: "include", headers: authHeaders });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!authData?.authenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setShowNew(false);
      setStep(1);
      setForm({ subject: "", type: "", message: "", orderNumber: "" });
      toast({ title: "تم إرسال التذكرة بنجاح", description: "سنرد عليك في أقرب وقت ممكن." });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  });

  const filtered = tab === "all" ? tickets : tickets.filter((t: any) => t.status === tab);

  function handleOpenNew() {
    setForm({ subject: "", type: "", message: "", orderNumber: "" });
    setStep(1);
    setShowNew(true);
  }

  return (
    <DashboardLayout>
      <div className="space-y-5" dir="rtl">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-600 p-5 text-white">
          <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 left-10 w-24 h-24 rounded-full bg-white/5" />

          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                <HeadphonesIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">مركز الدعم الفني</h1>
                <p className="text-sm text-white/70">نحن هنا لمساعدتك في أي وقت</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/faq">
                <Button
                  variant="ghost"
                  className="bg-white/15 text-white hover:bg-white/25 font-medium gap-2"
                  data-testid="button-faq-link"
                >
                  <HelpCircle className="w-4 h-4" />
                  الأسئلة الشائعة
                </Button>
              </Link>
              <Button
                onClick={handleOpenNew}
                className="bg-white text-indigo-600 hover:bg-white/90 font-semibold gap-2"
                data-testid="button-new-ticket"
              >
                <Plus className="w-4 h-4" />
                تذكرة جديدة
              </Button>
            </div>
          </div>

          {/* Filter tabs inside banner */}
          {tickets.length > 0 && (
            <div className="relative mt-4 flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              {TABS.map(t => {
                const count = t.key === "all" ? tickets.length : tickets.filter((x: any) => x.status === t.key).length;
                const isActive = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    data-testid={`tab-${t.key}`}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? "bg-white text-indigo-700 shadow-sm" : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {t.label}
                    {count > 0 && (
                      <span className={`text-xs rounded-full px-1.5 min-w-[18px] text-center ${
                        isActive ? "bg-indigo-100 text-indigo-600" : "bg-white/20 text-white"
                      }`}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">جار التحميل…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <LifeBuoy className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-semibold">{tab === "all" ? "لا توجد تذاكر بعد" : "لا توجد تذاكر في هذه الحالة"}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "all" ? "هل تواجه مشكلة؟ أرسل تذكرة وسنرد عليك قريباً" : "يمكنك تغيير الفلتر لعرض تذاكر أخرى"}
              </p>
            </div>
            {tab === "all" && (
              <Button onClick={handleOpenNew} className="gap-2">
                <Plus className="w-4 h-4" />أرسل أول تذكرة
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span>الموضوع</span>
              <span className="px-4 text-center hidden sm:block">النوع</span>
              <span className="px-4 text-center">الحالة</span>
              <span className="px-4 text-center hidden md:block">التاريخ</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {filtered.map((ticket: any) => {
                const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const typeCfg = TYPE_CONFIG[ticket.type] || TYPE_CONFIG.other;
                const TypeIcon = typeCfg.icon;
                return (
                  <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
                    <div
                      className="group grid grid-cols-[1fr_auto_auto_auto] gap-0 items-center px-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      data-testid={`ticket-row-${ticket.id}`}
                    >
                      {/* Status bar + subject */}
                      <div className="flex items-center gap-0 min-w-0">
                        <div className={`w-1 self-stretch shrink-0 ${cfg.bar}`} />
                        <div className="flex items-center gap-3 px-4 py-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${typeCfg.color}`}>
                            <TypeIcon className="w-[15px] h-[15px]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{ticket.subject}</p>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                              <Hash className="w-2.5 h-2.5" />{ticket.ticketNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Type */}
                      <div className="px-4 hidden sm:block">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{typeCfg.label}</span>
                      </div>

                      {/* Status */}
                      <div className="px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Date + arrow */}
                      <div className="px-4 flex items-center gap-2 hidden md:flex">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: ar })}
                        </span>
                        <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ── New Ticket Dialog — 2-step ── */}
      <Dialog open={showNew} onOpenChange={v => { setShowNew(v); if (!v) setStep(1); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <HeadphonesIcon className="w-4 h-4 text-indigo-500" />
              </div>
              <DialogTitle className="text-base">تذكرة دعم جديدة</DialogTitle>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step >= s ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>{s}</div>
                  {s < 2 && <div className={`h-px w-8 transition-colors ${step > s ? "bg-indigo-500" : "bg-border"}`} />}
                </div>
              ))}
              <span className="text-xs text-muted-foreground mr-1">
                {step === 1 ? "اختر نوع المشكلة" : "تفاصيل التذكرة"}
              </span>
            </div>
          </DialogHeader>

          {step === 1 ? (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-muted-foreground mb-3">ما نوع مشكلتك؟</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                  const Icon = v.icon;
                  const isSelected = form.type === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setForm(f => ({ ...f, type: k }))}
                      className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-right transition-all ${
                        isSelected ? "border-indigo-500 bg-indigo-500/8" : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-indigo-500/15 text-indigo-500" : v.color
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{v.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setStep(2)} disabled={!form.type} className="gap-2">
                  التالي <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-4">
              {form.type && (() => {
                const tc = TYPE_CONFIG[form.type];
                const Icon = tc.icon;
                return (
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm text-muted-foreground hover:bg-muted/80 transition-colors w-full">
                    <Icon className="w-3.5 h-3.5" />{tc.label}
                    <span className="text-xs opacity-50 mr-auto">تغيير</span>
                  </button>
                );
              })()}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">الموضوع <span className="text-red-500">*</span></Label>
                <Input placeholder="وصف مختصر للمشكلة" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} data-testid="input-ticket-subject" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">رقم الطلب <span className="text-muted-foreground font-normal text-xs">(اختياري)</span></Label>
                <Input placeholder="مثال: ORD-12345" value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))} className="font-mono" data-testid="input-ticket-order" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">تفاصيل المشكلة <span className="text-red-500">*</span></Label>
                <Textarea placeholder="اشرح مشكلتك بالتفصيل…" rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="resize-none" data-testid="textarea-ticket-message" />
              </div>
              <div className="flex gap-2 justify-between pt-1">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-muted-foreground">رجوع</Button>
                <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.subject.trim() || !form.message.trim()} className="gap-2 px-5" data-testid="button-submit-ticket">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  إرسال التذكرة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
