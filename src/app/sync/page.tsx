"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false }
);

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateToken, setUpdateToken] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const handleUpdateItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      const res = await fetch('/api/pluggy/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      const data = await res.json();
      if (data.accessToken) {
        setUpdateToken(data.accessToken);
      } else {
        alert("Erro ao gerar token de atualização: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao iniciar reconexão.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro desconhecido");
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <h1 className="text-2xl font-bold text-foreground">Sincronização e Conexões</h1>
      
      <div className="bg-card border border-border rounded-xl p-8">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-card-foreground mb-2">Conectar com a Pluggy</h2>
          <p className="text-muted-foreground text-sm">
            Nesta etapa, testaremos a comunicação com a API da Pluggy e salvaremos o status dos seus Items no banco de dados local.
          </p>
        </div>

        <button 
          onClick={testConnection}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Sincronizando..." : "Forçar Sincronização com a Pluggy"}
        </button>

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-destructive">Falha na Conexão</h4>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-foreground">Resultado do Teste:</h3>
            <div className="space-y-3">
              {results.items?.map((item: any, idx: number) => (
                <div key={idx} className="bg-muted p-4 rounded-lg border border-border flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.institution || "Instituição Desconhecida"}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">Item ID: {item.itemId}</p>
                    {item.error && <p className="text-xs text-destructive mt-1">{item.error}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'UPDATED' || item.status === 'LOGIN_ERROR' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Encontrado
                      </span>
                    ) : item.status === 'ERROR' ? (
                      <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Erro
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-semibold">
                        {item.status}
                      </span>
                    )}
                    <button
                      onClick={() => handleUpdateItem(item.itemId)}
                      disabled={updatingItemId === item.itemId}
                      className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-lg transition-colors"
                      title="Reconectar no banco para puxar dados atualizados do Sandbox"
                    >
                      {updatingItemId === item.itemId ? "Aguarde..." : "Reconectar / Atualizar Foto"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {updateToken && (
        <PluggyConnect
          connectToken={updateToken}
          onSuccess={() => {
            setUpdateToken(null);
            testConnection(); // Refetch status and trigger sync
          }}
          onError={(error) => {
            console.error("Pluggy Error:", error);
            alert("Ocorreu um erro durante a atualização.");
          }}
          onClose={() => setUpdateToken(null)}
        />
      )}
    </div>
  );
}
