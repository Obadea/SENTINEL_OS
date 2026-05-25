"use client";

import { useState, useEffect, useRef } from "react";
import { useAudit } from "@/context/audit-context";
import { SolidityEditor } from "@/components/solidity-editor";
import { sileo } from "sileo";
import {
  IconFileCode,
  IconPlus,
  IconDeviceFloppy,
  IconCopy,
  IconTarget,
  IconCircleCheckFilled,
  IconAlertCircleFilled,
  IconChevronDown,
  IconChevronUp,
  IconTerminal,
  IconExternalLink,
  IconUpload,
  IconDownload,
  IconLoader2,
  IconX,
  IconShare
} from "@tabler/icons-react";
import { SecurityPulseChart } from "@/components/security-pulse-chart";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsContents } from "@/components/animate-ui/components/animate/tabs";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { SparklesIcon, type SparklesIconHandle } from "@/components/icons/sparkles";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/animate/tooltip";
export default function DashboardPage() {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    addTab,
    removeTab,
    code,
    setCode,
    fileName,
    setFileName,
    scanStatus,
    scanProgress,
    analysis,
    terminalLogs,
    analyze,
    importContract,
    addLog
  } = useAudit();

  const sparklesRef = useRef<SparklesIconHandle>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importAddress, setImportAddress] = useState("");
  const [importNetwork, setImportNetwork] = useState<"mainnet" | "testnet">("mainnet");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportAddress("");
    setImportError("");
    setIsImporting(false);
  };

  const handleImport = async () => {
    const address = importAddress.trim();
    if (!address) return;

    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(address)) {
      setImportError("Invalid Ethereum address format (0x + 40 hex chars).");
      return;
    }

    setImportError("");
    setIsImporting(true);

    try {
      await importContract(address, importNetwork);
      closeImportModal();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "Failed to import contract";
      setImportError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  // Close on Esc, Import on Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isImportModalOpen) return;
      if (e.key === "Escape") {
        closeImportModal();
      } else if (e.key === "Enter" && importAddress && !isImporting) {
        handleImport();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImportModalOpen, importAddress, importNetwork, isImporting]);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("vulnerabilities");
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  // Focus terminal input when tab changes to terminal
  useEffect(() => {
    if (activeTab === "terminal" && !isBottomCollapsed) {
      setTimeout(() => terminalInputRef.current?.focus(), 100);
    }
  }, [activeTab, isBottomCollapsed]);


  // Auto-switch tab when scanning starts or finishes
  useEffect(() => {
    if (scanStatus === "SCANNING") {
      setActiveTab("terminal");
      setIsBottomCollapsed(false);
    } else if (scanStatus === "COMPLETE") {
      setActiveTab("vulnerabilities");
    }
  }, [scanStatus]);

  // Auto-switch bottom tab to terminal when changing active workspace tab
  useEffect(() => {
    setActiveTab("terminal");
  }, [activeTabId]);

  const handleFileRead = (file: File) => {
    if (!file.name.endsWith(".sol")) {
      addLog(`ERROR: Unsupported file type: ${file.name}. Only .sol files are allowed.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      addTab(file.name, content);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleTerminalCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const cmd = terminalInput.trim();
      addLog(`sentinel@mantle:~/workspace$ ${cmd}`);

      if (cmd === "npm run analyze" || cmd === "analyze") {
        analyze(true);
      } else if (cmd === "help" || cmd === "/help") {
        addLog("Available commands:");
        addLog("  analyze, npm run analyze - Start contract vulnerability scan");
        addLog("  help, /help            - Show this help message");
        addLog("  clear                  - Clear terminal history (mock)");
      } else if (cmd === "clear") {
        // We might need a clear method in context, but for now just log
        addLog("Terminal cleared (mock)");
      } else if (cmd !== "") {
        addLog(`ERROR: Command not found: ${cmd}`);
      }

      setTerminalInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden">
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: Editor Container */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 border-r border-wireframe">
          {/* Workspace Header / Tabs */}
          <div className="flex items-center justify-between border-b border-wireframe bg-[#0a0a0a] min-w-0">
            <div className="flex items-center min-w-0 overflow-x-auto scrollbar-none flex-1">
              <TooltipProvider >
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTabId;
                  const isTabScanning = tab.scanStatus === "SCANNING";
                  const isTabComplete = tab.scanStatus === "COMPLETE";
                  const isTabFailed = tab.scanStatus === "FAILED";

                  return (
                    <div
                      key={tab.id}
                      onClick={() => {
                        if (!isActive) {
                          setActiveTabId(tab.id);
                          setIsEditingName(false); // Reset name editing when switching
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 font-mono text-xs cursor-pointer select-none transition-all border-r border-wireframe h-10 border-t-2 shrink-0 group relative",
                        isActive
                          ? "bg-[#050505] border-t-neon-green text-on-surface"
                          : "bg-[#0a0a0a] border-t-transparent text-on-surface-variant hover:text-on-surface hover:bg-[#070707]"
                      )}
                    >
                      {isTabScanning ? (
                        <IconLoader2 className="w-3.5 h-3.5 text-neon-cyan animate-spin shrink-0" />
                      ) : (
                        <IconFileCode className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          isActive ? "text-neon-green" : "text-on-surface-variant group-hover:text-neon-green"
                        )} />
                      )}

                      {/* Rename active file on double click */}
                      {isActive && isEditingName ? (
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          onBlur={() => setIsEditingName(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditingName(false);
                            if (e.key === 'Escape') setIsEditingName(false);
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent border-none outline-none text-xs font-mono text-on-surface w-32 focus:ring-0 p-0"
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setIsEditingName(true);
                              }}
                              className="text-xs font-mono truncate max-w-[120px] cursor-text"
                            >
                              {tab.fileName}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(200,255,0,0.05)] rounded-none">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-neon-green">
                              Double-click to rename
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Status Pill Dot */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0 cursor-help",
                            isTabScanning ? "bg-neon-cyan animate-pulse" :
                              isTabComplete ? "bg-neon-green" :
                                isTabFailed ? "bg-[#ff4d4d]" :
                                  "bg-white/10"
                          )} />
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(200,255,0,0.05)] rounded-none">
                          <span className={cn(
                            "font-mono text-[9px] uppercase tracking-wider",
                            isTabScanning ? "text-neon-cyan" :
                              isTabComplete ? "text-neon-green" :
                                isTabFailed ? "text-[#ff4d4d]" :
                                  "text-on-surface-variant opacity-60"
                          )}>
                            {isTabScanning ? "Scan in progress" :
                              isTabComplete ? "Scan complete (Audited)" :
                                isTabFailed ? "Scan failed" :
                                  "Draft (Waiting to scan)"}
                          </span>
                        </TooltipContent>
                      </Tooltip>

                      {/* Close Tab Button */}
                      {tabs.length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTab(tab.id);
                              }}
                              className="p-0.5 text-on-surface-variant hover:text-[#ff4d4d] hover:bg-white/5 transition-colors ml-1 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                            >
                              <IconX className="w-3 h-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(255,77,77,0.05)] rounded-none">
                            <span className="font-mono text-[9px] uppercase tracking-wider text-[#ff4d4d]">
                              Close Tab
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  );
                })}

                {/* Add New Tab Button (Limit 3) */}
                {tabs.length < 3 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => addTab()}
                        className="p-3 text-on-surface-variant hover:text-neon-green hover:bg-neon-green/5 transition-colors border-r border-wireframe group h-10 flex items-center justify-center shrink-0"
                      >
                        <IconPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(200,255,0,0.05)] rounded-none">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-neon-green">
                        New Contract ({tabs.length}/3)
                      </span>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Upload file on current tab */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-on-surface-variant hover:text-neon-cyan hover:bg-neon-cyan/5 transition-colors border-r border-wireframe group h-10 flex items-center justify-center shrink-0"
                    >
                      <IconUpload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(0,255,255,0.05)] rounded-none">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neon-cyan">Upload .sol</span>
                  </TooltipContent>
                </Tooltip>

                {/* Import verified contract address on current tab */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="p-3 text-on-surface-variant hover:text-neon-green hover:bg-neon-green/5 transition-colors border-r border-wireframe group h-10 flex items-center justify-center shrink-0"
                    >
                      <IconDownload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(200,255,0,0.05)] rounded-none">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neon-green">Import Contract</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                ref={fileInputRef}
                type="file"
                accept=".sol"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-2 text-on-surface-variant px-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="p-2 hover:text-neon-cyan transition-colors" onClick={() => navigator.clipboard.writeText(code)}>
                      <IconCopy className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#050505] border border-wireframe text-on-surface shadow-[0_0_10px_rgba(0,255,255,0.05)] rounded-none">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-neon-cyan">
                      Copy Code
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Editor Content */}
          <div
            className="flex-1 w-full relative overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <SolidityEditor
              value={code}
              onChange={(val) => setCode(val || "")}
            />
          </div>

          {/* Bottom Tabs Section */}
          <div className="border-t border-wireframe bg-[#0a0a0a] flex flex-col shrink-0">
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val);
                if (isBottomCollapsed) setIsBottomCollapsed(false);
              }}
              className="gap-0"
            >
              <div className="flex items-center justify-between px-4 border-b border-wireframe h-10 shrink-0">
                <TabsList className="bg-transparent p-0 gap-6 border-none shadow-none relative rounded-none">
                  <TabsTrigger
                    value="vulnerabilities"
                    className="h-10 rounded-none bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neon-green text-[10px] font-mono font-bold uppercase tracking-widest px-1"
                  >
                    Vulnerabilities {analysis?.vulnerabilities ? `(${analysis.vulnerabilities.length})` : "(0)"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="optimizations"
                    className="h-10 rounded-none bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neon-green text-[10px] font-mono font-bold uppercase tracking-widest px-1"
                  >
                    Optimization Logs
                  </TabsTrigger>
                  <TabsTrigger
                    value="terminal"
                    className="h-10 rounded-none bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-neon-green text-[10px] font-mono font-bold uppercase tracking-widest px-1"
                  >
                    Terminal
                  </TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest">Scan_Status:</span>
                    <div className="w-24 h-1 bg-surface-container overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-500 ease-out",
                          scanStatus === "SCANNING" ? "bg-neon-cyan" :
                            scanStatus === "COMPLETE" ? "bg-neon-green" :
                              scanStatus === "FAILED" ? "bg-[#ff4d4d]" :
                                "bg-white/10"
                        )}
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsBottomCollapsed(!isBottomCollapsed)}
                    className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
                  >
                    {isBottomCollapsed ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                  </button>
                </div>
              </div>

              <div className={cn(
                "transition-[height] duration-300 ease-in-out overflow-x-hidden overflow-y-scroll custom-scrollbar bg-[#050505]",
                isBottomCollapsed ? "h-0" : "h-[260px]"
              )}>
                <TabsContents className="h-full ">
                  <TabsContent value="vulnerabilities" className="h-full overflow-y-auto custom-scrollbar p-4 font-mono text-xs">
                    {analysis?.vulnerabilities && analysis.vulnerabilities.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {analysis.vulnerabilities.map((v: any, i: number) => (
                          <div key={i} className={cn(
                            "flex items-start gap-4 p-3 bg-white/[0.02] border-l-2",
                            v.severity === "HIGH" ? "border-[#ff4d4d]" :
                              v.severity === "MED" ? "border-neon-violet" :
                                "border-neon-cyan"
                          )}>
                            <span className="text-on-surface-variant shrink-0">Line {v.line}</span>
                            <span className={cn(
                              "font-bold shrink-0",
                              v.severity === "HIGH" ? "text-[#ff4d4d]" :
                                v.severity === "MED" ? "text-neon-violet" :
                                  "text-neon-cyan"
                            )}>[{v.severity}]</span>
                            <div className="flex flex-col gap-1">
                              <p className="text-on-surface font-bold uppercase tracking-widest text-[10px]">
                                {v.title}
                              </p>
                              <p className="text-on-surface-variant opacity-80 leading-relaxed">
                                {v.message}
                              </p>
                              <p className="text-on-surface-variant text-[11px] mt-1 italic">
                                Recommendation: {v.recommendation}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-30 text-center uppercase tracking-widest gap-2">
                        <IconTarget className="w-8 h-8" />
                        <span>No vulnerabilities detected in latest scan.</span>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="optimizations" className="h-full overflow-y-auto custom-scrollbar p-4 font-mono text-xs">
                    {analysis?.optimizations && analysis.optimizations.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {analysis.optimizations.map((opt: any, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-3 bg-neon-green/5 border-l-2 border-neon-green">
                            <span className="text-on-surface-variant shrink-0">Line {opt.line}</span>
                            <div className="flex flex-col gap-1 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-neon-green font-bold uppercase tracking-widest text-[10px]">
                                  {opt.issue}
                                </p>
                                <span className="text-neon-green font-mono text-[9px]">{opt.estimatedGasSaving}</span>
                              </div>
                              <p className="text-on-surface-variant opacity-80 leading-relaxed">
                                Fix: <code className="bg-neon-green/10 px-1 rounded text-neon-green">{opt.fix}</code>
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="mt-4 flex justify-center">
                          <Link
                            href={`/dashboard/optimizations/${analysis.id}`}
                            className="flex items-center gap-2 px-6 py-2 border border-neon-green text-neon-green font-heading font-black text-[11px] uppercase tracking-widest hover:bg-neon-green/10 transition-all group"
                          >
                            Deep Bytecode Optimization Report
                            <IconExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="text-on-surface-variant italic text-center mt-10 opacity-30 uppercase tracking-widest text-[10px]">
                        No optimization logs available for current scan.
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="terminal" className="h-full overflow-hidden">
                    <div
                      className="h-full overflow-y-auto custom-scrollbar p-4 font-mono text-xs cursor-text"
                      onClick={() => terminalInputRef.current?.focus()}
                    >
                      <div className="flex flex-col gap-1 min-h-full justify-end">
                        {terminalLogs.map((log, i) => {
                          const isError = log.toLowerCase().includes("error") || log.toLowerCase().includes("failed");
                          const isSystem = log.startsWith("sentinel");

                          return (
                            <div key={i} className={cn(
                              "flex items-center gap-2 flex-wrap",
                              isError ? "text-[#ff4d4d]" : "text-neon-green"
                            )}>
                              {isSystem && <IconTerminal size={14} className="shrink-0" />}
                              <span className={cn(!isSystem && !isError && "text-on-surface-variant")}>
                                {log}
                              </span>
                            </div>
                          );
                        })}

                        <div className="flex items-center gap-2 mt-1">
                          <IconTerminal size={14} className="text-neon-green shrink-0" />
                          <span className="text-neon-green shrink-0">sentinel@mantle:~/workspace$</span>
                          <input
                            ref={terminalInputRef}
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={handleTerminalCommand}
                            disabled={scanStatus === "SCANNING"}
                            className="bg-transparent border-none outline-none text-neon-green flex-1 p-0 focus:ring-0 min-w-[50px]"
                            autoFocus
                          />
                        </div>
                        <div ref={terminalEndRef} />
                      </div>
                    </div>
                  </TabsContent>
                </TabsContents>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Right: Security Pulse Sidebar */}
        <div className="w-[340px] shrink-0 bg-[#050505] flex flex-col overflow-y-auto custom-scrollbar hidden lg:flex">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-wireframe min-h-[40.9px] gap-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-neon-green">Security Pulse</h2>
            <LiquidButton
                variant="default"
                size="default"
                disabled={scanStatus === "SCANNING"}
                onClick={() => analyze()}
                onMouseEnter={() => sparklesRef.current?.startAnimation()}
                onMouseLeave={() => sparklesRef.current?.stopAnimation()}
                className="font-mono uppercase text-xs tracking-widest rounded-none font-medium disabled:opacity-50 disabled:cursor-not-allowed h-9 px-5 whitespace-nowrap"
            >
                <SparklesIcon
                    ref={sparklesRef}
                    size={14}
                    className="text-neon-green"
                />
                {scanStatus === "SCANNING" ? "Analyzing..." : "Analyze"}
            </LiquidButton>
          </div>

          <div className="p-6 flex flex-col gap-8">
            {/* Threat Assessment */}
            <div className="border border-wireframe p-4 pt-6 relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#050505] px-2 text-[9px] font-mono uppercase tracking-widest text-on-surface-variant">
                Threat Assessment
              </div>
              <SecurityPulseChart value={analysis?.securityScore || 0} />
              <p className="text-center text-[10px] font-mono mt-4 text-on-surface-variant leading-relaxed uppercase tracking-widest">
                {analysis?.summary || (scanStatus === "IDLE" ? "Awaiting scan input..." : "Analyzing contract vectors...")}
              </p>
            </div>

            {/* Gas Estimates */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-3 flex items-center justify-between">
                <span>Gas Estimates (MNT)</span>
                <span className="text-[8px] opacity-40">Estimated</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-wireframe p-3 bg-[#0a0a0a]">
                  <div className="text-[9px] font-mono text-on-surface-variant mb-1 uppercase">Deploy</div>
                  <div className="font-mono text-[12px] text-on-surface">
                    {analysis?.gasProjection?.deployCostMNT || "0.0000"} MNT
                  </div>
                </div>
                <div className="border border-wireframe p-3 bg-[#0a0a0a]">
                  <div className="text-[9px] font-mono text-on-surface-variant mb-1 uppercase">Avg_TX</div>
                  <div className="font-mono text-[12px] text-on-surface">
                    {analysis?.gasProjection?.avgTxCostMNT || "0.0000"} MNT
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-wireframe" />

            {/* Mantle Compatibility */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant mb-4">
                Mantle Compatibility
              </div>
              <div className="flex flex-col gap-4 text-[10px] font-mono uppercase tracking-widest">
                {(analysis?.mantleCompatibility || [
                  { check: "L2 Data Availability Optimism", status: "idle" },
                  { check: "Bedrock Execution Support", status: "idle" },
                  { check: "EigenDA Payload Alignment", status: "idle" }
                ]).map((c: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    {c.status === "pass" ? <IconCircleCheckFilled className="w-4 h-4 text-neon-green shrink-0" /> :
                      c.status === "fail" ? <IconAlertCircleFilled className="w-4 h-4 text-[#ff4d4d] shrink-0" /> :
                        c.status === "warn" ? <IconAlertCircleFilled className="w-4 h-4 text-neon-violet shrink-0" /> :
                          <div className="w-4 h-4 border border-white/10 shrink-0" />}
                    <span className={cn(
                      c.status === "idle" ? "text-on-surface-variant opacity-40" : "text-on-surface"
                    )}>{c.check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Contract Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0a0a0a] border-2 border-wireframe p-6 relative rounded-none flex flex-col gap-6 shadow-[0_0_30px_rgba(200,255,0,0.1)]">

            {/* Corner Tech Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-green" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-green" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-green" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-green" />

            <div className="flex items-center justify-between border-b border-wireframe pb-3">
              <div className="flex items-center gap-2">
                <IconDownload className="w-5 h-5 text-neon-green" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-on-surface">
                  Import Contract
                </h3>
              </div>
              <button
                onClick={closeImportModal}
                className="text-on-surface-variant hover:text-neon-green transition-colors font-mono text-xs uppercase"
              >
                [Esc] Close
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider leading-relaxed">
                Paste a verified 0x smart contract address to automatically fetch and load its source code from Mantle Blockscout Explorer.
              </p>

              {/* Network Toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neon-green">
                  Target_Network
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportNetwork("mainnet")}
                    className={cn(
                      "py-2 border font-mono text-xs uppercase tracking-wider transition-all",
                      importNetwork === "mainnet"
                        ? "border-neon-green text-neon-green bg-neon-green/5"
                        : "border-wireframe text-on-surface-variant hover:border-white/20"
                    )}
                  >
                    Mantle Mainnet
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportNetwork("testnet")}
                    className={cn(
                      "py-2 border font-mono text-xs uppercase tracking-wider transition-all",
                      importNetwork === "testnet"
                        ? "border-neon-green text-neon-green bg-neon-green/5"
                        : "border-wireframe text-on-surface-variant hover:border-white/20"
                    )}
                  >
                    Mantle Testnet
                  </button>
                </div>
              </div>

              {/* Address Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neon-cyan">
                  Contract_Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={importAddress}
                  onChange={(e) => {
                    setImportAddress(e.target.value);
                    if (importError) setImportError("");
                  }}
                  disabled={isImporting}
                  className="w-full bg-[#050505] border border-wireframe px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-neon-cyan transition-colors placeholder:text-white/20"
                />
              </div>

              {importError && (
                <div className="text-[10px] font-mono text-[#ff4d4d] border border-[#ff4d4d]/30 bg-[#ff4d4d]/5 p-2 uppercase tracking-wide">
                  ERROR: {importError}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={closeImportModal}
                disabled={isImporting}
                className="flex-1 py-2.5 border border-wireframe text-[10px] font-mono font-bold uppercase tracking-widest text-on-surface hover:bg-white/5 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !importAddress}
                className="flex-1 py-2.5 bg-neon-green border border-neon-green text-black text-[10px] font-mono font-black uppercase tracking-widest hover:bg-[#b0e000] hover:border-[#b0e000] transition-colors disabled:opacity-40 disabled:hover:bg-neon-green flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <IconLoader2 className="w-3.5 h-3.5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import Source"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
