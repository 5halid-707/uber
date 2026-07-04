"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Download,
  BarChart3,
  Wallet,
  Award,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatNumber, formatPrice } from "@/lib/format";

type MonthlyData = {
  month: string;
  monthIndex: number;
  deposits: number;
  withdrawals: number;
  electronicPayments: number;
  featuredRevenue: number;
  totalRevenue: number;
  transactionsCount: number;
};

type ReportData = {
  year: number;
  monthlyData: MonthlyData[];
  methodBreakdown: Record<string, { count: number; amount: number }>;
  totals: {
    deposits: number;
    withdrawals: number;
    electronicPayments: number;
    featuredRevenue: number;
    totalRevenue: number;
    transactionsCount: number;
  };
  availableYears: number[];
};

const METHOD_NAMES: Record<string, string> = {
  mada: "مدى",
  visa: "Visa",
  mastercard: "Mastercard",
  apple_pay: "Apple Pay",
  stc_pay: "STC Pay",
};

const METHOD_COLORS: Record<string, string> = {
  mada: "#16a34a",
  visa: "#2563eb",
  mastercard: "#f59e0b",
  apple_pay: "#000000",
  stc_pay: "#9333ea",
};

const PIE_COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#000000", "#9333ea", "#dc2626"];

export function FinancialReports() {
  const { toast } = useToast();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/admin/reports?year=${selectedYear}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => toast({ title: "خطأ في تحميل التقرير", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [selectedYear, toast]);

  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["الشهر", "الإيداعات", "السحوبات", "المدفوعات الإلكترونية", "إيرادات التمييز", "إجمالي الإيرادات", "عدد المعاملات"],
      ...data.monthlyData.map((m) => [
        m.month,
        m.deposits.toString(),
        m.withdrawals.toString(),
        m.electronicPayments.toString(),
        m.featuredRevenue.toString(),
        m.totalRevenue.toString(),
        m.transactionsCount.toString(),
      ]),
      ["الإجمالي",
        data.totals.deposits.toString(),
        data.totals.withdrawals.toString(),
        data.totals.electronicPayments.toString(),
        data.totals.featuredRevenue.toString(),
        data.totals.totalRevenue.toString(),
        data.totals.transactionsCount.toString(),
      ],
    ];
    const csv = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `haraj-report-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم تصدير التقرير ✓", duration: 1500 });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  // Pie chart data for payment methods
  const pieData = Object.entries(data.methodBreakdown).map(([method, info]) => ({
    name: METHOD_NAMES[method] || method,
    value: info.amount,
    count: info.count,
  }));

  return (
    <div className="space-y-4">
      {/* Year selector + export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-cairo font-bold text-lg">
            التقارير المالية - {selectedYear}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            {data.availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 ml-1" />
            تصدير CSV
          </Button>
        </div>
      </div>

      {/* Yearly totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-green-500 text-white rounded-lg p-1.5">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-xs text-muted-foreground">إجمالي الإيداعات</span>
          </div>
          <div className="font-cairo font-bold text-lg tabular-nums">
            {formatNumber(data.totals.deposits)} ريال
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-orange-500 text-white rounded-lg p-1.5">
              <TrendingDown className="h-4 w-4" />
            </div>
            <span className="text-xs text-muted-foreground">إجمالي السحوبات</span>
          </div>
          <div className="font-cairo font-bold text-lg tabular-nums">
            {formatNumber(data.totals.withdrawals)} ريال
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-purple-500 text-white rounded-lg p-1.5">
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-xs text-muted-foreground">المدفوعات الإلكترونية</span>
          </div>
          <div className="font-cairo font-bold text-lg tabular-nums">
            {formatNumber(data.totals.electronicPayments)} ريال
          </div>
        </Card>

        <Card className="p-3 bg-primary text-primary-foreground">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary-foreground/20 text-primary-foreground rounded-lg p-1.5">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="text-xs text-primary-foreground/80">إجمالي الإيرادات</span>
          </div>
          <div className="font-cairo font-bold text-lg tabular-nums">
            {formatNumber(data.totals.totalRevenue)} ريال
          </div>
        </Card>
      </div>

      {/* Monthly bar chart */}
      <Card className="p-4">
        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          المعاملات الشهرية
        </h4>
        <div className="h-72 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fontFamily: "Cairo, sans-serif" }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  fontFamily: "Cairo, sans-serif",
                  fontSize: "12px",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => [
                  `${formatNumber(value)} ريال`,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ fontFamily: "Cairo, sans-serif", fontSize: "12px" }}
              />
              <Bar dataKey="deposits" name="الإيداعات" fill="#16a34a" />
              <Bar dataKey="withdrawals" name="السحوبات" fill="#f97316" />
              <Bar dataKey="electronicPayments" name="المدفوعات الإلكترونية" fill="#9333ea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Payment methods pie chart */}
      {pieData.length > 0 && (
        <Card className="p-4">
          <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            توزيع طرق الدفع الإلكتروني
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: { name: string; value: number }) => `${entry.name}: ${formatNumber(entry.value)}`}
                    labelLine={false}
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${formatNumber(value)} ريال`}
                    contentStyle={{ fontFamily: "Cairo, sans-serif", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {pieData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-sm font-cairo">{item.name}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-cairo font-bold text-sm tabular-nums">
                      {formatNumber(item.value)} ريال
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.count} عملية
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Monthly table */}
      <Card className="p-4">
        <h4 className="font-cairo font-bold mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          التفصيل الشهري
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right py-2 px-2 font-cairo">الشهر</th>
                <th className="text-left py-2 px-2 font-cairo">الإيداعات</th>
                <th className="text-left py-2 px-2 font-cairo">السحوبات</th>
                <th className="text-left py-2 px-2 font-cairo">مدى/Apple Pay</th>
                <th className="text-left py-2 px-2 font-cairo">إيرادات التمييز</th>
                <th className="text-left py-2 px-2 font-cairo">عدد العمليات</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyData.map((m) => (
                <tr key={m.monthIndex} className="border-b hover:bg-muted/30">
                  <td className="py-2 px-2 font-cairo">{m.month}</td>
                  <td className="py-2 px-2 text-left tabular-nums text-green-600">
                    {m.deposits > 0 ? formatNumber(m.deposits) : "-"}
                  </td>
                  <td className="py-2 px-2 text-left tabular-nums text-orange-600">
                    {m.withdrawals > 0 ? formatNumber(m.withdrawals) : "-"}
                  </td>
                  <td className="py-2 px-2 text-left tabular-nums text-purple-600">
                    {m.electronicPayments > 0 ? formatNumber(m.electronicPayments) : "-"}
                  </td>
                  <td className="py-2 px-2 text-left tabular-nums">
                    {m.featuredRevenue > 0 ? formatNumber(m.featuredRevenue) : "-"}
                  </td>
                  <td className="py-2 px-2 text-left tabular-nums text-muted-foreground">
                    {m.transactionsCount || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary/5 font-cairo font-bold">
                <td className="py-2 px-2">الإجمالي</td>
                <td className="py-2 px-2 text-left tabular-nums">{formatNumber(data.totals.deposits)}</td>
                <td className="py-2 px-2 text-left tabular-nums">{formatNumber(data.totals.withdrawals)}</td>
                <td className="py-2 px-2 text-left tabular-nums">{formatNumber(data.totals.electronicPayments)}</td>
                <td className="py-2 px-2 text-left tabular-nums">{formatNumber(data.totals.featuredRevenue)}</td>
                <td className="py-2 px-2 text-left tabular-nums">{data.totals.transactionsCount}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
