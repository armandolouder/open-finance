"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Calendar, Check, Clock, TrendingUp, Plus, TrendingDown, Edit2, Trash2
} from "lucide-react";
import { cn, monthKey, monthLabel } from "@/lib/utils";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  isProjected?: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
  isCreditCard?: boolean;
  isIgnored?: boolean;
}

function ExpensesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("month") || monthKey(new Date());
  
  const [data, setData] = useState<{
    transactions: Transaction[];
    projections: Transaction[];
  }>({ transactions: [], projections: [] });
  const [realCardTotal, setRealCardTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Tem certeza que deseja apagar esta despesa recorrente?")) return;
    try {
      await fetch(`/api/expenses/recurring/${id}`, { method: "DELETE" });
      fetchData(month);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = useCallback((m: string) => {
    setLoading(true);
    
    Promise.all([
      fetch(`/api/expenses?month=${m}`).then(r => r.json()),
      fetch(`/api/cards?month=${m}`).then(r => r.json())
    ]).then(([expensesData, cardsData]) => {
      if (!expensesData.error) {
        setData(expensesData);
      }
      if (cardsData.cards) {
        const totalFaturas = cardsData.cards.reduce((sum: number, card: any) => {
          return sum + (card.bills?.[0]?.total || 0);
        }, 0);
        setRealCardTotal(totalFaturas);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(month); }, [month, fetchData]);

  // Combine and sort
  const allItems = [...data.transactions, ...(data.projections || [])]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const bankItems = allItems.filter(t => !t.isCreditCard);
  const cardItems = allItems.filter(t => t.isCreditCard);

  const activeItems = allItems.filter(t => !t.isIgnored);
  const activeBankItems = bankItems.filter(t => !t.isIgnored);

  // "somente os cadastros manuais"
  const manualItems = allItems.filter(t => t.isProjected && t.id && !t.id.toString().startsWith('proj_'));
  const totalRecorrentes = manualItems.reduce((acc, t) => acc + Math.abs(t.amount), 0);
  
  // "card cartoes + card recorrentes = total mensal"
  const totalMensal = realCardTotal + totalRecorrentes;
  const pending = manualItems.filter(t => !t.isIgnored).reduce((acc, t) => acc + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="text-emerald-500">
              <Calendar className="w-6 h-6" />
            </span>
            Despesas
          </h1>
          <p className="text-muted-foreground text-sm">Gestão de despesas mensais e únicas com categorias</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Despesa
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Total Mensal</p>
          <p className="text-2xl font-bold">R$ {totalMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-2">Soma geral do mês</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <p className="text-sm text-muted-foreground mb-1">Cartões</p>
          <p className="text-2xl font-bold">R$ {realCardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Check className="w-3 h-3 text-blue-500" /> Vencimento no mês
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <p className="text-sm text-muted-foreground mb-1">Recorrentes (Manuais)</p>
          <p className="text-2xl font-bold">R$ {totalRecorrentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" /> {manualItems.length} cadastradas
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground mb-1">Pago a mais</p>
          <p className="text-2xl font-bold">R$ 0,00</p>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-red-500" /> dentro do previsto
          </p>
        </div>
      </div>


      {/* Expenses List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex justify-between items-center">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="text-emerald-500"><TrendingDown className="w-4 h-4" /></span>
            Despesas Mensais ({allItems.length})
          </h2>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : allItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma despesa este mês.</div>
          ) : (
            allItems.map((t, i) => (
              <div key={i} className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-muted/30 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Dia</span>
                  <span className="font-bold text-foreground leading-none">
                    {new Date(t.date || (t as any).projectedDate).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate flex items-center gap-2">
                    {((t as any).title || t.description).replace(/\s*\d+\/\d+\s*$/, '').trim()}
                    {t.installmentNumber && t.totalInstallments && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">
                        {t.installmentNumber}/{t.totalInstallments}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.isProjected ? "Pendente" : "Pago"}
                  </p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <p className="font-bold text-foreground">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  
                  {t.isProjected && t.id && !t.id.startsWith('proj_') && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditExpenseId(t.id); setIsModalOpen(true); }}
                        className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteExpense(t.id)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <ExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditExpenseId(null); }} 
        onSaved={() => { setIsModalOpen(false); setEditExpenseId(null); fetchData(month); }} 
        expenseId={editExpenseId}
      />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
      <ExpensesPageContent />
    </Suspense>
  );
}
