"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Trash2, Search, CornerDownRight, Edit2, Eye, EyeOff, X, ChevronDown, ChevronRight, Palette, Sparkles, Check, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#64748b", "#78716c", "#a3a3a3",
];

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  VARIABLE: { label: "Variável", color: "bg-amber-500/15 text-amber-400" },
  FIXED: { label: "Fixa", color: "bg-blue-500/15 text-blue-400" },
  ESSENTIAL: { label: "Essencial", color: "bg-emerald-500/15 text-emerald-400" },
  NON_ESSENTIAL: { label: "Supérfluo", color: "bg-rose-500/15 text-rose-400" },
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("VARIABLE");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [newCatParentId, setNewCatParentId] = useState<string | null>(null);

  // Edit inline
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editType, setEditType] = useState("");
  const [editIgnore, setEditIgnore] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
        // Auto-expand all
        setExpandedCats(new Set(data.map((c: any) => c.id)));
      } else {
        setCategories([]);
      }
    } catch (e) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCatName) return;
    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName, type: newCatType, color: newCatColor, rules: [], parentId: newCatParentId })
      });
      setNewCatName("");
      setNewCatParentId(null);
      setShowCreateModal(false);
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Subcategorias e regras serão apagadas.")) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  const startEdit = (cat: any) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color || "#64748b");
    setEditType(cat.type);
    setEditIgnore(cat.ignoreInTotals || false);
  };

  const handleSaveEdit = async (cat: any) => {
    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, color: editColor, type: editType, ignoreInTotals: editIgnore })
      });
      setEditingCatId(null);
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  const handleToggleVisibility = async (cat: any) => {
    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHome: !cat.showOnHome })
      });
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  const handleAddRule = async (cat: any, pattern: string) => {
    if (!pattern) return;
    const rules = cat.rules.map((r: any) => r.pattern);
    if (rules.includes(pattern)) return;
    rules.push(pattern);
    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cat, rules })
      });
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  const handleRemoveRule = async (cat: any, pattern: string) => {
    const rules = cat.rules.map((r: any) => r.pattern).filter((p: string) => p !== pattern);
    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cat, rules })
      });
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  const toggleExpand = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.children?.some((sub: any) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalCats = categories.length;
  const totalSubs = categories.reduce((acc, c) => acc + (c.children?.length || 0), 0);
  const totalRules = categories.reduce((acc, c) => acc + (c.rules?.length || 0) + (c.children || []).reduce((a: number, s: any) => a + (s.rules?.length || 0), 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Categorias</h1>
          <p className="text-muted-foreground text-sm mt-1">Organize a taxonomia financeira do seu sistema.</p>
        </div>
        <button
          onClick={() => { setNewCatParentId(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 bg-white text-black font-semibold px-5 py-2.5 rounded-2xl hover:bg-white/90 transition-all shadow-lg shadow-white/10 hover:shadow-white/20 active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalCats}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Categorias</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalSubs}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Subcategorias</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalRules}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Regras de Classificação</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          placeholder="Buscar categorias ou subcategorias..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories List */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">Carregando categorias...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-2xl">
          <Tag className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma categoria encontrada</p>
          <p className="text-xs mt-1">Crie uma nova categoria para começar a organizar suas transações.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cat => {
            const isExpanded = expandedCats.has(cat.id);
            const hasSubs = cat.children && cat.children.length > 0;
            const typeInfo = TYPE_LABELS[cat.type] || TYPE_LABELS.VARIABLE;
            const isEditing = editingCatId === cat.id;

            return (
              <div key={cat.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Category Header */}
                <div className="p-4 flex items-center gap-3">
                  {/* Expand button */}
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  {/* Color dot */}
                  <div
                    className="w-5 h-5 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
                    style={{ backgroundColor: cat.color || '#64748b', boxShadow: `0 0 12px ${cat.color || '#64748b'}40` }}
                  />

                  {/* Name & Type */}
                  {isEditing ? (
                    <div className="flex-1 flex flex-wrap gap-2 items-center">
                      <input
                        type="text" autoFocus
                        value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="bg-muted border border-border text-foreground text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
                      />
                      <div className="flex gap-1">
                        {PRESET_COLORS.slice(0, 10).map(c => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className={cn("w-5 h-5 rounded-full transition-transform hover:scale-125", editColor === c && "ring-2 ring-white scale-110")}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <select
                        value={editType} onChange={(e) => setEditType(e.target.value)}
                        className="bg-muted border border-border text-foreground text-xs rounded-xl px-3 py-1.5 focus:outline-none"
                      >
                        <option value="VARIABLE">Variável</option>
                        <option value="FIXED">Fixa</option>
                        <option value="ESSENTIAL">Essencial</option>
                        <option value="NON_ESSENTIAL">Supérfluo</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIgnore}
                          onChange={(e) => setEditIgnore(e.target.checked)}
                          className="rounded border-border"
                        />
                        Ignorar nos totais
                      </label>
                      <button onClick={() => handleSaveEdit(cat)} className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Salvar
                      </button>
                      <button onClick={() => setEditingCatId(null)} className="text-muted-foreground hover:text-foreground text-xs px-2 py-1">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <h3 className="text-sm font-bold text-foreground truncate">{cat.name}</h3>
                      <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg", typeInfo.color)}>
                        {typeInfo.label}
                      </span>
                      {hasSubs && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          {cat.children.length} sub
                        </span>
                      )}
                      {cat.rules.length > 0 && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                          {cat.rules.length} regras
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleVisibility(cat)}
                        title={cat.showOnHome ? "Visível na Home" : "Oculto na Home"}
                        className={cn("p-1.5 rounded-lg transition-colors", cat.showOnHome ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground/50 hover:bg-white/5")}
                      >
                        {cat.showOnHome ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => startEdit(cat)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setNewCatParentId(cat.id); setNewCatColor(cat.color || '#64748b'); setNewCatType(cat.type); setShowCreateModal(true); }}
                        className="text-primary hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                        title="Adicionar subcategoria"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Rules */}
                    <div className="px-5 py-3 bg-muted/10">
                      <div className="flex flex-wrap items-center gap-2">
                        <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider shrink-0">Regras:</span>
                        {cat.rules.map((rule: any) => (
                          <span key={rule.id} className="bg-primary/10 text-primary text-[11px] px-2.5 py-0.5 rounded-lg font-mono flex items-center gap-1.5 group/rule">
                            {rule.pattern}
                            <button
                              onClick={() => handleRemoveRule(cat, rule.pattern)}
                              className="opacity-0 group-hover/rule:opacity-100 hover:text-destructive transition-opacity"
                            >×</button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder="+ nova regra (Enter)"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddRule(cat, e.currentTarget.value.trim());
                              e.currentTarget.value = '';
                            }
                          }}
                          className="bg-transparent border-b border-dashed border-border text-foreground text-[11px] px-2 py-1 focus:outline-none focus:border-primary font-mono placeholder:text-muted-foreground/40 w-36"
                        />
                      </div>
                    </div>

                    {/* Subcategories */}
                    {hasSubs && (
                      <div className="divide-y divide-border">
                        {cat.children.map((sub: any) => {
                          const isSubEditing = editingCatId === sub.id;
                          return (
                            <div key={sub.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors group/sub">
                              <div className="w-5 flex justify-center">
                                <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                              </div>
                              <div
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{ backgroundColor: sub.color || cat.color || '#64748b' }}
                              />

                              {isSubEditing ? (
                                <div className="flex-1 flex flex-wrap gap-2 items-center">
                                  <input
                                    type="text" autoFocus
                                    value={editName} onChange={(e) => setEditName(e.target.value)}
                                    className="bg-muted border border-border text-foreground text-sm rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 w-40"
                                  />
                                  <div className="flex gap-1">
                                    {PRESET_COLORS.slice(0, 8).map(c => (
                                      <button
                                        key={c}
                                        onClick={() => setEditColor(c)}
                                        className={cn("w-4 h-4 rounded-full transition-transform hover:scale-125", editColor === c && "ring-2 ring-white scale-110")}
                                        style={{ backgroundColor: c }}
                                      />
                                    ))}
                                  </div>
                                  <button onClick={() => handleSaveEdit(sub)} className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg text-xs font-medium">Salvar</button>
                                  <button onClick={() => setEditingCatId(null)} className="text-muted-foreground text-xs px-2 py-0.5">Cancelar</button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-sm font-medium text-foreground/90 flex-1 truncate">{sub.name}</span>
                                  {sub.rules.length > 0 && (
                                    <div className="flex gap-1.5">
                                      {sub.rules.map((r: any) => (
                                        <span key={r.id} className="bg-white/5 text-muted-foreground text-[10px] px-2 py-0.5 rounded font-mono">{r.pattern}</span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex gap-0.5 opacity-0 group-hover/sub:opacity-100 transition-all shrink-0">
                                    <button onClick={() => handleToggleVisibility(sub)} className={cn("p-1 rounded-md transition-colors", sub.showOnHome ? "text-emerald-500/80" : "text-muted-foreground/40")}>
                                      {sub.showOnHome ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    </button>
                                    <button onClick={() => startEdit(sub)} className="text-muted-foreground/50 hover:text-foreground p-1 rounded-md">
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(sub.id)} className="text-muted-foreground/50 hover:text-destructive p-1 rounded-md">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-[#1c1c1e] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5 bg-gradient-to-r from-violet-500/10 to-transparent">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="p-2 bg-violet-500/20 text-violet-400 rounded-lg">
                    <Tag className="w-5 h-5" />
                  </span>
                  {newCatParentId ? "Nova Subcategoria" : "Nova Categoria"}
                </h2>
                {newCatParentId && (
                  <p className="text-xs text-white/50 mt-1 ml-11">
                    Dentro de: {categories.find(c => c.id === newCatParentId)?.name}
                  </p>
                )}
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Nome</label>
                <input
                  type="text" autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Ex: Alimentação, Transporte..."
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-white/30"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewCatColor(c)}
                      className={cn(
                        "w-8 h-8 rounded-xl transition-all duration-200 hover:scale-110",
                        newCatColor === c && "ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e] scale-110"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Type */}
              {!newCatParentId && (
                <div>
                  <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(TYPE_LABELS).map(([key, info]) => (
                      <button
                        key={key}
                        onClick={() => setNewCatType(key)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                          newCatType === key
                            ? "border-white/30 bg-white/10 text-white"
                            : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/5"
                        )}
                      >
                        {info.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-0">
              <button
                onClick={handleCreate}
                disabled={!newCatName}
                className="w-full bg-white text-black font-semibold py-3 rounded-2xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-white/10 active:scale-[0.98]"
              >
                Criar {newCatParentId ? "Subcategoria" : "Categoria"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
