"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  MapPin,
  Phone,
  MessageCircle,
  Eye,
  Clock,
  Star,
  Plus,
  ChevronLeft,
  Menu,
  X,
  Home,
  Car,
  Building2,
  Smartphone,
  Sofa,
  Briefcase,
  PawPrint,
  Wrench,
  User,
  Heart,
  Share2,
  Image as ImageIcon,
  TrendingUp,
  Award,
  ShieldCheck,
  Verified,
  LogIn,
  Wallet,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatArabicDate, formatNumber, formatKilometers } from "@/lib/format";
import { AuthDialog } from "@/components/auth-dialog";
import { UserMenu } from "@/components/user-menu";
import { AdminDashboard } from "@/components/admin-dashboard";
import { UserWallet } from "@/components/user-wallet";
import { NotificationBell } from "@/components/notification-bell";
import { PaymentDialog } from "@/components/payment-dialog";

// ===== TYPES =====
type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  children: Category[];
};

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  district: string | null;
  year: number | null;
  kilometers: number | null;
  condition: string | null;
  images: string;
  isFeatured: boolean;
  views: number;
  phone: string;
  whatsapp: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  user: { id: string; username: string; isVerified: boolean; rating: number };
  comments: { id: string; username: string; content: string; createdAt: string }[];
};

// Listing shape returned by /api/listings/user (has _count instead of comments)
type UserListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  city: string;
  district: string | null;
  year: number | null;
  kilometers: number | null;
  condition: string | null;
  images: string;
  isFeatured: boolean;
  views: number;
  phone: string;
  whatsapp: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  _count?: { comments: number; favorites: number };
};

// ===== CONSTANTS =====
const CATEGORY_ICONS: Record<string, typeof Car> = {
  cars: Car,
  realestate: Building2,
  electronics: Smartphone,
  furniture: Sofa,
  jobs: Briefcase,
  animals: PawPrint,
  services: Wrench,
};

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

