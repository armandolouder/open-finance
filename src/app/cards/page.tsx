"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, ChevronDown, ChevronUp, Repeat, AlertCircle,
  ChevronLeft, ChevronRight, Pencil, X, Check, LayoutGrid, MoreVertical, Link2, Calendar
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn, getBankLogo, getBankBranding, getBankLogoUrl, monthKey, monthLabel } from "@/lib/utils";

const fmt = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dateStr = d.includes('T') ? d : `${d}T12:00:00`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function monthShort(key: string) {
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

interface CardBill {
  month: string;
  label: string;
  total: number;
  transactions: {
    id: string;
    description: string;
    amount: number;
    date: string;
    purchaseDate: string;
    category?: string;
    cardNumber?: string;
    totalInstallments?: number;
    installmentNumber?: number;
    type: string;
  }[];
}

interface CardData {
  id: string;
  name: string;
  brand?: string;
  institutionName?: string;
  institutionLogo?: string | null;
  level?: string;
  dueDate?: string;
  closingDate?: string;
  balance?: number;
  creditLimit?: number;
  availableLimit?: number;
  minimumPayment?: number;
  waiverTarget?: number;
  feeAmount?: number;
  creditData?: {
    creditLimit: number;
    balance: number;
    availableCreditLimit: number;
  };
  bills: CardBill[];
}

function CardsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const month = searchParams.get("month") || monthKey(new Date());
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings Modal State
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [dueDayInput, setDueDayInput] = useState("");
  const [closingDayInput, setClosingDayInput] = useState("");
  const [waiverTargetInput, setWaiverTargetInput] = useState("");
  const [feeAmountInput, setFeeAmountInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const fetchData = useCallback((m: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/cards?month=${m}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setCards(d.cards);
        if (d.cards.length > 0 && !selectedCard) {
          setSelectedCard(d.cards[0].id);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCard]);

  useEffect(() => { fetchData(month); }, [month, fetchData]);

  const isCurrentMonth = month === monthKey(new Date());

  const activeCard = cards.find((c) => c.id === selectedCard);
  // Como agora filtramos na API para retornar apenas 1 fatura (do mês selecionado), pegamos a primeira:
  const activeBill = activeCard?.bills?.[0];

  const totalLimit = cards.reduce((acc, c) => acc + (c.creditLimit ?? c.creditData?.creditLimit ?? 0), 0);
  const availableLimit = cards.reduce((acc, c) => acc + (c.availableLimit ?? c.creditData?.availableCreditLimit ?? 0), 0);
  const usedLimit = totalLimit > 0 ? (totalLimit - availableLimit) : 0;
  const openFinanceCount = cards.filter(c => !!c.institutionName).length;
  const manualCount = cards.length - openFinanceCount;

  return (
    <div className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-white tracking-tight leading-tight">Meus cartões</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Gerencie seus cartões de crédito, limites e faturas</p>
        </div>
        <button className="px-4 py-2 bg-white text-black font-semibold rounded-full text-[13px] hover:bg-white/90 transition-colors shrink-0">
          + Novo cartão
        </button>
      </div>

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#121212] rounded-[16px] border border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#1e293b] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-[#38bdf8]" />
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground font-medium">Limite total</p>
                <p className="text-[16px] font-bold text-white">{fmt(totalLimit)}</p>
              </div>
            </div>
            <div className="bg-[#121212] rounded-[16px] border border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Link2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground font-medium">Disponível</p>
                <p className="text-[16px] font-bold text-white">{fmt(availableLimit)}</p>
              </div>
            </div>
            <div className="bg-[#121212] rounded-[16px] border border-white/5 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Pencil className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground font-medium">Em uso</p>
                <p className="text-[16px] font-bold text-red-500">{fmt(usedLimit)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button className="px-3 py-1.5 rounded-full bg-white text-black text-[12px] font-medium flex items-center gap-2 shrink-0">
              <LayoutGrid className="w-3.5 h-3.5" /> Todos <span className="bg-black/10 px-1.5 rounded text-[10px]">{cards.length}</span>
            </button>
            <button className="px-3 py-1.5 rounded-full bg-white/5 text-muted-foreground text-[12px] font-medium flex items-center gap-2 hover:bg-white/10 transition-colors border border-white/5 shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Open Finance <span className="bg-white/10 px-1.5 rounded text-[10px]">{openFinanceCount}</span>
            </button>
            <button className="px-3 py-1.5 rounded-full bg-white/5 text-muted-foreground text-[12px] font-medium flex items-center gap-2 hover:bg-white/10 transition-colors border border-white/5 shrink-0">
              <Pencil className="w-3.5 h-3.5" /> Manuais <span className="bg-white/10 px-1.5 rounded text-[10px]">{manualCount}</span>
            </button>
          </div>
        </>
      )}

      {loading && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 mt-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-56 rounded-[16px] bg-[#121212] border border-white/5 animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-6 text-destructive">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
          {cards.map((card) => {
            const brand = getBankBranding(card.name, card.institutionName);
            const logoUrl = getBankLogoUrl(card.name, card.institutionName, card.institutionLogo);
            
            const day = card.dueDate ? card.dueDate.split('-')[2] : '01';
            const [y, m] = month.split('-');
            let closingDateDisplay = '';
            if (card.closingDate) {
              const cDay = card.closingDate.split('-')[2];
              closingDateDisplay = `${cDay} de ${monthLabel(month).split(' de')[0]}`;
            } else {
              const d = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
              d.setDate(d.getDate() - 9);
              closingDateDisplay = d.toLocaleDateString("pt-BR", { day: 'numeric', month: 'long' });
            }

            return (
              <button
                key={card.id}
                onClick={() => router.push(`/cards/${card.id}?month=${month}`)}
                className="bg-[#121212] rounded-[16px] border border-white/5 p-5 text-left hover:border-white/20 transition-colors w-full block group"
              >
                {/* Header do Cartão */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-white/5", brand.bg)}>
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                      ) : (
                        <div className={cn("font-bold text-sm", brand.text)}>{brand.icon}</div>
                      )}
                    </div>
                    <div className="min-w-0">
        </>
      )}

      {/* Settings Modal */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border shadow-lg rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Configurar {editingCard.name}</h3>
              <button
                onClick={() => setEditingCard(null)}
                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Dia de Fechamento (1-31)</label>
                <input
                  type="number"
                  min="1" max="31"
                  value={closingDayInput}
                  onChange={e => setClosingDayInput(e.target.value)}
                  placeholder="Ex: 18"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Dia de Vencimento (1-31)</label>
                <input
                  type="number"
                  min="1" max="31"
                  value={dueDayInput}
                  onChange={e => setDueDayInput(e.target.value)}
                  placeholder="Ex: 25"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Meta de Isenção de Anuidade (R$)</label>
                <input
                  type="number"
                  min="0" step="0.01"
                  value={waiverTargetInput}
                  onChange={e => setWaiverTargetInput(e.target.value)}
                  placeholder="Ex: 5000.00"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Valor da Anuidade (R$)</label>
                <input
                  type="number"
                  min="0" step="0.01"
                  value={feeAmountInput}
                  onChange={e => setFeeAmountInput(e.target.value)}
                  placeholder="Ex: 49.90"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await fetch('/api/card-settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        cardId: editingCard.id,
                        dueDay: dueDayInput ? parseInt(dueDayInput) : null,
                        closingDay: closingDayInput ? parseInt(closingDayInput) : null,
                        waiverTarget: waiverTargetInput ? parseFloat(waiverTargetInput) : null,
                        feeAmount: feeAmountInput ? parseFloat(feeAmountInput) : null,
                      })
                    });
                    setEditingCard(null);
                    fetchData(month);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? "Salvando..." : "Salvar Datas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";
export default function CardsPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando cartões...</div>}>
      <CardsPageContent />
    </Suspense>
  );
}
