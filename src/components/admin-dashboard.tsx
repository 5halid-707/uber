"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Check,
  X,
  Trash2,
  Star,
  Eye,
  Award,
  Banknote,
  Clock,
  Phone,
  MapPin,
  Settings,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { formatPrice, formatArabicDate, formatNumber } from "@/lib/format";
import { FinancialReports } from "@/components/financial-reports";

type AdminStats = {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  featuredListings: number;
  totalComments: number;
  pendingTransactions: number;
  completedTransactions: number;
  totalRevenue: number;
};

type AdminUser = {
  id: string;
  username: string;
  phone: string;
  email: string | null;
  city: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  rating: number;
  createdAt: string;
  _count: { listings: number; favorites: number; comments: number };
};

type AdminListing = {
  id: string;
  title: string;
  price: number;
  city: string;
  status: string;
  isFeatured: boolean;
  views: number;
  createdAt: string;
  user: { id: string; username: string; phone: string; isVerified: boolean };
  category: { name: string; slug: string };
  _count: { comments: number; favorites: number };
};

type AdminTransaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  reference: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  user: { id: string; username: string; phone: string; email: string | null; city: string | null };
  bankAccount: {
    bankName: string;
    accountName: string;
    iban: string;
    accountNumber: string;
  } | null;
  processedBy: { username: string } | null;
};

type SiteSettings = {
  id: string;
  siteName: string;
  adminPhone: string;
  adminWhatsApp: string;
  adminEmail: string | null;
  adminCity: string;
  adminBankName: string | null;
  adminAccountName: string | null;
  adminIBAN: string | null;
  adminAccountNumber: string | null;
  featuredPrice: number;
  withdrawalFee: number;
  minWithdrawal: number;
  welcomeMessage: string | null;
};

