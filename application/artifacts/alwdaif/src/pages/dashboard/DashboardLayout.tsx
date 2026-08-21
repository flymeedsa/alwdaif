import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Notification sound (same chime as admin panel) ──────────────────────────
let _memberAudioCtx: AudioContext | null = null;
function getMemberAudioCtx(): AudioContext | null {
  try {
    if (!_memberAudioCtx) _memberAudioCtx = new AudioContext();
    return _memberAudioCtx;
  } catch { return null; }
}
function unlockMemberAudio() {
  const ctx = getMemberAudioCtx();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}
function playMemberChime() {
  try {
    const ctx = getMemberAudioCtx();
    if (!ctx) return;
    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    resume.then(() => {
      const t = ctx.currentTime;
      function chime(freq: number, startAt: number, duration: number, vol: number) {
        const osc = ctx!.createOscillator(); const gain = ctx!.createGain();
        osc.type = "sine"; osc.frequency.setValueAtTime(freq, startAt);
        gain.gain.setValueAtTime(0, startAt);
        gain.gain.linearRampToValueAtTime(vol, startAt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
        osc.connect(gain); gain.connect(ctx!.destination);
        osc.start(startAt); osc.stop(startAt + duration);
        const osc2 = ctx!.createOscillator(); const gain2 = ctx!.createGain();
        osc2.type = "sine"; osc2.frequency.setValueAtTime(freq * 2.756, startAt);
        gain2.gain.setValueAtTime(0, startAt);
        gain2.gain.linearRampToValueAtTime(vol * 0.3, startAt + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, startAt + duration * 0.5);
        osc2.connect(gain2); gain2.connect(ctx!.destination);
        osc2.start(startAt); osc2.stop(startAt + duration * 0.5);
      }
      chime(1047, t, 1.2, 0.4);
      chime(784, t + 0.18, 1.4, 0.3);
    }).catch(() => {});
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────
import {
  LayoutDashboard,
  Users,
  Heart,
  ShoppingBag,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Home,
  BriefcaseBusiness,
  Megaphone,
  Newspaper,
  ArrowUpRight,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useCommunityAuth } from "@/hooks/use-community-auth";
import { FEATURE_FLAGS } from "@/config/featureFlags";

const navItems = [
  { label: "الرئيسية", path: "/dashboard", icon: LayoutDashboard },
  { label: "الإشعارات", path: "/dashboard/notifications", icon: Bell },
  { label: "تنبيهات الوظائف", path: "/dashboard/job-alerts", icon: BriefcaseBusiness },
  { label: "مفضلتي", path: "/dashboard/favorites", icon: Heart },
  ...(FEATURE_FLAGS.services ? [{ label: "طلباتي", path: "/dashboard/orders", icon: ShoppingBag }] : []),

  { label: "الملخص الأسبوعي", path: "/dashboard/weekly-subscription", icon: Newspaper },
  { label: "الإعلانات", path: "/dashboard/announcements", icon: Megaphone },
  ...(FEATURE_FLAGS.community ? [{ label: "المجتمع", path: "/dashboard/community", icon: Users }] : []),
  { label: "الدعم الفني", path: "/dashboard/support", icon: Headphones },
  { label: "حسابي", path: "/dashboard/account", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: authData, isLoading } = useCommunityAuth();

  const { data: unreadData } = useQuery({
    queryKey: ["/api/community/notifications/unread-count"],
    enabled: !!authData?.authenticated,
    refetchInterval: 30000,
  });
  const unreadCount = (unreadData as any)?.count || 0;

  const { data: unreadAnnouncementsData } = useQuery({
    queryKey: ["/api/community/notifications/announcements/unread-count"],
    enabled: !!authData?.authenticated,
    refetchInterval: 60000,
  });
  const unreadAnnouncementsCount = (unreadAnnouncementsData as any)?.count || 0;

  // Play chime when new notifications arrive
  const prevUnreadRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevUnreadRef.current === null) { prevUnreadRef.current = unreadCount; return; }
    if (unreadCount > prevUnreadRef.current) playMemberChime();
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlock = () => unlockMemberAudio();
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !authData?.authenticated) {
      setLocation("/login");
    }
  }, [isLoading, authData, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authData?.authenticated) return null;

  const member = authData.member;
  const currentPage = navItems.find(
    i => i.path === location || (i.path !== "/dashboard" && location.startsWith(i.path))
  );

  const handleLogout = async () => {
    await apiRequest("POST", "/api/community/logout", {});
    localStorage.removeItem("communityMember");
    localStorage.removeItem("communityToken");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full z-50 w-72 bg-card border-l border-border flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header — Brand */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex-1 flex justify-center">
            <img src="/logo.png" alt="إعلانات الوظائف" className="h-9 w-auto" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 absolute left-2"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Member info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            {member?.avatar ? (
              <img
                src={member.avatar}
                alt={member.displayName}
                className="w-11 h-11 rounded-full object-cover border-2 border-primary/25"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center text-primary text-base font-bold">
                {member?.displayName?.charAt(0) || "؟"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{member?.displayName}</p>
              <p className="text-xs text-muted-foreground truncate">@{member?.username}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/dashboard" && location.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isActive ? "bg-primary/15" : "bg-transparent"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                </div>
                <span>{item.label}</span>
                {item.path === "/dashboard/notifications" && unreadCount > 0 && (
                  <Badge className="mr-auto text-xs min-w-[20px] h-5 flex items-center justify-center bg-red-500 hover:bg-red-500 text-white border-0">
                    {unreadCount}
                  </Badge>
                )}
                {item.path === "/dashboard/announcements" && unreadAnnouncementsCount > 0 && (
                  <Badge className="mr-auto text-xs min-w-[20px] h-5 flex items-center justify-center bg-primary hover:bg-primary text-primary-foreground border-0">
                    {unreadAnnouncementsCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-border space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all"
          >
            <div className="p-1.5 rounded-md bg-transparent">
              <Home className="h-[18px] w-[18px] shrink-0" />
            </div>
            <span>الصفحة الرئيسية</span>
            <ArrowUpRight className="h-3.5 w-3.5 mr-auto opacity-50" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/8 transition-all"
          >
            <div className="p-1.5 rounded-md bg-transparent">
              <LogOut className="h-[18px] w-[18px] shrink-0" />
            </div>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pr-72 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border h-14 flex items-center px-4 gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb + page title */}
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1 text-muted-foreground">
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">الموقع</span>
            </Link>
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/50" />
            <Link href="/dashboard" className="hover:text-foreground transition-colors text-muted-foreground hidden sm:inline">
              لوحة التحكم
            </Link>
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/50 hidden sm:inline" />
            <span className="text-foreground font-bold">
              {currentPage?.label || "لوحة التحكم"}
            </span>
          </div>

          <div className="mr-auto flex items-center gap-2">
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card" />
                )}
              </Button>
            </Link>
            <Link href="/dashboard/account" className="flex items-center gap-2">
              {member?.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.displayName}
                  className="w-7 h-7 rounded-full object-cover border border-primary/20 cursor-pointer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold cursor-pointer">
                  {member?.displayName?.charAt(0) || "؟"}
                </div>
              )}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
