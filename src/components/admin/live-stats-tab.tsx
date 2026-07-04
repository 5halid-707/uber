"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Radio,
  Users,
  FileText,
  DollarSign,
  Ticket,
  Share2,
  TrendingUp,
  Activity,
  RefreshCw,
} from "lucide-react";
import { formatNumber, formatArabicDate } from "@/lib/format";

type LiveStats = {
  live: {
    onlineUsersLast5Min: number;
    pendingTxns: number;
    pendingWithdrawalsAmount: number;
    pendingDepositsAmount: number;
    pendingAffiliatePayouts: number;
  };
  growth: {
    users: { today: number; week: number; month: number; total: number };
    listings: { today: number; week: number; month: number; total: number; active: number };
    revenue: { todayPaymentsCount: number; week: number; month: number; total: number };
  };
  marketing: { activeCoupons: number; totalAffiliates: number };
  recentActivities: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    user: { username: string } | null;
  }>;
};

export function LiveStatsTab() {
  const { toast } = useToast();
  const [data, setData] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/live-stats");
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setLastUpdate(new Date());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with live indicator */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-5 w-5 text-green-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <h3 className="font-cairo font-bold text-lg">إحصائيات حية</h3>
          <Badge className="bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full ml-1 animate-pulse" />
            مباشر
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>آخر تحديث: {lastUpdate.toLocaleTimeString("ar-SA")}</span>
          <Button size="sm" variant="ghost" onClick={fetchStats} className="h-7">
            <RefreshCw className="h-3 w-3 ml-1" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Live cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <LiveCard
          icon={<Activity className="h-4 w-4" />}
          label="نشطون (5 دقائق)"
          value={formatNumber(data.live.onlineUsersLast5Min)}
          color="bg-green-500"
          pulse
        />
        <LiveCard
          icon={<DollarSign className="h-4 w-4" />}
          label="تحويلات معلقة"
          value={formatNumber(data.live.pendingTxns)}
          color="bg-amber-500"
        />
        <LiveCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="سحوبات معلقة"
          value={`${formatNumber(data.live.pendingWithdrawalsAmount)} ريال`}
          color="bg-orange-500"
        />
        <LiveCard
          icon={<DollarSign className="h-4 w-4" />}
          label="إيداعات معلقة"
          value={`${formatNumber(data.live.pendingDepositsAmount)} ريال`}
          color="bg-blue-500"
        />
        <LiveCard
          icon={<Share2 className="h-4 w-4" />}
          label="عمولات معلقة"
          value={`${formatNumber(data.live.pendingAffiliatePayouts)} ريال`}
          color="bg-purple-500"
        />
      </div>

      {/* Growth stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            نمو المستخدمين
          </h4>
          <div className="space-y-2">
            <GrowthRow label="اليوم" value={data.growth.users.today} />
            <GrowthRow label="هذا الأسبوع" value={data.growth.users.week} />
            <GrowthRow label="هذا الشهر" value={data.growth.users.month} />
            <GrowthRow label="الإجمالي" value={data.growth.users.total} bold />
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-600" />
            نمو الإعلانات
          </h4>
          <div className="space-y-2">
            <GrowthRow label="اليوم" value={data.growth.listings.today} />
            <GrowthRow label="هذا الأسبوع" value={data.growth.listings.week} />
            <GrowthRow label="نشطة حالياً" value={data.growth.listings.active} />
            <GrowthRow label="الإجمالي" value={data.growth.listings.total} bold />
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-purple-600" />
            الإيرادات
          </h4>
          <div className="space-y-2">
            <GrowthRow label="عمليات اليوم" value={data.growth.revenue.todayPaymentsCount} />
            <GrowthRow label="هذا الأسبوع" value={`${formatNumber(data.growth.revenue.week)} ريال`} />
            <GrowthRow label="هذا الشهر" value={`${formatNumber(data.growth.revenue.month)} ريال`} />
            <GrowthRow label="الإجمالي" value={`${formatNumber(data.growth.revenue.total)} ريال`} bold />
          </div>
        </Card>
      </div>

      {/* Marketing summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 flex items-center gap-3">
          <div className="bg-amber-500 text-white rounded-lg p-2">
            <Ticket className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">كوبونات نشطة</div>
            <div className="font-cairo font-bold text-lg">{data.marketing.activeCoupons}</div>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3">
          <div className="bg-purple-500 text-white rounded-lg p-2">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">مسوّقون</div>
            <div className="font-cairo font-bold text-lg">{data.marketing.totalAffiliates}</div>
          </div>
        </Card>
      </div>

      {/* Recent activities */}
      <Card className="p-4">
        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          آخر النشاطات
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد نشاطات</p>
          ) : (
            data.recentActivities.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm py-1 border-b last:border-0">
                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-foreground">{a.description}</span>
                  {a.user && (
                    <span className="text-xs text-muted-foreground"> — {a.user.username}</span>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {formatArabicDate(new Date(a.createdAt))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function LiveCard({
  icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  pulse?: boolean;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={`${color} text-white rounded-lg p-1.5 relative`}>
          {icon}
          {pulse && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-xs text-muted-foreground line-clamp-1">{label}</span>
      </div>
      <div className="font-cairo font-bold text-base tabular-nums">{value}</div>
    </Card>
  );
}

function GrowthRow({ label, value, bold }: { label: string; value: number | string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${bold ? "font-cairo font-bold" : ""}`}>{value}</span>
    </div>
  );
}
