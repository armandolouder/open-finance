"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, ChevronDown, ChevronUp, Repeat, AlertCircle,
  ChevronLeft, ChevronRight, Pencil, X, Check
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">Cartões de Crédito</h1>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-6 text-destructive">{error}</div>
      )}

      {!loading && !error && (
        <>
          {/* Seletor de cartões */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => {
              const brand = getBankBranding(card.name, card.institutionName);
              const logoUrl = getBankLogoUrl(card.name, card.institutionName, card.institutionLogo);
              
              return (
              <button
                key={card.id}
                onClick={() => router.push(`/cards/${card.id}?month=${month}`)}
                style={{
                  background: selectedCard === card.id
                    ? (brand.cardBgSelected ?? brand.cardBg ?? undefined)
                    : (brand.cardBg ?? undefined),
                }}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 border shadow-sm w-full",
                  brand.border,
                  selectedCard === card.id
                    ? "shadow-lg ring-1 ring-white/10"
                    : "hover:border-white/20 hover:shadow-md"
                )}
              >
                {/* Orbe de brilho sutil */}
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${brand.accent ?? 'transparent'} 0%, transparent 70%)` }}
                />
                {/* Header: logo + nome + nível */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-6 h-6 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                      ) : (
                        <div className={cn("font-bold text-sm", brand.text)}>{brand.icon}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate leading-tight">{card.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{card.brand ?? card.institutionName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {card.level && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/5">
                        {card.level}
                      </span>
                    )}
                    <div
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCard(card);
                        const dDay = card.dueDate ? parseInt(card.dueDate.split('-')[2]) : '';
                        const cDay = card.closingDate ? parseInt(card.closingDate.split('-')[2]) : '';
                        setDueDayInput(dDay.toString());
                        setClosingDayInput(cDay.toString());
                        setWaiverTargetInput(card.waiverTarget ? card.waiverTarget.toString() : "");
                        setFeeAmountInput(card.feeAmount ? card.feeAmount.toString() : "");
                      }}
                      className="p-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-md transition-opacity cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Fatura ({monthShort(month)})</p>
                    <p className="text-xl font-bold text-amber-500">{fmt(card.bills[0]?.total ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Limite disponível</p>
                    <p className="text-xl font-bold text-emerald-500">{fmt(card.availableLimit)}</p>
                  </div>
                </div>

                {card.waiverTarget ? (() => {
                  const currentTotal = card.bills[0]?.total ?? 0;
                  const isExempt = currentTotal >= card.waiverTarget;
                  const feeCharged = card.feeAmount ? card.bills[0]?.transactions.some(t => Math.abs(t.amount) === card.feeAmount) : false;

                  return (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meta de Isenção</p>
                        <p className="text-[10px] font-medium text-foreground">{fmt(currentTotal)} / {fmt(card.waiverTarget)}</p>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", isExempt ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-amber-300")} 
                          style={{ width: `${Math.min(100, (currentTotal / card.waiverTarget) * 100)}%` }}
                        />
                      </div>
                      
                      {/* Inteligência de Anuidade */}
                      {card.feeAmount && (
                        <div className="pt-1">
                          {feeCharged ? (
                            <p className="text-[10px] text-destructive flex items-center gap-1 font-medium bg-destructive/10 px-2 py-1 rounded w-max">
                              <AlertCircle className="w-3 h-3" /> Anuidade de {fmt(card.feeAmount)} cobrada nesta fatura.
                            </p>
                          ) : isExempt ? (
                            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-400/10 px-2 py-1 rounded w-max">
                              <AlertCircle className="w-3 h-3" /> Meta batida! Economia de {fmt(card.feeAmount)}.
                            </p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                              Anuidade padrão: {fmt(card.feeAmount)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })() : null}

                {/* Datas */}
                {card.dueDate && (() => {
                  const day = card.dueDate.split('-')[2];
                  const [y, m] = month.split('-');
                  const projectedDueDate = `${y}-${m}-${day}`;
                  
                  let closingDateDisplay = '';
                  if (card.closingDate) {
                    const cDay = card.closingDate.split('-')[2];
                    closingDateDisplay = `${cDay}/${m}/${y}`;
                  } else {
                    const d = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
                    d.setDate(d.getDate() - 9);
                    closingDateDisplay = d.toLocaleDateString("pt-BR");
                  }

                  return (
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground">
                      <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Fecha: {closingDateDisplay}</span>
                      <span className="opacity-40">|</span>
                      <span>Vence: {fmtDate(projectedDueDate)}</span>
                      <span className="opacity-40">|</span>
                      <span>Mín: {fmt(card.minimumPayment)}</span>
                    </div>
                  );
                })()}
              </button>
            )})}
          </div>

          {cards.length === 0 && (
            <div className="rounded-2xl bg-card border border-border p-12 text-center text-muted-foreground">
              Nenhum cartão de crédito encontrado.
            </div>
          )}
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
