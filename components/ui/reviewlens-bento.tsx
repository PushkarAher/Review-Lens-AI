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
  HelpCircle,
  FileText,
  Sliders,
  Clock,
  HardDrive,
  Check,
  X,
  RefreshCw,
  Search
} from "lucide-react";

// Benchmark edge cases dataset from reports/edge_cases.csv
export interface BenchmarkSample {
  id: number;
  category: string;
  expectedIntent: "Positive" | "Negative" | "Ambiguous";
  reviewText: string;
  baseline: { label: "Positive" | "Negative"; confidence: number; latency: number };
  transformer: { label: "Positive" | "Negative"; confidence: number; latency: number };
  agree: boolean;
  notes: string;
}

export const BENCHMARK_CASES: BenchmarkSample[] = [
  {
    id: 1,
    category: "Direct Negation",
    expectedIntent: "Negative",
    reviewText: "The plot was not good, actually it was completely terrible.",
    baseline: { label: "Negative", confidence: 0.9660, latency: 0.45 },
    transformer: { label: "Negative", confidence: 0.9998, latency: 250.7 },
    agree: true,
    notes: "Both models correctly identify explicit negative phrasing without ambiguity."
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
    notes: "Sarcasm vulnerability: Both models fooled by high-frequency surface superlative 'masterpiece'."
  },
  {
    id: 4,
    category: "Mixed: Positive Lead, Negative Climax",
    expectedIntent: "Negative",
    reviewText: "The opening thirty minutes had stunning visuals and decent acting, but the ending was an unmitigated disaster.",
    baseline: { label: "Negative", confidence: 0.7364, latency: 0.43 },
    transformer: { label: "Negative", confidence: 0.9989, latency: 248.1 },
    agree: true,
    notes: "Both models correctly prioritize the concluding clause over the introductory praise."
  },
  {
    id: 5,
    category: "Mixed: Negative Lead, Positive Climax",
    expectedIntent: "Positive",
    reviewText: "Despite a clumsy first act and awkward dialogue, the film blossoms into a deeply moving and unforgettable triumph.",
    baseline: { label: "Positive", confidence: 0.8119, latency: 0.44 },
    transformer: { label: "Positive", confidence: 0.9998, latency: 252.0 },
    agree: true,
    notes: "Both models successfully weight the climactic resolution ('unforgettable triumph')."
  },
  {
    id: 6,
    category: "Very Short Positive",
    expectedIntent: "Positive",
    reviewText: "Loved it!",
    baseline: { label: "Positive", confidence: 0.9878, latency: 0.42 },
    transformer: { label: "Positive", confidence: 0.9999, latency: 242.0 },
    agree: true,
    notes: "Unambiguous extreme short praise correctly mapped with >98% confidence."
  },
  {
    id: 7,
    category: "Very Short Negative",
    expectedIntent: "Negative",
    reviewText: "Avoid.",
    baseline: { label: "Negative", confidence: 0.9711, latency: 0.41 },
    transformer: { label: "Negative", confidence: 0.9997, latency: 238.5 },
    agree: true,
    notes: "Single-word imperative warning recognized cleanly by both architectures."
  },
  {
    id: 8,
    category: "Colloquial Slang",
    expectedIntent: "Positive",
    reviewText: "This movie is the undisputed GOAT, absolute fire throughout.",
    baseline: { label: "Positive", confidence: 0.6762, latency: 0.41 },
    transformer: { label: "Positive", confidence: 0.9979, latency: 247.3 },
    agree: true,
    notes: "Transformer excels on colloquial modern slang ('GOAT', 'fire'); Baseline has weaker n-gram weights."
  },
  {
    id: 9,
    category: "Colloquial Slang (Negative)",
    expectedIntent: "Negative",
    reviewText: "Complete dumpster fire, pure trash acting.",
    baseline: { label: "Negative", confidence: 0.7613, latency: 0.43 },
    transformer: { label: "Negative", confidence: 0.9997, latency: 249.0 },
    agree: true,
    notes: "Both models detect colloquial derogatory phrases ('dumpster fire', 'pure trash')."
  },
  {
    id: 10,
    category: "Excessive Punctuation",
    expectedIntent: "Positive",
    reviewText: "BEST MOVIE EVER?!?!?! Absolutely brilliant!!!!!!",
    baseline: { label: "Positive", confidence: 0.9737, latency: 0.42 },
    transformer: { label: "Positive", confidence: 0.9999, latency: 244.0 },
    agree: true,
    notes: "Regex text cleaning normalizes punctuation; uppercase tokens emphasize sentiment."
  },
  {
    id: 11,
    category: "Neutral / Objective Description",
    expectedIntent: "Ambiguous",
    reviewText: "The documentary is 90 minutes long and depicts daily life in a rural village.",
    baseline: { label: "Positive", confidence: 0.5829, latency: 0.43 },
    transformer: { label: "Positive", confidence: 0.9636, latency: 253.2 },
    agree: true,
    notes: "Lack of neutral class forces binary projection; both models default slightly positive."
  },
  {
    id: 12,
    category: "Sarcastic Praise",
    expectedIntent: "Negative",
    reviewText: "A work of pure genius, assuming the script was written by a four-year-old on sugar.",
    baseline: { label: "Negative", confidence: 0.7170, latency: 0.46 },
    transformer: { label: "Positive", confidence: 0.9963, latency: 251.2 },
    agree: false,
    notes: "Disagreement: Baseline detects trailing ridicule ('four-year-old on sugar'); DistilBERT over-indexes on 'pure genius'."
  },
  {
    id: 13,
    category: "Inverted Expectation",
    expectedIntent: "Positive",
    reviewText: "I fully expected to despise every second of this, yet I walked away captivated and in tears.",
    baseline: { label: "Positive", confidence: 0.5864, latency: 0.45 },
    transformer: { label: "Negative", confidence: 0.9780, latency: 262.0 },
    agree: false,
    notes: "Disagreement: Transformer fixates on early negation ('despise'); Baseline weights whole-document resolution."
  },
  {
    id: 14,
    category: "Length Truncation (>512 tokens)",
    expectedIntent: "Positive",
    reviewText: "A remarkable achievement in modern cinema with breathtaking cinematography and profound emotional resonance. Throughout its extensive runtime, the intricate character arcs continuously evolve into an unforgettable masterpiece of storytelling. The director balances tension and quiet poetic reflection with pristine clarity, ensuring that every frame feels deliberate and deeply affecting. As the third act approaches, the emotional stakes reach an exquisite crescendo, rewarding the audience with an inspiring climax that lingers long after the credits roll.",
    baseline: { label: "Positive", confidence: 0.9275, latency: 0.49 },
    transformer: { label: "Positive", confidence: 0.9999, latency: 265.4 },
    agree: true,
    notes: "Reviews exceeding 512 tokens get truncated in DistilBERT, while TF-IDF covers the entire document text."
  },
  {
    id: 15,
    category: "Length Truncation (Negative)",
    expectedIntent: "Negative",
    reviewText: "An exhausting, utterly tedious and uninspired waste of celluloid with incoherent plotting and dismal performances. What begins as a mildly intriguing premise rapidly dissolves into excruciatingly dull sequences filled with cardboard characters, clumsy dialogue, and laughable special effects. Even the musical score feels phoned in, desperately attempting to inject synthetic emotional resonance into scenes that evoke nothing but boredom and regret.",
    baseline: { label: "Negative", confidence: 0.9936, latency: 0.48 },
    transformer: { label: "Negative", confidence: 0.9998, latency: 264.0 },
    agree: true,
    notes: "Long negative critique: Baseline processes all clauses; DistilBERT captures initial negative tokens."
  }
];

