"use client"

import Image from "next/image"
import { LandingFrame, FullBleedRail } from "./landing-grid"
const WALLETS = [
  { name: "MetaMask", src: "/MetaMask-icon-fox.svg", width: 36, height: 36 },
  { name: "Phantom", src: "/Phantom_SVG_Icon.svg", width: 32, height: 32 },
  { name: "Binance", src: "/_Icon.png", width: 32, height: 32 },
] as const

export function LandingPartners() {
  return (
    <section className="relative pointer-events-auto border-y border-outline-variant/30 bg-surface-container-lowest/95">
      <LandingFrame showTopRail className="py-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-10 md:py-12">
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex h-12 w-12 items-center justify-center ">
              {/* <span className="font-heading text-lg font-black text-primary-container tracking-tighter">
                M
              </span> */}
              <Image src="/mantel_logo.png" alt="Mantle" width={48} height={48} className="object-contain" />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-on-surface-variant">
                Secured on
              </p>
              <p className="font-heading text-xl font-bold text-on-surface tracking-tight">
                MANTLE
              </p>
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-outline-variant/50 shrink-0" />

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4 md:gap-8">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/70 w-full md:w-auto text-center md:text-left">
              Deploy with
            </span>
            {WALLETS.map((w) => (
              <div
                key={w.name}
                className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
                title={w.name}
              >
                <Image
                  src={w.src}
                  alt={w.name}
                  width={w.width}
                  height={w.height}
                  className="object-contain"
                />
                <span className="font-mono text-[8px] uppercase tracking-widest text-on-surface-variant">
                  {w.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        <FullBleedRail className="mt-2" />
      </LandingFrame>
    </section>
  )
}
