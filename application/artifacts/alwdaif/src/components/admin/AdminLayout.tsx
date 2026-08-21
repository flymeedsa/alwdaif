import { useEffect, useRef, useState } from "react";
import { adminFetch, clearAdminToken } from "@/lib/adminAuth";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Briefcase, 
  ClipboardCheck, 
  FileText, 
  Building2,
  Users,
  Shield,
  Megaphone,
  Search,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Settings,
  User,
  Key,
  Bell,
  FolderOpen,
  Image,
  File,
  MessageSquare,
  Package,
  ShoppingCart,
  Trash2,
  Wrench,
  Home,
  ExternalLink,
  BarChart3,
  Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FEATURE_FLAGS } from "@/config/featureFlags";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const ALL_MENU_ITEMS = [
  { icon: LayoutDashboard, label: "نظرة عامة", href: "/admin",          moduleKey: "dashboard" },
  { icon: Briefcase,       label: "الوظائف",    href: "/admin/jobs-hub", moduleKey: "jobs" },
  ...(FEATURE_FLAGS.services ? [{ icon: ShoppingCart, label: "المتجر", href: "/admin/store", moduleKey: "store" }] : []),
  ...(FEATURE_FLAGS.community ? [{ icon: MessageSquare, label: "المجتمع", href: "/admin/community", moduleKey: "community" }] : []),
  { icon: FileText,        label: "المدونة",     href: "/admin/blog",     moduleKey: "blog" },
  { icon: Users,           label: "الأعضاء",     href: "/admin/members",  moduleKey: "members" },
  { icon: Users,           label: "الموظفين",    href: "/admin/staff",    moduleKey: "staff" },
  { icon: Headphones,      label: "الدعم الفني", href: "/admin/support",  moduleKey: "support" },
  { icon: Settings,        label: "الإعدادات",   href: "/admin/settings", moduleKey: "settings" },
];

function parseMenuPermissions(raw: string | null | undefined): Record<string, boolean> {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw);
    const result: Record<string, boolean> = {};
    for (const [mod, actions] of Object.entries(p)) {
      result[mod] = (actions as any)?.view === true;
    }
    return result;
  } catch { return {}; }
}

// Shared AudioContext — created once and resumed on first user interaction
let sharedAudioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContext();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

