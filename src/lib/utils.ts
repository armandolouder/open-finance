import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBankLogo(name: string, fallback: string | null): string | undefined {
  const n = (name || '').toLowerCase();
  if (n.includes('nubank')) return 'https://cdn.pluggy.ai/assets/connector-icons/212.svg';
  if (n.includes('mercado pago')) return 'https://cdn.pluggy.ai/assets/connector-icons/206.svg';
  return fallback || undefined;
}

export function getBankBranding(name: string, institutionName?: string, customColor?: string) {
  if (customColor) {
    let bg = 'bg-neutral-600 text-white';
    let text = 'text-neutral-400';
    let border = 'border-neutral-500/30';
    let accent = 'rgba(100, 100, 100, 0.15)';

    switch (customColor) {
      case 'emerald': bg = 'bg-emerald-600 text-white'; text = 'text-emerald-400'; border = 'border-emerald-500/30'; accent = 'rgba(16, 185, 129, 0.15)'; break;
      case 'blue': bg = 'bg-blue-600 text-white'; text = 'text-blue-400'; border = 'border-blue-500/30'; accent = 'rgba(59, 130, 246, 0.15)'; break;
      case 'purple': bg = 'bg-purple-600 text-white'; text = 'text-purple-400'; border = 'border-purple-500/30'; accent = 'rgba(168, 85, 247, 0.15)'; break;
      case 'red': bg = 'bg-red-600 text-white'; text = 'text-red-400'; border = 'border-red-500/30'; accent = 'rgba(239, 68, 68, 0.15)'; break;
      case 'orange': bg = 'bg-orange-600 text-white'; text = 'text-orange-400'; border = 'border-orange-500/30'; accent = 'rgba(249, 115, 22, 0.15)'; break;
      case 'neutral': bg = 'bg-neutral-600 text-white'; text = 'text-neutral-400'; border = 'border-neutral-500/30'; accent = 'rgba(115, 115, 115, 0.15)'; break;
    }

    return {
      border,
      text,
      bg,
      icon: name.charAt(0).toUpperCase(),
      cardBg: 'linear-gradient(145deg, #161616 0%, #0a0a0a 60%, #050505 100%)',
      cardBgSelected: 'linear-gradient(145deg, #222222 0%, #151515 60%, #0a0a0a 100%)',
      accent
    };
  }

  const n = (name + ' ' + (institutionName || '')).toLowerCase();

  // Ultraviolet Black (Nubank Black)
  if (n.includes('ultraviolet')) return {
    border: 'border-purple-900/40',
    text: 'text-fuchsia-400',
    bg: 'bg-purple-900 text-white',
    icon: 'N',
    cardBg: 'linear-gradient(145deg, #110b1f 0%, #0a0710 60%, #080508 100%)',
    cardBgSelected: 'linear-gradient(145deg, #1a1030 0%, #0f0a1a 60%, #0c0810 100%)',
    accent: 'rgba(120, 60, 180, 0.15)',
  };

  // Nubank — rosa / roxo
  if (n.includes('nubank')) return {
    border: 'border-purple-700/30',
    text: 'text-fuchsia-400',
    bg: 'bg-purple-700 text-white',
    icon: 'N',
    cardBg: 'linear-gradient(145deg, #160d2a 0%, #0e0818 60%, #090610 100%)',
    cardBgSelected: 'linear-gradient(145deg, #1f1238 0%, #140c22 60%, #0d0818 100%)',
    accent: 'rgba(147, 51, 234, 0.12)',
  };

  // Santander — vermelho vivo
  if (n.includes('santander')) return {
    border: 'border-red-800/30',
    text: 'text-red-500',
    bg: 'bg-red-600 text-white',
    icon: 'S',
    cardBg: 'linear-gradient(145deg, #1f0808 0%, #120505 60%, #0a0303 100%)',
    cardBgSelected: 'linear-gradient(145deg, #2a0a0a 0%, #1a0606 60%, #100404 100%)',
    accent: 'rgba(220, 38, 38, 0.12)',
  };

  if (n.includes('mercado pago') || n.includes('mercadopago')) return {
    border: 'border-blue-600/30',
    text: 'text-blue-500',
    bg: 'bg-blue-600 text-white',
    icon: 'M',
    cardBg: 'linear-gradient(145deg, #061820 0%, #030f16 60%, #020a0f 100%)',
    cardBgSelected: 'linear-gradient(145deg, #092030 0%, #051520 60%, #030f18 100%)',
    accent: 'rgba(37, 99, 235, 0.10)',
  };

  if (n.includes('inter')) return {
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    bg: 'bg-orange-500 text-white',
    icon: 'I',
    cardBg: 'linear-gradient(145deg, #1a0e04 0%, #100802 60%, #080501 100%)',
    cardBgSelected: 'linear-gradient(145deg, #221205 0%, #160a03 60%, #0e0702 100%)',
    accent: 'rgba(249, 115, 22, 0.10)',
  };

  if (n.includes('itau') || n.includes('itaú')) return {
    border: 'border-orange-600/30',
    text: 'text-orange-500',
    bg: 'bg-orange-600 text-white',
    icon: 'I',
    cardBg: 'linear-gradient(145deg, #1a0e04 0%, #100802 60%, #080501 100%)',
    cardBgSelected: 'linear-gradient(145deg, #221205 0%, #160a03 60%, #0e0702 100%)',
    accent: 'rgba(234, 88, 12, 0.10)',
  };

  if (n.includes('c6')) return {
    border: 'border-neutral-500/30',
    text: 'text-neutral-400',
    bg: 'bg-neutral-900 text-white',
    icon: 'C',
    cardBg: 'linear-gradient(145deg, #0f0f0f 0%, #090909 100%)',
    cardBgSelected: 'linear-gradient(145deg, #1a1a1a 0%, #101010 100%)',
    accent: 'rgba(120, 120, 120, 0.08)',
  };

  if (n.includes('bradesco')) return {
    border: 'border-red-700/30',
    text: 'text-red-500',
    bg: 'bg-red-700 text-white',
    icon: 'B',
    cardBg: 'linear-gradient(145deg, #1a0606 0%, #100404 60%, #080202 100%)',
    cardBgSelected: 'linear-gradient(145deg, #220808 0%, #160505 60%, #0e0303 100%)',
    accent: 'rgba(185, 28, 28, 0.10)',
  };

  return {
    border: 'border-white/10',
    text: 'text-slate-400',
    bg: 'bg-slate-800 text-white',
    icon: name.charAt(0).toUpperCase(),
    cardBg: 'linear-gradient(145deg, #111111 0%, #0a0a0a 100%)',
    cardBgSelected: 'linear-gradient(145deg, #1a1a1a 0%, #111111 100%)',
    accent: 'rgba(255,255,255,0.04)',
  };
}

