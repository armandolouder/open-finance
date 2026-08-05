"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountSettingsModalProps {
  account: any;
  onClose: () => void;
  onSaved: () => void;
}

const COLORS = [
  { id: 'emerald', bg: 'bg-emerald-500' },
  { id: 'blue', bg: 'bg-blue-500' },
  { id: 'purple', bg: 'bg-purple-500' },
  { id: 'red', bg: 'bg-red-500' },
  { id: 'orange', bg: 'bg-orange-500' },
  { id: 'neutral', bg: 'bg-neutral-500' },
];

export function AccountSettingsModal({ account, onClose, onSaved }: AccountSettingsModalProps) {

  const [investments, setInvestments] = useState((account.investments || 0).toString());
  const [customColor, setCustomColor] = useState(account.customColor || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    
    const num = parseFloat(investments.replace(/[^\d.,-]/g, '').replace(',', '.'));
    const finalInvestments = isNaN(num) ? 0 : num;

    try {
      await fetch('/api/account-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: account.id, 
          settings: { 
            investments: finalInvestments,
            customColor: customColor || undefined 
          } 
        })
      });
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <h2 className="text-sm font-bold tracking-wider uppercase text-foreground">Configurações da Conta</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/20 rounded-full transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">


          {/* INVESTIMENTOS */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Valor Investido</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">R$</span>
              <input 
                type="text" 
                value={investments}
                onChange={e => setInvestments(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="0,00"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">Usado caso o Pluggy não sincronize os investimentos automaticamente.</p>
          </div>

          {/* COR */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Cor do Card</label>
            <div className="flex gap-3">
              <button 
                className={cn("w-8 h-8 rounded-full border-2 transition-transform", customColor === "" ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-100", "bg-gradient-to-br from-neutral-800 to-black flex items-center justify-center")}
                onClick={() => setCustomColor("")}
                title="Automático"
              >
                <span className="text-[10px] font-bold">Auto</span>
              </button>
              {COLORS.map(c => (
                <button 
                  key={c.id}
                  className={cn("w-8 h-8 rounded-full border-2 transition-transform", customColor === c.id ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-100", c.bg)}
                  onClick={() => setCustomColor(c.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold tracking-wider uppercase rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
