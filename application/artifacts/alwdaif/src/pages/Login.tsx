import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Apple, Chrome } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Login() {
  usePageTitle("تسجيل الدخول");
  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 bg-muted/30">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center space-y-2">
            <h1 className="text-2xl font-bold font-heading text-primary">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground">أدخل بيانات حسابك للمتابعة</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2 bg-card/60 border-border/70 text-white hover:bg-white/5 hover:text-white"
                data-testid="button-login-google"
              >
                <Chrome className="h-5 w-5 text-primary" />
                تسجيل الدخول عبر Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center gap-2 bg-card/60 border-border/70 text-white hover:bg-white/5 hover:text-white"
                data-testid="button-login-apple"
              >
                <Apple className="h-5 w-5 text-primary" />
                تسجيل الدخول عبر Apple
              </Button>

              <div className="relative py-1" data-testid="divider-login-or">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">أو</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني أو رقم الجوال</Label>
              <Input id="email" placeholder="example@mail.com" className="text-left" dir="ltr" data-testid="input-login-email" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">كلمة المرور</Label>
                <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground" data-testid="button-forgot-password">نسيت كلمة المرور؟</Button>
              </div>
              <Input id="password" type="password" className="text-left" dir="ltr" data-testid="input-login-password" />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox id="remember" data-testid="checkbox-remember" />
              <Label htmlFor="remember" className="font-normal text-sm cursor-pointer">تذكرني</Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full font-bold text-lg" data-testid="button-login-submit">دخول</Button>
            <div className="text-center text-sm" data-testid="text-login-register-hint">
              ليس لديك حساب؟ <span className="text-white/70">(قريبًا)</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
