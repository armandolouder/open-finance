"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Trash2, Search, CornerDownRight, Edit2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("VARIABLE");
  const [newCatColor, setNewCatColor] = useState("#64748b");

  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [subCatName, setSubCatName] = useState("");
  const [subCatColor, setSubCatColor] = useState("");

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editType, setEditType] = useState("");
  const [editIgnore, setEditIgnore] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error("API Error:", data);
        setCategories([]);
      }
    } catch (e) {
      console.error(e);
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
        body: JSON.stringify({ name: newCatName, type: newCatType, color: newCatColor, rules: [] })
      });
      setNewCatName("");
      fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSub = async (parentId: string, parentType: string, parentColor: string) => {
    if (!subCatName) return;
    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: subCatName, 
          type: parentType, 
          color: subCatColor || parentColor, 
          rules: [],
          parentId
        })
      });
      setSubCatName("");
      setAddingSubTo(null);
      fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar? Isso apagará também as regras (e subcategorias, se houver).")) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (e) {
      console.error(e);
    }
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
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVisibility = async (cat: any) => {
    try {
      await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnHome: !cat.showOnHome })
      });
      fetchCategories();
    } catch (e) {
      console.error(e);
    }
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
    } catch (e) {
      console.error(e);
    }
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
    } catch (e) {
      console.error(e);
    }
  };

  const renderRules = (cat: any) => (
    <div className="mt-4 pt-3 border-t border-white/5">
      <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5 opacity-70">
        <Search className="w-3 h-3" />
        Palavras-chave
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        {cat.rules.map((rule: any) => (
          <span key={rule.id} className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-md font-mono flex items-center gap-1">
            {rule.pattern}
            <button 
              onClick={() => handleRemoveRule(cat, rule.pattern)}
              className="hover:text-foreground opacity-70 hover:opacity-100"
            >×</button>
          </span>
        ))}
      </div>
      <input 
        type="text" 
        placeholder="Ex: uber (Enter para add)"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleAddRule(cat, e.currentTarget.value.trim());
            e.currentTarget.value = '';
          }
        }}
        className="w-full bg-background/50 border border-border/50 text-foreground text-[11px] rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50 font-mono placeholder:text-muted-foreground/50"
      />
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Categorias</h1>
        <p className="text-muted-foreground">Organize categorias, subcategorias, defina cores e as regras do Motor de Classificação.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Nova Categoria Principal</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
            <input 
              type="text" 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Ex: Alimentação"
              className="w-full bg-muted border border-border text-foreground text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="w-full md:w-32 shrink-0">
            <label className="block text-sm font-medium text-foreground mb-1.5">Cor Hex</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-10 h-10 p-1 bg-muted border border-border rounded-lg cursor-pointer"
              />
              <input 
                type="text" 
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-full bg-muted border border-border text-foreground text-sm rounded-lg px-2 focus:outline-none focus:ring-2 focus:ring-primary/50 uppercase font-mono"
              />
            </div>
          </div>
          <div className="w-full md:w-40 shrink-0">
            <label className="block text-sm font-medium text-foreground mb-1.5">Tipo</label>
            <select 
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value)}
              className="w-full bg-muted border border-border text-foreground text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="VARIABLE">Variável</option>
              <option value="FIXED">Fixa</option>
              <option value="ESSENTIAL">Essencial</option>
              <option value="NON_ESSENTIAL">Supérfluo</option>
            </select>
          </div>
          <button 
            onClick={handleCreate}
            disabled={!newCatName}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 h-[42px]"
          >
            <Plus className="w-4 h-4" />
            Criar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-10 opacity-50">Carregando categorias...</div>
        ) : categories.map(cat => (
          <div key={cat.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            
            <div className="flex justify-between items-start mb-4">
              {editingCatId === cat.id ? (
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2 items-end">
                    <div className="flex-1 w-full">
                      <input 
                        type="text" autoFocus
                        value={editName} onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>
                    <div className="w-full sm:w-28 shrink-0 flex gap-2">
                      <input 
                        type="color" 
                        value={editColor} onChange={(e) => setEditColor(e.target.value)}
                        className="w-[34px] h-[34px] p-0.5 bg-background border border-border rounded-lg cursor-pointer"
                      />
                      <select 
                        value={editType} onChange={(e) => setEditType(e.target.value)}
                        className="flex-1 bg-background border border-border text-foreground text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="VARIABLE">Variável</option>
                        <option value="FIXED">Fixa</option>
                        <option value="ESSENTIAL">Essen.</option>
                        <option value="NON_ESSENTIAL">Supérf.</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox" 
                      id="editIgnore"
                      checked={editIgnore}
                      onChange={(e) => setEditIgnore(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500"
                    />
                    <label htmlFor="editIgnore" className="text-sm font-medium text-foreground cursor-pointer select-none">
                      Ignorar nas Somas Totais (Neutro - Ex: Pró-labore)
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => handleSaveEdit(cat)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded-md text-xs font-medium">Salvar</button>
                    <button onClick={() => setEditingCatId(null)} className="bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded-md text-xs font-medium">Cancelar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: cat.color || '#64748b' }}
                    />
                    <div>
                      <h3 className="text-lg font-bold text-foreground tracking-tight">{cat.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">{cat.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleToggleVisibility(cat)}
                      title={cat.showOnHome ? "Visível na Home" : "Oculto na Home"}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        cat.showOnHome ? "text-emerald-500 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-white/5"
                      )}
                    >
                      {cat.showOnHome ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-50" />}
                    </button>
                    <button 
                      onClick={() => startEdit(cat)}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-white/5 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setAddingSubTo(addingSubTo === cat.id ? null : cat.id);
                        setSubCatColor(cat.color || '');
                        setSubCatName('');
                      }}
                      className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Subcategoria
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {renderRules(cat)}

            {addingSubTo === cat.id && (
              <div className="mt-5 p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Nome da Subcategoria</label>
                  <input 
                    type="text" autoFocus
                    value={subCatName} onChange={(e) => setSubCatName(e.target.value)}
                    placeholder="Ex: Supermercado"
                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="w-full sm:w-32 shrink-0">
                  <label className="block text-xs font-medium text-foreground/70 mb-1">Cor Opcional</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={subCatColor} onChange={(e) => setSubCatColor(e.target.value)}
                      className="w-[38px] h-[38px] p-0.5 bg-background border border-border rounded-lg cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={subCatColor} onChange={(e) => setSubCatColor(e.target.value)}
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg px-2 focus:outline-none focus:ring-1 focus:ring-primary/50 uppercase font-mono"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => handleCreateSub(cat.id, cat.type, cat.color)}
                  disabled={!subCatName}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium disabled:opacity-50 h-[38px]"
                >Salvar</button>
              </div>
            )}

            {cat.children && cat.children.length > 0 && (
              <div className="mt-6 space-y-4 pl-4 md:pl-8 border-l-2 border-white/5">
                {cat.children.map((sub: any) => (
                  <div key={sub.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 relative group/sub">
                    <div className="flex justify-between items-start mb-2">
                      {editingCatId === sub.id ? (
                        <div className="flex-1 flex flex-col sm:flex-row gap-2 items-end">
                          <div className="flex-1 w-full">
                            <input 
                              type="text" autoFocus
                              value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                          </div>
                          <div className="w-full sm:w-20 shrink-0 flex gap-2">
                            <input 
                              type="color" 
                              value={editColor} onChange={(e) => setEditColor(e.target.value)}
                              className="w-[34px] h-[34px] p-0.5 bg-background border border-border rounded-lg cursor-pointer"
                            />
                          </div>
                          <div className="flex gap-1 h-[34px]">
                            <button onClick={() => handleSaveEdit(sub)} className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded-md text-xs font-medium">Salvar</button>
                            <button onClick={() => setEditingCatId(null)} className="bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded-md text-xs font-medium">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <CornerDownRight className="w-4 h-4 text-muted-foreground/50" />
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: sub.color || cat.color || '#64748b' }}
                            />
                            <h4 className="text-sm font-semibold text-foreground/90">{sub.name}</h4>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-all">
                            <button 
                              onClick={() => handleToggleVisibility(sub)}
                              title={sub.showOnHome ? "Visível na Home" : "Oculto na Home"}
                              className={cn(
                                "p-1 rounded-md transition-colors",
                                sub.showOnHome ? "text-emerald-500/80 hover:bg-emerald-500/10 hover:text-emerald-500" : "text-muted-foreground/50 hover:text-foreground hover:bg-white/5"
                              )}
                            >
                              {sub.showOnHome ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-50" />}
                            </button>
                            <button 
                              onClick={() => startEdit(sub)}
                              className="text-muted-foreground/50 hover:text-foreground p-1 rounded-md hover:bg-white/5 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(sub.id)}
                              className="text-muted-foreground/50 hover:text-destructive p-1 rounded-md hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="pl-6">
                      {renderRules(sub)}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
