"use client"

import { IconCheck } from "@tabler/icons-react"
import { Show, SignUpButton } from "@clerk/nextjs"
import Link from "next/link"
import { motion, fadeUp, stagger } from "./motion"
import { LandingFrame, FullBleedRail, GridCross } from "./landing-grid"
import { cn } from "@/lib/utils"

type PlanId = "free" | "starter" | "pro"

type PricingPlan = {
  id: PlanId
  name: string
  price: string
  period?: string
  tagline: string
  features: string[]
  highlighted?: boolean
  cta: string
  accent: "default" | "green" | "violet"
}

const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Ship audits on Mantle without a card.",
    features: [
      "AI vulnerability scan",
      "Gas estimates",
      "7-day history",
      "Deploy + verify contracts",
      "Shareable audit report URLs",
    ],
    cta: "Get started",
    accent: "default",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    period: "per month",
    tagline: "More depth for active builders.",
    highlighted: true,
    features: [
      "Everything in Free",
      "More analysis capacity",
      "30-day history",
      "Optimized code rewrite",
    ],
    cta: "Start Starter",
    accent: "green",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "per month",
    tagline: "Maximum throughput for production teams.",
    features: [
      "5–10× more analysis capacity",
      "Exportable PDF reports",
      "Unlimited history",
      "Early access to advanced SENTINEL_OS features",
      "Priority access at high traffic times",
      "Higher output limits",
    ],
    cta: "Go Pro",
    accent: "violet",
  },
]

const ACCENT_STYLES = {
  default: {
    card: "border-outline-variant/40 bg-surface-container-lowest/60",
    bar: "bg-outline-variant/50",
    tag: "text-on-surface-variant",
    check: "text-on-surface-variant",
  },
  green: {
    card: "border-primary-container/50 bg-primary-container/[0.04] shadow-[0_0_40px_rgba(184,246,0,0.08)]",
    bar: "bg-primary-container",
    tag: "text-primary-container",
    check: "text-primary-container",
  },
  violet: {
    card: "border-neon-violet/35 bg-neon-violet/[0.04]",
    bar: "bg-neon-violet",
    tag: "text-neon-violet",
    check: "text-neon-violet",
  },
}

function PlanCta({
  plan,
  className,
}: {
  plan: PricingPlan
  className?: string
}) {
  const btnClass = cn(
    "w-full py-3 font-mono text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] border rounded-none",
    plan.highlighted
      ? "bg-primary-container text-on-primary-container border-primary-container/60 hover:shadow-[0_0_20px_rgba(184,246,0,0.45)]"
      : plan.id === "pro"
        ? "bg-neon-violet/15 text-neon-violet border-neon-violet/30 hover:bg-neon-violet/25"
        : "bg-surface-container-high/80 text-on-surface border-outline-variant/50 hover:border-outline-variant",
    className
  )

  return (
    <>
      <Show when="signed-out">
        <SignUpButton mode="modal">
          <button type="button" className={btnClass}>
            {plan.cta}
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={cn(btnClass, "inline-block text-center")}>
          {plan.cta}
        </Link>
      </Show>
    </>
  )
}

function PricingCard({ plan, index }: { plan: PricingPlan; index: number }) {
  const a = ACCENT_STYLES[plan.accent]

  return (
    <motion.article
      variants={fadeUp}
      className={cn(
        "relative flex flex-col p-8 md:p-9 border transition-colors",
        a.card,
        index > 0 && "md:border-l border-t md:border-t-0 border-outline-variant/40"
      )}
    >
      {index > 0 && (
        <GridCross className="hidden md:block absolute -left-2 top-0 -translate-y-1/2 z-10" />
      )}

      {plan.highlighted && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-primary-container text-on-primary-container border border-primary-container/80">
          Popular
        </span>
      )}

      <div className={cn("h-0.5 w-12 mb-6", a.bar)} />

      <p className={cn("font-mono text-[10px] uppercase tracking-[0.2em] mb-2", a.tag)}>
        {plan.name}
      </p>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-heading text-4xl md:text-[42px] font-bold text-white tracking-tight">
          {plan.price}
        </span>
        {plan.period && (
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            {plan.period}
          </span>
        )}
      </div>

      <p className="text-on-surface-variant text-sm leading-relaxed mb-8 min-h-[2.5rem]">
        {plan.tagline}
      </p>

      <ul className="flex flex-col gap-3 mb-10 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm text-on-surface-variant leading-snug">
            <IconCheck
              className={cn("w-4 h-4 shrink-0 mt-0.5", a.check)}
              stroke={2}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <PlanCta plan={plan} />
    </motion.article>
  )
}

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="bg-surface-container-lowest/90 pointer-events-auto border-y border-outline-variant/25"
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
            Pricing
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="font-heading text-3xl md:text-4xl text-white mb-4 font-semibold"
          >
            Plans for every stage of the audit pipeline
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-on-surface-variant leading-relaxed font-mono text-sm"
          >
            Start free on Mantle. Upgrade when you need deeper analysis, longer
            history, and production-grade exports.
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="mt-5 font-mono text-[11px] text-on-surface-variant/80 tracking-wide"
          >
            No commitment · Cancel anytime
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
          {PLANS.map((plan, index) => (
            <PricingCard key={plan.id} plan={plan} index={index} />
          ))}
        </motion.div>

        <FullBleedRail />
      </LandingFrame>
    </section>
  )
}
