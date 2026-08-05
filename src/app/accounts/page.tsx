"use client";

import { useEffect, useState, useRef } from "react";
import { Landmark, Pencil, Check, X, User, Building2, Trash2 } from "lucide-react";
import { cn, getBankLogo, getBankBranding } from "@/lib/utils";
import { PluggyConnectButton } from "@/components/PluggyConnectButton";

const fmt = (v: number | undefined | null) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Account {
  id: string;
  itemId: string;
  institutionName: string;
  institutionLogo: string | null;
  name: string;
  number: string;
  type: string;
  balance: number;
  creditData?: { creditLimit: number; balance: number; availableCreditLimit: number } | null;
}

interface Label {
  customName: string;
  entityType: "PF" | "PJ";
}

const TYPE_LABEL: Record<string, string> = {
  BANK: "Conta Bancária",
  CREDIT: "Cartão de Crédito",
  INVESTMENT: "Investimento",
};

function EditModal({
  account,
  label,
  onSave,
  onClose,
}: {
  account: Account;
  label?: Label;
  onSave: (accountId: string, customName: string, entityType: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(label?.customName || account.name);
  const [entityType, setEntityType] = useState<"PF" | "PJ">(label?.entityType || "PF");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/account-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: account.id, customName: name, entityType }),
    });
    onSave(account.id, name, entityType);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Editar Conta</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {account.institutionLogo ? (
              <img src={account.institutionLogo} alt="" className="w-7 h-7 object-contain" />
            ) : (
              <Landmark className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{account.institutionName}</p>
            <p className="text-xs text-muted-foreground/60">{account.name}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Nome personalizado</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="Ex: Nubank PF, Nubank PJ, Inter Empresa..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Tipo de entidade</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setEntityType("PF")}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                entityType === "PF"
                  ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                  : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
              )}
            >
              <User className="w-4 h-4" />
              Pessoa Física
            </button>
            <button
              onClick={() => setEntityType("PJ")}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                entityType === "PJ"
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
              )}
            >
              <Building2 className="w-4 h-4" />
              Pessoa Jurídica
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [syncingConnections, setSyncingConnections] = useState<any[]>([]);
  const [labels, setLabels] = useState<Record<string, Label>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/account-labels").then((r) => r.json()),
    ])
      .then(([accountsData, labelsData]) => {
        if (accountsData.error) throw new Error(accountsData.error);
        setAccounts(accountsData.accounts);
        setSyncingConnections(accountsData.syncingConnections || []);
        setLabels(labelsData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveLabel = (accountId: string, customName: string, entityType: string) => {
    setLabels((prev) => ({
      ...prev,
      [accountId]: { customName, entityType: entityType as "PF" | "PJ" },
    }));
  };

  const getDisplayName = (account: Account) => {
    const label = labels[account.id];
    return label?.customName || account.name;
  };

  const handleDelete = async (itemId: string, bankName: string) => {
    if (!confirm(`Tem certeza que deseja remover o banco "${bankName}"? Isso apagará TODAS as contas e cartões associados a ele, além do histórico de transações. Você precisará reconectá-lo para ver os dados novamente.`)) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/connections/${itemId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao deletar banco");
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  const byType: Record<string, Account[]> = {};
  for (const a of accounts) {
    if (!byType[a.type]) byType[a.type] = [];
    byType[a.type].push(a);
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {editingAccount && (
        <EditModal
          account={editingAccount}
          label={labels[editingAccount.id]}
          onSave={handleSaveLabel}
          onClose={() => setEditingAccount(null)}
        />
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Contas</h1>
          <p className="text-muted-foreground">
            Todas as contas conectadas via Pluggy. Clique no ✏️ para personalizar o nome e marcar como PF ou PJ.
          </p>
        </div>
        <PluggyConnectButton onConnectSuccess={() => window.location.reload()} />
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-6 text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && syncingConnections.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            Conectando Bancos...
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {syncingConnections.map((conn) => (
              <div 
                key={conn.id} 
                className="group relative bg-card hover:bg-muted/50 border border-border rounded-2xl p-5 transition-all overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary to-primary/10 bg-[length:200%_100%] animate-shimmer" />
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground truncate">
                      {conn.institutionName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate font-mono">
                      {conn.status}
                    </p>
                    <p className="text-xs text-primary font-medium mt-1">
                      Puxando dados, aguarde...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && Object.entries(byType).map(([type, list]) => (
        <section key={type}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            {TYPE_LABEL[type] ?? type}
          </h2>
          <div className="space-y-3">
            {list.map((account) => {
              const label = labels[account.id];
              const displayName = getDisplayName(account);

              return (
                <div
                  key={account.id}
                  className="group flex items-center justify-between gap-4 rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {(() => {
                      const brand = getBankBranding(displayName);
                      return (
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border font-bold text-lg",
                          brand.bg,
                          brand.border
                        )}>
                          {brand.icon}
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">{displayName}</p>
                        {label?.entityType && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0",
                            label.entityType === "PF"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          )}>
                            {label.entityType === "PF" ? <><User className="w-2.5 h-2.5 inline mr-0.5" />PF</> : <><Building2 className="w-2.5 h-2.5 inline mr-0.5" />PJ</>}
                          </span>
                        )}
                        <button
                          onClick={() => setEditingAccount(account)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                          title="Editar nome"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.itemId, displayName)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0 ml-1"
                          title="Remover Banco (Deletar Conexão)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">{account.institutionName}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {type === "CREDIT" && account.creditData ? (
                      <div className="text-right space-y-0.5">
                        <p className="font-bold text-lg text-amber-500 mb-1">{fmt(account.creditData?.balance)}</p>
                        <p className="text-xs text-muted-foreground">Limite: <span className="font-semibold text-foreground">{fmt(account.creditData?.creditLimit)}</span></p>
                        <p className="text-xs text-muted-foreground">Disponível: <span className="font-semibold text-emerald-500">{fmt(account.creditData?.availableCreditLimit)}</span></p>
                        {(account as any).totalInstallments != null && (account as any).totalInstallments > 0 && (
                          <p className="text-xs text-purple-400 font-medium">
                            Parcelas futuras: {fmt((account as any).totalInstallments)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className={`font-bold text-lg ${(account.balance ?? 0) >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                        {fmt(account.balance)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {!loading && !error && accounts.length === 0 && (
        <div className="rounded-2xl bg-muted/50 border border-border p-12 text-center text-muted-foreground">
          Nenhuma conta encontrada. Verifique suas credenciais na página de Configurações.
        </div>
      )}
    </div>
  );
}
