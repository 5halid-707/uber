"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LogIn, User, Mail, Phone, Lock, MapPin, Car } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { allCities } from "@/lib/saudi-data";

type UserType = { id: string; name: string; email: string; phone: string; city?: string | null; region?: string | null; walletBalance: number; isAdmin: boolean; isDriver: boolean; isVerified: boolean; isBlocked?: boolean; rating: number; tripsCount: number; };
interface AuthDialogProps { open: boolean; onOpenChange: (v: boolean) => void; onSuccess: (u: UserType) => void; lang: Lang; }
type LoginResponse = UserType & { token?: string };
type RegisterResponse = { id: string; name: string; email: string; phone: string; walletBalance: number; isAdmin: boolean; isDriver: boolean; isVerified: boolean; rating: number; tripsCount: number; };

export function AuthDialog({ open, onOpenChange, onSuccess, lang }: AuthDialogProps) {
  const [tab, setTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Login
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");

  const handleLogin = async () => {
    if (!identifier || !password) { toast({ title: lang === "ar" ? "املأ جميع الحقول" : "Fill all fields", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const u: UserType = { id: data.id, name: data.name, email: data.email, phone: data.phone, city: data.city, region: data.region, walletBalance: data.walletBalance, isAdmin: data.isAdmin, isDriver: data.isDriver, isVerified: data.isVerified, isBlocked: data.isBlocked, rating: data.rating, tripsCount: data.tripsCount };
      localStorage.setItem("uber_token", data.token || "");
      onSuccess(u);
    } catch (e) { toast({ title: e instanceof Error ? e.message : (lang === "ar" ? "فشل تسجيل الدخول" : "Login failed"), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name || !email || !phone || !regPassword) { toast({ title: lang === "ar" ? "املأ جميع الحقول" : "Fill all fields", variant: "destructive" }); return; }
    if (regPassword !== confirmPassword) { toast({ title: lang === "ar" ? "كلمة المرور غير متطابقة" : "Passwords don't match", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, phone, password: regPassword, city }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const u: UserType = { id: data.id, name: data.name, email: data.email, phone: data.phone, city: data.city, walletBalance: data.walletBalance, isAdmin: data.isAdmin, isDriver: data.isDriver, isVerified: data.isVerified, rating: data.rating, tripsCount: data.tripsCount };
      toast({ title: lang === "ar" ? "تم التسجيل بنجاح! 🎉" : "Registered successfully! 🎉" });
      onSuccess(u);
    } catch (e) { toast({ title: e instanceof Error ? e.message : (lang === "ar" ? "فشل التسجيل" : "Register failed"), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") action();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onKeyDown={(e) => tab === "login" ? handleKeyDown(e, handleLogin) : handleKeyDown(e, handleRegister)}>
        <DialogHeader>
          <DialogTitle className="text-center">{lang === "ar" ? "مرحباً بك في أوبر" : "Welcome to Uber"}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{lang === "ar" ? "تسجيل دخول" : "Login"}</TabsTrigger>
            <TabsTrigger value="register">{lang === "ar" ? "حساب جديد" : "Register"}</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "البريد الإلكتروني أو الجوال" : "Email or phone"}</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
                <Input dir="auto" className="pr-10 h-12" placeholder={lang === "ar" ? "example@email.com" : "example@email.com"} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "كلمة المرور" : "Password"}</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
                <Input type="password" dir="auto" className="pr-10 h-12" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleLogin} disabled={loading} className="w-full bg-black hover:bg-zinc-800 h-12 text-base">
              {loading ? (lang === "ar" ? "جاري..." : "Loading...") : (lang === "ar" ? "تسجيل الدخول" : "Login")}
            </Button>
            <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 space-y-1">
              <p className="text-xs font-bold text-zinc-600 mb-1">{lang === "ar" ? "📋 حسابات تجريبية" : "📋 Test Accounts"}</p>
              <p className="text-xs text-zinc-500">أدمن: grouthhacker@gmail.com / Admin@2026</p>
              <p className="text-xs text-zinc-500">راكب: saad@example.com / 123456</p>
              <p className="text-xs text-zinc-500">سائق: ahmed@driver.com / 123456</p>
            </div>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-400">{lang === "ar" ? "أو" : "or"}</span></div>
            </div>
            <Button variant="outline" onClick={handleGoogleLogin} className="w-full h-12 border-zinc-300 text-base">
              <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {lang === "ar" ? "متابعة بحساب Google" : "Continue with Google"}
            </Button>
          </TabsContent>
          <TabsContent value="register" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "الاسم" : "Name"}</Label>
              <div className="relative">
                <User className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
                <Input dir="auto" className="pr-10 h-12" placeholder={lang === "ar" ? "الاسم الكامل" : "Full name"} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
                <Input type="email" dir="auto" className="pr-10 h-12" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "رقم الجوال" : "Phone"}</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
                <Input dir="auto" className="pr-10 h-12" placeholder="05XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "المدينة" : "City"}</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
                <select className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-2 pr-10 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">{lang === "ar" ? "اختر المدينة" : "Select city"}</option>
                  {allCities.map((c: string) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "كلمة المرور" : "Password"}</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
                <Input type="password" dir="auto" className="pr-10 h-12" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-4 h-4 text-zinc-400" />
                <Input type="password" dir="auto" className="pr-10 h-12" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleRegister} disabled={loading} className="w-full bg-black hover:bg-zinc-800 h-12 text-base">
              {loading ? (lang === "ar" ? "جاري..." : "Loading...") : (lang === "ar" ? "إنشاء حساب" : "Create account")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
