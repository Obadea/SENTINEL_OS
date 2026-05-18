"use client"

import React, { useState, useMemo } from "react"
import { SearchIcon, ChevronDownIcon, HistoryIcon } from "lucide-react"
import { RocketIcon } from "@/components/icons/rocket"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RippleButton } from "@/components/ui/RippleButton"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

import { useQuery } from "@tanstack/react-query"
import api, { setAuthToken } from "@/lib/api"
import { useAuth } from "@clerk/nextjs"
import { DotmSquare14 } from "@/components/ui/dotm-square-14"
import Link from "next/link"
import { sileo } from "sileo"
import { IconShare } from "@tabler/icons-react"

const RISK_CONFIG = {
    CRITICAL_PASS: {
        label: "OPTIMIZED",
        scoreColor: "text-neon-green",
        badgeClass: "border-neon-green text-neon-green bg-neon-green/10",
        barColor: "bg-neon-green",
    },
    CRITICAL: {
        label: "INEFFICIENT",
        scoreColor: "text-[#ff4d4d]",
        badgeClass: "border-[#ff4d4d] text-[#ff4d4d] bg-[#ff4d4d]/10",
        barColor: "bg-[#ff4d4d]",
    },
    HIGH_RISK: {
        label: "STABLE",
        scoreColor: "text-[#ff9e9e]",
        badgeClass: "border-[#ff9e9e] text-[#ff9e9e] bg-[#ff9e9e]/10",
        barColor: "bg-[#ff9e9e]",
    },
    MEDIUM_RISK: {
        label: "REFINED",
        scoreColor: "text-neon-violet",
        badgeClass: "border-neon-violet text-neon-violet bg-neon-violet/10",
        barColor: "bg-neon-violet",
    },
    LOW_RISK: {
        label: "EFFICIENT",
        scoreColor: "text-neon-cyan",
        badgeClass: "border-neon-cyan text-neon-cyan bg-neon-cyan/10",
        barColor: "bg-neon-cyan",
    },
} as const;

const PAGE_SIZE = 10;

