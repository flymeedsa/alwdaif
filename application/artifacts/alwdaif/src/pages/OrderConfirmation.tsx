import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Package, CreditCard, Clock, Phone, ArrowLeft, Home, Copy, MessageCircle, Info } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useToast } from "@/hooks/use-toast";

export default function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  usePageTitle("تأكيد الطلب");

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: async () => {
      const res = await fetch(`/api/service-orders/${orderNumber}`);
      if (!res.ok) throw new Error("Order not found");
      return res.json();
    },
    enabled: !!orderNumber,
  });

  const copyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber);
      toast({ title: "تم النسخ!", description: "تم نسخ رقم الطلب" });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-foreground mb-4">الطلب غير موجود</h1>
          <Button onClick={() => navigate("/store/services")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للخدمات
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>تأكيد الطلب</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-24 h-24 mx-auto rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">تم استلام طلبك بنجاح!</h1>
          <p className="text-muted-foreground text-lg">شكراً لثقتك بنا، سنتواصل معك قريباً</p>
        </div>

        {/* Order Details Card */}
        <Card className="bg-card border-border rounded-[2rem] overflow-hidden shadow-lg mb-6">
          <CardContent className="p-6 md:p-8">
            {/* Order Number */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              <span className="text-muted-foreground font-medium">رقم الطلب:</span>
              <div className="flex items-center gap-2">
                <span className="text-primary font-mono font-bold text-lg">{order.orderNumber}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyOrderNumber}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Service */}
              <div className="flex items-start gap-4 p-4 bg-muted/40 border border-border rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground text-sm">الخدمة</span>
                  <p className="text-foreground font-bold">{order.serviceName}</p>
                  {order.serviceVariant && (
                    <p className="text-muted-foreground text-sm">{order.serviceVariant}</p>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-start gap-4 p-4 bg-muted/40 border border-border rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground text-sm">المبلغ</span>
                  <p className="text-foreground font-bold">{order.amount} ريال</p>
                  <p className="text-muted-foreground text-sm">
                    تحويل بنكي - {order.paymentMethod === "bank_transfer" ? "مصرف الراجحي" : order.paymentMethod}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground text-sm">حالة الطلب</span>
                  <p className="text-amber-600 dark:text-amber-400 font-bold">قيد المراجعة</p>
                  <p className="text-muted-foreground text-sm">سيتم مراجعة الطلب والتواصل معك</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/40 border border-border rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <span className="text-muted-foreground text-sm">بيانات التواصل</span>
                  <p className="text-foreground font-bold">{order.customerName}</p>
                  <p className="text-muted-foreground text-sm">{order.customerPhone}</p>
                  <p className="text-muted-foreground text-sm">{order.customerEmail}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notice */}
        <Alert className="bg-blue-500/8 border-blue-500/25 mb-8 rounded-xl">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <span className="font-bold">ملاحظة:</span> سيتم التواصل معك عبر الواتساب أو البريد الإلكتروني خلال 24 ساعة لتأكيد الطلب وبدء العمل. يرجى الاحتفاظ برقم الطلب للمتابعة.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-6">
          <Button
            onClick={() => navigate("/store/services")}
            variant="outline"
            className="h-12 px-6 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            طلب خدمة أخرى
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="h-12 px-6 rounded-xl font-bold"
          >
            <Home className="h-4 w-4 mr-2" />
            الصفحة الرئيسية
          </Button>
        </div>

      </div>
    </Layout>
  );
}
