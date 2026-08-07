"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  transaction: any; // Ideally a proper type
}

export function EditTransactionModal({ isOpen, onClose, onSaved, transaction }: EditTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string, children?: { id: string; name: string }[] }[]>([]);
  
  const [formData, setFormData] = useState({
    categoryId: "",
    subcategoryId: "",
    tags: "",
    ignoreInReports: false,
  });

  useEffect(() => {
    if (isOpen && transaction) {
      setFormData({
        categoryId: transaction.categoryId || "",
        subcategoryId: transaction.subcategoryId || "",
        tags: transaction.tags || "",
        ignoreInReports: transaction.ignoreInReports || false,
      });

      fetch("/api/categories")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCategories(data);
        })
        .catch(console.error);
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        alert("Erro ao salvar transação");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Editar Transação</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="bg-[#2c2c2e] rounded-xl p-4 border border-white/10 mb-4">
            <p className="font-mono text-sm text-white font-bold">{transaction.description}</p>
            <p className="font-mono text-xs text-white/50">{new Date(transaction.date).toLocaleDateString('pt-BR')} - {transaction.accountName}</p>
            <p className={cn("font-bold text-lg mt-2", transaction.type === 'CREDIT' ? "text-emerald-500" : "text-red-500")}>
              {transaction.type === 'CREDIT' ? '+ ' : '- '}{Math.abs(transaction.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Categoria</label>
              <select 
                className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 appearance-none"
                value={formData.categoryId}
                onChange={e => {
                  setFormData({
                    ...formData, 
                    categoryId: e.target.value,
                    subcategoryId: "" // Reset subcategory when category changes
                  });
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
                value={formData.subcategoryId}
                onChange={e => setFormData({...formData, subcategoryId: e.target.value})}
                disabled={!formData.categoryId || !categories.find(c => c.id === formData.categoryId)?.children?.length}
              >
                <option value="">---</option>
                {categories.find(c => c.id === formData.categoryId)?.children?.map(child => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Tags (separadas por vírgula)</label>
            <input 
              type="text" 
              placeholder="Ex: viagem, ifood, casa"
              className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Ações Rápidas</h3>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-sm font-medium text-white/90 select-none">
                Mostrar nos relatórios e despesas
              </span>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={!formData.ignoreInReports}
                  onChange={(e) => setFormData({ ...formData, ignoreInReports: !e.target.checked })}
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>

            </div>
            {formData.ignoreInReports && (
              <p className="text-[10px] text-amber-500/70 mt-2 ml-1">
                Ao desativar, esta transação não aparecerá na tela de Despesas e não será contabilizada no seu Total Mensal.
              </p>
            )}
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
