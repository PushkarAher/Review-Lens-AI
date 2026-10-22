"use client";

import * as React from "react";
import FinanceBentoDemo from "@/components/ui/demo";
import { Sparkles, Layers, Activity, ArrowUpRight } from "lucide-react";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Top Banner Navigation / Project Header */}
      <header className="border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E8FF1F] text-black font-bold flex items-center justify-center text-sm shadow-[0_0_15px_rgba(232,255,31,0.3)]">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-white text-base">ReviewLens & Finance Studio</span>
              <span className="hidden sm:inline-block ml-2 text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">v1.2</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <Activity className="w-3.5 h-3.5 text-[#E8FF1F]" />
              <span>Real-Time Engine Active</span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Components</span>
              <ArrowUpRight className="w-3 h-3 text-white/50" />
            </a>
          </div>
        </div>
      </header>

      {/* Finance Bento Component Showcase */}
      <section className="py-2">
        <FinanceBentoDemo />
      </section>
    </main>
  );
}
