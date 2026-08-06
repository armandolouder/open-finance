"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  CreditCard, ChevronLeft, ChevronRight, AlertCircle, Repeat, ArrowLeft, Calendar, Filter, Check
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
      isManual?: boolean;
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
  const allTransactions = activeBill?.transactions || [];

  const payments = allTransactions.filter(tx => 
    tx.category === "Credit card payment" || 
    tx.description.toLowerCase().includes("pagamento recebido") ||
    tx.description.toLowerCase().includes("pagamento de fatura")
  );
  
  const transactions = allTransactions.filter(tx => 
    !(tx.category === "Credit card payment" || 
      tx.description.toLowerCase().includes("pagamento recebido") ||
      tx.description.toLowerCase().includes("pagamento de fatura"))
  );

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

  if (loading) {
    return (
      <div className="w-full max-w-[1200px] pb-20 flex flex-col lg:flex-row gap-6">
        {/* Esquerda Skeleton */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-6">
          <div className="bg-[#121212] rounded-[16px] p-6 border border-white/5 shadow-2xl animate-pulse">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-full bg-white/5"></div>
               <div className="space-y-2">
                 <div className="h-4 w-32 bg-white/5 rounded"></div>
                 <div className="h-3 w-24 bg-white/5 rounded"></div>
               </div>
             </div>
             <div className="mb-6 space-y-3">
               <div className="flex justify-between">
                 <div className="h-3 w-20 bg-white/5 rounded"></div>
                 <div className="h-5 w-20 bg-white/5 rounded-full"></div>
               </div>
               <div className="h-8 w-40 bg-white/5 rounded"></div>
             </div>
             <div className="grid grid-cols-3 gap-2 py-5 border-y border-white/5 mb-5">
               <div className="h-10 w-full bg-white/5 rounded"></div>
               <div className="h-10 w-full bg-white/5 rounded"></div>
               <div className="h-10 w-full bg-white/5 rounded"></div>
             </div>
             <div className="space-y-4">
               <div className="h-4 w-3/4 bg-white/5 rounded"></div>
               <div className="h-4 w-2/3 bg-white/5 rounded"></div>
               <div className="h-4 w-5/6 bg-white/5 rounded"></div>
             </div>
          </div>
        </div>

        {/* Direita Skeleton */}
        <div className="flex-1 min-w-0 pt-2 space-y-6">
           <div className="h-10 w-48 bg-[#121212] rounded-full border border-white/5 animate-pulse"></div>
           <div className="h-14 w-64 bg-[#121212] rounded-lg border border-white/5 animate-pulse"></div>
           <div className="bg-[#121212] rounded-[16px] border border-white/5 overflow-hidden shadow-2xl animate-pulse">
             <div className="h-12 border-b border-white/5 bg-white/5"></div>
             {[1, 2, 3, 4, 5, 6].map(i => (
               <div key={i} className="h-[72px] border-b border-white/5 px-6 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/5 shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 bg-white/5 rounded"></div>
                    <div className="h-3 w-24 bg-white/5 rounded"></div>
                  </div>
                  <div className="h-4 w-24 bg-white/5 rounded"></div>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  }



  return (
    <div className="w-full pb-20 flex flex-col gap-6">
      <div className="flex items-center">
        <button 
          onClick={() => router.push('/cards')} 
          className="flex items-center gap-2 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/50 -ml-3"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Cartões
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Esquerda: Informações do Cartão */}
      <div className="w-full lg:w-[340px] shrink-0 space-y-6">
        <div className="bg-[#121212] rounded-[16px] p-6 border border-white/5 shadow-2xl">
           
           {/* Top header do cartão */}
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                 {card?.institutionLogo ? (
                   <img src={getBankLogoUrl(card.name, card.institutionName, card.institutionLogo) || undefined} alt="" className="w-7 h-7 object-contain" />
                 ) : (
                   <CreditCard className="w-6 h-6 text-primary" />
                 )}
               </div>
               <div>
                 <h2 className="text-white font-bold text-[16px] leading-tight capitalize">{card?.name || "Carregando..."}</h2>
                 <p className="text-muted-foreground text-[13px] mt-0.5">Detalhes do cartão</p>
               </div>
             </div>
           </div>

           {/* Fatura Atual */}
           <div className="mb-6">
             <div className="flex items-center justify-between mb-3">
               <p className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">Fatura Atual</p>
               <span className="text-[12px] font-medium bg-[#1e293b] text-[#38bdf8] px-3 py-1 rounded-full flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></span>
                 Em aberto
               </span>
             </div>
             <p className="text-[32px] font-black text-white tracking-tight leading-none">{fmt(activeBill?.total)}</p>
           </div>

           {/* Breakdown (Fatura / Pago / Restante) */}
           <div className="grid grid-cols-3 gap-2 py-5 border-y border-white/5 mb-5">
             <div>
               <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Fatura</p>
               <p className="text-[13px] font-semibold text-white mt-1.5">{fmt(activeBill?.total)}</p>
             </div>
             <div>
               <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Pago</p>
               <p className="text-[13px] font-semibold text-white mt-1.5">R$ 0,00</p>
             </div>
             <div>
               <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Restante</p>
               <p className="text-[13px] font-semibold text-white mt-1.5">{fmt(activeBill?.total)}</p>
             </div>
           </div>

           {/* Datas e Limite */}
           <div className="space-y-3.5 text-[13px] font-medium text-muted-foreground">
             <div className="flex items-center gap-3">
               <Calendar className="w-4 h-4 opacity-50" />
               <span>Fecha em {card?.closingDate ? new Date(card.closingDate + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : 'N/A'}</span>
             </div>
             <div className="flex items-center gap-3">
               <Calendar className="w-4 h-4 opacity-50" />
               <span>Vence em {card?.dueDate ? new Date(card.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}) : 'N/A'}</span>
             </div>
             <div className="flex items-center gap-3">
               <CreditCard className="w-4 h-4 opacity-50" />
               <span>Limite disponível: <span className="text-white font-semibold">{card?.availableLimit ? 'R$ ' + card.availableLimit.toLocaleString('pt-BR', {minimumFractionDigits:2}) : 'UNLIMITED'}</span></span>
             </div>
           </div>

           <div className="mt-6 pt-5 border-t border-white/5">
             <p className="text-[12px] leading-relaxed text-muted-foreground flex gap-2.5 items-start">
               <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 opacity-50" />
               Fatura ainda não fechada pelo banco — os valores são parciais e podem mudar.
             </p>
           </div>
         </div>

         {/* Resumo por Lançamento */}
         <div className="bg-[#121212] rounded-[16px] p-6 border border-white/5 shadow-2xl">
           <h3 className="text-[13px] font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             Resumo por Lançamento
           </h3>
           
           {groupedTransactions.length === 0 ? (
             <p className="text-[13px] text-muted-foreground text-center py-4">Nenhum gasto para resumir.</p>
           ) : (
             <div className="space-y-4">
               {groupedTransactions.map((group, index) => (
                 <div key={index} className="flex justify-between items-start gap-3">
                   <div className="flex flex-col gap-1 min-w-0">
                     <span className="font-semibold text-[13px] text-white truncate leading-tight">
                       {group.name}
                     </span>
                     {group.category && (
                       <span 
                         className={cn(
                           "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium w-max",
                           group.categoryColor 
                             ? "text-white" 
                             : "text-muted-foreground bg-white/5"
                         )}
                         style={group.categoryColor ? { backgroundColor: group.categoryColor } : {}}
                       >
                         {group.category}
                       </span>
                     )}
                   </div>
                   <span className="font-bold text-[14px] text-white shrink-0">
                     {fmt(group.amount)}
                   </span>
                 </div>
               ))}
             </div>
           )}
         </div>
      </div>

      {/* Direita: Lançamentos */}
      <div className="flex-1 min-w-0 pt-2">
        
        {/* Lançamentos Title & CSV */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-bold text-white tracking-tight">Lançamentos da fatura</h1>
            <p className="text-[14px] text-muted-foreground mt-1">Despesas e parcelas vinculadas a este período</p>
            {transactions.filter(t => t.isManual).length > 0 && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[12px] font-medium">
                <span className="text-emerald-500">✓</span> {transactions.filter(t => t.isManual).length} lançamentos recuperados via CSV
                <span className="opacity-60 ml-1">
                  (R$ {transactions.filter(t => t.isManual).reduce((s, t) => s + Math.abs(t.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-3">
             {payments.length > 0 && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 pl-3 pr-4 py-2 rounded-xl text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                   <div className="bg-emerald-500/20 p-1.5 rounded-full">
                      <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
                   </div>
                   <div className="text-right">
                     <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-500">Fatura Paga</p>
                     <p className="text-[14px] font-bold leading-none mt-0.5 text-emerald-400">
                       {fmt(payments.reduce((acc, p) => acc + Math.abs(p.amount), 0))}
                     </p>
                   </div>
                </div>
             )}
             <div className="flex items-center gap-4">
                <span className="text-[13px] text-muted-foreground font-medium">{transactions.length} transações</span>
                <CsvImportButton cardId={cardId} month={month} currentTotal={activeBill?.total ?? 0} onImportDone={() => fetchData(month)} />
             </div>
          </div>
        </div>

        {/* Tabela de Lançamentos */}
        <div className="bg-[#121212] rounded-[16px] border border-white/5 overflow-hidden shadow-2xl">
           {/* Table Header */}
           <div className="hidden sm:grid grid-cols-[100px_1fr_200px_120px] gap-4 px-6 py-4 border-b border-white/5 text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
             <div>Data</div>
             <div>Descrição</div>
             <div>Categoria</div>
             <div className="text-right">Valor</div>
           </div>

           {/* Table Body */}
           <div className="divide-y divide-white/5">
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
               transactions.map(tx => (
                 <div key={tx.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[100px_1fr_200px_120px] gap-4 px-4 sm:px-6 py-4 items-center hover:bg-white/[0.02] transition-colors group">
                    
                    {/* Data */}
                    <div className="text-[13px] font-medium text-white/70 leading-tight hidden sm:block">
                       {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}<br/>
                       <span className="text-[11px] text-muted-foreground/60">{new Date(tx.date).getFullYear()}</span>
                    </div>

                    {/* Descrição */}
                    <div className="flex items-center gap-4 min-w-0">
                       <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-105 transition-transform">
                         {tx.isManual ? (
                           <span className="text-emerald-400 font-bold text-[10px]">CSV</span>
                         ) : tx.totalInstallments && tx.totalInstallments > 1 ? (
                           <Repeat className="w-4 h-4 text-emerald-400" />
                         ) : (
                           <CreditCard className="w-4 h-4 text-emerald-400" />
                         )}
                       </div>
                       <div className="min-w-0">
                         <p className="font-semibold text-[14px] text-white/90 truncate">{tx.description}</p>
                         <div className="sm:hidden text-[12px] text-muted-foreground mt-0.5">
                           {new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                         </div>
                         {tx.totalInstallments && tx.totalInstallments > 1 && (
                            <p className="text-[12px] text-muted-foreground mt-0.5">Parcela {tx.installmentNumber}/{tx.totalInstallments}</p>
                         )}
                       </div>
                    </div>

                    {/* Categoria */}
                    <div className="hidden sm:block">
                       <p className="font-semibold text-[14px] text-white/90">{tx.category || "Outros"}</p>
                       <div className="mt-1">
                          <span className={cn(
                            "text-[10px] font-semibold px-1.5 py-0.5 rounded tracking-wide uppercase",
                            tx.isManual ? "text-emerald-400 bg-emerald-400/10" : "text-muted-foreground bg-white/5"
                          )}>
                            Origem: {tx.isManual ? "CSV" : "Pluggy"}
                          </span>
                       </div>
                    </div>

                    {/* Valor */}
                    <div className="text-right">
                       <p className={cn("font-medium text-[15px]", tx.amount < 0 ? "text-[#f87171]" : "text-[#4ade80]")}>
                         {tx.amount < 0 ? "-" : "+"} {fmt(Math.abs(tx.amount))}
                       </p>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
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
