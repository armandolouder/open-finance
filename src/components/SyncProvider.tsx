"use client";

import React, { createContext, useContext, useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, X } from "lucide-react";

interface SyncResult {
  items: any[];
}

interface SyncContextType {
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  lastSyncError: string | null;
  startSync: () => Promise<void>;
  hideToast: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const startSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setLastSyncResult(null);
    setLastSyncError(null);
    setShowToast(true);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro desconhecido ao sincronizar");
      }

      setLastSyncResult(data);
    } catch (err: any) {
      setLastSyncError(err.message);
    } finally {
      setIsSyncing(false);
      // Ocultar toast de sucesso após 5 segundos, mas deixar erro aberto
      setTimeout(() => {
        if (!lastSyncError) setShowToast(false);
      }, 5000);
    }
  };

  const hideToast = () => setShowToast(false);

  return (
    <SyncContext.Provider value={{ isSyncing, lastSyncResult, lastSyncError, startSync, hideToast }}>
      {children}
      {/* Global Toast */}
      {showToast && (
        <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-[100] max-w-sm w-full bg-card border border-border shadow-2xl rounded-2xl p-4 flex gap-4 animate-in slide-in-from-bottom-5">
          <div className="shrink-0 mt-0.5">
            {isSyncing ? (
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            ) : lastSyncError ? (
              <AlertCircle className="w-5 h-5 text-destructive" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm">
              {isSyncing ? "Sincronizando com os Bancos..." : lastSyncError ? "Falha na Sincronização" : "Sincronização Concluída!"}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              {isSyncing
                ? "Este processo está rodando em segundo plano. Você pode continuar navegando livremente."
                : lastSyncError
                ? lastSyncError
                : "Os lançamentos de todas as conexões ativas foram importados."}
            </p>
          </div>
          <button onClick={hideToast} className="shrink-0 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </SyncContext.Provider>
  );
}

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within SyncProvider");
  return context;
};
