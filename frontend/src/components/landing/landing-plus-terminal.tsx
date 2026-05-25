"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

const PROMPT_PREFIX = "[Sentinel_OS] ›"
const PROMPT_COMMAND = "/analyze VaultProxy.sol on Mantle mainnet"

const FOLLOW_UP_LINES = [
  "Searching Mantle explorer for verified source",
  "Scanning bytecode for reentrancy and access-control vectors",
  'Found 1 critical flag and 3 gas optimizations. Building audit report…',
] as const

const TYPING_MS = 28
const LINE_DELAY_MS = 220
const LOOP_PAUSE_MS = 5000

function useTerminalSequence() {
  const reduceMotion = useReducedMotion()
  const [typedChars, setTypedChars] = useState(0)
  const [visibleLines, setVisibleLines] = useState(0)
  const [phase, setPhase] = useState<"typing" | "lines" | "hold">("typing")

  useEffect(() => {
    if (reduceMotion) {
      setTypedChars(PROMPT_COMMAND.length)
      setVisibleLines(FOLLOW_UP_LINES.length)
      setPhase("hold")
      return
    }

    let generation = 0
    const timeouts: ReturnType<typeof setTimeout>[] = []

    const schedule = () => {
      const gen = ++generation
      const run = (fn: () => void, ms: number) => {
        timeouts.push(
          setTimeout(() => {
            if (gen === generation) fn()
          }, ms)
        )
      }

      setTypedChars(0)
      setVisibleLines(0)
      setPhase("typing")

      for (let i = 1; i <= PROMPT_COMMAND.length; i++) {
        run(() => setTypedChars(i), i * TYPING_MS)
      }

      const afterTyping = PROMPT_COMMAND.length * TYPING_MS + LINE_DELAY_MS

      run(() => setPhase("lines"), afterTyping)

      FOLLOW_UP_LINES.forEach((_, index) => {
        run(() => setVisibleLines(index + 1), afterTyping + index * LINE_DELAY_MS)
      })

      const loopAt =
        afterTyping + FOLLOW_UP_LINES.length * LINE_DELAY_MS + LOOP_PAUSE_MS

      run(() => {
        setPhase("hold")
        schedule()
      }, loopAt)
    }

    schedule()

    return () => {
      generation += 1
      timeouts.forEach(clearTimeout)
    }
  }, [reduceMotion])

  return { typedChars, visibleLines, phase, reduceMotion }
}

function TerminalLine({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("text-[13px] leading-[1.55] tracking-[-0.01em]", className)}
    >
      {children}
    </motion.div>
  )
}

export function LandingPlusTerminal({ className }: { className?: string }) {
  const { typedChars, visibleLines, phase, reduceMotion } = useTerminalSequence()
  const showCursor = phase === "typing" || visibleLines < FOLLOW_UP_LINES.length

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "plus-terminal home-plus-aikit-terminal",
        "w-full max-w-[490px] h-[253px]",
        "rounded-none border border-outline-variant/50",
        "bg-[#0a0a0a]/90 backdrop-blur-md",
        "shadow-[0_24px_80px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "overflow-hidden flex flex-col",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-outline-variant/30 shrink-0">
        <span
          className="size-3 rounded-full bg-[#ff5f57] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
          aria-hidden
        />
        <span
          className="size-3 rounded-full bg-[#febc2e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
          aria-hidden
        />
        <span
          className="size-3 rounded-full bg-[#28c840] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
          aria-hidden
        />
      </div>

      <div className="relative flex-1 min-h-0 px-5 py-4 flex flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "linear-gradient(180deg, rgba(184,246,0,0.06) 0%, transparent 42%)",
          }}
        />

        <div className="relative flex flex-col gap-3 text-left">
          <div className="text-[13px] leading-[1.55] min-h-[1.55em]">
            <span className="text-on-surface-variant/55">{PROMPT_PREFIX}</span>
            <span className="text-on-surface/95">
              {PROMPT_COMMAND.slice(0, typedChars)}
            </span>
            <AnimatePresence>
              {showCursor && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="inline-block w-[7px] h-[14px] ml-0.5 align-[-2px] bg-primary-container/90"
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-2.5">
            {FOLLOW_UP_LINES.map((line, index) =>
              index < visibleLines ? (
                <TerminalLine
                  key={`${line}-${index}`}
                  className="text-on-surface-variant/75"
                >
                  <motion.span
                    className="text-on-surface-variant/40"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    -{" "}
                  </motion.span>
                  <span
                    className={cn(
                      index === visibleLines - 1 &&
                        phase !== "hold" &&
                        "text-on-surface/85"
                    )}
                  >
                    {line}
                    {index === visibleLines - 1 &&
                      phase !== "hold" &&
                      !reduceMotion && (
                        <motion.span
                          className="inline-block ml-1 text-primary-container"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          ···
                        </motion.span>
                      )}
                  </span>
                </TerminalLine>
              ) : null
            )}
          </div>
        </div>

        {/* <motion.div
          className="mt-auto pt-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: visibleLines >= FOLLOW_UP_LINES.length ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="size-1.5 bg-primary-container" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary-container/80">
            SENTINEL_OS · live
          </span>
        </motion.div> */}
      </div>
    </motion.div>
  )
}
