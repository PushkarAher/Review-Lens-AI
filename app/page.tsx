"use client";

import * as React from "react";
import ReviewLensBento from "@/components/ui/reviewlens-bento";
import { Sparkles, Activity, Layers, ArrowUpRight, Database } from "lucide-react";

export default function Page() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#E8FF1F] selection:text-black">
      {/* Top Banner Navigation Bar */}
      <header className="border-b border-white/10 bg-black/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E8FF1F] text-black font-bold flex items-center justify-center text-sm shadow-[0_0_18px_rgba(232,255,31,0.35)]">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="font-semibold tracking-tight text-white text-base">ReviewLens AI</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono text-[#E8FF1F] bg-[#E8FF1F]/10 border border-[#E8FF1F]/20 px-2 py-0.5 rounded-full">
                Bento Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/70 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <Activity className="w-3.5 h-3.5 text-[#E8FF1F]" />
              <span>Real-Time Dual Inference Engine</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-white/50 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-mono">
              <Database className="w-3 h-3 text-[#A9B2FF]" />
              <span>IMDb 50k · SST-2</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main ReviewLens Bento Dashboard */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ReviewLensBento />
      </div>
    </main>
  );
}
