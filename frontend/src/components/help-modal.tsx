"use client"

import { IconHelp, IconX } from "@tabler/icons-react"

const SECTIONS = [
    {
        title: "What is SENTINEL_OS?",
        body: "A smart-contract security workspace built for Mantle. Paste or import Solidity, run AI-powered audits, review gas optimizations, and deploy optimized bytecode to Mantle Mainnet or Sepolia Testnet.",
    },
    {
        title: "Dashboard — Audit Lab",
        items: [
            "Up to 3 contract tabs at once — close a tab before opening another.",
            "Analyze runs an AI scan: security score, vulnerabilities, gas savings, and Mantle L2 compatibility notes.",
            "Import Contract fetches verified source from the explorer — pick Mainnet or Testnet first.",
            "Terminal accepts analyze (or npm run analyze) while a scan is idle.",
            "Security Pulse (right panel) updates when the active tab’s scan completes.",
        ],
    },
    {
        title: "Optimizations & History",
        items: [
            "Optimizations lists all saved audits; open a report for bytecode diffs and deploy controls.",
            "History is your full audit log with explorer links — network (Mainnet / Testnet) is stored per record.",
            "Share copies a public report URL (/report/:id) anyone can view without signing in.",
        ],
    },
    {
        title: "Deploying on Mantle",
        items: [
            "Connect MetaMask, choose Testnet (Sepolia) or Mainnet, compile, then deploy from the optimization report.",
            "Testnet uses chain 5003 — use the Mantle Sepolia faucet for test MNT.",
            "After deploy, the contract address is saved and source verification is submitted automatically.",
            "Already-deployed audits show Live_On_Chain — redeploy is disabled for those records.",
        ],
    },
    {
        title: "Networks & Explorers",
        items: [
            "Mainnet (chain 5000) → explorer.mantle.xyz",
            "Testnet / Sepolia (chain 5003) → explorer.sepolia.mantle.xyz",
            "Imported and deployed contracts remember which network you selected.",
        ],
    },
    {
        title: "Tips",
        items: [
            "Only verified contracts can be imported by address.",
            "Large contracts may skip full AI rewrite — security findings still apply.",
            "Low security scores (< 60) require acknowledging risk before deploy.",
            "Account email, password, and profile: use Settings in the sidebar.",
        ],
    },
] as const

type HelpModalProps = {
    open: boolean
    onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg max-h-[85vh] bg-[#0a0a0a] border-2 border-wireframe relative rounded-none flex flex-col shadow-[0_0_30px_rgba(0,229,255,0.08)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-cyan" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-cyan" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-cyan" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-cyan" />

                <div className="flex items-center justify-between border-b border-wireframe px-6 py-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <IconHelp className="w-5 h-5 text-neon-cyan" stroke={1.5} />
                        <h2
                            id="help-modal-title"
                            className="text-sm font-mono font-bold uppercase tracking-widest text-on-surface"
                        >
                            Operator_Guide
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-neon-cyan transition-colors font-mono text-xs uppercase flex items-center gap-1"
                    >
                        [Esc] Close
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar px-6 py-5 flex flex-col gap-5">
                    {SECTIONS.map((section) => (
                        <div key={section.title} className="border border-wireframe/50 bg-[#050505] p-4">
                            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-neon-cyan mb-2">
                                {section.title}
                            </h3>
                            {"body" in section && (
                                <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wide leading-relaxed">
                                    {section.body}
                                </p>
                            )}
                            {"items" in section && (
                                <ul className="flex flex-col gap-1.5 mt-1">
                                    {section.items.map((item) => (
                                        <li
                                            key={item}
                                            className="text-[10px] font-mono text-on-surface-variant leading-relaxed flex gap-2"
                                        >
                                            <span className="text-neon-green shrink-0">›</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t border-wireframe px-6 py-3 shrink-0">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-variant/60 text-center">
                        SENTINEL_OS · Mantle-native contract intelligence
                    </p>
                </div>
            </div>
        </div>
    )
}
