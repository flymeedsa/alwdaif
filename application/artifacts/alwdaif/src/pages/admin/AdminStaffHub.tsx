import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/adminAuth";
import { Link } from "wouter";
import { Users, Shield, ArrowLeft } from "lucide-react";

export default function AdminStaffHub() {
  const { data: adminsData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/admins"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/admins");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: permsData = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/permissions"],
    queryFn: async () => {
      const res = await adminFetch("/api/admin/permissions");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const admins = Array.isArray(adminsData) ? adminsData : [];
  const perms = Array.isArray(permsData) ? permsData : [];

  const cards = [
    {
      title: "الموظفين",
      description: "إضافة وإدارة موظفي لوحة التحكم ومنحهم صلاحيات الدخول",
      icon: Users,
      count: admins.length,
      href: "/admin/staff/admins",
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: "صلاحيات الموظفين",
      description: "إدارة صلاحيات النظام وتحديد الوصول لكل قسم",
      icon: Shield,
      count: perms.length,
      href: "/admin/staff/permissions",
      gradient: "from-violet-500 to-violet-600",
    },
  ];

  return (
    <AdminLayout title="الموظفين">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">الموظفين</h1>
            <p className="text-gray-500 dark:text-gray-400">إدارة موظفي الموقع وصلاحياتهم</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link key={card.href} href={card.href}>
              <Card
                className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 overflow-hidden group"
                data-testid={`card-staff-${card.href.split("/").pop()}`}
              >
                <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${card.gradient} text-white`}>
                      <card.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold text-gray-200 dark:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-600 transition-colors">
                      {card.count}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{card.title}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
