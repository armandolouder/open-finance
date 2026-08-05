"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";

// Importa dinamicamente para evitar erros de SSR no Next.js
const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((mod) => mod.PluggyConnect),
  { ssr: false }
);

export function PluggyConnectButton({ onConnectSuccess }: { onConnectSuccess: () => void }) {
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const startConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/pluggy/token', { method: 'POST' });
      const data = await res.json();
      if (data.accessToken) {
        setConnectToken(data.accessToken);
      } else {
        alert("Erro ao gerar token: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao iniciar conexão.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSuccess = async (itemData: any) => {
    const itemId = itemData.item.id;
    try {
      await fetch('/api/pluggy/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      // Fecha o widget
      setConnectToken(null);
      // Notifica o pai para recarregar as contas
      onConnectSuccess();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar conexão local.");
    }
  };

  return (
    <>
      <button
        onClick={startConnect}
        disabled={isConnecting}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {isConnecting ? "Carregando..." : "Adicionar Banco"}
      </button>

      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          onSuccess={handleSuccess}
          onError={(error) => {
            console.error("Pluggy Error:", error);
            alert("Ocorreu um erro durante a conexão.");
          }}
          onClose={() => setConnectToken(null)}
        />
      )}
    </>
  );
}
