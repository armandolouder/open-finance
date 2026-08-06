"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  expenseId?: string | null;
}

export function ExpenseModal({ isOpen, onClose, onSaved, expenseId }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string, children?: { id: string; name: string }[] }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [cards, setCards] = useState<{ id: string; name: string }[]>([]);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "EXPENSE",
    frequency: "MONTHLY",
    startDate: new Date().toISOString().split('T')[0],
    dayOfMonth: new Date().getDate().toString(),
    categoryId: "",
    accountOrCardId: "",
    description: "",
    isVariable: false,
    matchPattern: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (expenseId) {
        setLoading(true);
        fetch("/api/expenses/recurring").then(res => res.json()).then(data => {
          const exp = data.find((e: any) => e.id === expenseId);
          if (exp) {
            let acId = "";
            if (exp.accountId) acId = `account_${exp.accountId}`;
            else if (exp.creditCardId) acId = `card_${exp.creditCardId}`;
            
            setSelectedParentId(exp.category?.parentId || exp.categoryId || "");
            
            setFormData({
              title: exp.title,
              amount: exp.amount.toString(),
              type: exp.type,
              frequency: exp.frequency,
              startDate: new Date(exp.startDate).toISOString().split('T')[0],
              dayOfMonth: exp.dayOfMonth?.toString() || new Date(exp.startDate).getDate().toString(),
              categoryId: exp.categoryId || "",
              accountOrCardId: acId,
              description: exp.description || "",
              isVariable: exp.isVariable || false,
              matchPattern: exp.matchPattern || "",
            });
          }
        }).finally(() => setLoading(false));
      } else {
        // Reset form
        setFormData({
          title: "", amount: "", type: "EXPENSE", frequency: "MONTHLY",
          startDate: new Date().toISOString().split('T')[0],
          dayOfMonth: new Date().getDate().toString(),
          categoryId: "", accountOrCardId: "", description: "",
          isVariable: false, matchPattern: "",
        });
      }

      fetch("/api/categories").then(res => res.json()).then(data => {
        if (Array.isArray(data)) setCategories(data);
      }).catch(console.error);

      fetch("/api/accounts").then(res => res.json()).then(data => {
        if (data.bankAccounts) setAccounts(data.bankAccounts);
        if (data.creditAccounts) setCards(data.creditAccounts);
      }).catch(console.error);
    }
  }, [isOpen, expenseId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isCard = formData.accountOrCardId.startsWith('card_');
      const payload = {
        ...formData,
        accountId: formData.accountOrCardId && !isCard ? formData.accountOrCardId.replace('account_', '') : "",
        creditCardId: isCard ? formData.accountOrCardId.replace('card_', '') : "",
      };

      const url = expenseId ? `/api/expenses/recurring/${expenseId}` : "/api/expenses/recurring";
      const method = expenseId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert("Erro ao salvar despesa");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar despesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Nova Despesa</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Descrição *</label>
            <input 
              required
              type="text" 
              placeholder="Ex: Aluguel do escritório"
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Valor (R$) *</label>
              <input 
                required
                type="number"
                step="0.01"
                placeholder="0,00"
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Tipo</label>
              <select 
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none"
                value={formData.frequency}
                onChange={e => setFormData({...formData, frequency: e.target.value})}
              >
                <option value="MONTHLY">Despesa Mensal</option>
                <option value="INSTALLMENT">Parcelada</option>
                <option value="SINGLE">Única</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-white/70 mb-1">Data *</label>
               <input 
                 required
                 type="date"
                 className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                 value={formData.startDate}
                 onChange={e => setFormData({...formData, startDate: e.target.value})}
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-white/70 mb-1">Dia Venc. (1-31)</label>
               <input 
                 type="number"
                 min="1" max="31"
                 className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                 value={formData.dayOfMonth}
                 onChange={e => setFormData({...formData, dayOfMonth: e.target.value})}
               />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Categoria</label>
              <select 
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none"
                value={selectedParentId}
                onChange={e => {
                  setSelectedParentId(e.target.value);
                  setFormData({...formData, categoryId: e.target.value});
                }}
              >
                <option value="">Selecionar...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Subcategoria</label>
              <select 
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none disabled:opacity-50"
                value={formData.categoryId !== selectedParentId ? formData.categoryId : ""}
                onChange={e => setFormData({...formData, categoryId: e.target.value || selectedParentId})}
                disabled={!selectedParentId || !categories.find(c => c.id === selectedParentId)?.children?.length}
              >
                <option value="">---</option>
                {categories.find(c => c.id === selectedParentId)?.children?.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Conta / Cartão</label>
            <select 
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none"
              value={formData.accountOrCardId}
              onChange={e => setFormData({...formData, accountOrCardId: e.target.value})}
            >
              <option value="">Nenhuma (Dinheiro)</option>
              {accounts.length > 0 && (
                <optgroup label="Contas">
                  {accounts.map(a => <option key={`account_${a.id}`} value={`account_${a.id}`}>{a.name}</option>)}
                </optgroup>
              )}
              {cards.length > 0 && (
                <optgroup label="Cartões de Crédito">
                  {cards.map(c => <option key={`card_${c.id}`} value={`card_${c.id}`}>{c.name}</option>)}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 mt-2 p-3 bg-white/5 rounded-xl border border-white/10">
            <input 
              type="checkbox" 
              id="isVariable"
              checked={formData.isVariable}
              onChange={(e) => setFormData({ ...formData, isVariable: e.target.checked })}
              className="w-4 h-4 rounded border-white/10 text-emerald-500 focus:ring-emerald-500 bg-[#2c2c2e]"
            />
            <label htmlFor="isVariable" className="text-sm font-medium text-white/90 cursor-pointer select-none">
              Valor Variável (Estimativa)
            </label>
          </div>

          {formData.isVariable && (
            <div className="space-y-1.5 mt-1 mb-2">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Palavras-chave no Extrato (Identificação Automática)
              </label>
              <input
                type="text"
                placeholder="Ex: ENEL, SABESP, CLARO"
                value={formData.matchPattern}
                onChange={(e) => setFormData({ ...formData, matchPattern: e.target.value })}
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-white/20"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Quando a integração encontrar uma transação com essas palavras, ela substituirá esta projeção automaticamente.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Observações</label>
            <textarea 
              rows={3}
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-medium text-white/70 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-400 text-emerald-950 rounded-xl font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