export function getBankLogoUrl(name: string, institutionName?: string, fallbackUrl?: string | null): string | null {
  const n = (name + ' ' + (institutionName || '')).toLowerCase();
  
  if (n.includes('nubank') || n.includes('ultraviolet')) return 'https://cdn.pluggy.ai/assets/connector-icons/212.svg';
  if (n.includes('mercado pago') || n.includes('mercadopago')) return 'https://cdn.pluggy.ai/assets/connector-icons/206.svg';
  if (n.includes('santander')) return 'https://cdn.pluggy.ai/assets/connector-icons/208.svg';
  if (n.includes('itau') || n.includes('itaú')) return 'https://cdn.pluggy.ai/assets/connector-icons/201.svg';
  if (n.includes('bradesco')) return 'https://cdn.pluggy.ai/assets/connector-icons/202.svg';
  if (n.includes('inter')) return 'https://cdn.pluggy.ai/assets/connector-icons/204.svg';
  if (n.includes('c6')) return 'https://cdn.pluggy.ai/assets/connector-icons/205.svg';
  
  return fallbackUrl || null;
}

// Date Utils para Filtro de Mês Global
export function monthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m) return key;
  return `${MONTH_NAMES[m - 1]} De ${y}`;
}

export function prevMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 2, 1));
}

export function nextMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m, 1));
}
