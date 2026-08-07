"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowDownLeft, ArrowUpRight, Search,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet,
} from "lucide-react";

const fmt = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const fmtDateFull = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const getBankInfo = (accountName: string = "") => {
  const name = accountName.toUpperCase();
  if (name.includes("NUBANK") || name.includes("NU FINANCEIRA")) return { initial: "N", bg: "bg-[#8A05BE]" };
  if (name.includes("INTER")) return { initial: "I", bg: "bg-[#FF7A00]" };
  if (name.includes("MERCADO PAGO")) return { initial: "M", bg: "bg-[#009EE3]" };
  if (name.includes("ITAU") || name.includes("ITAÚ")) return { initial: "I", bg: "bg-[#EC7000]" };
  if (name.includes("BRADESCO")) return { initial: "B", bg: "bg-[#CC092F]" };
  if (name.includes("SANTANDER")) return { initial: "S", bg: "bg-[#CC0000]" };
  if (name.includes("CAIXA")) return { initial: "C", bg: "bg-[#005CA9]" };
  return { initial: name.charAt(0) || "B", bg: "bg-gray-700" };
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "DEBIT" | "CREDIT";
  category?: string;
  categoryId?: string;
  categoryType?: string;
  categoryColor?: string;
  accountName?: string;
}

interface Summary {
  totalIn: number;
  totalOut: number;
  balance: number;
  count: number;
}

import { useSearchParams } from "next/navigation";
import { cn, getBankLogo, monthKey, monthLabel } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "Same person transfer": "bg-blue-500/10 text-blue-400",
  "Transfer": "bg-blue-500/10 text-blue-400",
  "Credit Card Payment": "bg-purple-500/10 text-purple-400",
  "Income": "bg-emerald-500/10 text-emerald-400",
  "Salary": "bg-emerald-500/10 text-emerald-400",
};

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") || monthKey(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIn: 0, totalOut: 0, balance: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error("API Error Categories:", data);
        setCategories([]);
      }
    } catch (e) {
      console.error(e);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchData = useCallback((m: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/transactions?month=${m}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setTransactions(d.transactions);
        setSummary(d.summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(month); }, [month, fetchData]);

  const filtered = transactions.filter((t) =>
    (t.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.category ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.accountName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const groupedTransactions = filtered.reduce((acc, t) => {
    // We assume t.date is a valid date string
    const dateKey = new Date(t.date).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">Transações</h1>
        <p className="text-muted-foreground">Movimentações das contas bancárias.</p>
      </div>

      {/* Barra de controles */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Buscar por descrição, categoria ou conta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Cards de resumo do mês */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground font-medium">Entradas</span>
            </div>
            <p className="text-xl font-bold text-emerald-500">{fmt(summary.totalIn)}</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground font-medium">Saídas</span>
            </div>
            <p className="text-xl font-bold text-destructive">{fmt(summary.totalOut)}</p>
          </div>
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Resultado</span>
            </div>
            <p className={`text-xl font-bold ${summary.balance >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {fmt(summary.balance)}
            </p>
          </div>
        </div>
      )}

      {/* Skeleton loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-6 text-destructive">{error}</div>
      )}

      {/* Lista de transações agrupadas */}
      {!loading && !error && (
        <div className="space-y-8 pb-10">
          {/* Cabeçalho de Lançamentos */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {filtered.length} lançamentos
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</span>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-card border border-border p-12 text-center text-muted-foreground shadow-sm">
              {search ? "Nenhuma transação encontrada para sua busca." : "Nenhuma transação neste mês."}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTransactions).map(([dateKey, items]) => (
                <div key={dateKey} className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground pl-2 tracking-tight">{dateKey}</h3>
                  <div className="bg-[#0a0a0a] rounded-2xl p-2 border border-white/5">
                    {items.map((t) => {
                      const bankInfo = getBankInfo(t.accountName);
                      return (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-4 py-4 px-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-xl", bankInfo.bg)}>
                                {bankInfo.initial}
                              </div>
                              <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-[3px] border-[#0a0a0a]", t.type === "CREDIT" ? "bg-emerald-500" : "bg-red-500")}>
                                {t.type === "CREDIT"
                                  ? <ArrowUpRight className="w-3 h-3 text-black stroke-[3]" />
                                  : <ArrowDownLeft className="w-3 h-3 text-white stroke-[3]" />}
                              </div>
                            </div>

                            {/* Description and Subtitle */}
                            <div className="min-w-0 flex flex-col justify-center">
                              <p className="font-mono text-[13px] font-bold text-emerald-500 truncate uppercase tracking-widest">
                                {t.description}
                              </p>
                              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1 truncate">
                                {t.accountName || "DESCONHECIDO"} | {t.category || t.categoryId || "TRANSFERS"} | {fmtDateFull(t.date)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Value */}
                          <div className="text-right shrink-0">
                            <p className={cn("font-mono font-bold text-sm tracking-widest", t.type === "CREDIT" ? "text-emerald-500" : "text-red-500")}>
                              {t.type === "CREDIT" ? "+ " : "- "}{fmt(Math.abs(t.amount))}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";
export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando transações...</div>}>
      <TransactionsPageContent />
    </Suspense>
  );
}
