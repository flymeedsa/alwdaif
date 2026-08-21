import {
  Briefcase, Building, Building2, Users, UserCheck, UserPlus,
  Award, Trophy, Star, Crown,
  Send, Mail, Phone, MessageCircle, Bell, Megaphone, Radio, Wifi, MessageSquare,
  Zap, Cpu, Code, Globe, Lock, Shield, Database, Cloud, Smartphone, Monitor, Laptop,
  FileText, File, Clipboard, BookOpen, Book, Hash, ScrollText,
  Rocket, Sparkles, CheckCircle, Clock, Search, RefreshCw, Download, Upload, Target,
  DollarSign, CreditCard, Wallet, BarChart2, TrendingUp, PieChart, Banknote,
  MapPin, Compass, Navigation, Home, Flag,
  Heart, Settings, Wrench, Package, Gift, Calendar, Camera, Layers, Grid, Printer,
  type LucideIcon,
} from "lucide-react";

export const AD_ICON_MAP: Record<string, LucideIcon> = {
  Briefcase, Building, Building2, Users, UserCheck, UserPlus,
  Award, Trophy, Star, Crown,
  Send, Mail, Phone, MessageCircle, Bell, Megaphone, Radio, Wifi, MessageSquare,
  Zap, Cpu, Code, Globe, Lock, Shield, Database, Cloud, Smartphone, Monitor, Laptop,
  FileText, File, Clipboard, BookOpen, Book, Hash, ScrollText,
  Rocket, Sparkles, CheckCircle, Clock, Search, RefreshCw, Download, Upload, Target,
  DollarSign, CreditCard, Wallet, BarChart2, TrendingUp, PieChart, Banknote,
  MapPin, Compass, Navigation, Home, Flag,
  Heart, Settings, Wrench, Package, Gift, Calendar, Camera, Layers, Grid, Printer,
};

export const AD_ICON_NAMES = Object.keys(AD_ICON_MAP);

export const ICON_LABELS: Record<string, string> = {
  Briefcase: "حقيبة عمل وظيفة",
  Building: "مبنى مؤسسة",
  Building2: "مبنى شركة",
  Users: "مستخدمون فريق",
  UserCheck: "موظف مقبول",
  UserPlus: "إضافة موظف",
  Award: "جائزة تقدير",
  Trophy: "كأس مسابقة",
  Star: "نجمة مميز",
  Crown: "تاج ملكي",
  Send: "إرسال برقية",
  Mail: "بريد رسالة",
  Phone: "هاتف",
  MessageCircle: "رسالة محادثة",
  Bell: "إشعار جرس",
  Megaphone: "مكبر صوت إعلان",
  Radio: "راديو",
  Wifi: "واي فاي انترنت",
  MessageSquare: "مربع رسالة",
  Zap: "برق سرعة",
  Cpu: "معالج",
  Code: "برمجة كود",
  Globe: "كرة أرضية انترنت",
  Lock: "قفل أمان",
  Shield: "درع حماية",
  Database: "قاعدة بيانات",
  Cloud: "سحابة تخزين",
  Smartphone: "هاتف ذكي",
  Monitor: "شاشة كمبيوتر",
  Laptop: "لابتوب حاسوب",
  FileText: "ملف نص",
  File: "ملف",
  Clipboard: "لوحة مذكرة",
  BookOpen: "كتاب مفتوح تعليم",
  Book: "كتاب",
  Hash: "هاشتاق",
  ScrollText: "نص وثيقة",
  Rocket: "صاروخ إطلاق",
  Sparkles: "بريق مميز",
  CheckCircle: "تحقق موافقة",
  Clock: "ساعة وقت",
  Search: "بحث",
  RefreshCw: "تحديث",
  Download: "تنزيل",
  Upload: "رفع",
  Target: "هدف",
  DollarSign: "دولار مال",
  CreditCard: "بطاقة ائتمان",
  Wallet: "محفظة",
  BarChart2: "رسم بياني",
  TrendingUp: "نمو صعود",
  PieChart: "دائرة إحصاء",
  Banknote: "ورقة مالية",
  MapPin: "موقع خريطة",
  Compass: "بوصلة",
  Navigation: "ملاحة",
  Home: "منزل بيت",
  Flag: "علم",
  Heart: "قلب",
  Settings: "إعدادات",
  Wrench: "مفتاح ربط",
  Package: "حزمة",
  Gift: "هدية",
  Calendar: "تقويم",
  Camera: "كاميرا",
  Layers: "طبقات",
  Grid: "شبكة",
  Printer: "طابعة",
};

export function parseAdMedia(imageUrl: string | null | undefined):
  | { type: "icon"; name: string; IconComp: LucideIcon | null }
  | { type: "image"; url: string }
  | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("icon:")) {
    const name = imageUrl.slice(5);
    return { type: "icon", name, IconComp: AD_ICON_MAP[name] ?? null };
  }
  return { type: "image", url: imageUrl };
}
