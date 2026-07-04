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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet,
  Banknote,
  Plus,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  X,
  Clock,
  Copy,
  CreditCard,
  TrendingUp,
  Zap,
} from "lucide-react";
import { formatPrice, formatArabicDate, formatNumber } from "@/lib/format";
import { PaymentDialog } from "@/components/payment-dialog";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  iban: string;
  accountNumber: string;
  swiftCode: string | null;
  isDefault: boolean;
};

type Transaction = {
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
  bankAccount: {
    bankName: string;
    accountName: string;
    iban: string;
    accountNumber: string;
  } | null;
};

type SiteSettings = {
  adminBankName: string | null;
  adminAccountName: string | null;
  adminIBAN: string | null;
  adminAccountNumber: string | null;
  minWithdrawal: number;
  withdrawalFee: number;
};

export function UserWallet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Add account form
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bankName: "",
    accountName: "",
    iban: "",
    accountNumber: "",
    swiftCode: "",
    isDefault: false,
  });

  // Withdrawal form
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankAccountId: "",
    description: "",
  });

  // Deposit form
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositForm, setDepositForm] = useState({
    amount: "",
    reference: "",
    description: "",
  });

  // Quick electronic payment (Mada/Apple Pay topup)
  const [quickPayment, setQuickPayment] = useState<{ open: boolean; amount: number }>({
    open: false,
    amount: 100,
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [accRes, txRes, setRes] = await Promise.all([
        fetch("/api/bank-accounts"),
        fetch("/api/transactions"),
        fetch("/api/settings"),
      ]);
      if (accRes.ok) {
        const data = await accRes.json();
        setAccounts(data.accounts);
      }
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(data.transactions);
        setBalance(data.balance);
        setAvailableBalance(data.availableBalance);
      }
      if (setRes.ok) {
        const data = await setRes.json();
        setSettings(data.settings);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && session?.user) {
      fetchAll();
    }
  }, [open, session]);

  const handleAddAccount = async () => {
    if (!newAccount.bankName || !newAccount.accountName || !newAccount.iban || !newAccount.accountNumber) {
      toast({ title: "بيانات ناقصة", description: "الرجاء ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "تم إضافة الحساب البنكي ✓", duration: 1500 });
      setNewAccount({ bankName: "", accountName: "", iban: "", accountNumber: "", swiftCode: "", isDefault: false });
      setShowAddAccount(false);
      fetchAll();
    } catch (e) {
      toast({ title: "خطأ", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحساب البنكي؟")) return;
    const res = await fetch(`/api/bank-accounts?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "تم حذف الحساب", duration: 1500 });
      fetchAll();
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawForm.amount);
    if (!amount || amount <= 0) {
      toast({ title: "مبلغ غير صحيح", variant: "destructive" });
      return;
    }
    if (!withdrawForm.bankAccountId) {
      toast({ title: "الرجاء اختيار حساب بنكي", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "withdrawal",
          amount,
          bankAccountId: withdrawForm.bankAccountId,
          description: withdrawForm.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "تم إرسال طلب السحب ✓", description: "سيتم مراجعته من الأدمن خلال 24 ساعة" });
      setWithdrawForm({ amount: "", bankAccountId: "", description: "" });
      setShowWithdraw(false);
      fetchAll();
    } catch (e) {
      toast({ title: "خطأ", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositForm.amount);
    if (!amount || amount <= 0) {
      toast({ title: "مبلغ غير صحيح", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "deposit",
          amount,
          reference: depositForm.reference,
          description: depositForm.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({
        title: "تم تسجيل طلب الإيداع ✓",
        description: "بعد تحويل المبلغ لحساب الأدمن، سيتم اعتماده خلال 24 ساعة",
      });
      setDepositForm({ amount: "", reference: "", description: "" });
      setShowDeposit(false);
      fetchAll();
    } catch (e) {
      toast({ title: "خطأ", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `تم نسخ ${label}`, duration: 1500 });
  };

  if (!session?.user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-right font-cairo text-xl flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            محفظتي المالية
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-muted animate-pulse rounded-lg" />
              <div className="h-64 bg-muted animate-pulse rounded-lg" />
            </div>
          ) : (
            <Tabs defaultValue="overview">
              <TabsList className="grid grid-cols-3 w-full mb-4">
                <TabsTrigger value="overview" className="font-cairo text-xs sm:text-sm">
                  <Wallet className="h-4 w-4 ml-1" />
                  المحفظة
                </TabsTrigger>
                <TabsTrigger value="accounts" className="font-cairo text-xs sm:text-sm">
                  <CreditCard className="h-4 w-4 ml-1" />
                  حساباتي
                </TabsTrigger>
                <TabsTrigger value="transactions" className="font-cairo text-xs sm:text-sm">
                  <TrendingUp className="h-4 w-4 ml-1" />
                  المعاملات
                </TabsTrigger>
              </TabsList>

              {/* ===== OVERVIEW ===== */}
              <TabsContent value="overview" className="space-y-4">
                {/* Balance cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4 bg-gradient-to-br from-primary to-primary/85 text-primary-foreground">
                    <div className="text-xs text-primary-foreground/80 mb-1">الرصيد الكلي</div>
                    <div className="font-cairo font-bold text-2xl tabular-nums">
                      {formatNumber(balance)}
                    </div>
                    <div className="text-xs text-primary-foreground/70">ريال سعودي</div>
                  </Card>
                  <Card className="p-4 border-2 border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">الرصيد المتاح للسحب</div>
                    <div className="font-cairo font-bold text-2xl tabular-nums text-primary">
                      {formatNumber(availableBalance)}
                    </div>
                    <div className="text-xs text-muted-foreground">ريال سعودي</div>
                  </Card>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    className="h-14 text-base font-cairo bg-green-600 hover:bg-green-700"
                    onClick={() => setShowDeposit(true)}
                  >
                    <ArrowDownToLine className="h-5 w-5 ml-2" />
                    إيداع بنكي
                  </Button>
                  <Button
                    className="h-14 text-base font-cairo"
                    onClick={() => setShowWithdraw(true)}
                    disabled={availableBalance < (settings?.minWithdrawal || 100)}
                  >
                    <ArrowUpFromLine className="h-5 w-5 ml-2" />
                    سحب رصيد
                  </Button>
                </div>

                {/* Quick electronic payment - Mada/Apple Pay */}
                <Card className="p-3 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-600 text-white rounded-lg p-1.5">
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-cairo font-bold text-sm">شحن فوري عبر مدى / Apple Pay</h4>
                        <p className="text-xs text-muted-foreground">الرصيد يضاف فوراً لمحفظتك</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[50, 100, 200, 500].map((amt) => (
                      <Button
                        key={amt}
                        variant="outline"
                        size="sm"
                        className="border-purple-300 hover:bg-purple-100 text-purple-700 font-cairo text-xs"
                        onClick={() => setQuickPayment({ open: true, amount: amt })}
                      >
                        {amt} ريال
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-300 hover:bg-purple-100 text-purple-700 font-cairo"
                    onClick={() => setQuickPayment({ open: true, amount: 100 })}
                  >
                    <CreditCard className="h-4 w-4 ml-2" />
                    مبلغ مخصص
                  </Button>
                </Card>

                {/* Admin bank info for deposits */}
                {settings && settings.adminIBAN && (
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <div className="flex items-start gap-3">
                      <Banknote className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-cairo font-bold text-amber-900 mb-2">
                          لإيداع الرصيد، حوّل إلى حساب الأدمن:
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-amber-800">البنك:</span>
                            <span className="font-cairo font-bold">{settings.adminBankName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-amber-800">اسم صاحب الحساب:</span>
                            <span className="font-cairo font-bold">{settings.adminAccountName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-amber-800">IBAN:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs" dir="ltr">{settings.adminIBAN}</span>
                              <button
                                onClick={() => copyToClipboard(settings.adminIBAN || "", "IBAN")}
                                className="text-amber-700 hover:text-amber-900"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-amber-800">رقم الحساب:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs" dir="ltr">{settings.adminAccountNumber}</span>
                              <button
                                onClick={() => copyToClipboard(settings.adminAccountNumber || "", "رقم الحساب")}
                                className="text-amber-700 hover:text-amber-900"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-amber-700 mt-2">
                          بعد التحويل، اضغط "إيداع رصيد" وأدخل مبلغ التحويل ومرجع العملية.
                          سيتم اعتماده بعد مراجعة الأدمن.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* ===== BANK ACCOUNTS ===== */}
              <TabsContent value="accounts" className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddAccount(!showAddAccount)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة حساب بنكي
                </Button>

                {showAddAccount && (
                  <Card className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">اسم البنك *</Label>
                        <Input
                          value={newAccount.bankName}
                          onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                          placeholder="البنك الأهلي السعودي"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">اسم صاحب الحساب *</Label>
                        <Input
                          value={newAccount.accountName}
                          onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                          placeholder="أبو سطام"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="mb-1 block">رقم الـ IBAN *</Label>
                        <Input
                          value={newAccount.iban}
                          onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                          placeholder="SA0380000000608010167519"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">رقم الحساب *</Label>
                        <Input
                          value={newAccount.accountNumber}
                          onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">SWIFT Code (اختياري)</Label>
                        <Input
                          value={newAccount.swiftCode}
                          onChange={(e) => setNewAccount({ ...newAccount, swiftCode: e.target.value })}
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddAccount} className="flex-1">حفظ الحساب</Button>
                      <Button variant="outline" onClick={() => setShowAddAccount(false)}>إلغاء</Button>
                    </div>
                  </Card>
                )}

                {accounts.length === 0 && !showAddAccount ? (
                  <Card className="p-8 text-center">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-1">لا توجد حسابات بنكية بعد</p>
                    <p className="text-xs text-muted-foreground">
                      أضف حسابك البنكي لتتمكن من سحب رصيدك
                    </p>
                  </Card>
                ) : (
                  accounts.map((acc) => (
                    <Card key={acc.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary rounded-lg p-2">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-cairo font-bold">{acc.bankName}</span>
                            {acc.isDefault && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                                افتراضي
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{acc.accountName}</div>
                          <div className="text-xs font-mono mt-1" dir="ltr">
                            IBAN: {acc.iban}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground" dir="ltr">
                            Acct: {acc.accountNumber}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAccount(acc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* ===== TRANSACTIONS ===== */}
              <TabsContent value="transactions" className="space-y-2 max-h-[60vh] overflow-y-auto">
                {transactions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">لا توجد معاملات بعد</p>
                  </Card>
                ) : (
                  transactions.map((t) => {
                    const isIncoming = t.type === "deposit" || t.type === "payment_in";
                    return (
                      <Card key={t.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`rounded-lg p-2 ${
                              isIncoming ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {isIncoming ? (
                              <ArrowDownToLine className="h-4 w-4" />
                            ) : (
                              <ArrowUpFromLine className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-cairo font-bold text-sm">
                                {isIncoming ? "إيداع" : "سحب"}
                              </span>
                              <span
                                className={`font-cairo font-bold tabular-nums ${
                                  isIncoming ? "text-green-600" : "text-orange-600"
                                }`}
                              >
                                {isIncoming ? "+" : "-"}
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
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatArabicDate(new Date(t.createdAt))}
                            </div>
                            {t.bankAccount && (
                              <div className="text-xs text-muted-foreground mt-1">
                                إلى: {t.bankAccount.bankName} - {t.bankAccount.accountName}
                              </div>
                            )}
                            {t.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {t.description}
                              </div>
                            )}
                            {t.reference && (
                              <div className="text-xs text-muted-foreground mt-1" dir="ltr">
                                مرجع: {t.reference}
                              </div>
                            )}
                            {t.adminNote && (
                              <div className="text-xs text-amber-700 mt-1">
                                ملاحظة الأدمن: {t.adminNote}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>

      {/* Withdraw modal */}
      {showWithdraw && (
        <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right font-cairo flex items-center gap-2">
                <ArrowUpFromLine className="h-5 w-5 text-orange-600" />
                طلب سحب رصيد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الرصيد المتاح:</span>
                  <span className="font-cairo font-bold text-primary">
                    {formatNumber(availableBalance)} ريال
                  </span>
                </div>
                {settings && (
                  <div className="text-xs text-muted-foreground mt-1">
                    الحد الأدنى للسحب: {settings.minWithdrawal} ريال
                  </div>
                )}
              </div>

              <div>
                <Label className="mb-1 block">المبلغ (ريال) *</Label>
                <Input
                  type="number"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div>
                <Label className="mb-1 block">إلى حساب *</Label>
                <select
                  value={withdrawForm.bankAccountId}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, bankAccountId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">اختر الحساب البنكي</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} - {a.accountName} ({a.iban.slice(-4)})
                    </option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <p className="text-xs text-destructive mt-1">
                    الرجاء إضافة حساب بنكي أولاً من تبويب "حساباتي"
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1 block">ملاحظة (اختياري)</Label>
                <Textarea
                  value={withdrawForm.description}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, description: e.target.value })}
                  rows={2}
                  placeholder="أي تفاصيل إضافية..."
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleWithdraw}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={accounts.length === 0}
                >
                  تأكيد طلب السحب
                </Button>
                <Button variant="outline" onClick={() => setShowWithdraw(false)}>إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Deposit modal */}
      {showDeposit && (
        <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-right font-cairo flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-green-600" />
                إيداع رصيد
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {settings && settings.adminIBAN && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
                  <div className="font-cairo font-bold text-amber-900 mb-2">
                    حوّل المبلغ إلى حساب الأدمن:
                  </div>
                  <div className="text-amber-800">
                    {settings.adminBankName} - {settings.adminAccountName}
                  </div>
                  <div className="font-mono text-amber-800 mt-1" dir="ltr">
                    {settings.adminIBAN}
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-1 block">المبلغ المحوّل (ريال) *</Label>
                <Input
                  type="number"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  placeholder="100"
                />
              </div>

              <div>
                <Label className="mb-1 block">مرجع التحويل *</Label>
                <Input
                  value={depositForm.reference}
                  onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })}
                  placeholder="رقم العملية / رقم الإيصال"
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="mb-1 block">ملاحظة (اختياري)</Label>
                <Textarea
                  value={depositForm.description}
                  onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleDeposit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  تأكيد الإيداع
                </Button>
                <Button variant="outline" onClick={() => setShowDeposit(false)}>إلغاء</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quick electronic payment dialog (Mada/Apple Pay) */}
      <PaymentDialog
        open={quickPayment.open}
        onOpenChange={(open) => setQuickPayment({ ...quickPayment, open })}
        purpose="wallet_topup"
        amount={quickPayment.amount}
        onSuccess={() => {
          fetchAll();
        }}
      />
    </Dialog>
  );
}
