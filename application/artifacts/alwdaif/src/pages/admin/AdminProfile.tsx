import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminFetch } from "@/lib/adminAuth";
import { Shield, Camera, Mail, MapPin, Globe, Save, Loader2, Upload } from "lucide-react";

export default function AdminProfile() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState({
    name: "مشرف",
    email: "flymeedsa@gmail.com",
    avatar: "",
    location: "المملكة العربية السعودية",
    bio: "مشرف على موقع إعلانات الوظائف",
    website: "",
  });

  useEffect(() => {
    adminFetch("/api/admin/profile")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      setProfile(prev => ({ ...prev, avatar: data.url }));
      toast({
        title: "تم الرفع",
        description: "تم رفع الصورة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast({
          title: "تم الحفظ",
          description: "تم حفظ بيانات الملف الشخصي بنجاح",
        });
        setIsEditing(false);
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حفظ البيانات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="الملف الشخصي">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="الملف الشخصي">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card border-border overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent"></div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-4 border-[#1e293b] overflow-hidden group">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="h-16 w-16 text-foreground" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-foreground" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <button 
                  className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors shadow-lg" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  type="button"
                  data-testid="button-change-avatar"
                >
                  <Camera className="h-4 w-4 text-foreground" />
                </button>
              </div>
              <div className="flex-1 text-center sm:text-right pb-4">
                <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
              <Button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="mb-4"
                disabled={isSaving}
                data-testid="button-edit-profile"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : isEditing ? (
                  <Save className="h-4 w-4 ml-2" />
                ) : null}
                {isEditing ? "حفظ التغييرات" : "تعديل الملف الشخصي"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">المعلومات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">الاسم الكامل</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className="bg-muted/50 border-border text-foreground disabled:opacity-70"
                  data-testid="input-profile-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted/50 border-border text-foreground pr-10 disabled:opacity-70 text-left"
                    dir="ltr"
                    data-testid="input-profile-email"
                  />
                </div>
              </div>
              {isEditing && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">رابط الصورة الشخصية</Label>
                  <div className="relative">
                    <Camera className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      value={profile.avatar}
                      onChange={(e) => setProfile({ ...profile, avatar: e.target.value })}
                      placeholder="https://example.com/avatar.png"
                      className="bg-muted/50 border-border text-foreground pr-10 text-left"
                      dir="ltr"
                      data-testid="input-profile-avatar"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">معلومات إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">الموقع</Label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    disabled={!isEditing}
                    className="bg-muted/50 border-border text-foreground pr-10 disabled:opacity-70"
                    data-testid="input-profile-location"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">الموقع الإلكتروني</Label>
                <div className="relative">
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    disabled={!isEditing}
                    placeholder="https://example.com"
                    className="bg-muted/50 border-border text-foreground pr-10 disabled:opacity-70 text-left"
                    dir="ltr"
                    data-testid="input-profile-website"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">نبذة عني</Label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="bg-muted/50 border-border text-foreground disabled:opacity-70 resize-none"
                  data-testid="input-profile-bio"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">إحصائيات النشاط</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-3xl font-bold text-primary">156</p>
                <p className="text-muted-foreground text-sm mt-1">وظيفة مضافة</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-3xl font-bold text-green-400">89</p>
                <p className="text-muted-foreground text-sm mt-1">مقال منشور</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-3xl font-bold text-purple-400">234</p>
                <p className="text-muted-foreground text-sm mt-1">نتيجة مضافة</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-xl">
                <p className="text-3xl font-bold text-orange-400">45</p>
                <p className="text-muted-foreground text-sm mt-1">جهة مضافة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
