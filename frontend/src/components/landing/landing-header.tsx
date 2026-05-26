"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs"
import { motion } from "./motion"
import { cn } from "@/lib/utils"

const NAV_LINKS: readonly { readonly label: string; readonly href: string }[] = [
  // { label: "Docs", href: "#features" },
  // { label: "Optimizations", href: "/dashboard/optimizations" },
  // { label: "History", href: "/dashboard/history" },
  // { label: "API", href: "#" },
]

function HeaderCta() {
  const btnClass = cn(
    "bg-primary-container text-[#141f00] px-5 h-9 font-mono text-[11px] font-black uppercase tracking-wider",
    "hover:shadow-[0_0_15px_rgba(184,246,0,0.4)] transition-all rounded-none border border-primary-container/80"
  )

  return (
    <>
      <Show when="signed-out">
        <SignUpButton mode="modal">
          <button type="button" className={btnClass}>
            Sign Up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/dashboard" className={cn(btnClass, "inline-flex items-center")}>
          Dashboard
        </Link>
      </Show>
    </>
  )
}

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = document.getElementById("landing-scroll")
    if (!el) return

    const onScroll = () => setScrolled(el.scrollTop > 12)
    onScroll()
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 md:px-6 pointer-events-none">
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "pointer-events-auto w-full max-w-[1012px] h-[62px]",
          "flex items-center gap-2 pl-5 pr-2 rounded-none",
          "border border-outline-variant/50",
          "bg-background/30 backdrop-blur-md",
          "transition-[box-shadow,border-color,background-color] duration-300",
          scrolled
            ? "shadow-[0_8px_32px_rgba(0,0,0,0.45),0_0_1px_rgba(184,246,0,0.12)] border-outline-variant/70 bg-background/50"
            : "shadow-none"
        )}
      >
        <Link
          href="/"
          className="shrink-0 font-heading text-[15px] font-bold tracking-tight text-on-surface hover:text-primary-container transition-colors"
        >
          SENTINEL<span className="text-primary-container">_OS</span>
        </Link>

        <nav
          className="hidden lg:flex flex-1 items-center justify-center gap-1"
          aria-label="Main"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={cn(
                "px-3.5 py-2 rounded-none font-mono",
                "text-[11px] font-medium uppercase tracking-[0.12em]",
                "text-on-surface-variant hover:text-primary-container",
                "hover:bg-primary-container/10 transition-colors duration-200"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <nav className="flex lg:hidden flex-1 items-center justify-center gap-0.5 overflow-x-auto no-scrollbar">
          {NAV_LINKS.slice(0, 3).map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-2.5 py-1.5 rounded-none font-mono text-[10px] font-medium uppercase tracking-wider text-on-surface-variant hover:text-primary-container whitespace-nowrap transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="shrink-0 flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className={cn(
                  "hidden sm:inline-flex h-9 items-center px-4 rounded-none font-mono",
                  "text-[11px] font-medium uppercase tracking-wider",
                  "text-on-surface-variant hover:text-secondary hover:bg-secondary/10",
                  "transition-colors"
                )}
              >
                Sign In
              </button>
            </SignInButton>
          </Show>
          <HeaderCta />
        </div>
      </motion.header>
    </div>
  )
}
