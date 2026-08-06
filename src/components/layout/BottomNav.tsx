"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, CreditCard, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainTabs = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Transações", href: "/transactions", icon: ArrowRightLeft },
  { name: "Cartões", href: "/cards", icon: CreditCard },
];

export function BottomNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#121212]/90 backdrop-blur-md border-t border-white/5 z-50">
      <nav className="flex items-center justify-around px-2 pb-safe">
        {mainTabs.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full py-3 gap-1",
                isActive ? "text-emerald-500" : "text-muted-foreground hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-semibold">{item.name}</span>
            </Link>
          );
        })}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center justify-center w-full py-3 gap-1",
            pathname.startsWith("/settings") ? "text-emerald-500" : "text-muted-foreground hover:text-white"
          )}
        >
          <Menu className={cn("w-5 h-5", pathname.startsWith("/settings") && "stroke-[2.5]")} />
          <span className="text-[10px] font-semibold">Mais</span>
        </Link>
      </nav>
    </div>
  );
}