export default function HarajHomePage() {
  const { toast } = useToast();
  const { data: session, status, update: updateSession } = useSession();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [payment, setPayment] = useState<{
    open: boolean;
    purpose: "featured_listing" | "wallet_topup";
    amount: number;
    listingId?: string;
    listingTitle?: string;
  }>({ open: false, purpose: "wallet_topup", amount: 100 });
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const isAuthenticated = status === "authenticated" && !!session?.user;
   
  const isAdmin = isAuthenticated && (session.user as any).isAdmin === true;

  // Fetch listings
  const fetchListings = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (selectedCity !== "all") params.set("city", selectedCity);
      if (searchQuery) params.set("search", searchQuery);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (showFeaturedOnly) params.set("featured", "true");
      params.set("sort", sortBy);
      params.set("limit", "20");
      if (!reset) params.set("offset", String(offset));

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) throw new Error("فشل في تحميل الإعلانات");
      const data = await res.json();
      if (reset) {
        setListings(data.listings || []);
      } else {
        setListings(prev => [...prev, ...(data.listings || [])]);
      }
      setHasMore(data.hasMore || false);
      if (!reset) setOffset(prev => prev + 20);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      toast({
        title: "خطأ",
        description: "تعذر تحميل الإعلانات. حاول مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch categories once
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Fetch listings when filters change
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchListings();
    }, 300);
    return () => clearTimeout(debounce);
     
  }, [selectedCategory, selectedCity, sortBy, minPrice, maxPrice, showFeaturedOnly]);

  // Initial fetch
  useEffect(() => {
    fetchListings();
     
  }, []);

  // Fetch favorites when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/favorites")
        .then((r) => r.json())
        .then((data) => {
          if (data.favorites) {
            setFavorites(new Set(data.favorites.map((l: { id: string }) => l.id)));
          }
        })
        .catch(() => {});
    } else {
      setFavorites(new Set());
    }
  }, [isAuthenticated]);

  // Featured listings (separate section)
  const featuredListings = useMemo(() => {
    return listings.filter((l) => l.isFeatured).slice(0, 6);
  }, [listings]);

  // Toggle favorite (requires auth)
  const toggleFavorite = async (id: string) => {
    if (!isAuthenticated) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "الرجاء تسجيل الدخول لحفظ المفضلة",
        variant: "destructive",
      });
      setAuthDialogOpen(true);
      return;
    }

    // Optimistic update
    const wasFavorited = favorites.has(id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast({
        title: data.favorited ? "أُضيف إلى المفضلة ❤️" : "أُزيل من المفضلة",
        duration: 1500,
      });
    } catch {
      // Revert on error
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
      toast({
        title: "خطأ",
        description: "تعذر تحديث المفضلة",
        variant: "destructive",
      });
    }
  };

  // Share listing
  const shareListing = (listing: Listing) => {
    const url = `${window.location.origin}/?listing=${listing.id}`;
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `شوف هذا الإعلان على حراج: ${listing.title}`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "تم نسخ الرابط", duration: 1500 });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedCity("all");
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setShowFeaturedOnly(false);
    setSortBy("newest");
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedCity !== "all" ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (showFeaturedOnly ? 1 : 0);

  // Handle "Add Listing" click — requires auth
  const handleAddListingClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "الرجاء تسجيل الدخول أو إنشاء حساب لنشر إعلان",
        variant: "destructive",
      });
      setAuthDialogOpen(true);
      return;
    }
    setAddDialogOpen(true);
  };

  // Open a listing from UserMenu (favorites/my listings)
  const handleOpenListingFromMenu = (listing: UserListing) => {
    setUserMenuOpen(false);
    // Convert to the expected Listing type for the detail dialog
    const fullListing: Listing = {
      ...listing,
      user: {
        id: session?.user?.id || "",
        username: session?.user?.name || "أنا",
        isVerified: false,
        rating: 5,
      },
      comments: [],
    } as Listing;
    setSelectedListing(fullListing);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== HEADER (Haraj-style white header) ===== */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Top row: logo + nav + login */}
          <div className="flex items-center gap-3 h-14">
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-foreground hover:bg-muted"
                  aria-label="القائمة"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-right">الأقسام</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-1">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCategory("all");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Home className="h-4 w-4 ml-2" />
                    جميع الأقسام
                  </Button>
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.slug] || Home;
                    return (
                      <div key={cat.id}>
                        <Button
                          variant={selectedCategory === cat.slug ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Icon className="h-4 w-4 ml-2" />
                          {cat.name}
                        </Button>
                        {cat.children.length > 0 && (
                          <div className="pr-4 mt-1 space-y-1">
                            {cat.children.map((child) => (
                              <Button
                                key={child.id}
                                variant={selectedCategory === child.slug ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start text-sm"
                                onClick={() => {
                                  setSelectedCategory(child.slug);
                                  setMobileMenuOpen(false);
                                }}
                              >
                                {child.name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo - Haraj style (blue text) */}
            <a href="/" className="flex items-center gap-1 shrink-0">
              <span className="font-cairo font-bold text-2xl text-primary">حراج</span>
            </a>

            {/* Desktop nav links - Haraj style */}
            <nav className="hidden md:flex items-center gap-1 mr-2">
              <button
                className={`px-3 py-1.5 text-sm font-cairo rounded transition-colors ${selectedCategory === "all" ? "text-primary font-bold" : "text-foreground hover:text-primary"}`}
                onClick={() => setSelectedCategory("all")}
              >
                الرئيسية
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-cairo rounded transition-colors ${selectedCategory === "cars" ? "text-primary font-bold" : "text-foreground hover:text-primary"}`}
                onClick={() => setSelectedCategory("cars")}
              >
                حراج السيارات
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-cairo rounded transition-colors ${selectedCategory === "electronics" ? "text-primary font-bold" : "text-foreground hover:text-primary"}`}
                onClick={() => setSelectedCategory("electronics")}
              >
                أجهزة
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-cairo rounded transition-colors ${selectedCategory === "animals" ? "text-primary font-bold" : "text-foreground hover:text-primary"}`}
                onClick={() => setSelectedCategory("animals")}
              >
                مواشي وحيوانات وطيور
              </button>
              <button
                className={`px-3 py-1.5 text-sm font-cairo rounded transition-colors ${selectedCategory === "furniture" ? "text-primary font-bold" : "text-foreground hover:text-primary"}`}
                onClick={() => setSelectedCategory("furniture")}
              >
                اثاث
              </button>
              <button
                className="px-3 py-1.5 text-sm font-cairo rounded text-foreground hover:text-primary flex items-center gap-1"
                onClick={() => setMobileMenuOpen(true)}
              >
                خدمات
              </button>
              <button
                className="px-3 py-1.5 text-sm font-cairo rounded text-foreground hover:text-primary"
                onClick={() => setMobileMenuOpen(true)}
              >
                أقسام أكثر
              </button>
            </nav>

            <div className="flex-1" />

            {/* Search icon button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-muted"
              aria-label="بحث"
              onClick={() => {
                const el = document.getElementById("search-input");
                if (el) el.focus();
              }}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Add listing button - Haraj style (blue) */}
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-cairo text-sm shrink-0"
              onClick={handleAddListingClick}
            >
              <Plus className="h-4 w-4 ml-1" />
              <span className="hidden sm:inline">اضافة عرض</span>
              <span className="sm:hidden">عرض</span>
            </Button>

            {/* User account / login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1 shrink-0">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground hover:bg-muted"
                  aria-label="محفظتي"
                  title="محفظتي المالية"
                  onClick={() => setWalletOpen(true)}
                >
                  <Wallet className="h-5 w-5" />
                </Button>
                {isAdmin && (
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-cairo text-xs gap-1 shrink-0"
                    onClick={() => setAdminOpen(true)}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">لوحة التحكم</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:bg-muted shrink-0 gap-1.5"
                  onClick={() => setUserMenuOpen(true)}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-cairo">
                      {session?.user?.name?.slice(0, 2) || "ح"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline font-cairo text-sm">
                    {session?.user?.name}
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10 shrink-0 gap-1.5 font-cairo font-bold"
                onClick={() => setAuthDialogOpen(true)}
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">دخــــول</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search bar row - Haraj style (full width below header) */}
        <div className="container mx-auto px-3 sm:px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                id="search-input"
                type="search"
                placeholder="ابحث عن سلعة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchListings();
                }}
                className="bg-muted/50 border-border h-10 pr-10 pl-4 text-sm"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-cairo text-sm border-primary text-primary hover:bg-primary/5"
              onClick={() => {
                if (!navigator.geolocation) {
                  toast({ title: "GPS غير مدعوم", variant: "destructive" });
                  return;
                }
                toast({ title: "جارٍ تحديد موقعك...", duration: 1500 });
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    const res = await fetch(`/api/listings/nearby?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radius=50`);
                    if (res.ok) {
                      const data = await res.json();
                      setListings(data.listings);
                      toast({ title: `وجدنا ${data.count} إعلان قريب منك`, duration: 2000 });
                    }
                  },
                  () => toast({ title: "تعذر الوصول لموقعك", variant: "destructive" })
                );
              }}
            >
              <MapPin className="h-4 w-4 ml-1" />
              القريب
            </Button>
          </div>
        </div>

        {/* Category pills row - Haraj style horizontal scroll */}
        <div className="bg-primary/5 border-t border-b border-border">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex items-center gap-1 h-11 overflow-x-auto scrollbar-thin">
              <button
                className={`px-3 py-1.5 text-xs sm:text-sm font-cairo whitespace-nowrap rounded-full transition-colors ${selectedCategory === "all" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary/10"}`}
                onClick={() => setSelectedCategory("all")}
              >
                الرئيسية
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-cairo whitespace-nowrap rounded-full transition-colors ${selectedCategory === cat.slug ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary/10"}`}
                  onClick={() => setSelectedCategory(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
              <button
                className="px-3 py-1.5 text-xs sm:text-sm font-cairo whitespace-nowrap rounded-full text-muted-foreground hover:bg-muted shrink-0"
                onClick={() => setMobileMenuOpen(true)}
              >
                المزيد
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32 space-y-4">
              {/* Categories */}
              <Card className="p-3">
                <h3 className="font-cairo font-bold text-base mb-3 px-2 flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  الأقسام
                </h3>
                <div className="space-y-1">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory("all")}
                  >
                    <Home className="h-4 w-4 ml-2" />
                    جميع الأقسام
                  </Button>
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.slug] || Home;
                    const isActive = selectedCategory === cat.slug;
                    return (
                      <div key={cat.id}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setSelectedCategory(cat.slug)}
                        >
                          <Icon className="h-4 w-4 ml-2" />
                          {cat.name}
                        </Button>
                        {cat.children.length > 0 && (
                          <div className="pr-4 mt-0.5 mb-1 space-y-0.5">
                            {cat.children.map((child) => (
                              <button
                                key={child.id}
                                onClick={() => setSelectedCategory(child.slug)}
                                className={`block w-full text-right px-3 py-1.5 text-xs rounded-md transition-colors category-chip ${
                                  selectedCategory === child.slug
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent"
                                }`}
                              >
                                {child.icon} {child.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Filters */}
              <Card className="p-3">
                <h3 className="font-cairo font-bold text-base mb-3 px-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    الفلاتر
                  </span>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="h-6 text-xs"
                    >
                      مسح الكل
                    </Button>
                  )}
                </h3>
                <div className="space-y-3 px-2">
                  <div>
                    <Label className="text-xs mb-1 block">المدينة</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="كل المدن" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل المدن</SelectItem>
                        {SAUDI_CITIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs mb-1 block">السعر (ريال)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="من"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="إلى"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={showFeaturedOnly}
                      onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="featured" className="text-xs cursor-pointer">
                      المميزة فقط
                    </Label>
                  </div>
                </div>
              </Card>

              {/* Stats card */}
              <Card className="p-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="h-5 w-5" />
                  <h4 className="font-cairo font-bold">إعلانات موثوقة</h4>
                </div>
                <p className="text-xs text-primary-foreground/80 leading-relaxed">
                  جميع الإعلانات على حراج تمر عبر نظام تحقق لضمان جودة المعروضات وأمان المشترين.
                </p>
              </Card>
            </div>
          </aside>

          {/* Listings column */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb / Title */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Home className="h-4 w-4 text-muted-foreground" />
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">الإعلانات</span>
                {selectedCategory !== "all" && (
                  <>
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    <span className="font-cairo font-bold">
                      {categories.find((c) => c.slug === selectedCategory)?.name ||
                        categories.flatMap((c) => c.children).find((c) => c.slug === selectedCategory)?.name ||
                        selectedCategory}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {loading ? "..." : `${listings.length} إعلان`}
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">الأحدث</SelectItem>
                    <SelectItem value="price_low">الأرخص أولاً</SelectItem>
                    <SelectItem value="price_high">الأغلى أولاً</SelectItem>
                    <SelectItem value="popular">الأكثر مشاهدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Featured section */}
            {!showFeaturedOnly && selectedCategory === "all" && !searchQuery && featuredListings.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="font-cairo font-bold text-lg">إعلانات مميزة</h2>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    <TrendingUp className="h-3 w-3 ml-1" />
                    مميز
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {featuredListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onOpen={() => setSelectedListing(listing)}
                      isFavorite={favorites.has(listing.id)}
                      onToggleFavorite={() => toggleFavorite(listing.id)}
                      onShare={() => shareListing(listing)}
                      compact
                    />
                  ))}
                </div>
                <Separator className="mt-6" />
              </section>
            )}

            {/* All listings */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-cairo font-bold text-lg">
                  {showFeaturedOnly ? "الإعلانات المميزة" : "أحدث الإعلانات"}
                </h2>
              </div>

              {/* Error state */}
              {error && !loading && (
                <Card className="p-8 text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={fetchListings}>إعادة المحاولة</Button>
                </Card>
              )}

              {/* Loading state */}
              {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <Skeleton className="aspect-[4/3] w-full" />
                      <div className="p-3 space-y-2">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && listings.length === 0 && (
                <Card className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-cairo font-bold text-lg mb-1">لا توجد إعلانات مطابقة</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    جرّب تغيير الفلاتر أو أضف إعلانك الخاص
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={resetFilters}>مسح الفلاتر</Button>
                    <Button onClick={handleAddListingClick}>
                      <Plus className="h-4 w-4 ml-1" />
                      أضف إعلان
                    </Button>
                  </div>
                </Card>
              )}

              {/* Grid */}
              {!loading && !error && listings.length > 0 && (
                <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onOpen={() => setSelectedListing(listing)}
                      isFavorite={favorites.has(listing.id)}
                      onToggleFavorite={() => toggleFavorite(listing.id)}
                      onShare={() => shareListing(listing)}
                    />
                  ))}
                </div>

                {/* مشاهدة المزيد */}
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      className="font-cairo border-primary text-primary hover:bg-primary/5 px-8 h-11"
                      onClick={() => fetchListings(false)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-2" />
                          جارٍ التحميل...
                        </>
                      ) : (
                        "مشاهدة المزيد ..."
                      )}
                    </Button>
                  </div>
                )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* ===== DETAIL DIALOG ===== */}
      <ListingDetailDialog
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onToggleFavorite={toggleFavorite}
        isFavorite={selectedListing ? favorites.has(selectedListing.id) : false}
        onPromoteFeatured={(listingId, title, price) => {
          setPayment({
            open: true,
            purpose: "featured_listing",
            amount: price,
            listingId,
            listingTitle: title,
          });
          setSelectedListing(null);
        }}
      />

      {/* ===== ADD LISTING DIALOG ===== */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <AddListingDialog
          categories={categories}
          onClose={() => setAddDialogOpen(false)}
          onAdded={() => {
            setAddDialogOpen(false);
            fetchListings();
            updateSession();
          }}
        />
      </Dialog>

      {/* ===== AUTH DIALOG ===== */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={() => {
          updateSession();
        }}
      />

      {/* ===== USER MENU DIALOG ===== */}
      <UserMenu
        open={userMenuOpen}
        onOpenChange={setUserMenuOpen}
        onOpenListing={handleOpenListingFromMenu}
      />

      {/* ===== USER WALLET DIALOG ===== */}
      <UserWallet open={walletOpen} onOpenChange={setWalletOpen} />

      {/* ===== ADMIN DASHBOARD DIALOG ===== */}
      <AdminDashboard open={adminOpen} onOpenChange={setAdminOpen} />

      {/* ===== PAYMENT DIALOG ===== */}
      <PaymentDialog
        open={payment.open}
        onOpenChange={(open) => setPayment({ ...payment, open })}
        purpose={payment.purpose}
        amount={payment.amount}
        listingId={payment.listingId}
        listingTitle={payment.listingTitle}
        onSuccess={() => {
          fetchListings();
          toast({ title: "تمت العملية بنجاح ✓", duration: 2000 });
        }}
      />

      {/* ===== FOOTER (Haraj-style comprehensive footer) ===== */}
      <footer className="mt-auto bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4 py-8">
          {/* App store badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="bg-black text-white rounded-lg px-4 py-2 flex items-center gap-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                <div className="text-right">
                  <div className="text-[10px]">Download on the</div>
                  <div className="text-sm font-bold">App Store</div>
                </div>
              </div>
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="bg-black text-white rounded-lg px-4 py-2 flex items-center gap-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24"><path fill="#34A853" d="M16.81 10.44L4.66 3.4l9.41 9.66z"/><path fill="#FBBC04" d="M19.36 12.93l-2.55-1.47-2.86 2.6 2.86 2.6 2.55-1.47c.85-.49.85-1.77 0-2.26z"/><path fill="#EA4335" d="M4.66 3.4c-.02.07-.03.14-.03.22v16.76c0 .08.01.15.03.22l9.45-9.66z"/><path fill="#4285F4" d="M14.11 12.94L4.66 3.4c.18-.62.74-1.06 1.4-1.06.26 0 .51.07.74.2l12.16 7.04z"/></svg>
                <div className="text-right">
                  <div className="text-[10px]">GET IT ON</div>
                  <div className="text-sm font-bold">Google Play</div>
                </div>
              </div>
            </a>
            <a href="#" className="hover:opacity-80 transition-opacity">
              <div className="bg-black text-white rounded-lg px-4 py-2 flex items-center gap-2">
                <span className="text-lg font-bold">H</span>
                <div className="text-right">
                  <div className="text-[10px]">Download on</div>
                  <div className="text-sm font-bold">Huawei</div>
                </div>
              </div>
            </a>
          </div>

          {/* Real estate note */}
          <div className="text-center mb-6 text-xs text-muted-foreground">
            <p>قسم العقارات في منصة حراج يتم تشغيله بواسطة رخصة وساطة وتسويق معتمدة</p>
          </div>

          {/* Footer links - Haraj style */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-foreground mb-6">
            <a href="#" className="hover:text-primary">تسجيل حساب</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">سداد رسوم الموقع</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">الاشتراك السنوي للمتجر</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">زيادة مشاهدات العروض</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">اتفاقية الاستخدام</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">خدمة الشراء الموثوق</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">توثيق المتجر وإضافة التراخيص</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">مركز الأمان</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">نظام التقييم</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">نظام الخصم</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">الحسابات والأرقام الموقوفة</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">قائمة السلع والعروض الممنوعة</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">الأسئلة الشائعة</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">سياسة الخصوصية</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">سياسة الملكية الفكرية</a>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-primary">اتصل بنا</a>
          </div>

          {/* Social media icons */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[
              { name: "twitter", path: "M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" },
              { name: "tiktok", path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" },
              { name: "snapchat", path: "M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.78-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.299 1.104.299.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.434-.015h.045z" },
              { name: "instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" },
              { name: "facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
              { name: "youtube", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
            ].map((social) => (
              <a
                key={social.name}
                href="#"
                aria-label={social.name}
                className="w-9 h-9 rounded-full bg-foreground/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>

          {/* Font size controls + company info */}
          <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground border-t border-border pt-6">
            <div className="flex items-center gap-3">
              <span>حجم الخط:</span>
              <button
                onClick={() => {
                  document.documentElement.style.fontSize = "14px";
                  toast({ title: "تم تصغير الخط", duration: 1500 });
                }}
                className="w-7 h-7 rounded border border-border hover:bg-muted flex items-center justify-center"
                aria-label="تصغير الخط"
              >
                <span className="text-xs">-A</span>
              </button>
              <button
                onClick={() => {
                  document.documentElement.style.fontSize = "16px";
                  toast({ title: "حجم الخط الافتراضي", duration: 1500 });
                }}
                className="w-7 h-7 rounded border border-border hover:bg-muted flex items-center justify-center"
                aria-label="حجم افتراضي"
              >
                <span className="text-sm">A</span>
              </button>
              <button
                onClick={() => {
                  document.documentElement.style.fontSize = "18px";
                  toast({ title: "تم تكبير الخط", duration: 1500 });
                }}
                className="w-7 h-7 rounded border border-border hover:bg-muted flex items-center justify-center"
                aria-label="تكبير الخط"
              >
                <span className="text-base">+A</span>
              </button>
            </div>

            <div className="text-center">
              <p className="font-cairo font-bold text-foreground mb-1">مؤسسة موقع حراج لتقنية المعلومات</p>
              <p className="text-[10px]">N0.0.1, 2026-06-25 10</p>
              <p className="text-[10px]">الرقم الضريبي: 300710482300003</p>
            </div>

            <p className="text-[10px] mt-2">© 2026 حراج. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===== LISTING CARD COMPONENT (Haraj-style) =====
function ListingCard({
  listing,
  onOpen,
  isFavorite,
  onToggleFavorite,
  onShare,
  compact = false,
}: {
  listing: Listing;
  onOpen: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  compact?: boolean;
}) {
  const images: string[] = (() => {
    try {
      return JSON.parse(listing.images);
    } catch {
      return [];
    }
  })();
  const coverImage = images[0];
  const sellerInitial = listing.user.username.charAt(0);

  return (
    <div
      className="bg-white border border-border rounded-lg overflow-hidden cursor-pointer hover:border-primary hover:shadow-md transition-all group"
      onClick={onOpen}
    >
      {/* Top: seller info bar */}
      <div className="flex items-center gap-2 p-2 bg-muted/30 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="font-cairo font-bold text-primary text-xs">{sellerInitial}</span>
        </div>
        <span className="text-xs text-muted-foreground font-cairo truncate flex-1">{listing.user.username}</span>
        {listing.isFeatured && (
          <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 h-5">
            <Award className="h-2.5 w-2.5 ml-0.5" />
            مميز
          </Badge>
        )}
      </div>

      {/* Image */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 mb-1" />
            <span className="text-xs">لا توجد صورة</span>
          </div>
        )}

        {/* Image count */}
        {images.length > 1 && (
          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
            <ImageIcon className="h-3 w-3" />
            {images.length}
          </div>
        )}

        {/* Quick actions */}
        <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm"
            aria-label="أضف للمفضلة"
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-destructive text-destructive" : "text-foreground"}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm"
            aria-label="مشاركة"
          >
            <Share2 className="h-3.5 w-3.5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1">
        {/* Title */}
        <h3 className="font-cairo text-sm leading-snug line-clamp-2 text-foreground">
          {listing.title}
        </h3>

        {/* Price */}
        <div className="text-primary font-cairo font-bold text-base tabular-nums">
          {formatPrice(listing.price, listing.currency)}
        </div>

        {/* Year/KM for cars */}
        {listing.year && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{listing.year}</span>
            {listing.kilometers != null && (
              <>
                <span>•</span>
                <span>{formatKilometers(listing.kilometers)}</span>
              </>
            )}
          </div>
        )}

        {/* Location + time */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">{listing.city}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            <span>{formatArabicDate(new Date(listing.createdAt))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== LISTING DETAIL DIALOG =====
function ListingDetailDialog({
  listing,
  onClose,
  onToggleFavorite,
  isFavorite,
  onPromoteFeatured,
}: {
  listing: Listing | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  onPromoteFeatured?: (listingId: string, title: string, price: number) => void;
}) {
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentPhone, setCommentPhone] = useState("");
  const [comments, setComments] = useState<Listing["comments"]>([]);

  useEffect(() => {
    if (listing) {
      setActiveImage(0);
      setComments(listing.comments || []);
    }
  }, [listing]);

  if (!listing) return null;

  const safeComments = comments || [];

  const images: string[] = (() => {
    try {
      return JSON.parse(listing.images);
    } catch {
      return [];
    }
  })();

  const handleSubmitComment = async () => {
    if (!commentName.trim() || !commentText.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء إدخال الاسم والتعليق",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          username: commentName,
          content: commentText,
          phone: commentPhone || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments([data.comment, ...(comments || [])]);
      setCommentName("");
      setCommentText("");
      setCommentPhone("");
      toast({ title: "تم نشر تعليقك بنجاح", duration: 1500 });
    } catch {
      toast({
        title: "خطأ",
        description: "تعذر نشر التعليق",
        variant: "destructive",
      });
    }
  };

  const handleCall = () => {
    window.location.href = `tel:${listing.phone}`;
  };

  const handleWhatsApp = () => {
    const phone = listing.whatsapp || listing.phone;
    const cleanPhone = phone.replace(/^0/, "966");
    const msg = `السلام عليكم، أنا مهتم بـ: ${listing.title}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Dialog open={!!listing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-right font-cairo text-lg line-clamp-1">
            {listing.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 p-4">
          {/* Images */}
          <div className="space-y-2">
            <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              {images[activeImage] ? (
                 
                <img
                  src={images[activeImage]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-16 w-16 mb-2" />
                  <span>لا توجد صورة</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 shrink-0 ${
                      activeImage === i ? "border-primary" : "border-transparent"
                    }`}
                  >
                    { }
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Price */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-cairo font-bold text-primary tabular-nums">
                  {formatPrice(listing.price, listing.currency)}
                </div>
                {listing.isFeatured && (
                  <Badge variant="secondary" className="bg-accent text-accent-foreground mt-1">
                    <Award className="h-3 w-3 ml-1" />
                    إعلان مميز
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onToggleFavorite(listing.id)}
                  aria-label="مفضلة"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const url = `${window.location.origin}/?listing=${listing.id}`;
                    navigator.clipboard.writeText(url);
                    toast({ title: "تم نسخ الرابط", duration: 1500 });
                  }}
                  aria-label="مشاركة"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Specs grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 rounded-md p-2">
                <div className="text-xs text-muted-foreground">القسم</div>
                <div className="font-cairo">{listing.category.name}</div>
              </div>
              <div className="bg-muted/50 rounded-md p-2">
                <div className="text-xs text-muted-foreground">المدينة</div>
                <div className="font-cairo">{listing.city}</div>
              </div>
              {listing.district && (
                <div className="bg-muted/50 rounded-md p-2">
                  <div className="text-xs text-muted-foreground">الحي</div>
                  <div className="font-cairo">{listing.district}</div>
                </div>
              )}
              {listing.year && (
                <div className="bg-muted/50 rounded-md p-2">
                  <div className="text-xs text-muted-foreground">سنة الصنع</div>
                  <div className="font-cairo">{listing.year}</div>
                </div>
              )}
              {listing.kilometers != null && (
                <div className="bg-muted/50 rounded-md p-2">
                  <div className="text-xs text-muted-foreground">الممشى</div>
                  <div className="font-cairo">{formatKilometers(listing.kilometers)}</div>
                </div>
              )}
              {listing.condition && (
                <div className="bg-muted/50 rounded-md p-2">
                  <div className="text-xs text-muted-foreground">الحالة</div>
                  <div className="font-cairo">
                    {listing.condition === "new" ? "جديد" : "مستعمل"}
                  </div>
                </div>
              )}
              <div className="bg-muted/50 rounded-md p-2">
                <div className="text-xs text-muted-foreground">المشاهدات</div>
                <div className="font-cairo tabular-nums">{formatNumber(listing.views)}</div>
              </div>
            </div>

            {/* Seller */}
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-cairo">
                    {listing.user.username.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-cairo font-bold truncate">{listing.user.username}</span>
                    {listing.user.isVerified && (
                      <Verified className="h-4 w-4 text-primary fill-primary/20" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{listing.user.rating}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatArabicDate(new Date(listing.createdAt))}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleCall} className="h-12 text-base">
                <Phone className="h-5 w-5 ml-2" />
                اتصال
              </Button>
              <Button
                onClick={handleWhatsApp}
                variant="secondary"
                className="h-12 text-base bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageCircle className="h-5 w-5 ml-2" />
                واتساب
              </Button>
            </div>

            {/* Promote to Featured button (only if not already featured) */}
            {!listing.isFeatured && onPromoteFeatured && (
              <Button
                variant="outline"
                className="w-full h-11 text-sm border-amber-400 text-amber-700 hover:bg-amber-50 bg-amber-50/30"
                onClick={() => onPromoteFeatured(listing.id, listing.title, 50)}
              >
                <Award className="h-4 w-4 ml-2" />
                ترقية الإعلان لمميز - 50 ريال (مدى / Apple Pay)
              </Button>
            )}
            {listing.isFeatured && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2 text-sm text-amber-800">
                <Award className="h-4 w-4" />
                <span>هذا الإعلان مميز بالفعل ✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="px-4 pb-4">
          <h4 className="font-cairo font-bold text-base mb-2">الوصف</h4>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
            {listing.description}
          </p>
        </div>

        <Separator />

        {/* Comments */}
        <div className="px-4 py-4">
          <h4 className="font-cairo font-bold text-base mb-3">
            التعليقات ({safeComments.length})
          </h4>

          {/* Add comment */}
          <Card className="p-3 mb-4 bg-muted/30">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="الاسم"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  className="h-9"
                />
                <Input
                  placeholder="الجوال (اختياري)"
                  value={commentPhone}
                  onChange={(e) => setCommentPhone(e.target.value)}
                  className="h-9"
                />
              </div>
              <Textarea
                placeholder="اكتب تعليقك..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button onClick={handleSubmitComment} size="sm" className="w-full sm:w-auto">
                نشر التعليق
              </Button>
            </div>
          </Card>

          {/* Comments list */}
          <div className="space-y-3">
            {safeComments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد تعليقات بعد. كن أول من يعلّق!
              </p>
            ) : (
              safeComments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-cairo">
                      {comment.username.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-cairo font-bold text-sm">{comment.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatArabicDate(new Date(comment.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== ADD LISTING DIALOG =====
function AddListingDialog({
  categories,
  onClose,
  onAdded,
}: {
  categories: Category[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    city: "جدة",
    district: "",
    categoryId: "",
    year: "",
    kilometers: "",
    condition: "used",
    phone: "",
    whatsapp: "",
    username: "",
    imageUrl: "",
  });
  const [images, setImages] = useState<string[]>([]);

  const handleAddImage = () => {
    if (form.imageUrl.trim()) {
      setImages([...images, form.imageUrl.trim()]);
      setForm({ ...form, imageUrl: "" });
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.price || !form.categoryId || !form.phone) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "فشل النشر");
      }

      toast({
        title: "تم نشر إعلانك بنجاح! 🎉",
        description: "سوف يظهر إعلانك مباشرة في النتائج",
      });
      onAdded();
    } catch (e) {
      toast({
        title: "خطأ في النشر",
        description: e instanceof Error ? e.message : "حاول مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Find subcategories for selected parent
  const selectedParent = categories.find((c) => c.id === form.categoryId);
  const allCategories = useMemo(() => {
    const result: { id: string; name: string; slug: string }[] = [];
    for (const cat of categories) {
      result.push({ id: cat.id, name: cat.name, slug: cat.slug });
      for (const child of cat.children) {
        result.push({ id: child.id, name: `${cat.name} - ${child.name}`, slug: child.slug });
      }
    }
    return result;
  }, [categories]);

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-right font-cairo text-xl flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          أضف إعلانك المجاني
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Title */}
        <div>
          <Label className="mb-1.5 block">عنوان الإعلان *</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="مثال: تويوتا كامري 2022 فل كامل"
            maxLength={100}
          />
        </div>

        {/* Category */}
        <div>
          <Label className="mb-1.5 block">القسم *</Label>
          <Select
            value={form.categoryId}
            onValueChange={(v) => setForm({ ...form, categoryId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر القسم" />
            </SelectTrigger>
            <SelectContent>
              {allCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedParent?.slug === "cars" && (
            <p className="text-xs text-muted-foreground mt-1">سيتم عرض حقول السيارات عند اختيار قسم سيارات</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label className="mb-1.5 block">الوصف *</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="اكتب وصفاً تفصيلياً لمعروضك..."
            rows={4}
            maxLength={2000}
          />
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">السعر (ريال) *</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">الحالة</Label>
            <Select
              value={form.condition}
              onValueChange={(v) => setForm({ ...form, condition: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="used">مستعمل</SelectItem>
                <SelectItem value="new">جديد</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Year & KM - shown for cars */}
        {(selectedParent?.slug === "cars" || categories.some(c => c.children.some(ch => ch.id === form.categoryId && c.slug === "cars"))) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">سنة الصنع</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="2022"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">الممشى (كم)</Label>
              <Input
                type="number"
                value={form.kilometers}
                onChange={(e) => setForm({ ...form, kilometers: e.target.value })}
                placeholder="45000"
              />
            </div>
          </div>
        )}

        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">المدينة *</Label>
            <Select
              value={form.city}
              onValueChange={(v) => setForm({ ...form, city: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAUDI_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">الحي</Label>
            <Input
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="النرجس"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block">الجوال *</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="05xxxxxxxx"
              dir="ltr"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">واتساب</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="05xxxxxxxx"
              dir="ltr"
            />
          </div>
        </div>

        <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-2 text-sm">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-cairo">
              {session?.user?.name?.slice(0, 2) || "ح"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs text-muted-foreground">يتم النشر باسم</div>
            <div className="font-cairo font-bold">{session?.user?.name}</div>
          </div>
        </div>

        {/* Images - رفع من الجهاز أو رابط */}
        <div>
          <Label className="mb-1.5 block">الصور</Label>
          {/* رفع من الجهاز */}
          <div className="mb-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (!files) return;
                Array.from(files).forEach(file => {
                  if (file.size > 5 * 1024 * 1024) {
                    toast({ title: "الصورة كبيرة جداً", description: "الحد الأقصى 5 ميجابايت", variant: "destructive" });
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setImages(prev => [...prev, reader.result as string]);
                  };
                  reader.readAsDataURL(file);
                });
                e.target.value = "";
              }}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-cairo file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">اضغط لاختيار صور من جهازك (حد أقصى 5 ميجابايت للصورة)</p>
          </div>
          {/* أو رابط */}
          <div className="flex gap-2">
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="أو الصق رابط صورة (URL)"
              dir="ltr"
            />
            <Button type="button" variant="secondary" onClick={handleAddImage}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة
            </Button>
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-md overflow-hidden group">
                  { }
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 left-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="حذف"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            أضف روابط مباشرة لصور معروضتك من الإنترنت
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSubmit} disabled={submitting} className="flex-1 h-12 text-base">
            {submitting ? "جارٍ النشر..." : "نشر الإعلان"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>إلغاء</Button>
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  );
}
