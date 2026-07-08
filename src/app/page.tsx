"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Globe, MapPin, Navigation, Clock, Star, Wallet, Shield, LogIn, User, Home, Car, MessageCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useLang } from "@/lib/use-lang";
import { t, type Lang } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { safePlaySound, playNewRequestSound, playDriverArrivedSound, playRideAcceptedSound, playTripCompletedSound, playMessageSound, initAudio } from "@/lib/sounds";
import { saudiRegions, serviceTypes, popularPlaces, allCities, platformBankAccounts, saudiBanks, contactInfo, calculateDistance, calculatePrice, calculateDuration, getSurgeMultiplier } from "@/lib/saudi-data";

// ===== TYPES =====
type User = { id: string; name: string; email: string; phone: string; city?: string | null; region?: string | null; walletBalance: number; isAdmin: boolean; isDriver: boolean; isVerified: boolean; isBlocked?: boolean; rating: number; tripsCount: number; };
type Trip = { id: string; userId: string; driverId?: string | null; serviceType: string; fromAddress: string; toAddress: string; distance: number; duration: number; price: number; finalPrice?: number; status: string; paymentMethod: string; lateFee?: number; cashReceived?: number | null; unpaidAmount?: number; cancellationLocked?: boolean; cancellationRequest?: string | null; driverArrivedAt?: string | null; startedAt?: string | null; createdAt: string; driver?: { name: string; phone: string } | null; user?: { name: string; phone: string } | null; };
type View = "home" | "ride" | "trips" | "driver" | "driver-register" | "bank" | "profile" | "admin";
const STORAGE_KEY = "uber_user";

