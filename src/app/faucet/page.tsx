"use client";

import { Droplet, AlertTriangle, Coffee, Repeat, TrendingDown } from "lucide-react";
import useSWR from "swr";
import { cn } from "@/lib/utils";

const fmt = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FaucetPage() {
  const { data, error, isLoading: loading } = useSWR("/api/faucet", fetcher);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Droplet className="w-12 h-12 text-primary animate-bounce" />
        <p className="text-muted-foreground font-mono">Analisando vazamentos...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 bg-destructive/10 text-destructive rounded-xl">{error}</div>;
  }

  const renderList = (items: any[]) => {
    if (!items || items.length === 0) {
      return (
        <div className="p-8 text-center border border-white/5 rounded-2xl bg-black/20">
          <p className="text-muted-foreground font-mono text-sm uppercase">Nenhum vazamento detectado aqui.</p>
        </div>
      );
    }
    return (
      <div className="bg-[#0a0a0a] rounded-2xl p-2 border border-white/5">
        {items.map((t: any) => {
          const bankInfo = getBankInfo(t.accountName);
          return (
            <div key={t.id} className="flex items-center justify-between gap-4 py-4 px-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative shrink-0">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-xl", bankInfo.bg)}>
                    {bankInfo.initial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-[3px] border-[#0a0a0a] bg-red-500">
                    <TrendingDown className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="font-mono text-[13px] font-bold text-red-500 truncate uppercase tracking-widest">
                    {t.description}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1 truncate">
                    {t.accountName || "DESCONHECIDO"} | {t.category || "UNCATEGORIZED"} | {fmtDateFull(t.date)}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-sm tracking-widest text-red-500">
                  - {fmt(t.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Droplet className="w-8 h-8 text-primary" /> Torneira
        </h1>
        <p className="text-muted-foreground font-mono text-sm uppercase">Detector de vazamentos financeiros nos últimos 90 dias.</p>
      </div>

      {/* Hero Metric */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 blur-3xl -mr-20 -mt-20 rounded-full" />
        <div className="relative z-10">
          <p className="text-red-400 font-mono text-sm uppercase font-bold tracking-widest mb-2">Total Vazado (90 dias)</p>
          <h2 className="text-5xl font-black text-red-500 tracking-tighter">
            {fmt(data.totalLeaked)}
          </h2>
          <p className="mt-4 max-w-lg text-sm text-red-400/80 leading-relaxed">
            Esse dinheiro saiu da sua conta em pequenas taxas e gastos invisíveis. 
            Se aplicado a 115% do CDI, você estaria acelerando sua Trilha do Investidor.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-12 mt-12">
        {/* Taxas */}
        <div className="space-y-4">
          <div className="flex items-end justify-between px-2">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Taxas Ocultas
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono uppercase">Anuidades, tarifas e multas bancárias</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-mono uppercase">Total em taxas</p>
              <p className="text-lg font-mono font-bold text-orange-500">{fmt(data.fees.total)}</p>
            </div>
          </div>
          {renderList(data.fees.items)}
        </div>

        {/* Gotas */}
        <div className="space-y-4">
          <div className="flex items-end justify-between px-2">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Coffee className="w-5 h-5 text-yellow-500" />
                O Efeito "Lanchinho"
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono uppercase">Delivery, Uber e pequenos luxos</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-mono uppercase">Total em 90 dias</p>
              <p className="text-lg font-mono font-bold text-yellow-500">{fmt(data.drops.total)}</p>
            </div>
          </div>
          {renderList(data.drops.items)}
        </div>

        {/* Assinaturas */}
        <div className="space-y-4">
          <div className="flex items-end justify-between px-2">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Repeat className="w-5 h-5 text-purple-500" />
                Assinaturas Fantasmas
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-mono uppercase">Serviços recorrentes (Streaming, etc)</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-mono uppercase">Total recorrente</p>
              <p className="text-lg font-mono font-bold text-purple-500">{fmt(data.subscriptions.total)}</p>
            </div>
          </div>
          {renderList(data.subscriptions.items)}
        </div>
      </div>
      
      {/* Fechar Torneira CTA */}
      <div className="mt-16 bg-gradient-to-br from-primary/20 to-transparent border border-primary/30 rounded-3xl p-8 text-center relative overflow-hidden">
        <Droplet className="w-24 h-24 text-primary/10 absolute -top-4 -right-4 rotate-12" />
        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Hora de Fechar a Torneira!</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto relative z-10">
          Você tem {fmt(data.totalLeaked)} pingando pelo ralo. Que tal assumir o controle, cancelar algumas assinaturas ou reduzir o delivery neste mês?
        </p>
        <button className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform relative z-10">
          Aceitar Desafio de Redução
        </button>
      </div>

    </div>
  );
}
