"use client";

import * as React from "react";
import {
  Sparkles,
  Zap,
  Gauge,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowUpRight,
  Filter,
  BarChart3,
  Split,
  ChevronRight,
  HelpCircle
} from "lucide-react";

// Pre-defined benchmark sample reviews from reports/edge_cases.csv
export interface BenchmarkSample {
  id: number;
  category: string;
  expectedIntent: "Positive" | "Negative" | "Ambiguous";
  reviewText: string;
  baseline: { label: "Positive" | "Negative"; confidence: number; latency: number };
  transformer: { label: "Positive" | "Negative"; confidence: number; latency: number };
  agree: boolean;
  notes?: string;
}

export const SAMPLE_REVIEWS: BenchmarkSample[] = [
  {
    id: 1,
    category: "Direct Negation",
    expectedIntent: "Negative",
    reviewText: "The plot was not good, actually it was completely terrible.",
    baseline: { label: "Negative", confidence: 0.9660, latency: 0.45 },
    transformer: { label: "Negative", confidence: 0.9998, latency: 250.7 },
    agree: true,
    notes: "Both models correctly identify explicit negative phrasing."
  },
  {
    id: 2,
    category: "Double Negation",
    expectedIntent: "Positive",
    reviewText: "I cannot say that I did not enjoy this clever and charming film.",
    baseline: { label: "Positive", confidence: 0.6724, latency: 0.44 },
    transformer: { label: "Negative", confidence: 0.6017, latency: 255.8 },
    agree: false,
    notes: "Disagreement: Baseline captures positive n-grams ('clever and charming'); DistilBERT SST-2 weights 'not enjoy' heavily."
  },
  {
    id: 3,
    category: "Sarcasm / Irony",
    expectedIntent: "Negative",
    reviewText: "What a masterpiece! If your goal in life is to fall into a deep coma within ten minutes.",
    baseline: { label: "Positive", confidence: 0.6420, latency: 0.48 },
    transformer: { label: "Positive", confidence: 0.8765, latency: 260.4 },
    agree: true,
    notes: "Both models tricked by high-frequency superlative 'masterpiece'."
  },
  {
    id: 4,
    category: "Mixed Lead & Climax",
    expectedIntent: "Negative",
    reviewText: "The opening thirty minutes had stunning visuals and decent acting, but the ending was an unmitigated disaster.",
    baseline: { label: "Negative", confidence: 0.7364, latency: 0.43 },
    transformer: { label: "Negative", confidence: 0.9989, latency: 248.1 },
    agree: true,
    notes: "Both models correctly prioritize the concluding clause."
  },
  {
    id: 5,
    category: "Sarcastic Praise",
    expectedIntent: "Negative",
    reviewText: "A work of pure genius, assuming the script was written by a four-year-old on sugar.",
    baseline: { label: "Negative", confidence: 0.7170, latency: 0.46 },
    transformer: { label: "Positive", confidence: 0.9963, latency: 251.2 },
    agree: false,
    notes: "Disagreement: Baseline detects trailing ridicule; DistilBERT over-indexes on 'pure genius'."
  },
  {
    id: 6,
    category: "Inverted Expectation",
    expectedIntent: "Positive",
    reviewText: "I fully expected to despise every second of this, yet I walked away captivated and in tears.",
    baseline: { label: "Positive", confidence: 0.5864, latency: 0.45 },
    transformer: { label: "Negative", confidence: 0.9780, latency: 262.0 },
    agree: false,
    notes: "Disagreement: Transformer fixates on early negation ('despise'); Baseline weights whole-document resolution."
  },
  {
    id: 7,
    category: "Colloquial Slang",
    expectedIntent: "Positive",
    reviewText: "This movie is the undisputed GOAT, absolute fire throughout.",
    baseline: { label: "Positive", confidence: 0.6762, latency: 0.41 },
    transformer: { label: "Positive", confidence: 0.9979, latency: 247.3 },
    agree: true,
    notes: "Transformer excels on colloquial modern idioms ('GOAT', 'fire')."
  },
  {
    id: 8,
    category: "Length Truncation (>512 tokens)",
    expectedIntent: "Positive",
    reviewText: "A remarkable achievement in modern cinema with breathtaking cinematography and profound emotional resonance. Throughout its extensive runtime, the intricate character arcs continuously evolve into an unforgettable masterpiece of storytelling. The director balances tension and quiet poetic reflection with pristine clarity.",
    baseline: { label: "Positive", confidence: 0.9275, latency: 0.49 },
    transformer: { label: "Positive", confidence: 0.9999, latency: 265.4 },
    agree: true,
    notes: "Reviews exceeding 512 tokens get truncated in DistilBERT, while TF-IDF covers the entire document text."
  }
];

