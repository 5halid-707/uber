"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Search,
  LogIn,
  LogOut,
  UserPlus,
  FileText,
  Trash2,
  Heart,
  CreditCard,
  DollarSign,
  Ticket,
  Settings as SettingsIcon,
  Shield,
  Banknote,
  Check,
  X,
} from "lucide-react";
import { formatArabicDate } from "@/lib/format";

type ActivityEntry = {
  id: string;
  action: string;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: string;
  user: { id: string; username: string; email: string } | null;
};

const ACTION_ICONS: Record<string, typeof Activity> = {
  login: LogIn,
  login_google: LogIn,
  logout: LogOut,
  register: UserPlus,
  register_google: UserPlus,
  listing_create: FileText,
  listing_update: FileText,
  listing_delete: Trash2,
  comment_create: FileText,
  favorite_add: Heart,
  favorite_remove: Heart,
  payment_featured: CreditCard,
  payment_topup: CreditCard,
  withdrawal_request: DollarSign,
  withdrawal_approve: Check,
  withdrawal_reject: X,
  deposit_request: DollarSign,
  deposit_approve: Check,
  deposit_reject: X,
  coupon_create: Ticket,
  coupon_redeem: Ticket,
  user_verify: Shield,
  user_promote_admin: Shield,
  user_delete: Trash2,
  settings_update: SettingsIcon,
  bank_account_add: Banknote,
  bank_account_delete: Banknote,
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-blue-100 text-blue-700",
  login_google: "bg-blue-100 text-blue-700",
  logout: "bg-gray-100 text-gray-700",
  register: "bg-green-100 text-green-700",
  register_google: "bg-green-100 text-green-700",
  listing_create: "bg-purple-100 text-purple-700",
  listing_delete: "bg-red-100 text-red-700",
  payment_featured: "bg-amber-100 text-amber-700",
  payment_topup: "bg-amber-100 text-amber-700",
  withdrawal_request: "bg-orange-100 text-orange-700",
  withdrawal_approve: "bg-green-100 text-green-700",
  withdrawal_reject: "bg-red-100 text-red-700",
  deposit_request: "bg-blue-100 text-blue-700",
  deposit_approve: "bg-green-100 text-green-700",
  deposit_reject: "bg-red-100 text-red-700",
  coupon_create: "bg-pink-100 text-pink-700",
  user_verify: "bg-indigo-100 text-indigo-700",
  settings_update: "bg-gray-100 text-gray-700",
};

export function ActivityLogTab() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/activity?limit=100&${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchActivities, 400);
    return () => clearTimeout(t);
     
  }, [search]);

  const filtered = filter === "all"
    ? activities
    : activities.filter((a) => a.action.startsWith(filter));

  // Get unique action prefixes for filter
  const actionPrefixes = Array.from(
    new Set(activities.map((a) => a.action.split("_")[0]))
  ).sort();

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-cairo font-bold text-lg flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        سجل النشاطات ({activities.length})
      </h3>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث في النشاطات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">كل النشاطات</option>
          {actionPrefixes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">لا توجد نشاطات</p>
          </Card>
        ) : (
          filtered.map((a) => {
            const Icon = ACTION_ICONS[a.action] || Activity;
            const color = ACTION_COLORS[a.action] || "bg-gray-100 text-gray-700";
            return (
              <Card key={a.id} className="p-2.5">
                <div className="flex items-start gap-2">
                  <div className={`${color} rounded-full p-1.5 shrink-0`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">{a.description}</span>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {a.action}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {a.user && <span>— {a.user.username}</span>}
                      <span>{formatArabicDate(new Date(a.createdAt))}</span>
                      {a.ipAddress && (
                        <span dir="ltr" className="hidden sm:inline">IP: {a.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
