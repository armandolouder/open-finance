"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Target, Settings, X, Info } from "lucide-react";
import { cn, getBankBranding } from "@/lib/utils";

// Format currency with up to 4 decimal places for the "odometer" effect to be more visible
const fmt = (v: number) => {
  return v.toLocaleString("pt-BR", { 
    style: "currency", 
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
};

export function InvestmentsDashboard({ accounts }: { accounts: any[] }) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Real total from accounts
  const investTotal = accounts?.reduce((sum, acc) => sum + (acc.investments || 0), 0) || 0;
  
  // State for gamification settings
  const [goal, setGoal] = useState(1000000);
  const [annualRate, setAnnualRate] = useState(12.0);
  
  // Odometer state
  const [currentTotal, setCurrentTotal] = useState(investTotal);
  
  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(1000000);
  const [tempRate, setTempRate] = useState(12.0);

  useEffect(() => {
    setIsMounted(true);
    // Load from local storage
    const savedGoal = localStorage.getItem("invest_goal");
    const savedRate = localStorage.getItem("invest_rate");
    if (savedGoal) setGoal(Number(savedGoal));
    if (savedRate) setAnnualRate(Number(savedRate));
  }, []);

  useEffect(() => {
    setCurrentTotal(investTotal);
  }, [investTotal]);

  useEffect(() => {
    if (!isMounted || investTotal === 0 || annualRate === 0) return;
    
    let lastTime = performance.now();
    let animationFrameId: number;
    
    const update = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;
      
      const rate = annualRate / 100;
      const msPerYear = 365 * 24 * 60 * 60 * 1000;
      const interestPerMs = (investTotal * rate) / msPerYear;
      
      setCurrentTotal((prev: number) => prev + (interestPerMs * deltaMs));
      animationFrameId = requestAnimationFrame(update);
    };
    
    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [investTotal, annualRate, isMounted]);

  const handleSaveSettings = () => {
    setGoal(tempGoal);
    setAnnualRate(tempRate);
    localStorage.setItem("invest_goal", tempGoal.toString());
    localStorage.setItem("invest_rate", tempRate.toString());
    setIsSettingsOpen(false);
    setCurrentTotal(investTotal); // Reset to base to see it grow again
  };

  const openSettings = () => {
    setTempGoal(goal);
    setTempRate(annualRate);
    setIsSettingsOpen(true);
  };

  if (!isMounted) return null;

  const progressPercentage = Math.min(100, Math.max(0, (investTotal / (goal || 1)) * 100));
  
  const investedAccounts = accounts?.filter(a => (a.investments || 0) > 0)
    .sort((a,b) => (b.investments || 0) - (a.investments || 0)) || [];

  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4 mt-2">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Patrimônio Investido</h3>
        <button 
          onClick={openSettings}
          className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-2 py-1 rounded"
        >
          <Settings className="w-3 h-3" /> Configurar Simulação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* BIG COUNTER (Odômetro) */}
        <div className="md:col-span-2 bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl p-5 shadow-[0_0_40px_-15px_rgba(16,185,129,0.3)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 bg-[length:200%_auto] animate-gradient-x"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs uppercase tracking-widest text-emerald-400/80 font-bold">Total Gamificado</span>
                {annualRate > 0 && (
                  <span className="ml-auto text-[10px] text-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    +{annualRate}% a.a
                  </span>
                )}
              </div>
              
              <div className="mt-3">
                <h2 className="text-3xl md:text-4xl font-black tabular-nums tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 flex items-baseline gap-1">
                  <span className="text-xl text-emerald-400/80 font-bold mr-1">R$</span>
                  {currentTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).replace("R$", "").trim()}
                </h2>
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5 opacity-80">
                  <Info className="w-3 h-3" />
                  Simulando rendimento em tempo real baseado no valor base das contas.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-white/50 mb-1.5">
                <span>Progresso até a meta</span>
                <span className="text-emerald-400">{progressPercentage.toFixed(1)}%</span>
              </div>
              
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                {/* Simulated Glassmorphism progress */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-20"></div>
                </div>
              </div>
              
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-muted-foreground">R$ 0</span>
                <span className="text-[10px] text-emerald-400/80 font-bold flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  R$ {goal.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BANK BREAKDOWN */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">Composição</h3>
          
          {investedAccounts.length > 0 ? (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Horizontal stacked bar */}
              <div className="h-4 w-full rounded-full overflow-hidden flex mb-6">
                {investedAccounts.map((acc, i) => {
                  const pct = ((acc.investments || 0) / investTotal) * 100;
                  const brand = getBankBranding(acc.name, acc.institution, acc.customColor);
                  return (
                    <div 
                      key={i} 
                      title={`${acc.name}: ${fmt(acc.investments || 0)}`}
                      className={cn("h-full border-r border-background/20 last:border-r-0 hover:brightness-125 transition-all cursor-pointer", brand.bg)}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-3 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                {investedAccounts.map((acc, i) => {
                  const pct = ((acc.investments || 0) / investTotal) * 100;
                  const brand = getBankBranding(acc.name, acc.institution, acc.customColor);
                  return (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", brand.bg)}></div>
                        <span className="text-[11px] font-bold text-foreground/80 truncate uppercase">{acc.name}</span>
                      </div>
                      <div className="flex flex-col items-end shrink-0 pl-2">
                        <span className="text-xs font-mono font-medium">{fmt(acc.investments || 0)}</span>
                        <span className="text-[9px] text-muted-foreground font-bold">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 text-center">
              <TrendingUp className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">Nenhum investimento encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
            
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  Configurar Gamificação
                </h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Meta Financeira (R$)</label>
                  <input 
                    type="number" 
                    value={tempGoal} 
                    onChange={e => setTempGoal(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">O objetivo final para a barra de progresso.</p>
                </div>
                
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Taxa de Rendimento Anual Simulada (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={tempRate} 
                    onChange={e => setTempRate(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Dica: 115% do CDI equivale a aproximadamente 12.0% ao ano.</p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="bg-emerald-500 text-black px-6 py-2 rounded-xl text-sm font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
