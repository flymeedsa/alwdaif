import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminFetch } from "@/lib/adminAuth";
import { Input } from "@/components/ui/input";
import {
  HeadphonesIcon, Loader2, Search, Users, Hash,
  AlertCircle, Clock, CheckCircle, PauseCircle, InboxIcon,
  Shield, Zap, MessageSquare, LifeBuoy, ChevronLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";

const STATUS_CONFIG: Record<string, { label: string; dot: string; bar: string; badge: string; icon: any }> = {
  open:        { label: "مفتوحة",        dot: "bg-amber-500",  bar: "bg-amber-500",  badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",  icon: AlertCircle },
  in_progress: { label: "قيد المعالجة", dot: "bg-blue-500",   bar: "bg-blue-500",   badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",   icon: Clock },
  pending:     { label: "معلقة",         dot: "bg-purple-500", bar: "bg-purple-500", badge: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20", icon: PauseCircle },
  closed:      { label: "مغلقة",         dot: "bg-gray-400",   bar: "bg-gray-300 dark:bg-gray-600",   badge: "bg-muted text-muted-foreground border-border", icon: CheckCircle },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  account:   { label: "مشكلة في الحساب",  icon: Shield,        color: "text-blue-500 bg-blue-500/10" },
  service:   { label: "مشكلة في خدمة",    icon: Zap,           color: "text-amber-500 bg-amber-500/10" },
  inquiry:   { label: "استفسار",           icon: MessageSquare, color: "text-indigo-500 bg-indigo-500/10" },
  complaint: { label: "شكوى",             icon: AlertCircle,   color: "text-red-500 bg-red-500/10" },
  other:     { label: "أخرى",             icon: LifeBuoy,      color: "text-gray-500 bg-gray-500/10" },
};

const TABS = [
  { key: "all",         label: "الكل",           color: "text-foreground" },
  { key: "open",        label: "مفتوحة",          color: "text-amber-600 dark:text-amber-400" },
  { key: "in_progress", label: "قيد المعالجة",   color: "text-blue-600 dark:text-blue-400" },
  { key: "pending",     label: "معلقة",            color: "text-purple-600 dark:text-purple-400" },
  { key: "closed",      label: "مغلقة",            color: "text-muted-foreground" },
];

export default function AdminSupport() {
  usePageTitle("الدعم الفني");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const { data: tickets = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/support/tickets", tab],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/support/tickets?status=${tab}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filtered = tickets.filter((t: any) =>
    !search ||
    t.subject?.toLowerCase().includes(search.toLowerCase()) ||
    t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
    t.memberName?.toLowerCase().includes(search.toLowerCase())
  );

  const allTickets = tickets;
  const counts = {
    all:         allTickets.length,
    open:        allTickets.filter((t: any) => t.status === "open").length,
    in_progress: allTickets.filter((t: any) => t.status === "in_progress").length,
    pending:     allTickets.filter((t: any) => t.status === "pending").length,
    closed:      allTickets.filter((t: any) => t.status === "closed").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6" dir="rtl">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-600 to-violet-700 p-6 text-white">
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 left-16 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute top-4 left-32 w-14 h-14 rounded-full bg-white/10" />

          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                <HeadphonesIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">الدعم الفني</h1>
                <p className="text-sm text-white/70 mt-0.5">إدارة ومتابعة تذاكر الدعم</p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3 flex-wrap">
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold">{counts.open}</p>
                <p className="text-xs text-white/70">مفتوحة</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold">{counts.in_progress}</p>
                <p className="text-xs text-white/70">قيد المعالجة</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold">{counts.pending}</p>
                <p className="text-xs text-white/70">معلقة</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                <p className="text-xl font-bold">{counts.all}</p>
                <p className="text-xs text-white/70">الإجمالي</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Search + Tabs ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 min-w-0 w-full sm:max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالموضوع أو رقم التذكرة أو العضو…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9 h-9"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {TABS.map(t => {
              const count = counts[t.key as keyof typeof counts] ?? 0;
              const isActive = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  data-testid={`tab-${t.key}`}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
                  }`}
                >
                  {t.label}
                  {count > 0 && (
                    <span className={`text-xs rounded-full px-1.5 min-w-[18px] text-center leading-5 ${
                      isActive ? "bg-white/20" : "bg-background/80"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">جار التحميل…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center rounded-2xl border border-dashed border-border bg-muted/20">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <InboxIcon className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">لا توجد تذاكر</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
              <span className="w-1 ml-3" />
              <span>التذكرة</span>
              <span className="px-4 hidden md:block">النوع</span>
              <span className="px-4">الحالة</span>
              <span className="px-4 hidden lg:block">التاريخ</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
              {filtered.map((ticket: any) => {
                const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                const typeCfg = TYPE_CONFIG[ticket.type] || TYPE_CONFIG.other;
                const TypeIcon = typeCfg.icon;
                const StatusIcon = cfg.icon;

                return (
                  <Link key={ticket.id} href={`/admin/support/${ticket.id}`}>
                    <div
                      className="group grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 items-center hover:bg-muted/30 transition-colors cursor-pointer"
                      data-testid={`ticket-row-${ticket.id}`}
                    >
                      {/* Status bar */}
                      <div className={`w-1 self-stretch shrink-0 ${cfg.bar}`} />

                      {/* Main content */}
                      <div className="flex items-center gap-3 px-4 py-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeCfg.color}`}>
                          <TypeIcon className="w-[16px] h-[16px]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate leading-snug">{ticket.subject}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                              <Hash className="w-2.5 h-2.5" />{ticket.ticketNumber}
                            </span>
                            <span className="text-muted-foreground/30 text-xs">·</span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Users className="w-2.5 h-2.5" />
                              {ticket.memberName || `#${ticket.memberId}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Type */}
                      <div className="px-4 hidden md:block">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{typeCfg.label}</span>
                      </div>

                      {/* Status badge */}
                      <div className="px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>

                      {/* Date + arrow */}
                      <div className="px-4 flex items-center gap-2 hidden lg:flex">
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
    </AdminLayout>
  );
}
