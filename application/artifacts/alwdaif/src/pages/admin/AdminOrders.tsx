import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Phone,
  Mail,
  User,
  Calendar,
  CreditCard,
  Image,
  RefreshCw,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  UserPlus,
  X,
  Rocket,
  Coins,
  Building2,
  Minus,
  Wallet,
  BrainCircuit,
  History,
  PauseCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const WA_ICON = (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

function MemberCreditRow({ m, isExpanded, onToggle, onAddJob, onDeductJob, onAddCv, onDeductCv }: {
  m: any;
  isExpanded: boolean;
  onToggle: () => void;
  onAddJob: () => void;
  onDeductJob: () => void;
  onAddCv: () => void;
  onDeductCv: () => void;
}) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["/api/admin/credit-adjustments", m.memberId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/credit-adjustments/${m.memberId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isExpanded,
    staleTime: 0,
  });

  const waPhone = m.phone?.replace(/[^0-9]/g, "").replace(/^0/, "966");

  return (
    <>
      <TableRow className="border-border/50 hover:bg-muted">
        <TableCell>
          <div className="font-medium text-foreground">{m.displayName}</div>
          {m.phone && (
            <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-500 hover:text-green-400 mt-0.5">
              {WA_ICON}{m.phone}
            </a>
          )}
        </TableCell>
        <TableCell className="text-center">
          <div className={`text-xl font-bold ${m.jobCredits > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>{m.jobCredits}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Button size="icon" variant="outline" className="h-6 w-6 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10" onClick={onAddJob}><Plus className="h-3 w-3" /></Button>
            <Button size="icon" variant="outline" className="h-6 w-6 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={onDeductJob}><Minus className="h-3 w-3" /></Button>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className={`text-xl font-bold ${m.cvCredits > 0 ? "text-blue-400" : "text-muted-foreground"}`}>{m.cvCredits}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Button size="icon" variant="outline" className="h-6 w-6 border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={onAddCv}><Plus className="h-3 w-3" /></Button>
            <Button size="icon" variant="outline" className="h-6 w-6 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={onDeductCv}><Minus className="h-3 w-3" /></Button>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <div className="flex items-center justify-center gap-1">
            {m.phone && (
              <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors" title="تواصل عبر واتساب">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            )}
            <Button size="icon" variant="ghost" className={`h-8 w-8 transition-colors ${isExpanded ? "text-violet-400 bg-violet-500/10" : "text-muted-foreground hover:text-violet-400 hover:bg-violet-500/10"}`}
              onClick={onToggle} title="سجل التعديلات">
              <History className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="border-border/30 bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={4} className="py-0">
            <div className="py-3 px-2">
              <div className="flex items-center gap-2 mb-2">
                <History className="h-3.5 w-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-violet-400">سجل تعديلات الرصيد</span>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>جاري التحميل...</span>
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">لا توجد تعديلات مسجّلة</p>
              ) : (
                <div className="space-y-1">
                  {history.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 text-xs py-1.5 border-b border-border/20 last:border-0">
                      <span className={`shrink-0 inline-flex items-center gap-0.5 font-bold ${log.operation === "add" ? "text-emerald-400" : "text-red-400"}`}>
                        {log.operation === "add" ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        {log.amount}
                      </span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${log.type === "job" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {log.type === "job" ? "تقديم" : "سيرة ذاتية"}
                      </span>
                      <span className="text-muted-foreground flex-1 leading-relaxed">{log.reason || "—"}</span>
                      <span className="shrink-0 text-muted-foreground/60 tabular-nums">
                        {log.createdAt ? format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ar }) : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "قيد المراجعة", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  in_progress: { label: "قيد التنفيذ", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Loader2 },
  completed: { label: "تم التنفيذ", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
  cancelled: { label: "ملغي", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  deferred: { label: "مؤجلة", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: PauseCircle },
};

const CANCELLATION_REASONS = [
  "بناء على طلب العميل",
  "العميل لم يدفع الرسوم",
  "إيصال التحويل غير صحيح",
  "المبلغ المحول غير مطابق",
  "تكرار الطلب",
  "أخرى (اكتب السبب)"
];

export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const searchString = useSearch();
  const urlStatus = new URLSearchParams(searchString).get("status") || "all";
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus);

  useEffect(() => {
    const s = new URLSearchParams(searchString).get("status") || "all";
    setStatusFilter(s);
  }, [searchString]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
    status: "pending",
    memberId: null as number | null,
  });
  type CartItem = { id: string; serviceName: string; serviceSlug: string; variantName: string; price: number; };
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [pendingService, setPendingService] = useState<any>(null);
  const [pendingVariant, setPendingVariant] = useState<any>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [createMemberMode, setCreateMemberMode] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ displayName: "", username: "", phone: "", email: "" });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mainTab, setMainTab] = useState<"orders" | "applications" | "credits">("orders");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appViewOpen, setAppViewOpen] = useState(false);
  const [appNotesInput, setAppNotesInput] = useState("");
  const [appDeleteDialogOpen, setAppDeleteDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<any>(null);
  const [appDeletePassword, setAppDeletePassword] = useState("");
  const [appDeletePasswordError, setAppDeletePasswordError] = useState("");
  const [creditsSearch, setCreditsSearch] = useState("");
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [creditDialog, setCreditDialog] = useState<{ open: boolean; member: any; type: "job" | "cv"; action: "add" | "deduct" }>({ open: false, member: null, type: "job", action: "add" });
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");

  const { data: adminMe } = useQuery<{ isSuperAdmin: boolean; role: string }>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      if (!res.ok) return { isSuperAdmin: false, role: "" };
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: jobAppsData = [], isLoading: appsLoading, refetch: appsRefetch } = useQuery({
    queryKey: ["/api/admin/job-applications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/job-applications", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateAppStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      const res = await fetch(`/api/admin/job-applications/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, adminNotes }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/job-applications"] });
      setAppViewOpen(false);
    },
    onError: () => toast({ title: "خطأ", description: "فشل التحديث", variant: "destructive" }),
  });

  const deleteAppMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const res = await fetch(`/api/admin/job-applications/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "فشل الحذف");
      return data;
    },
    onSuccess: () => {
      toast({ title: "تم الحذف", description: "تم حذف الطلب بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/job-applications"] });
      setAppDeleteDialogOpen(false);
      setAppToDelete(null);
      setAppDeletePassword("");
      setAppDeletePasswordError("");
    },
    onError: (err: any) => {
      setAppDeletePasswordError(err.message || "كلمة المرور غير صحيحة");
    },
  });

  const { data: memberCreditsData = [], refetch: refetchCredits } = useQuery({
    queryKey: ["/api/admin/member-credits"],
    queryFn: async () => {
      const res = await fetch("/api/admin/member-credits", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const creditMutation = useMutation({
    mutationFn: async ({ memberId, amount, type, action, reason }: { memberId: number; amount: number; type: "job" | "cv"; action: "add" | "deduct"; reason?: string }) => {
      const url = type === "job"
        ? `/api/admin/job-credits/${action}`
        : `/api/admin/cv-credits/${action}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberId, amount, reason }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "تم التحديث", description: "تم تحديث رصيد العضو بنجاح" });
      refetchCredits();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/credit-adjustments", variables.memberId] });
      setCreditDialog({ open: false, member: null, type: "job", action: "add" });
      setCreditAmount("");
      setCreditReason("");
    },
    onError: () => toast({ title: "خطأ", description: "فشل في تحديث الرصيد", variant: "destructive" }),
  });

  const { data: servicesData = [] } = useQuery({
    queryKey: ["/api/admin/services"],
    queryFn: async () => {
      const res = await fetch("/api/admin/services", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: createDialogOpen,
  });

  const { data: membersData = [] } = useQuery({
    queryKey: ["/api/admin/community/members"],
    queryFn: async () => {
      const res = await fetch("/api/admin/community/members", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: createDialogOpen,
  });

  const { data: ordersData = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["/api/admin/service-orders"],
    queryFn: async () => {
      const res = await fetch("/api/admin/service-orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, cancellationReason }: { id: number; status: string; cancellationReason?: string }) => {
      const res = await fetch(`/api/admin/service-orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, cancellationReason }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store/report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store/report/detailed"] });
      setCancelDialogOpen(false);
      setOrderToCancel(null);
      setCancellationReason("");
      setCustomReason("");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في تحديث حالة الطلب", variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/service-orders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete order");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم الحذف", description: "تم حذف الطلب بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store/report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store/report/detailed"] });
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      setDeletePassword("");
      setDeletePasswordError("");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حذف الطلب", variant: "destructive" });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      let receiptUrl = "manual-order";
      if (receiptFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", receiptFile);
        const uploadRes = await fetch("/api/media/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("فشل في رفع الإيصال");
        const uploadData = await uploadRes.json();
        receiptUrl = uploadData.url || uploadData.path || "manual-order";
        setIsUploading(false);
      }
      const subtotal = cartItems.reduce((s, i) => s + i.price, 0);
      const discountVal = parseFloat(discount) || 0;
      const discountAmount = discountType === "percent" ? Math.round(subtotal * discountVal / 100) : discountVal;
      const finalAmount = Math.max(0, subtotal - discountAmount);
      const isSingle = cartItems.length === 1;
      const primaryItem = cartItems[0];
      const serviceName = isSingle ? primaryItem.serviceName : `خدمات متعددة (${cartItems.length})`;
      const serviceSlug = isSingle ? primaryItem.serviceSlug : "multi";
      const serviceVariant = isSingle
        ? (primaryItem.variantName || null)
        : JSON.stringify(cartItems.map(i => ({ name: i.serviceName, variant: i.variantName, price: i.price })));
      const autoNotes = cartItems.length > 1
        ? cartItems.map(i => `• ${i.serviceName}${i.variantName ? ` (${i.variantName})` : ""}: ${i.price} ريال`).join("\n")
          + (discountAmount > 0 ? `\nخصم: ${discountType === "percent" ? `${discountVal}%` : `${discountAmount} ريال`}` : "")
          + `\nالإجمالي: ${finalAmount} ريال`
          + (createForm.notes ? `\n\n${createForm.notes}` : "")
        : createForm.notes || null;
      const payload: any = {
        serviceName,
        serviceSlug,
        serviceVariant,
        amount: finalAmount,
        customerName: createForm.customerName,
        customerPhone: createForm.customerPhone,
        customerEmail: createForm.customerEmail,
        notes: autoNotes,
        status: createForm.status,
        receiptUrl,
        paymentMethod: "manual",
      };
      if (createForm.memberId) payload.memberId = createForm.memberId;
      const res = await fetch("/api/admin/service-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create order");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم إنشاء الطلب", description: "تم إنشاء الطلب اليدوي بنجاح وهو مرئي في لوحة العميل" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/service-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store/report"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store/report/detailed"] });
      setCreateDialogOpen(false);
      resetCreateDialog();
    },
    onError: (err: any) => {
      setIsUploading(false);
      toast({ title: "خطأ", description: err.message || "فشل في إنشاء الطلب", variant: "destructive" });
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: typeof newMemberForm) => {
      const res = await fetch("/api/admin/community/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create member");
      }
      return res.json();
    },
    onSuccess: (member) => {
      toast({ title: "تم إنشاء الحساب", description: `تم إنشاء حساب لـ ${member.displayName}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/community/members"] });
      selectMember(member);
      setCreateMemberMode(false);
      setNewMemberForm({ displayName: "", username: "", phone: "", email: "" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message || "فشل في إنشاء الحساب", variant: "destructive" });
    },
  });

  const resetCreateDialog = () => {
    setCreateForm({ customerName: "", customerPhone: "", customerEmail: "", notes: "", status: "pending", memberId: null });
    setCartItems([]);
    setDiscount("");
    setDiscountType("fixed");
    setPendingService(null);
    setPendingVariant(null);
    setServiceSearchQuery("");
    setMemberSearchQuery("");
    setSelectedMember(null);
    setCreateMemberMode(false);
    setNewMemberForm({ displayName: "", username: "", phone: "", email: "" });
    setReceiptFile(null);
    setReceiptPreview(null);
    setIsUploading(false);
  };

  const addToCart = () => {
    if (!pendingService) return;
    const price = pendingVariant?.price ?? pendingService.price ?? 0;
    const newItem: CartItem = {
      id: `${Date.now()}-${Math.random()}`,
      serviceName: pendingService.title,
      serviceSlug: pendingService.slug,
      variantName: pendingVariant?.name || "",
      price,
    };
    setCartItems(prev => [...prev, newItem]);
    setPendingService(null);
    setPendingVariant(null);
    setServiceSearchQuery("");
  };

  const removeFromCart = (id: string) => setCartItems(prev => prev.filter(i => i.id !== id));

  const selectMember = (member: any) => {
    setSelectedMember(member);
    setMemberSearchQuery("");
    setCreateForm(f => ({
      ...f,
      customerName: member.displayName || f.customerName,
      customerPhone: member.phone || f.customerPhone,
      customerEmail: member.email || f.customerEmail,
      memberId: member.id,
    }));
  };

  const parseServiceVariants = (variants: any): { name: string; price: number }[] => {
    try { return typeof variants === "string" ? JSON.parse(variants) : (variants || []); }
    catch { return []; }
  };

  const cartSubtotal = cartItems.reduce((s, i) => s + i.price, 0);
  const discountVal = parseFloat(discount) || 0;
  const discountAmount = discountType === "percent" ? Math.round(cartSubtotal * discountVal / 100) : discountVal;
  const cartFinalTotal = Math.max(0, cartSubtotal - discountAmount);

  const filteredServices = (servicesData as any[]).filter((s: any) =>
    !serviceSearchQuery || s.title.toLowerCase().includes(serviceSearchQuery.toLowerCase())
  );

  const filteredMembers = (membersData as any[]).filter((m: any) => {
    if (!memberSearchQuery || memberSearchQuery.length < 2) return false;
    const q = memberSearchQuery.toLowerCase();
    return (m.displayName || "").toLowerCase().includes(q) ||
      (m.phone || "").includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.username || "").toLowerCase().includes(q);
  });

  const orders = Array.isArray(ordersData) ? ordersData : [];

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery) ||
      order.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    in_progress: orders.filter((o: any) => o.status === "in_progress").length,
    completed: orders.filter((o: any) => o.status === "completed").length,
    cancelled: orders.filter((o: any) => o.status === "cancelled").length,
    deferred: orders.filter((o: any) => o.status === "deferred").length,
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    if (newStatus === "cancelled") {
      const order = orders.find((o: any) => o.id === orderId);
      setOrderToCancel(order);
      setCancelDialogOpen(true);
    } else {
      updateStatusMutation.mutate({ id: orderId, status: newStatus });
    }
  };

  const handleConfirmCancel = () => {
    if (!orderToCancel) return;
    
    const finalReason = cancellationReason === "أخرى (اكتب السبب)" ? customReason : cancellationReason;
    
    if (!finalReason.trim()) {
      toast({ title: "خطأ", description: "يرجى تحديد سبب الإلغاء", variant: "destructive" });
      return;
    }
    
    updateStatusMutation.mutate({ 
      id: orderToCancel.id, 
      status: "cancelled",
      cancellationReason: finalReason.trim()
    });
  };

  const handleDeleteOrder = (order: any) => {
    setOrderToDelete(order);
    setDeletePassword("");
    setDeletePasswordError("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!orderToDelete) return;
    
    if (deletePassword !== "ALmetab9060m%") {
      setDeletePasswordError("الكلمة السرية غير صحيحة");
      return;
    }
    
    deleteOrderMutation.mutate(orderToDelete.id);
  };

  const APP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    all:         { label: "الكل",              color: "" },
    pending:     { label: "بانتظار التنفيذ",   color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    in_progress: { label: "قيد التقديم",       color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    done:        { label: "تم التقديم",         color: "bg-green-500/20 text-green-400 border-green-500/30" },
    failed:      { label: "فشل التقديم",        color: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  const jobApps = Array.isArray(jobAppsData) ? jobAppsData : [];
  const filteredApps = jobApps.filter((a: any) => {
    const matchStatus = appStatusFilter === "all" || a.status === appStatusFilter;
    const memberName = a.member?.displayName || "";
    const memberPhone = a.member?.phone || "";
    const matchSearch = !appSearchQuery ||
      (a.jobTitle || "").toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      (a.jobCompany || "").toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      memberName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      memberPhone.includes(appSearchQuery);
    return matchStatus && matchSearch;
  });

  const memberCredits = Array.isArray(memberCreditsData) ? memberCreditsData : [];
  const filteredCredits = memberCredits.filter((m: any) => {
    if ((m.jobCredits ?? 0) === 0 && (m.cvCredits ?? 0) === 0) return false;
    if (!creditsSearch || creditsSearch.length < 1) return true;
    const q = creditsSearch.toLowerCase();
    return (m.displayName || "").toLowerCase().includes(q) ||
      (m.phone || "").includes(creditsSearch);
  });

  const appStats = {
    all:         jobApps.length,
    pending:     jobApps.filter((a: any) => a.status === "pending").length,
    in_progress: jobApps.filter((a: any) => a.status === "in_progress").length,
    done:        jobApps.filter((a: any) => a.status === "done").length,
    failed:      jobApps.filter((a: any) => a.status === "failed").length,
  };

  return (
    <AdminLayout title="الطلبات">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/admin/store" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">إدارة الطلبات</h2>
            <p className="text-muted-foreground text-sm mt-1">عرض ومتابعة طلبات الخدمات</p>
          </div>
        </div>
        {/* Main Tab Switcher */}
        <div className="flex gap-0 border-b border-border">
          <button
            onClick={() => setMainTab("orders")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px ${mainTab === "orders" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="admin-tab-orders"
          >
            <ShoppingCart className="h-4 w-4" />
            طلبات الخدمات
            {(() => { const n = orders.filter((o: any) => o.status === "pending").length; return n > 0 ? <span className="bg-amber-500/20 text-amber-400 rounded-full text-xs px-1.5">{n}</span> : null; })()}
          </button>
          <button
            onClick={() => setMainTab("applications")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px ${mainTab === "applications" ? "border-emerald-500 text-emerald-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="admin-tab-applications"
          >
            <Rocket className="h-4 w-4" />
            طلبات التقديم
            {(() => { const n = jobApps.filter((a: any) => a.status === "pending").length; return n > 0 ? <span className="bg-emerald-500/10 text-emerald-500 rounded-full text-xs px-1.5">{n}</span> : null; })()}
          </button>
          <button
            onClick={() => setMainTab("credits")}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px ${mainTab === "credits" ? "border-violet-500 text-violet-500" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            data-testid="admin-tab-credits"
          >
            <Wallet className="h-4 w-4" />
            أرصدة الأعضاء
            {memberCredits.length > 0 && <span className="bg-violet-500/10 text-violet-500 rounded-full text-xs px-1.5">{memberCredits.length}</span>}
          </button>
        </div>

        {/* Job Applications Panel */}
        {mainTab === "applications" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(["all","pending","in_progress","done","failed"] as const).map(s => (
                <Card key={s} className={`bg-card border-border cursor-pointer transition-all hover:border-emerald-500/30 ${appStatusFilter === s ? "ring-1 ring-emerald-500/30" : ""}`} onClick={() => setAppStatusFilter(s)}>
                  <CardContent className="p-4 text-center">
                    <div className={`text-2xl font-bold ${s === "done" ? "text-green-400" : s === "in_progress" ? "text-blue-400" : s === "pending" ? "text-amber-400" : s === "failed" ? "text-red-400" : "text-foreground"}`}>
                      {appStats[s]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{APP_STATUS_CONFIG[s].label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <input
                      value={appSearchQuery}
                      onChange={e => setAppSearchQuery(e.target.value)}
                      placeholder="بحث بالوظيفة أو الشركة أو العضو..."
                      className="w-full pr-10 py-2 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { appsRefetch(); toast({ title: "جارٍ التحديث" }); }}
                    className="gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    تحديث
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {appsLoading ? (
                  <div className="flex justify-center py-10"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>
                ) : filteredApps.length === 0 ? (
                  <div className="text-center py-10">
                    <Rocket className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">لا توجد طلبات تقديم</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground text-right">الوظيفة</TableHead>
                          <TableHead className="text-muted-foreground text-right">العضو</TableHead>
                          <TableHead className="text-muted-foreground text-right">الحالة</TableHead>
                          <TableHead className="text-muted-foreground text-right">التاريخ</TableHead>
                          <TableHead className="text-muted-foreground text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApps.map((app: any) => (
                          <TableRow key={app.id} className="border-border/50 hover:bg-muted">
                            <TableCell>
                              <div className="font-medium text-foreground text-sm">{app.jobTitle}</div>
                              {app.jobCompany && <div className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5"><Building2 className="h-3 w-3" />{app.jobCompany}</div>}
                              {app.jobApplyUrl && (
                                <a href={app.jobApplyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:underline">رابط التقديم ↗</a>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-foreground text-sm font-medium">{app.member?.displayName || app.memberId || "—"}</div>
                              {app.member?.phone && (
                                <a
                                  href={`https://wa.me/${app.member.phone.replace(/[^0-9]/g, '').replace(/^0/, '966')}`}
                                  target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-green-500 hover:text-green-400 mt-0.5"
                                >
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                  {app.member.phone}
                                </a>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={APP_STATUS_CONFIG[app.status]?.color || ""}>
                                {APP_STATUS_CONFIG[app.status]?.label || app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {app.createdAt ? format(new Date(app.createdAt), "dd MMM yyyy", { locale: ar }) : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedApp(app); setAppNotesInput(app.adminNotes || ""); setAppViewOpen(true); }} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-card border-border">
                                    {[
                                      { s: "pending",     label: "بانتظار التنفيذ", cls: "text-amber-400" },
                                      { s: "in_progress", label: "قيد التقديم",      cls: "text-blue-400" },
                                      { s: "done",        label: "تم التقديم",       cls: "text-green-400" },
                                      { s: "failed",      label: "فشل التقديم",      cls: "text-red-400" },
                                    ].map(opt => (
                                      <DropdownMenuItem key={opt.s} onClick={() => updateAppStatusMutation.mutate({ id: app.id, status: opt.s })} className={`${opt.cls} hover:bg-muted cursor-pointer`}>
                                        {opt.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                {adminMe?.isSuperAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setAppToDelete(app); setAppDeletePassword(""); setAppDeletePasswordError(""); setAppDeleteDialogOpen(true); }}
                                    className="text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
                                    title="حذف الطلب"
                                    data-testid={`btn-delete-app-${app.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Job Application View Dialog */}
        <Dialog open={appViewOpen} onOpenChange={setAppViewOpen}>
          <DialogContent className="bg-card border-border max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-emerald-500" />
                تفاصيل طلب التقديم
              </DialogTitle>
            </DialogHeader>
            {selectedApp && (
              <div className="space-y-4 mt-2">
                <div className="rounded-xl bg-muted/50 p-4 space-y-1">
                  <p className="font-bold text-foreground">{selectedApp.jobTitle}</p>
                  {selectedApp.jobCompany && <p className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{selectedApp.jobCompany}</p>}
                  {selectedApp.jobApplyUrl && (
                    <a href={selectedApp.jobApplyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-500 hover:underline block">رابط التقديم المباشر ↗</a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-0.5">العضو</p>
                    <p className="font-medium text-foreground">{selectedApp.member?.displayName || "—"}</p>
                    {selectedApp.member?.phone && (
                      <a
                        href={`https://wa.me/${selectedApp.member.phone.replace(/[^0-9]/g, '').replace(/^0/, '966')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-500 hover:text-green-400 mt-0.5"
                      >
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        {selectedApp.member.phone}
                      </a>
                    )}
                  </div>
                  <div><p className="text-muted-foreground text-xs mb-0.5">الحالة</p><Badge className={APP_STATUS_CONFIG[selectedApp.status]?.color || ""}>{APP_STATUS_CONFIG[selectedApp.status]?.label}</Badge></div>
                  <div><p className="text-muted-foreground text-xs mb-0.5">تاريخ الطلب</p><p className="font-medium text-foreground">{selectedApp.createdAt ? format(new Date(selectedApp.createdAt), "dd/MM/yyyy HH:mm") : "—"}</p></div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">ملاحظات للعضو (اختياري)</label>
                  <textarea
                    value={appNotesInput}
                    onChange={e => setAppNotesInput(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                    rows={3}
                    placeholder="مثال: تم التقديم بنجاح، انتظر الرد خلال أسبوع"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { s: "pending",     label: "بانتظار التنفيذ", cls: "border-amber-500/30 text-amber-500 hover:bg-amber-500/5" },
                    { s: "in_progress", label: "قيد التقديم",      cls: "border-blue-500/30 text-blue-500 hover:bg-blue-500/5" },
                    { s: "done",        label: "تم التقديم ✓",     cls: "bg-green-500 hover:bg-green-600 text-white border-transparent" },
                    { s: "failed",      label: "فشل التقديم",      cls: "border-red-500/30 text-red-500 hover:bg-red-500/5" },
                  ].map(opt => (
                    <Button key={opt.s} variant="outline" size="sm" className={`w-full text-xs ${opt.cls}`} disabled={updateAppStatusMutation.isPending} onClick={() => updateAppStatusMutation.mutate({ id: selectedApp.id, status: opt.s, adminNotes: appNotesInput || undefined })}>
                      {updateAppStatusMutation.isPending && selectedApp.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Job Application Dialog */}
        <Dialog open={appDeleteDialogOpen} onOpenChange={(v) => { if (!v) { setAppDeleteDialogOpen(false); setAppDeletePassword(""); setAppDeletePasswordError(""); } }}>
          <DialogContent className="bg-card border-border max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <Trash2 className="h-5 w-5" />
                حذف طلب التقديم
              </DialogTitle>
            </DialogHeader>
            {appToDelete && (
              <div className="space-y-4 mt-1">
                <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 text-sm text-foreground">
                  <p className="font-bold">{appToDelete.jobTitle}</p>
                  {appToDelete.member?.displayName && (
                    <p className="text-muted-foreground mt-0.5 text-xs">العضو: {appToDelete.member.displayName}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">هذا الإجراء نهائي ولا يمكن التراجع عنه. أدخل كلمة مرور مدير النظام للتأكيد.</p>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">كلمة المرور</Label>
                  <Input
                    type="password"
                    value={appDeletePassword}
                    onChange={e => { setAppDeletePassword(e.target.value); setAppDeletePasswordError(""); }}
                    placeholder="أدخل كلمة المرور"
                    className="bg-muted/50 border-border focus:ring-red-500/30"
                    onKeyDown={e => { if (e.key === "Enter" && appDeletePassword) deleteAppMutation.mutate({ id: appToDelete.id, password: appDeletePassword }); }}
                    data-testid="input-delete-app-password"
                    autoFocus
                  />
                  {appDeletePasswordError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {appDeletePasswordError}
                    </p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => { setAppDeleteDialogOpen(false); setAppDeletePassword(""); setAppDeletePasswordError(""); }} className="flex-1">
                إلغاء
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 gap-1.5"
                disabled={!appDeletePassword || deleteAppMutation.isPending}
                onClick={() => deleteAppMutation.mutate({ id: appToDelete!.id, password: appDeletePassword })}
                data-testid="btn-confirm-delete-app"
              >
                {deleteAppMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                حذف نهائي
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Member Credits Panel */}
        {mainTab === "credits" && (
          <div className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <input
                      value={creditsSearch}
                      onChange={e => setCreditsSearch(e.target.value)}
                      placeholder="بحث باسم العضو أو رقم جواله..."
                      className="w-full pr-10 py-2 px-3 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchCredits()} className="gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    تحديث
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCredits.length === 0 ? (
                  <div className="text-center py-10">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">{creditsSearch ? "لا توجد نتائج للبحث" : "لا يوجد أعضاء لديهم رصيد"}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground text-right">العضو</TableHead>
                          <TableHead className="text-muted-foreground text-center">
                            <div className="flex items-center justify-center gap-1"><Rocket className="h-3.5 w-3.5 text-emerald-500" />رصيد التقديم</div>
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center">
                            <div className="flex items-center justify-center gap-1"><BrainCircuit className="h-3.5 w-3.5 text-blue-400" />رصيد تحليل السيرة الذاتية</div>
                          </TableHead>
                          <TableHead className="text-muted-foreground text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCredits.map((m: any) => (
                          <MemberCreditRow
                            key={m.memberId}
                            m={m}
                            isExpanded={expandedMemberId === m.memberId}
                            onToggle={() => setExpandedMemberId(expandedMemberId === m.memberId ? null : m.memberId)}
                            onAddJob={() => { setCreditDialog({ open: true, member: m, type: "job", action: "add" }); setCreditAmount(""); }}
                            onDeductJob={() => { setCreditDialog({ open: true, member: m, type: "job", action: "deduct" }); setCreditAmount(""); }}
                            onAddCv={() => { setCreditDialog({ open: true, member: m, type: "cv", action: "add" }); setCreditAmount(""); }}
                            onDeductCv={() => { setCreditDialog({ open: true, member: m, type: "cv", action: "deduct" }); setCreditAmount(""); }}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Credit Add/Deduct Dialog */}
        <Dialog open={creditDialog.open} onOpenChange={open => { if (!open) { setCreditDialog(d => ({ ...d, open: false })); setCreditAmount(""); setCreditReason(""); } }}>
          <DialogContent className="bg-card border-border max-w-sm" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {creditDialog.action === "add" ? <Plus className="h-5 w-5 text-emerald-500" /> : <Minus className="h-5 w-5 text-red-400" />}
                {creditDialog.action === "add" ? "إضافة" : "خصم"} رصيد {creditDialog.type === "job" ? "التقديم" : "الذكاء الاصطناعي"}
              </DialogTitle>
            </DialogHeader>
            {creditDialog.member && (
              <div className="space-y-4 mt-2">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="font-bold text-foreground">{creditDialog.member.displayName}</p>
                  {creditDialog.member.phone && <p className="text-xs text-muted-foreground mt-0.5">{creditDialog.member.phone}</p>}
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="text-muted-foreground">الرصيد الحالي:</span>
                    <span className={`font-bold ${creditDialog.type === "job" ? "text-emerald-400" : "text-blue-400"}`}>
                      {creditDialog.type === "job" ? creditDialog.member.jobCredits : creditDialog.member.cvCredits}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">الكمية</label>
                  <input
                    type="number"
                    min={1}
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    placeholder="أدخل الكمية..."
                    className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">السبب <span className="text-muted-foreground/60">(سيصل للعميل كإشعار)</span></label>
                  <textarea
                    value={creditReason}
                    onChange={e => setCreditReason(e.target.value)}
                    placeholder={creditDialog.action === "add" ? "مثال: تعويض عن تأخر في تنفيذ الطلب..." : "مثال: قدّمنا لك يدوياً على وظيفة شركة نادك..."}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className={`flex-1 ${creditDialog.action === "add" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}
                    disabled={!creditAmount || parseInt(creditAmount) < 1 || creditMutation.isPending}
                    onClick={() => creditMutation.mutate({ memberId: creditDialog.member.memberId, amount: parseInt(creditAmount), type: creditDialog.type, action: creditDialog.action, reason: creditReason.trim() || undefined })}
                  >
                    {creditMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (creditDialog.action === "add" ? "إضافة" : "خصم")}
                  </Button>
                  <Button variant="outline" className="border-border" onClick={() => { setCreditDialog(d => ({ ...d, open: false })); setCreditAmount(""); setCreditReason(""); }}>إلغاء</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Service Orders Section */}
        {mainTab === "orders" && (
        <>
        <div className="flex items-center justify-between gap-3">
          <Button
            onClick={() => {
              refetch();
              toast({ title: "جارٍ التحديث", description: "تم ارسال طلب تحديث البيانات" });
            }}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
            disabled={isFetching}
            data-testid="btn-refresh-orders"
          >
            <RefreshCw className={cn("h-4 w-4 ml-2", isFetching && "animate-spin")} />
            {isFetching ? "جارٍ التحديث..." : "تحديث"}
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2"
            data-testid="btn-create-manual-order"
          >
            <Plus className="h-4 w-4" />
            إنشاء طلب يدوي
          </Button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: "الكل", value: stats.total, color: "text-foreground", hover: "", filter: "all" },
            { label: "قيد المراجعة", value: stats.pending, color: "text-amber-400", hover: "hover:border-amber-500/30", filter: "pending" },
            { label: "قيد التنفيذ", value: stats.in_progress, color: "text-blue-400", hover: "hover:border-blue-500/30", filter: "in_progress" },
            { label: "تم التنفيذ", value: stats.completed, color: "text-green-400", hover: "hover:border-green-500/30", filter: "completed" },
            { label: "تأجيل الطلب", value: stats.deferred, color: "text-purple-400", hover: "hover:border-purple-500/30", filter: "deferred" },
            { label: "إلغاء الطلب", value: stats.cancelled, color: "text-red-400", hover: "hover:border-red-500/30", filter: "cancelled" },
          ].map(({ label, value, color, hover, filter }) => (
            <Card key={filter} className={`bg-card border-border cursor-pointer transition-all ${hover}`} onClick={() => setStatusFilter(filter)}>
              <CardContent className="p-2 text-center">
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                قائمة الطلبات
                {statusFilter !== "all" && (
                  <Badge variant="outline" className="mr-2 text-primary border-primary/30">
                    {STATUS_CONFIG[statusFilter]?.label}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    placeholder="بحث برقم الطلب أو الاسم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70"
                  />
                </div>
                {statusFilter !== "all" && (
                  <Button variant="ghost" onClick={() => setStatusFilter("all")} className="text-muted-foreground hover:text-foreground">
                    عرض الكل
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading || isFetching ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-10">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">لا توجد طلبات {statusFilter !== "all" ? "بهذه الحالة" : ""}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-right">رقم الطلب</TableHead>
                      <TableHead className="text-muted-foreground text-right">الخدمة</TableHead>
                      <TableHead className="text-muted-foreground text-right">العميل</TableHead>
                      <TableHead className="text-muted-foreground text-right">المبلغ</TableHead>
                      <TableHead className="text-muted-foreground text-right">الحالة</TableHead>
                      <TableHead className="text-muted-foreground text-right">التاريخ</TableHead>
                      <TableHead className="text-muted-foreground text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: any) => {
                      const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConfig.icon;
                      return (
                        <TableRow key={order.id} className="border-border/50 hover:bg-muted">
                          <TableCell className="font-mono text-primary font-bold">{order.orderNumber}</TableCell>
                          <TableCell>
                            <div className="text-foreground font-medium">{order.serviceName}</div>
                            {order.serviceVariant && (
                              <div className="text-muted-foreground text-xs">{order.serviceVariant}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-foreground">{order.customerName}</div>
                            <div className="text-muted-foreground text-xs">{order.customerPhone}</div>
                          </TableCell>
                          <TableCell className="text-primary font-bold">{order.amount} ريال</TableCell>
                          <TableCell>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="h-3 w-3 ml-1" />
                              {statusConfig.label}
                            </Badge>
                            {order.status === "cancelled" && order.cancellationReason && (
                              <div className="text-red-400/70 text-xs mt-1">{order.cancellationReason}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy", { locale: ar }) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleViewOrder(order)}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {order.customerPhone && (
                                <a
                                  href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '').replace(/^0/, '966')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors"
                                  title="تواصل عبر واتساب"
                                >
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                  </svg>
                                </a>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-muted">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-border">
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(order.id, "pending")}
                                    className="text-amber-400 hover:bg-muted cursor-pointer"
                                  >
                                    <Clock className="h-4 w-4 ml-2" />
                                    قيد المراجعة
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(order.id, "in_progress")}
                                    className="text-blue-400 hover:bg-muted cursor-pointer"
                                  >
                                    <Loader2 className="h-4 w-4 ml-2" />
                                    قيد التنفيذ
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(order.id, "completed")}
                                    className="text-green-400 hover:bg-muted cursor-pointer"
                                  >
                                    <CheckCircle className="h-4 w-4 ml-2" />
                                    تم التنفيذ
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(order.id, "deferred")}
                                    className="text-purple-400 hover:bg-muted cursor-pointer"
                                  >
                                    <PauseCircle className="h-4 w-4 ml-2" />
                                    تأجيل الطلب
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(order.id, "cancelled")}
                                    className="text-red-400 hover:bg-muted cursor-pointer"
                                  >
                                    <XCircle className="h-4 w-4 ml-2" />
                                    إلغاء الطلب
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteOrder(order)}
                                    className="text-red-500 hover:bg-red-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف الطلب
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        </>)}
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              تفاصيل الطلب
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div>
                  <div className="text-muted-foreground text-sm">رقم الطلب</div>
                  <div className="text-primary font-mono font-bold text-lg">{selectedOrder.orderNumber}</div>
                </div>
                <Badge className={STATUS_CONFIG[selectedOrder.status]?.color || STATUS_CONFIG.pending.color}>
                  {STATUS_CONFIG[selectedOrder.status]?.label || "قيد المراجعة"}
                </Badge>
              </div>

              {selectedOrder.status === "cancelled" && selectedOrder.cancellationReason && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    سبب الإلغاء
                  </div>
                  <div className="text-foreground">{selectedOrder.cancellationReason}</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <User className="h-4 w-4" />
                      اسم العميل
                    </div>
                    <div className="text-foreground font-bold">{selectedOrder.customerName}</div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Phone className="h-4 w-4" />
                      رقم الجوال
                    </div>
                    <div className="text-foreground font-mono" dir="ltr">{selectedOrder.customerPhone}</div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني
                    </div>
                    <div className="text-foreground text-sm" dir="ltr">{selectedOrder.customerEmail}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Package className="h-4 w-4" />
                      الخدمة
                    </div>
                    <div className="text-foreground font-bold">{selectedOrder.serviceName}</div>
                    {selectedOrder.serviceVariant && (
                      <div className="text-muted-foreground text-sm">{selectedOrder.serviceVariant}</div>
                    )}
                  </div>

                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <CreditCard className="h-4 w-4" />
                      المبلغ
                    </div>
                    <div className="text-primary font-bold text-xl">{selectedOrder.amount} ريال</div>
                    <div className="text-muted-foreground text-sm">تحويل بنكي - مصرف الراجحي</div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Calendar className="h-4 w-4" />
                      تاريخ الطلب
                    </div>
                    <div className="text-foreground">
                      {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "dd MMMM yyyy - hh:mm a", { locale: ar }) : "-"}
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <MessageSquare className="h-4 w-4" />
                    ملاحظات العميل
                  </div>
                  <div className="text-foreground">{selectedOrder.notes}</div>
                </div>
              )}

              {selectedOrder.receiptUrl && (
                <div className="p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                    <Image className="h-4 w-4" />
                    صورة إيصال التحويل
                  </div>
                  <a href={selectedOrder.receiptUrl} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={selectedOrder.receiptUrl} 
                      alt="Receipt" 
                      className="max-h-64 rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </a>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
                <Button 
                  onClick={() => handleStatusChange(selectedOrder.id, "in_progress")}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                  disabled={selectedOrder.status === "in_progress"}
                >
                  <Loader2 className="h-4 w-4 ml-2" />
                  قيد التنفيذ
                </Button>
                <Button 
                  onClick={() => handleStatusChange(selectedOrder.id, "completed")}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  disabled={selectedOrder.status === "completed"}
                >
                  <CheckCircle className="h-4 w-4 ml-2" />
                  تم التنفيذ
                </Button>
                <Button 
                  onClick={() => handleStatusChange(selectedOrder.id, "deferred")}
                  variant="outline"
                  className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                  disabled={selectedOrder.status === "deferred"}
                >
                  <PauseCircle className="h-4 w-4 ml-2" />
                  تأجيل
                </Button>
                <Button 
                  onClick={() => handleStatusChange(selectedOrder.id, "cancelled")}
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                  disabled={selectedOrder.status === "cancelled"}
                >
                  <XCircle className="h-4 w-4 ml-2" />
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-400" />
              إلغاء الطلب
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {orderToCancel && (
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="text-muted-foreground text-sm">رقم الطلب</div>
                <div className="text-primary font-mono font-bold">{orderToCancel.orderNumber}</div>
                <div className="text-foreground text-sm mt-1">{orderToCancel.serviceName}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-foreground">سبب الإلغاء</Label>
              <Select value={cancellationReason} onValueChange={setCancellationReason}>
                <SelectTrigger className="bg-muted/50 border-border text-foreground">
                  <SelectValue placeholder="اختر سبب الإلغاء" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CANCELLATION_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason} className="text-foreground hover:bg-muted">
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {cancellationReason === "أخرى (اكتب السبب)" && (
              <div className="space-y-2">
                <Label className="text-foreground">اكتب السبب</Label>
                <Textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="اكتب سبب الإلغاء..."
                  className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70 min-h-[80px]"
                />
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setOrderToCancel(null);
                setCancellationReason("");
                setCustomReason("");
              }}
              className="border-border text-foreground hover:bg-muted"
            >
              تراجع
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={updateStatusMutation.isPending || !cancellationReason || (cancellationReason === "أخرى (اكتب السبب)" && !customReason.trim())}
              className="bg-red-500 hover:bg-red-600"
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <XCircle className="h-4 w-4 ml-2" />
              )}
              تأكيد الإلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              حذف الطلب
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {orderToDelete && (
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="text-muted-foreground text-sm">رقم الطلب</div>
                <div className="text-primary font-mono font-bold">{orderToDelete.orderNumber}</div>
              </div>
            )}

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                <AlertTriangle className="h-4 w-4" />
                تحذير
              </div>
              <div className="text-foreground/80 text-sm">
                سيتم حذف الطلب نهائياً ولا يمكن استرجاعه. أدخل الكلمة السرية للتأكيد.
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground">الكلمة السرية</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeletePasswordError("");
                }}
                placeholder="أدخل الكلمة السرية..."
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70"
              />
              {deletePasswordError && (
                <p className="text-red-400 text-sm">{deletePasswordError}</p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setOrderToDelete(null);
                setDeletePassword("");
                setDeletePasswordError("");
              }}
              className="border-border text-foreground hover:bg-muted"
            >
              تراجع
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteOrderMutation.isPending || !deletePassword}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteOrderMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Trash2 className="h-4 w-4 ml-2" />
              )}
              تأكيد الحذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Manual Order Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetCreateDialog(); }}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              إنشاء طلب يدوي
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">

            {/* ===== Section 1: Service Cart ===== */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
                <Package className="h-4 w-4 text-primary" />
                الخدمات
                {cartItems.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mr-1">{cartItems.length}</Badge>
                )}
              </div>

              {/* Cart Items */}
              {cartItems.length > 0 && (
                <div className="space-y-1.5">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg border border-border/50">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{item.serviceName}</span>
                        {item.variantName && <span className="text-xs text-muted-foreground mr-2">({item.variantName})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{item.price} ريال</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Service Panel */}
              <div className="p-3 bg-muted/20 border border-dashed border-border rounded-xl space-y-2">
                <div className="text-xs text-muted-foreground font-medium">إضافة خدمة</div>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
                  <Input
                    placeholder="ابحث عن خدمة..."
                    value={serviceSearchQuery}
                    onChange={e => { setServiceSearchQuery(e.target.value); if (!e.target.value) setPendingService(null); }}
                    className="pr-9 h-8 text-sm bg-background border-border"
                    data-testid="input-service-search"
                  />
                </div>

                {pendingService ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg border border-primary/20">
                      <span className="text-sm font-medium text-foreground">{pendingService.title}</span>
                      <button onClick={() => { setPendingService(null); setPendingVariant(null); }} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {parseServiceVariants(pendingService.variants).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {parseServiceVariants(pendingService.variants).map((v: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => setPendingVariant(v)}
                            className={cn(
                              "px-2.5 py-1 rounded-md border text-xs transition-all cursor-pointer",
                              pendingVariant?.name === v.name
                                ? "border-primary bg-primary/10 text-primary font-medium"
                                : "border-border bg-muted/30 text-foreground hover:border-primary/40"
                            )}
                          >
                            {v.name}{v.price ? ` — ${v.price} ر` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={addToCart}
                      disabled={parseServiceVariants(pendingService.variants).length > 0 && !pendingVariant}
                      className="w-full h-7 gap-1.5 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      أضف للطلب
                      {(pendingVariant?.price ?? pendingService.price) ? ` (${pendingVariant?.price ?? pendingService.price} ريال)` : ""}
                    </Button>
                  </div>
                ) : serviceSearchQuery && (
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {filteredServices.length > 0 ? filteredServices.map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => { setPendingService(s); setPendingVariant(null); setServiceSearchQuery(""); }}
                        className="text-right p-2 rounded-lg border border-border bg-background hover:bg-muted hover:border-primary/30 transition-all cursor-pointer"
                        data-testid={`btn-select-service-${s.id}`}
                      >
                        <div className="font-medium text-foreground text-xs">{s.title}</div>
                        {s.price && <div className="text-xs text-primary mt-0.5">{s.price} ريال</div>}
                      </button>
                    )) : (
                      <div className="col-span-2 text-center text-muted-foreground text-xs py-3">لا توجد خدمات بهذا الاسم</div>
                    )}
                  </div>
                )}
              </div>

              {/* Totals & Discount */}
              {cartItems.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-xl border border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المجموع الفرعي</span>
                    <span className="font-medium">{cartSubtotal} ريال</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type="number"
                        placeholder="خصم"
                        value={discount}
                        onChange={e => setDiscount(e.target.value)}
                        className="h-8 text-sm bg-background border-border pl-16"
                        data-testid="input-discount"
                      />
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                        <button
                          onClick={() => setDiscountType("fixed")}
                          className={cn("px-1.5 py-0.5 rounded text-xs font-medium transition-colors", discountType === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                        >ر</button>
                        <button
                          onClick={() => setDiscountType("percent")}
                          className={cn("px-1.5 py-0.5 rounded text-xs font-medium transition-colors", discountType === "percent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                        >%</button>
                      </div>
                    </div>
                    {discountAmount > 0 && (
                      <span className="text-sm text-green-400">- {discountAmount} ريال</span>
                    )}
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                    <span className="text-foreground">الإجمالي</span>
                    <span className="text-primary">{cartFinalTotal} ريال</span>
                  </div>
                </div>
              )}
            </div>

            {/* ===== Section 2: Member ===== */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
                <User className="h-4 w-4 text-primary" />
                العميل
              </div>

              {selectedMember ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-xl">
                  <div>
                    <div className="font-medium text-foreground">{selectedMember.displayName}</div>
                    <div className="text-xs text-muted-foreground">{selectedMember.phone || selectedMember.email || ""}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setSelectedMember(null); setCreateForm(f => ({ ...f, customerName: "", customerPhone: "", customerEmail: "", memberId: null })); }}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : createMemberMode ? (
                <div className="space-y-3 p-4 bg-muted/30 border border-border rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4 text-primary" />
                      إنشاء حساب جديد
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setCreateMemberMode(false)} className="h-7 text-xs text-muted-foreground">إلغاء</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">الاسم الكامل <span className="text-red-400">*</span></Label>
                      <Input
                        placeholder="محمد علي"
                        value={newMemberForm.displayName}
                        onChange={e => { const v = e.target.value; setNewMemberForm(f => ({ ...f, displayName: v, username: f.username || v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") })); }}
                        className="bg-background border-border h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">اسم المستخدم <span className="text-red-400">*</span></Label>
                      <Input placeholder="mohamad_ali" value={newMemberForm.username} onChange={e => setNewMemberForm(f => ({ ...f, username: e.target.value }))} className="bg-background border-border h-8 text-sm" dir="ltr" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الجوال</Label>
                      <Input placeholder="05xxxxxxxx" value={newMemberForm.phone} onChange={e => setNewMemberForm(f => ({ ...f, phone: e.target.value }))} className="bg-background border-border h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">البريد الإلكتروني</Label>
                      <Input type="email" placeholder="example@email.com" value={newMemberForm.email} onChange={e => setNewMemberForm(f => ({ ...f, email: e.target.value }))} className="bg-background border-border h-8 text-sm" dir="ltr" />
                    </div>
                  </div>
                  <Button onClick={() => createMemberMutation.mutate(newMemberForm)} disabled={createMemberMutation.isPending || !newMemberForm.displayName || !newMemberForm.username} size="sm" className="w-full gap-2">
                    {createMemberMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                    إنشاء الحساب وربطه بالطلب
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input placeholder="ابحث بالاسم أو الجوال أو البريد..." value={memberSearchQuery} onChange={e => setMemberSearchQuery(e.target.value)} className="pr-10 bg-muted/50 border-border" data-testid="input-member-search" />
                  </div>
                  {memberSearchQuery.length >= 2 && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      {filteredMembers.length > 0 ? filteredMembers.slice(0, 6).map((m: any) => (
                        <button key={m.id} onClick={() => selectMember(m)} className="w-full text-right flex items-center gap-3 px-4 py-2.5 hover:bg-muted border-b border-border/50 last:border-0 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground text-sm">{m.displayName}</div>
                            <div className="text-xs text-muted-foreground truncate">{m.phone || m.email || m.username}</div>
                          </div>
                        </button>
                      )) : (
                        <div className="text-center py-4 space-y-2">
                          <p className="text-muted-foreground text-sm">لا يوجد عضو بهذا البحث</p>
                          <Button variant="outline" size="sm" onClick={() => { setCreateMemberMode(true); setNewMemberForm(f => ({ ...f, displayName: memberSearchQuery })); setMemberSearchQuery(""); }} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                            <UserPlus className="h-3.5 w-3.5" />إنشاء حساب جديد
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setCreateMemberMode(true)} className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5 w-full">
                    <UserPlus className="h-3.5 w-3.5" />إنشاء حساب جديد للعميل
                  </Button>
                  <div className="flex items-center gap-2"><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">أو أدخل بياناته يدوياً</span><div className="h-px flex-1 bg-border" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">الاسم <span className="text-red-400">*</span></Label>
                      <Input placeholder="الاسم الكامل" value={createForm.customerName} onChange={e => setCreateForm(f => ({ ...f, customerName: e.target.value }))} className="bg-muted/50 border-border" data-testid="input-customer-name" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الجوال <span className="text-red-400">*</span></Label>
                      <Input placeholder="05xxxxxxxx" value={createForm.customerPhone} onChange={e => setCreateForm(f => ({ ...f, customerPhone: e.target.value }))} className="bg-muted/50 border-border" data-testid="input-customer-phone" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">البريد الإلكتروني <span className="text-red-400">*</span></Label>
                      <Input type="email" placeholder="example@email.com" value={createForm.customerEmail} onChange={e => setCreateForm(f => ({ ...f, customerEmail: e.target.value }))} className="bg-muted/50 border-border" dir="ltr" data-testid="input-customer-email" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== Section 3: Receipt & Details ===== */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                تفاصيل الطلب
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">الحالة الابتدائية</Label>
                  <Select value={createForm.status} onValueChange={v => setCreateForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="bg-muted/50 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="pending">قيد المراجعة</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">تم التنفيذ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">وصل التحويل (اختياري)</Label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="receipt-upload"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast({ title: "خطأ", description: "الصورة يجب أن تكون أقل من 5MB", variant: "destructive" }); return; }
                        setReceiptFile(file);
                        const reader = new FileReader();
                        reader.onload = ev => setReceiptPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label htmlFor="receipt-upload" className={cn(
                      "flex items-center gap-1.5 px-3 h-9 rounded-md border text-sm cursor-pointer transition-colors",
                      receiptFile ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}>
                      <Image className="h-3.5 w-3.5" />
                      {receiptFile ? receiptFile.name.slice(0, 15) + (receiptFile.name.length > 15 ? "..." : "") : "رفع وصل"}
                    </label>
                  </div>
                </div>
                {receiptPreview && (
                  <div className="col-span-2 relative w-fit">
                    <img src={receiptPreview} alt="receipt" className="h-24 rounded-lg border border-border object-cover" />
                    <button onClick={() => { setReceiptFile(null); setReceiptPreview(null); }} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">ملاحظات</Label>
                  <Textarea placeholder="أي ملاحظات..." value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} className="bg-muted/50 border-border resize-none" rows={2} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2 pt-4 border-t border-border">
            <div className="flex-1 text-sm text-muted-foreground flex items-center">
              {cartItems.length > 0 && (
                <span>الإجمالي: <strong className="text-primary">{cartFinalTotal} ريال</strong></span>
              )}
            </div>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetCreateDialog(); }} className="border-border text-foreground hover:bg-muted">
              إلغاء
            </Button>
            <Button
              onClick={() => createOrderMutation.mutate()}
              disabled={
                createOrderMutation.isPending ||
                isUploading ||
                cartItems.length === 0 ||
                !createForm.customerName ||
                !createForm.customerPhone ||
                !createForm.customerEmail
              }
              className="gap-2"
              data-testid="btn-confirm-create-order"
            >
              {(createOrderMutation.isPending || isUploading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isUploading ? "جارٍ الرفع..." : "إنشاء الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
