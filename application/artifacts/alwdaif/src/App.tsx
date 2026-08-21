import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import ScrollToTop from "@/components/ScrollToTop";
import MobileBottomNav from "@/components/MobileBottomNav";
import { FEATURE_FLAGS } from "@/config/featureFlags";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", direction: "rtl", padding: "20px", textAlign: "center", background: "#f8f9fa", color: "#333" }}>
          <h2 style={{ marginBottom: "12px", fontSize: "1.3rem" }}>حدث خطأ غير متوقع</h2>
          <p style={{ marginBottom: "20px", color: "#666" }}>يرجى إعادة تحميل الصفحة</p>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 24px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}>
            إعادة التحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const DashboardCommunity = lazy(() => import("@/pages/dashboard/DashboardCommunity"));
const DashboardFavorites = lazy(() => import("@/pages/dashboard/DashboardFavorites"));
const DashboardOrders = lazy(() => import("@/pages/dashboard/DashboardOrders"));
const DashboardNotifications = lazy(() => import("@/pages/dashboard/DashboardNotifications"));
const DashboardAccount = lazy(() => import("@/pages/dashboard/DashboardAccount"));
const DashboardJobAlerts = lazy(() => import("@/pages/dashboard/DashboardJobAlerts"));

const DashboardAnnouncements = lazy(() => import("@/pages/dashboard/DashboardAnnouncements"));
const DashboardAnnouncementView = lazy(() => import("@/pages/dashboard/DashboardAnnouncementView"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const JobDetails = lazy(() => import("@/pages/JobDetails"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPostDetails = lazy(() => import("@/pages/BlogPostDetails"));
const Results = lazy(() => import("@/pages/Results"));
const Contact = lazy(() => import("@/pages/Contact"));
const About = lazy(() => import("@/pages/About"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const PageView = lazy(() => import("@/pages/PageView"));
const Community = lazy(() => import("@/pages/Community"));
const CommunityPost = lazy(() => import("@/pages/CommunityPost"));
const CommunityLogin = lazy(() => import("@/pages/CommunityLogin"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NewCommunityPost = lazy(() => import("@/pages/NewCommunityPost"));
const EditCommunityPost = lazy(() => import("@/pages/EditCommunityPost"));
const Services = lazy(() => import("@/pages/Services"));
const ServiceDetails = lazy(() => import("@/pages/ServiceDetails"));
const OrderConfirmation = lazy(() => import("@/pages/OrderConfirmation"));
const Organizations = lazy(() => import("@/pages/Organizations"));
const OrganizationJobs = lazy(() => import("@/pages/OrganizationJobs"));
const DashboardWeeklySubscription = lazy(() => import("@/pages/dashboard/DashboardWeeklySubscription"));
const AdminWeeklySummary = lazy(() => import("@/pages/admin/AdminWeeklySummary"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminJobs = lazy(() => import("@/pages/admin/AdminJobs"));
const AdminOrganizations = lazy(() => import("@/pages/admin/AdminOrganizations"));
const AdminAdmins = lazy(() => import("@/pages/admin/AdminAdmins"));
const AdminPermissions = lazy(() => import("@/pages/admin/AdminPermissions"));
const AdminAds = lazy(() => import("@/pages/admin/AdminAds"));
const AdminSeo = lazy(() => import("@/pages/admin/AdminSeo"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminResetPassword = lazy(() => import("@/pages/admin/AdminResetPassword"));
const AdminProfile = lazy(() => import("@/pages/admin/AdminProfile"));
const AdminChangePassword = lazy(() => import("@/pages/admin/AdminChangePassword"));
const AdminNotifications = lazy(() => import("@/pages/admin/AdminNotifications"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminBlog = lazy(() => import("@/pages/admin/AdminBlog"));
const AdminBlogForm = lazy(() => import("@/pages/admin/AdminBlogForm"));
const AdminBlogHub = lazy(() => import("@/pages/admin/AdminBlogHub"));
const AdminBlogCategories = lazy(() => import("@/pages/admin/AdminBlogCategories"));
const AdminJobForm = lazy(() => import("@/pages/admin/AdminJobForm"));
const AdminMedia = lazy(() => import("@/pages/admin/AdminMedia"));
const AdminPages = lazy(() => import("@/pages/admin/AdminPages"));
const AdminServices = lazy(() => import("@/pages/admin/AdminServices"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminCommunityHub = lazy(() => import("@/pages/admin/AdminCommunityHub"));
const AdminCommunityPosts = lazy(() => import("@/pages/admin/AdminCommunityPosts"));
const AdminCommunityCategories = lazy(() => import("@/pages/admin/AdminCommunityCategories"));
const AdminCommunityMembers = lazy(() => import("@/pages/admin/AdminCommunityMembers"));
const AdminMembersHub = lazy(() => import("@/pages/admin/AdminMembersHub"));
const AdminBannedMembers = lazy(() => import("@/pages/admin/AdminBannedMembers"));
const AdminCommunityModerators = lazy(() => import("@/pages/admin/AdminCommunityModerators"));
const AdminCommunityPermissions = lazy(() => import("@/pages/admin/AdminCommunityPermissions"));
const AdminCommunityReports = lazy(() => import("@/pages/admin/AdminCommunityReports"));
const AdminCommunityModeratorRequests = lazy(() => import("@/pages/admin/AdminCommunityModeratorRequests"));
const AdminCommunityRanks = lazy(() => import("@/pages/admin/AdminCommunityRanks"));
const AdminJobsHub = lazy(() => import("@/pages/admin/AdminJobsHub"));
const AdminStoreHub = lazy(() => import("@/pages/admin/AdminStoreHub"))
const AdminStoreReports = lazy(() => import("@/pages/admin/AdminStoreReports"));
const AdminStaffHub = lazy(() => import("@/pages/admin/AdminStaffHub"));
const AdminSettingsHub = lazy(() => import("@/pages/admin/AdminSettingsHub"));
const AdminFaq = lazy(() => import("@/pages/admin/AdminFaq"));
const Faq = lazy(() => import("@/pages/Faq"));
const AdminJobReports = lazy(() => import("@/pages/admin/AdminJobReports"));
const AdminSiteSettings = lazy(() => import("@/pages/admin/AdminSiteSettings"));
const AdminHomePage = lazy(() => import("@/pages/admin/AdminHomePage"));
const AdminAnalytics = lazy(() => import("@/pages/admin/AdminAnalytics"));
const AdminAnnouncements = lazy(() => import("@/pages/admin/AdminAnnouncements"));
const AdminAnnouncementForm = lazy(() => import("@/pages/admin/AdminAnnouncementForm"));
const AdminSupport = lazy(() => import("@/pages/admin/AdminSupport"));
const AdminSupportTicket = lazy(() => import("@/pages/admin/AdminSupportTicket"));
const DashboardSupport = lazy(() => import("@/pages/dashboard/DashboardSupport"));
const DashboardSupportTicket = lazy(() => import("@/pages/dashboard/DashboardSupportTicket"));
const WeeklySummary = lazy(() => import("@/pages/WeeklySummary"));
const EmployerJobs = lazy(() => import("@/pages/EmployerJobs"));
const EmployerJobAdd = lazy(() => import("@/pages/EmployerJobAdd"));
const EmployerJobSubmitted = lazy(() => import("@/pages/EmployerJobSubmitted"));
const EmployerJobDetail = lazy(() => import("@/pages/EmployerJobDetail"));
const AdminEmployerJobs = lazy(() => import("@/pages/admin/AdminEmployerJobs"));
const AdminResultsHub = lazy(() => import("@/pages/admin/AdminResultsHub"));
const JobCredits = lazy(() => import("@/pages/JobCredits"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={DashboardHome} />
        {FEATURE_FLAGS.community && <Route path="/dashboard/community" component={DashboardCommunity} />}
        <Route path="/dashboard/favorites" component={DashboardFavorites} />
        {FEATURE_FLAGS.services && <Route path="/dashboard/orders" component={DashboardOrders} />}
        <Route path="/dashboard/notifications" component={DashboardNotifications} />
        <Route path="/dashboard/job-alerts" component={DashboardJobAlerts} />
        <Route path="/dashboard/announcements" component={DashboardAnnouncements} />
        <Route path="/dashboard/announcements/:id" component={DashboardAnnouncementView} />
        <Route path="/dashboard/support" component={DashboardSupport} />
        <Route path="/dashboard/support/:id" component={DashboardSupportTicket} />
        <Route path="/dashboard/account" component={DashboardAccount} />

        <Route path="/dashboard/weekly-subscription" component={DashboardWeeklySubscription} />
        {FEATURE_FLAGS.community && <Route path="/community" component={Community} />}
        {FEATURE_FLAGS.community && <Route path="/community/post/:id" component={CommunityPost} />}
        <Route path="/login" component={CommunityLogin} />
        <Route path="/community/login">{() => { window.location.replace("/login" + window.location.search); return null; }}</Route>
        <Route path="/community/reset-password" component={ResetPassword} />
        {FEATURE_FLAGS.community && <Route path="/community/new-post" component={NewCommunityPost} />}
        {FEATURE_FLAGS.community && <Route path="/community/edit-post/:id" component={EditCommunityPost} />}
        {/* Social redirects */}
        <Route path="/x">{() => { window.location.replace("https://x.com/alwdaif1"); return null; }}</Route>
        {/* Store Hub */}
        {FEATURE_FLAGS.services && <Route path="/store">{() => { window.location.replace("/store/services"); return null; }}</Route>}
        {FEATURE_FLAGS.services && <Route path="/store/services" component={Services} />}
        {FEATURE_FLAGS.services && <Route path="/store/services/job-credits" component={JobCredits} />}
        {FEATURE_FLAGS.services && <Route path="/store/services/:slug" component={ServiceDetails} />}
        {FEATURE_FLAGS.services && <Route path="/store/orders/:orderNumber" component={OrderConfirmation} />}
        {/* Jobs Hub — specific routes must come before /:category */}
        <Route path="/jobs/organizations" component={Organizations} />
        <Route path="/jobs/organizations/:id" component={OrganizationJobs} />
        <Route path="/results" component={Results} />
        <Route path="/jobs/results" component={Results} />
        <Route path="/jobs/post/:id" component={JobDetails} />
        <Route path="/jobs/employer/submitted" component={EmployerJobSubmitted} />
        <Route path="/jobs/employer/add" component={EmployerJobAdd} />
        <Route path="/jobs/employer/:id" component={EmployerJobDetail} />
        <Route path="/jobs/employer" component={EmployerJobs} />
        <Route path="/jobs/company/:company" component={Jobs} />
        <Route path="/jobs/:category" component={Jobs} />
        <Route path="/jobs" component={Jobs} />
        {/* Blog */}
        <Route path="/blog" component={Blog} />
        <Route path="/blog/:id" component={BlogPostDetails} />
        {/* Pages Hub */}
        <Route path="/faq" component={Faq} />
        <Route path="/pages/about" component={About} />
        <Route path="/pages/contact" component={Contact} />
        <Route path="/pages/terms" component={Terms} />
        <Route path="/pages/privacy" component={Privacy} />
        <Route path="/page/:slug" component={PageView} />
        {/* Legacy redirects — keep old paths working */}
        <Route path="/results" component={Results} />
        <Route path="/job/:id" component={JobDetails} />
        <Route path="/organizations" component={Organizations} />
        <Route path="/organizations/:id/jobs" component={OrganizationJobs} />
        {FEATURE_FLAGS.services && <Route path="/services" component={Services} />}
        {FEATURE_FLAGS.services && <Route path="/service/:slug" component={ServiceDetails} />}
        {FEATURE_FLAGS.services && <Route path="/order-confirmation/:orderNumber" component={OrderConfirmation} />}
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/reset-password" component={AdminResetPassword} />
        <Route path="/admin" component={AdminDashboard} />
        {/* Jobs Hub */}
        <Route path="/admin/jobs-hub" component={AdminJobsHub} />
        <Route path="/admin/jobs-hub/reports" component={AdminJobReports} />
        <Route path="/admin/jobs-hub/jobs" component={AdminJobs} />
        <Route path="/admin/jobs-hub/jobs/new" component={AdminJobForm} />
        <Route path="/admin/jobs-hub/jobs/edit/:id" component={AdminJobForm} />
        <Route path="/admin/jobs-hub/organizations" component={AdminOrganizations} />
        <Route path="/admin/jobs-hub/categories" component={AdminCategories} />
        <Route path="/admin/jobs-hub/employer-jobs" component={AdminEmployerJobs} />
        <Route path="/admin/jobs-hub/results" component={AdminResultsHub} />
        {/* Blog Hub */}
        <Route path="/admin/blog" component={AdminBlogHub} />
        <Route path="/admin/blog/posts" component={AdminBlog} />
        <Route path="/admin/blog/categories" component={AdminBlogCategories} />
        <Route path="/admin/blog/new" component={AdminBlogForm} />
        <Route path="/admin/blog/edit/:id" component={AdminBlogForm} />
        {/* Store Hub */}
        {FEATURE_FLAGS.services && <Route path="/admin/store" component={AdminStoreHub} />}
        {FEATURE_FLAGS.services && <Route path="/admin/store/reports" component={AdminStoreReports} />}
        {FEATURE_FLAGS.services && <Route path="/admin/store/orders" component={AdminOrders} />}
        {FEATURE_FLAGS.services && <Route path="/admin/store/services" component={AdminServices} />}
        {/* Staff Hub */}
        <Route path="/admin/staff" component={AdminStaffHub} />
        <Route path="/admin/staff/admins" component={AdminAdmins} />
        <Route path="/admin/staff/permissions" component={AdminPermissions} />
        {/* Settings Hub */}
        <Route path="/admin/settings" component={AdminSettingsHub} />
        <Route path="/admin/settings/analytics" component={AdminAnalytics} />
        <Route path="/admin/settings/pages" component={AdminPages} />
        <Route path="/admin/settings/media" component={AdminMedia} />
        <Route path="/admin/settings/announcements" component={AdminAnnouncements} />
        <Route path="/admin/settings/announcements/new" component={AdminAnnouncementForm} />
        <Route path="/admin/settings/announcements/edit/:id" component={AdminAnnouncementForm} />
        <Route path="/admin/settings/ads" component={AdminAds} />
        <Route path="/admin/settings/seo" component={AdminSeo} />
        <Route path="/admin/settings/homepage" component={AdminHomePage} />
        <Route path="/admin/settings/site" component={AdminSiteSettings} />
        <Route path="/admin/settings/weekly-summary" component={AdminWeeklySummary} />
        <Route path="/admin/settings/faq" component={AdminFaq} />
        <Route path="/admin/settings/twitter" component={lazy(() => import("@/pages/admin/AdminTwitter"))} />
        {/* Community Hub */}
        {FEATURE_FLAGS.community && <Route path="/admin/community" component={AdminCommunityHub} />}
        {FEATURE_FLAGS.community && <Route path="/admin/community/posts" component={AdminCommunityPosts} />}
        {FEATURE_FLAGS.community && <Route path="/admin/community/categories" component={AdminCommunityCategories} />}
        {FEATURE_FLAGS.community && <Route path="/admin/community/members" component={AdminCommunityMembers} />}
        {FEATURE_FLAGS.community && <Route path="/admin/community/moderators" component={AdminCommunityModerators} />}
        {FEATURE_FLAGS.community && <Route path="/admin/community/permissions" component={AdminCommunityPermissions} />}
        {FEATURE_FLAGS.community && <Route path="/admin/community/reports" component={AdminCommunityReports} />}
        {FEATURE_FLAGS.community && <Route path="/admin/community/moderator-requests" component={AdminCommunityModeratorRequests} />}
        {FEATURE_FLAGS.community && <Route path="/admin/community/ranks" component={AdminCommunityRanks} />}
        {/* Members Hub */}
        <Route path="/admin/members" component={AdminMembersHub} />
        <Route path="/admin/members/list" component={AdminCommunityMembers} />
        <Route path="/admin/members/banned" component={AdminBannedMembers} />
        {/* Profile & Auth */}
        <Route path="/admin/profile" component={AdminProfile} />
        <Route path="/admin/change-password" component={AdminChangePassword} />
        <Route path="/admin/notifications" component={AdminNotifications} />
        {/* Legacy redirects - keep old paths working */}
        <Route path="/admin/jobs" component={AdminJobs} />
        <Route path="/admin/jobs/new" component={AdminJobForm} />
        <Route path="/admin/jobs/edit/:id" component={AdminJobForm} />
        <Route path="/admin/organizations" component={AdminOrganizations} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/admins" component={AdminAdmins} />
        <Route path="/admin/permissions" component={AdminPermissions} />
        <Route path="/admin/ads" component={AdminAds} />
        <Route path="/admin/seo" component={AdminSeo} />
        <Route path="/admin/media" component={AdminMedia} />
        <Route path="/admin/pages" component={AdminPages} />
        {FEATURE_FLAGS.services && <Route path="/admin/services" component={AdminServices} />}
        {FEATURE_FLAGS.services && <Route path="/admin/orders" component={AdminOrders} />}
        <Route path="/admin/weekly-summary" component={AdminWeeklySummary} />
        <Route path="/admin/site-settings" component={AdminSiteSettings} />
        <Route path="/admin/homepage" component={AdminHomePage} />
        <Route path="/admin/analytics" component={AdminAnalytics} />
        <Route path="/admin/announcements" component={AdminAnnouncements} />
        <Route path="/admin/announcements/new" component={AdminAnnouncementForm} />
        <Route path="/admin/announcements/edit/:id" component={AdminAnnouncementForm} />
        <Route path="/admin/support" component={AdminSupport} />
        <Route path="/admin/support/:id" component={AdminSupportTicket} />
        <Route path="/weekly-summary" component={WeeklySummary} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppInner() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");
  return (
    <>
      <ScrollToTop />
      <Router />
      <Toaster />
      {!isAdminPage && <MobileBottomNav />}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppInner />
          </WouterRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
