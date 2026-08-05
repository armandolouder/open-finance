"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Building2 } from "lucide-react";
import { getBankBranding, getBankLogoUrl } from "@/lib/utils";

const fmt = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtPct = (v: number) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;

interface Investment {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  value?: number;
  balance?: number;
  quantity?: number;
  amount?: number;
  annualRate?: number;
  gains?: number;
  institutionName: string;
  institutionLogo?: string | null;
  date?: string;
  lastMonthRate?: number;
  twelveMonthsRate?: number;
}

const TYPE_LABEL: Record<string, string> = {
  MUTUAL_FUND: "Fundo de Investimento",
  SECURITY: "Renda Variável",
  FIXED_INCOME: "Renda Fixa",
  EQUITY: "Ações",
  ETF: "ETF",
  FUND: "Fundo",
  MANUAL: "Saldos Manuais",
  OTHER: "Outros",
};

function getBankLabel(inv: Investment): string {
  const n = (inv.institutionName || '').toLowerCase();
  const name = (inv.name || '').toLowerCase();
  
  if (name.includes('mercado pago') || name.includes('mercadopago')) return 'Mercado Pago';
  if (name.includes('nubank') || name.includes('nu financeira')) return 'Nubank';
  if (name.includes('inter')) return 'Banco Inter';
  if (name.includes('itau') || name.includes('itaú')) return 'Itaú';
  if (name.includes('bradesco')) return 'Bradesco';
  if (name.includes('santander')) return 'Santander';

  if (n.includes('nubank') || n.includes('meupluggy') || n.includes('nu financeira')) return 'Nubank';
  if (n.includes('mercado pago') || n.includes('mercadopago')) return 'Mercado Pago';
  if (n.includes('inter')) return 'Banco Inter';
  if (n.includes('itau') || n.includes('itaú')) return 'Itaú';
  if (n.includes('bradesco')) return 'Bradesco';
  if (n.includes('santander')) return 'Santander';
  return inv.institutionName || 'Desconhecido';
}

function getLogoForInvestment(inv: Investment): string | null {
  const label = getBankLabel(inv);
  const logoUrl = getBankLogoUrl(label);
  if (logoUrl) return logoUrl;
  return inv.institutionLogo || null;
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState({ totalValue: 0, totalGain: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/investments")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setInvestments(d.investments);
        setSummary(d.summary);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Group by bank first, then by type
  const byBank: Record<string, { label: string; items: Investment[] }> = {};
  for (const inv of investments) {
    const bankLabel = getBankLabel(inv);
    if (!byBank[bankLabel]) byBank[bankLabel] = { label: bankLabel, items: [] };
    byBank[bankLabel].items.push(inv);
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">Investimentos</h1>
        <p className="text-muted-foreground">Carteira de investimentos consolidada por banco.</p>
      </div>

      {/* Card de total */}
      {!loading && !error && investments.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-6 flex items-center justify-between gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total investido</p>
            <p className="text-3xl font-bold text-foreground">{fmt(summary.totalValue)}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Posições</p>
            <p className="text-3xl font-bold text-foreground">{investments.length}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Bancos</p>
            <p className="text-3xl font-bold text-foreground">{Object.keys(byBank).length}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-6 text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && Object.entries(byBank).map(([bankKey, { label, items }]) => {
        const sampleInv = items[0];
        const logoUrl = getLogoForInvestment(sampleInv);
        const branding = getBankBranding(label);
        const bankTotal = items.reduce((s, i) => s + (i.value ?? i.balance ?? i.amount ?? 0), 0);

        // Group by type within bank
        const byType: Record<string, Investment[]> = {};
        for (const inv of items) {
          const t = inv.type ?? "OTHER";
          if (!byType[t]) byType[t] = [];
          byType[t].push(inv);
        }

        return (
          <section key={bankKey} className="space-y-3">
            {/* Bank header */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={label}
                    className="w-6 h-6 object-contain"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <h2 className={`text-sm font-bold uppercase tracking-widest ${branding.text}`}>{label}</h2>
              <span className="text-xs text-muted-foreground ml-auto font-semibold">{fmt(bankTotal)}</span>
            </div>

            {Object.entries(byType).sort(([typeA], [typeB]) => {
              if (typeA === 'MANUAL') return -1;
              if (typeB === 'MANUAL') return 1;
              return typeA.localeCompare(typeB);
            }).map(([type, list]) => (
              <div key={type} className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
                <div className="px-5 py-2 border-b border-border bg-muted/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {TYPE_LABEL[type] ?? type}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {list.map((inv) => {
                    const value = inv.value ?? inv.balance ?? inv.amount ?? 0;
                    const rate = inv.lastMonthRate ?? inv.annualRate;
                    const isPositive = !rate || rate >= 0;

                    // Try to generate a friendlier name
                    const friendlyName = inv.name
                      ?.replace('NU FINANCEIRA S.A. - SOCIEDADE DE CREDITO, FINANCIAMENTO E INVESTIMENTO', 'CDB Nubank')
                      ?.replace('MERCADO PAGO', 'Mercado Pago')
                      ?? inv.name;

                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${isPositive ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                            {inv.type === 'MANUAL' && getLogoForInvestment(inv) ? (
                              <img 
                                src={getLogoForInvestment(inv)!} 
                                alt="" 
                                className={cn("w-5 h-5 object-contain", getLogoForInvestment(inv)!.includes('206.svg') || getLogoForInvestment(inv)!.includes('mercadopago') ? "" : "brightness-0 invert")}
                                onError={(e) => e.currentTarget.style.display = 'none'} 
                              />
                            ) : (
                              isPositive
                                ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                                : <TrendingDown className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{friendlyName}</p>
                            {inv.type !== 'MANUAL' && (
                              <p className="text-xs text-muted-foreground">{label}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{fmt(value)}</p>
                          {rate !== undefined && rate !== null && (
                            <p className={`text-xs ${isPositive ? "text-emerald-500" : "text-destructive"}`}>
                              {fmtPct(rate)} a.a.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      {!loading && !error && investments.length === 0 && (
        <div className="rounded-2xl bg-muted/50 border border-border p-12 text-center text-muted-foreground">
          Nenhum investimento encontrado. Verifique suas conexões.
        </div>
      )}
    </div>
  );
}
