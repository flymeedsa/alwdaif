import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminFetch } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  HeadphonesIcon, ChevronRight, Loader2, Send, User, ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:        { label: "مفتوحة",        color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25" },
  in_progress: { label: "قيد المعالجة", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25" },
  pending:     { label: "معلقة",         color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/25" },
  closed:      { label: "مغلقة",         color: "bg-gray-500/15 text-gray-500 border-gray-500/25" },
};

const TYPE_LABELS: Record<string, string> = {
  account: "مشكلة في الحساب", service: "مشكلة في خدمة",
  inquiry: "استفسار", complaint: "شكوى", other: "أخرى",
};

export default function AdminSupportTicket() {
  usePageTitle("تذكرة دعم");
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [reply, setReply] = useState("");

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/support/tickets", id],
    queryFn: async () => {
      const res = await adminFetch(`/api/admin/support/tickets/${id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 30000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.replies?.length]);

  const replyMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await adminFetch(`/api/admin/support/tickets/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/support/tickets", id] });
      setReply("");
      toast({ title: "تم إرسال الرد" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await adminFetch(`/api/admin/support/tickets/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/support/tickets", id] });
      qc.invalidateQueries({ queryKey: ["/api/admin/support/tickets", "all"] });
      toast({ title: "تم تحديث الحالة" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "خطأ", description: e.message }),
  });

  if (isLoading) return (
    <AdminLayout>
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
    </AdminLayout>
  );

  if (!data) return (
    <AdminLayout>
      <div className="text-center py-20 text-muted-foreground">التذكرة غير موجودة</div>
    </AdminLayout>
  );

  const { ticket, replies = [] } = data;
  const cfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* Back + Header */}
        <div>
          <Link href="/admin/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ChevronRight className="w-4 h-4" />
            العودة لقائمة التذاكر
          </Link>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <HeadphonesIcon className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
                <Badge variant="outline" className={`text-[11px] ${cfg.color}`}>{cfg.label}</Badge>
                <Badge variant="outline" className="text-[11px]">{TYPE_LABELS[ticket.type] ?? ticket.type}</Badge>
              </div>
              <h1 className="text-lg font-bold">{ticket.subject}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                العضو: {ticket.memberName || `#${ticket.memberId}`}
                {ticket.memberEmail && <span className="mr-2 opacity-60">{ticket.memberEmail}</span>}
              </p>
            </div>
            {/* Status Changer */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">الحالة:</span>
              <Select
                value={ticket.status}
                onValueChange={v => statusMutation.mutate(v)}
                disabled={statusMutation.isPending}
              >
                <SelectTrigger className="w-36 h-8 text-sm" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">مفتوحة</SelectItem>
                  <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                  <SelectItem value="pending">معلقة</SelectItem>
                  <SelectItem value="closed">مغلقة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Conversation */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {replies.map((r: any) => {
              const isAdmin = r.senderType === "admin";
              const isSystem = r.senderType === "system";
              if (isSystem) return (
                <div key={r.id} className="text-center">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{r.message}</span>
                </div>
              );
              return (
                <div key={r.id} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`} data-testid={`reply-${r.id}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? "bg-indigo-500/10" : "bg-primary/10"}`}>
                    {isAdmin
                      ? <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      : <User className="w-4 h-4 text-primary" />
                    }
                  </div>
                  <div className={`max-w-[80%] space-y-1 ${isAdmin ? "items-end" : ""}`}>
                    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${isAdmin ? "flex-row-reverse" : ""}`}>
                      <span>{isAdmin ? "الإدارة" : (ticket.memberName || "العضو")}</span>
                      <span>·</span>
                      <span>{format(new Date(r.createdAt), "dd/MM/yyyy HH:mm", { locale: ar })}</span>
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      isAdmin
                        ? "bg-indigo-500/10 rounded-tl-none"
                        : "bg-muted rounded-tr-none"
                    }`}>
                      {r.message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </CardContent>
        </Card>

        {/* Reply Box */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Textarea
                placeholder="رد الإدارة..."
                rows={3}
                value={reply}
                onChange={e => setReply(e.target.value)}
                className="flex-1"
                data-testid="textarea-admin-reply"
                onKeyDown={e => {
                  if (e.key === "Enter" && e.ctrlKey && reply.trim()) replyMutation.mutate(reply);
                }}
              />
              <Button
                size="icon"
                className="h-auto self-end"
                onClick={() => replyMutation.mutate(reply)}
                disabled={!reply.trim() || replyMutation.isPending}
                data-testid="button-send-reply"
              >
                {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ctrl+Enter للإرسال</p>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
