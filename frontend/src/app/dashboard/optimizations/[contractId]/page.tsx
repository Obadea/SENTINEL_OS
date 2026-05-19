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
    IconShare,
    IconAlertTriangle,
    IconWallet,
    IconExternalLink,
    IconX,
    IconLoader2
} from "@tabler/icons-react"
import { ethers } from "ethers"
import Link from "next/link"
import { RippleButton } from "@/components/ui/RippleButton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import api, { setAuthToken } from "@/lib/api"
import { useAuth } from "@clerk/nextjs"
import { GlobalLoader } from "@/components/global-loader"
import { sileo } from "sileo"
import {
    Code,
    CodeBlock,
    CodeHeader
} from "@/components/animate-ui/components/animate/code"
import { FolderOpenIcon, FileCodeIcon } from "lucide-react"
import { SolidityEditor } from "@/components/solidity-editor"
import {
    TooltipProvider,
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/animate-ui/primitives/animate/tooltip"

export default function OptimizationReportPage({ params }: { params: Promise<{ contractId: string }> }) {
    const { contractId } = use(params)
    const { getToken } = useAuth()
    const [viewMode, setViewMode] = useState<"unified" | "split">("unified")
    const [copied, setCopied] = useState(false)

    // Deployment Flow States
    const [isDeployModalOpen, setIsDeployModalOpen] = useState(false)
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false)
    const [useOptimized, setUseOptimized] = useState(true)
    const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet")
    const [constructorValues, setConstructorValues] = useState<Record<string, string>>({})
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [compiling, setCompiling] = useState(false)
    const [deploying, setDeploying] = useState(false)
    const [deploySteps, setDeploySteps] = useState<Array<{ label: string; status: "idle" | "loading" | "success" | "error"; details?: string }>>([])
    const [contractAddress, setContractAddress] = useState<string | null>(null)
    const [txHash, setTxHash] = useState<string | null>(null)
    const [abi, setAbi] = useState<any>(null)
    const [bytecode, setBytecode] = useState<string>("")
    const [constructorArgs, setConstructorArgs] = useState<any[]>([])

    // Self-contained compilation workspace states (no useAudit tabs or localStorage)
    const [extraFiles, setExtraFiles] = useState<Array<{ id: string; filename: string; originalCode: string; optimizedCode: string | null; useOptimized: boolean }>>([])
    const [isAddFileDialogOpen, setIsAddFileDialogOpen] = useState(false)
    const [isCodePreviewOpen, setIsCodePreviewOpen] = useState(false)
    const [selectedPreviewFileId, setSelectedPreviewFileId] = useState<string | null>(null)
    const [previewTab, setPreviewTab] = useState<"original" | "optimized">("optimized")
    const [understandRisks, setUnderstandRisks] = useState(false)

    const { data: analysis, isLoading, error } = useQuery({
        queryKey: ["analysis", contractId],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            const response = await api.get(`/analysis/${contractId}`)
            return response.data
        }
    })

    const { data: historyData } = useQuery({
        queryKey: ["history"],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            const response = await api.get("/analysis/history")
            return response.data?.records || []
        }
    })



    // Close modals on Escape key down (fully inclusive of new subdialogs)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsDeployModalOpen(false);
                setIsWarningModalOpen(false);
                setIsAddFileDialogOpen(false);
                setIsCodePreviewOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Compile automatically when optimized choice or extraFiles changes
    React.useEffect(() => {
        if (!isDeployModalOpen) return;
        if (!analysis?.id) return;

        const loadCompilationDetails = async () => {
            setCompiling(true);
            setConstructorArgs([]);
            setConstructorValues({});

            // Set compiler progress step
            setDeploySteps([
                { label: "Compile Contract Source", status: "loading" as const },
                { label: "Connect to Mantle Network", status: "idle" as const },
                { label: "Authorize MetaMask Transaction", status: "idle" as const },
                { label: "Confirm On-Chain Deployment", status: "idle" as const }
            ]);

            try {
                const token = await getToken();
                setAuthToken(token);

                const compResponse = await api.post("/analysis/compile", {
                    analysisId: analysis.id,
                    useOptimized,
                    extraFiles: extraFiles.map(f => ({
                        name: f.filename,
                        content: (f.useOptimized && f.optimizedCode) ? f.optimizedCode : f.originalCode
                    }))
                });

                const { abi: compiledAbi, bytecode: compiledBytecode, constructorArgs: args } = compResponse.data;
                setAbi(compiledAbi);
                setBytecode(compiledBytecode);
                setConstructorArgs(args);

                setDeploySteps([
                    { label: "Compile Contract Source", status: "success" as const },
                    { label: "Connect to Mantle Network", status: "idle" as const },
                    { label: "Authorize MetaMask Transaction", status: "idle" as const },
                    { label: "Confirm On-Chain Deployment", status: "idle" as const }
                ]);
            } catch (err: any) {
                console.error("Auto compilation failed:", err);
                setDeploySteps([
                    { label: "Compile Contract Source", status: "error" as const, details: err.response?.data?.error || err.message || "Failed to compile contract." },
                    { label: "Connect to Mantle Network", status: "idle" as const },
                    { label: "Authorize MetaMask Transaction", status: "idle" as const },
                    { label: "Confirm On-Chain Deployment", status: "idle" as const }
                ]);
                sileo.error({ title: "Compilation Failed", description: err.response?.data?.error || "Solidity compiler error occurred." });
            } finally {
                setCompiling(false);
            }
        };

        loadCompilationDetails();
    }, [isDeployModalOpen, useOptimized, extraFiles, analysis?.id]);

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



    const handleOpenDeploy = () => {
        if (analysis.securityScore < 60) {
            setIsWarningModalOpen(true);
        } else {
            setIsDeployModalOpen(true);
        }
    };

    const handleConnectWallet = async () => {
        if (!(window as any).ethereum) {
            sileo.error({ title: "MetaMask Missing", description: "Please install MetaMask to deploy contracts." });
            return;
        }
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            setWalletAddress(accounts[0]);
            sileo.success({ title: "Wallet Connected", description: `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` });
        } catch (err: any) {
            sileo.error({ title: "Connection Failed", description: err.message || "Failed to connect wallet." });
        }
    };

    const switchToMantleNetwork = async () => {
        if (!(window as any).ethereum) return;

        const chainIdHex = network === "testnet" ? "0x138B" : "0x1388"; // 5003 or 5000 in hex
        const chainName = network === "testnet" ? "Mantle Sepolia Testnet" : "Mantle Mainnet";
        const rpcUrls = network === "testnet" ? ["https://rpc.sepolia.mantle.xyz"] : ["https://rpc.mantle.xyz"];
        const blockExplorerUrls = network === "testnet" ? ["https://explorer.sepolia.mantle.xyz"] : ["https://explorer.mantle.xyz"];

        try {
            await (window as any).ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: chainIdHex }]
            });
        } catch (err: any) {
            if (err.code === 4902) {
                await (window as any).ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [{
                        chainId: chainIdHex,
                        chainName,
                        nativeCurrency: { name: "MNT", symbol: "MNT", decimals: 18 },
                        rpcUrls,
                        blockExplorerUrls
                    }]
                });
            } else {
                throw err;
            }
        }
    };

    const handleDeploy = async () => {
        if (!walletAddress) {
            sileo.error({ title: "Deploy Failed", description: "Please connect your wallet first." });
            return;
        }

        setDeploying(true);
        setContractAddress(null);
        setTxHash(null);

        const initialSteps = [
            { label: "Compile Contract Source", status: "success" as const },
            { label: "Connect to Mantle Network", status: "loading" as const },
            { label: "Authorize MetaMask Transaction", status: "idle" as const },
            { label: "Confirm On-Chain Deployment", status: "idle" as const }
        ];
        setDeploySteps(initialSteps);

        try {
            // 1. Switch network
            await switchToMantleNetwork();
            setDeploySteps(prev => {
                const next = [...prev];
                next[1].status = "success";
                next[2].status = "loading";
                return next;
            });

            // 2. Format parameters
            const orderedValues = constructorArgs.map((arg: any, idx: number) => {
                const val = constructorValues[arg.name || idx] || "";
                if (arg.type.startsWith("uint") || arg.type.startsWith("int")) {
                    return BigInt(val || "0");
                }
                if (arg.type === "bool") {
                    return val.toLowerCase() === "true" || val === "1";
                }
                return val;
            });

            // 3. Create Contract Factory and Deploy
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();

            // Clean Bytecode string (must start with 0x)
            let formattedBytecode = bytecode;
            if (!formattedBytecode.startsWith("0x")) {
                formattedBytecode = "0x" + formattedBytecode;
            }

            const factory = new ethers.ContractFactory(abi, formattedBytecode, signer);
            const contract = await factory.deploy(...orderedValues);

            const tx = contract.deploymentTransaction();
            if (tx) {
                setTxHash(tx.hash);
            }

            setDeploySteps(prev => {
                const next = [...prev];
                next[2].status = "success";
                next[3].status = "loading";
                return next;
            });

            // 4. Wait for confirmation
            await contract.waitForDeployment();
            const address = await contract.getAddress();
            setContractAddress(address);

            setDeploySteps(prev => {
                const next = [...prev];
                next[3].status = "success";
                return next;
            });

            sileo.success({ title: "Contract Deployed!", description: `Deployed at ${address}` });

        } catch (err: any) {
            console.error("Deploy failed:", err);
            setDeploySteps(prev => {
                return prev.map(step => {
                    if (step.status === "loading") {
                        return { ...step, status: "error" as const, details: err.message || "Failed to complete step." };
                    }
                    return step;
                });
            });
            sileo.error({ title: "Deploy Failed", description: err.message || "On-chain deployment aborted." });
        } finally {
            setDeploying(false);
        }
    };

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

                    <div className="flex gap-2 items-center">
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
                        {analysis.address ? (
                            <button
                                disabled
                                className="h-9 px-4 border border-wireframe/45 text-on-surface-variant/40 font-mono text-[9px] uppercase tracking-widest rounded-none cursor-not-allowed flex items-center gap-2"
                            >
                                <IconRocket className="w-3.5 h-3.5" />
                                Deployed at {analysis.address.slice(0, 6)}...{analysis.address.slice(-4)}
                            </button>
                        ) : (
                            <RippleButton
                                onClick={handleOpenDeploy}
                                className="h-9 px-4 bg-neon-green text-on-primary font-heading font-black text-[10px] uppercase tracking-widest rounded-none shadow-[0_0_15px_rgba(161,216,0,0.15)] flex items-center gap-2 hover:bg-neon-green/90 transition-all"
                            >
                                <IconRocket className="w-3.5 h-3.5" />
                                Deploy to Mantle
                            </RippleButton>
                        )}
                    </div>
                </div>
            </div>

            {analysis.address && (
                <div className="mx-8 mt-4 border border-neon-cyan/30 bg-neon-cyan/5 p-4 rounded-none font-mono text-[10px] text-neon-cyan uppercase tracking-wider leading-relaxed">
                    ℹ️ This contract is already deployed at <span className="font-bold underline">{analysis.address}</span>. Deploy is only available for contracts audited here.
                </div>
            )}

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

            {/* 🚀 Mantle Deploy Modal */}
            {isDeployModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
                    <div className="w-full max-w-4xl border border-wireframe bg-[#050505] shadow-[0_0_60px_rgba(161,216,0,0.08)] relative grid grid-cols-1 md:grid-cols-2 rounded-none">

                        {/* Corner Tech Accents */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-green" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-green" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-green" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-green" />

                        <button
                            onClick={() => setIsDeployModalOpen(false)}
                            className="absolute top-6 right-6 text-on-surface-variant hover:text-neon-green transition-colors font-mono text-[10px] uppercase tracking-wider z-10"
                        >
                            [Esc] Close
                        </button>

                        {/* Left Column: Configuration */}
                        <div className="p-8 border-b md:border-b-0 md:border-r border-wireframe space-y-6">
                            <div className="space-y-1">
                                <div className="text-neon-green font-mono text-[10px] uppercase tracking-widest">
                                    Mantle Deployment Engine
                                </div>
                                <h2 className="text-xl font-heading font-black uppercase tracking-tight text-on-surface">
                                    {truncateName(analysis.filename, 20)}
                                </h2>
                            </div>

                            {/* Select Version */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">
                                        Select Compiler Source
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsCodePreviewOpen(true)}
                                        className="text-[9px] font-mono text-neon-cyan hover:underline uppercase tracking-widest font-bold inline-flex items-center gap-1"
                                    >
                                        Preview Code
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setUseOptimized(false)}
                                        className={cn(
                                            "h-8 border font-mono text-[9px] uppercase tracking-widest transition-all rounded-none",
                                            !useOptimized
                                                ? "border-neon-cyan text-neon-cyan bg-neon-cyan/5 font-bold"
                                                : "border-wireframe text-on-surface-variant hover:border-white/30"
                                        )}
                                    >
                                        Original Code
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUseOptimized(true)}
                                        className={cn(
                                            "h-8 border font-mono text-[9px] uppercase tracking-widest transition-all rounded-none",
                                            useOptimized
                                                ? "border-neon-green text-neon-green bg-neon-green/5 font-bold"
                                                : "border-wireframe text-on-surface-variant hover:border-white/30"
                                        )}
                                    >
                                        Optimized (AI)
                                    </button>
                                </div>
                            </div>

                            {/* Extra Files Section */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">
                                        Additional Contract Files
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddFileDialogOpen(true)}
                                        className="text-[9px] font-mono text-neon-green hover:underline uppercase tracking-widest font-bold inline-flex items-center gap-1"
                                    >
                                        ➕ Add File ({extraFiles.length})
                                    </button>
                                </div>
                                <p className="text-[8.5px] font-mono text-on-surface-variant/70 uppercase tracking-wider leading-relaxed">
                                    Only needed if your contract imports custom files.
                                </p>

                                {extraFiles.length > 0 ? (
                                    <div className="flex flex-col gap-2 pt-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                        {extraFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between gap-4 bg-[#0a0a0a] border border-neon-cyan/30 text-neon-cyan font-mono text-[9px] uppercase px-3 py-1.5 rounded-none animate-fade-in"
                                            >
                                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                    <span className="truncate text-[10px] font-bold text-on-surface">{file.filename}</span>
                                                    {/* Switch compiler code source selection */}
                                                    <div className="flex gap-2 items-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setExtraFiles(prev => prev.map(f => f.id === file.id ? { ...f, useOptimized: false } : f))
                                                            }}
                                                            className={cn(
                                                                "text-[8px] font-mono px-1.5 py-0.5 border rounded-none transition-all uppercase",
                                                                !file.useOptimized
                                                                    ? "border-neon-cyan text-neon-cyan bg-neon-cyan/5 font-bold"
                                                                    : "border-wireframe text-on-surface-variant hover:text-white"
                                                            )}
                                                        >
                                                            Original
                                                        </button>
                                                        {file.optimizedCode && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setExtraFiles(prev => prev.map(f => f.id === file.id ? { ...f, useOptimized: true } : f))
                                                                }}
                                                                className={cn(
                                                                    "text-[8px] font-mono px-1.5 py-0.5 border rounded-none transition-all uppercase",
                                                                    file.useOptimized
                                                                        ? "border-neon-green text-neon-green bg-neon-green/5 font-bold"
                                                                        : "border-wireframe text-on-surface-variant hover:text-white"
                                                                )}
                                                            >
                                                                Optimized (AI)
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <TooltipProvider >
                                                    <Tooltip >
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={() => setExtraFiles(prev => prev.filter(f => f.id !== file.id))}
                                                                className="hover:text-red-500 font-bold p-1 text-[11px] shrink-0"
                                                            >
                                                                ✕
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-black border border-wireframe text-neon-cyan font-mono text-[9px] uppercase tracking-widest rounded-none p-2">
                                                            Remove dependency file
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-[9px] font-mono text-on-surface-variant/50 uppercase tracking-widest border border-dashed border-wireframe/40 p-3 text-center">
                                        No custom reference files selected
                                    </div>
                                )}
                            </div>

                            {/* Select Network */}
                            <div className="space-y-2">
                                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">
                                    Target Network
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNetwork("testnet")}
                                        className={cn(
                                            "h-8 border font-mono text-[9px] uppercase tracking-widest transition-all rounded-none",
                                            network === "testnet"
                                                ? "border-neon-cyan text-neon-cyan bg-neon-cyan/5 font-bold"
                                                : "border-wireframe text-on-surface-variant hover:border-white/30"
                                        )}
                                    >
                                        Mantle Testnet
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNetwork("mainnet")}
                                        className={cn(
                                            "h-8 border font-mono text-[9px] uppercase tracking-widest transition-all rounded-none",
                                            network === "mainnet"
                                                ? "border-neon-cyan text-neon-cyan bg-neon-cyan/5 font-bold"
                                                : "border-wireframe text-on-surface-variant hover:border-white/30"
                                        )}
                                    >
                                        Mantle Mainnet
                                    </button>
                                </div>
                                {network === "mainnet" && (
                                    <div className="bg-red-500/10 border-l-2 border-red-500 p-2.5 font-mono text-[9.5px] text-red-400 uppercase tracking-wider leading-relaxed flex items-center gap-1.5">
                                        <IconAlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                        <span>YOU ARE DEPLOYING TO MAINNET. REAL MNT WILL BE USED.</span>
                                    </div>
                                )}
                            </div>

                            {/* Security Gate */}
                            {analysis.securityScore !== null && analysis.securityScore < 60 && (
                                <div className="border border-red-500/40 bg-red-500/5 p-4 space-y-3 rounded-none">
                                    <div className="font-mono text-[10px] text-red-400 uppercase tracking-wider leading-relaxed font-bold flex items-center gap-1.5">
                                        <IconAlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                        <span>HIGH RISK: This contract has critical vulnerabilities. Deploying is strongly discouraged.</span>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={understandRisks}
                                            onChange={(e) => setUnderstandRisks(e.target.checked)}
                                            className="w-4 h-4 bg-[#0a0a0a] border border-wireframe accent-red-500 rounded-none shrink-0"
                                        />
                                        <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest font-bold">
                                            I understand the security risks
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* Constructor Arguments Form */}
                            {constructorArgs.length > 0 && (
                                <div className="space-y-4 border-t border-wireframe pt-4">
                                    <span className="text-[9px] font-mono uppercase tracking-widest text-neon-cyan">
                                        Constructor Parameters ({constructorArgs.length})
                                    </span>
                                    <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                        {constructorArgs.map((arg: any, idx: number) => (
                                            <div key={idx} className="flex flex-col gap-1.5">
                                                <label className="text-[9px] font-mono uppercase tracking-widest text-on-surface-variant/80">
                                                    {arg.name || `Argument #${idx}`} ({arg.type})
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder={`e.g. ${arg.type.startsWith("uint") ? "1000000" : "0x742d..."}`}
                                                    value={constructorValues[arg.name || idx] || ""}
                                                    onChange={(e) => setConstructorValues(prev => ({ ...prev, [arg.name || idx]: e.target.value }))}
                                                    className="w-full bg-[#0a0a0a] border border-wireframe px-3 py-2 text-xs font-mono text-on-surface focus:outline-none focus:border-neon-green rounded-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Wallet Action Panel */}
                            <div className="border-t border-wireframe pt-4 flex flex-col gap-3">
                                {walletAddress ? (
                                    <div className="flex items-center justify-between border border-neon-cyan/25 bg-neon-cyan/5 p-3 font-mono text-[10px] text-neon-cyan rounded-none">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                                            <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                                        </div>
                                        <span className="text-[8px] bg-neon-cyan/15 px-1.5 py-0.5 uppercase tracking-widest font-bold">
                                            Connected
                                        </span>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleConnectWallet}
                                        className="w-full h-9 border border-neon-cyan text-neon-cyan bg-transparent hover:bg-neon-cyan/5 font-mono text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-none"
                                    >
                                        <IconWallet className="w-3.5 h-3.5" />
                                        Connect MetaMask Wallet
                                    </button>
                                )}

                                <div className="text-[9px] font-mono text-on-surface-variant/70 uppercase tracking-wide leading-relaxed">
                                    Need testnet MNT?{" "}
                                    <a
                                        href="https://faucet.sepolia.mantle.xyz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-neon-cyan hover:underline hover:text-neon-cyan/80 font-bold inline-flex items-center gap-0.5"
                                    >
                                        Mantle Testnet Faucet
                                        <IconExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Deployment logs and outputs */}
                        <div className="p-8 bg-[#070707] flex flex-col justify-between space-y-6">
                            <div>
                                <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-on-surface-variant mb-6">
                                    Deployment Log & Output
                                </div>

                                {deploySteps.length === 0 ? (
                                    <div className="border border-dashed border-wireframe/40 p-6 flex flex-col items-center justify-center text-center space-y-3 h-[240px]">
                                        <IconRocket className="w-8 h-8 text-on-surface-variant/30" />
                                        <p className="text-[10px] font-mono text-on-surface-variant/80 uppercase tracking-widest leading-relaxed">
                                            Configure settings and click Deploy to launch on Mantle.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                        {deploySteps.map((step, idx) => (
                                            <div key={idx} className="flex flex-col gap-1 p-3 bg-white/[0.01] border border-wireframe/30">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono text-on-surface uppercase tracking-wide">
                                                        {step.label}
                                                    </span>
                                                    {step.status === "loading" && (
                                                        <IconLoader2 className="w-3.5 h-3.5 text-neon-cyan animate-spin" />
                                                    )}
                                                    {step.status === "success" && (
                                                        <IconCheck className="w-3.5 h-3.5 text-neon-green" />
                                                    )}
                                                    {step.status === "error" && (
                                                        <IconX className="w-3.5 h-3.5 text-red-500" />
                                                    )}
                                                    {step.status === "idle" && (
                                                        <div className="w-2 h-2 rounded-full bg-on-surface-variant/20" />
                                                    )}
                                                </div>
                                                {step.details && (
                                                    <div className="mt-2 border-t border-red-500/10 pt-2 space-y-2">
                                                        <p className="text-[9px] font-mono text-red-400 whitespace-pre-wrap break-words">
                                                            Error: {step.details}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Deployment Outputs */}
                            <div className="space-y-4 pt-4 border-t border-wireframe/40">
                                {txHash && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-mono uppercase tracking-widest text-on-surface-variant/60">
                                            Transaction Hash
                                        </span>
                                        <div className="flex items-center justify-between bg-[#0a0a0a] border border-wireframe px-2 py-1.5">
                                            <span className="text-[10px] font-mono text-on-surface truncate pr-4">
                                                {txHash}
                                            </span>
                                            <a
                                                href={`${network === "testnet" ? "https://explorer.sepolia.mantle.xyz" : "https://explorer.mantle.xyz"}/tx/${txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] font-mono text-neon-cyan hover:underline flex items-center gap-0.5 font-bold shrink-0"
                                            >
                                                View Tx
                                                <IconExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {contractAddress && (
                                    <div className="flex flex-col gap-1 border border-neon-green/30 bg-neon-green/5 p-3">
                                        <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-neon-green font-bold">
                                            Contract Successfully Deployed!
                                        </span>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[10px] font-mono text-on-surface truncate pr-4 font-bold">
                                                {contractAddress}
                                            </span>
                                            <a
                                                href={`${network === "testnet" ? "https://explorer.sepolia.mantle.xyz" : "https://explorer.mantle.xyz"}/address/${contractAddress}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[9px] font-mono text-neon-green hover:underline flex items-center gap-0.5 font-bold shrink-0"
                                            >
                                                Explorer
                                                <IconExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    disabled={
                                        deploying ||
                                        !walletAddress ||
                                        compiling ||
                                        (analysis.securityScore !== null && analysis.securityScore < 60 && !understandRisks)
                                    }
                                    onClick={handleDeploy}
                                    className="w-full h-10 bg-neon-green text-on-primary font-heading font-black text-xs uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neon-green/90 shadow-[0_0_20px_rgba(161,216,0,0.15)] flex items-center justify-center gap-2 rounded-none"
                                >
                                    {deploying ? (
                                        <>
                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                            Deploying Contract...
                                        </>
                                    ) : (
                                        <>
                                            <IconRocket className="w-4 h-4" />
                                            Confirm Deployment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 📁 Add File Dialog */}
            {isAddFileDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <div className="w-full max-w-lg border border-wireframe bg-[#050505] p-8 shadow-[0_0_60px_rgba(161,216,0,0.08)] relative rounded-none flex flex-col max-h-[80vh]">
                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-cyan" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-cyan" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-cyan" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan" />

                        <button
                            onClick={() => setIsAddFileDialogOpen(false)}
                            className="absolute top-6 right-6 text-on-surface-variant hover:text-neon-cyan transition-colors font-mono text-[10px] uppercase tracking-wider z-10"
                        >
                            [Esc] Close
                        </button>

                        <div className="space-y-1 mb-6">
                            <div className="text-neon-cyan font-mono text-[10px] uppercase tracking-widest">
                                Workspace Dependencies
                            </div>
                            <h2 className="text-xl font-heading font-black uppercase tracking-tight text-on-surface">
                                Select Dependency Files
                            </h2>
                            <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider leading-relaxed pt-1">
                                Choose contracts from your auditing history to add as compiler references.
                            </p>
                        </div>

                        {/* List of Contracts */}
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 max-h-[350px]">
                            {historyData && historyData.length > 0 ? (
                                historyData
                                    .filter((item: any) => item.id !== analysis.id) // exclude current contract
                                    .map((item: any) => {
                                        const isSelected = extraFiles.some(f => f.id === item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setExtraFiles(prev => prev.filter(f => f.id !== item.id));
                                                    } else {
                                                        setExtraFiles(prev => [...prev, {
                                                            id: item.id,
                                                            filename: item.filename,
                                                            originalCode: item.originalCode,
                                                            optimizedCode: item.optimizedCode,
                                                            useOptimized: false
                                                        }]);
                                                    }
                                                }}
                                                className={cn(
                                                    "p-4 border transition-all cursor-pointer flex flex-col gap-2 rounded-none",
                                                    isSelected
                                                        ? "border-neon-cyan bg-neon-cyan/5"
                                                        : "border-wireframe/40 bg-[#070707] hover:border-wireframe"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-mono font-bold text-on-surface truncate pr-2">
                                                        {item.filename}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[9px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-widest",
                                                        item.securityScore >= 80 ? "text-neon-green bg-neon-green/10" :
                                                            item.securityScore >= 60 ? "text-neon-cyan bg-neon-cyan/10" : "text-red-500 bg-red-500/10"
                                                    )}>
                                                        Score: {item.securityScore ?? "N/A"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-[8.5px] font-mono text-on-surface-variant uppercase tracking-widest">
                                                    <span>{item.severityTag || "INFO"}</span>
                                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                            ) : (
                                <div className="p-8 text-center border border-dashed border-wireframe/40 text-[10px] font-mono text-on-surface-variant uppercase tracking-widest">
                                    No historical audit records found.
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsAddFileDialogOpen(false)}
                                className="h-9 px-6 bg-neon-cyan text-black font-heading font-black text-[10px] uppercase tracking-widest hover:bg-neon-cyan/90 transition-all rounded-none"
                            >
                                Done Selecting
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 📝 View Code Preview Modal */}
            {isCodePreviewOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <div className="w-full max-w-5xl h-[85vh] border border-wireframe bg-[#050505] p-8 shadow-[0_0_60px_rgba(0,229,255,0.08)] relative rounded-none flex flex-col">
                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-cyan" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-cyan" />
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-cyan" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan" />

                        <button
                            onClick={() => {
                                setIsCodePreviewOpen(false);
                                setSelectedPreviewFileId(null);
                            }}
                            className="absolute top-6 right-6 text-on-surface-variant hover:text-neon-cyan transition-colors font-mono text-[10px] uppercase tracking-wider z-10"
                        >
                            [Esc] Close
                        </button>

                        <div className="space-y-1 mb-6">
                            <div className="text-neon-cyan font-mono text-[10px] uppercase tracking-widest">
                                Code Source Inspector
                            </div>
                            <h2 className="text-xl font-heading font-black uppercase tracking-tight text-on-surface">
                                Preview Workspace
                            </h2>
                        </div>

                        <WorkspaceInspector
                            key={extraFiles.map(f => f.id).join(",")}
                            analysis={analysis}
                            extraFiles={extraFiles}
                            selectedPreviewFileId={selectedPreviewFileId}
                            setSelectedPreviewFileId={setSelectedPreviewFileId}
                            previewTab={previewTab}
                            setPreviewTab={setPreviewTab}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

interface WorkspaceInspectorProps {
    analysis: any;
    extraFiles: Array<{ id: string; filename: string; originalCode: string; optimizedCode: string | null; useOptimized: boolean }>;
    selectedPreviewFileId: string | null;
    setSelectedPreviewFileId: (id: string | null) => void;
    previewTab: "original" | "optimized";
    setPreviewTab: (tab: "original" | "optimized") => void;
}

function WorkspaceInspector({
    analysis,
    extraFiles,
    selectedPreviewFileId,
    setSelectedPreviewFileId,
    previewTab,
    setPreviewTab,
}: WorkspaceInspectorProps) {
    const allFiles = [
        { id: null, filename: analysis?.filename || "main.sol", isMain: true },
        ...extraFiles.map(f => ({ id: f.id, filename: f.filename, isMain: false })),
    ];

    const activeFileObj = selectedPreviewFileId === null
        ? analysis
        : extraFiles.find(f => f.id === selectedPreviewFileId);
    const hasOptimized = !!activeFileObj?.optimizedCode;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0">
            {/* Left Side: File Tree */}
            <div className="md:col-span-1 border border-wireframe bg-[#070707] p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2 overflow-x-hidden">
                <div className="text-[9px] font-mono text-on-surface-variant uppercase tracking-widest mb-2">
                    Files In Workspace
                </div>

                {/* Contracts folder row */}
                <div className="flex items-center gap-2 py-1 px-2">
                    <FolderOpenIcon className="size-3.5 text-amber-500 shrink-0" />
                    <span className="font-mono text-[10px] text-amber-400/80 uppercase tracking-widest select-none">contracts</span>
                </div>

                {/* Files nested under folder */}
                <div className="flex flex-col gap-0.5 pl-4 border-l border-wireframe/30">
                    {allFiles.map((file) => {
                        const isSelected = file.id === null
                            ? selectedPreviewFileId === null
                            : selectedPreviewFileId === file.id;

                        return (
                            <button
                                key={file.id ?? "main"}
                                type="button"
                                onClick={() => setSelectedPreviewFileId(file.id)}
                                className={cn(
                                    "flex items-center gap-2 w-full text-left px-2 py-1.5 font-mono text-[10px] transition-all rounded-none group",
                                    isSelected
                                        ? "bg-neon-cyan/10 text-neon-cyan font-bold border-l-2 border-neon-cyan -ml-px pl-[calc(0.5rem-1px)]"
                                        : "text-on-surface-variant hover:text-white hover:bg-white/[0.03]"
                                )}
                            >
                                <FileCodeIcon className={cn(
                                    "pointer-events-none size-3.5 shrink-0",
                                    isSelected ? "text-neon-cyan" : "text-blue-500/70 group-hover:text-blue-400"
                                )} />
                                <span className="truncate">{file.filename}</span>
                                {file.isMain && (
                                    <span className="ml-auto shrink-0 text-[7px] font-mono uppercase tracking-widest text-neon-green/60">main</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right Side: Code Viewer */}
            <div className="md:col-span-3 flex flex-col overflow-hidden relative border border-wireframe/40 bg-[#050505] min-h-0">
                {/* Tabs */}
                {hasOptimized ? (
                    <div className="flex gap-2 border-b border-wireframe/40 bg-[#090909] px-4 py-2 shrink-0">
                        <button
                            onClick={() => setPreviewTab("original")}
                            className={cn(
                                "px-3 py-1 font-mono text-[9px] uppercase tracking-wider transition-all border-b-2 rounded-none",
                                previewTab === "original"
                                    ? "border-neon-cyan text-neon-cyan font-bold"
                                    : "border-transparent text-on-surface-variant hover:text-white"
                            )}
                        >
                            Original Source
                        </button>
                        <button
                            onClick={() => setPreviewTab("optimized")}
                            className={cn(
                                "px-3 py-1 font-mono text-[9px] uppercase tracking-wider transition-all border-b-2 rounded-none",
                                previewTab === "optimized"
                                    ? "border-neon-green text-neon-green font-bold"
                                    : "border-transparent text-on-surface-variant hover:text-white"
                            )}
                        >
                            Optimized (AI)
                        </button>
                    </div>
                ) : (
                    <div className="border-b border-wireframe/40 bg-[#090909] px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-neon-cyan shrink-0">
                        Dependency Contract File (Original Only)
                    </div>
                )}

                {/* Editor */}
                <div className="flex-1 min-h-0 relative bg-[#050505]">
                    <SolidityEditor
                        key={selectedPreviewFileId === null ? `main-${previewTab}` : `${selectedPreviewFileId}-${previewTab}`}
                        value={
                            selectedPreviewFileId === null
                                ? (previewTab === "original" ? (analysis.originalCode || "") : (analysis.optimizedCode || ""))
                                : (() => {
                                    const file = extraFiles.find(f => f.id === selectedPreviewFileId);
                                    if (!file) return "";
                                    if (previewTab === "optimized" && file.optimizedCode) return file.optimizedCode;
                                    return file.originalCode || "";
                                })()
                        }
                        readOnly={true}
                    />
                </div>
            </div>
        </div>
    );
}
