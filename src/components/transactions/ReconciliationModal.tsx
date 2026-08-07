"use client";

import { useState, useEffect } from "react";
import { X, Search, CheckCircle2, DollarSign, Calendar, RefreshCw, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  transaction: any; 
}

export function ReconciliationModal({ isOpen, onClose, onSaved, transaction }: ReconciliationModalProps) {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      setFetching(true);
      // Fetch expenses for the same month as the transaction
      const txDate = new Date(transaction.date);
      const year = txDate.getFullYear();
      const month = String(txDate.getMonth() + 1).padStart(2, '0');
      
      fetch(`/api/expenses?month=${year}-${month}`)
        .then(res => res.json())
        .then(data => {
          if (data.expenses) {
            setExpenses(data.expenses);
          }
        })
        .catch(console.error)
        .finally(() => setFetching(false));
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const handleReconcile = async (expense: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/reconciliations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.id,
          expenseId: expense.id,
          amount: Math.abs(transaction.amount) // By default, reconcile the full transaction amount
        })
      });
      
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao conciliar");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conciliar");
    } finally {
      setLoading(false);
    }
  };

  const isCredit = ['PIX_IN', 'DEPOSIT', 'TRANSFER', 'CASHBACK', 'REFUND'].includes(transaction.type) || transaction.amount > 0;
  const absAmount = Math.abs(transaction.amount);

  const filteredExpenses = expenses.filter(exp => 
    exp.title.toLowerCase().includes(search.toLowerCase()) || 
    (exp.description && exp.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#1c1c1e] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-transparent">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <LinkIcon className="w-5 h-5" />
              </span>
              Conciliar Transação
            </h2>
            <p className="text-xs text-white/50 mt-1 ml-11">Amarre esta transação a uma despesa planejada</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar space-y-6">
          
          {/* Transação Atual */}
          <div className="bg-[#2c2c2e] rounded-2xl p-5 border border-white/5 shadow-inner">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Transação do Banco</p>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm text-white font-bold">{transaction.description || transaction.originalDescription}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{transaction.accountName || transaction.account?.name || 'Banco'}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("font-mono font-bold text-lg", isCredit ? "text-emerald-500" : "text-white")}>
                  {isCredit ? "+" : "-"} R$ {absAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Sugestões de Despesas */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Despesas Planejadas deste Mês</p>
              
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar despesa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#2c2c2e] border border-white/5 text-white text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-white/30"
                />
              </div>
            </div>

            {fetching ? (
              <div className="py-10 text-center text-white/40 text-sm flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Buscando despesas...
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-10 text-center text-white/40 text-sm bg-white/5 rounded-xl border border-white/5 border-dashed">
                Nenhuma despesa encontrada para este mês.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map(exp => {
                  // highlight expenses with exact same amount
                  const isMatchAmount = exp.amount === absAmount;
                  
                  return (
                    <div 
                      key={exp.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        isMatchAmount ? "bg-blue-500/10 border-blue-500/30" : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-white truncate">{exp.title}</p>
                          {isMatchAmount && (
                            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Valor Exato</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                          <span>Venc: {new Date(exp.dueDate).toLocaleDateString('pt-BR')}</span>
                          {exp.category && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span>{exp.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <p className="font-mono font-bold text-sm text-white/90">
                          R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <button
                          onClick={() => handleReconcile(exp)}
                          disabled={loading}
                          className="bg-blue-500 hover:bg-blue-400 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                          {loading ? "Conciliando..." : "Conciliar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
