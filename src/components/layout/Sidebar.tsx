"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Landmark, ArrowRightLeft, CreditCard, 
  Receipt, TrendingUp, RefreshCw, Settings, Sparkles, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Visão Geral", href: "/", icon: LayoutDashboard },
  { name: "Contas", href: "/accounts", icon: Landmark },
  { name: "Transações", href: "/transactions", icon: ArrowRightLeft },
  { name: "Cartões", href: "/cards", icon: CreditCard },
  { name: "Faturas", href: "/bills", icon: Receipt },
  { name: "Despesas", href: "/expenses", icon: Receipt },
  { name: "Investimentos", href: "/investments", icon: TrendingUp },
  { name: "Sincronização", href: "/sync", icon: RefreshCw },
  { name: "Categorias", href: "/categories", icon: Tag },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col h-full relative z-20">
      <div className="h-24 flex items-center px-8 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-sidebar-foreground">
            Finance<span className="text-primary">Local</span>
          </h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-8">
        <div className="px-4 mb-4">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-4 px-4">Menu Principal</p>
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden",
                      isActive 
                        ? "text-sidebar-primary-foreground bg-sidebar-primary shadow-md shadow-primary/20" 
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                    )} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="p-6 border-t border-sidebar-border shrink-0">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
           <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-primary/20 transition-colors" />
           <p className="text-xs text-muted-foreground mb-1">Status da Sincronização</p>
           <div className="flex items-center gap-2 text-sm text-primary font-medium">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-sm" />
             Conectado à Pluggy
           </div>
        </div>
      </div>
    </div>
  );
}