// ===== MAIN PAGE =====
export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("home");
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { lang, setLang } = useLang();
  const { toast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const handler = () => { initAudio(); document.removeEventListener("click", handler); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const saveUser = useCallback((u: User | null) => {
    try { if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u)); else localStorage.removeItem(STORAGE_KEY); } catch {}
    setUser(u);
  }, []);

  const navigate = useCallback((target: View) => {
    if (target !== "home" && !user) { setAuthOpen(true); return; }
    setView(target); setMobileMenu(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user]);

  const handleLogout = useCallback(() => { saveUser(null); setView("home"); setTimeout(() => toast({ title: lang === "ar" ? "تم تسجيل الخروج" : "Logged out" }), 0); }, [saveUser, toast, lang]);
  const handleAuthSuccess = useCallback((u: User) => { saveUser(u); setAuthOpen(false); setTimeout(() => toast({ title: `${lang === "ar" ? "مرحباً" : "Welcome"} ${u.name} 👋` }), 0); }, [saveUser, toast, lang]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4"><Car className="w-7 h-7 text-black" /></div>
          <div className="text-white text-2xl font-bold mb-2">{lang === "ar" ? "أوبر" : "Uber"}</div>
          <div className="animate-spin w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // Navigation items based on user type
  let navItems: { id: View; label: string }[] = [{ id: "home", label: t("nav.home", lang) }];
  if (user?.isAdmin) {
    // Admin sees everything
    navItems = [
      { id: "home", label: t("nav.home", lang) },
      { id: "admin", label: t("nav.admin", lang) },
      { id: "trips", label: t("nav.trips", lang) },
      { id: "bank", label: t("nav.bank", lang) },
      { id: "profile", label: t("nav.profile", lang) },
    ];
  } else if (user?.isDriver) {
    // Driver: NO "book ride" - only their trips and work
    navItems = [
      { id: "home", label: t("nav.home", lang) },
      { id: "driver", label: t("nav.driver", lang) },
      { id: "trips", label: t("nav.trips", lang) },
      { id: "bank", label: t("nav.bank", lang) },
      { id: "profile", label: t("nav.profile", lang) },
    ];
  } else {
    // Rider: NO "driver" page - only booking
    navItems = [
      { id: "home", label: t("nav.home", lang) },
      { id: "ride", label: t("nav.ride", lang) },
      { id: "trips", label: t("nav.trips", lang) },
      { id: "bank", label: t("nav.bank", lang) },
      { id: "profile", label: t("nav.profile", lang) },
    ];
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-40 bg-black text-white border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => setView("home")} className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center"><Car className="w-5 h-5 text-black" /></div>
              <span className="text-2xl font-bold">{lang === "ar" ? "أوبر" : "Uber"}</span>
            </button>
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => navigate(item.id)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === item.id ? "bg-white text-black" : "text-zinc-300 hover:text-white hover:bg-zinc-800"}`}>{item.label}</button>
              ))}
            </nav>
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher lang={lang} setLang={setLang} />
              {user && user.name ? (
                <>
                  <button onClick={() => navigate("profile")} className="flex items-center gap-2 hover:bg-zinc-800 rounded-lg p-1 pr-2">
                    <Avatar className="w-8 h-8"><AvatarFallback className="bg-zinc-700 text-sm">{(user.name || "?").charAt(0)}</AvatarFallback></Avatar>
                    <span className="text-sm">{(user.name || "").split(" ")[0]}</span>
                  </button>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-600 text-red-400 hover:bg-red-900/30 font-bold" aria-label="Logout">
                    <LogOut className="w-4 h-4 ml-1" /><span className="hidden sm:inline">{t("nav.logout", lang)}</span>
                  </Button>
                </>
              ) : (
                <Button onClick={() => setAuthOpen(true)} variant="outline" size="sm" className="border-zinc-700 text-white hover:bg-zinc-800">
                  <LogIn className="w-4 h-4 ml-2" />{t("nav.login", lang)}
                </Button>
              )}
            </div>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg">{mobileMenu ? "✕" : "☰"}</button>
          </div>
          {mobileMenu && (
            <nav className="lg:hidden pb-4 space-y-1">
              <div className="px-4 py-2"><LanguageSwitcher lang={lang} setLang={setLang} /></div>
              {navItems.map((item) => (
                <button key={item.id} onClick={() => navigate(item.id)} className={`w-full text-right px-4 py-3 rounded-lg text-sm font-medium ${view === item.id ? "bg-white text-black" : "text-zinc-300 hover:bg-zinc-800"}`}>{item.label}</button>
              ))}
              {user ? (
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold text-red-400 hover:bg-red-900/30 border border-red-600/30">
                  <LogOut className="w-5 h-5" />{t("nav.logout", lang)}
                </button>
              ) : (
                <button onClick={() => { setAuthOpen(true); setMobileMenu(false); }} className="w-full text-right px-4 py-3 rounded-lg text-sm bg-white text-black">{t("nav.login", lang)}</button>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        {view === "home" && <HomeView navigate={navigate} user={user} lang={lang} />}
        {view === "ride" && <RideView user={user} lang={lang} />}
        {view === "trips" && <TripsView user={user} lang={lang} />}
        {view === "driver" && <DriverView user={user} lang={lang} />}
        {view === "driver-register" && <DriverRegisterView user={user} lang={lang} />}
        {view === "bank" && <BankView user={user} lang={lang} />}
        {view === "profile" && <ProfileView user={user} lang={lang} onLogout={handleLogout} />}
        {view === "admin" && <AdminView user={user} lang={lang} />}
      </main>

      <footer className="bg-black text-white mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center"><Car className="w-5 h-5 text-black" /></div>
                <span className="text-2xl font-bold">{lang === "ar" ? "أوبر" : "Uber"}</span>
              </div>
              <p className="text-zinc-400 text-sm">{t("footer.desc", lang)}</p>
            </div>
            <div><h4 className="font-bold mb-4">{t("footer.company", lang)}</h4><ul className="space-y-2 text-sm text-zinc-400"><li><button className="hover:text-white">{t("footer.about", lang)}</button></li><li><button className="hover:text-white">{t("footer.jobs", lang)}</button></li></ul></div>
            <div><h4 className="font-bold mb-4">{t("footer.services", lang)}</h4><ul className="space-y-2 text-sm text-zinc-400"><li><button onClick={() => navigate("ride")} className="hover:text-white">{t("footer.bookRide", lang)}</button></li><li><button onClick={() => navigate("bank")} className="hover:text-white">{t("footer.bankAccounts", lang)}</button></li></ul></div>
            <div><h4 className="font-bold mb-4">{t("footer.support", lang)}</h4><ul className="space-y-2 text-sm text-zinc-400"><li><a href={`tel:${contactInfo.phone}`} className="hover:text-white">📞 {contactInfo.phone}</a></li><li><a href={`mailto:${contactInfo.email}`} className="hover:text-white">✉️ {contactInfo.email}</a></li></ul></div>
          </div>
          <div className="pt-8 border-t border-zinc-800 text-center text-zinc-400 text-sm">{t("footer.rights", lang)}</div>
        </div>
      </footer>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black text-white border-t border-zinc-800 z-40">
        <div className="grid grid-cols-5 h-16">
          {(user?.isDriver
            ? [{ id: "home" as View, l: t("nav.home", lang), i: "🏠" }, { id: "driver" as View, l: t("nav.driver", lang), i: "🚗" }, { id: "trips" as View, l: t("nav.trips", lang), i: "📋" }, { id: "bank" as View, l: t("nav.bank", lang), i: "💳" }, { id: "profile" as View, l: t("nav.profile", lang), i: "👤" }]
            : user?.isAdmin
            ? [{ id: "home" as View, l: t("nav.home", lang), i: "🏠" }, { id: "admin" as View, l: t("nav.admin", lang), i: "🛡️" }, { id: "trips" as View, l: t("nav.trips", lang), i: "📋" }, { id: "bank" as View, l: t("nav.bank", lang), i: "💳" }, { id: "profile" as View, l: t("nav.profile", lang), i: "👤" }]
            : [{ id: "home" as View, l: t("nav.home", lang), i: "🏠" }, { id: "ride" as View, l: t("nav.ride", lang), i: "🚗" }, { id: "trips" as View, l: t("nav.trips", lang), i: "📋" }, { id: "bank" as View, l: t("nav.bank", lang), i: "💳" }, { id: "profile" as View, l: t("nav.profile", lang), i: "👤" }]
          ).map((item) => (
            <button key={item.id} onClick={() => navigate(item.id)} className={`flex flex-col items-center justify-center gap-1 ${view === item.id ? "text-white" : "text-zinc-500"}`}>
              <span className="text-xl">{item.i}</span><span className="text-[10px]">{item.l}</span>
            </button>
          ))}
        </div>
      </nav>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onSuccess={handleAuthSuccess} lang={lang} />
    </div>
  );
}

// ===== HOME VIEW =====
function HomeView({ navigate, user, lang }: { navigate: (v: View) => void; user: User | null; lang: Lang }) {
  const services = serviceTypes.map((s) => ({ id: s.id, name: lang === "ar" ? s.name : t(`services.${s.id}`, lang), desc: s.desc, emoji: s.emoji }));
  const stats = [{ v: "+5M", l: t("home.stats.trips", lang) }, { v: "+50K", l: t("home.stats.drivers", lang) }, { v: "4.9", l: t("home.stats.rating", lang) }, { v: "13", l: t("home.stats.regions", lang) }];
  const [city, setCity] = useState("الرياض");
  const [reserveDate, setReserveDate] = useState("");
  const [reserveTime, setReserveTime] = useState("");
  const [showReserve, setShowReserve] = useState(false);

  return (
    <div>
      {/* ===== HERO with inline search like Uber.com ===== */}
      <section className="relative bg-black text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          <div className="max-w-2xl">
            <Badge className="bg-zinc-800 text-white border-zinc-700 mb-4">{t("home.badge", lang)}</Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">{lang === "ar" ? "اذهب إلى أي مكان مع أوبر" : "Go anywhere with Uber"}</h1>
            <p className="text-lg text-zinc-300 mb-8">{lang === "ar" ? "التقِ بالسائق الآن - احجز رحلتك في دقائق" : "Meet your driver now - book in minutes"}</p>

            {/* Inline booking form like Uber.com */}
            <div className="bg-white rounded-2xl p-4 md:p-6 space-y-3">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full shrink-0"></div>
                <input
                  placeholder={lang === "ar" ? "موقع الاستلام" : "Pickup location"}
                  className="flex-1 bg-transparent text-black outline-none text-base"
                  onFocus={() => navigate("ride")}
                  readOnly
                />
              </div>
              <div className="flex items-center gap-3 pb-3">
                <div className="w-3 h-3 bg-red-500 rounded-sm shrink-0"></div>
                <input
                  placeholder={lang === "ar" ? "موقع التسليم" : "Dropoff location"}
                  className="flex-1 bg-transparent text-black outline-none text-base"
                  onFocus={() => navigate("ride")}
                  readOnly
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => navigate("ride")} className="flex-1 bg-black hover:bg-zinc-800 h-12 text-base font-bold">
                  {lang === "ar" ? "اطّلع على الأسعار" : "See prices"}
                </Button>
                <Button onClick={() => navigate("ride")} variant="outline" className="flex-1 h-12 text-base border-zinc-300 text-black hover:bg-zinc-100">
                  {lang === "ar" ? "احجز الآن" : "Book now"}
                </Button>
              </div>
            </div>

            {!user && (
              <p className="text-sm text-zinc-400 mt-4">{lang === "ar" ? "سجّل الدخول للاطّلاع على نشاطك الأخير" : "Sign in to see your recent activity"}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-zinc-800">
            {stats.map((s, i) => (<div key={i} className="text-center"><div className="text-3xl md:text-4xl font-bold">{s.v}</div><div className="text-sm text-zinc-400 mt-1">{s.l}</div></div>))}
          </div>
        </div>
      </section>

      {/* ===== SUGGESTIONS like Uber.com (3 cards) ===== */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-black mb-8">{lang === "ar" ? "استكشف ما يمكنك فعله مع أوبر" : "Explore what you can do with Uber"}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Rides */}
            <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition-all border-zinc-200" onClick={() => navigate("ride")}>
              <div className="h-48 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
                <span className="text-6xl">🚗</span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-black mb-2">{lang === "ar" ? "المشاوير" : "Rides"}</h3>
                <p className="text-sm text-zinc-500 mb-4">{lang === "ar" ? "اذهب إلى أي مكان مع أوبر. اطلب مشواراً واركب السيارة وانطلق إلى وجهتك." : "Go anywhere with Uber. Request a ride, hop in, and go."}</p>
                <Button variant="link" className="p-0 h-auto text-black font-bold">{lang === "ar" ? "التفاصيل" : "Details"} →</Button>
              </div>
            </Card>

            {/* Reserve */}
            <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition-all border-zinc-200" onClick={() => setShowReserve(true)}>
              <div className="h-48 bg-gradient-to-br from-green-700 to-green-900 flex items-center justify-center">
                <span className="text-6xl">📅</span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-black mb-2">{lang === "ar" ? "احجز" : "Reserve"}</h3>
                <p className="text-sm text-zinc-500 mb-4">{lang === "ar" ? "احجز رحلتك مقدماً حتى تتمكن من الاسترخاء في يوم مشوارك." : "Reserve your ride in advance so you can relax on the day of your trip."}</p>
                <Button variant="link" className="p-0 h-auto text-black font-bold">{lang === "ar" ? "التفاصيل" : "Details"} →</Button>
              </div>
            </Card>

            {/* Travel */}
            <Card className="overflow-hidden cursor-pointer hover:shadow-xl transition-all border-zinc-200" onClick={() => navigate("ride")}>
              <div className="h-48 bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                <span className="text-6xl">✈️</span>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl text-black mb-2">{lang === "ar" ? "سفر" : "Travel"}</h3>
                <p className="text-sm text-zinc-500 mb-4">{lang === "ar" ? "احصل على سيارات أجرة مريحة وبأسعار معقولة عند بابك في أي وقت." : "Get comfortable, affordable rides at your doorstep, anytime."}</p>
                <Button variant="link" className="p-0 h-auto text-black font-bold">{lang === "ar" ? "التفاصيل" : "Details"} →</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== UBER RESERVE (Schedule ahead) ===== */}
      <section className="py-16 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">{lang === "ar" ? "خطّط لوقت لاحق" : "Plan for later"}</h2>
              <p className="text-lg text-zinc-500 mb-6">{lang === "ar" ? "احصل على مشوارك الصحيح مع Uber Reserve" : "Get your ride right with Uber Reserve"}</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-sm text-zinc-600">{lang === "ar" ? "اختر موعد الالتقاء الدقيق حتى 90 يوماً مقدماً." : "Choose your exact pickup time up to 90 days in advance."}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-sm text-zinc-600">{lang === "ar" ? "هناك وقت انتظار إضافي للالتقاء بالسائق." : "Extra wait time included to meet your driver."}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <p className="text-sm text-zinc-600">{lang === "ar" ? "يمكنك إلغاء الحجز بدون تحمُّل أي رسوم قبل الموعد بمدة تصل إلى 60 دقيقة." : "Cancel for free up to 60 minutes before your ride."}</p>
                </div>
              </div>
            </div>
            <div>
              <Card className="p-6 border-zinc-200">
                <h3 className="font-bold text-black mb-4">{lang === "ar" ? "اختر التاريخ والوقت" : "Choose date and time"}</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-500 text-sm mb-1 block">{lang === "ar" ? "التاريخ" : "Date"}</Label>
                    <Input type="date" value={reserveDate} onChange={(e) => setReserveDate(e.target.value)} className="h-12" />
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-sm mb-1 block">{lang === "ar" ? "الوقت" : "Time"}</Label>
                    <Input type="time" value={reserveTime} onChange={(e) => setReserveTime(e.target.value)} className="h-12" />
                  </div>
                  <Button onClick={() => navigate("ride")} className="w-full bg-black hover:bg-zinc-800 h-12" disabled={!reserveDate || !reserveTime}>
                    {lang === "ar" ? "التالي" : "Next"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ===== UBER ONE (Rewards) ===== */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-green-600 text-white mb-4">Uber One</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{lang === "ar" ? "المكافآت التي تستحقها" : "Rewards you deserve"}</h2>
              <p className="text-lg text-zinc-400 mb-6">{lang === "ar" ? "اشترك في Uber One واحصل على خصم 10% على جميع الرحلات والتوصيل، إلغاء مجاني، وأولوية في الطلبات." : "Join Uber One and get 10% off all rides and deliveries, free cancellations, and priority booking."}</p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3"><span className="text-green-400 text-xl">✓</span><span>{lang === "ar" ? "خصم 10% على الرحلات" : "10% off rides"}</span></div>
                <div className="flex items-center gap-3"><span className="text-green-400 text-xl">✓</span><span>{lang === "ar" ? "توصيل مجاني للطعام" : "Free food delivery"}</span></div>
                <div className="flex items-center gap-3"><span className="text-green-400 text-xl">✓</span><span>{lang === "ar" ? "أولوية في الحجز" : "Priority booking"}</span></div>
                <div className="flex items-center gap-3"><span className="text-green-400 text-xl">✓</span><span>{lang === "ar" ? "إلغاء مجاني" : "Free cancellations"}</span></div>
              </div>
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg">{lang === "ar" ? "اشترك الآن - 14.99 ر.س/شهر" : "Join now - 14.99 SAR/month"}</Button>
            </div>
            <div className="text-center">
              <div className="text-9xl mb-4">🎁</div>
              <p className="text-zinc-400">{lang === "ar" ? "وفّر أكثر من 2000 ر.س سنوياً" : "Save over 2000 SAR per year"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== DRIVE WITH UBER ===== */}
      <section className="py-16 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="aspect-video bg-gradient-to-br from-zinc-800 to-black rounded-3xl flex items-center justify-center">
                <span className="text-9xl">🚗</span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">{lang === "ar" ? "يمكنك القيادة متى شئت، وتحقيق ما تحتاج إليه من دخل" : "Drive when you want, earn what you need"}</h2>
              <p className="text-lg text-zinc-500 mb-6">{lang === "ar" ? "حقِّق الأرباح بما يناسب مواعيدك من خلال خدمات التوصيل أو إجراء المشاوير، أو الاثنين." : "Earn on your schedule with deliveries or rides, or both."}</p>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-zinc-600">{lang === "ar" ? "أرباح تصل إلى 7,400 ر.س شهرياً" : "Earn up to 7,400 SAR/month"}</p>
                <p className="text-sm text-zinc-600">{lang === "ar" ? "مرونة كاملة في المواعيد" : "Complete schedule flexibility"}</p>
                <p className="text-sm text-zinc-600">{lang === "ar" ? "دفعات أسبوعية سريعة" : "Fast weekly payouts"}</p>
              </div>
              <Button size="lg" onClick={() => navigate("driver-register")} className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg font-bold animate-pulse">{lang === "ar" ? "ابدأ الآن" : "Get started"}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== UBER FOR BUSINESS ===== */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">{lang === "ar" ? "أوبر للأعمال" : "Uber for Business"}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">{lang === "ar" ? "أوبر في ثوبها الجديد لقطاع الأعمال" : "Uber for Business"}</h2>
              <p className="text-lg text-zinc-500 mb-6">{lang === "ar" ? "منصة أوبر للأعمال لإدارة الرحلات العالمية وطلبات الوجبات وخدمات إرسال الطرود المحلية للشركات من أي حجم." : "A platform for managing global rides, meals, and local package delivery for companies of any size."}</p>
              <div className="flex gap-3">
                <Button size="lg" className="bg-black hover:bg-zinc-800 h-14 px-8 text-lg">{lang === "ar" ? "ابدأ الآن" : "Get started"}</Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-zinc-300">{lang === "ar" ? "اطَّلع على حلولنا" : "See solutions"}</Button>
              </div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl flex items-center justify-center">
              <span className="text-9xl">🏢</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CITY CENTER (Explore) ===== */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">{lang === "ar" ? "كل ما تحتاجه لتشجع مع مدينتك" : "Everything you need to cheer in your city"}</h2>
          <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">{lang === "ar" ? "في هذا الموسم، سنوصلك إلى المباراة أو نجلب لك ما تشتهيه حتى باب منزلك—لأن الشيء الوحيد الذي يجب أن تركز عليه هو النتيجة." : "This season, we'll get you to the match or bring what you crave to your door."}</p>
          <Button size="lg" className="bg-white text-black hover:bg-zinc-200 h-14 px-8 text-lg">{lang === "ar" ? "ادخل في اللعبة" : "Get in the game"}</Button>
        </div>
      </section>

      {/* ===== SERVICES GRID ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">{lang === "ar" ? "خدماتنا" : "Our Services"}</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-black">{t("home.servicesTitle", lang)}</h2>
            <p className="text-zinc-500 mt-3 max-w-2xl mx-auto">{t("home.servicesDesc", lang)}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {services.map((s) => (
              <Card key={s.id} className="p-6 hover:shadow-xl transition-all cursor-pointer border-zinc-200 hover:border-black group" onClick={() => navigate("ride")}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{s.emoji}</div>
                <h3 className="font-bold text-lg text-black">{s.name}</h3>
                <p className="text-sm text-zinc-500 mt-1">{s.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-sm font-medium text-black">{t("home.startNow", lang)} ←</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COVERAGE ===== */}
      <section className="py-16 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">{lang === "ar" ? "تغطيتنا" : "Coverage"}</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-black">{t("home.coverageTitle", lang)}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {saudiRegions.map((r) => (
              <Card key={r.id} className="p-4 text-center border-zinc-200 hover:border-black">
                <div className="text-2xl mb-2">📍</div>
                <h3 className="font-bold text-sm text-black">{lang === "ar" ? r.name : r.name}</h3>
                <p className="text-xs text-zinc-500">{r.cities.length} {t("home.cities", lang)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== APP DOWNLOAD (QR codes) ===== */}
      <section className="py-16 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{lang === "ar" ? "الأمر أسهل داخل التطبيقات" : "Easier in the apps"}</h2>
              <p className="text-zinc-400 mb-6">{lang === "ar" ? "نزِّل تطبيق أوبر للركاب وتطبيق الشريك للسائقين" : "Download the Uber app for riders and the Partner app for drivers"}</p>
              <div className="space-y-3">
                <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-3xl">📱</span>
                  </div>
                  <div>
                    <p className="font-bold">{lang === "ar" ? "نزِّل تطبيق أوبر" : "Download Uber app"}</p>
                    <p className="text-sm text-zinc-400">{lang === "ar" ? "امسح الرمز ضوئياً للتنزيل" : "Scan the QR code"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-3xl">🚗</span>
                  </div>
                  <div>
                    <p className="font-bold">{lang === "ar" ? "نزِّل تطبيق الشريك" : "Download Partner app"}</p>
                    <p className="text-sm text-zinc-400">{lang === "ar" ? "امسح الرمز ضوئياً للتنزيل" : "Scan the QR code"}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="w-40 h-40 bg-white rounded-2xl p-3 mb-3">
                  {/* QR code placeholder */}
                  <div className="w-full h-full bg-black rounded grid grid-cols-8 grid-rows-8 gap-px p-2">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <div key={i} className={`${Math.random() > 0.5 ? "bg-white" : "bg-black"} rounded-sm`} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-zinc-400">{lang === "ar" ? "أندرويد و iOS" : "Android & iOS"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">{t("home.ctaTitle", lang)}</h2>
          <p className="text-zinc-500 mb-8">{t("home.ctaDesc", lang)}</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Button size="lg" onClick={() => navigate("ride")} className="bg-black hover:bg-zinc-800 h-14 px-8 text-lg">{t("home.bookNow", lang)}</Button>
            <Button size="lg" onClick={() => navigate("driver-register")} className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg font-bold">{t("home.beDriver", lang)}</Button>
          </div>
        </div>
      </section>

      {/* Reserve Dialog */}
      <Dialog open={showReserve} onOpenChange={setShowReserve}>
        <DialogContent>
          <DialogHeader><DialogTitle>{lang === "ar" ? "جدولة رحلة مسبقاً" : "Reserve a ride"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>{lang === "ar" ? "التاريخ" : "Date"}</Label><Input type="date" value={reserveDate} onChange={(e) => setReserveDate(e.target.value)} className="h-12" /></div>
            <div><Label>{lang === "ar" ? "الوقت" : "Time"}</Label><Input type="time" value={reserveTime} onChange={(e) => setReserveTime(e.target.value)} className="h-12" /></div>
            <Button onClick={() => { setShowReserve(false); navigate("ride"); }} className="w-full bg-black hover:bg-zinc-800 h-12" disabled={!reserveDate || !reserveTime}>{lang === "ar" ? "متابعة" : "Continue"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== LIVE MAP COMPONENT =====
function LiveMap({ riderLoc, driverLoc, from, to, status }: {
  riderLoc?: { lat: number; lng: number } | null;
  driverLoc?: { lat: number; lng: number } | null;
  from?: string;
  to?: string;
  status?: string;
}) {
  // Build Google Maps embed URL with markers
  let mapUrl = "";
  if (driverLoc && riderLoc) {
    // Show both markers with route
    const midLat = ((driverLoc.lat + riderLoc.lat) / 2).toFixed(6);
    const midLng = ((driverLoc.lng + riderLoc.lng) / 2).toFixed(6);
    mapUrl = `https://www.google.com/maps?q=${midLat},${midLng}&z=14&output=embed`;
  } else if (riderLoc) {
    mapUrl = `https://www.google.com/maps?q=${riderLoc.lat},${riderLoc.lng}&z=15&output=embed`;
  } else if (driverLoc) {
    mapUrl = `https://www.google.com/maps?q=${driverLoc.lat},${driverLoc.lng}&z=15&output=embed`;
  } else if (from && to) {
    mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(from + " to " + to + " Saudi Arabia")}&output=embed`;
  } else if (from) {
    mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(from + " Saudi Arabia")}&output=embed`;
  } else {
    mapUrl = `https://www.google.com/maps?q=Riyadh&output=embed`;
  }

  return (
    <div className="relative w-full h-full">
      <iframe src={mapUrl} className="w-full h-full" style={{ border: 0 }} loading="lazy" />
      {/* Location badges overlay */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {riderLoc && <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">🔵 {status === "ongoing" ? "الوجهة" : "الراكب"}</div>}
        {driverLoc && <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">🔴 السائق 🚗</div>}
      </div>
    </div>
  );
}

// ===== RIDE VIEW =====
function RideView({ user, lang }: { user: User | null; lang: Lang }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [selectedService, setSelectedService] = useState("ride");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [step, setStep] = useState<"search" | "confirm" | "tracking">("search");
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [lateFeeData, setLateFeeData] = useState({ waitingMinutes: 0, lateFee: 0, freeMinutesLeft: 3 });
  const [elapsed, setElapsed] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [riderLoc, setRiderLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [ratingDialog, setRatingDialog] = useState<{ open: boolean; tripId?: string; driverId?: string; driverName?: string }>({ open: false });
  const [unreadChat, setUnreadChat] = useState(0);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState("");
  const { toast } = useToast();
  const prevStatus = useRef<string>("");

  const [calc, setCalc] = useState({ distance: 0, duration: 0, surge: 1 });
  useEffect(() => {
    if (from && to) {
      const dist = calculateDistance(from, to);
      const dur = calculateDuration(dist);
      const surge = getSurgeMultiplier();
      setCalc({ distance: dist, duration: dur, surge });
    }
  }, [from, to]);

  const prices = serviceTypes.map((s) => ({ ...s, price: Math.floor(calculatePrice(s.id, calc.distance, calc.duration) * calc.surge) }));
  const selectedPrice = prices.find((p) => p.id === selectedService);

  useEffect(() => {
    if (step !== "tracking" || !activeTrip || !user) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/trips?userId=${user.id}&activeOnly=true`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const trip = data[0];
          setActiveTrip(trip);
                 if (trip.status !== prevStatus.current) {
            if (trip.status === "accepted" && prevStatus.current === "pending") {
              safePlaySound(playRideAcceptedSound);
              setTimeout(() => toast({
                title: lang === "ar" ? "🚗 تم قبول طلبك!" : "🚗 Ride accepted!",
                description: lang === "ar" 
                  ? `السائق: ${trip.driver?.name || "—"} • ${trip.driver?.phone || ""}` 
                  : `Driver: ${trip.driver?.name || "—"} • ${trip.driver?.phone || ""}`,
              }), 0);
            }
            if (trip.status === "driver_arrived" && prevStatus.current === "accepted") {
              safePlaySound(playDriverArrivedSound);
              setTimeout(() => toast({
                title: lang === "ar" ? "📍 السائق وصل إلى موقعك!" : "📍 Driver has arrived!",
                description: lang === "ar" ? "اخرج للقاء السائق" : "Go out to meet the driver",
              }), 0);
            }
            if (trip.status === "ongoing" && prevStatus.current === "driver_arrived") {
              setTimeout(() => toast({
                title: lang === "ar" ? "🚀 بدأت الرحلة!" : "🚀 Trip started!",
              }), 0);
            }
            if (trip.status === "completed") safePlaySound(playTripCompletedSound);
            prevStatus.current = trip.status;
          }
          if (trip.status === "completed") {
            const baseAmount = trip.finalPrice || trip.price || 0;
            const finalAmount = baseAmount + (lateFeeData?.lateFee || 0);
            setStep("search");
            setActiveTrip(null);
            prevStatus.current = "";
            setTimeout(() => toast({
              title: lang === "ar" ? "اكتملت الرحلة! 🎉" : "Trip completed! 🎉",
              description: `${lang === "ar" ? "السعر النهائي" : "Final price"}: ${finalAmount} ر.س${lateFeeData?.lateFee ? ` (${lang === "ar" ? "شامل رسوم انتظار" : "incl. late fee"} ${lateFeeData.lateFee})` : ""}`,
            }), 0);
            // Open rating dialog
            setRatingDialog({ open: true, tripId: trip.id, driverId: trip.driverId, driverName: trip.driver?.name || trip.driver?.user?.name || (lang === "ar" ? "السائق" : "Driver") });
          }
        }
      } catch {}
    };
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [step, activeTrip, user, toast, lang, lateFeeData]);

  // Send rider GPS location when tracking
  useEffect(() => {
    if (step !== "tracking" || !user) return;
    const sendLoc = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setRiderLoc(loc);
          fetch("/api/users/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, lat: loc.lat, lng: loc.lng }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
    sendLoc();
    const interval = setInterval(sendLoc, 10000);
    return () => clearInterval(interval);
  }, [step, user]);

  // Fetch user's coupons
  useEffect(() => {
    if (!user) return;
    fetch(`/api/coupons?userId=${user.id}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setUserCoupons(d); }).catch(() => {});
  }, [user]);

  // Poll unread chat when tracking
  useEffect(() => {
    if (step !== "tracking" || !activeTrip || !user) return;
    const checkUnread = async () => {
      try {
        const res = await fetch(`/api/chat?tripId=${activeTrip.id}&userId=${user.id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setUnreadChat(data.filter((m: any) => m.receiverId === user.id && !m.isRead).length);
        }
      } catch {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 3000);
    return () => clearInterval(interval);
  }, [step, activeTrip, user]);

  // Calculate discount
  const couponDiscount = (() => {
    if (!selectedCoupon) return 0;
    const c = userCoupons.find(c => c.code === selectedCoupon);
    if (!c) return 0;
    const basePrice = selectedPrice?.price || 0;
    return c.type === "percentage" ? Math.floor(basePrice * c.value / 100) : Math.min(c.value, basePrice);
  })();
  const finalPriceAfterCoupon = (selectedPrice?.price || 0) - couponDiscount;
  useEffect(() => {
    if (step !== "tracking" || !activeTrip?.driverId) return;
    const getDriverLoc = async () => {
      try {
        const res = await fetch(`/api/drivers/location?driverUserId=${activeTrip.driverId}`);
        const data = await res.json();
        if (data.lat && data.lng) {
          setDriverLoc({ lat: data.lat, lng: data.lng });
        }
      } catch {}
    };
    getDriverLoc();
    const interval = setInterval(getDriverLoc, 5000);
    return () => clearInterval(interval);
  }, [step, activeTrip?.driverId]);

  useEffect(() => {
    if (activeTrip?.status !== "driver_arrived" || !activeTrip.id) return;
    const poll = async () => { try { const res = await fetch(`/api/trips/late-fee?tripId=${activeTrip.id}`); const data = await res.json(); setLateFeeData(data); } catch {} };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [activeTrip?.status, activeTrip?.id]);

  useEffect(() => {
    if (activeTrip?.status !== "driver_arrived" || !activeTrip.driverArrivedAt) return;
    const update = () => { const diff = Date.now() - new Date(activeTrip.driverArrivedAt!).getTime(); setElapsed(Math.floor(diff / 1000)); };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeTrip?.status, activeTrip?.driverArrivedAt]);

  const handleBook = () => {
    if (!user) { toast({ title: lang === "ar" ? "سجل دخولك أولاً" : "Login first", variant: "destructive" }); return; }
    if (!from || !to) { toast({ title: lang === "ar" ? "أدخل نقطة الانطلاق والوجهة" : "Enter pickup and destination", variant: "destructive" }); return; }
    setStep("confirm");
  };

  const confirmBooking = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/trips", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, serviceType: selectedService, fromAddress: from, toAddress: to, distance: calc.distance, duration: calc.duration, price: finalPriceAfterCoupon || selectedPrice?.price, paymentMethod }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveTrip(data); setStep("tracking"); prevStatus.current = "pending";
      setTimeout(() => toast({ title: lang === "ar" ? "تم الحجز! 🚗" : "Booked! 🚗", description: lang === "ar" ? "جارٍ البحث عن سائق..." : "Finding driver..." }), 0);
    } catch (e) { toast({ title: lang === "ar" ? "فشل الحجز" : "Booking failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const handleCancel = async () => {
    if (!activeTrip || !user) return;
    try {
      const res = await fetch("/api/trips/cancel-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId: activeTrip.id, requestedBy: user.id, reason: lang === "ar" ? "إلغاء من الراكب" : "Rider cancel" }) });
      const data = await res.json();
      if (data.direct) { setStep("search"); setActiveTrip(null); setTimeout(() => toast({ title: lang === "ar" ? "تم إلغاء الرحلة" : "Trip cancelled" }), 0); }
      else { setTimeout(() => toast({ title: lang === "ar" ? "تم تقديم طلب الإلغاء للإدارة" : "Cancellation request sent" }), 0); }
    } catch { toast({ title: lang === "ar" ? "فشل الإلغاء" : "Cancel failed", variant: "destructive" }); }
  };

  if (step === "tracking" && activeTrip) {
    const status = activeTrip.status;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden border-zinc-200">
              <div className="h-96">
                <LiveMap riderLoc={riderLoc} driverLoc={driverLoc} from={activeTrip.fromAddress} to={activeTrip.toAddress} status={activeTrip.status} />
              </div>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card className="p-6 border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-black">{t("ride.driverInfo", lang)}</h2>
                {activeTrip.driverId && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setComplaintOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50"><AlertTriangle className="w-4 h-4 ml-1" />{lang === "ar" ? "شكوى" : "Complaint"}</Button>
                    <Button size="sm" variant="outline" onClick={() => setChatOpen(true)} className="relative"><MessageCircle className="w-4 h-4 ml-2" />{lang === "ar" ? "محادثة" : "Chat"}{unreadChat > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{unreadChat}</span>}</Button>
                  </div>
                )}
              </div>
              {status === "pending" && (<div className="text-center py-8"><div className="animate-spin w-12 h-12 border-4 border-zinc-200 border-t-black rounded-full mx-auto mb-4"></div><p className="font-bold text-black">{t("ride.searching", lang)}</p><p className="text-sm text-zinc-500 mt-1">{t("ride.searchingDesc", lang)}</p></div>)}
              {status === "accepted" && (<div className="space-y-3"><div className="bg-green-50 p-3 rounded-xl text-center"><p className="font-bold text-green-700">✅ {t("ride.driverAccepted", lang)}</p><p className="text-sm text-green-600">{t("ride.driverOnWay", lang)}</p></div></div>)}
              {status === "driver_arrived" && (<div className="space-y-3"><div className="bg-blue-50 p-4 rounded-xl text-center"><p className="font-bold text-blue-700 text-lg">🚗 {t("ride.driverArrived", lang)}</p><p className="text-sm text-blue-600">{t("ride.driverArrivedDesc", lang)}</p></div><div className="bg-zinc-50 p-3 rounded-xl"><div className="flex justify-between mb-2"><span className="text-sm text-zinc-500">⏱️ {t("ride.elapsed", lang)}</span><span className="font-bold text-black">{mins} {t("ride.minutes", lang)} {secs}s</span></div><div className="flex justify-between mb-2"><span className="text-sm text-zinc-500">🎁 {t("ride.freeLeft", lang)}</span><span className="font-bold text-green-600">{lateFeeData.freeMinutesLeft} {t("ride.minutes", lang)}</span></div>{lateFeeData.lateFee > 0 && (<div className="flex justify-between bg-red-50 p-2 rounded"><span className="text-sm text-red-600">⚠️ {t("ride.lateFee", lang)}</span><span className="font-bold text-red-600">{lateFeeData.lateFee} ر.س</span></div>)}</div></div>)}
              {status === "ongoing" && (<div className="bg-green-50 p-4 rounded-xl text-center"><p className="font-bold text-green-700 text-lg">🚗💨 {t("ride.tripOngoing", lang)}</p><p className="text-sm text-green-600">{t("ride.enRoute", lang)} {activeTrip.toAddress}</p><div className="mt-2 bg-yellow-50 p-2 rounded text-xs text-yellow-700">🔒 {t("ride.cancelLocked", lang)}</div></div>)}
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><span className="text-green-500">●</span><span className="text-zinc-600">{activeTrip.fromAddress}</span></div>
                <div className="flex items-center gap-2"><span className="text-red-500">■</span><span className="text-zinc-600">{activeTrip.toAddress}</span></div>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between mb-4"><span className="text-zinc-500">{t("ride.cost", lang)}</span><span className="font-bold text-black text-xl">{activeTrip.finalPrice || activeTrip.price} ر.س</span></div>
              <Button onClick={handleCancel} variant="outline" className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50">{activeTrip.cancellationLocked ? t("ride.requestCancel", lang) : t("ride.cancelTrip", lang)}</Button>
            </Card>
          </div>
        </div>
        {chatOpen && activeTrip.driverId && <ChatDialog open={chatOpen} onOpenChange={setChatOpen} tripId={activeTrip.id} currentUserId={user?.id || ""} otherUserId={activeTrip.driverId} otherName={activeTrip.driver?.name || "Driver"} lang={lang} otherAvatar={null} />}
        {complaintOpen && user && activeTrip.driverId && <ComplaintDialog open={complaintOpen} onOpenChange={setComplaintOpen} fromUserId={user.id} againstUserId={activeTrip.driverId} againstName={activeTrip.driver?.name || activeTrip.driver?.name || (lang === "ar" ? "السائق" : "Driver")} tripId={activeTrip.id} lang={lang} />}

      {ratingDialog.open && user && ratingDialog.driverId && (
        <RatingDialog
          open={ratingDialog.open}
          onOpenChange={(o) => setRatingDialog({ ...ratingDialog, open: o })}
          tripId={ratingDialog.tripId!}
          fromUserId={user.id}
          toUserId={ratingDialog.driverId!}
          targetName={ratingDialog.driverName || "Driver"}
          ratedBy="rider"
          lang={lang}
        />
      )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 order-2 lg:order-1">
          <Card className="overflow-hidden border-zinc-200"><div className="h-96 lg:h-[500px]"><iframe src={`https://www.google.com/maps?q=${encodeURIComponent((from || "Riyadh") + " Saudi Arabia")}&output=embed`} className="w-full h-full" style={{ border: 0 }} loading="lazy" /></div></Card>
        </div>
        <div className="lg:col-span-2 order-1 lg:order-2">
          <Card className="p-6 border-zinc-200">
            <h2 className="text-2xl font-bold text-black mb-6">{t("ride.title", lang)}</h2>
            <div className="space-y-3 mb-4">
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-green-500">●</span>
                <Input placeholder={t("ride.from", lang)} value={from} onChange={(e) => setFrom(e.target.value)} onFocus={() => setActiveField("from")} onBlur={() => setTimeout(() => setActiveField(null), 200)} className="pr-10 h-12 border-zinc-200 focus:border-black" />
              </div>
              <div className="flex justify-center gap-2">
                <button onClick={() => { const t = from; setFrom(to); setTo(t); }} className="p-2 hover:bg-zinc-100 rounded-lg">⇅</button>
                <button onClick={() => setFrom(lang === "ar" ? "موقعي الحالي" : "My location")} className="px-3 py-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 rounded-lg text-black">📍 {t("ride.myLocation", lang)}</button>
              </div>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-red-500">■</span>
                <Input placeholder={t("ride.to", lang)} value={to} onChange={(e) => setTo(e.target.value)} onFocus={() => setActiveField("to")} onBlur={() => setTimeout(() => setActiveField(null), 200)} className="pr-10 h-12 border-zinc-200 focus:border-black" />
              </div>
              {activeField && (<div className="bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
                {popularPlaces.map((p) => (<button key={p.id} onClick={() => { activeField === "from" ? setFrom(p.name) : setTo(p.name); setActiveField(null); }} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 text-right border-b border-zinc-50"><span className="text-xl">📍</span><div><div className="text-sm text-black">{p.name}</div><div className="text-xs text-zinc-400">{p.city}</div></div></button>))}
                {allCities.slice(0, 15).map((c, i) => (<button key={i} onClick={() => { activeField === "from" ? setFrom(c.name) : setTo(c.name); setActiveField(null); }} className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 text-right border-b border-zinc-50"><span className="text-xl">🏙️</span><div><div className="text-sm text-black">{c.name}</div><div className="text-xs text-zinc-400">{c.region}</div></div></button>))}
              </div>)}
            </div>
            {from && to && (<div className="bg-zinc-50 rounded-xl p-3 mb-4 grid grid-cols-3 gap-2 text-center text-sm"><div><div className="text-zinc-500 text-xs">{t("ride.distance", lang)}</div><div className="font-bold text-black">{calc.distance} {t("common.km", lang)}</div></div><div><div className="text-zinc-500 text-xs">{t("ride.duration", lang)}</div><div className="font-bold text-black">{calc.duration} {t("common.min", lang)}</div></div><div><div className="text-zinc-500 text-xs">{t("ride.surge", lang)}</div><div className="font-bold text-black">{calc.surge}x</div></div></div>)}
            <div className="space-y-2 mb-4">
              <h3 className="font-bold text-black mb-2">{t("ride.chooseService", lang)}</h3>
              {prices.map((opt) => (<button key={opt.id} onClick={() => setSelectedService(opt.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selectedService === opt.id ? "border-black bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"}`}><span className="text-3xl">{opt.emoji}</span><div className="flex-1 text-right"><div className="font-bold text-black">{lang === "ar" ? opt.name : t(`services.${opt.id}`, lang)}</div><div className="text-xs text-zinc-500">{opt.desc}</div></div><div className="text-left"><div className="font-bold text-black">{opt.price} ر.س</div><div className="text-xs text-zinc-500">{opt.seats} {t("ride.seats", lang)}</div></div></button>))}
            </div>
            {/* Coupon selector */}
            {userCoupons.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold text-black mb-2">🎫 {lang === "ar" ? "كوبون الخصم" : "Coupon"}</h3>
                <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
                  <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر كوبون (اختياري)" : "Select coupon (optional)"} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{lang === "ar" ? "بدون كوبون" : "No coupon"}</SelectItem>
                    {userCoupons.map(c => <SelectItem key={c.id} value={c.code}>{c.code} - {c.type === "percentage" ? `${c.value}%` : `${c.value} ر.س`} {lang === "ar" ? "خصم" : "off"}</SelectItem>)}
                  </SelectContent>
                </Select>
                {couponDiscount > 0 && (
                  <div className="mt-2 bg-green-50 border border-green-200 p-2 rounded-lg flex justify-between text-sm">
                    <span className="text-green-600">✅ {lang === "ar" ? "خصم" : "Discount"}</span>
                    <span className="font-bold text-green-600">- {couponDiscount} ر.س</span>
                  </div>
                )}
              </div>
            )}

            {/* Price summary with coupon */}
            {from && to && selectedCoupon && couponDiscount > 0 && (
              <div className="bg-zinc-50 rounded-xl p-3 mb-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-zinc-500">{lang === "ar" ? "السعر الأصلي" : "Original"}</span><span className="text-zinc-600 line-through">{selectedPrice?.price} ر.س</span></div>
                <div className="flex justify-between"><span className="text-green-600">{lang === "ar" ? "بعد الخصم" : "After discount"}</span><span className="font-bold text-green-600">{finalPriceAfterCoupon} ر.س</span></div>
              </div>
            )}

            <div className="mb-4">
              <Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">💵 {t("ride.cash", lang)}</SelectItem><SelectItem value="wallet">💰 {t("ride.wallet", lang)} ({user?.walletBalance || 0})</SelectItem><SelectItem value="card">💳 {t("ride.card", lang)}</SelectItem><SelectItem value="paypal">💳 PayPal</SelectItem><SelectItem value="stc_pay">📱 STC Pay</SelectItem></SelectContent></Select>
            </div>
            {step === "search" ? (<Button onClick={handleBook} className="w-full bg-black hover:bg-zinc-800 h-12 text-lg" disabled={!from || !to}>{user ? t("ride.confirm", lang) : t("ride.loginFirst", lang)}</Button>) : (<div className="flex gap-2"><Button variant="outline" onClick={() => setStep("search")} className="flex-1 h-12">{t("ride.back", lang)}</Button><Button onClick={confirmBooking} className="flex-1 bg-black hover:bg-zinc-800 h-12">{t("ride.confirmBooking", lang)}</Button></div>)}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ===== CHAT DIALOG =====
function ChatDialog({ open, onOpenChange, tripId, currentUserId, otherUserId, otherName, lang, otherAvatar }: { open: boolean; onOpenChange: (o: boolean) => void; tripId: string; currentUserId: string; otherUserId: string; otherName: string; lang: Lang; otherAvatar?: string | null }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMsgCount = useRef(0);
  const { toast } = useToast();

  // Fetch messages + play sound on new
  useEffect(() => {
    if (!open || !tripId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat?tripId=${tripId}&userId=${currentUserId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(prev => {
            if (data.length > prev.length) {
              // New messages arrived - play sound
              if (prev.length > 0) safePlaySound(playMessageSound);
            }
            return data;
          });
        }
      } catch {}
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [open, tripId, currentUserId]);

  // Fetch my avatar
  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/users/me?userId=${currentUserId}`)
      .then(r => r.json())
      .then(d => { if (d.avatar) setMyAvatar(d.avatar); })
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, senderId: currentUserId, receiverId: otherUserId, message: newMessage, messageType: "text" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(prev => [...prev, data]);
      setNewMessage("");
      // Play sound when I send a message too
      safePlaySound(playMessageSound);
    } catch (e) {
      toast({ title: lang === "ar" ? "فشل الإرسال" : "Send failed", variant: "destructive" });
    } finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[600px] flex flex-col">
        {/* Header with profile photo */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              {otherAvatar ? <img src={otherAvatar} alt={otherName} className="w-full h-full rounded-full object-cover" /> : <AvatarFallback className="bg-zinc-700 text-white">{(otherName || "?").charAt(0)}</AvatarFallback>}
            </Avatar>
            <div>
              <DialogTitle className="text-lg">{otherName}</DialogTitle>
              <p className="text-xs text-green-600 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{lang === "ar" ? "متصل الآن" : "Online"}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-start" : "justify-end"}`}>
                {!isMe && (
                  <Avatar className="w-8 h-8 shrink-0">
                    {otherAvatar ? <img src={otherAvatar} alt="" className="w-full h-full rounded-full object-cover" /> : <AvatarFallback className="bg-zinc-700 text-white text-xs">{(otherName || "?").charAt(0)}</AvatarFallback>}
                  </Avatar>
                )}
                <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? "bg-black text-white rounded-bl-sm" : "bg-zinc-100 text-black rounded-br-sm"}`}>
                  <p className="text-sm">{msg.message}</p>
                  <div className={`text-[10px] mt-1 ${isMe ? "text-zinc-400" : "text-zinc-500"}`}>{new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}{isMe && (msg.isRead ? " ✓✓" : " ✓")}</div>
                </div>
                {isMe && (
                  <Avatar className="w-8 h-8 shrink-0">
                    {myAvatar ? <img src={myAvatar} alt="" className="w-full h-full rounded-full object-cover" /> : <AvatarFallback className="bg-black text-white text-xs">{"?"}</AvatarFallback>}
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2 p-2 border-t border-zinc-200">
          <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !sending) sendMessage(); }} placeholder={lang === "ar" ? "اكتب رسالة..." : "Type a message..."} className="flex-1" />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="bg-black hover:bg-zinc-800">{lang === "ar" ? "إرسال" : "Send"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== COMPLAINT DIALOG =====
function ComplaintDialog({ open, onOpenChange, fromUserId, againstUserId, againstName, tripId, lang }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  fromUserId: string;
  againstUserId?: string;
  againstName?: string;
  tripId?: string;
  lang: Lang;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const subjects = lang === "ar" ? [
    "سلوك سيئ", "تأخر غير مبرر", "إلغاء متكرر", "عدم دفع الأجرة",
    "مخالفة قوانين", "معلومات خاطئة", "أخرى"
  ] : [
    "Bad behavior", "Unjustified delay", "Frequent cancellation", "Non-payment",
    "Rule violation", "False information", "Other"
  ];

  const submit = async () => {
    if (!subject || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromUserId, againstUserId, subject, description, tripId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: lang === "ar" ? "تم إرسال الشكوى ✅" : "Complaint sent ✅" });
      setSubject(""); setDescription("");
      onOpenChange(false);
    } catch (e) {
      toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{lang === "ar" ? "تقديم شكوى" : "File a complaint"}</DialogTitle>
          <DialogDescription>
            {againstName ? (lang === "ar" ? `ضد: ${againstName}` : `Against: ${againstName}`) : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>{lang === "ar" ? "موضوع الشكوى" : "Subject"}</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder={lang === "ar" ? "اختر الموضوع" : "Select subject"} /></SelectTrigger>
              <SelectContent>
                {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{lang === "ar" ? "التفاصيل" : "Description"}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={lang === "ar" ? "اكتب تفاصيل الشكوى..." : "Describe your complaint..."} />
          </div>
          <Button onClick={submit} disabled={submitting || !subject || !description.trim()} className="w-full bg-red-600 hover:bg-red-700 h-12">
            {submitting ? (lang === "ar" ? "جارٍ الإرسال..." : "Sending...") : (lang === "ar" ? "إرسال الشكوى" : "Submit complaint")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== TRIPS VIEW =====
function TripsView({ user, lang }: { user: User | null; lang: Lang }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled" | "active">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/trips?userId=${user.id}`).then((r) => r.json()).then((d) => { setTrips(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const filtered = trips.filter((t) => { if (filter === "all") return true; if (filter === "active") return ["pending", "accepted", "driver_arrived", "ongoing"].includes(t.status); return t.status === filter; });
  if (loading) return <div className="text-center py-20">{lang === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-black mb-6">{t("trips.title", lang)}</h1>
      <div className="      <div className="flex gap-2 mb-6 flex-wrap">         {[{ id: "all", l: t("trips.all", lang) }, { id: "active", l: lang === "ar" ? "نشطة" : "Active" }, { id: "completed", l: t("trips.completed", lang) }, { id: "cancelled", l: t("trips.cancelled", lang) }].map((tab) => (
        {[{ id: "all", l: t("trips.all", lang) }, { id: "completed", l: t("trips.completed", lang) }, { id: "cancelled", l: t("trips.cancelled", lang) }].map((tab) => (
          <Button key={tab.id} variant={filter === tab.id ? "default" : "outline"} onClick={() => setFilter(tab.id as typeof filter)} className={filter === tab.id ? "bg-black hover:bg-zinc-800" : ""}>{tab.l}</Button>
        ))}
      </div>
      <div className="space-y-3">
               {filtered.map((trip) => {
          const service = serviceTypes.find((s) => s.id === trip.serviceType);
          const statusInfo: Record<string, { label: string; color: string }> = {
            pending: { label: lang === "ar" ? "بانتظار السائق" : "Pending", color: "bg-amber-500" },
            accepted: { label: lang === "ar" ? "تم القبول" : "Accepted", color: "bg-blue-500" },
            driver_arrived: { label: lang === "ar" ? "السائق وصل" : "Driver Arrived", color: "bg-cyan-500" },
            ongoing: { label: lang === "ar" ? "قيد التنفيذ" : "Ongoing", color: "bg-purple-500" },
            completed: { label: lang === "ar" ? "مكتملة" : "Completed", color: "bg-green-600" },
            cancelled: { label: lang === "ar" ? "ملغاة" : "Cancelled", color: "bg-red-500" },
          };
          const si = statusInfo[trip.status] || statusInfo.pending;
          return (
            <Card key={trip.id} className="p-4 border-zinc-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{service?.emoji || "🚗"}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <div className="flex gap-2 items-center flex-wrap">
                      <Badge className={`${si.color} text-white`}>{si.label}</Badge>
                      <span className="text-sm text-zinc-500">{service?.name || trip.serviceType}</span>
                      <span className="text-sm text-zinc-400">{new Date(trip.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>
                    <span className="font-bold text-black">{trip.finalPrice || trip.price} ر.س</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2"><span className="text-green-500">●</span><span className="text-zinc-600">{trip.fromAddress}</span></div>
                    <div className="flex items-center gap-2"><span className="text-red-500">■</span><span className="text-zinc-600">{trip.toAddress}</span></div>
                  </div>
                  {(trip.driver || trip.user) && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-500">
                      {trip.driver && <span>🚗 {trip.driver.name} - {trip.driver.phone}</span>}
                      {trip.user && <span>👤 {trip.user.name} - {trip.user.phone}</span>}
                    </div>
                  )}
                  <div className="mt-2 flex justify-between text-xs">
                    <span className="text-zinc-400">{lang === "ar" ? "المسافة" : "Distance"}: {trip.distance} {t("common.km", lang)}</span>
                    <span className="text-zinc-400">{lang === "ar" ? "المدة" : "Duration"}: {trip.duration} {lang === "ar" ? "د" : "min"}</span>
                  </div>
                  {trip.unpaidAmount ? <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">⚠️ {lang === "ar" ? "مبلغ غير مدفوع" : "Unpaid"}: {trip.unpaidAmount} ر.س</div> : null}
                  {trip.rating ? <div className="mt-2 text-xs text-amber-600">⭐ {trip.rating}/5 {trip.review && `— ${trip.review}`}</div> : null}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-20 text-zinc-500">{t("trips.noTrips", lang)}</div>}
      </div>
    </div>
  );
}

// ===== DRIVER VIEW =====
function DriverView({ user, lang }: { user: User | null; lang: Lang }) {
  const [driverData, setDriverData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [availableTrips, setAvailableTrips] = useState<Trip[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; tripId?: string; finalPrice?: number }>({ open: false });
  const [cashReceived, setCashReceived] = useState("");
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [riderLoc, setRiderLoc] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();
  const prevTripsCount = useRef(0);

  // Fetch online status from server and poll for trips
  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/drivers/active-trip?driverId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          // Sync online status from server (persists across page navigation)
          setOnline(data.isOnline ?? false);
          setActiveTrip(data.activeTrip);
          setAvailableTrips(data.availableTrips || []);
                   if (data.availableTrips.length > prevTripsCount.current) {
            safePlaySound(playNewRequestSound);
            setTimeout(() => toast({ title: lang === "ar" ? `🚨 لديك ${data.availableTrips.length} طلب جديد!` : `🚨 ${data.availableTrips.length} new requests!` }), 0);
          }
          prevTripsCount.current = data.availableTrips.length;)
                    
        }
      } catch {}
      setLoading(false);
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Toggle online status - persists to server
  const toggleOnline = async (newOnline: boolean) => {
    setOnline(newOnline); // Optimistic update
    if (!user) return;
    try {
      await fetch("/api/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: user.id, isOnline: newOnline }),
      });
    } catch {
      // Revert on error
      setOnline(!newOnline);
    }
  };

  // Send driver GPS location every 5 seconds when online or has active trip
  useEffect(() => {
    if (!user || (!online && !activeTrip)) return;
    const sendLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverLoc(loc);
          fetch("/api/drivers/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driverUserId: user.id, lat: loc.lat, lng: loc.lng, heading: pos.coords.heading, speed: pos.coords.speed }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
    sendLocation();
    const interval = setInterval(sendLocation, 5000);
    return () => clearInterval(interval);
  }, [user, online, activeTrip]);

  // Get rider's location when has active trip
  useEffect(() => {
    if (!activeTrip?.userId) return;
    const getRiderLoc = async () => {
      try {
        const res = await fetch(`/api/users/location?userId=${activeTrip.userId}`);
        const data = await res.json();
        if (data.currentLat && data.currentLng) {
          setRiderLoc({ lat: data.currentLat, lng: data.currentLng });
        }
      } catch {}
    };
    getRiderLoc();
    const interval = setInterval(getRiderLoc, 5000);
    return () => clearInterval(interval);
  }, [activeTrip?.userId]);

  const acceptTrip = async (tripId: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/trips/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, driverId: user.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimeout(() => toast({ title: lang === "ar" ? "تم قبول الرحلة! ✅" : "Trip accepted! ✅" }), 0);
    } catch (e) { toast({ title: lang === "ar" ? "فشل" : "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const driverArrived = async () => {
    if (!activeTrip || !user) return;
    try {
      const res = await fetch("/api/trips/driver-arrived", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId: activeTrip.id, driverId: user.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimeout(() => toast({ title: lang === "ar" ? "تم إعلان وصولك" : "Arrival announced" }), 0);
    } catch (e) { toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" }); }
  };

  const startTrip = async () => {
    if (!activeTrip || !user) return;
    try {
      const res = await fetch("/api/trips/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId: activeTrip.id, driverId: user.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimeout(() => toast({ title: lang === "ar" ? "بدأت الرحلة! 🔒" : "Trip started! 🔒" }), 0);
    } catch (e) { toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" }); }
  };

  const [driverRatingDialog, setDriverRatingDialog] = useState<{ open: boolean; tripId?: string; riderId?: string; riderName?: string }>({ open: false });
  const [unreadChat, setUnreadChat] = useState(0);

  const completeWithPayment = async () => {
    if (!activeTrip || !user) return;
    const received = parseFloat(cashReceived) || 0;
    const finalPrice = activeTrip.finalPrice || activeTrip.price;
    const unpaid = Math.max(0, finalPrice - received);
    if (unpaid > 0 && !confirm(lang === "ar" ? `المبلغ غير المدفوع: ${unpaid} ر.س\nسيتم إبلاغ الإدارة. متابعة؟` : `Unpaid: ${unpaid} SAR. Continue?`)) return;
    try {
      const res = await fetch("/api/trips/complete-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId: activeTrip.id, driverId: user.id, cashReceived: received }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimeout(() => toast({ title: data.message }), 0);
      setPaymentDialog({ open: false }); setCashReceived("");
      // Show rating dialog for driver to rate rider
      setDriverRatingDialog({ open: true, tripId: activeTrip.id, riderId: activeTrip.userId, riderName: activeTrip.user?.name || (lang === "ar" ? "الراكب" : "Rider") });
    } catch (e) { toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" }); }
  };

  // Poll unread chat messages
  useEffect(() => {
    if (!user || !activeTrip) return;
    const checkUnread = async () => {
      try {
        const res = await fetch(`/api/chat?tripId=${activeTrip.id}&userId=${user.id}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const unread = data.filter((m: any) => m.receiverId === user.id && !m.isRead).length;
          setUnreadChat(unread);
        }
      } catch {}
    };
    checkUnread();
    const interval = setInterval(checkUnread, 3000);
    return () => clearInterval(interval);
  }, [user, activeTrip]);

  if (loading) return <div className="text-center py-20">{lang === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Card className="p-6 mb-6 border-zinc-200 bg-black text-white">
        <div className="flex items-center justify-between">
          <div><h2 className="text-2xl font-bold mb-1">{t("driver.status", lang)}</h2><p className="text-zinc-400">{online ? t("driver.onlineDesc", lang) : t("driver.offlineDesc", lang)}</p></div>
          <div className="flex items-center gap-3"><span className={online ? "text-green-400" : "text-zinc-500"}>{online ? t("driver.online", lang) : t("driver.offline", lang)}</span><Switch checked={online} onCheckedChange={toggleOnline} /></div>
        </div>
      </Card>

      {/* Live Map showing driver + rider locations */}
      {activeTrip && (
        <Card className="overflow-hidden mb-6 border-zinc-200">
          <div className="h-64">
            <LiveMap riderLoc={riderLoc} driverLoc={driverLoc} from={activeTrip.fromAddress} to={activeTrip.toAddress} status={activeTrip.status} />
          </div>
        </Card>
      )}

      {activeTrip && (
        <Card className="p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-black text-lg">{t("driver.activeTrip", lang)}</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setChatOpen(true)} className="relative"><MessageCircle className="w-4 h-4 ml-1" />{lang === "ar" ? "محادثة" : "Chat"}{unreadChat > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{unreadChat}</span>}</Button>
              <Button size="sm" variant="outline" onClick={() => setComplaintOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50"><AlertTriangle className="w-4 h-4 ml-1" />{lang === "ar" ? "شكوى" : "Complaint"}</Button>
            </div>
          </div>
          <div className="bg-zinc-50 p-3 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2"><span className="text-green-500">●</span><span className="text-black">{activeTrip.fromAddress}</span></div>
            <div className="flex items-center gap-2"><span className="text-red-500">■</span><span className="text-black">{activeTrip.toAddress}</span></div>
            <div className="mt-2 flex justify-between text-sm"><span className="text-zinc-500">{t("ride.cost", lang)}</span><span className="font-bold text-black">{activeTrip.finalPrice || activeTrip.price} ر.س</span></div>
            {activeTrip.user && (
              <div className="mt-2 pt-2 border-t border-zinc-200 text-sm text-zinc-500">{lang === "ar" ? "الراكب" : "Rider"}: {activeTrip.user.name} - {activeTrip.user.phone}</div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeTrip.status === "accepted" && <Button onClick={driverArrived} className="bg-blue-600 hover:bg-blue-700 flex-1">🚗 {t("driver.arriveBtn", lang)}</Button>}
            {activeTrip.status === "driver_arrived" && <Button onClick={startTrip} className="bg-green-600 hover:bg-green-700 flex-1">🚀 {t("driver.startTrip", lang)}</Button>}
            {activeTrip.status === "ongoing" && <Button onClick={() => setPaymentDialog({ open: true, tripId: activeTrip.id, finalPrice: activeTrip.finalPrice || activeTrip.price })} className="bg-black hover:bg-zinc-800 flex-1">✅ {t("driver.completeTrip", lang)}</Button>}
          </div>
        </Card>
      )}

      {online && !activeTrip && (
        <div>
          <h3 className="text-xl font-bold text-black mb-3">{t("driver.availableRequests", lang)}</h3>
          <div className="space-y-3">
            {availableTrips.map((trip) => (
              <Card key={trip.id} className="p-4 border-zinc-200">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12"><AvatarFallback>{trip.user?.name?.charAt(0) || "؟"}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="font-bold text-black">{trip.user?.name || "Rider"}</div>
                    <div className="text-sm text-zinc-500">{trip.fromAddress} ← {trip.toAddress} • {trip.distance} {t("common.km", lang)}</div>
                  </div>
                  <div className="text-left"><div className="font-bold text-black">{trip.price} ر.س</div><Button size="sm" onClick={() => acceptTrip(trip.id)} className="bg-black hover:bg-zinc-800 mt-1">{t("driver.accept", lang)}</Button></div>
                </div>
              </Card>
            ))}
            {availableTrips.length === 0 && <Card className="p-12 text-center text-zinc-500">{lang === "ar" ? "لا توجد طلبات حالياً" : "No requests"}</Card>}
          </div>
        </div>
      )}

      {!online && !activeTrip && (<Card className="p-12 border-zinc-200 text-center"><div className="text-6xl mb-4">😴</div><h3 className="text-xl font-bold text-black mb-2">{t("driver.offlineMsg", lang)}</h3><p className="text-zinc-500 mb-6">{t("driver.offlineDescMsg", lang)}</p><Button onClick={() => toggleOnline(true)} className="bg-black hover:bg-zinc-800 h-12 px-8">{t("driver.startWork", lang)}</Button></Card>)}

      {chatOpen && activeTrip && <ChatDialog open={chatOpen} onOpenChange={setChatOpen} tripId={activeTrip.id} currentUserId={user?.id || ""} otherUserId={activeTrip.userId} otherName={activeTrip.user?.name || "Rider"} lang={lang} otherAvatar={null} />}

      {complaintOpen && user && activeTrip && <ComplaintDialog open={complaintOpen} onOpenChange={setComplaintOpen} fromUserId={user.id} againstUserId={activeTrip.userId} againstName={activeTrip.user?.name || "Rider"} tripId={activeTrip.id} lang={lang} />}

      {driverRatingDialog.open && user && driverRatingDialog.riderId && (
        <RatingDialog open={driverRatingDialog.open} onOpenChange={(o) => setDriverRatingDialog({ ...driverRatingDialog, open: o })} tripId={driverRatingDialog.tripId!} fromUserId={user.id} toUserId={driverRatingDialog.riderId!} targetName={driverRatingDialog.riderName || "Rider"} ratedBy="driver" lang={lang} />
      )}

      <Dialog open={paymentDialog.open} onOpenChange={(o) => setPaymentDialog({ ...paymentDialog, open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{lang === "ar" ? "تأكيد الدفع وإنهاء الرحلة" : "Confirm Payment"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-zinc-50 p-4 rounded-xl"><div className="flex justify-between"><span className="text-zinc-500">{lang === "ar" ? "السعر الإجمالي" : "Total"}</span><span className="font-bold text-black text-xl">{paymentDialog.finalPrice} ر.س</span></div></div>
            <div><Label>{lang === "ar" ? "المبلغ المستلم بالكاش" : "Cash received"}</Label><Input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="0" className="h-12 text-lg" /></div>
            {cashReceived && parseFloat(cashReceived) < (paymentDialog.finalPrice || 0) && (<div className="bg-red-50 border border-red-200 p-3 rounded-xl"><div className="flex justify-between"><span className="text-red-600 font-medium">⚠️ {lang === "ar" ? "المبلغ غير المدفوع" : "Unpaid"}</span><span className="font-bold text-red-600">{(paymentDialog.finalPrice || 0) - parseFloat(cashReceived)} ر.س</span></div><p className="text-xs text-red-500 mt-2">{lang === "ar" ? "سيتم إبلاغ الإدارة فوراً وخصم المبلغ من محفظة الراكب" : "Admin will be notified and amount deducted from rider's wallet"}</p></div>)}
            <Button onClick={completeWithPayment} className="w-full bg-black hover:bg-zinc-800 h-12">{lang === "ar" ? "تأكيد الدفع وإنهاء الرحلة" : "Confirm & Complete"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== DRIVER REGISTER VIEW =====
function DriverRegisterView({ user, lang }: { user: User | null; lang: Lang }) {
  const [step, setStep] = useState(1);
  const [car, setCar] = useState({ model: "", plate: "", color: "", year: "" });
  const [license, setLicense] = useState({ number: "", expiry: "" });
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const docTypes = [{ id: "license", l: t("driverReg.license", lang), i: "📄" }, { id: "national_id", l: t("driverReg.nationalId", lang), i: "🆔" }, { id: "car_registration", l: t("driverReg.carRegistration", lang), i: "📋" }, { id: "insurance", l: t("driverReg.insurance", lang), i: "🛡️" }, { id: "profile_photo", l: t("driverReg.profilePhoto", lang), i: "📸" }, { id: "vehicle_photo", l: t("driverReg.vehiclePhoto", lang), i: "🚗" }];

  const handleFile = (file: File, docType: string) => {
    if (file.size > 5 * 1024 * 1024) { toast({ title: lang === "ar" ? "الملف كبير جداً" : "File too large", variant: "destructive" }); return; }
    const reader = new FileReader();
    reader.onload = () => { setDocs((p) => ({ ...p, [docType]: reader.result as string })); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const documents = Object.entries(docs).map(([type, fileData]) => ({ type, fileName: `${type}.jpg`, fileData, mimeType: "image/jpeg", fileSize: fileData.length }));
      const res = await fetch("/api/drivers/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, carModel: car.model, carPlate: car.plate, carColor: car.color, carYear: car.year, licenseNumber: license.number, licenseExpiry: license.expiry, documents }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      setTimeout(() => toast({ title: lang === "ar" ? "تم التسجيل! 🎉" : "Registered! 🎉" }), 0);
    } catch (e) { toast({ title: lang === "ar" ? "فشل التسجيل" : "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  if (done) return (<div className="max-w-md mx-auto px-4 py-20 text-center"><div className="text-6xl mb-4">✅</div><h2 className="text-2xl font-bold text-black mb-2">{t("driverReg.success", lang)}</h2><p className="text-zinc-500 mb-6">{t("driverReg.successDesc", lang)}</p></div>);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-black mb-2">{t("driverReg.title", lang)}</h1>
      <p className="text-zinc-500 mb-6">{t("driverReg.step", lang)} {step} {t("driverReg.of", lang)} 4</p>
      <Progress value={(step / 4) * 100} className="mb-6" />
      {step === 1 && (<Card className="p-6 border-zinc-200"><h2 className="text-xl font-bold text-black mb-4">{t("driverReg.carInfo", lang)}</h2><div className="space-y-4"><div><Label>{t("driverReg.carModel", lang)}</Label><Input value={car.model} onChange={(e) => setCar({ ...car, model: e.target.value })} placeholder={t("driverReg.carModelPlaceholder", lang)} /></div><div><Label>{t("driverReg.carPlate", lang)}</Label><Input value={car.plate} onChange={(e) => setCar({ ...car, plate: e.target.value })} /></div><div><Label>{t("driverReg.carColor", lang)}</Label><Input value={car.color} onChange={(e) => setCar({ ...car, color: e.target.value })} /></div><div><Label>{t("driverReg.carYear", lang)}</Label><Input value={car.year} onChange={(e) => setCar({ ...car, year: e.target.value })} placeholder="2023" /></div></div><Button onClick={() => setStep(2)} className="w-full bg-black hover:bg-zinc-800 h-12 mt-6" disabled={!car.model || !car.plate}>{t("driverReg.next", lang)} ←</Button></Card>)}
      {step === 2 && (<Card className="p-6 border-zinc-200"><h2 className="text-xl font-bold text-black mb-4">{t("driverReg.licenseInfo", lang)}</h2><div className="space-y-4"><div><Label>{t("driverReg.licenseNumber", lang)}</Label><Input value={license.number} onChange={(e) => setLicense({ ...license, number: e.target.value })} /></div><div><Label>{t("driverReg.licenseExpiry", lang)}</Label><Input type="date" value={license.expiry} onChange={(e) => setLicense({ ...license, expiry: e.target.value })} /></div></div><div className="flex gap-2 mt-6"><Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">{t("ride.back", lang)}</Button><Button onClick={() => setStep(3)} className="flex-1 bg-black hover:bg-zinc-800 h-12" disabled={!license.number}>{t("driverReg.next", lang)} ←</Button></div></Card>)}
      {step === 3 && (<Card className="p-6 border-zinc-200"><h2 className="text-xl font-bold text-black mb-4">{t("driverReg.documents", lang)}</h2><div className="grid grid-cols-2 gap-4">{docTypes.map((doc) => (<div key={doc.id} className="border-2 border-dashed border-zinc-200 rounded-xl p-4 text-center"><div className="text-3xl mb-2">{doc.i}</div><div className="text-sm font-medium text-black mb-2">{doc.l}</div>{docs[doc.id] ? (<div className="relative"><img src={docs[doc.id]} alt={doc.l} className="w-full h-24 object-cover rounded-lg" /><button onClick={() => { const d = { ...docs }; delete d[doc.id]; setDocs(d); }} className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs">✕</button></div>) : (<label className="cursor-pointer"><input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, doc.id); }} /><span className="text-xs text-blue-600">{t("driverReg.upload", lang)}</span></label>)}</div>))}</div><div className="flex gap-2 mt-6"><Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">{t("ride.back", lang)}</Button><Button onClick={() => setStep(4)} className="flex-1 bg-black hover:bg-zinc-800 h-12" disabled={Object.keys(docs).length < 4}>{t("driverReg.next", lang)} ←</Button></div></Card>)}
      {step === 4 && (<Card className="p-6 border-zinc-200"><h2 className="text-xl font-bold text-black mb-4">{t("driverReg.review", lang)}</h2><div className="space-y-3 mb-6"><div className="bg-zinc-50 p-3 rounded-lg"><div className="text-sm text-zinc-500 mb-1">{t("driverReg.carInfo", lang)}</div><div className="font-medium text-black">{car.model} - {car.plate} - {car.color} - {car.year}</div></div><div className="bg-zinc-50 p-3 rounded-lg"><div className="text-sm text-zinc-500 mb-1">{t("driverReg.licenseInfo", lang)}</div><div className="font-medium text-black">{license.number}</div></div><div className="bg-zinc-50 p-3 rounded-lg"><div className="text-sm text-zinc-500 mb-1">{t("driverReg.documents", lang)}</div><div className="font-medium text-black">{Object.keys(docs).length} {lang === "ar" ? "مستند" : "documents"}</div></div></div><div className="flex gap-2"><Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12">{t("ride.back", lang)}</Button><Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-black hover:bg-zinc-800 h-12">{loading ? t("driverReg.submitting", lang) : t("driverReg.submit", lang)}</Button></div></Card>)}
    </div>
  );
}

// ===== BANK VIEW =====
function BankView({ user, lang }: { user: User | null; lang: Lang }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [paypalStatus, setPaypalStatus] = useState<{ connected: boolean; email?: string }>({ connected: false });
  const [showAdd, setShowAdd] = useState(false);
  const [showPaypal, setShowPaypal] = useState(false);
  const [newAcc, setNewAcc] = useState({ bankName: "", accountName: "", iban: "" });
  const [paypalEmail, setPaypalEmail] = useState("");
  const { toast } = useToast();

  const loadData = useCallback(() => {
    if (!user) return;
    fetch(`/api/bank-accounts?userId=${user.id}`).then((r) => r.json()).then((d) => setAccounts(Array.isArray(d) ? d : []));
    fetch(`/api/paypal?userId=${user.id}`).then((r) => r.json()).then((d) => setPaypalStatus(d));
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const addAccount = async () => {
    if (!user || !newAcc.bankName || !newAcc.iban) { toast({ title: lang === "ar" ? "بيانات ناقصة" : "Missing data", variant: "destructive" }); return; }
    try {
      const res = await fetch("/api/bank-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newAcc, userId: user.id, accountType: "bank" }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowAdd(false); setNewAcc({ bankName: "", accountName: "", iban: "" }); loadData();
      setTimeout(() => toast({ title: lang === "ar" ? "تمت الإضافة ✅" : "Added ✅" }), 0);
    } catch (e) { toast({ title: lang === "ar" ? "فشل" : "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  const connectPaypal = async () => {
    if (!user || !paypalEmail) { toast({ title: lang === "ar" ? "أدخل بريد PayPal" : "Enter PayPal email", variant: "destructive" }); return; }
    try {
      const res = await fetch("/api/paypal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, paypalEmail, accountName: user.name }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowPaypal(false); setPaypalEmail(""); loadData();
      setTimeout(() => toast({ title: lang === "ar" ? "تم ربط PayPal ✅" : "PayPal connected ✅" }), 0);
    } catch (e) { toast({ title: lang === "ar" ? "فشل" : "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold text-black">{t("bank.title", lang)}</h1>
        <div className="flex gap-2"><Button onClick={() => setShowPaypal(true)} variant="outline" className="border-blue-200 text-blue-600">💳 PayPal</Button><Button onClick={() => setShowAdd(true)} className="bg-black hover:bg-zinc-800">{t("bank.addAccount", lang)}</Button></div>
      </div>
      <Card className="p-6 mb-6 border-zinc-200 bg-zinc-50"><h2 className="font-bold text-black mb-4">{t("bank.platformAccounts", lang)}</h2><div className="space-y-3">{platformBankAccounts.map((acc) => (<div key={acc.id} className="bg-white rounded-xl p-4 border border-zinc-200"><div className="flex justify-between mb-2"><span className="font-bold text-black">{acc.bankName}</span>{acc.primary && <Badge className="bg-black">{t("bank.primary", lang)}</Badge>}</div><div className="text-sm text-zinc-500">IBAN: <span className="font-mono font-bold text-black">{acc.iban}</span></div><Button variant="outline" size="sm" className="mt-2" onClick={() => { navigator.clipboard?.writeText(acc.iban.replace(/\s/g, "")); toast({ title: t("bank.copied", lang) }); }}>{t("bank.copyIban", lang)}</Button></div>))}</div></Card>
      <h2 className="text-lg font-bold text-black mb-3">{t("bank.myAccounts", lang)}</h2>
      {paypalStatus.connected && (<Card className="p-4 mb-3 border-blue-200 bg-blue-50"><div className="flex items-center gap-3"><span className="text-3xl">💳</span><div className="flex-1"><div className="font-bold text-black">PayPal</div><div className="text-sm text-zinc-600">{paypalStatus.email}</div></div><Badge className="bg-green-600">{t("bank.connected", lang)}</Badge></div></Card>)}
      {accounts.map((acc) => (<Card key={acc.id} className="p-4 mb-3 border-zinc-200"><div className="flex items-center gap-3"><span className="text-3xl">🏦</span><div className="flex-1"><div className="font-bold text-black">{acc.bankName}</div><div className="text-sm text-zinc-500 font-mono">{acc.iban}</div></div>{acc.isDefault && <Badge className="bg-black">{t("bank.default", lang)}</Badge>}</div></Card>))}
      {accounts.length === 0 && !paypalStatus.connected && (<Card className="p-12 border-zinc-200 text-center"><div className="text-6xl mb-4">💳</div><p className="text-zinc-500">{t("bank.noAccounts", lang)}</p></Card>)}
      <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogContent><DialogHeader><DialogTitle>{t("bank.addBank", lang)}</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div><Label>{t("bank.bankName", lang)}</Label><Select value={newAcc.bankName} onValueChange={(v) => setNewAcc({ ...newAcc, bankName: v })}><SelectTrigger><SelectValue placeholder={t("bank.chooseBank", lang)} /></SelectTrigger><SelectContent>{saudiBanks.map((b) => <SelectItem key={b.id} value={b.name}>{b.logo} {b.name}</SelectItem>)}</SelectContent></Select></div><div><Label>{t("bank.accountHolder", lang)}</Label><Input value={newAcc.accountName} onChange={(e) => setNewAcc({ ...newAcc, accountName: e.target.value })} /></div><div><Label>{t("bank.iban", lang)}</Label><Input value={newAcc.iban} onChange={(e) => setNewAcc({ ...newAcc, iban: e.target.value })} placeholder="SA00 0000 0000 0000 0000 0000" className="font-mono" /></div><Button onClick={addAccount} className="w-full bg-black hover:bg-zinc-800 h-12">{t("bank.add", lang)}</Button></div></DialogContent></Dialog>
      <Dialog open={showPaypal} onOpenChange={setShowPaypal}><DialogContent><DialogHeader><DialogTitle>💳 {t("bank.connectPaypal", lang)}</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div><Label>{t("bank.paypalEmail", lang)}</Label><Input value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} placeholder="email@example.com" /></div><Button onClick={connectPaypal} className="w-full bg-blue-600 hover:bg-blue-700 h-12">{t("bank.connect", lang)}</Button></div></DialogContent></Dialog>
    </div>
  );
}

// ===== PROFILE VIEW =====
function ProfileView({ user, lang, onLogout }: { user: User | null; lang: Lang; onLogout: () => void }) {
  const [tab, setTab] = useState<"info" | "wallet" | "settings">("info");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [complaintOpen, setComplaintOpen] = useState(false);
  useEffect(() => { const stored = localStorage.getItem("uber_sound"); if (stored !== null) setSoundEnabled(stored === "true"); }, []);
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Card className="p-6 mb-6 border-zinc-200"><div className="flex items-center gap-4"><Avatar className="w-20 h-20">{(user as any)?.avatar ? <img src={(user as any).avatar} alt={user.name} className="w-full h-full rounded-full object-cover" /> : <AvatarFallback className="text-2xl bg-black text-white">{(user.name || "?").charAt(0)}</AvatarFallback>}</Avatar><div className="flex-1"><h1 className="text-2xl font-bold text-black">{user.name}</h1><div className="flex items-center gap-3 mt-1"><span className="flex items-center gap-1">⭐ {user.rating}</span>{user.isAdmin && <Badge className="bg-black">{t("profile.adminBadge", lang)}</Badge>}{user.isVerified && <Badge variant="secondary">{t("profile.verified", lang)}</Badge>}</div><p className="text-sm text-zinc-500 mt-1">{user.phone}</p></div></div></Card>
      <div className="flex gap-2 mb-6">{[{ id: "info", l: t("profile.info", lang) }, { id: "wallet", l: t("profile.wallet", lang) }, { id: "settings", l: t("profile.settings", lang) }].map((tb) => (<Button key={tb.id} variant={tab === tb.id ? "default" : "outline"} onClick={() => setTab(tb.id as typeof tab)} className={tab === tb.id ? "bg-black hover:bg-zinc-800" : ""}>{tb.l}</Button>))}
      </div>
      {tab === "info" && (<Card className="p-6 border-zinc-200"><h3 className="font-bold text-black mb-4">{lang === "ar" ? "المعلومات الشخصية" : "Personal Info"}</h3><div className="space-y-3">{[{ l: t("profile.fullName", lang), v: user.name }, { l: t("profile.email", lang), v: user.email }, { l: t("profile.phone", lang), v: user.phone }, { l: t("profile.city", lang), v: user.city || "-" }, { l: t("profile.region", lang), v: user.region || "-" }].map((item, i) => (<div key={i} className="flex justify-between py-3 border-b border-zinc-100"><span className="text-zinc-500">{item.l}</span><span className="font-medium text-black">{item.v}</span></div>))}</div></Card>)}
      {tab === "wallet" && (<Card className="p-6 border-zinc-200 bg-gradient-to-br from-black to-zinc-800 text-white"><p className="text-zinc-400 text-sm">{t("profile.walletBalance", lang)}</p><p className="text-4xl font-bold mt-1">{user.walletBalance} ر.س</p><Button className="mt-4 bg-white text-black hover:bg-zinc-200">{t("profile.topup", lang)}</Button></Card>)}
      {tab === "settings" && (<Card className="p-6 border-zinc-200"><h3 className="font-bold text-black mb-4">{t("profile.notifications", lang)}</h3><div className="space-y-3"><div className="flex items-center justify-between py-3 border-b border-zinc-100"><div><div className="font-medium text-black">🔊 {lang === "ar" ? "الأصوات التنبيهية" : "Alert Sounds"}</div><div className="text-sm text-zinc-500">{lang === "ar" ? "أصوات للطلبات والإشعارات" : "Sounds for requests and notifications"}</div></div><Switch checked={soundEnabled} onCheckedChange={(checked) => { setSoundEnabled(checked); localStorage.setItem("uber_sound", checked ? "true" : "false"); }} /></div></div></Card>)}

      {/* Coupons section always visible */}
      <div className="mt-6"><CouponsSection userId={user.id} lang={lang} /></div>
      <Button onClick={() => setComplaintOpen(true)} variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 h-12 mt-4 flex items-center gap-2 justify-center"><AlertTriangle className="w-5 h-5" />{lang === "ar" ? "تقديم شكوى" : "File a complaint"}</Button>

      <Button onClick={onLogout} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 h-12 mt-3 flex items-center gap-2 justify-center"><LogOut className="w-5 h-5" />{t("nav.logout", lang)}</Button>

      {complaintOpen && user && <ComplaintDialog open={complaintOpen} onOpenChange={setComplaintOpen} fromUserId={user.id} lang={lang} />}
    </div>
  );
}

// ===== ADMIN VIEW =====
function AdminView({ user, lang }: { user: User | null; lang: Lang }) {
  const [tab, setTab] = useState<"dashboard" | "drivers" | "trips" | "cancellations" | "unpaid" | "complaints" | "coupons">("dashboard");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [tripFilter, setTripFilter] = useState("all");
  const [allCoupons, setAllCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: "", type: "fixed", value: "", maxUses: "1" });

  const loadComplaints = useCallback(() => { if (user) fetch(`/api/complaints?adminId=${user.id}`).then(r => r.json()).then(d => setComplaints(Array.isArray(d) ? d : [])).catch(() => {}); }, [user]);
  const loadAllTrips = useCallback(() => { if (user) fetch(`/api/admin/trips?adminId=${user.id}&limit=100`).then(r => r.json()).then(d => setAllTrips(Array.isArray(d) ? d : [])).catch(() => {}); }, [user]);
  const loadCoupons = useCallback(() => { if (user) fetch(`/api/admin/coupons?adminId=${user.id}`).then(r => r.json()).then(d => setAllCoupons(Array.isArray(d) ? d : [])).catch(() => {}); }, [user]);

  useEffect(() => { if (tab === "complaints") loadComplaints(); }, [tab, loadComplaints]);
  useEffect(() => { if (tab === "trips") loadAllTrips(); }, [tab, loadAllTrips]);
  useEffect(() => { if (tab === "coupons") loadCoupons(); }, [tab, loadCoupons]);
  const [stats, setStats] = useState<any>(null);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [cancellations, setCancellations] = useState<any[]>([]);
  const [unpaidTrips, setUnpaidTrips] = useState<any[]>([]);
  const { toast } = useToast();

  const loadStats = useCallback(() => { fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {}); }, []);
  const loadDrivers = useCallback(() => { fetch("/api/admin/drivers?status=pending").then((r) => r.json()).then((d) => setPendingDrivers(Array.isArray(d.drivers) ? d.drivers : (Array.isArray(d) ? d : []))).catch(() => {}); }, []);
  const loadCancellations = useCallback(() => { fetch("/api/admin/cancellation-requests").then((r) => r.json()).then((d) => setCancellations(Array.isArray(d) ? d : [])).catch(() => {}); }, []);
  const loadUnpaid = useCallback(() => { if (user) fetch(`/api/admin/unpaid-trips?adminId=${user.id}`).then((r) => r.json()).then((d) => setUnpaidTrips(d.trips || [])).catch(() => {}); }, [user]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === "drivers") loadDrivers(); }, [tab, loadDrivers]);
  useEffect(() => { if (tab === "cancellations") loadCancellations(); }, [tab, loadCancellations]);
  useEffect(() => { if (tab === "unpaid") loadUnpaid(); }, [tab, loadUnpaid]);

  const approveDriver = async (driverId: string, action: "approve" | "reject") => {
    try { await fetch("/api/drivers/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ driverId, adminId: user?.id, action }) }); loadDrivers(); setTimeout(() => toast({ title: action === "approve" ? "✅" : "❌" }), 0); } catch { toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" }); }
  };
  const processCancellation = async (tripId: string, action: "approve" | "reject") => {
    try { await fetch("/api/admin/cancellation-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripId, adminId: user?.id, action }) }); loadCancellations(); setTimeout(() => toast({ title: action === "approve" ? "✅" : "❌" }), 0); } catch { toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" }); }
  };

  if (!user?.isAdmin) return (<div className="max-w-md mx-auto px-4 py-20 text-center"><Shield className="w-16 h-16 mx-auto text-zinc-300 mb-4" /><h2 className="text-2xl font-bold text-black mb-2">{lang === "ar" ? "صلاحية مرفوضة" : "Access Denied"}</h2></div>);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6"><div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div><div><h1 className="text-3xl font-bold text-black">{t("admin.title", lang)}</h1><p className="text-zinc-500">{t("admin.subtitle", lang)}</p></div></div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">{[{ id: "dashboard", l: t("admin.dashboard", lang) }, { id: "drivers", l: t("admin.drivers", lang) }, { id: "trips", l: t("admin.tripsTab", lang) }, { id: "complaints", l: lang === "ar" ? "الشكاوى" : "Complaints" }, { id: "coupons", l: lang === "ar" ? "الكوبونات" : "Coupons" }, { id: "cancellations", l: t("admin.cancellations", lang) }, { id: "unpaid", l: lang === "ar" ? "المبالغ غير المدفوعة" : "Unpaid" }].map((tb) => (<Button key={tb.id} variant={tab === tb.id ? "default" : "outline"} onClick={() => setTab(tb.id as typeof tab)} className={tab === tb.id ? "bg-black hover:bg-zinc-800" : ""}>{tb.l}{tb.id === "complaints" && complaints.length > 0 && <span className="mr-1 bg-red-600 text-white text-xs px-1.5 rounded-full">{complaints.length}</span>}</Button>))}
      </div>
      {tab === "dashboard" && stats && (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ l: t("admin.revenue", lang), v: `${stats.totalRevenue || 0} ر.س`, c: "bg-green-100 text-green-600" }, { l: t("admin.totalUsers", lang), v: stats.totalUsers || 0, c: "bg-blue-100 text-blue-600" }, { l: t("admin.totalDrivers", lang), v: stats.totalDrivers || 0, c: "bg-purple-100 text-purple-600" }, { l: t("admin.totalTrips", lang), v: stats.completedTrips || 0, c: "bg-orange-100 text-orange-600" }].map((s, i) => (<Card key={i} className="p-6 border-zinc-200"><div className={`w-12 h-12 ${s.c} rounded-xl mb-3 flex items-center justify-center text-xl font-bold`}>{s.v}</div><div className="text-sm text-zinc-500">{s.l}</div></Card>))}</div>)}
      {tab === "drivers" && (<div className="space-y-3">{pendingDrivers.map((d) => (<Card key={d.id} className="p-4 border-zinc-200"><div className="flex items-center gap-3 mb-3"><Avatar className="w-12 h-12"><AvatarFallback>{d.user?.name?.charAt(0) || "؟"}</AvatarFallback></Avatar><div className="flex-1"><div className="font-bold text-black">{d.user?.name}</div><div className="text-sm text-zinc-500">{d.carModel} • {d.carPlate}</div></div><Badge variant="secondary">⏳</Badge></div><div className="flex gap-2"><Button onClick={() => approveDriver(d.id, "approve")} className="bg-green-600 hover:bg-green-700 flex-1">{t("admin.approve", lang)}</Button><Button onClick={() => approveDriver(d.id, "reject")} variant="outline" className="border-red-200 text-red-600 flex-1">{t("admin.rejectBtn", lang)}</Button></div></Card>))}{pendingDrivers.length === 0 && <Card className="p-12 text-center text-zinc-500">{t("admin.noPending", lang)}</Card>}</div>)}
      {tab === "cancellations" && (<div className="space-y-3">{cancellations.map((c) => (<Card key={c.id} className="p-4 border-zinc-200"><div className="mb-3"><div className="font-bold text-black">{c.fromAddress} ← {c.toAddress}</div><div className="text-sm text-zinc-500">{c.cancellationReason}</div></div><div className="flex gap-2"><Button onClick={() => processCancellation(c.id, "approve")} className="bg-green-600 hover:bg-green-700 flex-1">{t("admin.approveCancel", lang)}</Button><Button onClick={() => processCancellation(c.id, "reject")} variant="outline" className="border-red-200 text-red-600 flex-1">{t("admin.rejectCancel", lang)}</Button></div></Card>))}{cancellations.length === 0 && <Card className="p-12 text-center text-zinc-500">{t("admin.noCancellations", lang)}</Card>}</div>)}
      {tab === "unpaid" && (<div className="space-y-3">{unpaidTrips.map((trip) => (<Card key={trip.id} className="p-4 border-zinc-200 border-red-200"><div className="mb-2"><div className="font-bold text-black">{trip.user?.name} - {trip.fromAddress} ← {trip.toAddress}</div><div className="text-sm text-red-600">⚠️ {lang === "ar" ? "غير مدفوع" : "Unpaid"}: {trip.unpaidAmount} ر.س</div></div></Card>))}{unpaidTrips.length === 0 && <Card className="p-12 text-center text-zinc-500">{lang === "ar" ? "لا توجد مبالغ غير مدفوعة" : "No unpaid amounts"}</Card>}</div>)}
      {tab === "trips" && (<div><div className="flex gap-2 mb-4 overflow-x-auto pb-2">{["all","pending","accepted","driver_arrived","ongoing","completed","cancelled"].map(s => <Button key={s} size="sm" variant={tripFilter === s ? "default" : "outline"} onClick={() => setTripFilter(s)} className={tripFilter === s ? "bg-black hover:bg-zinc-800" : ""}>{s === "all" ? (lang === "ar" ? "الكل" : "All") : s}</Button>)}</div><div className="space-y-2 max-h-[70vh] overflow-y-auto">{allTrips.filter(t => tripFilter === "all" || t.status === tripFilter).map(trip => (<Card key={trip.id} className="p-3 border-zinc-200"><div className="flex items-center justify-between mb-1"><div className="font-bold text-black text-sm">{trip.user?.name || "?"} → {trip.driver?.name || (lang === "ar" ? "بدون سائق" : "No driver")}</div><Badge variant={trip.status === "completed" ? "default" : trip.status === "cancelled" ? "destructive" : "secondary"} className={trip.status === "completed" ? "bg-green-600" : ""}>{trip.status}</Badge></div><div className="text-xs text-zinc-500">{trip.fromAddress} ← {trip.toAddress}</div><div className="flex justify-between mt-1 text-xs"><span className="text-zinc-400">{new Date(trip.createdAt).toLocaleDateString("ar-SA")}</span><span className="font-bold text-black">{trip.finalPrice || trip.price} ر.س</span></div></Card>))}{allTrips.length === 0 && <Card className="p-12 text-center text-zinc-500">{lang === "ar" ? "لا توجد رحلات" : "No trips"}</Card>}</div></div>)}

      {tab === "complaints" && (<div className="space-y-3 max-h-[70vh] overflow-y-auto">{complaints.map((c, i) => (<Card key={c.id || i} className="p-4 border-zinc-200 border-red-100"><div className="flex items-start justify-between mb-2"><Badge className="bg-red-600">🚨 {lang === "ar" ? "شكوى" : "Complaint"}</Badge><span className="text-xs text-zinc-400">{new Date(c.createdAt).toLocaleString("ar-SA")}</span></div><div className="font-bold text-black text-sm mb-1">{c.title}</div><div className="text-sm text-zinc-600 whitespace-pre-line">{c.message}</div></Card>))}{complaints.length === 0 && <Card className="p-12 text-center text-zinc-500">{lang === "ar" ? "لا توجد شكاوى" : "No complaints"}</Card>}</div>)}

      {tab === "coupons" && (<div className="space-y-4"><Card className="p-6 border-zinc-200"><h3 className="font-bold text-black mb-4">{lang === "ar" ? "إنشاء كوبون جديد" : "Create new coupon"}</h3><div className="grid grid-cols-2 gap-3"><div><Label>{lang === "ar" ? "الكود" : "Code"}</Label><Input value={newCoupon.code} onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="SUMMER2026" className="uppercase" /></div><div><Label>{lang === "ar" ? "النوع" : "Type"}</Label><Select value={newCoupon.type} onValueChange={(v) => setNewCoupon({ ...newCoupon, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fixed">{lang === "ar" ? "مبلغ ثابت" : "Fixed amount"}</SelectItem><SelectItem value="percentage">{lang === "ar" ? "نسبة مئوية" : "Percentage"}</SelectItem></SelectContent></Select></div><div><Label>{lang === "ar" ? "القيمة" : "Value"}</Label><Input type="number" value={newCoupon.value} onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value })} placeholder="20" /></div><div><Label>{lang === "ar" ? "عدد الاستخدامات" : "Max uses"}</Label><Input type="number" value={newCoupon.maxUses} onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: e.target.value })} placeholder="1" /></div></div><Button onClick={async () => { if (!newCoupon.code || !newCoupon.value) return; const res = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newCoupon, createdById: user?.id }) }); if (res.ok) { toast({ title: lang === "ar" ? "✅ تم إنشاء الكوبون" : "✅ Coupon created" }); setNewCoupon({ code: "", type: "fixed", value: "", maxUses: "1" }); loadCoupons(); } }} className="w-full bg-black hover:bg-zinc-800 h-12 mt-3">{lang === "ar" ? "إنشاء" : "Create"}</Button></Card><div className="space-y-2">{allCoupons.map(c => (<Card key={c.id} className="p-3 border-zinc-200"><div className="flex items-center justify-between"><div><div className="font-bold text-black">{c.code}</div><div className="text-xs text-zinc-500">{c.type === "percentage" ? `${c.value}%` : `${c.value} ر.س`} • {c.usesCount}/{c.maxUses} {lang === "ar" ? "استخدام" : "uses"}</div></div><Badge className={c.isActive ? "bg-green-600" : "bg-zinc-400"}>{c.isActive ? "✅" : "⏸️"}</Badge></div></Card>))}{allCoupons.length === 0 && <Card className="p-12 text-center text-zinc-500">{lang === "ar" ? "لا توجد كوبونات" : "No coupons"}</Card>}</div></div>)}
    </div>
  );
}

// ===== RATING DIALOG =====
function RatingDialog({ open, onOpenChange, tripId, fromUserId, toUserId, targetName, ratedBy, lang }: {
  open: boolean; onOpenChange: (o: boolean) => void; tripId: string; fromUserId: string; toUserId: string; targetName: string; ratedBy: "rider" | "driver"; lang: Lang;
}) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/trips/rate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, fromUserId, toUserId, rating: stars, review, ratedBy }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: lang === "ar" ? "شكراً لتقييمك! ⭐" : "Thanks for rating! ⭐" });
      setStars(0); setReview("");
      onOpenChange(false);
    } catch { toast({ title: lang === "ar" ? "فشل" : "Failed", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{lang === "ar" ? "قيّم رحلتك" : "Rate your trip"}</DialogTitle>
          <DialogDescription>{lang === "ar" ? `كيف كانت تجربتك مع ${targetName}؟` : `How was your experience with ${targetName}?`}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setStars(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} className="text-4xl transition-transform hover:scale-125">
                <span className={n <= (hover || stars) ? "text-yellow-400" : "text-zinc-300"}>★</span>
              </button>
            ))}
          </div>
          {stars > 0 && <p className="text-center text-sm font-medium text-zinc-600">{["", lang === "ar" ? "سيء جداً" : "Very bad", lang === "ar" ? "سيء" : "Bad", lang === "ar" ? "مقبول" : "OK", lang === "ar" ? "جيد" : "Good", lang === "ar" ? "ممتاز" : "Excellent"][stars]}</p>}
          <div><Label>{lang === "ar" ? "تعليق (اختياري)" : "Review (optional)"}</Label><Textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} placeholder={lang === "ar" ? "اكتب تعليقك..." : "Write a review..."} /></div>
          <Button onClick={submit} disabled={submitting || stars === 0} className="w-full bg-black hover:bg-zinc-800 h-12">{submitting ? (lang === "ar" ? "جارٍ الإرسال..." : "Sending...") : (lang === "ar" ? "إرسال التقييم" : "Submit rating")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== COUPONS SECTION (in Profile) =====
function CouponsSection({ userId, lang }: { userId: string; lang: Lang }) {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    fetch(`/api/coupons?userId=${userId}`).then(r => r.json()).then(d => setCoupons(Array.isArray(d) ? d : [])).catch(() => {});
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.toUpperCase(), userId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: lang === "ar" ? "🎉 تم تفعيل الكوبون!" : "🎉 Coupon activated!" });
      setCode(""); load();
    } catch (e) { toast({ title: lang === "ar" ? "فشل" : "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <Card className="p-6 border-zinc-200">
      <h3 className="font-bold text-black mb-4">🎫 {lang === "ar" ? "كوبونات الخصم" : "Discount Coupons"}</h3>
      <div className="flex gap-2 mb-4">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={lang === "ar" ? "أدخل كود الخصم" : "Enter coupon code"} className="flex-1 uppercase" />
        <Button onClick={apply} disabled={loading || !code.trim()} className="bg-black hover:bg-zinc-800">{lang === "ar" ? "تفعيل" : "Apply"}</Button>
      </div>
      <div className="space-y-2">
        {coupons.map(c => (
          <div key={c.id} className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-xl">
            <div>
              <div className="font-bold text-black">{c.code}</div>
              <div className="text-xs text-green-600">{c.type === "percentage" ? `${c.value}% خصم` : `${c.value} ر.س خصم`}</div>
            </div>
            <Badge className="bg-green-600">✅ {lang === "ar" ? "مفعّل" : "Active"}</Badge>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">{lang === "ar" ? "لا توجد كوبونات مفعّلة" : "No active coupons"}</p>}
      </div>
    </Card>
  );
}

// ===== AUTH DIALOG =====
function AuthDialog({ open, onOpenChange, onSuccess, lang }: { open: boolean; onOpenChange: (o: boolean) => void; onSuccess: (u: User) => void; lang: Lang }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [login, setLogin] = useState({ identifier: "", password: "" });
  const [reg, setReg] = useState({ name: "", email: "", phone: "", password: "", city: "الرياض", region: "الرياض" });
  const [showPwd, setShowPwd] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!login.identifier || !login.password) { toast({ title: t("auth.enterCredentials", lang), variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(login) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.isBlocked) { toast({ title: t("auth.blocked", lang), description: data.blockReason, variant: "destructive" }); return; }
      onSuccess(data); setLogin({ identifier: "", password: "" });
    } catch (e) { toast({ title: t("auth.loginFailed", lang), description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!reg.name || !reg.email || !reg.phone || !reg.password) { toast({ title: t("auth.allFieldsRequired", lang), variant: "destructive" }); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reg) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data); setReg({ name: "", email: "", phone: "", password: "", city: "الرياض", region: "الرياض" });
    } catch (e) { toast({ title: t("auth.registerFailed", lang), description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    const email = prompt(lang === "ar" ? "أدخل بريد Google:" : "Enter Google email:", "user@gmail.com");
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ googleId: `google_${Date.now()}`, email, name: email.split("@")[0], picture: null }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data);
    } catch (e) { toast({ title: t("auth.loginFailed", lang), description: e instanceof Error ? e.message : "", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-xl font-bold">{t("auth.welcome", lang)}</DialogTitle><DialogDescription>{t("auth.welcomeDesc", lang)}</DialogDescription></DialogHeader>
        <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-2 border border-zinc-300 rounded-lg h-12 hover:bg-zinc-50 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          <span className="font-medium text-black">{t("auth.loginGoogle", lang)}</span>
        </button>
        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-zinc-200"></div><span className="text-xs text-zinc-400">{t("auth.or", lang)}</span><div className="flex-1 h-px bg-zinc-200"></div></div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
          <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="login">{t("auth.login", lang)}</TabsTrigger><TabsTrigger value="register">{t("auth.register", lang)}</TabsTrigger></TabsList>
          <TabsContent value="login" className="space-y-3 mt-4">
            <div><Label>{t("auth.emailOrPhone", lang)}</Label><Input value={login.identifier} onChange={(e) => setLogin({ ...login, identifier: e.target.value })} placeholder="grouthhacker@gmail.com" onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} /></div>
            <div><Label>{t("auth.password", lang)}</Label><div className="relative"><Input type={showPwd ? "text" : "password"} value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} placeholder="••••••••" onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} /><button onClick={() => setShowPwd(!showPwd)} className="absolute left-3 top-1/2 -translate-y-1/2">{showPwd ? "🙈" : "👁️"}</button></div></div>
            <Button onClick={handleLogin} disabled={loading} className="w-full bg-black hover:bg-zinc-800 h-12">{loading ? t("auth.loading", lang) : t("auth.loginBtn", lang)}</Button>
            <div className="bg-zinc-50 rounded-lg p-3 text-xs text-zinc-600 text-center"><p className="font-bold mb-1">{t("auth.demoAccounts", lang)}</p><p>grouthhacker@gmail.com / Admin@2026</p><p>saad@example.com / 123456</p><p>ahmed@driver.com / 123456</p></div>
          </TabsContent>
          <TabsContent value="register" className="space-y-3 mt-4">
            <div><Label>{t("auth.name", lang)}</Label><Input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} /></div>
            <div><Label>{t("auth.email", lang)}</Label><Input value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} /></div>
            <div><Label>{t("auth.phone", lang)}</Label><Input value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} placeholder="05xxxxxxxx" /></div>
            <div><Label>{t("auth.password", lang)}</Label><Input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2"><div><Label>{t("profile.region", lang)}</Label><Select value={reg.region} onValueChange={(v) => setReg({ ...reg, region: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{saudiRegions.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></div><div><Label>{t("profile.city", lang)}</Label><Select value={reg.city} onValueChange={(v) => setReg({ ...reg, city: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{saudiRegions.find((r) => r.name === reg.region)?.cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div></div>
            <Button onClick={handleRegister} disabled={loading} className="w-full bg-black hover:bg-zinc-800 h-12">{loading ? t("auth.loading", lang) : t("auth.registerBtn", lang)}</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

