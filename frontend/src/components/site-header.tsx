"use client"

import { usePathname } from "next/navigation"
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useWallet } from "@/context/wallet-context";
import { IconWallet, IconChevronDown, IconCheck, IconPlugConnected } from "@tabler/icons-react";
import { sileo } from "sileo";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/animate-ui/components/radix/popover";
import { LiquidButton } from "@/components/animate-ui/components/buttons/liquid";

export function SiteHeader() {
    const pathname = usePathname()
    const { walletAddress, isMetaMaskAvailable, connectMetaMask, disconnect } = useWallet()
    const [isOpen, setIsOpen] = useState(false)

    const handleConnect = async (walletType: string) => {
        if (walletType === "MetaMask") {
            await connectMetaMask()
        } else {
            sileo.warning({ title: "Not Supported", description: `${walletType} is coming soon!` })
        }
        setIsOpen(false)
    }

    const titleMap: Record<string, string> = {
        "/dashboard": "Command Center",
        "/dashboard/audits": "Audit Lab",
        "/dashboard/optimizations": "Optimizations",
        "/dashboard/history": "History",
    }
    const currentTitle = titleMap[pathname] || "Command Center"

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-wireframe bg-[#050505] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) ">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1 text-on-surface hover:text-neon-green" />
                <Separator
                    orientation="vertical"
                    className=" data-[orientation=vertical]:h-4 bg-wireframe relative top-2"
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

                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                            <LiquidButton
                                className="h-8 px-4 border border-neon-cyan/50 hover:border-neon-cyan bg-neon-cyan/5 transition-all flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neon-cyan rounded-none [--liquid-button-background-color:rgba(0,218,243,0.05)] [--liquid-button-color:#00daf3] hover:text-black"
                            >
                                <IconWallet className="w-3.5 h-3.5" />
                                {walletAddress ? (
                                    <span className="font-bold">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                                ) : (
                                    <span>Connect Wallet</span>
                                )}
                                <IconChevronDown className="w-3 h-3 opacity-70 ml-1" />
                            </LiquidButton>
                        </PopoverTrigger>

                        <PopoverContent
                            side="bottom"
                            align="end"
                            sideOffset={8}
                            className="w-64 border border-wireframe bg-[#050505] shadow-[0_0_40px_rgba(0,229,255,0.05)] z-50 flex flex-col p-2 rounded-none relative"
                        >
                            {/* Corner Tech Accents */}
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-cyan" />
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-cyan" />
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-cyan" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan" />

                            <div className="px-3 border-b border-wireframe/40 mb-2">
                                <span className="text-[9px] font-mono pb-2 uppercase tracking-[0.2em] text-on-surface-variant">Select Provider</span>
                            </div>

                            {[
                                { name: "MetaMask", icon: "/MetaMask-icon-fox.svg", available: isMetaMaskAvailable },
                                { name: "WalletConnect", icon: "/WalletConnect Icon.png", available: true },
                                { name: "Binance Wallet", icon: "/_Icon.png", available: true },
                            ].map((wallet) => (
                                <button
                                    key={wallet.name}
                                    onClick={() => (walletAddress && wallet.name === "MetaMask") ? null : handleConnect(wallet.name)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-white/[0.03] transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={wallet.icon}
                                            alt={wallet.name}
                                            className="w-5 h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                        <span className="font-mono text-[11px] text-on-surface">{wallet.name}</span>
                                    </div>
                                    {walletAddress && wallet.name === "MetaMask" ? (
                                        <div className="flex items-center gap-1 text-[9px] font-mono text-neon-green uppercase tracking-widest bg-neon-green/10 px-1.5 py-0.5 border border-neon-green/20">
                                            <IconCheck className="w-3.5 h-3.5" /> Connected
                                        </div>
                                    ) : (
                                        !wallet.available && (
                                            <span className="text-[8px] font-mono text-on-surface-variant uppercase tracking-widest border border-wireframe px-1">Install</span>
                                        )
                                    )}
                                </button>
                            ))}

                            {walletAddress && (
                                <div className="mt-2 pt-2 border-t border-wireframe/40">
                                    <button
                                        onClick={() => { disconnect(); setIsOpen(false); }}
                                        className="w-full text-left px-3 py-2.5 hover:bg-red-500/10 transition-colors flex items-center gap-3 group cursor-pointer"
                                    >
                                        <IconPlugConnected className="w-4 h-4 text-red-500/70 group-hover:text-red-500 transition-colors shrink-0" />
                                        <span className="font-mono text-[10px] text-red-500/70 group-hover:text-red-500 uppercase tracking-widest transition-colors">Disconnect</span>
                                    </button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </header>
    )
}
