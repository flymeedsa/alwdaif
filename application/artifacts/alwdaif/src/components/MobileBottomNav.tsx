import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home, Briefcase, Users, Grid3X3, X, FileText, BookOpen,
  ChevronLeft, LayoutDashboard, Bell, User, LogOut, Shield,
  ClipboardCheck, Sparkles, Settings, Heart, ShoppingBag,
  BriefcaseBusiness, Megaphone, Building2, Info, Phone,
  Newspaper, Send, Scale, Lock, Palette, PlusCircle
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCommunityMember } from "@/hooks/use-community-auth";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { FEATURE_FLAGS } from "@/config/featureFlags";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const [showJobs, setShowJobs] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  const queryClient = useQueryClient();
  const { data: authData } = useCommunityMember();
  const member = authData?.member;
  const isLoggedIn = !!authData?.authenticated;

  const { data: unreadData } = useQuery({
    queryKey: ["/api/community/notifications/unread-count"],
    enabled: isLoggedIn,
    refetchInterval: 60000,
  });
  const unreadCount = (unreadData as any)?.count || 0;

  const { data: unreadAnnouncementsData } = useQuery({
    queryKey: ["/api/community/notifications/announcements/unread-count"],
    enabled: isLoggedIn,
    refetchInterval: 60000,
  });
  const unreadAnnouncementsCount = (unreadAnnouncementsData as any)?.count || 0;

  const handleLogout = async () => {
    setShowAccount(false);
    await apiRequest("POST", "/api/community/logout", {});
    localStorage.removeItem("communityMember");
    localStorage.removeItem("communityToken");
    queryClient.setQueryData(["/api/community/me"], { authenticated: false });
    window.location.href = "/";
  };

  const jobsItems = [
    { label: "كل الوظائف", href: "/jobs", icon: <Briefcase className="h-5 w-5" /> },
    { label: "وظائف مدنية", href: "/jobs/civil", icon: <FileText className="h-5 w-5" /> },
    { label: "وظائف عسكرية", href: "/jobs/military", icon: <Shield className="h-5 w-5" /> },
    { label: "وظائف شركات", href: "/jobs/companies", icon: <Briefcase className="h-5 w-5" /> },
    { label: "وظائف أصحاب العمل", href: "/jobs/employer", icon: <PlusCircle className="h-5 w-5" /> },
    { label: "نتائج التوظيف", href: "/results", icon: <ClipboardCheck className="h-5 w-5" /> },
    { label: "قائمة الجهات", href: "/jobs/organizations", icon: <Building2 className="h-5 w-5" /> },
    { label: "الملخص الأسبوعي", href: "/weekly-summary", icon: <Newspaper className="h-5 w-5" /> },
  ];

  const categoryItems = [
    ...(FEATURE_FLAGS.services ? [{ label: "خدمات الباحثين عن عمل", href: "/store/services", icon: <Sparkles className="h-5 w-5" /> }] : []),
    { label: "المدونة", href: "/blog", icon: <BookOpen className="h-5 w-5" /> },
    { label: "من نحن", href: "/pages/about", icon: <Info className="h-5 w-5" /> },
    { label: "اتصل بنا", href: "/pages/contact", icon: <Phone className="h-5 w-5" /> },
    { label: "سياسة الخصوصية", href: "/pages/privacy", icon: <Lock className="h-5 w-5" /> },
    { label: "اتفاقية الاستخدام", href: "/pages/terms", icon: <Scale className="h-5 w-5" /> },
  ];

  const dashboardLinks = [
    { label: "لوحة حسابي", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    {
      label: "الإشعارات",
      href: "/dashboard/notifications",
      icon: <Bell className="h-5 w-5" />,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { label: "تنبيهات الوظائف", href: "/dashboard/job-alerts", icon: <BriefcaseBusiness className="h-5 w-5" /> },
    { label: "مفضلتي", href: "/dashboard/favorites", icon: <Heart className="h-5 w-5" /> },
    ...(FEATURE_FLAGS.services ? [{ label: "طلباتي", href: "/dashboard/orders", icon: <ShoppingBag className="h-5 w-5" /> }] : []),
    { label: "الملخص الأسبوعي", href: "/weekly-summary", icon: <Newspaper className="h-5 w-5" /> },
    {
      label: "الإعلانات",
      href: "/dashboard/announcements",
      icon: <Megaphone className="h-5 w-5" />,
      badge: unreadAnnouncementsCount > 0 ? unreadAnnouncementsCount : null,
    },
    ...(FEATURE_FLAGS.community ? [{ label: "المجتمع", href: "/dashboard/community", icon: <Users className="h-5 w-5" /> }] : []),
    { label: "إعدادات الحساب", href: "/dashboard/account", icon: <User className="h-5 w-5" /> },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const closeAll = () => {
    setShowJobs(false);
    setShowCategories(false);
    setShowAccount(false);
  };

  const anyOpen = showJobs || showCategories || showAccount;

  return (
    <>
      {anyOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={closeAll}
        />
      )}

      {/* Jobs Panel */}
      {showJobs && (
        <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 md:hidden max-h-[70vh] overflow-y-auto shadow-2xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-bold text-lg">الوظائف</h3>
              <button onClick={() => setShowJobs(false)} className="p-2 rounded-full bg-muted text-foreground" data-testid="close-jobs-panel">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {jobsItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAll}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-accent"
                  }`}
                  data-testid={`mobile-jobs-${item.href.replaceAll("/", "-")}`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories Panel */}
      {showCategories && (
        <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 md:hidden max-h-[70vh] overflow-y-auto shadow-2xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-bold text-lg">الأقسام</h3>
              <button onClick={() => setShowCategories(false)} className="p-2 rounded-full bg-muted text-foreground" data-testid="close-categories-panel">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categoryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAll}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-accent"
                  }`}
                  data-testid={`mobile-category-${item.href.replaceAll("/", "-")}`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Panel */}
      {showAccount && (
        <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border rounded-t-2xl z-50 md:hidden max-h-[85vh] overflow-y-auto shadow-2xl">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-bold text-lg">حسابي</h3>
              <button onClick={() => setShowAccount(false)} className="p-2 rounded-full bg-muted text-foreground" data-testid="close-account-panel">
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoggedIn ? (
              <>
                {/* Member Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 mb-3">
                  {member?.avatar ? (
                    <img src={member.avatar} alt={member.displayName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                      {member?.displayName?.charAt(0) || "م"}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm text-foreground">{member?.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{member?.username}</p>
                  </div>
                </div>

                {/* Dashboard Links */}
                <div className="space-y-2 mb-3">
                  {dashboardLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeAll}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                        isActive(item.href)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-accent"
                      }`}
                      data-testid={`mobile-account-${item.href.replaceAll("/", "-")}`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(item as any).badge && (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                            {(item as any).badge > 9 ? "9+" : (item as any).badge}
                          </span>
                        )}
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted mb-2">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-foreground" />
                    <span className="text-sm font-medium text-foreground">المظهر</span>
                  </div>
                  <ThemeToggle />
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                  data-testid="mobile-account-logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">تسجيل الخروج</span>
                </button>
              </>
            ) : (
              <>
                {/* Guest welcome */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">مرحباً بك</p>
                    <p className="text-xs text-muted-foreground">سجّل دخولك للاستفادة من جميع المزايا</p>
                  </div>
                </div>

                {/* Login */}
                <Link
                  href="/community/login"
                  onClick={closeAll}
                  className="flex items-center justify-between p-3 rounded-xl bg-primary text-primary-foreground mb-2"
                  data-testid="mobile-account-login"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-bold">تسجيل الدخول</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 opacity-70" />
                </Link>

                {/* Register */}
                <Link
                  href="/community/login?tab=register"
                  onClick={closeAll}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted text-foreground hover:bg-accent mb-2 transition-all"
                  data-testid="mobile-account-register"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold">تسجيل حساب جديد</span>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </Link>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-foreground" />
                    <span className="text-sm font-medium text-foreground">المظهر</span>
                  </div>
                  <ThemeToggle />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border z-50 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">

          {/* Home */}
          <Link
            href="/"
            onClick={closeAll}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
              isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="mobile-nav-home"
          >
            <div className={`p-1.5 rounded-lg ${isActive("/") ? "bg-primary/15" : ""}`}>
              <Home className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">الرئيسية</span>
          </Link>

          {/* Jobs */}
          <button
            onClick={() => { setShowJobs(!showJobs); setShowCategories(false); setShowAccount(false); }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
              showJobs || isActive("/jobs") || isActive("/jobs/organizations") || isActive("/weekly-summary")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="mobile-nav-jobs"
          >
            <div className={`p-1.5 rounded-lg ${showJobs ? "bg-primary/15" : ""}`}>
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">الوظائف</span>
          </button>

          {/* Community */}
          {FEATURE_FLAGS.community && (
            <Link
              href="/community"
              onClick={closeAll}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive("/community") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="mobile-nav-community"
            >
              <div className={`p-1.5 rounded-lg ${isActive("/community") ? "bg-primary/15" : ""}`}>
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">المجتمع</span>
            </Link>
          )}

          {/* Categories */}
          <button
            onClick={() => { setShowCategories(!showCategories); setShowJobs(false); setShowAccount(false); }}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
              showCategories || isActive("/blog") || isActive("/pages/about") || isActive("/pages/contact")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="mobile-nav-categories"
          >
            <div className={`p-1.5 rounded-lg ${showCategories ? "bg-primary/15" : ""}`}>
              <Grid3X3 className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium">الأقسام</span>
          </button>

          {/* Account */}
          {isLoggedIn ? (
            <button
              onClick={() => { setShowAccount(!showAccount); setShowJobs(false); setShowCategories(false); }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
                showAccount || isActive("/dashboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="mobile-nav-account"
            >
              {unreadCount > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold z-10">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <div className={`p-1.5 rounded-lg ${showAccount || isActive("/dashboard") ? "bg-primary/15" : ""}`}>
                {member?.avatar ? (
                  <img src={member.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs font-medium">حسابي</span>
            </button>
          ) : (
            <button
              onClick={() => { setShowAccount(!showAccount); setShowJobs(false); setShowCategories(false); }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
                showAccount ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="mobile-nav-account"
            >
              <div className={`p-1.5 rounded-lg ${showAccount ? "bg-primary/15" : ""}`}>
                <User className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium">تسجيل الدخول</span>
            </button>
          )}

        </div>
      </nav>
    </>
  );
}
