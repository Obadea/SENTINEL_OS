"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { SolidityEditor } from "@/components/solidity-editor";
import {
  IconTarget,
  IconCircleCheckFilled,
  IconAlertCircleFilled,
  IconCpu,
  IconArrowRight,
  IconFileCode,
  IconShieldExclamation,
  IconExternalLink,
  IconCopy
} from "@tabler/icons-react";
import { SecurityPulseChart } from "@/components/security-pulse-chart";
import { DotmSquare14 } from "@/components/ui/dotm-square-14";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/animate/tooltip";

export default function PublicReportPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [codeMode, setCodeMode] = useState<"original" | "optimized">("optimized");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!analysis) return;
    const codeToCopy = codeMode === "optimized" ? analysis.optimizedCode : analysis.originalCode;
    navigator.clipboard.writeText(codeToCopy || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/analysis/public/${id}`);
        setAnalysis(response.data);
      } catch (err: any) {
        console.error("Failed to load report", err);
        setError(err.response?.data?.error || "This audit report could not be found or retrieved.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-[#050505] gap-4 font-mono text-xs text-neon-green uppercase tracking-widest">
        <DotmSquare14 size={30} color="#c8ff00" speed={1.2} bloom />
        <span>Decrypting Audit Report Data...</span>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col h-screen w-screen items-center justify-center bg-[#050505] gap-4 font-mono text-center p-6">
        <div className="w-16 h-16 border border-[#ff4d4d]/30 bg-[#ff4d4d]/5 flex items-center justify-center text-[#ff4d4d]">
          <IconShieldExclamation size={32} />
        </div>
        <h1 className="text-sm font-bold uppercase tracking-widest text-[#ff4d4d]">
          Access Authorization Failure
        </h1>
        <p className="text-xs text-on-surface-variant max-w-md uppercase tracking-wider leading-relaxed opacity-60">
          {error || "The requested audit analysis has either been deleted or the link is invalid."}
        </p>
        <a
          href="/"
          className="mt-4 px-6 py-2.5 border border-wireframe text-[10px] uppercase font-bold tracking-widest hover:border-white/20 text-on-surface transition-colors"
        >
          Return to Hub
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#050505] overflow-hidden text-on-surface select-none font-mono">
      {/* Top Banner Header */}
      <div className="h-[48px] border-b border-wireframe bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 relative">
        <div className="absolute top-0 left-0 w-3 h-px bg-neon-green" />
        <div className="absolute bottom-0 right-0 w-3 h-px bg-neon-green" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-green animate-pulse rounded-none" />
            <span className="text-xs font-bold uppercase tracking-widest text-neon-green">
              SENTINEL_OS // PUBLIC_AUDIT_REPORT
            </span>
          </div>
          <div className="w-px h-4 bg-wireframe" />
          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
            <IconFileCode size={13} className="text-neon-cyan" />
            {analysis.filename}
          </span>
        </div>

        <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          SYSTEM_DECRYPT_OK // {new Date(analysis.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Main Split Grid Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* Left Column: Code Showcase with Toggle */}
        <div className="flex-1 flex flex-col border-r border-wireframe min-w-0 bg-[#050505]">
          <div className="h-[40px] border-b border-wireframe bg-[#0a0a0a]/50 flex items-center justify-between px-4 shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              <IconCpu size={14} className="text-neon-green" />
              <span>Workspace Source Viewer</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 border border-wireframe p-0.5 bg-black">
                <button
                  onClick={() => setCodeMode("original")}
                  className={cn(
                    "px-3 py-1 text-[9px] uppercase tracking-widest font-bold transition-colors",
                    codeMode === "original"
                      ? "bg-white/10 text-white"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  Original
                </button>
                <button
                  onClick={() => setCodeMode("optimized")}
                  className={cn(
                    "px-3 py-1 text-[9px] uppercase tracking-widest font-bold transition-colors",
                    codeMode === "optimized"
                      ? "bg-neon-green text-black"
                      : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  Optimized
                </button>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyCode}
                      className="h-7 px-3 bg-[#0a0a0a] border border-wireframe text-on-surface-variant hover:text-neon-cyan hover:border-neon-cyan/50 text-[9px] font-mono uppercase tracking-widest font-bold transition-all flex items-center gap-1.5 cursor-pointer rounded-none"
                    >
                      {copied ? <IconCircleCheckFilled size={11} className="text-neon-green" /> : <IconCopy size={11} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(0,255,255,0.05)] rounded-none px-2 py-1 !font-mono !text-[9px]">
                    Copy {codeMode === "optimized" ? "Optimized" : "Original"} Source
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <SolidityEditor
              value={codeMode === "optimized" ? analysis.optimizedCode : analysis.originalCode}
              highlightLines={
                codeMode === "optimized"
                  ? { added: analysis.changedLines?.added || [] }
                  : { removed: analysis.changedLines?.removed || [] }
              }
              readOnly
            />
          </div>
        </div>

        {/* Right Column: Security Analysis details */}
        <div className="w-[380px] shrink-0 flex flex-col overflow-y-auto custom-scrollbar bg-[#050505]">
          <div className="p-6 flex flex-col gap-6">

            {/* Verified Deployment Info Card */}
            {analysis.address && (
              <div className="border border-neon-green/30 bg-neon-green/[0.02] p-4 relative overflow-hidden group">
                {/* Tech background grid or scan lines */}
                <div className="absolute top-0 right-0 text-[32px] font-bold text-neon-green/5 font-mono select-none pointer-events-none uppercase">
                  DEPLOY
                </div>
                <div className="absolute -top-2.5 left-4 bg-[#050505] px-2 text-[8px] uppercase tracking-widest text-neon-green font-bold flex items-center gap-1">
                  <span className="w-1 h-1 bg-neon-green rounded-none" />
                  On-Chain Deployment
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-on-surface-variant">
                    <span>Target Network</span>
                    <span className="text-neon-green font-bold">Mantle Mainnet</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-on-surface-variant">
                    <span>Contract Address</span>
                    <TooltipProvider >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-white hover:text-neon-cyan transition-colors select-all font-mono cursor-help">
                            {analysis.address.slice(0, 6)}...{analysis.address.slice(-4)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(200,255,0,0.05)] rounded-none  break-all !font-mono px-1 py-1 !text-[4px]">
                          {analysis.address}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="h-px bg-wireframe my-1" />
                  <a
                    href={`https://mantlescan.xyz/address/${analysis.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 border border-neon-green/45 bg-neon-green/10 hover:bg-neon-green text-neon-green hover:text-black text-[9px] uppercase tracking-widest font-bold transition-all duration-350 cursor-pointer"
                  >
                    <IconExternalLink className="w-3.5 h-3.5" />
                    <span>View Deploy Explorer</span>
                  </a>
                </div>
              </div>
            )}

            {/* Threat Gauge */}
            <div className="border border-wireframe p-4 pt-6 relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#050505] px-2 text-[9px] uppercase tracking-widest text-on-surface-variant">
                Threat Assessment
              </div>
              <SecurityPulseChart value={analysis.securityScore} />
              <p className="text-center text-[10px] mt-4 text-on-surface-variant leading-relaxed uppercase tracking-widest leading-normal">
                {analysis.summary}
              </p>
            </div>

            {/* Optimization Gas Saved stats */}
            {analysis.gasProjection && (
              <div className="border border-wireframe p-4 relative bg-neon-green/[0.01]">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#050505] px-2 text-[8px] uppercase tracking-widest text-neon-green">
                  Gas Efficiency Analysis
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-[18px] font-bold text-neon-green leading-none">
                      -{analysis.gasSavedPercent || analysis.gasProjection.percent}%
                    </span>
                    <span className="text-[8px] text-on-surface-variant uppercase mt-1">Gas Overhead Reduced</span>
                  </div>
                  <IconArrowRight className="text-wireframe w-4 h-4" />
                  <div className="flex flex-col text-right">
                    <span className="text-[18px] font-bold text-on-surface leading-none">
                      {analysis.gasProjection.avgTxCostMNT} MNT
                    </span>
                    <span className="text-[8px] text-on-surface-variant uppercase mt-1">Estimated Avg TX</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mantle Compatibility */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">
                Mantle Compatibility Check
              </div>
              <div className="flex flex-col gap-3 text-[10px] uppercase tracking-widest">
                {(analysis.mantleCompatibility || []).map((c: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    {c.status === "pass" ? <IconCircleCheckFilled className="w-4 h-4 text-neon-green shrink-0" /> :
                      c.status === "fail" ? <IconAlertCircleFilled className="w-4 h-4 text-[#ff4d4d] shrink-0" /> :
                        c.status === "warn" ? <IconAlertCircleFilled className="w-4 h-4 text-neon-violet shrink-0" /> :
                          <div className="w-4 h-4 border border-white/10 shrink-0" />}
                    <span className="text-on-surface opacity-80">{c.check}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-wireframe" />

            {/* Vulnerabilities Section */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-4 flex items-center justify-between">
                <span>Vulnerabilities Identified</span>
                <span className="text-white/40">[{analysis.vulnerabilities?.length || 0}]</span>
              </div>

              <div className="flex flex-col gap-3">
                {analysis.vulnerabilities && analysis.vulnerabilities.length > 0 ? (
                  analysis.vulnerabilities.map((v: any, i: number) => (
                    <div key={i} className={cn(
                      "flex items-start gap-3 p-3 bg-white/[0.02] border-l-2",
                      v.severity === "HIGH" ? "border-[#ff4d4d]" :
                        v.severity === "MED" ? "border-neon-violet" :
                          "border-neon-cyan"
                    )}>
                      <span className="text-on-surface-variant text-[9px] shrink-0">Line {v.line}</span>
                      <div className="flex flex-col gap-1">
                        <p className="text-on-surface font-bold uppercase tracking-widest text-[9px]">
                          {v.title}
                        </p>
                        <p className="text-on-surface-variant text-[10px] leading-relaxed opacity-75 lowercase first-letter:uppercase">
                          {v.message}
                        </p>
                        <p className="text-on-surface-variant text-[9px] mt-1 italic text-neon-cyan/85">
                          Fix: {v.recommendation}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed border-wireframe opacity-30 text-center uppercase tracking-widest gap-2">
                    <IconTarget className="w-6 h-6" />
                    <span className="text-[9px]">No vulnerabilities found</span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-wireframe" />

            {/* Optimization Logs Section */}
            <div>
              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-4 flex items-center justify-between">
                <span>Optimization Logs</span>
                <span className="text-white/40">[{analysis.optimizations?.length || 0}]</span>
              </div>

              <div className="flex flex-col gap-3">
                {analysis.optimizations && analysis.optimizations.length > 0 ? (
                  analysis.optimizations.map((opt: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-neon-green/5 border-l-2 border-neon-green">
                      <span className="text-on-surface-variant text-[9px] shrink-0">Line {opt.line}</span>
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-neon-green font-bold uppercase tracking-widest text-[9px]">
                            {opt.issue}
                          </p>
                          <span className="text-neon-green text-[9px] font-bold">{opt.estimatedGasSaving}</span>
                        </div>
                        <p className="text-on-surface-variant text-[10px] leading-relaxed opacity-75">
                          Fix: <code className="bg-neon-green/10 px-1 rounded text-neon-green text-[9px] font-mono break-all">{opt.fix}</code>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed border-wireframe opacity-30 text-center uppercase tracking-widest gap-2">
                    <IconTarget className="w-6 h-6" />
                    <span className="text-[9px]">No optimizations found</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
