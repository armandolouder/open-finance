import React from "react";
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SyncProvider } from "@/components/SyncProvider";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Despezzas",
  description: "Sistema financeiro pessoal e empresarial integrado à Pluggy",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Despezzas",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} dark antialiased h-full`}>
      <body className="h-full flex overflow-hidden selection:bg-primary/30 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-background text-foreground">
          <SyncProvider>
            <React.Suspense fallback={<header className="h-24 bg-background" />}>
              <Topbar />
            </React.Suspense>
            <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-4 md:pt-6 relative pb-24 md:pb-8">
              {children}
            </main>
            <BottomNav />
          </SyncProvider>
        </div>
      </body>
    </html>
  );
}