// Call this on any user gesture so the browser allows audio later
function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function playBellSound() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    resume.then(() => {
      const t = ctx.currentTime;

      function chime(freq: number, startAt: number, duration: number, vol: number) {
        // Main tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startAt);
        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(vol, startAt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startAt);
        osc.stop(startAt + duration);

        // Harmonic overtone (makes it sound like a real bell)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq * 2.756, startAt);
        gain2.gain.setValueAtTime(0, startAt);
        gain2.gain.linearRampToValueAtTime(vol * 0.3, startAt + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, startAt + duration * 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(startAt);
        osc2.stop(startAt + duration * 0.5);
      }

      // Two-note chime: high note then lower note (classic notification)
      chime(1047, t,        1.2, 0.45); // C6
      chime(784,  t + 0.18, 1.4, 0.35); // G5
    }).catch(() => {});
  } catch {}
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/admin/check-auth"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/check-auth");
      return res.json();
    },
  });

  const isAdmin = authData?.isAdmin === true;

  const { data: profile } = useQuery({
    queryKey: ["/api/admin/profile"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/profile");
      return res.json();
    },
    enabled: isAdmin,
    staleTime: 0,
  });

  const { data: meData } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/me");
      return res.json();
    },
    enabled: isAdmin,
    staleTime: 30000,
  });

  // Filter menu items based on permissions
  const menuItems = (() => {
    if (!meData) return ALL_MENU_ITEMS;
    if (meData.isSuperAdmin || meData.role === "super" || !meData.permissions) return ALL_MENU_ITEMS;
    const moduleAccess = parseMenuPermissions(meData.permissions);
    return ALL_MENU_ITEMS.filter(item => moduleAccess[item.moduleKey] !== false || Object.keys(moduleAccess).length === 0);
  })();

  const { data: ordersData } = useQuery({
    queryKey: ["/api/admin/service-orders"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/service-orders");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const { data: jobAppsData } = useQuery({
    queryKey: ["/api/admin/job-applications"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/job-applications");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const { data: supportCountData } = useQuery({
    queryKey: ["/api/admin/support/open-count"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/support/open-count");
      if (!res.ok) return { openComplaints: 0, totalOpen: 0 };
      return res.json();
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const openComplaintsCount: number = supportCountData?.openComplaints ?? 0;

  const pendingOrdersCount = 
    (Array.isArray(ordersData) ? ordersData.filter((o: any) => o.status === "pending").length : 0) +
    (Array.isArray(jobAppsData) ? jobAppsData.filter((o: any) => o.status === "pending").length : 0);

  const prevPendingRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevPendingRef.current === null) {
      prevPendingRef.current = pendingOrdersCount;
      return;
    }
    if (pendingOrdersCount > prevPendingRef.current) {
      playBellSound();
      const newCount = pendingOrdersCount - prevPendingRef.current;
      toast({
        title: `🛎️ طلب جديد في المتجر!`,
        description: `وصل ${newCount === 1 ? "طلب جديد" : `${newCount} طلبات جديدة`} — راجع المتجر الآن`,
      });
    }
    prevPendingRef.current = pendingOrdersCount;
  }, [pendingOrdersCount]);

  const prevComplaintsRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevComplaintsRef.current === null) {
      prevComplaintsRef.current = openComplaintsCount;
      return;
    }
    if (openComplaintsCount > prevComplaintsRef.current) {
      playBellSound();
      const newCount = openComplaintsCount - prevComplaintsRef.current;
      toast({
        title: `⚠️ شكوى جديدة في الدعم الفني!`,
        description: `وصل ${newCount === 1 ? "شكوى جديدة" : `${newCount} شكاوى جديدة`} — راجع الدعم الفني الآن`,
      });
    }
    prevComplaintsRef.current = openComplaintsCount;
  }, [openComplaintsCount]);

  // Unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    const unlock = () => { unlockAudio(); };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  const handleLogout = async () => {
    await adminFetch("/api/admin/logout", { method: "POST" });
    clearAdminToken();
    queryClient.clear();
    setLocation("/admin/login");
  };

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/admin/login");
    }
  }, [isLoading, isAdmin, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const currentMenuItem = menuItems.find(item => location === item.href || (item.href !== "/admin" && location.startsWith(item.href)));
  const pageTitle = currentMenuItem ? `${currentMenuItem.label} | لوحة التحكم` : `${title} | لوحة التحكم`;
  const displayTitle = currentMenuItem ? currentMenuItem.label : title;

  const ProfileDropdown = () => (
    <DropdownMenuContent align="start" className="w-64">
      <DropdownMenuLabel className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-border">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <Shield className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <p className="text-foreground font-bold">{profile?.name || "مشرف"}</p>
            <p className="text-muted-foreground text-sm">{profile?.email || ""}</p>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <Link href="/admin/profile">
        <DropdownMenuItem className="cursor-pointer gap-3 py-3">
          <User className="h-4 w-4" /><span>الملف الشخصي</span>
        </DropdownMenuItem>
      </Link>
      <Link href="/admin/settings">
        <DropdownMenuItem className="cursor-pointer gap-3 py-3">
          <Settings className="h-4 w-4" /><span>إعدادات الحساب</span>
        </DropdownMenuItem>
      </Link>
      <Link href="/admin/change-password">
        <DropdownMenuItem className="cursor-pointer gap-3 py-3">
          <Key className="h-4 w-4" /><span>تغيير كلمة المرور</span>
        </DropdownMenuItem>
      </Link>
      <Link href="/admin/notifications">
        <DropdownMenuItem className="cursor-pointer gap-3 py-3">
          <Bell className="h-4 w-4" /><span>الإشعارات</span>
        </DropdownMenuItem>
      </Link>
      <DropdownMenuSeparator />
      <a href="/" target="_blank" rel="noopener noreferrer">
        <DropdownMenuItem className="cursor-pointer gap-3 py-3">
          <ExternalLink className="h-4 w-4" /><span>عرض الموقع</span>
        </DropdownMenuItem>
      </a>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout} className="text-red-500 hover:text-red-500 hover:bg-red-500/10 cursor-pointer gap-3 py-3">
        <LogOut className="h-4 w-4" /><span>تسجيل الخروج</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  const SidebarContent = ({ mobile = false }) => (
    <>
      <nav className="space-y-0.5 px-3 py-4">
        {menuItems.map((item, index) => {
          const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
          const showStoreBadge = item.href === "/admin/store" && pendingOrdersCount > 0;
          const showSupportBadge = item.href === "/admin/support" && openComplaintsCount > 0;
          const showBadge = showStoreBadge || showSupportBadge;
          const badgeCount = showStoreBadge ? pendingOrdersCount : openComplaintsCount;
          const badgeColor = showSupportBadge ? "bg-orange-500" : "bg-red-500";
          return (
            <div key={item.href}>
              <Link href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => mobile && setMobileMenuOpen(false)}
                >
                  {(sidebarOpen || mobile) && (
                    <span className="font-bold flex-1 text-right flex items-center gap-2 text-[15px]">
                      {item.label}
                      {showBadge && (
                        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white ${badgeColor} rounded-full animate-pulse`}>
                          {badgeCount}
                        </span>
                      )}
                    </span>
                  )}
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarOpen && !mobile && showBadge && (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white ${badgeColor} rounded-full flex items-center justify-center animate-pulse`}>
                      {badgeCount}
                    </span>
                  )}
                </div>
              </Link>
              {(sidebarOpen || mobile) && index < menuItems.length - 1 && (
                <div className="mx-4 my-0.5 border-t border-border/40" />
              )}
            </div>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex" dir="rtl">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Sidebar — Desktop */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-card border-l border-border transition-all duration-300 shrink-0",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}>
        {/* Logo / Toggle */}
        <div className="p-4 border-b border-border flex items-center justify-between h-16">
          {sidebarOpen && (
            <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
            </a>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform", !sidebarOpen && "rotate-180")} />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <SidebarContent />
        </ScrollArea>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-muted w-full",
              sidebarOpen ? "justify-start" : "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="mr-2">تسجيل الخروج</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="text-muted-foreground">
          <Menu className="h-6 w-6" />
        </Button>
        <span className="text-base font-bold text-primary">إعلانات الوظائف</span>
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full bg-primary/15 border border-border flex items-center justify-center overflow-hidden">
                {profile?.avatar
                  ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  : <Shield className="h-4 w-4 text-primary" />}
              </button>
            </DropdownMenuTrigger>
            <ProfileDropdown />
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="absolute right-0 top-0 bottom-0 w-72 bg-card shadow-2xl border-l border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between h-14">
              <span className="text-lg font-bold text-primary">لوحة التحكم</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <SidebarContent mobile />
            </ScrollArea>
            <div className="p-3 border-t border-border">
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted">
                <LogOut className="h-5 w-5" />
                <span className="mr-2">تسجيل الخروج</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-card border-b border-border px-6 h-16 items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">{displayTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 rounded-full bg-primary/15 border border-border flex items-center justify-center cursor-pointer hover:shadow-md hover:shadow-primary/20 transition-all overflow-hidden"
                  data-testid="button-admin-profile"
                >
                  {profile?.avatar
                    ? <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    : <Shield className="h-4 w-4 text-primary" />}
                </button>
              </DropdownMenuTrigger>
              <ProfileDropdown />
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 pt-18 lg:pt-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
