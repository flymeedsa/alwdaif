import { Link, useLocation } from "wouter";
import { Briefcase, Building2, FileText, Shield, MessagesSquare, Home, ClipboardCheck, Users, Sparkles, LayoutDashboard, Bell, LogOut, User, Calendar, Newspaper, Tag, Star, Award, BookOpen, PlusCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOnlineCount, useOnlineTracking } from "@/hooks/useOnlineTracking";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCommunityMember } from "@/hooks/use-community-auth";
import { FEATURE_FLAGS } from "@/config/featureFlags";

export default function Header() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [moreOpen, setMoreOpen] = useState(false);

  const todayDate = useMemo(() => {
    const now = new Date();
    const hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
    const miladi = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
    return { hijri, miladi };
  }, []);

  useOnlineTracking();

  const { data: onlineData } = useOnlineCount();
  const onlineCount = onlineData?.count || 0;

  const { data: authData } = useCommunityMember();
  const member = authData?.member;
  const isLoggedIn = !!authData?.authenticated;

  const { data: unreadData } = useQuery({
    queryKey: ["/api/community/notifications/unread-count"],
    enabled: isLoggedIn,
    refetchInterval: 60000,
  });
  const unreadCount = (unreadData as any)?.count || 0;

  const handleLogout = async () => {
    await apiRequest("POST", "/api/community/logout", {});
    localStorage.removeItem("communityMember");
    localStorage.removeItem("communityToken");
    queryClient.setQueryData(["/api/community/me"], { authenticated: false });
    window.location.href = "/";
  };

  type NavIcon = React.ElementType;

  const ICON_MAP: Record<string, NavIcon> = {
    briefcase: Briefcase,
    "file-text": FileText,
    shield: Shield,
    "building-2": Building2,
    "clipboard-check": ClipboardCheck,
    tag: Tag,
    star: Star,
    award: Award,
    "book-open": BookOpen,
    users: Users,
    home: Home,
  };

  const slugIconMap: Record<string, NavIcon> = {
    all: Briefcase,
    civil: FileText,
    military: Shield,
    companies: Building2,
    results: ClipboardCheck,
  };

  const { data: rawCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories", "job"],
    queryFn: () => fetch("/api/categories?type=job").then(r => r.json()),
    staleTime: 60_000,
  });

  const main = useMemo(() => {
    const homeItem = { name: "الرئيسية", path: "/", icon: Home };

    if (!rawCategories.length) {
      return [
        homeItem,
        { name: "كل الوظائف", path: "/jobs", icon: Briefcase },
        { name: "وظائف مدنية", path: "/jobs/civil", icon: FileText },
        { name: "وظائف عسكرية", path: "/jobs/military", icon: Shield },
        { name: "وظائف شركات", path: "/jobs/companies", icon: Building2 },
      ];
    }

    const parent = rawCategories.find(c => c.parentId === null && c.slug === "all");
    const children = rawCategories
      .filter(c => c.isActive && c.parentId !== null && (parent ? c.parentId === parent.id : true))
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));

    const navItems: { name: string; path: string; icon: NavIcon }[] = [homeItem];

    if (parent) {
      navItems.push({
        name: parent.name,
        path: "/jobs",
        icon: (parent.icon ? ICON_MAP[parent.icon] : null) ?? slugIconMap[parent.slug] ?? Briefcase,
      });
    }

    for (const cat of children) {
      if (cat.slug === "results") continue;
      const path = `/jobs/${cat.slug}`;
      const icon = (cat.icon ? ICON_MAP[cat.icon] : null) ?? slugIconMap[cat.slug] ?? Tag;
      navItems.push({ name: cat.name, path, icon });
    }

    return navItems;
  }, [rawCategories]);

  const allItems = [
    ...main,
    { name: "وظائف أصحاب العمل", path: "/jobs/employer", icon: PlusCircle },
    { name: "نتائج التوظيف", path: "/results", icon: ClipboardCheck },
  ];

  const topLinks = [
    { name: "قائمة الجهات", path: "/jobs/organizations", icon: Building2 },
    ...(FEATURE_FLAGS.services ? [{ name: "خدماتنا", path: "/store/services", icon: Sparkles }] : []),
    { name: "المدونة", path: "/blog", icon: MessagesSquare },
    ...(FEATURE_FLAGS.community ? [{ name: "المجتمع", path: "/community", icon: Users }] : []),
    { name: "الملخص الأسبوعي", path: "/weekly-summary", icon: Newspaper },
  ];

  return (
    <div className="w-full" dir="rtl">
      {/* Top Info Bar — Desktop only */}
      <div className="hidden md:flex items-center justify-between border-b border-border/50 bg-muted/30 px-6 py-1.5 text-xs text-muted-foreground">
        {/* Right: Date */}
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-primary/70 shrink-0" />
          <span className="font-medium text-foreground/80">{todayDate.hijri}</span>
          <span className="text-border">|</span>
          <span>{todayDate.miladi}</span>
        </div>

        {/* Left: Links + Account */}
        <div className="flex items-center gap-1">
          {topLinks.map((link) => {
            const Icon = link.icon;
            const active = location === link.path || location.startsWith(link.path + "/");
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors font-medium ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                data-testid={`link-topbar-${link.path.replaceAll("/", "-")}`}
              >
                <Icon className="h-3 w-3" />
                {link.name}
              </Link>
            );
          })}

          <span className="w-px h-4 bg-border/70 mx-1" />

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors font-bold ${
                location.startsWith("/dashboard")
                  ? "text-primary bg-primary/10"
                  : "text-foreground/80 hover:text-primary hover:bg-primary/10"
              }`}
              data-testid="link-topbar-account"
            >
              {member?.avatar ? (
                <img src={member.avatar} alt={member.displayName} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center text-primary text-[10px] font-bold">
                  {member?.displayName?.charAt(0) || "م"}
                </div>
              )}
              حسابي
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-foreground/80 hover:text-primary hover:bg-primary/10 transition-colors font-bold"
              data-testid="link-topbar-login"
            >
              <User className="h-3 w-3" />
              حسابي
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Top Strip: Date + Online Visitors */}
      <div className="md:hidden flex items-center justify-between border-b border-border/50 bg-muted/20 px-3 py-1.5" data-testid="mobile-top-strip">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3 text-primary/60 shrink-0" />
          <span className="truncate max-w-[180px]">{todayDate.hijri}</span>
        </div>
        <div className="flex items-center gap-1.5" data-testid="online-visitors-strip-mobile">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          <span className="text-primary text-[11px] font-bold whitespace-nowrap">
            المتواجدون الآن: <span className="text-foreground font-bold">{onlineCount}</span>
          </span>
        </div>
      </div>

      {/* Main header row: Logo + Controls */}
      <div className="flex items-center justify-center md:justify-between gap-4 px-4 h-12 md:h-auto md:pt-4 md:pb-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center md:justify-start gap-3 min-w-0" data-testid="link-header-logo">
          <div className="p-0 rounded-2xl shadow-none ring-0 bg-transparent cursor-pointer">
            <img
              src="/logo.png"
              alt="شعار إعلانات الوظائف"
              className="h-9 md:h-10 w-auto max-w-[200px] sm:max-w-[250px] md:w-[400px] object-contain"
              data-testid="img-header-logo"
            />
          </div>
        </Link>

        {/* Desktop Right side: Online Count + Theme Toggle + User Menu */}
        <div className="hidden md:flex items-center gap-3 shrink-0 me-8 md:me-12">
          {/* Online Visitors */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25" data-testid="online-visitors-count">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <span className="text-primary text-sm font-bold whitespace-nowrap">
              المتواجدون الآن: <span className="text-foreground">{onlineCount}</span>
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Account Menu */}
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors" data-testid="button-user-menu">
                  {member?.avatar ? (
                    <img src={member.avatar} alt={member.displayName} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                      {member?.displayName?.charAt(0) || "؟"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground max-w-[100px] truncate">{member?.displayName}</span>
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="font-bold text-sm truncate">{member?.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{member?.username}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                    لوحة حسابي
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/notifications" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4 text-amber-400" />
                    الإشعارات
                    {unreadCount > 0 && (
                      <span className="mr-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{unreadCount}</span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4 text-blue-400" />
                    إعدادات الحساب
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-red-400 focus:text-red-400"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors text-sm font-medium text-foreground" data-testid="button-login">
                <User className="h-4 w-4 text-primary" />
                تسجيل الدخول
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 md:px-6 relative z-10">
        <div className="rounded-2xl border border-border/70 bg-card/80 shadow-lg shadow-black/25 hidden md:block">
          <nav className="flex items-center justify-start gap-1 p-2 overflow-x-auto whitespace-nowrap scrollbar-hide scroll-smooth no-scrollbar w-full" aria-label="أقسام الموقع" data-testid="nav-header-categories">
            <div className="flex items-center gap-1">
              {allItems.map((item) => {
                const active =
                  item.path === "/"
                    ? location === "/"
                    : item.path === "/jobs"
                    ? location === "/jobs"
                    : location === item.path || location.startsWith(item.path + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-2.5 py-1.5 rounded-xl text-sm font-bold transition-colors border inline-flex items-center gap-1.5 shrink-0 ${
                      active
                        ? "bg-primary/15 text-foreground border-primary/30"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent border-transparent"
                    }`}
                    data-testid={`link-category-${item.path.replaceAll("/", "-")}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
