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

  return (
    <div className="space-y-5 max-w-5xl">
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

      {/* Lista de transações */}
      {!loading && !error && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
          {/* Cabeçalho da tabela */}
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {filtered.length} lançamentos
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</span>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {search ? "Nenhuma transação encontrada para sua busca." : "Nenhuma transação neste mês."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      t.type === "CREDIT" ? "bg-emerald-500/10" : "bg-destructive/10"
                    }`}>
                      {t.type === "CREDIT"
                        ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                        : <ArrowUpRight className="w-4 h-4 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate leading-snug">{t.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-muted-foreground">{t.accountName}</span>
                          <select
                            value={t.categoryId || ""}
                            onChange={async (e) => {
                              const newCatId = e.target.value;
                              if (!newCatId) return;
                              try {
                                await fetch("/api/transactions/override", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ externalId: t.id, categoryId: newCatId })
                                });
                                
                                // Flatten categories to find the selected one
                                const flatCats = categories.reduce((acc, c) => [...acc, c, ...(c.children || [])], []);
                                const selCat = flatCats.find((c: any) => c.id === newCatId);
                                
                                setTransactions(transactions.map(tx => 
                                  tx.id === t.id ? { ...tx, categoryId: newCatId, category: selCat?.name, categoryColor: selCat?.color } : tx
                                ));
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className={cn(
                              "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium cursor-pointer border-none focus:ring-0",
                              t.categoryColor ? "text-white" : "text-muted-foreground bg-white/10"
                            )}
                            style={t.categoryColor ? { backgroundColor: t.categoryColor } : {}}
                          >
                            <option value="" disabled>{t.category || "Sem categoria"}</option>
                            {categories.map(c => (
                              <optgroup key={c.id} label={c.name}>
                                <option value={c.id}>{c.name} (Geral)</option>
                                {c.children?.map((child: any) => (
                                  <option key={child.id} value={child.id}>{child.name}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-sm ${t.type === "CREDIT" ? "text-emerald-500" : "text-foreground"}`}>
                      {t.type === "CREDIT" ? "+" : "-"}{fmt(Math.abs(t.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(t.date)}</p>
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
