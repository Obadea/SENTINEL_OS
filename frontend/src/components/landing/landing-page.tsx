"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  IconArrowRight,
  IconBrandGithub,
  IconBrandX,
  IconGauge,
  IconShieldCheck,
  IconWand,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react"
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs"
import { HexagonBackground } from "@/components/animate-ui/components/backgrounds/hexagon"
import { motion, fadeUp, stagger } from "./motion"
import { LandingHeader } from "./landing-header"
import {
  LandingFrame,
  LandingVerticalGuides,
  FullBleedRail,
  GridCross,
} from "./landing-grid"
import { LandingPartners } from "./landing-partners"
import { LandingPricing } from "./landing-pricing"
import { LandingPlusTerminal } from "./landing-plus-terminal"
import { cn } from "@/lib/utils"
import {
  ReactFlow,
  ReactFlowProvider,
  BaseEdge,
  EdgeProps,
  getBezierPath,
  Handle,
  Position,
  NodeProps,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

const HEXAGON_CLASS = cn(
  "cursor-default",
  "before:!bg-background before:!opacity-100 before:!transition-all before:!duration-500",
  "after:!bg-surface-container-lowest after:!opacity-100 after:!transition-all after:!duration-500",
  "hover:before:!bg-[#b8f600]/22 hover:before:!opacity-100 hover:before:!duration-0",
  "hover:after:!bg-[#b8f600]/10 hover:after:!opacity-100 hover:after:!duration-0"
)

function GasEstimateVisual() {
  const [gasPrice, setGasPrice] = useState(0.045)

  useEffect(() => {
    const interval = setInterval(() => {
      setGasPrice(prev => {
        const delta = (Math.random() - 0.5) * 0.005
        return parseFloat(Math.max(0.035, Math.min(0.055, prev + delta)).toFixed(4))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 font-mono text-[11px] select-none text-white/90">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-primary-container opacity-75"></span>
            <span className="relative inline-flex rounded-none h-2 w-2 bg-primary-container"></span>
          </span>
          <span className="text-[10px] tracking-widest uppercase text-zinc-400">L2 GAS TRACKER</span>
        </div>
        <span className="text-[9px] text-primary-container bg-primary-container/10 border border-primary-container/20 px-1.5 py-0.5 rounded-none font-bold uppercase tracking-wider">Mantle Active</span>
      </div>

      <div className="flex flex-col gap-2.5 my-auto">
        <div className="space-y-1">
          <div className="flex justify-between text-zinc-400 text-[10px]">
            <span>Ethereum L1 Fee</span>
            <span className="text-zinc-300 font-bold">$12.45</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden">
            <div className="h-full bg-white/20 rounded-none w-[90%]" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-primary-container text-[10px]">
            <span className="font-bold text-primary-container">Mantle L2 Fee</span>
            <span className="text-primary-container font-bold">${gasPrice.toFixed(3)}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden">
            <motion.div
              className="h-full bg-primary-container rounded-none"
              initial={{ width: 0 }}
              animate={{ width: "4%" }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[9px] text-zinc-400">
        <span>Optimized Savings</span>
        <span className="text-primary-container font-bold uppercase tracking-wider">~99.6% CHEAPER</span>
      </div>
    </div>
  )
}

function VulnerabilityAuditVisual() {
  const [isFixed, setIsFixed] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsFixed(prev => !prev)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 font-mono text-[10px] text-white/95 select-none relative">
      <div className="flex items-center justify-between border-b border-white/5 pb-1">
        <span className="text-[9px] text-zinc-400 uppercase tracking-widest">NEURAL AUDIT ENGINE</span>
        <div className="flex gap-1 items-center">
          <span className="text-[9px] font-bold text-neon-violet bg-neon-violet/10 border border-neon-violet/20 px-1 py-0.5 rounded-none">Scan Active</span>
        </div>
      </div>

      <div className="flex-1 my-0.5 flex flex-col justify-center leading-[1.5] text-[9.5px] text-zinc-400 font-mono">
        <div>
          <span className="text-violet-400">function</span> <span className="text-blue-400">withdraw</span>() <span className="text-violet-400">public</span> &#123;
        </div>
        <div className="pl-3 text-zinc-500">
          uint amount = balances[msg.sender];
        </div>

        {isFixed ? (
          <>
            <div className="pl-3 bg-emerald-950/20 border-l-2 border-emerald-500 text-emerald-300 transition-all duration-300 font-bold">
              balances[msg.sender] = 0; <span className="text-emerald-500/60 font-normal text-[8px]">// Safe state reset</span>
            </div>
            <div className="pl-3 text-zinc-500">
              (bool sent, ) = msg.sender.call&#123;value: amount&#125;("");
            </div>
          </>
        ) : (
          <>
            <div className="pl-3 bg-red-950/25 border-l-2 border-red-500 text-red-300 transition-all duration-300 relative group/line">
              (bool sent, ) = msg.sender.call...
              <span className="absolute right-0 top-5 text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-none border border-red-500/30 font-bold uppercase tracking-wider">Reentrancy Risk</span>
            </div>
            <div className="pl-3 text-red-300/40 line-through decoration-red-500/50">
              balances[msg.sender] = 0;
            </div>
          </>
        )}
        <div className="pl-3 text-zinc-500">
          require(sent);
        </div>
        <div>&#125;</div>
      </div>

      <div
        className={cn(
          "flex items-center justify-between border px-2 py-1 rounded-none transition-all duration-300",
          isFixed
            ? "bg-emerald-950/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-950/10 border-red-500/20 text-red-400"
        )}
      >
        <span className="flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-wider">
          {isFixed ? (
            <>
              <IconShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Audit Passed</span>
            </>
          ) : (
            <>
              <IconAlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />
              <span>Vulnerability Flagged</span>
            </>
          )}
        </span>
        <button
          onClick={() => setIsFixed(prev => !prev)}
          className={cn(
            "text-[8px] px-2 py-0.5 border rounded-none uppercase font-bold tracking-widest flex items-center gap-1 transition-all active:scale-95",
            isFixed
              ? "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
              : "border-red-500/20 text-red-400 hover:bg-red-500/10"
          )}
        >
          <IconRefresh className="w-2.5 h-2.5" />
          {isFixed ? "RESET" : "AUTO-FIX"}
        </button>
      </div>
    </div>
  )
}

function OptimizationTipsVisual() {
  const [tips, setTips] = useState([
    { id: 1, title: "Use calldata for read-only arrays", gas: "-4,800 gas", active: true },
    { id: 2, title: "Avoid double state storage reads", gas: "-12,600 gas", active: false },
    { id: 3, title: "Optimized storage packing (uint128)", gas: "-18,000 gas", active: false },
  ])

  const toggleTip = (id: number) => {
    setTips(prev => prev.map(tip => tip.id === id ? { ...tip, active: !tip.active } : tip))
  }

  const baseGas = 100000
  const savings = tips.reduce((acc, t) => acc + (t.active ? parseInt(t.gas.replace(/[^0-9]/g, '')) : 0), 0)
  const currentGas = baseGas - savings

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 font-mono text-[10px] text-white/95 select-none">
      <div className="flex items-center justify-between border-b border-white/5 pb-1">
        <span className="text-[9px] text-zinc-400 uppercase tracking-widest">MNT OPTIMIZATION V4</span>
        <span className="text-[9.5px] text-neon-cyan font-bold bg-neon-cyan/10 border border-neon-cyan/20 px-1.5 py-0.5 rounded-none">
          {currentGas.toLocaleString()} GAS
        </span>
      </div>

      <div className="flex-1 my-2 flex flex-col justify-center gap-1.5">
        {tips.map(tip => (
          <div
            key={tip.id}
            onClick={() => toggleTip(tip.id)}
            className={cn(
              "flex items-center justify-between p-1 border rounded-none cursor-pointer transition-all duration-300",
              tip.active
                ? "bg-neon-cyan/5 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-2 max-w-[75%]">
              <span className={cn(
                "w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[7.5px] font-black shrink-0 transition-all",
                tip.active ? "bg-neon-cyan border-neon-cyan text-black" : "border-zinc-700 text-transparent"
              )}>
                ✓
              </span>
              <span className="truncate text-[8.5px]">{tip.title}</span>
            </div>
            <span className={cn(
              "text-[8.5px] font-bold",
              tip.active ? "text-neon-cyan" : "text-zinc-600"
            )}>
              {tip.gas}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
        <div className="flex justify-between text-[8px] text-zinc-500 uppercase tracking-wider font-bold">
          <span>GAS REDUCTION</span>
          <span className="text-neon-cyan">{Math.round((savings / baseGas) * 100)}% SAVED</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded overflow-hidden">
          <div
            className="h-full bg-neon-cyan transition-all duration-500"
            style={{ width: `${Math.max(5, Math.min(100, (savings / baseGas) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ExplorerAwareVisual() {
  const [isMainnet, setIsMainnet] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsMainnet(prev => !prev)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 font-mono text-[9px] text-zinc-400 select-none rounded-none">
      <div className="flex items-center justify-between border-b border-white/5 pb-1">
        <span className="text-[8px] uppercase tracking-wider text-zinc-500">Auto Network Linker</span>
        <span className="flex items-center gap-1">
          <span className={cn("w-1.5 h-1.5 rounded-none", isMainnet ? "bg-emerald-500" : "bg-cyan-500")} />
          <span className={cn("font-bold text-[8px]", isMainnet ? "text-emerald-400" : "text-cyan-400")}>
            {isMainnet ? "MAINNET" : "TESTNET"}
          </span>
        </span>
      </div>

      <div className="my-1.5 flex flex-col gap-1">
        <div className="text-[8px] text-zinc-500 uppercase">Target Contract Explorer URL:</div>
        <div className="p-1 bg-white/5 border border-white/5 text-zinc-300 truncate text-[8.5px] rounded-none">
          {isMainnet
            ? "explorer.mantle.xyz/tx/0x7d89...f3c2"
            : "explorer.testnet.mantle.xyz/tx/0x1e45...a8b9"
          }
        </div>
      </div>

      <div className="flex justify-between text-[7.5px] text-zinc-500 border-t border-white/5 pt-1">
        <span>STATUS</span>
        <span className="text-primary-container font-bold">SYNCED TO WORKSPACE</span>
      </div>
    </div>
  )
}

function WalletDeployVisual() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStep(prev => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const steps = [
    { label: "1. CONNECTING WALLET...", color: "text-zinc-500" },
    { label: "2. SIGNING DEPLOY TX...", color: "text-zinc-400" },
    { label: "3. BROADCASTING TO L2...", color: "text-primary-container animate-pulse" },
    { label: "4. SUCCESS: DEPLOYED!", color: "text-emerald-400 font-bold" }
  ]

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 font-mono text-[9px] text-zinc-400 select-none rounded-none">
      <div className="flex items-center justify-between border-b border-white/5 pb-1">
        <span className="text-[8px] uppercase tracking-wider text-zinc-500">Web3 Deploy Pipeline</span>
        <span className="text-[8px] text-primary-container font-bold">1-CLICK SHIPPING</span>
      </div>

      <div className="my-auto flex flex-col gap-0.5">
        <div className="flex justify-between text-[8px] text-zinc-600">
          <span>WALLET</span>
          <span>0x70...6Fd8</span>
        </div>
        <div className="p-1.5 bg-black/40 border border-white/5 font-semibold text-[8.5px] rounded-none">
          <span className={steps[step].color}>{steps[step].label}</span>
        </div>
      </div>

      <div className="flex justify-between text-[7.5px] text-zinc-500 border-t border-white/5 pt-1">
        <span>COMPILER</span>
        <span className="text-zinc-400">solc v0.8.24</span>
      </div>
    </div>
  )
}

function VerificationFlowVisual() {
  return (
    <div className="w-full h-full flex flex-col justify-between p-3 font-mono text-[9px] text-zinc-400 select-none rounded-none">
      <div className="flex items-center justify-between border-b border-white/5 pb-1">
        <span className="text-[8px] uppercase tracking-wider text-zinc-500">Contract Verification</span>
        <span className="text-[8px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-500/20 px-1 py-0.5 rounded-none">VERIFIED</span>
      </div>

      <div className="my-auto grid grid-cols-2 gap-x-3 gap-y-1">
        <div className="flex justify-between">
          <span className="text-zinc-500">BYTECODE:</span>
          <span className="text-emerald-400 font-bold">MATCH</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">COMPILER:</span>
          <span className="text-zinc-300">0.8.24</span>
        </div>
        <div className="flex justify-between col-span-2 text-[8px] text-zinc-500">
          <span>ABI STACK GENERATED:</span>
          <span className="text-emerald-400">SUCCESS</span>
        </div>
      </div>

      <div className="flex justify-between text-[7.5px] border-t border-white/5 pt-1 text-zinc-500">
        <span>SECURITY SCAN</span>
        <span className="text-primary-container">PASS (0 VULNERABILITIES)</span>
      </div>
    </div>
  )
}

// ─── Custom ReactFlow Edge: Animated (travelling dot) ──────────────────────
function AnimatedEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ ...style, strokeWidth: 1.5 }} />
      <circle r="4" fill={style?.stroke as string ?? "#b8f600"}>
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  )
}

// ─── Custom ReactFlow Edge: Temporary (dashed, pending connection) ──────────
function TemporaryEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, style,
}: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        ...style,
        strokeDasharray: "6 4",
        strokeWidth: 1.2,
        opacity: 0.55,
        animation: "dash 1.5s linear infinite",
      }}
    />
  )
}

// ─── Custom Node ────────────────────────────────────────────────────────────
type AgentNodeData = {
  label: string
  sub?: string
  status?: string
  statusColor?: string
  accentColor?: string
}

function AgentNode({ data }: NodeProps) {
  const d = data as AgentNodeData
  const accent = d.accentColor ?? "#ffffff"
  return (
    <div
      className="bg-black/95 font-mono text-[8px] select-none relative"
      style={{
        border: `1px solid ${accent}40`,
        boxShadow: `0 0 12px ${accent}18`,
        minWidth: 120,
        borderRadius: 0,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: accent, border: "none", width: 6, height: 6, borderRadius: 0, left: -3 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: accent, border: "none", width: 6, height: 6, borderRadius: 0, right: -3 }}
      />
      <div
        className="flex items-center justify-between px-2 py-1 border-b"
        style={{ borderColor: `${accent}22` }}
      >
        <span className="flex items-center gap-1" style={{ color: accent }}>
          <span
            className="w-1.5 h-1.5 animate-pulse"
            style={{ background: accent, borderRadius: 0, display: "inline-block" }}
          />
          <span className="font-bold tracking-wide text-[8px]">{d.label}</span>
        </span>
        {d.status && (
          <span
            className="text-[7px] px-1 font-black uppercase tracking-wider"
            style={{ color: d.statusColor ?? accent, background: `${accent}12`, borderRadius: 0 }}
          >
            {d.status}
          </span>
        )}
      </div>
      {d.sub && (
        <div className="px-2 py-1 text-zinc-500 text-[7.5px] leading-tight">
          {d.sub}
        </div>
      )}
    </div>
  )
}

// ─── Edge type registry ─────────────────────────────────────────────────────
const EDGE_TYPES = {
  animated: AnimatedEdge,
  temporary: TemporaryEdge,
}
const NODE_TYPES = { agent: AgentNode }

// ─── Initial graph data ─────────────────────────────────────────────────────
const INIT_NODES = [
  {
    id: "source",
    type: "agent",
    position: { x: 10, y: 80 },
    data: { label: "Source Code", sub: "TokenVault.sol // 342 lines", accentColor: "#71717a", status: "READY", statusColor: "#a1a1aa" },
  },
  {
    id: "auditor",
    type: "agent",
    position: { x: 190, y: 10 },
    data: { label: "Auditor Agent", sub: "Scanning reentrancy...", accentColor: "#8b5cf6", status: "ACTIVE", statusColor: "#a78bfa" },
  },
  {
    id: "optimizer",
    type: "agent",
    position: { x: 190, y: 155 },
    data: { label: "Gas Optimizer", sub: "-34,200 gas saved", accentColor: "#b8f600", status: "DONE", statusColor: "#b8f600" },
  },
  {
    id: "deployer",
    type: "agent",
    position: { x: 375, y: 80 },
    data: { label: "Mantle L2 Deploy", sub: "0x8a92...df5e", accentColor: "#06b6d4", status: "LIVE", statusColor: "#22d3ee" },
  },
]

const INIT_EDGES = [
  {
    id: "e-src-audit",
    source: "source",
    target: "auditor",
    type: "animated",
    style: { stroke: "#8b5cf6" },
  },
  {
    id: "e-src-opt",
    source: "source",
    target: "optimizer",
    type: "animated",
    style: { stroke: "#b8f600" },
  },
  {
    id: "e-audit-deploy",
    source: "auditor",
    target: "deployer",
    type: "animated",
    style: { stroke: "#06b6d4" },
  },
  {
    id: "e-opt-deploy",
    source: "optimizer",
    target: "deployer",
    type: "temporary",
    style: { stroke: "#b8f600" },
  },
]

// ─── Tick labels that cycle at bottom ──────────────────────────────────────
const TICKS = [
  "SCANNING REENTRANCY VECTORS...",
  "GAS OPTIMIZED: -34,200 UNITS",
  "BYTECODE COMPILED: solc 0.8.24",
  "DEPLOYING TO MANTLE L2...",
  "CONTRACT VERIFIED: 0x8a92...df5e",
]

function AgentFlowVisual() {
  const [nodes, , onNodesChange] = useNodesState(INIT_NODES as any)
  const [edges, , onEdgesChange] = useEdgesState(INIT_EDGES as any)
  const [tickIdx, setTickIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTickIdx(i => (i + 1) % TICKS.length), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative w-full h-full min-h-[380px] lg:min-h-[420px] overflow-hidden rounded-none bg-[#080a0c]">
      {/* inject dash animation */}
      <style>{`@keyframes dash { to { stroke-dashoffset: -20; } }`}</style>

      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          edgeTypes={EDGE_TYPES}
          nodeTypes={NODE_TYPES}

          fitView={true}
          fitViewOptions={{ padding: 0.10 }}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          nodesDraggable={false}
          nodesConnectable={false}
          zoomOnDoubleClick={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          style={{ background: "transparent" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={14}
            size={1}
            color="rgba(255,255,255,0.06)"
          />
        </ReactFlow>
      </ReactFlowProvider>

      {/* Header label */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-black/60 border-b border-white/5 font-mono text-[9px] z-20 pointer-events-none">
        <span className="text-zinc-500 uppercase tracking-widest">Agent Flow Canvas</span>

      </div>

      {/* Ticker at bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/70 border-t border-white/5 font-mono text-[8px] text-zinc-500 uppercase tracking-widest z-20 pointer-events-none overflow-hidden">
        <motion.span
          key={tickIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          className="block"
        >
          <span className="text-primary-container mr-2">›</span>
          {TICKS[tickIdx]}
        </motion.span>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    title: "Real-time Gas Estimates",
    description:
      "Precise gas expenditure forecasting calibrated for Mantle L2 architecture and sequencing fees.",
    tag: "L2_GAS_OPTIMIZER_ENABLED",
    icon: IconGauge,
    accent: "green" as const,
    image: "/card-img-1.png",
  },
  {
    title: "LLM Vulnerability Flags",
    description:
      "Context-aware AI detection for logic flaws, rug-pull vectors, and edge cases static analyzers miss.",
    tag: "NEURAL_AUDIT_ACTIVE",
    icon: IconShieldCheck,
    accent: "violet" as const,
    image: "/card-img-2.png",
  },
  {
    title: "Mantle Optimization Tips",
    description:
      "Automated refactor suggestions for maximum performance on Mantle DA and execution layers.",
    tag: "MNT_OPTIMIZATION_V4",
    icon: IconWand,
    accent: "cyan" as const,
    image: "/card-img-3.png",
  },
]

const ACCENT = {
  green: {
    bar: "bg-primary-container group-hover:opacity-100",
    glow: "from-primary-container/25 to-transparent",
    icon: "bg-primary-container/10 border-primary-container/25 text-primary-container",
    tag: "text-primary-container",
  },
  violet: {
    bar: "bg-neon-violet group-hover:opacity-100",
    glow: "from-neon-violet/25 to-transparent",
    icon: "bg-neon-violet/10 border-neon-violet/20 text-neon-violet",
    tag: "text-neon-violet",
  },
  cyan: {
    bar: "bg-neon-cyan group-hover:opacity-100",
    glow: "from-neon-cyan/25 to-transparent",
    icon: "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan",
    tag: "text-neon-cyan",
  },
}

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAZiAsjzyFJzOVS4B1_htvlF3X_qNctAdMVYvROXQcoqEceqEcoUDSrin9C1YWZSsBYXzOjZx0noYsA-29ILZsZs_Zr1CHfnhONL5zpQkk1RtAtkhrozA8z-V0wfW4D3tJkc7XSKkXvnUzLMAKwSwVbQ9y5_SSKwoT0iR1SHh5eiqp_XPAF0lZRo0g8su90IMX4ze_cJmLvGRD9lcxJLmiseOlpuv2xNQ9fv7wsvWxnx0vpJbgDObOzeVwcVRaSiMhyJlbHkXVA2Tv5"

function StartAnalysisCta({ className }: { className?: string }) {
  const btnClass = cn(
    "bg-primary-container text-on-primary-container px-10 py-3 font-mono text-[10px] font-black uppercase tracking-widest",
    "hover:shadow-[0_0_20px_rgba(184,246,0,0.45)] active:scale-[0.98] transition-all w-full md:w-auto border border-primary-container/60",
    className
  )
  return (
    <>
      <Show when="signed-out">
        <SignUpButton mode="modal">
          <button type="button" className={btnClass}>
            Start Analysis
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={cn(btnClass, "inline-block text-center")}>
          Start Analysis
        </Link>
      </Show>
    </>
  )
}

export function LandingPage() {
  return (
    <div
      id="landing-scroll"
      className="fixed inset-0 z-0 overflow-y-scroll overflow-x-hidden custom-scrollbar [scrollbar-gutter:stable] bg-background text-on-surface"
    >
      {/* Full-page hex grid — interactive, visible through header */}

      <LandingVerticalGuides />

      <div className="relative z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <LandingHeader />
        </div>

        <main className="relative  pointer-events-none ">
          {/* Hero */}
          <section className="relative min-h-[100vh] pointer-events-auto pt-[88px] px-5 lg:px-none">
            <div className="absolute inset-0 z-0 pointer-events-auto">
              <HexagonBackground
                className="size-full h-screen !bg-background dark:!bg-background"
                hexagonSize={64}
                hexagonMargin={2}
                hexagonProps={{ className: HEXAGON_CLASS }}
              />
            </div>
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/90" />
              <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/8 blur-[120px]"
                animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 blur-[120px]"
                animate={{ scale: [1.08, 1, 1.08], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* <LandingFrame showTopRail={true} className="relative z-10"> */}
            <div className="w-fit mx-auto flex flex-col items-center py-4 md:py-7 lg:py-10 relative z-5">
              <motion.div
                className="w-full max-w-2xl text-center"
                variants={stagger}
                initial="hidden"
                animate="visible"
              >

                <motion.h1
                  variants={fadeUp}
                  className="font-heading text-4xl md:text-5xl lg:text-[52px] leading-[1.1] text-white font-bold tracking-tight mb-6"
                >
                  Audit smart contracts with{" "}
                  <span className="text-primary-container">AI Precision</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="font-mono text-base md:text-sm text-on-surface-variant leading-relaxed mb-10  max-w-xl mx-auto"
                >
                  The only Mantle-native IDE that takes a developer from raw Solidity to a deployed, verified, optimized contract in one workflow — without leaving the browser.
                </motion.p>

                <motion.div
                  variants={fadeUp}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <StartAnalysisCta className="sm:min-w-[200px]" />
                  <a
                    href="#features"
                    className="border border-secondary text-secondary px-10 py-3 font-mono text-[10px] font-black uppercase tracking-widest hover:bg-secondary/10 active:scale-[0.98] transition-all w-full sm:w-auto text-center"
                  >
                    Read Documentation
                  </a>
                </motion.div>
              </motion.div>

              <div className="mt-14 md:mt-16 w-full flex justify-center">
                <LandingPlusTerminal />
              </div>
            </div>
            {/* </LandingFrame> */}
          </section>

          <LandingPartners />

          {/* Features */}
          <section
            id="features"
            className="bg-surface-container-lowest/90 pointer-events-auto"
          >
            <LandingFrame>
              <motion.div
                className="py-16 md:py-20 text-center max-w-2xl mx-auto"
                initial="hidden"

                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={stagger}
              >
                <motion.p
                  variants={fadeUp}
                  className="font-mono text-[10px] text-primary-container uppercase tracking-[0.25em] mb-3"
                >
                  The chain designed for builders
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  className="font-heading text-3xl md:text-4xl text-white mb-4 font-semibold"
                >
                  Industrial-Grade Security
                </motion.h2>
                <motion.p variants={fadeUp} className="text-on-surface-variant leading-relaxed font-mono">
                  Engineered for Mantle — deep visibility into contract behavior,
                  gas economics, and deployment safety.
                </motion.p>
              </motion.div>

              <FullBleedRail centerCross />

              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 border-t border-outline-variant/40"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={stagger}
              >
                {FEATURES.map((feat, index) => {
                  const a = ACCENT[feat.accent]
                  const Icon = feat.icon
                  return (
                    <motion.article
                      key={feat.title}
                      variants={fadeUp}
                      className={cn(
                        "relative flex flex-col gap-5 p-8 md:p-10 group border-outline-variant/40",
                        index > 0 && "md:border-l border-t md:border-t-0"
                      )}
                    >
                      {index > 0 && (
                        <GridCross className="hidden md:block absolute -left-2 top-0 -translate-y-1/2 z-10" />
                      )}
                      <div
                        className={cn(
                          "w-14 h-14 flex items-center justify-center border mb-2",
                          a.icon
                        )}
                      >
                        <Icon className="w-7 h-7" stroke={1.5} />
                      </div>
                      <div
                        className={cn(
                          "h-[180px] border border-outline-variant/30 bg-gradient-to-b mb-4 relative overflow-hidden rounded-none bg-surface-container-low/40 backdrop-blur-sm",
                          a.glow
                        )}
                      >
                        {index === 0 && <GasEstimateVisual />}
                        {index === 1 && <VulnerabilityAuditVisual />}
                        {index === 2 && <OptimizationTipsVisual />}
                        <div
                          className={cn(
                            "absolute bottom-0 left-0 right-0 h-0.5 opacity-50 group-hover:opacity-100 transition-opacity",
                            a.bar
                          )}
                        />
                      </div>
                      <div>
                        <h3 className="font-heading text-lg text-white mb-2 font-semibold">
                          {feat.title}
                        </h3>
                        <p className="text-on-surface-variant text-sm leading-relaxed">
                          {feat.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "mt-auto font-mono text-[10px] uppercase tracking-wider",
                          a.tag
                        )}
                      >
                        {feat.tag}
                      </div>
                    </motion.article>
                  )
                })}
              </motion.div>

              <FullBleedRail />
            </LandingFrame>
          </section>

          {/* Workflow bento */}
          <section className="bg-background/90 pointer-events-auto">
            <LandingFrame>
              <FullBleedRail centerCross />
              <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-outline-variant/40">
                <motion.div
                  className="lg:col-span-4 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-outline-variant/40 relative"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <GridCross className="hidden lg:block absolute -right-2 top-8 z-10" />
                  <p className="font-mono text-[10px] text-neon-cyan uppercase tracking-widest mb-2">
                    Audit pipeline
                  </p>
                  <h3 className="font-heading text-xl text-white font-semibold mb-2">
                    Import &amp; analyze
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Pull contracts from Mantle explorers or paste source — LLM flags
                    and static checks run in one pass.
                  </p>
                </motion.div>
                <motion.div
                  className="lg:col-span-4 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-outline-variant/40"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 }}
                >
                  <p className="font-mono text-[10px] text-neon-violet uppercase tracking-widest mb-2">
                    Optimize
                  </p>
                  <h3 className="font-heading text-xl text-white font-semibold mb-2">
                    Gas &amp; bytecode tips
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Mantle-specific refactor hints before you sign a deployment
                    transaction.
                  </p>
                </motion.div>
                <motion.div
                  className="lg:col-span-4 p-8 md:p-10 flex flex-col justify-center"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.16 }}
                >
                  <h3 className="font-heading text-2xl text-white font-bold mb-3">
                    Self-operating security layer
                  </h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                    From scan to verified deploy — one workspace aligned with how
                    professional teams ship on L2.
                  </p>
                  <a
                    href="#cta"
                    className="inline-flex items-center gap-2 font-mono text-[10px] text-primary-container uppercase tracking-widest hover:gap-3 transition-all w-fit"
                  >
                    See workflow <IconArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
                <motion.div
                  className="lg:col-span-8 p-8 md:p-10 border-t border-outline-variant/40 lg:border-r relative"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <GridCross className="hidden lg:block absolute -right-2 top-0 -translate-y-1/2 z-10" />
                  <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-wider">
                    {["SCAN", "REPORT", "FIX", "DEPLOY", "VERIFY"].map((step, i) => (
                      <div key={step} className="flex items-center gap-4">
                        <span className="px-3 py-2 border border-primary-container/40 text-primary-container bg-primary-container/5">
                          {step}
                        </span>
                        {i < 4 && (
                          <span className="text-on-surface-variant/40">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
                <motion.div
                  className="lg:col-span-4 p-8 md:p-10 border-t lg:border-t border-outline-variant/40 min-h-[200px] flex flex-col justify-end bg-gradient-to-b from-neon-violet/10 to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                >
                  <span className="font-heading text-4xl font-black text-primary-container">
                    99.8%
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                    Detection accuracy (benchmark)
                  </span>
                </motion.div>
              </div>
              <FullBleedRail />
            </LandingFrame>
          </section>

          {/* Testimonial */}
          <section className="bg-surface-variant/20 pointer-events-auto border-y border-outline-variant/25">
            <LandingFrame showTopRail={false}>
              <motion.blockquote
                className="py-20 md:py-28 text-center max-w-3xl mx-auto px-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <p className="font-heading text-2xl md:text-3xl text-white/90 leading-snug italic font-mono">
                  &ldquo;We caught a reentrancy path in minutes that our previous
                  toolchain missed entirely — SENTINEL_OS is now part of our Mantle
                  release checklist.&rdquo;
                </p>
                <footer className="mt-10 flex flex-col items-center gap-3">
                  <div className="size-10 border border-primary-container/50 bg-primary-container/10 flex items-center justify-center font-heading text-sm text-primary-container">
                    <Image src="/obadea.png" alt="Obadea_ceo" width={48} height={48} className="object-contain" />
                  </div>
                  <div>
                    <cite className="not-italic font-mono text-xs text-white block">
                      Obadea Gbenga
                    </cite>
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                      Lead Smart Contract Engineer
                    </span>
                  </div>
                </footer>
              </motion.blockquote>
            </LandingFrame>
          </section>

          {/* Battle-tested */}
          <section className="bg-background/90 pointer-events-auto">
            <LandingFrame>
              <FullBleedRail centerCross />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-outline-variant/40">
                <motion.div
                  className="relative w-full aspect-square lg:aspect-auto lg:min-h-[420px] border-b lg:border-b-0 lg:border-r border-outline-variant/40"
                  initial={{ opacity: 0, x: -32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <GridCross className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10" />
                  <AgentFlowVisual />
                </motion.div>

                <motion.div
                  className="p-8 md:p-12 lg:p-14"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={stagger}
                >
                  <motion.span
                    variants={fadeUp}
                    className="font-mono text-xs text-primary-container mb-3 block tracking-widest uppercase"
                  >
                    System Integrity
                  </motion.span>
                  <motion.h2
                    variants={fadeUp}
                    className="font-heading text-3xl md:text-4xl text-white mb-8 font-bold tracking-tight"
                  >
                    Battle-tested for the next generation of DeFi.
                  </motion.h2>
                  <div className="space-y-8">
                    {[
                      {
                        icon: IconShieldCheck,
                        color: "text-primary-container",
                        title: "Automated Remediation",
                        body: "Review AI-suggested fixes and optimized bytecode before you deploy to Mantle testnet or mainnet.",
                      },
                      {
                        icon: IconGauge,
                        color: "text-neon-cyan",
                        title: "Multi-Chain Sync",
                        body: "Optimized for Mantle with testnet and mainnet explorer integration, import, and verification flows.",
                      },
                    ].map((item) => (
                      <motion.div key={item.title} variants={fadeUp} className="flex gap-4">
                        <item.icon className={cn("w-6 h-6 shrink-0", item.color)} />
                        <div>
                          <h4 className="font-heading text-lg text-white mb-1">
                            {item.title}
                          </h4>
                          <p className="text-on-surface-variant text-sm leading-relaxed">
                            {item.body}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
              <FullBleedRail />
            </LandingFrame>
          </section>

          {/* Updates */}
          <section className="bg-surface-container-lowest/90 pointer-events-auto">
            <LandingFrame>
              <motion.div
                className="py-14 md:py-16 flex flex-col md:flex-row md:items-end justify-between gap-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
              >
                <motion.div variants={fadeUp}>
                  <h2 className="font-heading text-2xl text-white font-semibold">
                    Latest from the lab
                  </h2>
                  <p className="text-on-surface-variant text-sm mt-2">
                    Product notes and Mantle deployment guides.
                  </p>
                </motion.div>
                <motion.a
                  variants={fadeUp}
                  href="#"
                  className="font-mono text-[10px] text-primary-container uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                >
                  View all <IconArrowRight className="w-4 h-4" />
                </motion.a>
              </motion.div>
              <FullBleedRail centerCross />
              <div className="grid grid-cols-1 md:grid-cols-3 border-t border-outline-variant/40">
                {[
                  {
                    tag: "Release",
                    title: "Explorer-aware history & deploy links",
                    excerpt: "Testnet and mainnet URLs follow your analysis network automatically.",
                  },
                  {
                    tag: "Guide",
                    title: "Wallet-first deploy on Mantle",
                    excerpt: "Connect MetaMask or Phantom and ship bytecode from the dashboard.",
                  },
                  {
                    tag: "Security",
                    title: "LLM flags + verification flow",
                    excerpt: "Etherscan-compatible verify with normalized compiler versions.",
                  },
                ].map((post, i) => (
                  <motion.article
                    key={post.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className={cn(
                      "flex flex-col border-outline-variant/40 p-6 md:p-8",
                      i > 0 && "md:border-l border-t md:border-t-0"
                    )}
                  >
                    <div className="h-28 border border-outline-variant/35 bg-surface-variant/30 mb-5 relative rounded-none overflow-hidden">
                      <GridCross className="absolute -left-2 -top-2 md:hidden" />
                      {i === 0 && <ExplorerAwareVisual />}
                      {i === 1 && <WalletDeployVisual />}
                      {i === 2 && <VerificationFlowVisual />}
                    </div>
                    <span className="font-mono text-[9px] text-primary-container uppercase tracking-widest mb-2">
                      {post.tag}
                    </span>
                    <h3 className="font-heading text-lg text-white mb-2">{post.title}</h3>
                    <p className="text-on-surface-variant text-sm flex-1">{post.excerpt}</p>
                    <a
                      href="#"
                      className="mt-6 font-mono text-[10px] text-primary-container uppercase tracking-widest hover:underline"
                    >
                      Read more →
                    </a>
                  </motion.article>
                ))}
              </div>
              <FullBleedRail />
            </LandingFrame>
          </section>

          <LandingPricing />

          {/* CTA */}
          <section id="cta" className="py-16 md:py-20 bg-background/90 pointer-events-auto">
            <LandingFrame showTopRail={false}>
              <motion.div
                className="border border-outline-variant/50 bg-surface-container-lowest/80 p-10 md:p-14 text-center relative overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/8 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <GridCross className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2" />
                <GridCross className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2" />
                <GridCross className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2" />
                <GridCross className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2" />
                <motion.h2
                  variants={fadeUp}
                  className="font-heading text-3xl md:text-4xl text-white mb-4 font-bold"
                >
                  Made for professionals shipping on Mantle
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  className="text-lg text-on-surface-variant mb-10 max-w-2xl mx-auto font-mono"
                >
                  Run deep-scan audits, optimize gas, and deploy to Mantle — all
                  from one industrial-grade workspace.
                </motion.p>
                <motion.div
                  variants={fadeUp}
                  className="flex flex-col md:flex-row gap-4 justify-center"
                >
                  <Show when="signed-out">
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        className="bg-primary-container text-on-primary-container px-10 py-4 font-mono text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(184,246,0,0.5)] transition-all border border-primary-container/50"
                      >
                        Launch Dashboard
                      </button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <Link
                      href="/dashboard"
                      className="bg-primary-container text-on-primary-container px-10 py-4 font-mono text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(184,246,0,0.5)] transition-all inline-block border border-primary-container/50"
                    >
                      Launch Dashboard
                    </Link>
                  </Show>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="bg-surface-variant text-on-surface px-10 py-4 font-mono text-[10px] font-black uppercase tracking-widest hover:bg-surface-bright border border-outline-variant transition-all"
                    >
                      Sign In
                    </button>
                  </SignInButton>
                </motion.div>
              </motion.div>
            </LandingFrame>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative z-10 bg-gradient-to-b from-background/90 to-surface-container-lowest/40 pointer-events-auto border-t border-outline-variant/30">
          <LandingFrame showTopRail={false}>
            <FullBleedRail centerCross />
            <div className="py-14 md:py-16 flex flex-col lg:flex-row justify-between gap-12">
              <div className="flex flex-col gap-4 max-w-xs">
                <div className="font-heading text-primary-container font-bold tracking-tighter text-lg">
                  SENTINEL_OS
                </div>
                <p className="font-mono text-xs text-on-surface-variant/70 leading-relaxed">
                  © 2026 MANTLE SENTINEL // SECURING THE L2
                </p>
                <div className="flex gap-4 mt-2">
                  <a href="https://www.x.com/obadea0" target="_blank" className="text-on-surface-variant hover:text-neon-cyan transition-colors" aria-label="X">
                    <IconBrandX className="w-5 h-5" />
                  </a>
                  <a href="https://github.com/Obadea/SENTINEL_OS" target="_blank" className="text-on-surface-variant hover:text-primary-container transition-colors" aria-label="GitHub">
                    <IconBrandGithub className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-16">
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] text-primary-container uppercase tracking-widest">
                    Product
                  </span>
                  {["Dashboard", "Analyze", "Deploy"].map((label) => (
                    <Link
                      key={label}
                      href="/dashboard"
                      className="text-sm text-on-surface-variant hover:text-primary-container transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] text-primary-container uppercase tracking-widest">
                    Resources
                  </span>
                  {["System Status", "Docs", "Privacy"].map((label) => (
                    <a
                      key={label}
                      href="#"
                      className="text-sm text-on-surface-variant hover:text-primary-container transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                </div>
                <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                  <span className="font-mono text-[10px] text-primary-container uppercase tracking-widest">
                    Company
                  </span>
                  {["About", "Careers", "Contact"].map((label) => (
                    <a
                      key={label}
                      href="#"
                      className="text-sm text-on-surface-variant hover:text-primary-container transition-colors"
                    >
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <FullBleedRail />
          </LandingFrame>
        </footer>
      </div>
    </div>
  )
}
