"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard, ChevronDown, ChevronUp, Repeat, AlertCircle,
  ChevronLeft, ChevronRight, Pencil, X, Check
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn, getBankLogo, monthKey, monthLabel } from "@/lib/utils";

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
  creditData?: {
    creditLimit: number;
    balance: number;
    availableCreditLimit: number;
  };
  bills: CardBill[];
}

function CardsPageContent() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") || monthKey(new Date());
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings Modal State
  const [editingCard, setEditingCard] = useState<CardData | null>(null);
  const [dueDayInput, setDueDayInput] = useState("");
  const [closingDayInput, setClosingDayInput] = useState("");
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
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card.id)}
                className={cn(
                  "relative overflow-hidden rounded-2xl p-5 text-left transition-all border shadow-sm",
                  selectedCard === card.id
                    ? "border-primary/50 bg-primary/5 shadow-primary/10 shadow-md"
                    : "border-border bg-card hover:border-border/80 hover:shadow-md"
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {card.institutionLogo ? (
                        <img src={getBankLogo(card.name, card.institutionLogo)} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 group/title">
                      <div>
                        <p className="font-semibold text-foreground capitalize leading-snug">{card.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{card.brand ?? card.institutionName}</p>
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
                        }}
                        className="p-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-md transition-opacity cursor-pointer"
                        title="Configurar datas do cartão"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                  {card.level && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                      {card.level}
                    </span>
                  )}
                </div>

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

                {card.dueDate && (() => {
                  const day = card.dueDate.split('-')[2];
                  const [y, m] = month.split('-');
                  // Data de vencimento projetada para o mês selecionado
                  const projectedDueDate = `${y}-${m}-${day}`;
                  
                  // Se a API não fornecer fechamento, estimamos como 8 dias antes do vencimento
                  let closingDateDisplay = '';
                  if (card.closingDate) {
                    const cDay = card.closingDate.split('-')[2];
                    closingDateDisplay = `${cDay}/${m}/${y}`;
                  } else {
                    // Cálculo de fallback (9 dias antes) caso o banco/API não envie
                    const d = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
                    d.setDate(d.getDate() - 9);
                    closingDateDisplay = d.toLocaleDateString("pt-BR");
                  }

                  return (
                    <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-muted-foreground">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <div>Fechamento: <span className="text-foreground font-medium">{closingDateDisplay}</span></div>
                      <span className="text-border">|</span>
                      <div>Vencimento: <span className="text-foreground font-medium">{fmtDate(projectedDueDate)}</span></div>
                      <span className="text-border">|</span>
                      <div>Mínimo: <span className="text-foreground font-medium">{fmt(card.minimumPayment)}</span></div>
                    </div>
                  );
                })()}
              </button>
            ))}
          </div>

          {/* Fatura do cartão selecionado */}
          {activeCard && (
            <div className="space-y-3 mt-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center justify-between">
                <span>Fatura de {monthLabel(month)} — {activeCard.name}</span>
                {activeBill && (
                  <span className="bg-muted px-2 py-1 rounded-md text-xs">
                    {activeBill.transactions.length} lançamentos
                  </span>
                )}
              </h2>

              {!activeBill || activeBill.transactions.length === 0 ? (
                <div className="rounded-2xl bg-card border border-border p-12 text-center text-muted-foreground">
                  Nenhuma compra nesta fatura.
                </div>
              ) : (
                <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
                  <div className="divide-y divide-border">
                    {activeBill.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                            {tx.totalInstallments && tx.totalInstallments > 1 ? (
                              <Repeat className="w-4 h-4 text-destructive" />
                            ) : (
                              <CreditCard className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm truncate leading-snug">{tx.description}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {tx.category ?? "Sem categoria"}
                              {tx.cardNumber ? ` · Final ${tx.cardNumber}` : ""}
                              {tx.totalInstallments && tx.totalInstallments > 1
                                ? ` · Parcela ${tx.installmentNumber}/${tx.totalInstallments}`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-sm text-foreground">
                            {fmt(Math.abs(tx.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(tx.purchaseDate ?? tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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