export function AdminDashboard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [recentListings, setRecentListings] = useState<AdminListing[]>([]);

  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [allListings, setAllListings] = useState<AdminListing[]>([]);
  const [allTransactions, setAllTransactions] = useState<AdminTransaction[]>([]);
  const [txStats, setTxStats] = useState({ pendingCount: 0, pendingWithdrawals: 0, pendingDeposits: 0 });

  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Search
  const [userSearch, setUserSearch] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 403) {
        toast({ title: "غير مصرح", description: "هذه الصفحة للأدمن فقط", variant: "destructive" });
        onOpenChange(false);
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setRecentUsers(data.recentUsers);
      setRecentListings(data.recentListings);
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
    if (res.ok) {
      const data = await res.json();
      setAllUsers(data.users);
    }
  };

  const fetchListings = async () => {
    const res = await fetch("/api/admin/listings");
    if (res.ok) {
      const data = await res.json();
      setAllListings(data.listings);
    }
  };

  const fetchTransactions = async () => {
    const res = await fetch("/api/admin/transactions");
    if (res.ok) {
      const data = await res.json();
      setAllTransactions(data.transactions);
      setTxStats(data.stats);
    }
  };

  const fetchSettings = async () => {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
    }
  };

  useEffect(() => {
    if (open && session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      Promise.all([fetchStats(), fetchUsers(), fetchListings(), fetchTransactions(), fetchSettings()]).finally(() =>
        setLoading(false)
      );
    }
  }, [open, session]);

  useEffect(() => {
    if (open && activeTab === "users" && userSearch !== undefined) {
      const t = setTimeout(() => fetchUsers(), 300);
      return () => clearTimeout(t);
    }
     
  }, [userSearch, open, activeTab]);

  // Actions
  const toggleUserVerified = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: !current }),
    });
    if (res.ok) {
      toast({ title: !current ? "تم توثيق المستخدم ✓" : "تم إلغاء التوثيق", duration: 1500 });
      fetchUsers();
    }
  };

  const toggleUserAdmin = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !current }),
    });
    if (res.ok) {
      toast({ title: !current ? "تم ترقية المستخدم لأدمن" : "تم إلغاء صلاحيات الأدمن", duration: 1500 });
      fetchUsers();
    }
  };

  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${username}"؟ سيتم حذف جميع إعلاناته.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "تم حذف المستخدم", duration: 1500 });
      fetchUsers();
      fetchStats();
    } else {
      const data = await res.json();
      toast({ title: "خطأ", description: data.error, variant: "destructive" });
    }
  };

  const toggleListingFeatured = async (id: string, current: boolean) => {
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !current }),
    });
    if (res.ok) {
      toast({ title: !current ? "تم تمييز الإعلان" : "تم إلغاء التمييز", duration: 1500 });
      fetchListings();
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "تم حذف الإعلان", duration: 1500 });
      fetchListings();
      fetchStats();
    }
  };

  const processTransaction = async (id: string, action: "approved" | "rejected", note?: string) => {
    const res = await fetch(`/api/admin/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action, adminNote: note || null }),
    });
    if (res.ok) {
      toast({
        title: action === "approved" ? "تمت الموافقة على التحويل ✓" : "تم رفض التحويل",
        duration: 1500,
      });
      fetchTransactions();
      fetchStats();
    }
  };

  const saveSettings = async (updatedSettings: Partial<SiteSettings>) => {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.settings);
      toast({ title: "تم حفظ الإعدادات بنجاح ✓", duration: 1500 });
    }
  };

  if (!session?.user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-right font-cairo text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            لوحة تحكم الأدمن
            <Badge className="bg-primary text-primary-foreground mr-2">
              <Shield className="h-3 w-3 ml-1" />
              {session.user.name}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-muted animate-pulse rounded-lg" />
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 sm:grid-cols-6 gap-1 mb-4">
                <TabsTrigger value="overview" className="font-cairo text-xs sm:text-sm">
                  <TrendingUp className="h-4 w-4 ml-1" />
                  نظرة عامة
                </TabsTrigger>
                <TabsTrigger value="users" className="font-cairo text-xs sm:text-sm">
                  <Users className="h-4 w-4 ml-1" />
                  المستخدمون
                </TabsTrigger>
                <TabsTrigger value="listings" className="font-cairo text-xs sm:text-sm">
                  <FileText className="h-4 w-4 ml-1" />
                  الإعلانات
                </TabsTrigger>
                <TabsTrigger value="transactions" className="font-cairo text-xs sm:text-sm">
                  <DollarSign className="h-4 w-4 ml-1" />
                  التحويلات
                  {txStats.pendingCount > 0 && (
                    <Badge className="bg-destructive text-white mr-1 text-xs px-1.5 py-0">
                      {txStats.pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="reports" className="font-cairo text-xs sm:text-sm">
                  <BarChart3 className="h-4 w-4 ml-1" />
                  التقارير
                </TabsTrigger>
                <TabsTrigger value="settings" className="font-cairo text-xs sm:text-sm">
                  <Settings className="h-4 w-4 ml-1" />
                  الإعدادات
                </TabsTrigger>
              </TabsList>

              {/* ===== OVERVIEW ===== */}
              <TabsContent value="overview" className="space-y-4">
                {stats && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatCard
                        icon={<Users className="h-5 w-5" />}
                        label="إجمالي المستخدمين"
                        value={formatNumber(stats.totalUsers)}
                        color="bg-blue-500"
                      />
                      <StatCard
                        icon={<FileText className="h-5 w-5" />}
                        label="إجمالي الإعلانات"
                        value={formatNumber(stats.totalListings)}
                        subValue={`${stats.activeListings} نشط`}
                        color="bg-green-500"
                      />
                      <StatCard
                        icon={<Award className="h-5 w-5" />}
                        label="إعلانات مميزة"
                        value={formatNumber(stats.featuredListings)}
                        color="bg-amber-500"
                      />
                      <StatCard
                        icon={<DollarSign className="h-5 w-5" />}
                        label="إجمالي الإيرادات"
                        value={`${formatNumber(stats.totalRevenue)} ريال`}
                        color="bg-purple-500"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="p-4">
                        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          أحدث المستخدمين
                        </h4>
                        <div className="space-y-2">
                          {recentUsers.map((u) => (
                            <div key={u.id} className="flex items-center gap-2 text-sm">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs font-cairo bg-primary text-primary-foreground">
                                  {u.username.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="font-cairo truncate">{u.username}</span>
                                  {u.isVerified && <Check className="h-3 w-3 text-primary" />}
                                </div>
                                <div className="text-xs text-muted-foreground" dir="ltr">
                                  {u.phone}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatArabicDate(new Date(u.createdAt))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          أحدث الإعلانات
                        </h4>
                        <div className="space-y-2">
                          {recentListings.map((l) => (
                            <div key={l.id} className="text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-cairo truncate flex-1">{l.title}</span>
                                <span className="text-primary font-bold text-xs whitespace-nowrap">
                                  {formatPrice(l.price)}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {l.user.username} • {l.city}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* ===== USERS ===== */}
              <TabsContent value="users" className="space-y-3">
                <Input
                  placeholder="ابحث بالاسم أو الجوال أو البريد..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="max-w-md"
                />
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {allUsers.map((u) => (
                    <Card key={u.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="font-cairo bg-primary text-primary-foreground">
                            {u.username.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-cairo font-bold">{u.username}</span>
                            {u.isVerified && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                                <Check className="h-3 w-3 ml-1" />
                                موثّق
                              </Badge>
                            )}
                            {u.isAdmin && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                                <Shield className="h-3 w-3 ml-1" />
                                أدمن
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span dir="ltr">{u.phone}</span>
                            {u.email && <span dir="ltr" className="truncate">{u.email}</span>}
                            {u.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {u.city}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs mt-1">
                            <span className="text-muted-foreground">
                              {u._count.listings} إعلان
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {u.rating.toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatArabicDate(new Date(u.createdAt))}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant={u.isVerified ? "outline" : "default"}
                            className="h-7 text-xs"
                            onClick={() => toggleUserVerified(u.id, u.isVerified)}
                          >
                            {u.isVerified ? "إلغاء التوثيق" : "توثيق"}
                          </Button>
                          {!u.isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => toggleUserAdmin(u.id, u.isAdmin)}
                            >
                              ترقية لأدمن
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteUser(u.id, u.username)}
                            disabled={u.id === (session.user as { id?: string }).id}
                          >
                            <Trash2 className="h-3 w-3 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ===== LISTINGS ===== */}
              <TabsContent value="listings" className="space-y-2">
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {allListings.map((l) => (
                    <Card key={l.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-cairo font-bold text-sm">{l.title}</span>
                            {l.isFeatured && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                                <Award className="h-3 w-3 ml-1" />
                                مميز
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className={
                                l.status === "active"
                                  ? "bg-green-100 text-green-700 text-xs"
                                  : "bg-red-100 text-red-700 text-xs"
                              }
                            >
                              {l.status === "active" ? "نشط" : l.status === "sold" ? "مباع" : "محذوف"}
                            </Badge>
                          </div>
                          <div className="text-primary font-bold text-sm mt-1">
                            {formatPrice(l.price)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{l.user.username}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {l.city}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatNumber(l.views)}
                            </span>
                            <span>{l._count.comments} تعليق</span>
                            <span>{formatArabicDate(new Date(l.createdAt))}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant={l.isFeatured ? "outline" : "default"}
                            className="h-7 text-xs"
                            onClick={() => toggleListingFeatured(l.id, l.isFeatured)}
                          >
                            <Award className="h-3 w-3 ml-1" />
                            {l.isFeatured ? "إلغاء التمييز" : "تمييز"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteListing(l.id)}
                          >
                            <Trash2 className="h-3 w-3 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ===== TRANSACTIONS ===== */}
              <TabsContent value="transactions" className="space-y-3">
                {txStats.pendingCount > 0 && (
                  <Card className="p-3 bg-amber-50 border-amber-200">
                    <div className="flex items-center gap-2 text-amber-800 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-cairo font-bold">
                        {txStats.pendingCount} تحويل بانتظار المراجعة:
                      </span>
                      <span>
                        سحب: {formatNumber(txStats.pendingWithdrawals)} ريال •
                        إيداع: {formatNumber(txStats.pendingDeposits)} ريال
                      </span>
                    </div>
                  </Card>
                )}

                <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                  {allTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">لا توجد تحويلات بعد</p>
                    </div>
                  ) : (
                    allTransactions.map((t) => (
                      <TransactionRow
                        key={t.id}
                        t={t}
                        onApprove={(note) => processTransaction(t.id, "approved", note)}
                        onReject={(note) => processTransaction(t.id, "rejected", note)}
                      />
                    ))
                  )}
                </div>
              </TabsContent>

              {/* ===== REPORTS ===== */}
              <TabsContent value="reports">
                <FinancialReports />
              </TabsContent>

              {/* ===== SETTINGS ===== */}
              <TabsContent value="settings">
                {settings && (
                  <SettingsForm settings={settings} onSave={saveSettings} />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== STAT CARD =====
function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`${color} text-white rounded-lg p-1.5`}>{icon}</div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="font-cairo font-bold text-xl tabular-nums">{value}</div>
      {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
    </Card>
  );
}

// ===== TRANSACTION ROW =====
function TransactionRow({
  t,
  onApprove,
  onReject,
}: {
  t: AdminTransaction;
  onApprove: (note?: string) => void;
  onReject: (note?: string) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  const isWithdrawal = t.type === "withdrawal";
  const isPending = t.status === "pending";

  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <div
          className={`rounded-lg p-2 ${
            isWithdrawal ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
          }`}
        >
          {isWithdrawal ? <Banknote className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-cairo font-bold">
              {isWithdrawal ? "طلب سحب" : "طلب إيداع"}
            </span>
            <span className="font-cairo font-bold text-primary text-lg tabular-nums">
              {formatPrice(t.amount, t.currency)}
            </span>
            <Badge
              variant="secondary"
              className={
                t.status === "pending"
                  ? "bg-amber-100 text-amber-700 text-xs"
                  : t.status === "completed"
                    ? "bg-green-100 text-green-700 text-xs"
                    : "bg-red-100 text-red-700 text-xs"
              }
            >
              {t.status === "pending" ? (
                <>
                  <Clock className="h-3 w-3 ml-1" />
                  بانتظار
                </>
              ) : t.status === "completed" ? (
                <>
                  <Check className="h-3 w-3 ml-1" />
                  مكتمل
                </>
              ) : (
                <>
                  <X className="h-3 w-3 ml-1" />
                  مرفوض
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="font-cairo">{t.user.username}</span>
            <span dir="ltr">{t.user.phone}</span>
            <span>{formatArabicDate(new Date(t.createdAt))}</span>
          </div>

          {/* Bank account info for withdrawals */}
          {isWithdrawal && t.bankAccount && (
            <div className="mt-2 bg-muted/50 rounded-md p-2 text-xs">
              <div className="font-cairo font-bold mb-1">حول إلى:</div>
              <div>{t.bankAccount.bankName} - {t.bankAccount.accountName}</div>
              <div dir="ltr" className="text-muted-foreground">
                IBAN: {t.bankAccount.iban}
              </div>
            </div>
          )}

          {t.description && (
            <div className="text-xs mt-1 text-muted-foreground">
              ملاحظة المستخدم: {t.description}
            </div>
          )}

          {t.reference && (
            <div className="text-xs mt-1 text-muted-foreground" dir="ltr">
              مرجع: {t.reference}
            </div>
          )}

          {t.adminNote && (
            <div className="text-xs mt-1 text-amber-700">
              ملاحظة الأدمن: {t.adminNote}
            </div>
          )}

          {t.processedBy && (
            <div className="text-xs mt-1 text-muted-foreground">
              عالجها: {t.processedBy.username}
            </div>
          )}

          {isPending && (
            <div className="mt-2">
              {!showNote ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => onApprove()}
                  >
                    <Check className="h-3 w-3 ml-1" />
                    موافقة وإرسال
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setShowNote(true)}
                  >
                    <X className="h-3 w-3 ml-1" />
                    رفض مع ملاحظة
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="سبب الرفض..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => {
                        onReject(note);
                        setNote("");
                        setShowNote(false);
                      }}
                    >
                      تأكيد الرفض
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => {
                        setShowNote(false);
                        setNote("");
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ===== SETTINGS FORM =====
function SettingsForm({
  settings,
  onSave,
}: {
  settings: SiteSettings;
  onSave: (s: Partial<SiteSettings>) => void;
}) {
  const [form, setForm] = useState(settings);

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <Card className="p-4">
        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          معلومات الموقع
        </h4>
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block">اسم الموقع</Label>
            <Input
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            />
          </div>
          <div>
            <Label className="mb-1 block">رسالة الترحيب</Label>
            <Textarea
              value={form.welcomeMessage || ""}
              onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          معلومات التواصل
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">جوال الأدمن</Label>
            <Input
              value={form.adminPhone}
              onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <Label className="mb-1 block">واتساب الأدمن</Label>
            <Input
              value={form.adminWhatsApp}
              onChange={(e) => setForm({ ...form, adminWhatsApp: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <Label className="mb-1 block">بريد الأدمن</Label>
            <Input
              value={form.adminEmail || ""}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <Label className="mb-1 block">مدينة الأدمن</Label>
            <Input
              value={form.adminCity}
              onChange={(e) => setForm({ ...form, adminCity: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          حسابك البنكي (لاستقبال التحويلات)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">اسم البنك</Label>
            <Input
              value={form.adminBankName || ""}
              onChange={(e) => setForm({ ...form, adminBankName: e.target.value })}
              placeholder="البنك الأهلي السعودي"
            />
          </div>
          <div>
            <Label className="mb-1 block">اسم صاحب الحساب</Label>
            <Input
              value={form.adminAccountName || ""}
              onChange={(e) => setForm({ ...form, adminAccountName: e.target.value })}
              placeholder="أبو سطام"
            />
          </div>
          <div className="col-span-2">
            <Label className="mb-1 block">رقم الـ IBAN</Label>
            <Input
              value={form.adminIBAN || ""}
              onChange={(e) => setForm({ ...form, adminIBAN: e.target.value })}
              dir="ltr"
              placeholder="SA0380000000608010167519"
            />
          </div>
          <div className="col-span-2">
            <Label className="mb-1 block">رقم الحساب</Label>
            <Input
              value={form.adminAccountNumber || ""}
              onChange={(e) => setForm({ ...form, adminAccountNumber: e.target.value })}
              dir="ltr"
            />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          الإعدادات المالية
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="mb-1 block">سعر التمييز (ريال)</Label>
            <Input
              type="number"
              value={form.featuredPrice}
              onChange={(e) => setForm({ ...form, featuredPrice: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label className="mb-1 block">رسوم السحب (ريال)</Label>
            <Input
              type="number"
              value={form.withdrawalFee}
              onChange={(e) => setForm({ ...form, withdrawalFee: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label className="mb-1 block">أقل سحب (ريال)</Label>
            <Input
              type="number"
              value={form.minWithdrawal}
              onChange={(e) => setForm({ ...form, minWithdrawal: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      </Card>

      <Button onClick={handleSubmit} className="w-full h-12 font-cairo">
        <Check className="h-4 w-4 ml-2" />
        حفظ الإعدادات
      </Button>
    </div>
  );
}
