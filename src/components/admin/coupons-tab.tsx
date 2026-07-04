"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Ticket,
  Plus,
  Trash2,
  Check,
  X,
  Percent,
  DollarSign,
} from "lucide-react";
import { formatArabicDate } from "@/lib/format";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  maxRedemptions: number | null;
  usedCount: number;
  minAmount: number;
  maxDiscount: number | null;
  validUntil: string | null;
  isActive: boolean;
  appliesTo: string;
  createdAt: string;
  _count: { redemptions: number };
};

export function CouponsTab() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "percentage",
    value: "",
    maxRedemptions: "",
    minAmount: "0",
    maxDiscount: "",
    validUntil: "",
    appliesTo: "all",
  });

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.value) {
      toast({ title: "بيانات ناقصة", description: "الكود والقيمة مطلوبان", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: parseFloat(form.value),
          maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : null,
          minAmount: parseFloat(form.minAmount) || 0,
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
          validUntil: form.validUntil || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      toast({ title: "تم إنشاء الكوبون ✓", duration: 1500 });
      setForm({
        code: "", description: "", type: "percentage", value: "",
        maxRedemptions: "", minAmount: "0", maxDiscount: "", validUntil: "", appliesTo: "all",
      });
      setShowForm(false);
      fetchCoupons();
    } catch (e) {
      toast({
        title: "خطأ",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    toast({ title: !current ? "تم تفعيل الكوبون" : "تم إيقاف الكوبون", duration: 1500 });
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    toast({ title: "تم حذف الكوبون", duration: 1500 });
    fetchCoupons();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-cairo font-bold text-lg flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          الكوبونات والخصومات
        </h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 ml-1" />
          كوبون جديد
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">كود الكوبون *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2026"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="mb-1 block">الوصف</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="خصم الصيف 15%"
              />
            </div>
            <div>
              <Label className="mb-1 block">نوع الخصم *</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="percentage">نسبة مئوية %</option>
                <option value="fixed">مبلغ ثابت (ريال)</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block">القيمة *</Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === "percentage" ? "15" : "20"}
              />
            </div>
            <div>
              <Label className="mb-1 block">حد الاستخدام (اختياري)</Label>
              <Input
                type="number"
                value={form.maxRedemptions}
                onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                placeholder="100"
              />
            </div>
            <div>
              <Label className="mb-1 block">الحد الأدنى للطلب</Label>
              <Input
                type="number"
                value={form.minAmount}
                onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label className="mb-1 block">ينتهي في (اختياري)</Label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-1 block">يطبّق على</Label>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">الكل</option>
                <option value="featured_listing">ترقية الإعلان</option>
                <option value="wallet_topup">شحن المحفظة</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} className="flex-1">حفظ الكوبون</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
          </div>
        </Card>
      )}

      {/* Coupons list */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {coupons.length === 0 ? (
          <Card className="p-8 text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">لا توجد كوبونات بعد</p>
          </Card>
        ) : (
          coupons.map((c) => (
            <Card key={c.id} className="p-3">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {c.type === "percentage" ? <Percent className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-base">{c.code}</span>
                    <Badge variant="secondary" className={c.isActive ? "bg-green-100 text-green-700 text-xs" : "bg-gray-100 text-gray-500 text-xs"}>
                      {c.isActive ? "نشط" : "متوقف"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {c.type === "percentage" ? `${c.value}%` : `${c.value} ريال`}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {c.appliesTo === "all" ? "للكل" : c.appliesTo === "featured_listing" ? "للتمييز" : "للشحن"}
                    </Badge>
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>استُخدم {c._count.redemptions} مرة</span>
                    {c.maxRedemptions && <span>من {c.maxRedemptions}</span>}
                    {c.minAmount > 0 && <span>أقل طلب: {c.minAmount} ريال</span>}
                    {c.validUntil && <span>حتى {new Date(c.validUntil).toLocaleDateString("ar-SA")}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant={c.isActive ? "outline" : "default"}
                    className="h-7 text-xs"
                    onClick={() => toggleActive(c.id, c.isActive)}
                  >
                    {c.isActive ? "إيقاف" : "تفعيل"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
