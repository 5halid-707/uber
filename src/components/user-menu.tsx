"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  LogOut,
  Heart,
  FileText,
  Eye,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Award,
} from "lucide-react";
import { formatPrice, formatArabicDate, formatNumber, formatKilometers } from "@/lib/format";

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
  _count: { comments: number; favorites: number };
};

type UserProfile = {
  id: string;
  username: string;
  phone: string;
  email: string | null;
  city: string | null;
  avatar: string | null;
  isVerified: boolean;
  rating: number;
  createdAt: string;
  _count: { listings: number; favorites: number };
};

type FavoriteListing = {
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
};

export function UserMenu({
  open,
  onOpenChange,
  onOpenListing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenListing: (listing: UserListing | FavoriteListing) => void;
}) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [myListings, setMyListings] = useState<UserListing[]>([]);
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !session?.user) {
      setProfile(null);
      setMyListings([]);
      setFavorites([]);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [meRes, myListingsRes, favRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/listings/user"),
          fetch("/api/favorites"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setProfile(meData.user);
        }
        if (myListingsRes.ok) {
          const data = await myListingsRes.json();
          setMyListings(data.listings || []);
        }
        if (favRes.ok) {
          const data = await favRes.json();
          setFavorites(data.favorites || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [open, session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast({ title: "تم تسجيل الخروج", description: "إلى اللقاء!", duration: 2000 });
    onOpenChange(false);
  };

  if (!session?.user) return null;

  const parseImages = (imgStr: string): string[] => {
    try {
      return JSON.parse(imgStr);
    } catch {
      return [];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right font-cairo text-xl flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              حسابي
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 ml-1" />
              تسجيل الخروج
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Profile header */}
        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-24 bg-muted animate-pulse rounded-lg" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : profile ? (
          <Card className="p-4 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary-foreground">
                <AvatarFallback className="bg-primary-foreground text-primary font-cairo text-xl">
                  {profile.username.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-cairo font-bold text-lg">{profile.username}</h3>
                  {profile.isVerified && (
                    <Badge className="bg-primary-foreground text-primary">
                      <Award className="h-3 w-3 ml-1" />
                      موثّق
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-primary-foreground/90">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span dir="ltr">{profile.phone}</span>
                  </div>
                  {profile.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate" dir="ltr">{profile.email}</span>
                    </div>
                  )}
                  {profile.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{profile.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>عضو منذ {formatArabicDate(new Date(profile.createdAt))}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-3 bg-primary-foreground/20" />

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary-foreground/80 text-xs mb-0.5">
                  <Star className="h-3 w-3 fill-primary-foreground" />
                  التقييم
                </div>
                <div className="font-cairo font-bold text-lg tabular-nums">
                  {profile.rating.toFixed(1)}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary-foreground/80 text-xs mb-0.5">
                  <FileText className="h-3 w-3" />
                  الإعلانات
                </div>
                <div className="font-cairo font-bold text-lg tabular-nums">
                  {profile._count.listings}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-primary-foreground/80 text-xs mb-0.5">
                  <Heart className="h-3 w-3" />
                  المفضلة
                </div>
                <div className="font-cairo font-bold text-lg tabular-nums">
                  {profile._count.favorites}
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Tabs: My listings + Favorites */}
        <Tabs defaultValue="my-listings" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="my-listings" className="font-cairo">
              <FileText className="h-4 w-4 ml-1" />
              إعلاناتي ({myListings.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="font-cairo">
              <Heart className="h-4 w-4 ml-1" />
              المفضلة ({favorites.length})
            </TabsTrigger>
          </TabsList>

          {/* My listings */}
          <TabsContent value="my-listings" className="space-y-2 mt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : myListings.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">لا توجد إعلانات بعد</p>
                <p className="text-xs text-muted-foreground mt-1">ابدأ بنشر إعلانك الأول!</p>
              </div>
            ) : (
              myListings.map((listing) => {
                const images = parseImages(listing.images);
                return (
                  <Card
                    key={listing.id}
                    className="p-3 flex gap-3 haraj-card cursor-pointer"
                    onClick={() => onOpenListing(listing)}
                  >
                    <div className="w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0">
                      {images[0] ? (
                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <FileText className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-cairo font-bold text-sm line-clamp-1">{listing.title}</h4>
                      <div className="text-primary font-cairo font-bold text-sm tabular-nums">
                        {formatPrice(listing.price, listing.currency)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatNumber(listing.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {listing._count.favorites}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatArabicDate(new Date(listing.createdAt))}
                        </span>
                      </div>
                    </div>
                    {listing.isFeatured && (
                      <Badge variant="secondary" className="bg-accent text-accent-foreground h-fit">
                        <Award className="h-3 w-3 ml-1" />
                        مميز
                      </Badge>
                    )}
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites" className="space-y-2 mt-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">لا توجد مفضلات بعد</p>
                <p className="text-xs text-muted-foreground mt-1">اضغط على ❤ في أي إعلان لإضافته هنا</p>
              </div>
            ) : (
              favorites.map((listing) => {
                const images = parseImages(listing.images);
                return (
                  <Card
                    key={listing.id}
                    className="p-3 flex gap-3 haraj-card cursor-pointer"
                    onClick={() => onOpenListing(listing)}
                  >
                    <div className="w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0">
                      {images[0] ? (
                        <img src={images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Heart className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-cairo font-bold text-sm line-clamp-1">{listing.title}</h4>
                      <div className="text-primary font-cairo font-bold text-sm tabular-nums">
                        {formatPrice(listing.price, listing.currency)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {listing.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatArabicDate(new Date(listing.createdAt))}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
