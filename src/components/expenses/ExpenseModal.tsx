"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Tag, CreditCard as CardIcon, RefreshCw, Briefcase, FileText } from "lucide-react";
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
  
  // Data
  const [isEditingSeries, setIsEditingSeries] = useState(false);
  const [hasSeries, setHasSeries] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    dueDate: new Date().toISOString().split('T')[0],
    
    // Type of expense (ONLY USED ON CREATION)
    creationType: "SINGLE" as "SINGLE" | "RECURRING" | "INSTALLMENT",
    frequency: "MONTHLY",
    installments: "2",
    
    // Categorization
    categoryId: "",
    subcategoryId: "",
    tags: "",
    supplier: "",
    costCenter: "",
    
    // Payment
    paymentMethod: "",
    accountOrCardId: "",
    notes: "",
    
    // Update Mode (ONLY USED ON UPDATE IF HAS SERIES)
    updateMode: "SINGLE" as "SINGLE" | "THIS_AND_FUTURE" | "ALL"
  });

  useEffect(() => {
    if (isOpen) {
      if (expenseId) {
        setLoading(true);
        // Fetch specific expense
        fetch(`/api/expenses/${expenseId}`).then(res => res.json()).then(exp => {
          if (exp && !exp.error) {
            let acId = "";
            if (exp.accountId) acId = `account_${exp.accountId}`;
            else if (exp.creditCardId) acId = `card_${exp.creditCardId}`;
            
            setHasSeries(!!exp.seriesId);
            setIsEditingSeries(!!exp.seriesId);

            setFormData({
              ...formData,
              title: exp.title || "",
              amount: exp.amount?.toString() || "",
              dueDate: exp.dueDate ? new Date(exp.dueDate).toISOString().split('T')[0] : "",
              categoryId: exp.categoryId || "",
              subcategoryId: exp.subcategoryId || "",
              tags: exp.tags || "",
              supplier: exp.supplier || "",
              costCenter: exp.costCenter || "",
              paymentMethod: exp.paymentMethod || "",
              accountOrCardId: acId,
              notes: exp.notes || "",
              updateMode: "SINGLE"
            });
          }
        }).catch(console.error).finally(() => setLoading(false));
      } else {
        // Reset form for create
        setHasSeries(false);
        setIsEditingSeries(false);
        setFormData({
          title: "", amount: "", dueDate: new Date().toISOString().split('T')[0],
          creationType: "SINGLE", frequency: "MONTHLY", installments: "2",
          categoryId: "", subcategoryId: "", tags: "", supplier: "", costCenter: "",
          paymentMethod: "", accountOrCardId: "", notes: "", updateMode: "SINGLE"
        });
      }

      // Load references
      fetch("/api/categories").then(res => res.json()).then(data => {
        if (Array.isArray(data)) setCategories(data);
      }).catch(console.error);

      fetch("/api/accounts").then(res => res.json()).then(data => {
        if (data.accounts) {
          // Filtra para mostrar apenas as contas que o usuário renomeou explicitamente
          const namedAccounts = data.accounts.filter((a: any) => a.hasCustomName);
          setAccounts(namedAccounts.filter((a: any) => a.type === 'BANK'));
          setCards(namedAccounts.filter((a: any) => a.type === 'CREDIT'));
        }
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
        type: formData.creationType,
        startDate: formData.dueDate,
        installments: parseInt(formData.installments, 10),
        amount: parseFloat(formData.amount.replace(',', '.')),
        accountId: (formData.accountOrCardId && !isCard) ? formData.accountOrCardId.replace('account_', '') : null,
        creditCardId: isCard ? formData.accountOrCardId.replace('card_', '') : null,
        categoryId: formData.categoryId || null,
        subcategoryId: formData.subcategoryId || null,
      };

      const url = expenseId ? `/api/expenses/${expenseId}` : "/api/expenses";
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
        const errorData = await res.json().catch(() => ({}));
        alert(`Erro ao salvar despesa: ${errorData.error || "Desconhecido"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar despesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="relative bg-[#1c1c1e] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 to-transparent">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </span>
              {expenseId ? "Editar Despesa" : "Nova Despesa"}
            </h2>
            <p className="text-xs text-white/50 mt-1 ml-11">Gerencie seus compromissos financeiros</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
          <form id="expenseForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Seção Principal */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Informações Básicas
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Título</label>
                  <input 
                    type="text" required
                    placeholder="Ex: Aluguel, Internet..."
                    className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Valor</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-white/40">R$</span>
                    <input 
                      type="number" step="0.01" required
                      placeholder="0,00"
                      className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono text-lg"
                      value={formData.amount}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Vencimento</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3 w-5 h-5 text-white/40" />
                    <input 
                      type="date" required
                      className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      value={formData.dueDate}
                      onChange={e => setFormData({...formData, dueDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Conta / Cartão</label>
                  <div className="relative">
                    <CardIcon className="absolute left-3.5 top-3 w-5 h-5 text-white/40" />
                    <select 
                      className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                      value={formData.accountOrCardId}
                      onChange={e => setFormData({...formData, accountOrCardId: e.target.value})}
                    >
                      <option value="">Não especificado</option>
                      <optgroup label="Contas Bancárias">
                        {accounts.map(a => <option key={a.id} value={`account_${a.dbId}`}>{a.name}</option>)}
                      </optgroup>
                      <optgroup label="Cartões de Crédito">
                        {cards.map(c => <option key={c.id} value={`card_${c.creditData?.id}`}>{c.name}</option>)}
                      </optgroup>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Recorrência (APENAS CRIAÇÃO) */}
            {!expenseId && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Repetição
                </div>
                
                <div className="flex gap-2 p-1 bg-[#2c2c2e] rounded-xl border border-white/5 w-fit">
                  {['SINGLE', 'RECURRING', 'INSTALLMENT'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, creationType: type as any})}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        formData.creationType === type 
                          ? "bg-emerald-500 text-emerald-950 shadow-md" 
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {type === 'SINGLE' ? 'Única' : type === 'RECURRING' ? 'Recorrente' : 'Parcelada'}
                    </button>
                  ))}
                </div>

                {formData.creationType === 'RECURRING' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Frequência</label>
                      <select 
                        className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                        value={formData.frequency}
                        onChange={e => setFormData({...formData, frequency: e.target.value})}
                      >
                        <option value="MONTHLY">Mensal</option>
                        <option value="WEEKLY">Semanal</option>
                        <option value="YEARLY">Anual</option>
                      </select>
                    </div>
                  </div>
                )}

                {formData.creationType === 'INSTALLMENT' && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Número de Parcelas</label>
                      <input 
                        type="number" min="2" max="120"
                        className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        value={formData.installments}
                        onChange={e => setFormData({...formData, installments: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Categorização */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                Categorização
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1.5 ml-1">Categoria Principal</label>
                  <select 
                    className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none"
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
                    className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none disabled:opacity-50"
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
                    type="text" placeholder="Separadas por vírgula (ex: viagem, familia, ifood)"
                    className="w-full bg-[#2c2c2e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    value={formData.tags}
                    onChange={e => setFormData({...formData, tags: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Modo de Atualização (APENAS EDIÇÃO COM SÉRIE) */}
            {expenseId && hasSeries && (
              <div className="space-y-4 pt-4 border-t border-amber-500/20 bg-amber-500/5 p-4 rounded-2xl border">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-500 uppercase tracking-wider mb-2">
                  <Briefcase className="w-4 h-4" />
                  Regras de Edição em Série
                </div>
                <p className="text-sm text-white/70 mb-4">Esta despesa faz parte de uma série. Como deseja salvar as alterações?</p>
                
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'SINGLE', label: 'Somente esta ocorrência', desc: 'Não afeta as outras despesas' },
                    { id: 'THIS_AND_FUTURE', label: 'Esta e as próximas', desc: 'Afeta esta e todas do futuro' },
                    { id: 'ALL', label: 'Todas as ocorrências', desc: 'Atualiza toda a série histórica' }
                  ].map(mode => (
                    <label key={mode.id} className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                      formData.updateMode === mode.id 
                        ? "bg-amber-500/10 border-amber-500/50" 
                        : "bg-[#2c2c2e] border-white/5 hover:bg-white/5"
                    )}>
                      <input 
                        type="radio" name="updateMode" value={mode.id}
                        className="w-4 h-4 text-amber-500 bg-transparent border-white/20 focus:ring-amber-500"
                        checked={formData.updateMode === mode.id}
                        onChange={() => setFormData({...formData, updateMode: mode.id as any})}
                      />
                      <div>
                        <p className={cn("font-medium", formData.updateMode === mode.id ? "text-amber-500" : "text-white")}>{mode.label}</p>
                        <p className="text-xs text-white/50 mt-0.5">{mode.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
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
            form="expenseForm"
            disabled={loading}
            className="px-8 py-3 bg-emerald-500 text-emerald-950 rounded-xl font-bold hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
              </span>
            ) : "Salvar Despesa"}
          </button>
        </div>
      </div>
    </div>
  );
}
