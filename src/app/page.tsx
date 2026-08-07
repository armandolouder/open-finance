"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Building2, User, Wallet, ArrowDownCircle, ArrowUpCircle, Receipt, ArrowLeftRight, TrendingUp, Settings, ArrowUp, ArrowDown } from "lucide-react";
import { cn, getBankBranding, getBankLogoUrl } from "@/lib/utils";
import { CreditCardsSection } from "@/components/dashboard/CreditCardsSection";
import { AccountSettingsModal } from "@/components/dashboard/AccountSettingsModal";
import { InvestmentsDashboard } from "@/components/dashboard/InvestmentsDashboard";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Dashboard() {
  const [filter, setFilter] = useState<'ALL' | 'PF' | 'PJ'>('ALL');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const reloadData = () => {
    setLoading(true);
    fetch(`/api/dashboard?filter=${filter}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    reloadData();
  }, [filter]);

  // Sincroniza dados com a Pluggy automaticamente em segundo plano
  useEffect(() => {
    fetch("/api/sync", { method: "POST" })
      .then(r => r.json())
      .then(d => console.log("Sincronização em background finalizada:", d))
      .catch(e => console.error("Erro no sync automático:", e));
  }, []);

  const result = (data?.totalIncome || 0) - (data?.totalExpense || 0);
  return (
    <div className="space-y-8 pb-10">

      {loading ? (
        <div className="h-64 bg-card border border-border rounded-xl animate-pulse"></div>
      ) : (
        <>
          {/* INVESTMENTS DASHBOARD */}
          <InvestmentsDashboard accounts={data?.accounts || []} />

          {/* BANK ACCOUNTS */}
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 mt-2">Contas Correntes</h3>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 pb-2">
              {data?.accounts?.filter((a: any) => a.type === 'BANK').map((acc: any, i: number) => {
                const brand = getBankBranding(acc.name, acc.institution, acc.customColor);
                const logoUrl = getBankLogoUrl(acc.name, acc.institution);
                
                return (
                  <div 
                    key={i} 
                    className={cn(
                      "p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-sm transition-transform hover:-translate-y-1 w-full",
                      brand.bg
                    )}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg backdrop-blur-sm overflow-hidden">
                        {logoUrl ? (
                          <img src={logoUrl} alt={acc.name} className={cn("w-full h-full object-cover", logoUrl.includes('206.svg') || logoUrl.includes('mercadopago') ? "mix-blend-screen" : "brightness-0 invert opacity-90")} onError={(e) => e.currentTarget.style.display = 'none'} />
                        ) : (
                          brand.icon
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-black/20 uppercase">
                          {acc.accountType === 'PJ' ? 'Empresa' : 'Pessoal'}
                        </span>
                        <button 
                          onClick={() => setEditingAccount(acc)}
                          className="w-7 h-7 rounded-full bg-black/20 flex items-center justify-center hover:bg-black/40 transition-colors shrink-0"
                        >
                          <Settings className="w-3.5 h-3.5 text-white/80" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full">
                      <p className="text-xs opacity-80 uppercase tracking-wider mb-1 font-medium truncate">{acc.name}</p>
                      <h3 className="text-2xl font-bold mb-4">{fmt(acc.balance)}</h3>
                      
                      <div className="flex items-center gap-3 border-t border-white/20 pt-3 mt-1">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] opacity-70 uppercase tracking-widest truncate">Investimentos</p>
                          <p className="font-mono text-sm font-bold tracking-tight truncate">{fmt(acc.investments || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {(!data?.accounts?.filter((a: any) => a.type === 'BANK').length) && (
                <div className="w-full p-8 border border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
                  <Wallet className="w-8 h-8 mb-2 opacity-50" />
                  <p>Nenhuma conta encontrada</p>
                </div>
              )}
            </div>
          </div>

          {/* CREDIT CARDS */}
          <div className="mt-8 mb-8">
            <CreditCardsSection />
          </div>

          {/* TWO COLUMNS: HISTÓRICO & TAXONOMIA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* HISTÓRICO DE AUDITORIA */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group/box">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  Histórico de Auditoria
                </h3>
                <button className="text-[10px] font-bold text-emerald-500/70 hover:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded transition-colors">
                  Ver Extrato
                </button>
              </div>
              
              <div className="space-y-2">
                {data?.recentTransactions?.map((tx: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-white/[0.03] rounded-2xl transition-colors border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-4 min-w-0">
                      {(() => {
                        const brand = getBankBranding(tx.accountName || tx.institution);
                        return (
                          <div className="relative shrink-0">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-lg",
                              brand.bg,
                              brand.border
                            )}>
                              {brand.icon}
                            </div>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-[1.5px] border-[#0a0a0a]",
                              tx.type === 'CREDIT' ? "bg-emerald-500 text-[#0a0a0a]" : "bg-red-500 text-white"
                            )}>
                              {tx.type === 'CREDIT' ? <ArrowUp className="w-2.5 h-2.5 stroke-[3]" /> : <ArrowDown className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="min-w-0">
                        <p className="font-mono text-[13px] font-medium text-emerald-400/90 uppercase tracking-wider truncate">{tx.description}</p>
                        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-2 truncate opacity-80">
                          {tx.institution && (
                            <>
                              <span className={cn("font-bold truncate max-w-[80px]", getBankBranding(tx.institution).text)}>
                                {tx.accountName || tx.institution}
                              </span>
                              <span className="opacity-50">|</span>
                            </>
                          )}
                          <span className="truncate max-w-[120px]">{tx.category}</span>
                          <span className="opacity-50">|</span>
                          <span>{new Date(tx.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "font-mono font-semibold whitespace-nowrap pl-4 tracking-tight text-[15px]",
                      tx.type === 'CREDIT' ? "text-emerald-500" : "text-red-500"
                    )}>
                      {tx.type === 'CREDIT' ? '+ ' : '- '}
                      {fmt(Math.abs(tx.amount))}
                    </div>
                  </div>
                ))}
                
                {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                  <div className="text-center text-sm text-muted-foreground py-12 border border-dashed border-white/10 rounded-2xl">
                    Nenhuma transação recente.
                  </div>
                )}
              </div>
            </div>

            {/* DESEMBOLSO POR TAXONOMIA */}
            <div className="bg-card border rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Despesas por Categoria</h3>
                <Receipt className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="space-y-6 mt-4">
                {data?.expensesByCategory?.slice(0, 8).map((item: any, i: number) => {
                  const maxAmount = data.expensesByCategory[0]?.amount || 1;
                  const percentage = Math.max(2, (item.amount / maxAmount) * 100);
                  
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="font-mono text-[13px] font-medium text-emerald-400/90 uppercase tracking-wider truncate">{item.category}</span>
                          {item.sources && item.sources.length > 0 && (
                            <span className="font-mono text-[10px] uppercase tracking-widest truncate opacity-80">
                              {item.sources.map((src: string, idx: number) => {
                                const b = getBankBranding(src);
                                return (
                                  <span key={idx} className={b.text || "text-muted-foreground"}>
                                    {src}{idx < item.sources.length - 1 ? " | " : ""}
                                  </span>
                                );
                              })}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-medium text-[15px] text-foreground shrink-0 tabular-nums">{fmt(item.amount)}</span>
                      </div>
                      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-red-500 h-full rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                
                {(!data?.expensesByCategory || data.expensesByCategory.length === 0) && (
                  <div className="text-center text-sm text-muted-foreground py-10">Nenhum dado de despesa.</div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
      {editingAccount && (
        <AccountSettingsModal 
          account={editingAccount} 
          onClose={() => setEditingAccount(null)} 
          onSaved={() => {
            setEditingAccount(null);
            reloadData();
          }} 
        />
      )}
    </div>
  );
}
