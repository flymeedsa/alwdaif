import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Wrench,
  AlertTriangle,
  Save,
  Loader2,
  Power
} from "lucide-react";

export default function AdminSiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("الموقع تحت الصيانة حالياً. يرجى المحاولة لاحقاً.");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/admin/site-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/site-settings", { credentials: "include" });
      if (!res.ok) return { maintenanceMode: false, maintenanceMessage: "" };
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setMaintenanceMode(settings.maintenanceMode || false);
      setMaintenanceMessage(settings.maintenanceMessage || "الموقع تحت الصيانة حالياً. يرجى المحاولة لاحقاً.");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ maintenanceMode, maintenanceMessage }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "تم الحفظ", description: "تم حفظ إعدادات الموقع بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-settings"] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل في حفظ الإعدادات", variant: "destructive" });
    },
  });

  return (
    <AdminLayout title="اغلاق الموقع">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <a href="/admin/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors inline-flex">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
          </a>
          <div>
            <h2 className="text-xl font-bold text-foreground">اغلاق الموقع</h2>
            <p className="text-muted-foreground text-sm mt-1">إدارة إعدادات الموقع العامة ووضع الصيانة</p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-1.5">
              <Power className="h-5 w-5 text-primary" />
              وضع الصيانة
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              عند تفعيل وضع الصيانة، سيتم إغلاق الموقع أمام الزوار وعرض رسالة الصيانة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <div>
                      <div className="text-foreground font-bold">
                        {maintenanceMode ? "الموقع مغلق للصيانة" : "الموقع يعمل بشكل طبيعي"}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {maintenanceMode ? "الزوار لا يستطيعون الوصول للموقع" : "الزوار يستطيعون الوصول للموقع"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={setMaintenanceMode}
                  />
                </div>

                {maintenanceMode && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      تحذير
                    </div>
                    <div className="text-foreground/80 text-sm">
                      وضع الصيانة مفعل. الموقع مغلق أمام جميع الزوار. فقط المشرفون يستطيعون الوصول للوحة التحكم.
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-foreground">رسالة الصيانة</Label>
                  <Textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="أدخل رسالة الصيانة التي ستظهر للزوار..."
                    className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/70 min-h-[100px]"
                  />
                  <p className="text-muted-foreground/70 text-xs">هذه الرسالة ستظهر للزوار عند محاولة الوصول للموقع أثناء الصيانة</p>
                </div>

                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <Save className="h-4 w-4 ml-2" />
                  )}
                  حفظ الإعدادات
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
