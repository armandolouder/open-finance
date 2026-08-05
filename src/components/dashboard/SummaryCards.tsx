"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp, CreditCard, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Summary {
  totalBalance: number;
  totalCreditUsed: number;
  totalCreditLimit: number;
  totalInvestments: number;
  totalAssets: number;
}

export function SummaryCards({ data: externalData }: { data?: any } = {}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(!externalData);

  useEffect(() => {
    if (externalData) {
      setSummary(externalData);
      setLoading(false);
      return;
    }
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => { setSummary(d.summary); setLoading(false); })
      .catch(() => setLoading(false));
  }, [externalData]);

  const cards = [
    {
      title: "Saldo em Conta",
      value: summary ? fmt(summary.totalBalance) : "—",
      sub: "Contas bancárias",
      icon: Wallet,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Investimentos",
      value: summary ? fmt(summary.totalInvestments) : "—",
      sub: "Total aplicado",
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Fatura Aberta",
      value: summary ? fmt(summary.totalCreditUsed) : "—",
      sub: summary ? `Limite: ${fmt(summary.totalCreditLimit)}` : "Cartões de crédito",
      icon: CreditCard,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Patrimônio Total",
      value: summary ? fmt(summary.totalAssets) : "—",
      sub: "Conta + Investimentos",
      icon: BarChart2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((item) => (
        <div
          key={item.title}
          className="group relative rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {item.title}
              </p>
              {loading ? (
                <div className="h-7 w-28 rounded-lg bg-muted animate-pulse" />
              ) : (
                <h3 className={cn("text-2xl font-bold tracking-tight whitespace-nowrap", item.color)}>
                  {item.value}
                </h3>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">{item.sub}</p>
            </div>
            <div className={cn("p-2.5 rounded-xl shrink-0", item.bg)}>
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
