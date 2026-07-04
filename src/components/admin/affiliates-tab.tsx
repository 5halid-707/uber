"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Share2,
  Users,
  DollarSign,
  Check,
  X,
  Copy,
  TrendingUp,
} from "lucide-react";
import { formatNumber, formatArabicDate } from "@/lib/format";

type Affiliate = {
  id: string;
  username: string;
  email: string;
  affiliateCode: string | null;
  referralsCount: number;
  totalEarnings: number;
  paidEarnings: number;
  pendingEarnings: number;
  referrals: Array<{
    id: string;
    username: string;
    email: string;
    createdAt: string;
    _count: { listings: number; payments: number };
  }>;
  recentEarnings: Array<{
    id: string;
    amount: number;
    status: string;
    commissionRate: number;
    createdAt: string;
    referred: { username: string };
  }>;
};

type AffiliatesData = {
  affiliates: Affiliate[];
  stats: {
    totalAffiliates: number;
    totalReferrals: number;
    totalPaidOut: number;
    totalPending: number;
  };
};

export function AffiliatesTab() {
  const { toast } = useToast();
  const [data, setData] = useState<AffiliatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (e) {
      console.error("Affiliates fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handlePayEarning = async (id: string) => {
    if (!confirm("هل تريد تسجيل هذه العمولة كمدفوعة؟")) return;
    await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay" }),
    });
    toast({ title: "تم تسجيل العمولة كمدفوعة ✓", duration: 1500 });
    fetchAffiliates();
  };

  const handleCancelEarning = async (id: string) => {
    if (!confirm("هل تريد إلغاء هذه العمولة؟")) return;
    await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    toast({ title: "تم إلغاء العمولة", duration: 1500 });
    fetchAffiliates();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "تم نسخ الكود", duration: 1500 });
  };

  if (loading || !data) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-cairo font-bold text-lg flex items-center gap-2">
        <Share2 className="h-5 w-5 text-primary" />
        نظام العمولات والمسوّقين
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">مسوّقون</span>
          </div>
          <div className="font-cairo font-bold text-lg">{data.stats.totalAffiliates}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-muted-foreground">إحالات</span>
          </div>
          <div className="font-cairo font-bold text-lg">{data.stats.totalReferrals}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-xs text-muted-foreground">مدفوع</span>
          </div>
          <div className="font-cairo font-bold text-lg tabular-nums">
            {formatNumber(data.stats.totalPaidOut)} ريال
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-muted-foreground">معلّق</span>
          </div>
          <div className="font-cairo font-bold text-lg tabular-nums">
            {formatNumber(data.stats.totalPending)} ريال
          </div>
        </Card>
      </div>

      {/* Affiliates list */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto">
        {data.affiliates.length === 0 ? (
          <Card className="p-8 text-center">
            <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">لا يوجد مسوّقون بعد</p>
            <p className="text-xs text-muted-foreground mt-1">عندما يسجّل مستخدم عبر رابط إحالة، سيظهر هنا</p>
          </Card>
        ) : (
          data.affiliates.map((a) => (
            <Card key={a.id} className="p-3">
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
              >
                <div className="bg-purple-100 text-purple-700 rounded-lg p-2 shrink-0">
                  <Share2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-cairo font-bold">{a.username}</span>
                    {a.affiliateCode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(a.affiliateCode!);
                        }}
                        className="font-mono text-xs bg-muted px-2 py-0.5 rounded flex items-center gap-1 hover:bg-muted/70"
                      >
                        {a.affiliateCode}
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>{a.referralsCount} إحالة</span>
                    <span className="text-green-600">{formatNumber(a.paidEarnings)} ريال مدفوع</span>
                    <span className="text-amber-600">{formatNumber(a.pendingEarnings)} ريال معلّق</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    {expandedId === a.id ? "إغلاق" : "تفاصيل"}
                  </Button>
                </div>
              </div>

              {expandedId === a.id && (
                <div className="mt-3 pt-3 border-t space-y-3">
                  {/* Referrals */}
                  <div>
                    <h5 className="font-cairo font-bold text-sm mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      المستخدمون المُحالون ({a.referrals.length})
                    </h5>
                    <div className="space-y-1">
                      {a.referrals.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-xs bg-muted/30 rounded-md p-2">
                          <div>
                            <span className="font-cairo">{r.username}</span>
                            <span className="text-muted-foreground" dir="ltr"> — {r.email}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {r._count.listings} إعلان • {r._count.payments} دفع
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Earnings */}
                  {a.recentEarnings.length > 0 && (
                    <div>
                      <h5 className="font-cairo font-bold text-sm mb-2 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        العمولات ({a.recentEarnings.length})
                      </h5>
                      <div className="space-y-1">
                        {a.recentEarnings.map((e) => (
                          <div key={e.id} className="flex items-center justify-between text-xs bg-muted/30 rounded-md p-2">
                            <div>
                              <span className="font-cairo font-bold text-green-600">+{formatNumber(e.amount)} ريال</span>
                              <span className="text-muted-foreground"> — {e.referred.username} ({e.commissionRate}%)</span>
                              <div className="text-muted-foreground">{formatArabicDate(new Date(e.createdAt))}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className={
                                e.status === "pending" ? "bg-amber-100 text-amber-700 text-xs" :
                                e.status === "paid" ? "bg-green-100 text-green-700 text-xs" :
                                "bg-red-100 text-red-700 text-xs"
                              }>
                                {e.status === "pending" ? "معلّق" : e.status === "paid" ? "مدفوع" : "ملغي"}
                              </Badge>
                              {e.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs text-green-600 hover:text-green-700"
                                    onClick={() => handlePayEarning(e.id)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs text-destructive"
                                    onClick={() => handleCancelEarning(e.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
