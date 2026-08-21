import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { Link } from "wouter";
import {
  ShoppingCart, Package, BarChart3, ArrowLeft, Clock, AlertTriangle,
} from "lucide-react";

export default function AdminStoreHub() {
  const { data: ordersData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/service-orders"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/service-orders");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: jobAppsData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/job-applications"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/job-applications");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: servicesData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/services"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/services");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const orders = Array.isArray(ordersData) ? ordersData : [];
  const jobApps = Array.isArray(jobAppsData) ? jobAppsData : [];
  const services = Array.isArray(servicesData) ? servicesData : [];

  const pendingCount =
    orders.filter((o: any) => o.status === "pending").length +
    jobApps.filter((o: any) => o.status === "pending").length;

  const pendingOrdersList = orders
    .filter((o: any) => o.status === "pending")
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const cards = [
    {
      title: "الطلبات",
      description: "عرض ومتابعة طلبات الخدمات المقدَّمة",
      icon: ShoppingCart,
      count: orders.length,
      href: "/admin/store/orders",
      gradient: "from-blue-500 to-blue-600",
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      title: "الخدمات",
      description: "إضافة وتعديل وحذف خدمات الموقع",
      icon: Package,
      count: services.length,
      href: "/admin/store/services",
      gradient: "from-green-500 to-green-600",
      badge: null,
    },
    {
      title: "التقارير",
      description: "إحصائيات مفصلة يومية وأسبوعية وشهرية وسنوية",
      icon: BarChart3,
      count: null,
      href: "/admin/store/reports",
      gradient: "from-purple-500 to-purple-600",
      badge: null,
    },
  ];

  return (
    <AdminLayout title="المتجر">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">المتجر</h1>
            <p className="text-muted-foreground text-sm">إدارة خدمات وطلبات المتجر</p>
          </div>
        </div>

        {/* 3-column cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 overflow-hidden group"
                data-testid={`card-store-${card.href.split("/").pop()}`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="relative">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-white`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                      {card.badge !== null && (
                        <Badge className="absolute -top-2 -left-2 h-5 min-w-5 px-1 text-xs bg-red-500 text-white border-0">
                          {card.badge}
                        </Badge>
                      )}
                    </div>
                    <span
                      className="text-3xl font-bold text-foreground/25 group-hover:text-foreground/40 transition-colors"
                      data-testid={`text-count-store-${card.href.split("/").pop()}`}
                    >
                      {card.count !== null ? card.count : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* آخر الطلبات قيد المراجعة */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-base">آخر الطلبات قيد المراجعة</CardTitle>
                  {pendingOrdersList.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pendingOrdersList.length} طلب يحتاج مراجعة
                    </p>
                  )}
                </div>
              </div>
              <Link href="/admin/store/orders">
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  عرض الكل
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 5-7 7 7 7" /><path d="M19 12H5" />
                  </svg>
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingOrdersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 opacity-30" />
                <p className="text-sm">لا توجد طلبات قيد المراجعة حالياً</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pendingOrdersList.map((order: any) => (
                  <Link key={order.id} href="/admin/store/orders?status=pending">
                    <div className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <ShoppingCart className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary text-sm">
                              {order.orderNumber || `#${order.id}`}
                            </span>
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs px-1.5 py-0">
                              قيد المراجعة
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground truncate mt-0.5">
                            {order.customerName || "—"} · {order.serviceName || order.serviceTitle || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="font-bold text-sm">{order.amount || order.total || 0} ر.س</div>
                          <div className="text-xs text-muted-foreground">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-SA") : "—"}
                          </div>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-primary transition-colors">
                          <path d="m12 5-7 7 7 7" /><path d="M19 12H5" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
