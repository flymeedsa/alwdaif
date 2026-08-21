import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  Eye,
  Mail,
  Smartphone,
  Save,
  Loader2
} from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    twoFactorAuth: false,
    showOnlineStatus: true,
    language: "ar",
    timezone: "Asia/Riyadh",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "تم الحفظ",
          description: "تم حفظ الإعدادات بنجاح",
        });
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="إعدادات الحساب">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="إعدادات الحساب">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              إعدادات الإشعارات
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              تحكم في كيفية تلقي الإشعارات
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground/70" />
                <div>
                  <p className="text-foreground font-medium">إشعارات البريد الإلكتروني</p>
                  <p className="text-muted-foreground text-sm">استلام الإشعارات عبر البريد</p>
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                data-testid="switch-email-notifications"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground/70" />
                <div>
                  <p className="text-foreground font-medium">الإشعارات الفورية</p>
                  <p className="text-muted-foreground text-sm">إشعارات المتصفح الفورية</p>
                </div>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                data-testid="switch-push-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              إعدادات المظهر
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              تخصيص مظهر لوحة التحكم
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground/70" />
                <div>
                  <p className="text-foreground font-medium">الوضع الداكن</p>
                  <p className="text-muted-foreground text-sm">استخدام المظهر الداكن</p>
                </div>
              </div>
              <Switch
                checked={settings.darkMode}
                onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                data-testid="switch-dark-mode"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                اللغة
              </Label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full bg-muted/50 border border-border text-foreground rounded-lg px-4 py-2"
                data-testid="select-language"
              >
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">المنطقة الزمنية</Label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full bg-muted/50 border border-border text-foreground rounded-lg px-4 py-2"
                data-testid="select-timezone"
              >
                <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                <option value="Asia/Dubai">دبي (GMT+4)</option>
                <option value="Africa/Cairo">القاهرة (GMT+2)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              الأمان والخصوصية
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              إعدادات حماية حسابك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground/70" />
                <div>
                  <p className="text-foreground font-medium">المصادقة الثنائية</p>
                  <p className="text-muted-foreground text-sm">تفعيل المصادقة بخطوتين</p>
                </div>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
                data-testid="switch-two-factor"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-muted-foreground/70" />
                <div>
                  <p className="text-foreground font-medium">إظهار حالة الاتصال</p>
                  <p className="text-muted-foreground text-sm">السماح للآخرين برؤية حالتك</p>
                </div>
              </div>
              <Switch
                checked={settings.showOnlineStatus}
                onCheckedChange={(checked) => setSettings({ ...settings, showOnlineStatus: checked })}
                data-testid="switch-online-status"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2" disabled={isSaving} data-testid="button-save-settings">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ الإعدادات
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
