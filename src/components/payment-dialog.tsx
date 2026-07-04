"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  Lock,
  Check,
  Loader2,
  Shield,
  Apple,
  Smartphone,
} from "lucide-react";
import { formatNumber } from "@/lib/format";

type PaymentMethod = "mada" | "visa" | "mastercard" | "apple_pay" | "stc_pay";

type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purpose: "featured_listing" | "wallet_topup";
  amount: number;
  listingId?: string;
  listingTitle?: string;
  onSuccess?: () => void;
};

const METHODS: { id: PaymentMethod; name: string; icon: React.ReactNode; color: string }[] = [
  { id: "mada", name: "مدى", icon: <span className="font-bold text-sm">مدى</span>, color: "bg-green-600" },
  { id: "apple_pay", name: "Apple Pay", icon: <Apple className="h-4 w-4" />, color: "bg-black" },
  { id: "visa", name: "Visa", icon: <span className="font-bold italic text-sm">VISA</span>, color: "bg-blue-600" },
  { id: "mastercard", name: "Mastercard", icon: <div className="flex"><div className="w-4 h-4 rounded-full bg-red-500" /><div className="w-4 h-4 rounded-full bg-yellow-400 -ml-2 opacity-80" /></div>, color: "bg-gray-700" },
  { id: "stc_pay", name: "STC Pay", icon: <Smartphone className="h-4 w-4" />, color: "bg-purple-600" },
];

export function PaymentDialog({
  open,
  onOpenChange,
  purpose,
  amount,
  listingId,
  listingTitle,
  onSuccess,
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [method, setMethod] = useState<PaymentMethod>("mada");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Apple Pay / STC Pay phone
  const [walletPhone, setWalletPhone] = useState("");

  const isCardMethod = method === "mada" || method === "visa" || method === "mastercard";
  const isWalletMethod = method === "apple_pay" || method === "stc_pay";

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const handlePay = async () => {
    // Validation
    if (isCardMethod) {
      const digits = cardNumber.replace(/\s/g, "");
      if (digits.length < 13) {
        toast({ title: "رقم البطاقة غير مكتمل", variant: "destructive" });
        return;
      }
      if (!cardName.trim()) {
        toast({ title: "الرجاء إدخال اسم حامل البطاقة", variant: "destructive" });
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        toast({ title: "تاريخ الانتهاء غير صحيح", variant: "destructive" });
        return;
      }
      if (!/^\d{3,4}$/.test(cardCvc)) {
        toast({ title: "رمز التحقق غير صحيح", variant: "destructive" });
        return;
      }
    }

    if (isWalletMethod && !walletPhone.trim()) {
      toast({ title: "الرجاء إدخال رقم الجوال المرتبط بالمحفظة", variant: "destructive" });
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          amount,
          method,
          listingId: listingId || null,
          // For card methods
          cardNumber: isCardMethod ? cardNumber : undefined,
          cardName: isCardMethod ? cardName : undefined,
          cardExpiry: isCardMethod ? cardExpiry : undefined,
          cardCvc: isCardMethod ? cardCvc : undefined,
          // For wallet methods - we'd use the phone
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "فشلت عملية الدفع",
          description: data.error || "حدث خطأ غير متوقع",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setProcessing(false);
        // Reset form
        setCardNumber("");
        setCardName("");
        setCardExpiry("");
        setCardCvc("");
        setWalletPhone("");
        onOpenChange(false);
        onSuccess?.();
      }, 2500);
    } catch {
      toast({
        title: "خطأ في الشبكة",
        description: "تعذر إتمام العملية. حاول مرة أخرى.",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (processing) return;
    onOpenChange(false);
    // Reset after close
    setTimeout(() => {
      setSuccess(false);
      setMethod("mada");
      setCardNumber("");
      setCardName("");
      setCardExpiry("");
      setCardCvc("");
      setWalletPhone("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="py-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="font-cairo font-bold text-xl mb-2">تم الدفع بنجاح!</h3>
            <p className="text-sm text-muted-foreground">
              {purpose === "featured_listing"
                ? "تم تفعيل تمييز إعلانك بنجاح"
                : "تم شحن محفظتك بنجاح"}
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-right font-cairo text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {purpose === "featured_listing" ? "ترقية الإعلان لمميز" : "شحن المحفظة"}
              </DialogTitle>
            </DialogHeader>

            {/* Order summary */}
            <Card className="p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">
                  {purpose === "featured_listing" ? "تكلفة التمييز" : "مبلغ الشحن"}
                </span>
                <span className="font-cairo font-bold text-lg text-primary tabular-nums">
                  {formatNumber(amount)} ريال
                </span>
              </div>
              {purpose === "featured_listing" && listingTitle && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  الإعلان: {listingTitle}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                شامل ضريبة القيمة المضافة
              </div>
            </Card>

            {/* Payment method selection */}
            <div>
              <Label className="mb-2 block">اختر طريقة الدفع</Label>
              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                      method === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`${m.color} text-white rounded-md w-10 h-7 flex items-center justify-center`}>
                      {m.icon}
                    </div>
                    <span className="text-[10px] font-cairo">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card form (for card methods) */}
            {isCardMethod && (
              <div className="space-y-3 pt-2">
                <div>
                  <Label className="mb-1 block">رقم البطاقة *</Label>
                  <div className="relative">
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      className="pr-10 font-mono"
                      dir="ltr"
                      maxLength={23}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-1 block">اسم حامل البطاقة *</Label>
                  <Input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="ABDULLAH MOHAMMED"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-1 block">تاريخ الانتهاء *</Label>
                    <Input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      dir="ltr"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block">CVC *</Label>
                    <Input
                      type="password"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      dir="ltr"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Wallet method (Apple Pay / STC Pay) */}
            {isWalletMethod && (
              <div className="space-y-3 pt-2">
                <Card className="p-4 bg-muted/30 text-center">
                  <div className={`${method === "apple_pay" ? "bg-black" : "bg-purple-600"} text-white rounded-lg w-16 h-16 flex items-center justify-center mx-auto mb-2`}>
                    {method === "apple_pay" ? <Apple className="h-8 w-8" /> : <Smartphone className="h-8 w-8" />}
                  </div>
                  <p className="font-cairo font-bold">
                    {method === "apple_pay" ? "Apple Pay" : "STC Pay"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    سيتم تحويلك إلى تطبيق {method === "apple_pay" ? "Apple Pay" : "STC Pay"} لإتمام العملية
                  </p>
                </Card>
                <div>
                  <Label className="mb-1 block">رقم الجوال المرتبط بالمحفظة *</Label>
                  <Input
                    type="tel"
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    maxLength={10}
                  />
                </div>
              </div>
            )}

            {/* Security badge */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground py-1">
              <Lock className="h-3 w-3" />
              <span>دفع آمن ومشفّر 256-bit SSL</span>
              <Shield className="h-3 w-3" />
            </div>

            {/* Demo notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
              <strong>وضع تجريبي:</strong> هذا نظام دفع تجريبي. لن يتم خصم أي مبلغ فعلي من بطاقتك.
            </div>

            {/* Pay button */}
            <Button
              onClick={handlePay}
              disabled={processing}
              className="w-full h-12 text-base font-cairo"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جارٍ معالجة الدفع...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 ml-2" />
                  ادفع {formatNumber(amount)} ريال
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
