"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, AlertTriangle, CheckCircle2, Loader2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface PreviewTransaction {
  date: string;
  description: string;
  amount: number;
}

interface ImportResult {
  csvTotal?: number;
  newCount?: number;
  duplicateCount?: number;
  newTransactions?: PreviewTransaction[];
  imported?: number;
  duplicatesSkipped?: number;
  message?: string;
  error?: string;
}

interface Props {
  cardId: string;
  currentTotal: number;   // total calculado pelo nosso banco
  onImportDone: () => void; // callback para refetch após importação
}

export function CsvImportButton({ cardId, currentTotal, onImportDone }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<"idle" | "preview" | "done">("idle");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAll, setShowAll] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Por favor, selecione um arquivo .csv");
      return;
    }
    setSelectedFile(file);
    setLoading(true);
    setStep("idle");
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dryRun", "true");

      const res = await fetch(`/api/cards/${cardId}/import-csv`, {
        method: "POST",
        body: formData,
      });
      const data: ImportResult = await res.json();

      if (data.error) throw new Error(data.error);

      setPreview(data);
      setStep("preview");
    } catch (e: any) {
      alert("Erro ao processar arquivo: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const confirmImport = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("dryRun", "false");

      const res = await fetch(`/api/cards/${cardId}/import-csv`, {
        method: "POST",
        body: formData,
      });
      const data: ImportResult = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
      setStep("done");
      onImportDone();
    } catch (e: any) {
      alert("Erro ao importar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("idle");
    setPreview(null);
    setResult(null);
    setSelectedFile(null);
    setShowAll(false);
  };

  const newTotal = preview
    ? currentTotal + (preview.newTransactions?.reduce((s, t) => s + Math.abs(t.amount), 0) ?? 0)
    : currentTotal;

  return (
    <div className="w-full">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o => !o); reset(); }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 text-sm font-medium transition-all"
      >
        <Upload className="w-4 h-4" />
        Importar CSV do Nubank
      </button>

      {open && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0d0d0d] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-foreground">
                Importar extrato CSV
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full uppercase tracking-wider font-medium">
                Nubank
              </span>
            </div>
            <button onClick={() => { setOpen(false); reset(); }} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* STEP: IDLE — Upload area */}
            {step === "idle" && (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Baixe o extrato da fatura no app Nubank <span className="text-foreground font-medium">(Fatura → compartilhar → CSV)</span> e faça o upload abaixo. Só os lançamentos que não existem no nosso banco serão importados.
                </p>

                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all",
                    isDragging
                      ? "border-blue-400 bg-blue-500/10"
                      : "border-white/10 hover:border-blue-400/50 hover:bg-white/[0.02]"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        Arraste o arquivo aqui ou <span className="text-blue-400">clique para selecionar</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground/60">Somente arquivos .csv</p>
                    </>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}

            {/* STEP: PREVIEW */}
            {step === "preview" && preview && (
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{preview.csvTotal}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">No CSV</p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{preview.newCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Novos</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-muted-foreground">{preview.duplicateCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Já existem</p>
                  </div>
                </div>

                {/* Divergence alert */}
                {preview.newCount && preview.newCount > 0 ? (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-300">
                        {preview.newCount} lançamento{preview.newCount > 1 ? "s" : ""} faltando no banco
                      </p>
                      <p className="text-amber-400/70 text-xs mt-1">
                        Total atual: <span className="font-mono">{fmt(currentTotal)}</span>
                        {" → "}
                        Após importação: <span className="font-mono font-semibold">{fmt(newTotal)}</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-emerald-300">
                      Tudo sincronizado! Nenhum lançamento novo encontrado no CSV.
                    </p>
                  </div>
                )}

                {/* List of new transactions */}
                {preview.newTransactions && preview.newTransactions.length > 0 && (
                  <div className="rounded-xl border border-white/5 overflow-hidden">
                    <div className="px-4 py-3 bg-white/[0.03] flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Lançamentos a importar
                      </p>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        {fmt(preview.newTransactions.reduce((s, t) => s + Math.abs(t.amount), 0))}
                      </span>
                    </div>
                    <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                      {(showAll ? preview.newTransactions : preview.newTransactions.slice(0, 5)).map((tx, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{tx.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                          </div>
                          <p className="text-xs font-mono font-semibold text-foreground shrink-0">
                            {fmt(Math.abs(tx.amount))}
                          </p>
                        </div>
                      ))}
                    </div>
                    {preview.newTransactions.length > 5 && (
                      <button
                        onClick={() => setShowAll(s => !s)}
                        className="w-full flex items-center justify-center gap-1 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors bg-white/[0.02]"
                      >
                        {showAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {showAll ? "Ver menos" : `Ver mais ${preview.newTransactions.length - 5} lançamentos`}
                      </button>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={reset}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  {(preview.newCount ?? 0) > 0 && (
                    <button
                      onClick={confirmImport}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Importar {preview.newCount} lançamento{(preview.newCount ?? 0) > 1 ? "s" : ""}</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* STEP: DONE */}
            {step === "done" && result && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Importação concluída!</p>
                    <p className="text-xs text-emerald-400/70 mt-1">{result.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setOpen(false); reset(); }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium text-foreground transition-all"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
