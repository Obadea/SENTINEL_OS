"use client"

import React, { useState, use } from "react"
import {
    IconDownload,
    IconRocket,
    IconShieldCheck,
    IconGasStation,
    IconGauge,
    IconBulb,
    IconChartBar,
    IconChevronLeft,
    IconCopy,
    IconCheck,
    IconShare
} from "@tabler/icons-react"
import Link from "next/link"
import { RippleButton } from "@/components/ui/RippleButton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import api, { setAuthToken } from "@/lib/api"
import { useAuth } from "@clerk/nextjs"
import { GlobalLoader } from "@/components/global-loader"
import { sileo } from "sileo"

export default function OptimizationReportPage({ params }: { params: Promise<{ contractId: string }> }) {
    const { contractId } = use(params)
    const { getToken } = useAuth()
    const [viewMode, setViewMode] = useState<"unified" | "split">("unified")
    const [copied, setCopied] = useState(false)

    const { data: analysis, isLoading, error } = useQuery({
        queryKey: ["analysis", contractId],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            const response = await api.get(`/analysis/${contractId}`)
            return response.data
        }
    })

    if (isLoading) return <GlobalLoader fullScreen />
    if (error || !analysis) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] p-8">
                <div className="text-neon-violet font-mono text-xs uppercase tracking-widest mb-4">Error::Report_Not_Found</div>
                <h1 className="text-2xl font-heading font-black text-on-surface mb-8">ANALYSIS_ID_INVALID</h1>
                <Link href="/dashboard/optimizations">
                    <RippleButton className="h-10 px-6 border border-wireframe text-on-surface-variant font-mono text-[10px] uppercase tracking-widest hover:text-on-surface">
                        Return to Optimizations
                    </RippleButton>
                </Link>
            </div>
        )
    }

    const originalCode = analysis.originalCode?.split("\n") || []
    const optimizedCode = analysis.optimizedCode?.split("\n") || []
    const changedLines = (analysis.changedLines as { removed?: number[]; added?: number[] }) || { removed: [], added: [] }
    const removedSet = new Set(changedLines.removed || [])
    const addedSet = new Set(changedLines.added || [])
    const insights = analysis.optimizationInsights || []
    const isTooLarge = insights.some((ins: string) => ins.toLowerCase().includes("contract too large"))
    const gasProjection = analysis.gasProjection || { before: "0", after: "0", percent: 0 }

    const handleDownloadReport = () => {
        const reportData = JSON.stringify(analysis, null, 2);
        const blob = new Blob([reportData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sentinel-report-${analysis.id.slice(-4)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopyCode = () => {
        const cleanCode = optimizedCode.map((line: string) => line.startsWith("|") ? line.substring(1) : line).join("\n");
        navigator.clipboard.writeText(cleanCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Helper to truncate long filenames keeping extension intact
    const truncateName = (name: string, maxLen = 20) => {
        if (!name) return "";
        if (name.length <= maxLen) return name;
        const dotIndex = name.lastIndexOf(".");
        if (dotIndex !== -1 && name.length - dotIndex <= 5) {
            const ext = name.substring(dotIndex);
            const base = name.substring(0, dotIndex);
            return base.slice(0, maxLen - ext.length - 3) + "..." + ext;
        }
        return name.slice(0, maxLen - 3) + "...";
    }

    // Helper to format gas numbers with commas
    const formatGas = (val: string | number) => {
        const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "").replace(/[MK]/g, (m) => m === "M" ? "000000" : "000")) : val;
        return isNaN(num) ? val : num.toLocaleString();
    }

    // Helper to highlight keywords in insights
    const highlightKeywords = (text: string) => {
        const keywords = ["memory", "calldata", "storage", "external", "public", "internal", "private", "view", "pure", "mapping", "address", "uint256", "bytes", "immutable", "constant"];
        let highlighted = text.replace(/`([^`]+)`/g, '<code class="text-neon-violet font-bold bg-neon-violet/5 px-1">$1</code>');
        keywords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, "gi");
            if (!highlighted.includes(`<code`)) {
                highlighted = highlighted.replace(regex, `<span class="text-neon-violet font-bold">${word}</span>`);
            }
        });
        return highlighted;
    }

    // Advanced Solidity Syntax Highlighter
    const highlightSolidity = (code: string) => {
        if (!code) return "";

        // 1. First, handle strings to avoid highlighting keywords inside them
        let highlighted = code.replace(/'[^']*'|"[^"]*"/g, '<span class="text-[#ff9d4d]">$&</span>');

        // 2. Handle comments
        highlighted = highlighted.replace(/\/\/.*/g, (match) => {
            if (match.includes('class="text-[#ff9d4d]"')) return match;
            return `<span class="text-[#555555] italic">${match}</span>`;
        });

        // 3. Handle types/functions (Cyan)
        const types = /\b(address|uint\d*|int\d*|bool|string|bytes\d*|mapping|struct|enum|event|modifier|constructor)\b/g;
        highlighted = highlighted.replace(types, (match, p1, offset, string) => {
            const before = string.substring(0, offset);
            const insideTag = /<[^>]*$/.test(before);
            if (insideTag) return match;
            return `<span class="text-[#00E5FF] font-bold">${match}</span>`;
        });

        // 4. Handle keywords (Lime Green)
        const keywords = /\b(function|contract|library|interface|returns|return|external|public|internal|private|view|pure|memory|calldata|storage|if|else|for|while|do|break|continue|emit|using|is|new|try|catch|revert|require|assert)\b/g;
        highlighted = highlighted.replace(keywords, (match, p1, offset, string) => {
            const before = string.substring(0, offset);
            const insideTag = /<[^>]*$/.test(before);
            if (insideTag) return match;
            return `<span class="text-[#c8ff00] font-bold">${match}</span>`;
        });

        // 5. Handle numbers (Amber)
        highlighted = highlighted.replace(/\b(\d+)\b/g, (match, p1, offset, string) => {
            const before = string.substring(0, offset);
            const insideTag = /<[^>]*$/.test(before);
            if (insideTag) return match;
            return `<span class="text-[#f0a500]">${match}</span>`;
        });

        return highlighted;
    }

    // Calculate actual gas saved
    const beforeGas = parseFloat(String(gasProjection.before).replace(/,/g, ""));
    const afterGas = parseFloat(String(gasProjection.after).replace(/,/g, ""));
    const gasSavedAmount = beforeGas - afterGas;
    const gasSavedPercent = beforeGas > 0 ? ((gasSavedAmount / beforeGas) * 100).toFixed(1) : "0";

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-y-auto custom-scrollbar">
            {/* Breadcrumbs / Header */}
            <div className="p-8 pb-4">
                <Link
                    href="/dashboard/optimizations"
                    className="flex items-center gap-2 text-on-surface-variant hover:text-neon-green transition-colors font-mono text-[10px] uppercase tracking-[0.2em] mb-6"
                >
                    <IconChevronLeft className="w-3.5 h-3.5" />
                    Back to Index
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-neon-violet font-mono text-[10px] uppercase tracking-widest">
                            <IconShieldCheck className="w-3.5 h-3.5" />
                            Optimization Report #{analysis.id.slice(-4)}
                        </div>
                        <h1 title={analysis.filename} className="text-4xl font-heading font-black uppercase tracking-tighter text-on-surface">
                            {truncateName(analysis.filename, 25)}
                        </h1>
                        <p className="text-on-surface-variant font-mono text-xs max-w-xl leading-relaxed uppercase tracking-wider opacity-70">
                            AI-generated optimization summary focused on gas efficiency<br />
                            and memory management for{" "}
                            {analysis.address ? (
                              <span title={analysis.address} className="text-neon-cyan hover:underline cursor-help font-mono font-bold">
                                {analysis.address.slice(0, 6)}...{analysis.address.slice(-4)}
                              </span>
                            ) : (
                              "development"
                            )}{" "}
                            execution.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadReport}
                            className="flex items-center gap-2 h-9 px-4 border border-wireframe text-on-surface font-mono text-[9px] uppercase tracking-widest hover:bg-white/5 hover:border-white/30 transition-all rounded-none"
                        >
                            <IconDownload className="w-3.5 h-3.5" />
                            Download
                        </button>
                        <button
                            onClick={async () => {
                                const shareUrl = `${window.location.origin}/report/${analysis.id}`;
                                try {
                                    await navigator.clipboard.writeText(shareUrl);
                                    sileo.success({ title: "Report Shared", description: "Public audit report URL copied to clipboard!" });
                                } catch (err) {
                                    console.error(err);
                                    sileo.error({ title: "Share Failed", description: "Failed to copy report URL." });
                                }
                            }}
                            className="flex items-center gap-2 h-9 px-4 border border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/5 hover:border-neon-cyan transition-all font-mono text-[9px] uppercase tracking-widest rounded-none"
                        >
                            <IconShare className="w-3.5 h-3.5" />
                            Share
                        </button>
                        <RippleButton
                            className="h-9 px-4 bg-neon-green text-on-primary font-heading font-black text-[10px] uppercase tracking-widest rounded-none shadow-[0_0_15px_rgba(161,216,0,0.15)] flex items-center gap-2 hover:bg-neon-green/90 transition-all"
                        >
                            <IconRocket className="w-3.5 h-3.5" />
                            Deploy via SDK
                        </RippleButton>
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="px-8 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Gas Saved */}
                <div className="border border-wireframe p-8 bg-[#0a0a0a] relative group overflow-hidden">
                    <IconGasStation className="absolute top-6 right-6 w-8 h-8 text-on-surface-variant/20 group-hover:text-neon-green/40 transition-colors" />
                    <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-[0.2em] mb-4">Gas Saved %</div>
                    <div className="text-5xl font-heading font-black text-neon-green mb-2">{gasSavedPercent}%</div>
                    <div className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-neon-green">↝</span> {formatGas(gasSavedAmount)} Total Gas Saved
                    </div>
                </div>

                {/* Execution Speed */}
                <div className="border border-wireframe p-8 bg-[#0a0a0a] relative group overflow-hidden">
                    <IconGauge className="absolute top-6 right-6 w-8 h-8 text-on-surface-variant/20 group-hover:text-neon-cyan/40 transition-colors" />
                    <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-[0.2em] mb-4">Execution Speed</div>
                    <div className="text-5xl font-heading font-black text-neon-cyan mb-2">1.4x</div>
                    <div className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-2">
                        <IconRocket className="w-3 h-3 text-neon-cyan" /> Optimized Loop Unrolling
                    </div>
                </div>

                {/* Security Score */}
                <div className="border border-wireframe p-8 bg-[#0a0a0a] relative group overflow-hidden">
                    <IconShieldCheck className="absolute top-6 right-6 w-8 h-8 text-on-surface-variant/20 group-hover:text-neon-violet/40 transition-colors" />
                    <div className="text-[10px] font-mono text-on-surface-variant uppercase tracking-[0.2em] mb-4">Security Score</div>
                    <div className="text-5xl font-heading font-black text-on-surface mb-2">{analysis.securityScore}/100</div>
                    <div className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-2">
                        <IconShieldCheck className="w-3 h-3 text-neon-violet" /> {analysis.severityTag || "VERIFIED"}
                    </div>
                </div>
            </div>

            {/* Code Diff Section */}
            <div className="px-8 mb-8">
                <div className="border border-wireframe bg-[#0a0a0a] flex flex-col overflow-hidden">
                    {/* Diff Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-wireframe">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#ff4d4d]" />
                                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Original</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-neon-green" />
                                <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Optimized (AI)</span>
                            </div>
                        </div>

                        <div className="flex border border-wireframe p-0.5 bg-[#050505]">
                            <button
                                onClick={() => setViewMode("unified")}
                                className={cn(
                                    "px-4 py-1 text-[9px] font-mono uppercase tracking-widest transition-all",
                                    viewMode === "unified" ? "bg-neon-green text-on-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
                                )}
                            >
                                Unified
                            </button>
                            <button
                                onClick={() => setViewMode("split")}
                                className={cn(
                                    "px-4 py-1 text-[9px] font-mono uppercase tracking-widest transition-all",
                                    viewMode === "split" ? "bg-neon-green text-on-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
                                )}
                            >
                                Split
                            </button>
                        </div>
                    </div>

                    {/* Diff Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-wireframe font-mono text-[11px] leading-relaxed min-h-[400px]">
                        {/* Original Section */}
                        <div className="flex flex-col bg-[#050505] min-h-full">
                            <div className="flex items-center gap-2 px-6 py-2 bg-white/[0.02] border-b border-wireframe/50 shrink-0">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/50">Source: Original_Contract</span>
                            </div>
                            <div className="p-6 flex-1 h-full overflow-x-auto custom-scrollbar">
                                {originalCode.map((line: string, i: number) => {
                                    const lineNum = i + 1;
                                    const isChanged = line.trim().startsWith("|") || removedSet.has(lineNum);
                                    const cleanLine = line.startsWith("|") ? line.substring(1) : line;

                                    return (
                                        <div key={i} className={cn(
                                            "flex gap-4 group relative min-h-[1.5rem]",
                                            isChanged ? "bg-red-500/15" : "hover:bg-white/[0.02]"
                                        )}>
                                            {isChanged && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500 shadow-[2px_0_10px_rgba(239,68,68,0.2)]" />}
                                            <span className="w-8 text-on-surface-variant/30 text-right select-none border-r border-wireframe/10 pr-2 pt-0.5 shrink-0">{lineNum}</span>
                                            <span
                                                className={cn("whitespace-pre-wrap break-all pl-2 pt-0.5 flex-1", isChanged ? "text-on-surface font-medium" : "text-on-surface-variant/80")}
                                                dangerouslySetInnerHTML={{ __html: highlightSolidity(cleanLine) }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Optimized Section */}
                        <div className="flex flex-col bg-neon-green/[0.01] min-h-full">
                            <div className="flex items-center justify-between px-6 py-2 bg-neon-green/[0.03] border-b border-wireframe/50 shrink-0">
                                <span className="text-[8px] font-bold uppercase tracking-widest text-neon-green/50">Source: Optimized_Result</span>
                                <RippleButton
                                    onClick={handleCopyCode}
                                    className="h-6 px-3 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-none text-[8px] font-mono uppercase tracking-widest flex items-center gap-2 hover:bg-neon-green/20 transition-all"
                                >
                                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    {copied ? "Copied" : "Copy Code"}
                                </RippleButton>
                            </div>
                            <div className="p-6 flex-1 h-full overflow-x-auto custom-scrollbar">
                                {optimizedCode.map((line: string, i: number) => {
                                    const lineNum = i + 1;
                                    const isChanged = line.trim().startsWith("|") || addedSet.has(lineNum);
                                    const cleanLine = line.startsWith("|") ? line.substring(1) : line;

                                    return (
                                        <div key={i} className={cn(
                                            "flex gap-4 group relative min-h-[1.5rem]",
                                            isChanged ? "bg-neon-green/10" : "hover:bg-neon-green/[0.03]"
                                        )}>
                                            {isChanged && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-neon-green shadow-[0_0_8px_rgba(161,216,0,0.4)]" />}
                                            <span className="w-8 text-neon-green/30 text-right select-none border-r border-wireframe/10 pr-2 pt-0.5 shrink-0">{lineNum}</span>
                                            <span
                                                className={cn("whitespace-pre-wrap break-all pl-2 pt-0.5 flex-1", isChanged ? "text-on-surface font-medium" : "text-on-surface-variant/80")}
                                                dangerouslySetInnerHTML={{ __html: highlightSolidity(cleanLine) }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights & Projection */}
            <div className="px-8 grid grid-cols-1 lg:grid-cols-5 gap-6 mb-12">
                {/* Insights */}
                <div className="lg:col-span-3 border border-wireframe p-8 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3 mb-6">
                        <IconBulb className="size-7 text-neon-green" />
                        <h2 className="text-xl font-heading font-black uppercase tracking-tight text-on-surface">Optimization Insight</h2>
                    </div>

                    <ul className="space-y-4">
                        {insights.length > 0 ? insights.map((insight: string, i: number) => (
                            <li key={i} className="flex gap-4 text-xs font-mono text-on-surface-variant leading-relaxed items-start">
                                <div className="w-1.5 h-1.5 rounded-full bg-neon-green mt-1.5 shrink-0" />
                                <div dangerouslySetInnerHTML={{ __html: highlightKeywords(insight) }} />
                            </li>
                        )) : (
                            <li className="text-xs font-mono text-on-surface-variant opacity-50 italic">No specific optimization insights provided by AI.</li>
                        )}
                    </ul>

                    {isTooLarge && analysis.optimizations && analysis.optimizations.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-wireframe/20 space-y-4">
                            <div className="text-[10px] font-mono text-neon-green uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                                <span className="animate-pulse">⚡</span> Recommended Function Optimizations
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {analysis.optimizations.map((opt: any, i: number) => (
                                    <div key={i} className="flex flex-col gap-2 p-3 bg-white/[0.01] border-l border-neon-green font-mono text-xs hover:bg-white/[0.02] transition-all">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-[9px] text-on-surface-variant/60 font-bold">Line {opt.line}</span>
                                            <span className="text-neon-green font-bold text-[10px]">{opt.estimatedGasSaving}</span>
                                        </div>
                                        <div className="text-on-surface font-heading font-black uppercase tracking-wider text-[10px]">
                                            {opt.issue}
                                        </div>
                                        <div className="text-on-surface-variant/80 leading-relaxed text-[11px] mt-1">
                                            Fix: <code className="bg-neon-green/10 text-neon-green px-1.5 py-0.5 rounded font-mono text-[10px] break-all">{opt.fix}</code>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Projection */}
                <div className="lg:col-span-2 border border-wireframe p-8 bg-[#0a0a0a] overflow-hidden relative group">
                    {/* Decorative grid background */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-neon-green) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <IconChartBar className="size-7 text-neon-green" />
                        <h2 className="text-xl font-heading font-black uppercase tracking-tight text-on-surface">Gas Usage Projection</h2>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="space-y-3">
                            <div className="flex justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">
                                <span>Before Optimization</span>
                                <span className="text-on-surface font-bold">{formatGas(gasProjection.before)} Gas</span>
                            </div>
                            <div className="h-2 bg-[#1a1a1a] w-full">
                                <div className="h-full bg-[#ff4d4d]/60 w-full animate-pulse" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-[9px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">
                                <span>After Optimization</span>
                                <span className="text-neon-green font-bold">{formatGas(gasProjection.after)} Gas</span>
                            </div>
                            <div className="h-2 bg-[#1a1a1a] w-full">
                                <div className="h-full bg-neon-green shadow-[0_0_10px_rgba(161,216,0,0.5)] transition-all duration-1000 ease-out" style={{ width: `${100 - parseFloat(gasSavedPercent)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Padding */}
            <div className="h-8" />
        </div>
    )
}
