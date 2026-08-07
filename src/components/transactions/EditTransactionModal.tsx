"use client";

import { useState, useEffect } from "react";
import { X, Tag, RefreshCw, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  transaction: any; 
}

export function EditTransactionModal({ isOpen, onClose, onSaved, transaction }: EditTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string, children?: { id: string; name: string }[] }[]>([]);
  
  const [formData, setFormData] = useState({
    categoryId: "",
    subcategoryId: "",
    tags: "",
  });

  useEffect(() => {
    if (isOpen && transaction) {
      setFormData({
        categoryId: transaction.categoryId || "",
        subcategoryId: transaction.subcategoryId || "",
        tags: transaction.tags || "",
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#1c1c1e] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-transparent">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <FileText className="w-5 h-5" />
              </span>
              Editar Transação
            </h2>
            <p className="text-xs text-white/50 mt-1 ml-11">Categorize a transação bancária</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          
          {/* Card Resumo da Transação */}
          <div className="bg-[#2c2c2e] rounded-2xl p-5 border border-white/5 mb-8 shadow-inner">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm text-white font-bold">{transaction.description || transaction.originalDescription}</p>
                <p className="font-mono text-xs text-white/50 mt-1">
                  {new Date(transaction.date).toLocaleDateString('pt-BR')} 
                  {transaction.accountName ? ` - ${transaction.accountName}` : ''}
                </p>
              </div>
              <p className={cn("font-bold text-xl", transaction.type === 'CREDIT' ? "text-emerald-500" : "text-red-500")}>
                {transaction.type === 'CREDIT' ? '+ ' : '- '}
                {Math.abs(transaction.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            {transaction.origin && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-[10px] font-medium text-white/50 uppercase tracking-widest border border-white/5">
                {transaction.origin === 'OPEN_FINANCE' ? 'Open Finance' : transaction.origin}
              </div>
            )}
          </div>

          <form id="transactionForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Categorização */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                <Tag className="w-4 h-4 text-blue-400" />
                Categorização
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Categoria Principal</label>
                  <select 
                    className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value, subcategoryId: ""})}
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Subcategoria</label>
                  <select 
                    className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none disabled:opacity-50"
                    value={formData.subcategoryId}
                    onChange={e => setFormData({...formData, subcategoryId: e.target.value})}
                    disabled={!formData.categoryId || !categories.find(c => c.id === formData.categoryId)?.children?.length}
                  >
                    <option value="">Selecione...</option>
                    {categories.find(c => c.id === formData.categoryId)?.children?.map(child => (
                      <option key={child.id} value={child.id}>{child.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Tags</label>
                  <input 
                    type="text" placeholder="Separadas por vírgula (ex: ifood, assinatura, uber)"
                    className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#1c1c1e] flex justify-end gap-3 rounded-b-3xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-medium text-white/70 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="transactionForm"
            disabled={loading}
            className="px-8 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-400 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
              </span>
            ) : "Salvar Categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}
