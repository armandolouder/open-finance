"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowDownToLine, ArrowUpDown, RefreshCw, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  frequency: string;
  startDate: string;
  categoryId?: string;
  accountId?: string;
  category?: { name: string };
  account?: { name: string; institutionName: string };
}

export default function RecurringExpensesPage() {
  const [data, setData] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"recurring" | "installments">("recurring");

  useEffect(() => {
    fetch("/api/expenses/recurring")
      .then(r => r.json())
      .then(d => {
        if (!d.error) setData(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const recurring = data.filter(d => d.frequency !== "INSTALLMENT");
  const installments = data.filter(d => d.frequency === "INSTALLMENT");

  const activeData = tab === "recurring" ? recurring : installments;
  const total = activeData.reduce((acc, curr) => acc + curr.amount, 0);
  const average = activeData.length ? total / activeData.length : 0;
  const totalYear = total * 12;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Recorrentes/Parceladas</h1>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-accent flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" /> Ordenar
          </button>
          <button className="px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-accent flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4" /> Exportar
          </button>
          <button className="px-4 py-2 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Adicionar Transação
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
             <span className="text-muted-foreground">$</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-bold text-lg">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
             <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Média por assinatura</p>
            <p className="font-bold text-lg">R$ {average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
             <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total por ano</p>
            <p className="font-bold text-lg">R$ {totalYear.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-2 rounded-2xl border border-border">
        <div className="flex p-1 bg-muted/30 rounded-xl">
          <button 
            onClick={() => setTab("recurring")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              tab === "recurring" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <RefreshCw className="w-4 h-4" /> Recorrentes <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md">{recurring.length}</span>
          </button>
          <button 
            onClick={() => setTab("installments")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              tab === "installments" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-4 h-4" /> Parceladas <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md">{installments.length}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Buscar transações..." 
            className="bg-transparent border border-border rounded-xl px-4 py-2 text-sm flex-1 sm:w-64 focus:outline-none focus:border-primary"
          />
          <button className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-accent whitespace-nowrap">
            Filtrar transações
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/20 text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3 font-medium w-10">
                <input type="checkbox" className="rounded border-muted-foreground" />
              </th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Conta</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : activeData.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhuma transação encontrada.</td></tr>
            ) : (
              activeData.map((item, i) => (
                <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-4"><input type="checkbox" className="rounded border-muted-foreground" /></td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-medium text-foreground block">{new Date(item.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                    <span className="text-xs text-muted-foreground">{new Date(item.startDate).getFullYear()}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-xs font-bold">
                        {item.title.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {item.category?.name || "Sem categoria"}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {item.account?.name || "Nenhuma"}
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">-</td>
                  <td className="px-4 py-4 text-right font-medium text-red-500 whitespace-nowrap">
                    - R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4">
                    <button className="p-1 hover:bg-muted rounded text-muted-foreground">...</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
