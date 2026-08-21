import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Briefcase } from "lucide-react";
import { Link } from "wouter";

export default function EmployerJobSubmitted() {
  return (
    <Layout>
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-3">تم إرسال إعلانك بنجاح!</h1>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          شكراً لك. سيتم مراجعة إعلانك الوظيفي من قِبل فريق الإدارة قبل نشره.
          ستظهر وظيفتك في صفحة وظائف أصحاب العمل بعد الموافقة عليها.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-8">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>عادةً ما تستغرق المراجعة من 24 إلى 48 ساعة عمل.</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/jobs/employer">
            <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2" data-testid="button-view-jobs">
              <Briefcase className="h-4 w-4" />
              تصفح وظائف أصحاب العمل
            </Button>
          </Link>
          <Link href="/jobs/employer/add">
            <Button className="w-full sm:w-auto" data-testid="button-add-another-job">
              أضف إعلاناً آخر
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
