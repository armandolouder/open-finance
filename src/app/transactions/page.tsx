"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  ArrowDownLeft, ArrowUpRight, Search, CheckCircle2, CircleDashed, Tag
} from "lucide-react";
import { EditTransactionModal } from "@/components/transactions/EditTransactionModal";
import { useSearchParams } from "next/navigation";
import { cn, monthKey } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Transaction {
  id: string;
  originalDescription: string;
  normalizedDescription?: string;
  amount: number;
  date: string;
  type: string;
  origin: string;
  isReconciled: boolean;
  categoryRelation?: { id: string; name: string; color: string };
  account?: { name: string };
  creditCard?: { name: string };
  tags?: string;
}

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

function TransactionsPageContent() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month") || monthKey(new Date());
  const [search, setSearch] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const { data, error, isLoading: loading, mutate } = useSWR(`/api/transactions?month=${month}`, fetcher);
  
  const transactions: Transaction[] = data?.transactions || [];

  const filtered = transactions.filter((t) =>
    (t.normalizedDescription ?? t.originalDescription).toLowerCase().includes(search.toLowerCase()) ||
    (t.categoryRelation?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.account?.name ?? t.creditCard?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const groupedTransactions = filtered.reduce((acc, t) => {
    const dateKey = new Date(t.date).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Calcula resumo básico
  const totalIn = filtered.filter(t => ['PIX_IN', 'DEPOSIT', 'TRANSFER', 'CASHBACK', 'REFUND'].includes(t.type) || t.amount > 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const totalOut = filtered.filter(t => !(['PIX_IN', 'DEPOSIT', 'TRANSFER', 'CASHBACK', 'REFUND'].includes(t.type)) && t.amount < 0).reduce((acc, t) => acc + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">Extrato & Transações</h1>
        <p className="text-muted-foreground">Movimentações brutas sincronizadas das suas contas bancárias.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Entradas no Mês</p>
          <p className="font-mono text-lg font-bold text-emerald-500">R$ {totalIn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">Saídas no Mês</p>
          <p className="font-mono text-lg font-bold text-red-500">R$ {totalOut.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl">Carregando transações...</div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-card border border-border rounded-2xl">Erro ao carregar transações.</div>
      ) : Object.keys(groupedTransactions).length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">
          Nenhuma transação encontrada.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, items]) => (
            <div key={date} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-muted/20 border-b border-border">
                <h3 className="text-sm font-semibold text-muted-foreground capitalize">{date}</h3>
              </div>
              <div className="divide-y divide-border">
                {items.map((tx) => {
                  const isCredit = ['PIX_IN', 'DEPOSIT', 'TRANSFER', 'CASHBACK', 'REFUND'].includes(tx.type) || tx.amount > 0;
                  const absAmount = Math.abs(tx.amount);
                  const accName = tx.account?.name || tx.creditCard?.name || "Banco";
                  const bInfo = getBankInfo(accName);
                  const isReconciled = tx.isReconciled;

                  return (
                    <div
                      key={tx.id}
                      onClick={() => setEditingTransaction(tx)}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner", bInfo.bg, "bg-opacity-20 text-white font-bold")}>
                          {bInfo.initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {tx.normalizedDescription || tx.originalDescription}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{accName}</span>
                            {tx.categoryRelation && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span className="flex items-center gap-1 text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
                                  <Tag className="w-3 h-3" />
                                  {tx.categoryRelation.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 mt-3 sm:mt-0 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                          {isReconciled ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Conciliado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                              <CircleDashed className="w-3.5 h-3.5" /> Solto
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={cn("font-mono font-bold whitespace-nowrap", isCredit ? "text-emerald-500" : "text-foreground")}>
                            {isCredit ? "+" : "-"} R$ {absAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSaved={mutate}
        transaction={editingTransaction}
      />
    </div>
  );
}

import { Suspense } from "react";
export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl">Carregando visualização...</div>}>
      <TransactionsPageContent />
    </Suspense>
  );
}
