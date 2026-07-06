"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Phone, Lock, Mail, MapPin, UserPlus, LogIn } from "lucide-react";

const SAUDI_CITIES = [
  "جدة",
  "الرياض",
  "مكة",
  "المدينة",
  "الدمام",
  "الخبر",
  "الطائف",
  "بريدة",
  "أبها",
  "تبوك",
  "حائل",
  "الأحساء",
];

export function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regForm, setRegForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    city: "جدة",
  });

  // Capture referral code from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        sessionStorage.setItem("referralCode", ref);
      }
    }
  }, []);

  const handleLogin = async () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء إدخال البريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        identifier: loginIdentifier.trim(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "فشل تسجيل الدخول",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "مرحباً بك! 👋",
          description: "تم تسجيل الدخول بنجاح",
        });
        setLoginIdentifier("");
        setLoginPassword("");
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast({
        title: "خطأ",
        description: "تعذر تسجيل الدخول. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    signIn("google", { callbackUrl: "/" });
  };

  const handleRegister = async () => {
    const { username, email, phone, password, confirmPassword, city } = regForm;

    if (!username.trim() || !email.trim() || !password.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء ملء الاسم والبريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "البريد غير صحيح",
        description: "الرجاء إدخال بريد إلكتروني صحيح",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "كلمة المرور قصيرة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "كلمتا المرور غير متطابقتين",
        description: "الرجاء إعادة كتابة كلمة المرور بشكل صحيح",
        variant: "destructive",
      });
      return;
    }

    // Validate Saudi phone format (if provided)
    if (phone && !/^05\d{8}$/.test(phone)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "يجب أن يبدأ الرقم بـ 05 ويتكون من 10 أرقام",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get referral code from sessionStorage if exists
      const referralCode = typeof window !== "undefined"
        ? sessionStorage.getItem("referralCode") || undefined
        : undefined;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password,
          city,
          referralCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "فشل إنشاء الحساب",
          description: data.error || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Auto-login after registration - use redirect for production compatibility
      const result = await signIn("credentials", {
        identifier: email.trim(),
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        toast({
          title: "تم إنشاء الحساب",
          description: "الرجاء تسجيل الدخول يدوياً",
        });
        setActiveTab("login");
      } else if (result?.ok) {
        toast({
          title: "أهلاً بك في حراج! 🎉",
          description: "تم إنشاء حسابك وتسجيل الدخول بنجاح",
        });
        setRegForm({
          username: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
          city: "جدة",
        });
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast({
        title: "خطأ",
        description: "تعذر إنشاء الحساب. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right font-cairo text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            حساب حراج
          </DialogTitle>
        </DialogHeader>

        {/* Google Login Button */}
        <Button
          variant="outline"
          className="w-full h-12 font-cairo border-2 hover:bg-muted/50"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
        >
          <svg className="h-5 w-5 ml-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? "جارٍ التحويل لـ Google..." : "متابعة بحساب Google"}
        </Button>

        <div className="flex items-center gap-2 my-2">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">أو</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login" className="font-cairo">
              <LogIn className="h-4 w-4 ml-1" />
              تسجيل الدخول
            </TabsTrigger>
            <TabsTrigger value="register" className="font-cairo">
              <UserPlus className="h-4 w-4 ml-1" />
              حساب جديد
            </TabsTrigger>
          </TabsList>

          {/* LOGIN TAB */}
          <TabsContent value="login" className="space-y-4 py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                سجل دخولك لإضافة الإعلانات وحفظ المفضلة ومتابعة إعلاناتك
              </p>
            </div>

            <div>
              <Label className="mb-1.5 block">البريد الإلكتروني *</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="email@example.com"
                  className="pr-10"
                  dir="ltr"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">كلمة المرور *</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10 pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 text-base font-cairo"
            >
              {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register" className="space-y-3 py-4">
            <div className="text-center mb-2">
              <p className="text-sm text-muted-foreground">
                أنشئ حسابك المجاني وابدأ بنشر إعلاناتك
              </p>
            </div>

            <div>
              <Label className="mb-1.5 block">الاسم *</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  placeholder="أبو سطام"
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">البريد الإلكتروني *</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">رقم الجوال (اختياري)</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  className="pr-10"
                  dir="ltr"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">المدينة</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <select
                  value={regForm.city}
                  onChange={(e) => setRegForm({ ...regForm, city: e.target.value })}
                  className="w-full h-10 pr-10 pl-3 rounded-md border border-input bg-background text-sm"
                >
                  {SAUDI_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">كلمة المرور *</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="6 أحرف على الأقل"
                  className="pr-10 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">تأكيد كلمة المرور *</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                  placeholder="أعد كتابة كلمة المرور"
                  className="pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegister();
                  }}
                />
              </div>
            </div>

            <Button
              onClick={handleRegister}
              disabled={loading}
              className="w-full h-12 text-base font-cairo"
            >
              {loading ? "جارٍ إنشاء الحساب..." : "إنشاء حساب جديد"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
