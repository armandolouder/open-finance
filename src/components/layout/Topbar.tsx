"use client";

import { RefreshCw, Bell, UserCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { monthKey, monthLabel, prevMonth, nextMonth } from "@/lib/utils";

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get("month") || monthKey(new Date());

  const setMonth = (m: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", m);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="h-24 bg-background px-8 flex items-center justify-between shrink-0 relative z-10 border-b border-border">
      <div className="flex items-center gap-6">
        {/* Navegação de meses Global */}
        <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-3 py-2 shrink-0">
          <button
            onClick={() => setMonth(prevMonth(currentMonth))}
            className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors shadow-sm hover:shadow"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-foreground capitalize text-sm min-w-[150px] text-center">
            {monthLabel(currentMonth)}
          </span>
          <button
            onClick={() => setMonth(nextMonth(currentMonth))}
            className="p-1.5 rounded-lg hover:bg-background text-muted-foreground hover:text-foreground transition-colors shadow-sm hover:shadow"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Última atualização</p>
            <p className="text-sm text-foreground font-medium">Hoje, 09:41</p>
          </div>
          <button className="p-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full border border-primary/20 transition-all hover:rotate-180">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-border" />

        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background" />
        </button>
        
        <button className="flex items-center gap-2 p-1 pr-3 bg-muted border border-border rounded-full hover:bg-accent transition-colors">
          <UserCircle className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Admin</span>
        </button>
      </div>
    </header>
  );
}
