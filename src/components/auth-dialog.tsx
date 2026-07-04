"use client";

import { useState } from "react";
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
  "الرياض",
  "جدة",
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

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form
  const [regForm, setRegForm] = useState({
    username: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "الرياض",
  });

  const handleLogin = async () => {
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء إدخال الجوال/البريد وكلمة المرور",
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
        // Reset form
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

  const handleRegister = async () => {
    const { username, phone, email, password, confirmPassword, city } = regForm;

    if (!username.trim() || !phone.trim() || !password.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء ملء جميع الحقول المطلوبة",
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

    // Validate Saudi phone format
    if (!/^05\d{8}$/.test(phone)) {
      toast({
        title: "رقم الجوال غير صحيح",
        description: "يجب أن يبدأ الرقم بـ 05 ويتكون من 10 أرقام",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          password,
          city,
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

      // Auto-login after registration
      const result = await signIn("credentials", {
        identifier: phone.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "تم إنشاء الحساب",
          description: "الرجاء تسجيل الدخول يدوياً",
        });
        setActiveTab("login");
      } else {
        toast({
          title: "أهلاً بك في حراج! 🎉",
          description: "تم إنشاء حسابك وتسجيل الدخول بنجاح",
        });
        // Reset form
        setRegForm({
          username: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
          city: "الرياض",
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
              <Label className="mb-1.5 block">الجوال أو البريد الإلكتروني *</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="05xxxxxxxx أو email@example.com"
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

            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <p className="font-cairo font-bold mb-1">حسابات تجريبية:</p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                📞 0551234567 (أبو محمد)
              </p>
              <p className="text-xs text-muted-foreground" dir="ltr">
                🔑 كلمة المرور: 123456
              </p>
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
                  placeholder="أبو محمد"
                  className="pr-10"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">رقم الجوال *</Label>
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
              <Label className="mb-1.5 block">البريد الإلكتروني (اختياري)</Label>
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
