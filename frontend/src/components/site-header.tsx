"use client"

import { usePathname } from "next/navigation"
import { useRef } from "react";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";
import { SparklesIcon, type SparklesIconHandle } from "@/components/icons/sparkles";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAudit } from "@/context/audit-context";

export function SiteHeader() {
    const pathname = usePathname()
    const sparklesRef = useRef<SparklesIconHandle>(null);
    const { analyze, scanStatus } = useAudit();

    const titleMap: Record<string, string> = {
        "/dashboard": "Command Center",
        "/dashboard/audits": "Audit Lab",
        "/dashboard/optimizations": "Optimizations",
        "/dashboard/history": "History",
    }
    const currentTitle = titleMap[pathname] || "Command Center"

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-wireframe bg-[#050505] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) ">
            <div className="flex w-full items-center  gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1 text-on-surface hover:text-neon-green" />
                <Separator

                    orientation="vertical"
                    className=" data-[orientation=vertical]:h-4 bg-wireframe  relative top-2"
                />
                <h1 className="text-sm font-heading font-bold uppercase tracking-widest text-on-surface">{currentTitle}</h1>

                <div className="ml-auto flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">
                        <span className="text-neon-green/60">Powered by</span>
                        <span className="text-on-surface font-bold">Claude AI</span>
                        <span className="text-on-surface-variant mx-1 opacity-30">•</span>
                        <span className="text-neon-cyan/60">Network</span>
                        <span className="text-on-surface font-bold">Mantle Testnet</span>
                    </div>

                    <Separator
                        orientation="vertical"
                        className="hidden md:block data-[orientation=vertical]:h-4 bg-wireframe relative top-2"
                    />

                    <LiquidButton
                        variant="default"
                        size="sm"
                        disabled={scanStatus === "SCANNING"}
                        onClick={analyze}
                        onMouseEnter={() => sparklesRef.current?.startAnimation()}
                        onMouseLeave={() => sparklesRef.current?.stopAnimation()}
                        className="font-mono uppercase text-[12px] tracking-widest rounded-none font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon
                            ref={sparklesRef}
                            size={14}
                            className="text-neon-green"
                        />
                        {scanStatus === "SCANNING" ? "Analyzing..." : "Analyze"}
                    </LiquidButton>
                </div>
            </div>
        </header>
    )
}
