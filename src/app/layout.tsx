import React from "react";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Local",
  description: "Sistema financeiro pessoal e empresarial integrado à Pluggy",
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
          <React.Suspense fallback={<header className="h-24 bg-background" />}>
            <Topbar />
          </React.Suspense>
          <main className="flex-1 overflow-y-auto p-8 pt-6 relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
