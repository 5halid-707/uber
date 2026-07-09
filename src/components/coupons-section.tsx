"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { type Lang } from "@/lib/i18n";

interface Coupon { id: string; code: string; type: string; value: number; minTripPrice: number; maxUses: number; usesCount: number; isActive: boolean; expiresAt?: string | null; }
export function CouponsSection({ userId, lang }: { userId: string; lang: Lang }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/coupons?userId=${userId}`).then(r => r.json()).then(d => { if (Array.isArray(d)) setCoupons(d); }).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return null;

  return (
    <Card className="p-6 border-zinc-200">
      <h3 className="font-bold text-black mb-4">{lang === "ar" ? "قسائم الخصم" : "Coupons"}</h3>
      {coupons.length === 0 ? (
        <p className="text-sm text-zinc-500">{lang === "ar" ? "لا توجد قسائم خصم متاحة" : "No coupons available"}</p>
      ) : (
        <div className="space-y-2">
          {coupons.filter(c => c.isActive).map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-xl border border-green-200">
              <div><span className="font-bold text-green-800">{c.code}</span><p className="text-xs text-green-600 mt-0.5">{c.type === "percentage" ? `${c.value}%` : `${c.value} ر.س`} {lang === "ar" ? "خصم" : "off"}</p></div>
              <Badge className="bg-green-600">{lang === "ar" ? "متاح" : "Active"}</Badge>
            </div>
          ))}
          {coupons.filter(c => !c.isActive).length > 0 && (
            <div className="pt-3 border-t border-zinc-100">
              <p className="text-xs text-zinc-400 mb-2">{lang === "ar" ? "قسائم منتهية" : "Expired"}</p>
              {coupons.filter(c => !c.isActive).map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 px-4 bg-zinc-50 rounded-xl border border-zinc-200 opacity-60">
                  <div><span className="font-medium text-zinc-500">{c.code}</span><p className="text-xs text-zinc-400">{c.type === "percentage" ? `${c.value}%` : `${c.value} ر.س`}</p></div>
                  <Badge variant="secondary">{lang === "ar" ? "منتهي" : "Expired"}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
