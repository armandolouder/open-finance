"use client";

import { useEffect, useState } from "react";
import { Sparkles, Trophy, ShieldAlert, Target, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Investment {
  id: string;
  name: string;
  type: string;
  value?: number;
  balance?: number;
  amount?: number;
  institutionName: string;
}

export default function InsightsPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/investments")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setInvestments(d.investments || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Analysis Logic
  const totalValue = investments.reduce((acc, inv) => acc + (inv.value || inv.balance || inv.amount || 0), 0);
  
  const institutions = new Set(investments.map(i => i.institutionName?.toLowerCase().trim()));
  const hasMultipleBanks = institutions.size > 1;

  const hasFixedIncome = investments.some(i => 
    i.type === "FIXED_INCOME" || 
    i.type === "MANUAL" || 
    i.name?.toLowerCase().includes("mercado pago") ||
    i.name?.toLowerCase().includes("cdb")
  );

  const hasVariableIncome = investments.some(i => 
    i.type === "EQUITY" || 
    i.type === "ETF" || 
    i.type === "SECURITY" ||
    i.name?.toLowerCase().includes("fii") ||
    i.name?.toLowerCase().includes("fundo imobili")
  );

  // Calculate Score (0-100)
  let score = 0;
  if (totalValue > 0) score += 20; // Base score for having any investment
  if (hasFixedIncome) score += 30; // Has emergency/fixed
  if (hasVariableIncome) score += 30; // Has variable
  if (hasMultipleBanks) score += 20; // Has institutional diversification

  // Determine Level Name
  let levelName = "Iniciante Focado";
  if (score >= 50 && score < 80) levelName = "Investidor Intermediário";
  if (score >= 80) levelName = "Mestre da Diversificação";

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/investments" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Insights & Score
          </h1>
          <p className="text-muted-foreground">Análise inteligente da sua carteira de investimentos.</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 bg-card border border-border rounded-xl animate-pulse"></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SCORE BOARD */}
          <div className="lg:col-span-1 bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 bg-[length:200%_auto] animate-gradient-x"></div>
            
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-8">Score de Diversificação</h3>
            
            {/* Circular Progress (CSS based) */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  className="text-white/5 stroke-current" 
                  strokeWidth="8" 
                  cx="50" cy="50" r="40" 
                  fill="transparent"
                ></circle>
                <circle 
                  className={cn("stroke-current transition-all duration-1000 ease-out", score >= 80 ? "text-cyan-400" : score >= 50 ? "text-emerald-400" : "text-amber-400")} 
                  strokeWidth="8" 
                  strokeLinecap="round" 
                  cx="50" cy="50" r="40" 
                  fill="transparent" 
                  strokeDasharray={`${score * 2.51} 251`} // 2 * pi * 40 ~= 251
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black tabular-nums tracking-tighter">{score}</span>
                <span className="text-xs text-muted-foreground font-bold uppercase">/ 100</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
              <Trophy className={cn("w-4 h-4", score >= 80 ? "text-cyan-400" : score >= 50 ? "text-emerald-400" : "text-amber-400")} />
              <span className="text-sm font-bold">{levelName}</span>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 opacity-80">
              Seu score é baseado na distribuição do seu patrimônio entre diferentes classes de ativos e instituições.
            </p>
          </div>

          {/* MISSIONS & INSIGHTS */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Missões Recomendadas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Mission 1: Variable Income / FIIs */}
              {!hasVariableIncome ? (
                <div className="bg-card border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className="font-bold text-white mb-2">Próximo Passo: Renda Variável</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você tem uma ótima base, mas todo seu dinheiro está atrelado à mesma classe. Para aumentar seu score, considere estudar e investir em seu primeiro Fundo Imobiliário (FII) para gerar aluguéis isentos de IR todo mês.
                  </p>
                  <div className="inline-flex items-center text-xs font-bold text-amber-500 uppercase tracking-widest gap-1">
                    Recompensa: +30 Pontos <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden opacity-50">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Trophy className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-emerald-400 mb-2">Renda Variável Ativa</h4>
                  <p className="text-sm text-emerald-400/70">Você já deu o primeiro passo e possui ativos de renda variável. Ótimo trabalho em buscar maior rentabilidade no longo prazo!</p>
                </div>
              )}

              {/* Mission 2: Institutional Risk */}
              {!hasMultipleBanks ? (
                <div className="bg-card border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                    <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h4 className="font-bold text-white mb-2">Risco Institucional</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Todo o seu dinheiro parece estar no mesmo lugar. Uma regra de ouro dos investimentos é não colocar todos os ovos na mesma cesta. Sugerimos abrir conta em uma segunda corretora ou banco para novos aportes.
                  </p>
                  <div className="inline-flex items-center text-xs font-bold text-cyan-400 uppercase tracking-widest gap-1">
                    Recompensa: +20 Pontos <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden opacity-50">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Trophy className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-emerald-400 mb-2">Risco Distribuído</h4>
                  <p className="text-sm text-emerald-400/70">Excelente! Você já diversificou seu patrimônio em mais de uma instituição, protegendo-se contra problemas pontuais de um único banco.</p>
                </div>
              )}
              
              {/* Mission 3: Fixed Income (Base) */}
              {!hasFixedIncome ? (
                 <div className="bg-card border border-red-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-red-500/50 transition-colors md:col-span-2">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                 <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                   <ShieldAlert className="w-5 h-5 text-red-500" />
                 </div>
                 <h4 className="font-bold text-white mb-2">Alerta de Reserva de Emergência</h4>
                 <p className="text-sm text-muted-foreground mb-4">
                   Não detectamos nenhum investimento de Renda Fixa ou liquidez (como o Cofrinho). Antes de se aventurar, é crucial ter uma reserva guardada que possa ser acessada imediatamente em caso de necessidade.
                 </p>
                 <div className="inline-flex items-center text-xs font-bold text-red-500 uppercase tracking-widest gap-1">
                   Recompensa: +30 Pontos <ArrowRight className="w-3 h-3" />
                 </div>
               </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden opacity-50 md:col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-400">Reserva Base OK</h4>
                      <p className="text-sm text-emerald-400/70">Sua fundação está sólida com ativos de menor risco detectados.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
