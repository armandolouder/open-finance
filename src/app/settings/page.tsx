"use client";

import { useState, useEffect } from "react";
import { Key, Link as LinkIcon, Save, Webhook, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"api" | "webhooks">("api");
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    // Buscar credenciais atuais para preencher a tela
    fetch("/api/settings/credentials")
      .then(res => res.json())
      .then(data => {
        if (data.clientId) setClientId(data.clientId);
        if (data.hasSecret) setClientSecret("••••••••••••••••");
      })
      .catch(console.error);

    // Buscar Webhook configurado
    fetch("/api/settings/webhook")
      .then(res => res.json())
      .then(data => {
        if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
      })
      .catch(console.error);
  }, []);

  const handleSaveAPI = async () => {
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar credenciais");
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/settings/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar webhook");
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoDetectWebhook = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setWebhookUrl(`${origin}/api/pluggy/webhook`);
  };

  return (
    <div className="space-y-8 max-w-5xl pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as credenciais da sua aplicação e integrações.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda - Navegação/Tópicos */}
        <div className="space-y-2">
          <button 
            onClick={() => setActiveTab("api")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border transition-colors",
              activeTab === "api" 
                ? "bg-primary/10 text-primary border-primary/20" 
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Key className="w-5 h-5" />
            Credenciais da API
          </button>
          <button 
            onClick={() => setActiveTab("webhooks")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border transition-colors",
              activeTab === "webhooks" 
                ? "bg-primary/10 text-primary border-primary/20" 
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Webhook className="w-5 h-5" />
            Webhooks
          </button>
        </div>

        {/* Coluna da Direita - Formulários */}
        <div className="md:col-span-2 space-y-6">
          
          {activeTab === "api" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  Credenciais da Pluggy
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure suas chaves para habilitar a conexão com a API.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Client ID</label>
                  <input 
                    type="text" 
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Ex: 5f9b3b3b-1b1b-4b3b-8b3b-9b3b3b3b3b3b"
                    className="w-full bg-muted border border-border text-foreground text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Client Secret</label>
                  <input 
                    type="password" 
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Coloque seu secret aqui"
                    className="w-full bg-muted border border-border text-foreground text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    O Client Secret será salvo localmente e processado com segurança no servidor via <code className="bg-muted px-1 rounded text-primary">.env.local</code>.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  {status === "success" && (
                    <span className="text-emerald-500 text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
                    </span>
                  )}
                  {status === "error" && (
                    <span className="text-destructive text-sm font-medium flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {errorMessage}
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleSaveAPI}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "webhooks" && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-primary" />
                  URL do Webhook
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Defina o endereço que a Pluggy usará para notificar seu aplicativo sobre sincronizações.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5 flex justify-between">
                    <span>Webhook URL</span>
                    <button 
                      onClick={autoDetectWebhook}
                      className="text-primary hover:underline text-xs flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      Auto-detectar URL
                    </button>
                  </label>
                  <input 
                    type="url" 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://seu-dominio.com/api/pluggy/webhook"
                    className="w-full bg-muted border border-border text-foreground text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Se você estiver testando localmente, use um serviço como <strong>ngrok</strong> (ex: <code className="bg-muted px-1 rounded">https://xyz.ngrok-free.app/api/pluggy/webhook</code>).
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div>
                  {status === "success" && (
                    <span className="text-emerald-500 text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
                    </span>
                  )}
                  {status === "error" && (
                    <span className="text-destructive text-sm font-medium flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> {errorMessage}
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleSaveWebhook}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Salvando..." : "Salvar Configuração"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
