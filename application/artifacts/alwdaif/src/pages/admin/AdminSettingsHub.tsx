import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import {
  BarChart3,
  File,
  Image,
  Megaphone,
  Bell,
  Search,
  Home,
  Power,
  ArrowLeft,
  Newspaper,
  HelpCircle,
  Scale,
  Shield,
  ExternalLink,
  Twitter,
} from "lucide-react";

const cards = [
  {
    title: "التحليل الذكي",
    description: "نظرة شاملة على أداء الموقع مدعومة بالذكاء الاصطناعي",
    icon: BarChart3,
    href: "/admin/settings/analytics",
    gradient: "from-purple-500 to-purple-600",
  },
  {
    title: "الصفحات",
    description: "إدارة صفحات الموقع وتعديل محتواها",
    icon: File,
    href: "/admin/settings/pages",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    title: "مكتبة الوسائط",
    description: "رفع وإدارة الصور والملفات المستخدمة في الموقع",
    icon: Image,
    href: "/admin/settings/media",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    title: "إعلانات الإدارة",
    description: "إرسال إعلانات وتنبيهات لأعضاء المنصة",
    icon: Megaphone,
    href: "/admin/settings/announcements",
    gradient: "from-orange-500 to-orange-600",
  },
  {
    title: "إعلانات الموقع",
    description: "إدارة البنرات والإعلانات الظاهرة للزوار",
    icon: Bell,
    href: "/admin/settings/ads",
    gradient: "from-yellow-500 to-yellow-600",
  },
  {
    title: "سيو الموقع",
    description: "تحسين ظهور الموقع في محركات البحث",
    icon: Search,
    href: "/admin/settings/seo",
    gradient: "from-cyan-500 to-cyan-600",
  },
  {
    title: "اعدادات الصفحات",
    description: "تحكم في أقسام وترتيب الصفحة الرئيسية للزوار",
    icon: Home,
    href: "/admin/settings/homepage",
    gradient: "from-pink-500 to-pink-600",
  },
  {
    title: "اغلاق الموقع",
    description: "إدارة إعدادات الموقع العامة ووضع الصيانة",
    icon: Power,
    href: "/admin/settings/site",
    gradient: "from-gray-500 to-gray-600",
  },
  {
    title: "الملخص الأسبوعي",
    description: "إدارة المشتركين وتوليد الملخصات الأسبوعية يدوياً",
    icon: Newspaper,
    href: "/admin/settings/weekly-summary",
    gradient: "from-teal-500 to-teal-600",
  },
  {
    title: "الأسئلة الشائعة",
    description: "إدارة الأسئلة والأجوبة الشائعة المعروضة للأعضاء",
    icon: HelpCircle,
    href: "/admin/settings/faq",
    gradient: "from-violet-500 to-violet-600",
  },
  {
    title: "النشر في X / Twitter",
    description: "إدارة النشر التلقائي واليدوي لمحتوى الموقع في X",
    icon: Twitter,
    href: "/admin/settings/twitter",
    gradient: "from-sky-500 to-sky-600",
  },
  {
    title: "شروط الاستخدام",
    description: "عرض ومراجعة صفحة شروط الاستخدام الظاهرة للزوار",
    icon: Scale,
    href: "/pages/terms",
    gradient: "from-slate-500 to-slate-600",
    external: true,
  },
  {
    title: "سياسة الخصوصية",
    description: "عرض ومراجعة صفحة سياسة الخصوصية الظاهرة للزوار",
    icon: Shield,
    href: "/pages/privacy",
    gradient: "from-stone-500 to-stone-600",
    external: true,
  },
];

export default function AdminSettingsHub() {
  return (
    <AdminLayout title="الإعدادات">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">الإعدادات</h1>
            <p className="text-gray-500 dark:text-gray-400">إعدادات وأدوات إدارة الموقع</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const cardEl = (
              <Card
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 overflow-hidden group"
                data-testid={`card-settings-${card.href.split("/").pop()}`}
              >
                <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="pb-2">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-white w-fit relative`}>
                    <card.icon className="h-5 w-5" />
                    {"external" in card && card.external && (
                      <ExternalLink className="absolute -top-1 -left-1 h-3 w-3 text-white/80" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-base mb-1">{card.title}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
                </CardContent>
              </Card>
            );
            if ("external" in card && card.external) {
              return (
                <a key={card.href} href={card.href} target="_blank" rel="noopener noreferrer">
                  {cardEl}
                </a>
              );
            }
            return (
              <Link key={card.href} href={card.href}>
                {cardEl}
              </Link>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
