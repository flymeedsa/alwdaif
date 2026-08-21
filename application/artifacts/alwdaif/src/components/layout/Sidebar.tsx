import { Link, useLocation } from "wouter";
import { Briefcase, FileText, MessageSquare, Phone, User, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Sidebar() {
  const [location] = useLocation();

  const navLinks = [
    { name: "الرئيسية", path: "/", icon: <Home className="h-5 w-5" /> },
    { name: "الوظائف", path: "/jobs", icon: <Briefcase className="h-5 w-5" /> },
    { name: "نتائج التوظيف", path: "/jobs/results", icon: <FileText className="h-5 w-5" /> },
    { name: "المدونة", path: "/blog", icon: <FileText className="h-5 w-5" /> },
    { name: "المنتدى", path: "/forum", icon: <MessageSquare className="h-5 w-5" /> },
    { name: "تواصل معنا", path: "/pages/contact", icon: <Phone className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-full lg:w-72 bg-card/80 glass border-l border-border min-h-screen sticky top-0 h-screen overflow-y-auto flex flex-col shadow-2xl shadow-black/30 z-50">
      {/* Logo Area */}
      <div className="p-6 flex flex-col items-center border-b border-border bg-background/30">
        <Link href="/" className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="bg-white p-2 rounded-2xl shadow-xl shadow-blue-500/25 ring-1 ring-white/10">
            <img src="/logo.png" alt="شعار إعلانات الوظائف" className="h-16 w-auto object-contain" />
          </div>
          <span className="text-xl font-bold text-white font-heading mt-2">إعلانات الوظائف</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navLinks.map((link) => (
          <Link key={link.name} href={link.path}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group
              ${location === link.path 
                ? 'bg-primary/15 text-white ring-1 ring-primary/25' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`${location === link.path ? 'text-primary' : 'text-primary group-hover:text-blue-400'}`}>
                {link.icon}
              </span>
              <span className="font-medium text-base">{link.name}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* User / Login Section */}
      <div className="p-4 border-t border-border bg-background/30">
        <div className="bg-gradient-to-br from-primary/15 via-white/5 to-transparent p-4 rounded-2xl border border-primary/20 text-center space-y-3 shadow-lg shadow-black/20">
          <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
            <User className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-white text-sm">باحث عن عمل؟</h3>
          <p className="text-xs text-gray-400">سجل دخولك الآن للتقديم على الوظائف</p>
          <Link href="/login">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-blue-500/20">
              تسجيل الدخول
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
