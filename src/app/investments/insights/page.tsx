"use client";

import { useEffect, useState } from "react";
import { Sparkles, Trophy, ShieldAlert, Target, ArrowRight, ArrowLeft, CheckCircle2, Lock, ChevronDown, DollarSign, Globe, TrendingUp, Building2 } from "lucide-react";
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

const levelsData = [
  {
    id: 1,
    title: "Nível 1: Reserva de Emergência",
    short: "Garantir liquidez e segurança imediata.",
    icon: ShieldAlert,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground mt-4">
        <p>A base de tudo. Dinheiro que você pode precisar a qualquer momento.</p>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="font-bold text-white mb-1">Status ideal:</p>
          <p>Ter uma reserva rendendo pelo menos 100% do CDI (como o cofrinho do Mercado Pago a 115%). ✅</p>
        </div>
      </div>
    ),
    check: (hasFixed: boolean) => hasFixed,
  },
  {
    id: 2,
    title: "Nível 2: Fundos Imobiliários (FIIs)",
    short: "A mágica da Renda Passiva mensal.",
    icon: Building2,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground mt-4">
        <p>Já que você gosta de ver os números subindo no app, você vai adorar os FIIs. Eles são como "comprar um pedacinho de um shopping ou prédio comercial".</p>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="font-bold text-white mb-1">A grande vantagem:</p>
          <p>Eles pagam aluguel (dividendos) na sua conta todo mês, totalmente isentos de imposto de renda.</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="font-bold text-white mb-1">O jogo:</p>
          <p>No começo, você recebe alguns centavos ou reais por mês. Se você reinvestir esses "aluguéis" comprando mais cotas, vira uma bola de neve maravilhosa (os famosos juros compostos da vida real).</p>
        </div>
      </div>
    ),
    check: (hasFixed: boolean, hasVar: boolean) => hasVar,
  },
  {
    id: 3,
    title: "Nível 3: Proteção IPCA+ (Médio Prazo)",
    short: "Proteger o dinheiro contra a inflação.",
    icon: TrendingUp,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground mt-4">
        <p>Se você tem uma parte do dinheiro que tem certeza que não vai precisar nos próximos 2 a 5 anos, não vale a pena deixar no CDI, pois a inflação pode comer o rendimento.</p>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="font-bold text-white mb-1">O que olhar:</p>
          <p>Títulos do Tesouro Direto (Tesouro IPCA+) ou CDBs/LCIs atrelados ao IPCA.</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="font-bold text-white mb-1">Por que:</p>
          <p>Eles garantem que seu dinheiro vai render a Inflação do período MAIS uma taxa fixa (ex: IPCA + 6%). Você nunca perde poder de compra. Nota: LCIs e LCAs ainda têm a vantagem de serem isentos de Imposto de Renda.</p>
        </div>
      </div>
    ),
    check: () => false, // Simplificando a verificação para o frontend (requer análise de nome do ativo)
  },
  {
    id: 4,
    title: "Nível 4: Ações Nacionais / ETFs",
    short: "Foco no longo prazo (mais de 10 anos).",
    icon: Target,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground mt-4">
        <p>Se o seu objetivo for longo prazo, a renda variável em ações se torna necessária.</p>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="font-bold text-white mb-1">A Rota Segura (ETFs):</p>
          <p>Em vez de tentar escolher a "empresa do momento", você pode comprar um ETF como o BOVA11, que replica as maiores empresas do Brasil de uma só vez.</p>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="font-bold text-white mb-1">A Rota dos Dividendos:</p>
          <p>Assim como os FIIs, focar em empresas de energia, bancos e saneamento (Bolsa Brasileira) costuma gerar bons lucros distribuídos algumas vezes ao ano.</p>
        </div>
      </div>
    ),
    check: () => false,
  },
  {
    id: 5,
    title: "Nível 5: Diversificação Global",
    short: "Proteção em moeda forte (Dólar).",
    icon: Globe,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground mt-4">
        <p>O Real (BRL) perde valor frente ao Dólar no longo prazo. Ter parte do patrimônio (mesmo que seja 10% ou 20%) em moeda forte protege você de crises internas no Brasil.</p>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="font-bold text-white mb-1">Como fazer:</p>
          <p>Bancos como o Banco Inter (que você tem conta) ou Nomad oferecem contas globais. Você pode investir no IVVB11 (que investe nas 500 maiores empresas dos EUA) ou comprar ações da Apple, Google, Microsoft diretamente.</p>
        </div>
      </div>
    ),
    check: () => false,
  }
];

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

          {/* ROADMAP & INSIGHTS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Trilha do Investidor
              </h3>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Plano de Ação</span>
            </div>
            
            <div className="relative border-l-2 border-white/10 ml-4 space-y-8 pb-4">
              {levelsData.map((level, i) => {
                // Determine if completed
                const isCompleted = level.check(hasFixedIncome, hasVariableIncome);
                // Determine if it's the NEXT mission (first uncompleted)
                const isNext = !isCompleted && (i === 0 || levelsData[i-1].check(hasFixedIncome, hasVariableIncome));
                
                const Icon = level.icon;

                return (
                  <div key={level.id} className="relative pl-8">
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-[#0a0a0a]",
                      isCompleted ? "bg-emerald-500 text-[#0a0a0a]" : isNext ? "bg-cyan-500 animate-pulse text-[#0a0a0a]" : "bg-white/10 text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isNext ? <Icon className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>

                    <div className={cn(
                      "rounded-2xl p-6 border transition-all relative overflow-hidden",
                      isCompleted ? "bg-emerald-500/5 border-emerald-500/20" : isNext ? "bg-card border-cyan-500/40 shadow-[0_0_20px_-5px_rgba(6,182,212,0.2)]" : "bg-card/50 border-white/5 opacity-80"
                    )}>
                      {isNext && (
                         <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn("font-bold text-lg", isCompleted ? "text-emerald-400" : isNext ? "text-cyan-400" : "text-white")}>
                              {level.title}
                            </h4>
                            {isNext && <span className="text-[10px] font-bold bg-cyan-500 text-black px-2 py-0.5 rounded-full uppercase tracking-wider">Missão Atual</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">{level.short}</p>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className={cn(
                        "mt-4 pt-4 border-t",
                        isCompleted ? "border-emerald-500/20" : isNext ? "border-cyan-500/20" : "border-white/5"
                      )}>
                        {level.content}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