export type NavTab = "studio" | "benchmark" | "edgecases" | "architecture";

export function ReviewLensBento() {
  const [activeTab, setActiveTab] = React.useState<NavTab>("studio");
  const [reviewInput, setReviewInput] = React.useState<string>(BENCHMARK_CASES[1].reviewText);
  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);
  const [edgeFilter, setEdgeFilter] = React.useState<string>("All");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Sync active tab with URL hash on mount and hashchange
  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") as NavTab;
      if (["studio", "benchmark", "edgecases", "architecture"].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const changeTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  // Real-time inference result state
  const [analysisResult, setAnalysisResult] = React.useState<any>({
    text: BENCHMARK_CASES[1].reviewText,
    word_count: BENCHMARK_CASES[1].reviewText.split(/\s+/).length,
    char_count: BENCHMARK_CASES[1].reviewText.length,
    is_truncated: false,
    agree: BENCHMARK_CASES[1].agree,
    disagreement_note: BENCHMARK_CASES[1].notes,
    baseline: {
      model: "TF-IDF + Logistic Regression",
      label: BENCHMARK_CASES[1].baseline.label,
      confidence: BENCHMARK_CASES[1].baseline.confidence,
      pos_prob: BENCHMARK_CASES[1].baseline.label === "Positive" ? BENCHMARK_CASES[1].baseline.confidence : 1 - BENCHMARK_CASES[1].baseline.confidence,
      neg_prob: BENCHMARK_CASES[1].baseline.label === "Negative" ? BENCHMARK_CASES[1].baseline.confidence : 1 - BENCHMARK_CASES[1].baseline.confidence,
      latency_ms: BENCHMARK_CASES[1].baseline.latency,
    },
    transformer: {
      model: "DistilBERT (distilbert-base-uncased)",
      label: BENCHMARK_CASES[1].transformer.label,
      confidence: BENCHMARK_CASES[1].transformer.confidence,
      pos_prob: BENCHMARK_CASES[1].transformer.label === "Positive" ? BENCHMARK_CASES[1].transformer.confidence : 1 - BENCHMARK_CASES[1].transformer.confidence,
      neg_prob: BENCHMARK_CASES[1].transformer.label === "Negative" ? BENCHMARK_CASES[1].transformer.confidence : 1 - BENCHMARK_CASES[1].transformer.confidence,
      latency_ms: BENCHMARK_CASES[1].transformer.latency,
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

  const handleTestFromEdgeCases = (sample: BenchmarkSample) => {
    setReviewInput(sample.reviewText);
    handleAnalyze(sample.reviewText);
    changeTab("studio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtered edge cases
  const filteredEdgeCases = BENCHMARK_CASES.filter((c) => {
    const matchesFilter =
      edgeFilter === "All"
        ? true
        : edgeFilter === "Disagreements"
        ? !c.agree
        : c.category.toLowerCase().includes(edgeFilter.toLowerCase());

    const matchesSearch =
      searchQuery === ""
        ? true
        : c.reviewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.notes.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full text-white font-sans antialiased selection:bg-[#E8FF1F] selection:text-black">
      {/* Bento Main Shell */}
      <div className="relative rounded-[28px] bg-black p-4 sm:p-7 border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden">
        
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 bg-[#E8FF1F]/10 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 bg-[#A9B2FF]/10 rounded-full blur-[120px]" />

        {/* Top Header & Page Navigation Tabs */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-tight bg-[#E8FF1F]/10 text-[#E8FF1F] border border-[#E8FF1F]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8FF1F] animate-pulse" />
                Live Review Intelligence
              </span>
              <span className="text-white/40 text-xs font-mono">· Seed 42 Stratified Test Split</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              ReviewLens AI
              <span className="text-xs sm:text-sm font-normal text-white/50 tracking-normal px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 hidden sm:inline">
                Traditional ML vs Contextual Transformers
              </span>
            </h1>
          </div>

          {/* Master Page Switcher Navigation Tabs */}
          <div className="flex items-center overflow-x-auto pb-1 scrollbar-none">
            <nav className="flex p-1 rounded-2xl bg-white/[0.06] border border-white/10" role="tablist">
              <button
                type="button"
                onClick={() => changeTab("studio")}
                aria-pressed={activeTab === "studio"}
                className={`h-9 px-3.5 sm:px-4 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "studio"
                    ? "bg-[#E8FF1F] text-black shadow-[0_0_15px_rgba(232,255,31,0.3)]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Live Studio</span>
              </button>

              <button
                type="button"
                onClick={() => changeTab("benchmark")}
                aria-pressed={activeTab === "benchmark"}
                className={`h-9 px-3.5 sm:px-4 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "benchmark"
                    ? "bg-[#E8FF1F] text-black shadow-[0_0_15px_rgba(232,255,31,0.3)]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Benchmark Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => changeTab("edgecases")}
                aria-pressed={activeTab === "edgecases"}
                className={`h-9 px-3.5 sm:px-4 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "edgecases"
                    ? "bg-[#E8FF1F] text-black shadow-[0_0_15px_rgba(232,255,31,0.3)]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>Edge Cases</span>
              </button>

              <button
                type="button"
                onClick={() => changeTab("architecture")}
                aria-pressed={activeTab === "architecture"}
                className={`h-9 px-3.5 sm:px-4 rounded-xl text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "architecture"
                    ? "bg-[#E8FF1F] text-black shadow-[0_0_15px_rgba(232,255,31,0.3)]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Architecture</span>
              </button>
            </nav>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* PAGE 1: LIVE STUDIO TAB                                                   */}
        {/* ========================================================================= */}
        {activeTab === "studio" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* 12-Column Responsive Bento Grid */}
            <div className="grid grid-cols-12 gap-4">

              {/* CARD 1: LIVE INFERENCE STUDIO (Span 8) */}
              <div className="col-span-12 lg:col-span-8 relative rounded-[28px] overflow-hidden bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E8FF1F]" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                        Dual-Inference Review Analyzer
                      </span>
                    </div>
                    <div className="text-xs font-mono text-white/40">
                      {wordCount} words {isLengthWarning && <span className="text-amber-400 font-semibold">(&gt;512 token boundary)</span>}
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

                  {/* Preset Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
                    <span className="text-[11px] font-mono text-white/40 uppercase whitespace-nowrap">Presets:</span>
                    {BENCHMARK_CASES.slice(0, 6).map((sample) => (
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

                {/* Model Output Cards */}
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
                      <span>In-Domain IMDb Trained</span>
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

                {/* Consensus Banner & Analyze Action */}
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
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="10"
                      />
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

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 2: BENCHMARK MATRIX TAB                                              */}
        {/* ========================================================================= */}
        {activeTab === "benchmark" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Benchmark Header Info */}
            <div className="rounded-[28px] bg-white/[0.03] border border-white/10 p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#E8FF1F] font-mono">
                  Experimental Protocol · Seed 42
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  1,000 Held-Out Stratified IMDb Reviews
                </h2>
                <p className="text-sm text-white/60 mt-1 max-w-2xl">
                  Evaluated on an identical seeded sample (500 positive, 500 negative) comparing in-domain trained ML against SST-2 zero-shot DistilBERT.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-right font-mono">
                  <div className="text-xs text-white/40">Total Test Split</div>
                  <div className="text-xl font-bold text-white">1,000</div>
                </div>
                <div className="p-3 rounded-2xl bg-black/60 border border-white/10 text-right font-mono">
                  <div className="text-xs text-[#E8FF1F]">Accuracy Delta</div>
                  <div className="text-xl font-bold text-[#E8FF1F]">+2.30%</div>
                </div>
              </div>
            </div>

            {/* Confusion Matrices Grid (Span 6 and Span 6) */}
            <div className="grid grid-cols-12 gap-4">
              {/* Baseline Matrix */}
              <div className="col-span-12 lg:col-span-6 rounded-[28px] bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#E8FF1F]" />
                    <h3 className="font-semibold text-white">TF-IDF + Logistic Regression</h3>
                  </div>
                  <span className="text-xs font-mono text-[#E8FF1F] bg-[#E8FF1F]/10 px-2.5 py-0.5 rounded-full border border-[#E8FF1F]/20">
                    Accuracy: 91.30%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center font-mono text-sm mb-4">
                  <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-white/40 mb-1">True Negative (TN)</div>
                    <div className="text-2xl font-bold text-emerald-400">454</div>
                    <div className="text-[10px] text-white/30 mt-1">Correct Negative</div>
                  </div>
                  <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/40">
                    <div className="text-xs text-rose-300 mb-1">False Positive (FP)</div>
                    <div className="text-2xl font-bold text-rose-400">46</div>
                    <div className="text-[10px] text-rose-300/50 mt-1">Type I Error</div>
                  </div>
                  <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/40">
                    <div className="text-xs text-rose-300 mb-1">False Negative (FN)</div>
                    <div className="text-2xl font-bold text-rose-400">41</div>
                    <div className="text-[10px] text-rose-300/50 mt-1">Type II Error</div>
                  </div>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-white/40 mb-1">True Positive (TP)</div>
                    <div className="text-2xl font-bold text-emerald-400">459</div>
                    <div className="text-[10px] text-white/30 mt-1">Correct Positive</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center text-white/60 pt-2 border-t border-white/10">
                  <div>Precision: <b className="text-white">90.89%</b></div>
                  <div>Recall: <b className="text-white">91.80%</b></div>
                  <div>F1: <b className="text-[#E8FF1F]">0.9134</b></div>
                </div>
              </div>

              {/* Transformer Matrix */}
              <div className="col-span-12 lg:col-span-6 rounded-[28px] bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#A9B2FF]" />
                    <h3 className="font-semibold text-white">DistilBERT SST-2 Pretrained</h3>
                  </div>
                  <span className="text-xs font-mono text-[#A9B2FF] bg-[#A9B2FF]/10 px-2.5 py-0.5 rounded-full border border-[#A9B2FF]/20">
                    Accuracy: 89.00%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center font-mono text-sm mb-4">
                  <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-white/40 mb-1">True Negative (TN)</div>
                    <div className="text-2xl font-bold text-emerald-400">453</div>
                    <div className="text-[10px] text-white/30 mt-1">Correct Negative</div>
                  </div>
                  <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/40">
                    <div className="text-xs text-rose-300 mb-1">False Positive (FP)</div>
                    <div className="text-2xl font-bold text-rose-400">47</div>
                    <div className="text-[10px] text-rose-300/50 mt-1">Type I Error</div>
                  </div>
                  <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/40">
                    <div className="text-xs text-rose-300 mb-1">False Negative (FN)</div>
                    <div className="text-2xl font-bold text-rose-400">63</div>
                    <div className="text-[10px] text-rose-300/50 mt-1">Type II Error</div>
                  </div>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/10">
                    <div className="text-xs text-white/40 mb-1">True Positive (TP)</div>
                    <div className="text-2xl font-bold text-emerald-400">437</div>
                    <div className="text-[10px] text-white/30 mt-1">Correct Positive</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center text-white/60 pt-2 border-t border-white/10">
                  <div>Precision: <b className="text-white">90.29%</b></div>
                  <div>Recall: <b className="text-white">87.40%</b></div>
                  <div>F1: <b className="text-[#A9B2FF]">0.8882</b></div>
                </div>
              </div>
            </div>

            {/* Comprehensive Benchmark Table Bento */}
            <div className="rounded-[28px] bg-white/[0.03] border border-white/10 p-5 sm:p-6 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Scientific Metric Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-mono">
                      <th className="pb-3">Evaluation Metric</th>
                      <th className="pb-3 text-[#E8FF1F]">Traditional ML (TF-IDF + LR)</th>
                      <th className="pb-3 text-[#A9B2FF]">DistilBERT Transformer</th>
                      <th className="pb-3">Delta</th>
                      <th className="pb-3 text-right">Advantage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    <tr>
                      <td className="py-3 font-sans font-medium text-white/80">Overall Accuracy</td>
                      <td className="py-3 text-[#E8FF1F] font-bold">91.30%</td>
                      <td className="py-3 text-[#A9B2FF]">89.00%</td>
                      <td className="py-3 text-emerald-400">+2.30%</td>
                      <td className="py-3 text-right font-sans text-xs text-[#E8FF1F]">Traditional ML</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-white/80">Precision (Macro)</td>
                      <td className="py-3 text-[#E8FF1F] font-bold">90.89%</td>
                      <td className="py-3 text-[#A9B2FF]">90.29%</td>
                      <td className="py-3 text-emerald-400">+0.60%</td>
                      <td className="py-3 text-right font-sans text-xs text-[#E8FF1F]">Traditional ML</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-white/80">Recall (Sensitivity)</td>
                      <td className="py-3 text-[#E8FF1F] font-bold">91.80%</td>
                      <td className="py-3 text-[#A9B2FF]">87.40%</td>
                      <td className="py-3 text-emerald-400">+4.40%</td>
                      <td className="py-3 text-right font-sans text-xs text-[#E8FF1F]">Traditional ML</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-white/80">F1-Score (Harmonic Mean)</td>
                      <td className="py-3 text-[#E8FF1F] font-bold">0.9134</td>
                      <td className="py-3 text-[#A9B2FF]">0.8882</td>
                      <td className="py-3 text-emerald-400">+0.0252</td>
                      <td className="py-3 text-right font-sans text-xs text-[#E8FF1F]">Traditional ML</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-white/80">Avg Inference Latency / Review</td>
                      <td className="py-3 text-[#E8FF1F] font-bold">0.45 ms</td>
                      <td className="py-3 text-white/70">250.74 ms</td>
                      <td className="py-3 text-emerald-400">557x speedup</td>
                      <td className="py-3 text-right font-sans text-xs text-[#E8FF1F]">Traditional ML (557x)</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-sans font-medium text-white/80">Model Artifact Storage Size</td>
                      <td className="py-3 text-[#E8FF1F] font-bold">0.28 MB</td>
                      <td className="py-3 text-white/70">268 MB</td>
                      <td className="py-3 text-emerald-400">957x smaller</td>
                      <td className="py-3 text-right font-sans text-xs text-[#E8FF1F]">Traditional ML (957x)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 3: EDGE CASES & DISAGREEMENTS TAB                                    */}
        {/* ========================================================================= */}
        {activeTab === "edgecases" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Edge Cases Header */}
            <div className="rounded-[28px] bg-white/[0.03] border border-white/10 p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FFB37A] font-mono">
                  Qualitative Diagnostic Suite
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  Disagreements & Linguistic Edge Cases
                </h2>
                <p className="text-sm text-white/60 mt-1 max-w-2xl">
                  Across 1,000 held-out reviews, models disagreed on <b>119 cases (11.9%)</b>. Explore real edge cases and test any row in the live studio.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reviews or categories..."
                  className="w-full rounded-xl bg-black/60 border border-white/15 pl-9 pr-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#E8FF1F]"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {["All", "Disagreements", "Sarcasm", "Negation", "Mixed", "Truncation", "Slang"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEdgeFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    edgeFilter === cat
                      ? "bg-[#E8FF1F] text-black"
                      : "bg-white/5 hover:bg-white/10 text-white/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Edge Case Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEdgeCases.map((sample) => (
                <div
                  key={sample.id}
                  className="rounded-[24px] bg-white/[0.03] border border-white/10 p-5 backdrop-blur-xl flex flex-col justify-between hover:border-white/20 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-white/80 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                        {sample.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {sample.agree ? (
                          <span className="inline-flex items-center gap-1 text-[#E8FF1F] text-xs font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Consensus
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-mono">
                            <AlertTriangle className="w-3.5 h-3.5" /> Disagreement
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-white/40">#{sample.id}</span>
                      </div>
                    </div>

                    <p className="text-sm text-white/90 font-serif italic mb-3">
                      &ldquo;{sample.reviewText}&rdquo;
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                      <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                        <div className="text-[10px] text-white/40">TF-IDF Baseline</div>
                        <div className={`font-bold ${sample.baseline.label === "Positive" ? "text-[#E8FF1F]" : "text-rose-400"}`}>
                          {sample.baseline.label} ({(sample.baseline.confidence * 100).toFixed(1)}%)
                        </div>
                      </div>
                      <div className="bg-black/50 p-2.5 rounded-xl border border-white/5">
                        <div className="text-[10px] text-white/40">DistilBERT</div>
                        <div className={`font-bold ${sample.transformer.label === "Positive" ? "text-[#A9B2FF]" : "text-rose-400"}`}>
                          {sample.transformer.label} ({(sample.transformer.confidence * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-white/50 leading-relaxed mb-4">
                      💡 <b>Diagnostic:</b> {sample.notes}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestFromEdgeCases(sample)}
                    className="w-full h-8 rounded-xl bg-white/10 hover:bg-[#E8FF1F] hover:text-black text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Load & Test in Live Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PAGE 4: ARCHITECTURE & METHODOLOGY TAB                                    */}
        {/* ========================================================================= */}
        {activeTab === "architecture" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Architecture Flow Diagram Bento */}
            <div className="rounded-[28px] bg-white/[0.03] border border-white/10 p-6 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#A9B2FF] font-mono">
                System Topology & Pipeline
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 mb-4">
                Dual-Paradigm Comparative Engine Architecture
              </h2>

              {/* Graphical Visual Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                {/* Traditional Pipeline Node */}
                <div className="rounded-2xl bg-black/60 border border-[#E8FF1F]/30 p-5 relative">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono text-[#E8FF1F] bg-[#E8FF1F]/10 mb-3">
                    <Cpu className="w-3.5 h-3.5" /> Paradigm 1: Traditional Machine Learning
                  </div>
                  <h4 className="font-semibold text-white text-base mb-2">
                    N-Gram TF-IDF Vectorizer + Logistic Regression
                  </h4>
                  <ul className="space-y-2 text-xs text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="text-[#E8FF1F] font-mono">01.</span>
                      <span><b>Regex HTML Stripping & Cleaning:</b> Removes HTML break tags, normalizes whitespace.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#E8FF1F] font-mono">02.</span>
                      <span><b>TF-IDF Vectorization:</b> Extracts unigrams & bigrams across 15,000 max features with sublinear TF scaling.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#E8FF1F] font-mono">03.</span>
                      <span><b>In-Domain Training:</b> Fitted on 50,000 full-text IMDb reviews using Scikit-learn Logistic Regression (L2 regularization).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#E8FF1F] font-mono">04.</span>
                      <span><b>Latency & Footprint:</b> ~0.45 ms CPU latency, 0.28 MB serialized `.joblib` artifact.</span>
                    </li>
                  </ul>
                </div>

                {/* Transformer Pipeline Node */}
                <div className="rounded-2xl bg-black/60 border border-[#A9B2FF]/30 p-5 relative">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono text-[#A9B2FF] bg-[#A9B2FF]/10 mb-3">
                    <Brain className="w-3.5 h-3.5" /> Paradigm 2: Contextual Transformer
                  </div>
                  <h4 className="font-semibold text-white text-base mb-2">
                    DistilBERT (distilbert-base-uncased-finetuned-sst-2-english)
                  </h4>
                  <ul className="space-y-2 text-xs text-white/70">
                    <li className="flex items-start gap-2">
                      <span className="text-[#A9B2FF] font-mono">01.</span>
                      <span><b>Hugging Face AutoTokenizer:</b> WordPiece tokenization with a strict 512-token truncation window.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#A9B2FF] font-mono">02.</span>
                      <span><b>Contextual Self-Attention:</b> 6 Transformer layers, 768 hidden dimension, 12 attention heads (66M parameters).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#A9B2FF] font-mono">03.</span>
                      <span><b>Zero-Shot Transfer:</b> Fine-tuned on the Stanford Sentiment Treebank (SST-2) and evaluated zero-shot on IMDb.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#A9B2FF] font-mono">04.</span>
                      <span><b>Latency & Footprint:</b> ~250.7 ms CPU latency, 268 MB cached PyTorch weights.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Calibration Notice Box */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-xs text-white/70">
                <div className="font-semibold text-white flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-[#E8FF1F]" />
                  <span>Model Confidence Calibration Advisory</span>
                </div>
                Confidence scores represent the probability outputs of each respective model: logistic probability from sigmoid log-odds for the Traditional ML baseline, versus softmax temperature-scaled logits for DistilBERT. They reflect internal model certainty, not absolute inter-model calibrated probabilities.
              </div>
            </div>
          </div>
        )}

        {/* Footer Credit & Status */}
        <footer className="flex flex-wrap items-center justify-between gap-3 mt-7 pt-5 border-t border-white/10 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8FF1F]" />
            <span>ReviewLens AI Studio · Dual-Paradigm Sentiment Benchmark</span>
          </div>
          <div className="font-mono text-[11px]">
            Active Tab: <span className="text-white uppercase">{activeTab}</span> · 1,000 Held-Out Reviews
          </div>
        </footer>

      </div>
    </div>
  );
}

export default ReviewLensBento;
