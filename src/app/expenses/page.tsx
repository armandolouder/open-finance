"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Calendar, Check, Clock, TrendingUp, Plus, TrendingDown, Edit2, Trash2, Tag, CreditCard as CardIcon, Building, Briefcase
} from "lucide-react";
import useSWR from "swr";
import { cn, monthKey, monthLabel } from "@/lib/utils";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Expense {
  id: string;
  seriesId: string | null;
  title: string;
  description: string | null;
  amount: number;
  dueDate: string;
  installmentNum: number | null;
  category?: { name: string, color: string };
  series?: { type: string, installments: number | null };
  paymentMethod: string | null;
  reconciliations: any[];
  isPluggyInstallment?: boolean;
}

function ExpensesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("month") || monthKey(new Date());
  
  const { data: expensesData, mutate: mutateExpenses, isLoading: loading } = useSWR(`/api/expenses?month=${month}`, fetcher);

  const expenses: Expense[] = expensesData?.expenses || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);

  const handleDeleteExpense = async (id: string, hasSeries: boolean) => {
    let mode = 'SINGLE';
    if (hasSeries) {
      const resp = confirm("Esta despesa faz parte de uma série. Deseja excluir TODA a série? (Cancelar exclui apenas esta ocorrência)");
      mode = resp ? 'ALL' : 'SINGLE';
    } else {
      if (!confirm("Tem certeza que deseja apagar esta despesa?")) return;
    }

    try {
      await fetch(`/api/expenses/${id}?mode=${mode}`, { method: "DELETE" });
      mutateExpenses();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrevMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    router.push(`/expenses?month=${monthKey(prev)}`);
  };

  const handleNextMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const next = new Date(y, m, 1);
    router.push(`/expenses?month=${monthKey(next)}`);
  };

  // KPIs
  const totalAmount = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const paidAmount = expenses
    .filter(exp => exp.reconciliations?.length > 0)
    .reduce((acc, exp) => acc + exp.amount, 0); // simplificado, ideal é somar as reconciliações
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-emerald-500">
              <Calendar className="w-6 h-6" />
            </span>
            Planejamento & Despesas
          </h1>
          <p className="text-muted-foreground text-sm">Controle seus compromissos e planeje seu mês</p>
        </div>
        <button 
          onClick={() => { setEditExpenseId(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Despesa
        </button>
      </div>

      {/* Month Navigator & Summary */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold min-w-[150px] text-center capitalize">{monthLabel(month)}</h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-muted rounded-full transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
        
        <div className="flex gap-8 text-right">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Planejado</p>
            <p className="font-mono text-lg font-bold text-foreground">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Pago</p>
            <p className="font-mono text-lg font-bold text-emerald-500">R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Restante</p>
            <p className="font-mono text-lg font-bold text-amber-500">R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/20">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="text-emerald-500"><TrendingDown className="w-4 h-4" /></span>
            Despesas do Mês ({expenses.length})
          </h2>
        </div>
        
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <Calendar className="w-12 h-12 text-muted mb-3" />
              <p>Nenhuma despesa planejada para este mês.</p>
              <button 
                onClick={() => { setEditExpenseId(null); setIsModalOpen(true); }}
                className="mt-4 text-emerald-500 hover:underline text-sm"
              >
                Criar primeira despesa
              </button>
            </div>
          ) : (
            expenses.map((exp) => {
              const isPaid = exp.reconciliations && exp.reconciliations.length > 0;
              const isInstallment = exp.series?.type === 'INSTALLMENT';
              
              return (
                <div key={exp.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-muted/30 transition-colors group">
                  <div className="flex-1 flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-border/50 text-muted-foreground"
                    )}>
                      {isPaid ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{exp.title}</p>
                        {isInstallment && exp.installmentNum && exp.series?.installments && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium border border-amber-500/20">
                            {exp.installmentNum}/{exp.series.installments}
                          </span>
                        )}
                        {exp.series?.type === 'RECURRING' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium border border-blue-500/20">
                            Recorrente
                          </span>
                        )}
                        {exp.isPluggyInstallment && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1B221E]/60 text-muted-foreground font-bold border border-border uppercase tracking-widest">
                            ORIGEM: PLUGGY
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(exp.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                        {exp.category && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {exp.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
                    <div className="text-left sm:text-right">
                      <p className={cn("font-mono font-bold text-lg", isPaid ? "text-emerald-500" : "text-foreground")}>
                        R$ {exp.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        {isPaid ? "Pago" : "Pendente"}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!exp.isPluggyInstallment ? (
                        <>
                          <button 
                            onClick={() => { setEditExpenseId(exp.id); setIsModalOpen(true); }}
                            className="p-2 bg-muted hover:bg-muted-foreground/20 text-foreground rounded-lg transition-colors"
                            title="Editar Despesa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteExpense(exp.id, !!exp.seriesId)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground mr-2 italic">Automático</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSaved={mutateExpenses}
        expenseId={editExpenseId}
      />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando visualização...</div>}>
      <ExpensesPageContent />
    </Suspense>
  );
}
