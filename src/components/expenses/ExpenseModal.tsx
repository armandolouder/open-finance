"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ExpenseModal({ isOpen, onClose, onSaved }: ExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "EXPENSE",
    frequency: "MONTHLY",
    startDate: new Date().toISOString().split('T')[0],
    dayOfMonth: new Date().getDate().toString(),
    categoryId: "",
    accountId: "",
    creditCardId: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/categories")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCategories(data);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/expenses/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
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

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Categoria</label>
            <select 
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none"
              value={formData.categoryId}
              onChange={e => setFormData({...formData, categoryId: e.target.value})}
            >
              <option value="">Selecionar categoria...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

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
