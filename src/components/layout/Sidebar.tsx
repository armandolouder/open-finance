"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Landmark, ArrowRightLeft, CreditCard, 
  Receipt, TrendingUp, RefreshCw, Settings, Sparkles, Tag
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    title: "CONTROLE",
    items: [
      { name: "Insights", href: "/investments/insights", icon: Sparkles },
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Despesas", href: "/expenses", icon: Receipt },
      { name: "Transações", href: "/transactions", icon: ArrowRightLeft },
      { name: "Cartões", href: "/cards", icon: CreditCard },
      { name: "Investimentos", href: "/investments", icon: TrendingUp },
    ]
  },
  {
    title: "ORGANIZAÇÃO",
    items: [
      { name: "Sincronização", href: "/sync", icon: RefreshCw },
      { name: "Configurações", href: "/settings", icon: Settings },
    ]
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 bg-sidebar border-r border-sidebar-border/50 hidden md:flex flex-col h-full relative z-20">
      <div className="h-24 flex items-center px-8 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-[#0f172a] font-black text-lg -skew-x-6 tracking-tighter">Z</span>
          </div>
          <h1 className="text-[17px] font-bold tracking-tight text-white">
            Despezzas
          </h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-8 space-y-8">
        {navGroups.map((group) => (
          <div key={group.title} className="px-4">
            <p className="text-[11px] font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-3 px-4">{group.title}</p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-2.5 rounded-full text-[14px] transition-all duration-300 relative overflow-hidden",
                        isActive 
                          ? "text-sidebar-primary-foreground bg-sidebar-primary font-semibold shadow-sm" 
                          : "text-sidebar-foreground hover:text-white hover:bg-white/5 font-medium"
                      )}
                    >
                      <Icon className={cn(
                        "w-4 h-4 transition-transform duration-300 group-hover:scale-110",
                        isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground group-hover:text-white"
                      )} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
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
