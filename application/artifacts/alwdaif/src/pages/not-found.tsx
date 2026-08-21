import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("الصفحة غير موجودة");
  return (
    <Layout>
      <div className="min-h-[80vh] w-full flex items-center justify-center bg-gray-50 dark:bg-background">
        <Card className="w-full max-w-md mx-4 shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold font-heading text-foreground">404 الصفحة غير موجودة</h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.
            </p>
            
            <div className="mt-6 flex justify-end">
              <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                العودة للرئيسية
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
