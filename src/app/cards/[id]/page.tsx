"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  CreditCard, ChevronLeft, ChevronRight, AlertCircle, Repeat, ArrowLeft
} from "lucide-react";
import { cn, getBankBranding, getBankLogoUrl } from "@/lib/utils";
import { CsvImportButton } from "@/components/cards/CsvImportButton";

const fmt = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
function prevMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 2, 1));
}
function nextMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m, 1));
}

interface CardData {
  id: string;
  name: string;
  brand?: string;
  institutionName?: string;
  institutionLogo?: string | null;
  availableLimit?: number;
  dueDate?: string | null;
  closingDate?: string | null;
  minimumPayment?: number;
  waiverTarget?: number | null;
  feeAmount?: number | null;
  bills: {
    month: string;
    total: number;
    transactions: {
      id: string;
      description: string;
      amount: number;
      date: string;
      totalInstallments?: number;
      installmentNumber?: number;
      category?: string;
      categoryColor?: string;
    }[];
  }[];
}

function CardDetailsPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const cardId = params.id as string;
  
  const month = searchParams.get("month") || monthKey(new Date());
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((m: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/cards?month=${m}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        const found = d.cards.find((c: CardData) => c.id === cardId);
        if (!found) throw new Error("Cartão não encontrado");
        setCard(found);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [cardId]);

  useEffect(() => { fetchData(month); }, [month, fetchData]);

  const activeBill = card?.bills?.[0];
  const transactions = activeBill?.transactions || [];

  // Agrupamento de transações para a sidebar
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { amount: number, category?: string, categoryColor?: string }> = {};
    transactions.forEach(tx => {
      const desc = tx.description.trim();
      if (!groups[desc]) {
        groups[desc] = { amount: 0, category: tx.category, categoryColor: tx.categoryColor };
      }
      groups[desc].amount += tx.amount;
    });

    return Object.entries(groups)
      .map(([name, data]) => ({ name, amount: data.amount, category: data.category, categoryColor: data.categoryColor }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <div className="space-y-6 w-full max-w-6xl pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {card ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {card.institutionLogo ? (
                  <img src={getBankLogoUrl(card.name, card.institutionName, card.institutionLogo) || undefined} alt="" className="w-8 h-8 object-contain" />
                ) : (
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground capitalize leading-snug">{card.name}</h1>
                <p className="text-xs text-muted-foreground">{card.brand ?? card.institutionName}</p>
              </div>
            </div>
          ) : (
            <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          )}
        </div>

      </div>

      {!loading && !error && card && (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group/box mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Total Fatura */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Fatura</p>
              <p className="text-3xl font-black text-amber-500 tracking-tight">{fmt(activeBill?.total)}</p>
              <p className="text-xs font-medium text-muted-foreground mt-2">
                Mínimo: {fmt(card.minimumPayment)}
              </p>
            </div>

            {/* Limite */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Limite Disponível</p>
              <p className="text-3xl font-black text-emerald-500 tracking-tight">{fmt(card.availableLimit)}</p>
            </div>

            {/* Isenção */}
            {card.waiverTarget ? (() => {
              const currentTotal = activeBill?.total ?? 0;
              const isExempt = currentTotal >= card.waiverTarget;
              const feeCharged = card.feeAmount ? activeBill?.transactions.some(t => Math.abs(t.amount) === card.feeAmount) : false;

              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      Meta de Isenção
                    </p>
                    <p className="text-xs font-mono font-semibold text-foreground tracking-tight">{fmt(currentTotal)} / {fmt(card.waiverTarget)}</p>
                  </div>
                  
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-500", isExempt ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-amber-300")} 
                      style={{ width: `${Math.min(100, (currentTotal / card.waiverTarget) * 100)}%` }}
                    />
                  </div>
                  
                  {card.feeAmount && (
                    <div className="pt-1">
                      {feeCharged ? (
                        <p className="text-[10px] text-destructive flex items-center gap-1.5 font-medium bg-destructive/10 px-2 py-1.5 rounded w-max">
                          <AlertCircle className="w-3.5 h-3.5" /> Anuidade de {fmt(card.feeAmount)} cobrada.
                        </p>
                      ) : isExempt ? (
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-400/10 px-2 py-1.5 rounded w-max">
                          <AlertCircle className="w-3.5 h-3.5" /> Meta alcançada! Economia de {fmt(card.feeAmount)}.
                        </p>
                      ) : (
                        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                          Anuidade padrão: <span className="text-foreground">{fmt(card.feeAmount)}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })() : (
              <div className="flex h-full items-center justify-center opacity-30">
                <p className="text-xs font-medium text-muted-foreground">Sem meta de isenção</p>
              </div>
            )}
          </div>
          
          {card.dueDate && (
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Vencimento: {new Date(card.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              <span className="opacity-40">|</span>
              <span>Fechamento: {card.closingDate ? new Date(card.closingDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}</span>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 h-[600px] rounded-2xl bg-muted animate-pulse" />
          <div className="w-full lg:w-[340px] h-[600px] rounded-2xl bg-muted animate-pulse shrink-0" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-6 text-destructive">{error}</div>
      )}

      {!loading && !error && card && (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Coluna Esquerda: Lista de Transações */}
          <div className="flex-1 w-full rounded-3xl bg-[#0a0a0a] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex flex-col gap-4 bg-white/[0.01]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Lançamentos</h2>
                  <p className="text-sm text-muted-foreground mt-1">{transactions.length} compras na fatura</p>
                </div>
              </div>
              <CsvImportButton
                cardId={cardId}
                currentTotal={activeBill?.total ?? 0}
                onImportDone={() => fetchData(month)}
              />
            </div>

            {transactions.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground">
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 opacity-50 text-foreground" />
                  </div>
                </div>
                <p className="text-lg">Nenhuma compra encontrada nesta fatura.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
                        {tx.totalInstallments && tx.totalInstallments > 1 ? (
                          <Repeat className="w-5 h-5 text-foreground/50" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-[13px] font-medium text-emerald-400/90 uppercase tracking-wider truncate">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span 
                            className={cn(
                              "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium",
                              tx.categoryColor 
                                ? "text-white" 
                                : "text-muted-foreground bg-white/10"
                            )}
                            style={tx.categoryColor ? { backgroundColor: tx.categoryColor } : {}}
                          >
                            {tx.category ?? "Outros"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("font-mono font-medium text-[15px]", tx.amount < 0 ? "text-emerald-500" : "text-foreground")}>
                        {tx.amount < 0 ? "+" : ""}{fmt(Math.abs(tx.amount))}
                      </p>
                      {tx.totalInstallments && tx.totalInstallments > 1 ? (
                        <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">
                          Parc. {tx.installmentNumber} de {tx.totalInstallments}
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">
                          {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna Direita: Sidebar de Resumo Agrupado */}
          <div className="w-full lg:w-[360px] shrink-0 space-y-4">
            <div className="rounded-3xl bg-card border border-border p-7 shadow-sm sticky top-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Resumo de Gastos
              </h3>
              
              {groupedTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem dados para resumir.</p>
              ) : (
                <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar">
                  {groupedTransactions.map((group, index) => (
                    <div key={index} className="group/item relative py-3 border-b border-dashed border-border/60 last:border-0">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-mono text-[13px] font-medium text-emerald-400/90 uppercase tracking-wider truncate block leading-tight">
                            {group.name}
                          </span>
                          {group.category && (
                            <span 
                              className={cn(
                                "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium w-max",
                                group.categoryColor 
                                  ? "text-white" 
                                  : "text-muted-foreground bg-white/10"
                              )}
                              style={group.categoryColor ? { backgroundColor: group.categoryColor } : {}}
                            >
                              {group.category}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-medium text-[15px] text-foreground shrink-0 tabular-nums">
                          {fmt(group.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";
export default function CardDetailsPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando detalhes do cartão...</div>}>
      <CardDetailsPageContent />
    </Suspense>
  );
}