export function ReviewLensBento() {
  const [activeTab, setActiveTab] = React.useState<"studio" | "benchmark" | "edgecases">("studio");
  const [metricUnit, setMetricUnit] = React.useState<"scores" | "latency">("scores");
  const [reviewInput, setReviewInput] = React.useState<string>(SAMPLE_REVIEWS[1].reviewText);
  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);
  
  // Real-time inference result state
  const [analysisResult, setAnalysisResult] = React.useState<any>({
    text: SAMPLE_REVIEWS[1].reviewText,
    word_count: SAMPLE_REVIEWS[1].reviewText.split(/\s+/).length,
    char_count: SAMPLE_REVIEWS[1].reviewText.length,
    is_truncated: false,
    agree: SAMPLE_REVIEWS[1].agree,
    disagreement_note: SAMPLE_REVIEWS[1].notes,
    baseline: {
      model: "TF-IDF + Logistic Regression",
      label: SAMPLE_REVIEWS[1].baseline.label,
      confidence: SAMPLE_REVIEWS[1].baseline.confidence,
      pos_prob: SAMPLE_REVIEWS[1].baseline.label === "Positive" ? SAMPLE_REVIEWS[1].baseline.confidence : 1 - SAMPLE_REVIEWS[1].baseline.confidence,
      neg_prob: SAMPLE_REVIEWS[1].baseline.label === "Negative" ? SAMPLE_REVIEWS[1].baseline.confidence : 1 - SAMPLE_REVIEWS[1].baseline.confidence,
      latency_ms: SAMPLE_REVIEWS[1].baseline.latency,
    },
    transformer: {
      model: "DistilBERT (distilbert-base-uncased)",
      label: SAMPLE_REVIEWS[1].transformer.label,
      confidence: SAMPLE_REVIEWS[1].transformer.confidence,
      pos_prob: SAMPLE_REVIEWS[1].transformer.label === "Positive" ? SAMPLE_REVIEWS[1].transformer.confidence : 1 - SAMPLE_REVIEWS[1].transformer.confidence,
      neg_prob: SAMPLE_REVIEWS[1].transformer.label === "Negative" ? SAMPLE_REVIEWS[1].transformer.confidence : 1 - SAMPLE_REVIEWS[1].transformer.confidence,
      latency_ms: SAMPLE_REVIEWS[1].transformer.latency,
    }
  });

  const wordCount = reviewInput.trim() ? reviewInput.trim().split(/\s+/).length : 0;
  const isLengthWarning = wordCount > 400;

  // Run live dual inference
  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = (textToAnalyze ?? reviewInput).trim();
    if (!text) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error("Inference request failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSample = (sample: BenchmarkSample) => {
    setReviewInput(sample.reviewText);
    handleAnalyze(sample.reviewText);
  };

  return (
    <div className="w-full text-white font-sans antialiased selection:bg-[#E8FF1F] selection:text-black">
      {/* Bento Container */}
      <div className="relative rounded-[28px] bg-black p-5 sm:p-7 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-[#E8FF1F]/10 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-[#A9B2FF]/10 rounded-full blur-[120px]" />

        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-7 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-tight bg-[#E8FF1F]/10 text-[#E8FF1F] border border-[#E8FF1F]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF1F] animate-pulse" />
                ReviewLens Engine v1.0
              </span>
              <span className="text-white/40 text-xs font-mono">· IMDb 1,000 Held-Out (Seed 42)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              ReviewLens AI
              <span className="text-sm sm:text-base font-normal text-white/50 tracking-normal hidden md:inline">
                Dual-Paradigm Sentiment Intelligence
              </span>
            </h1>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-3">
            <div className="flex p-1 rounded-2xl bg-white/[0.06] border border-white/10" role="group">
              <button
                type="button"
                onClick={() => setActiveTab("studio")}
                aria-pressed={activeTab === "studio"}
                className={`h-8 px-3.5 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                  activeTab === "studio"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Live Studio
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("benchmark")}
                aria-pressed={activeTab === "benchmark"}
                className={`h-8 px-3.5 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                  activeTab === "benchmark"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Benchmark Matrix
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("edgecases")}
                aria-pressed={activeTab === "edgecases"}
                className={`h-8 px-3.5 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                  activeTab === "edgecases"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Edge Cases
              </button>
            </div>

            <div className="hidden sm:flex p-1 rounded-2xl bg-white/[0.06] border border-white/10" role="group">
              <button
                type="button"
                onClick={() => setMetricUnit("scores")}
                aria-pressed={metricUnit === "scores"}
                className={`h-8 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                  metricUnit === "scores"
                    ? "bg-[#E8FF1F] text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Metrics
              </button>
              <button
                type="button"
                onClick={() => setMetricUnit("latency")}
                aria-pressed={metricUnit === "latency"}
                className={`h-8 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all ${
                  metricUnit === "latency"
                    ? "bg-[#E8FF1F] text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Latency
              </button>
            </div>
          </div>
        </header>

        {/* 12-Column Responsive Bento Grid */}
        <div className="grid grid-cols-12 gap-4">

          {/* CARD 1: LIVE INFERENCE STUDIO (Span 8) */}
          <div className="col-span-12 lg:col-span-8 relative rounded-[28px] overflow-hidden bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
            {/* Top Row: Title & Presets */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E8FF1F]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Live Dual-Inference Console
                  </span>
                </div>
                <div className="text-xs font-mono text-white/40">
                  {wordCount} words {isLengthWarning && <span className="text-amber-400">(&gt;512 token boundary)</span>}
                </div>
              </div>

              {/* Textarea */}
              <div className="relative mb-3">
                <textarea
                  value={reviewInput}
                  onChange={(e) => setReviewInput(e.target.value)}
                  placeholder="Paste or type any movie review to compare ML vs Transformer..."
                  rows={3}
                  className="w-full rounded-2xl bg-black/60 border border-white/15 p-3.5 text-sm sm:text-base text-white placeholder-white/30 focus:outline-none focus:border-[#E8FF1F]/80 focus:ring-1 focus:ring-[#E8FF1F]/80 transition-all font-sans resize-none"
                />
              </div>

              {/* Sample Review Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
                <span className="text-[11px] font-mono text-white/40 uppercase whitespace-nowrap">Presets:</span>
                {SAMPLE_REVIEWS.slice(0, 6).map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition-colors"
                  >
                    {sample.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Middle Row: Comparison Output Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* Traditional ML Model Result */}
              <div className="rounded-2xl bg-black/50 border border-white/10 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-xs font-semibold text-white/70">TF-IDF + LogReg</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white/70">
                    {analysisResult.baseline.latency_ms} ms
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div className={`text-2xl font-bold tracking-tight ${
                    analysisResult.baseline.label === "Positive" ? "text-[#E8FF1F]" : "text-rose-400"
                  }`}>
                    {analysisResult.baseline.label}
                  </div>
                  <div className="text-xs font-mono text-white/50">
                    {(analysisResult.baseline.confidence * 100).toFixed(1)}% conf
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      analysisResult.baseline.label === "Positive" ? "bg-[#E8FF1F]" : "bg-rose-500"
                    }`}
                    style={{ width: `${analysisResult.baseline.confidence * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-white/40 mt-1.5">
                  <span>In-Domain IMDb</span>
                  <span>0.28 MB memory</span>
                </div>
              </div>

              {/* Contextual Transformer Result */}
              <div className="rounded-2xl bg-black/50 border border-white/10 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-[#A9B2FF]" />
                    <span className="text-xs font-semibold text-white/70">DistilBERT SST-2</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white/70">
                    {analysisResult.transformer.latency_ms} ms
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div className={`text-2xl font-bold tracking-tight ${
                    analysisResult.transformer.label === "Positive" ? "text-[#A9B2FF]" : "text-rose-400"
                  }`}>
                    {analysisResult.transformer.label}
                  </div>
                  <div className="text-xs font-mono text-white/50">
                    {(analysisResult.transformer.confidence * 100).toFixed(1)}% conf
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      analysisResult.transformer.label === "Positive" ? "bg-[#A9B2FF]" : "bg-rose-500"
                    }`}
                    style={{ width: `${analysisResult.transformer.confidence * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-white/40 mt-1.5">
                  <span>Contextual Self-Attention</span>
                  <span>268 MB memory</span>
                </div>
              </div>
            </div>

            {/* Bottom Row: Consensus Banner & Analyze Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex-1 w-full">
                {analysisResult.agree ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-2 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Models in Consensus: Both paradigms predict <b>{analysisResult.baseline.label}</b></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/40 px-3 py-2 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      <b>Disagreement Detected (11.9% Edge Case):</b> {analysisResult.disagreement_note || "Paradigms diverged on context weighting."}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing}
                className="w-full sm:w-auto h-10 px-5 rounded-xl bg-[#E8FF1F] hover:bg-[#d8ef18] text-black font-semibold text-xs tracking-tight flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(232,255,31,0.25)] flex-shrink-0 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>{isAnalyzing ? "Analyzing..." : "Run Dual Inference"}</span>
              </button>
            </div>
          </div>

          {/* CARD 2: MODEL CONSENSUS ALLOCATION GAUGE (Span 4) */}
          <div className="col-span-12 lg:col-span-4 relative rounded-[28px] overflow-hidden bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Consensus Allocation
                </span>
                <span className="text-xs font-mono text-[#E8FF1F]">1,000 Sample Split</span>
              </div>
              <div className="text-3xl font-light tracking-tight text-white mb-1">
                88.1% <span className="text-sm font-normal text-white/50">Agreement</span>
              </div>
              <div className="text-xs text-white/40 mb-4">
                119 Disagreements (11.9%) on held-out test reviews
              </div>

              {/* Circular Gauge Representation */}
              <div className="relative flex items-center justify-center my-2">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="10"
                  />
                  {/* Agreement Segment (88.1%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#E8FF1F"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset="29.8"
                    strokeLinecap="round"
                  />
                  {/* Disagreement Segment (11.9%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#FFB37A"
                    strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset="221.4"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold font-mono text-white">881</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">Agreed</span>
                </div>
              </div>
            </div>

            {/* Allocation Breakdown Rows */}
            <div className="space-y-2 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/70">
                  <i className="w-2 h-2 rounded-full bg-[#E8FF1F]" />
                  Baseline Correct, Transformer Wrong
                </span>
                <span className="font-mono font-semibold text-white">71 (59.7%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/70">
                  <i className="w-2 h-2 rounded-full bg-[#FFB37A]" />
                  Transformer Correct, Baseline Wrong
                </span>
                <span className="font-mono font-semibold text-white">48 (40.3%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-white/70">
                  <i className="w-2 h-2 rounded-full bg-[#A9B2FF]" />
                  Consensus on Positive
                </span>
                <span className="font-mono font-semibold text-white">437 reviews</span>
              </div>
            </div>
          </div>

          {/* KPI ROW: 4 Bento Metric Tiles (Span 3 each) */}
          {/* Tile 1: Accuracy */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-[28px] bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl relative overflow-hidden">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">
              Top Accuracy (IMDb)
            </div>
            <div className="text-3xl font-light tracking-tight text-white mb-2 font-mono">
              91.30%
            </div>
            <div className="text-xs font-mono text-[#E8FF1F] flex items-center gap-1">
              <span>+2.30% Baseline Advantage</span>
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              DistilBERT Zero-Shot: 89.00%
            </div>
          </div>

          {/* Tile 2: Latency Speedup */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-[28px] bg-[#E8FF1F] text-black p-5 relative overflow-hidden shadow-[0_0_30px_rgba(232,255,31,0.2)]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-black/60 mb-1">
              Inference Speedup
            </div>
            <div className="text-3xl font-light tracking-tight text-black mb-2 font-mono">
              0.45 ms
            </div>
            <div className="text-xs font-mono text-black font-semibold flex items-center gap-1">
              <span>557x Faster on CPU</span>
            </div>
            <div className="text-[11px] text-black/60 mt-1">
              DistilBERT Avg: 250.74 ms
            </div>
          </div>

          {/* Tile 3: Artifact Footprint */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-[28px] bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl relative overflow-hidden">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">
              Model Artifact Size
            </div>
            <div className="text-3xl font-light tracking-tight text-white mb-2 font-mono">
              0.28 MB
            </div>
            <div className="text-xs font-mono text-[#E8FF1F] flex items-center gap-1">
              <span>957x Smaller Deployment</span>
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              DistilBERT Weight: 268 MB
            </div>
          </div>

          {/* Tile 4: Balanced F1-Score */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3 rounded-[28px] bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl relative overflow-hidden">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">
              Balanced F1-Score
            </div>
            <div className="text-3xl font-light tracking-tight text-white mb-2 font-mono">
              0.9134
            </div>
            <div className="text-xs font-mono text-[#A9B2FF] flex items-center gap-1">
              <span>DistilBERT F1: 0.8882</span>
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              Precision: 90.89% · Recall: 91.80%
            </div>
          </div>

          {/* CARD 3: COMPARATIVE BENCHMARK MATRIX (Span 6) */}
          <div className="col-span-12 lg:col-span-6 rounded-[28px] bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50 block">
                  Scientific Comparison
                </span>
                <h3 className="text-lg font-semibold text-white">Full Metric Breakdown</h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-[#E8FF1F]">
                  <i className="w-2 h-2 rounded-full bg-[#E8FF1F]" /> TF-IDF
                </span>
                <span className="flex items-center gap-1 text-[#A9B2FF]">
                  <i className="w-2 h-2 rounded-full bg-[#A9B2FF]" /> DistilBERT
                </span>
              </div>
            </div>

            {/* Metric Bars */}
            <div className="space-y-4">
              {[
                { name: "Accuracy", base: 91.30, trans: 89.00 },
                { name: "Precision", base: 90.89, trans: 90.29 },
                { name: "Recall", base: 91.80, trans: 87.40 },
                { name: "F1-Score", base: 91.34, trans: 88.82 },
              ].map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70 font-medium">{item.name}</span>
                    <span className="font-mono text-white/50">
                      <b className="text-[#E8FF1F]">{item.base.toFixed(2)}%</b> vs{" "}
                      <b className="text-[#A9B2FF]">{item.trans.toFixed(2)}%</b>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5">
                    <div className="bg-[#E8FF1F] rounded-full h-full" style={{ width: `${item.base}%` }} />
                    <div className="bg-[#A9B2FF] rounded-full h-full" style={{ width: `${item.trans}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 text-xs text-white/50">
              💡 <b>Why does Traditional ML lead?</b> In-domain training on full-text IMDb reviews avoids the 512-token truncation limit that clips long movie reviews in Transformer models.
            </div>
          </div>

          {/* CARD 4: SIDE-BY-SIDE CONFUSION MATRIX (Span 6) */}
          <div className="col-span-12 lg:col-span-6 rounded-[28px] bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50 block">
                  Held-Out Diagnostics
                </span>
                <h3 className="text-lg font-semibold text-white">Side-by-Side Confusion Matrices</h3>
              </div>
              <span className="text-xs font-mono text-white/40">500 Pos / 500 Neg</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Baseline Matrix */}
              <div className="rounded-2xl bg-black/40 border border-white/10 p-3.5">
                <div className="text-xs font-semibold text-[#E8FF1F] mb-2 font-mono">
                  TF-IDF + Logistic Regression
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-xs">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="text-[10px] text-white/40">TN</div>
                    <div className="text-base font-bold text-white">454</div>
                  </div>
                  <div className="bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                    <div className="text-[10px] text-rose-300">FP</div>
                    <div className="text-base font-bold text-rose-300">46</div>
                  </div>
                  <div className="bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                    <div className="text-[10px] text-rose-300">FN</div>
                    <div className="text-base font-bold text-rose-300">41</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="text-[10px] text-white/40">TP</div>
                    <div className="text-base font-bold text-white">459</div>
                  </div>
                </div>
              </div>

              {/* DistilBERT Matrix */}
              <div className="rounded-2xl bg-black/40 border border-white/10 p-3.5">
                <div className="text-xs font-semibold text-[#A9B2FF] mb-2 font-mono">
                  DistilBERT Transformer
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-center font-mono text-xs">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="text-[10px] text-white/40">TN</div>
                    <div className="text-base font-bold text-white">453</div>
                  </div>
                  <div className="bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                    <div className="text-[10px] text-rose-300">FP</div>
                    <div className="text-base font-bold text-rose-300">47</div>
                  </div>
                  <div className="bg-rose-950/20 p-2 rounded-lg border border-rose-900/30">
                    <div className="text-[10px] text-rose-300">FN</div>
                    <div className="text-base font-bold text-rose-300">63</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="text-[10px] text-white/40">TP</div>
                    <div className="text-base font-bold text-white">437</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs text-white/40 font-mono">
              <span>Overall Disagreements: 119</span>
              <span>Stratified Split: 1,000</span>
            </div>
          </div>

          {/* CARD 5: EDGE CASES & DISAGREEMENT EXPLORER (Span 12) */}
          <div className="col-span-12 rounded-[28px] bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50 block">
                  Qualitative Benchmark Suite
                </span>
                <h3 className="text-lg font-semibold text-white">Disagreements & Linguistic Edge Cases</h3>
              </div>
              <div className="text-xs text-white/40 font-mono">
                Click any case to test in Live Studio
              </div>
            </div>

            {/* Table / List of Cases */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 font-mono">
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Review Snippet</th>
                    <th className="pb-3 font-medium">Expected</th>
                    <th className="pb-3 font-medium">TF-IDF Baseline</th>
                    <th className="pb-3 font-medium">DistilBERT</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {SAMPLE_REVIEWS.map((sample) => (
                    <tr key={sample.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-3 font-semibold text-white/80 whitespace-nowrap pr-3">
                        {sample.category}
                      </td>
                      <td className="py-3 text-white/70 max-w-xs md:max-w-md truncate pr-3" title={sample.reviewText}>
                        &ldquo;{sample.reviewText}&rdquo;
                      </td>
                      <td className="py-3 font-mono whitespace-nowrap pr-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          sample.expectedIntent === "Positive" ? "bg-emerald-950/60 text-emerald-400" : "bg-rose-950/60 text-rose-400"
                        }`}>
                          {sample.expectedIntent}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-white/80 whitespace-nowrap pr-3">
                        {sample.baseline.label} <span className="text-white/40">({(sample.baseline.confidence * 100).toFixed(0)}%)</span>
                      </td>
                      <td className="py-3 font-mono text-white/80 whitespace-nowrap pr-3">
                        {sample.transformer.label} <span className="text-white/40">({(sample.transformer.confidence * 100).toFixed(0)}%)</span>
                      </td>
                      <td className="py-3 whitespace-nowrap pr-3">
                        {sample.agree ? (
                          <span className="inline-flex items-center gap-1 text-[#E8FF1F] text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Agree
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-[11px] font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Diverged
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectSample(sample);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-[#E8FF1F] hover:text-black text-white text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <span>Analyze</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Credit & Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-7 pt-5 border-t border-white/10 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8FF1F]" />
            <span>ReviewLens AI Bento Studio · GDG on Campus Recruitment</span>
          </div>
          <div className="font-mono text-[11px]">
            Trained on IMDb (50k) · SST-2 Fine-Tuned DistilBERT
          </div>
        </div>

      </div>
    </div>
  );
}

export default ReviewLensBento;
