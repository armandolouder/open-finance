"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, ChevronLeft, ChevronRight, Pencil, X, AlertCircle, Repeat, MoreVertical, RefreshCw, Calendar
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn, getBankBranding, getBankLogoUrl, monthLabel } from "@/lib/utils";

const fmt = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  const dateStr = d.includes('T') ? d : `${d}T12:00:00`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
function monthShort(key: string) {
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}
function prevMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 2, 1));
}
function nextMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m, 1));
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
  waiverTarget?: number | null;
  feeAmount?: number | null;
  creditData?: {
    creditLimit: number;
    balance: number;
    availableCreditLimit: number;
  };
  bills: CardBill[];
}

export function CreditCardsSection({ hideTransactions }: { hideTransactions?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const activeCard = cards.find((c) => c.id === selectedCard);
  const activeBill = activeCard?.bills?.[0];

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Cartões de Crédito</h3>
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
          {/* Grid responsivo de cartões */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
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
                        <h3 className="text-[13px] font-bold text-white uppercase tracking-wide leading-tight truncate">{card.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {card.institutionName ? (
                            <>
                              <RefreshCw className="w-3 h-3 text-[#38bdf8]" />
                              <span className="text-[11px] text-[#38bdf8] font-medium">Open Finance</span>
                            </>
                          ) : (
                            <>
                              <Pencil className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground font-medium">Manual</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Resumo da Fatura */}
                  <div className="flex items-center justify-between py-4 border-b border-white/5">
                    <span className="text-[13px] text-muted-foreground">Fatura de {monthLabel(month).split(' de')[0]}</span>
                    <span className="text-[15px] font-bold text-white">{fmt(card.bills[0]?.total ?? 0)}</span>
                  </div>

                  {/* Aviso */}
                  <div className="py-3 border-b border-white/5 flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 text-muted-foreground opacity-50 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-snug">Fatura ainda não fechada — os valores podem estar incompletos.</p>
                  </div>

                  {/* Limite e Status */}
                  <div className="pt-4 pb-1 space-y-3">
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <CreditCard className="w-4 h-4 opacity-50" />
                      <span>Limite disponível <span className="text-white font-semibold ml-1">{card.availableLimit ? fmt(card.availableLimit) : 'UNLIMITED'}</span></span>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-50" />
                        <span>Fecha em {closingDateDisplay}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                        <span className="text-[#38bdf8] font-medium">Em aberto</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
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
                <label className="text-sm font-medium text-muted-foreground">Meta de Isenção Mensal (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={waiverTargetInput}
                  onChange={e => setWaiverTargetInput(e.target.value)}
                  placeholder="Ex: 8000"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Deixe vazio se não possuir meta de isenção.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Valor da Anuidade (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={feeAmountInput}
                  onChange={e => setFeeAmountInput(e.target.value)}
                  placeholder="Ex: 49.90"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Usado para detectar cobranças ou calcular economia.</p>
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