export default function OptimizationsPage() {
    const { getToken } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<"All" | "< 80" | "90+">("All")
    const [currentPage, setCurrentPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ["optimizations", currentPage],
        queryFn: async () => {
            const token = await getToken()
            setAuthToken(token)
            const response = await api.get("/analysis/history", {
                params: {
                    page: currentPage,
                    limit: PAGE_SIZE
                }
            })
            return response.data
        }
    })

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

    const auditHistory = data?.records || []
    const totalRecords = data?.total || 0
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE)

    const filteredData = useMemo(() => {
        return auditHistory.filter((item: any) => {
            const matchesSearch = item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.address && item.address.toLowerCase().includes(searchQuery.toLowerCase()));

            let matchesStatus = true;
            if (statusFilter === "< 80") {
                matchesStatus = Number(item.gasEfficiency || 0) < 80;
            } else if (statusFilter === "90+") {
                matchesStatus = Number(item.gasEfficiency || 0) >= 90;
            }

            return matchesSearch && matchesStatus;
        })
    }, [auditHistory, searchQuery, statusFilter]);

    const avgSaving = useMemo(() => {
        if (!auditHistory || auditHistory.length === 0) return "0.0";
        const sum = auditHistory.reduce((acc: number, curr: any) => acc + Number(curr.gasEfficiency || 0), 0);
        return (sum / auditHistory.length).toFixed(1);
    }, [auditHistory]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050505] overflow-hidden">
            {/* Header Section */}
            <div className="p-10 pb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-heading font-black uppercase tracking-tighter text-on-surface mb-2">
                        BYTECODE_OPTIMIZATIONS
                    </h1>
                    <p className="text-on-surface-variant font-mono text-xs max-w-2xl leading-relaxed uppercase tracking-wider opacity-70">
                        Detailed analysis of gas efficiency, opcode refinements, and<br />
                        storage layout optimizations for high-performance contracts.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="border border-wireframe p-5 w-44 bg-[#0a0a0a] relative">
                        <div className="absolute -top-2 left-2 bg-[#050505] px-1 text-[8px] font-mono text-on-surface-variant uppercase tracking-widest">Avg Saving</div>
                        <div className="text-3xl font-heading font-bold text-on-surface tabular-nums">
                            {isLoading ? "..." : avgSaving}%
                        </div>
                    </div>
                    <div className="border border-wireframe p-5 w-44 bg-[#0a0a0a] relative">
                        <div className="absolute -top-2 left-2 bg-[#050505] px-1 text-[8px] font-mono text-on-surface-variant uppercase tracking-widest">Optimized Files</div>
                        <div className="text-3xl font-heading font-bold text-neon-green tabular-nums">
                            {isLoading ? "..." : totalRecords}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-10 mb-8 flex gap-4 items-center">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <Input
                        placeholder="SEARCH_OPTIMIZED_CONTRACTS..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="pl-10 h-10 bg-[#0a0a0a] border-wireframe rounded-none font-mono text-[10px] uppercase tracking-widest focus-visible:ring-neon-green/30"
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 px-4 h-10 border border-wireframe bg-[#0a0a0a] cursor-pointer hover:border-neon-green/30 transition-colors">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">Gas Saved:</span>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface font-bold min-w-[30px]">{statusFilter}</span>
                            <ChevronDownIcon className="w-4 h-4 text-on-surface-variant" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a0a0a] border-wireframe rounded-none min-w-[120px]">
                        {(["All", "< 80", "90+"] as const).map((status) => (
                            <DropdownMenuItem
                                key={status}
                                onClick={() => {
                                    setStatusFilter(status);
                                    setCurrentPage(1);
                                }}
                                className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant hover:text-neon-green hover:bg-neon-green/5 cursor-pointer rounded-none"
                            >
                                {status}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table Container */}
            <div className="px-10 flex-1 overflow-y-auto custom-scrollbar pb-10">
                <div className="border border-wireframe overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-wireframe hover:bg-transparent bg-white/[0.02]">
                                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant h-10 pl-6">
                                    Contract Name
                                </TableHead>
                                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant h-10">
                                    Date
                                </TableHead>
                                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant h-10">
                                    Efficiency
                                </TableHead>
                                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant h-10 text-right pr-6">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={4} className="py-24">
                                        <div className="flex flex-col items-center justify-center gap-6">
                                            <DotmSquare14
                                                size={30}
                                                color="#c8ff00"
                                                speed={1.5}
                                                bloom
                                            />
                                            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neon-green/50 animate-pulse">
                                                Analyzing_Bytecode_Efficiency...
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.map((row: any) => {
                                const config = RISK_CONFIG[row.severityTag as keyof typeof RISK_CONFIG] || RISK_CONFIG.MEDIUM_RISK;
                                return (
                                    <TableRow
                                        key={row.id}
                                        className="border-b border-wireframe hover:bg-white/[0.02] transition-colors group relative"
                                    >
                                        {/* Efficiency Indicator */}
                                        <TableCell className="pl-6 py-5 relative">
                                            <div className={cn(
                                                "absolute left-0 top-0 bottom-0 w-[3px]",
                                                config.barColor
                                            )} />
                                            <div className="flex flex-col gap-0.5">
                                                <span title={row.filename} className="text-sm font-bold text-on-surface tracking-tight">
                                                    {truncateName(row.filename, 22)}
                                                </span>
                                                {row.address ? (
                                                    <a 
                                                        href={`https://mantlescan.xyz/address/${row.address}#code`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={row.address}
                                                        className="text-[10px] text-neon-cyan hover:text-neon-cyan/80 hover:underline font-mono transition-all w-fit cursor-help"
                                                    >
                                                        {row.address.slice(0, 6)}...{row.address.slice(-4)}
                                                    </a>
                                                ) : (
                                                    <Link 
                                                        href={`/dashboard/optimizations/${row.id}`}
                                                        className="text-[10px] text-neon-violet hover:text-neon-violet/80 hover:underline font-mono font-bold uppercase tracking-wider transition-all w-fit"
                                                    >
                                                        DEPLOY
                                                    </Link>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Date */}
                                        <TableCell className="text-[11px] text-on-surface-variant py-5 tabular-nums font-mono">
                                            {new Date(row.createdAt).toLocaleDateString("en-GB", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </TableCell>

                                        {/* Efficiency Meter */}
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn("text-2xl font-bold tabular-nums", config.scoreColor)}>
                                                        {row.gasEfficiency || 0}%
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "rounded-none text-[8px] font-bold uppercase tracking-widest border px-2 py-0.5",
                                                            config.badgeClass
                                                        )}
                                                    >
                                                        {config.label}
                                                    </Badge>
                                                </div>
                                                <div className="w-32 h-1 bg-[#1a1a1a] overflow-hidden">
                                                    <div
                                                        className={cn("h-full transition-all duration-700", config.barColor)}
                                                        style={{ width: `${row.gasEfficiency || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="py-5 pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/optimizations/${row.id}`}>
                                                    <RippleButton
                                                        className="h-7 px-3 text-[9px] uppercase tracking-widest font-bold border border-wireframe text-on-surface-variant hover:text-[#ddb7ff] hover:border-[#ddb7ff]/50 hover:bg-[#ddb7ff]/5 rounded-none transition-colors gap-1.5 flex items-center"
                                                    >
                                                        View Optimization
                                                    </RippleButton>
                                                </Link>
                                                <RippleButton
                                                    onClick={async () => {
                                                        const shareUrl = `${window.location.origin}/report/${row.id}`;
                                                        try {
                                                            await navigator.clipboard.writeText(shareUrl);
                                                            sileo.success({ title: "Report Shared", description: "Public audit report URL copied to clipboard!" });
                                                        } catch (err) {
                                                            console.error(err);
                                                            sileo.error({ title: "Share Failed", description: "Failed to copy report URL." });
                                                        }
                                                    }}
                                                    className="h-7 px-3 text-[9px] uppercase tracking-widest font-bold border border-neon-cyan/45 text-neon-cyan hover:text-black hover:bg-neon-cyan rounded-none transition-colors gap-1.5 flex items-center"
                                                >
                                                    <IconShare size={10} />
                                                    <span>Share</span>
                                                </RippleButton>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {filteredData.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-16 text-on-surface-variant text-[11px] uppercase tracking-widest">
                                        No optimization records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className={cn(
                                            "cursor-pointer border-wireframe rounded-none font-mono uppercase text-[9px] tracking-widest",
                                            currentPage === 1 && "pointer-events-none opacity-50"
                                        )}
                                    />
                                </PaginationItem>
                                {[...Array(totalPages)].map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            isActive={currentPage === i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={cn(
                                                "cursor-pointer border-wireframe rounded-none font-mono text-[9px]",
                                                currentPage === i + 1 ? "bg-neon-green/10 text-neon-green border-neon-green" : "text-on-surface-variant"
                                            )}
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className={cn(
                                            "cursor-pointer border-wireframe rounded-none font-mono uppercase text-[9px] tracking-widest",
                                            currentPage === totalPages && "pointer-events-none opacity-50"
                                        )}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    )
}
