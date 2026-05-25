import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const PRIMARY = "#b8f600"

/** Outer frame padding + rail position (must match LandingVerticalGuides) */
export const LANDING_FRAME_PX = "px-0 md:px-0"
// export const LANDING_FRAME_PX = "px-2 md:px-10"
// export const LANDING_RAIL_INSET = "left-6 md:left-10 right-6 md:right-10"
export const LANDING_RAIL_INSET = "left-6 md:left-10 right-6 md:right-10"
/** Space between vertical rails and section content */
export const LANDING_CONTENT_GUTTER = "px-6 md:px-12 lg:px-16"

/** Registration-mark cross at rail intersections */
export function GridCross({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative size-4 shrink-0", className)}
      aria-hidden
    >
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-px"
        style={{ backgroundColor: PRIMARY }}
      />
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-px"
        style={{ backgroundColor: PRIMARY }}
      />
      <span
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-1 border bg-background"
        style={{ borderColor: PRIMARY }}
      />
    </div>
  )
}

/** Horizontal rail between vertical guides, with crosses at rail positions */
export function HorizontalRail({
  className,
  centerCross,
}: {
  className?: string
  centerCross?: boolean
}) {
  return (
    <div
      className={cn("relative w-full h-5", className)}
      aria-hidden
    >
      <GridCross className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" />
      <GridCross className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 translate-x-1/2 z-10" />
      <div
        className={cn(
          "absolute top-1/2 h-px bg-outline-variant/45",
          "left-6 md:left-10 right-6 md:right-10"
        )}
      />
      {centerCross && (
        <GridCross className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10" />
      )}
    </div>
  )
}

type LandingFrameProps = {
  children: ReactNode
  className?: string
  showTopRail?: boolean
}

/** Content column with vertical rails inset from content via gutter padding */
export function LandingFrame({
  children,
  className,
  showTopRail = true,
}: LandingFrameProps) {
  return (
    <div className={cn("relative max-w-7xl mx-auto", LANDING_FRAME_PX, className)}>
      <div
        className="absolute left-6 md:left-10 top-0 bottom-0 w-px bg-outline-variant/40 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute right-6 md:right-10 top-0 bottom-0 w-px bg-outline-variant/40 pointer-events-none"
        aria-hidden
      />

      {showTopRail && <HorizontalRail />}

      <div className={LANDING_CONTENT_GUTTER}>{children}</div>
    </div>
  )
}

/** Horizontal rail aligned to vertical guides when placed inside content gutter */
export function FullBleedRail({
  className,
  centerCross,
}: {
  className?: string
  centerCross?: boolean
}) {
  return (
    <div
      className={cn(
        "-mx-8 md:-mx-12 lg:-mx-16",
        "w-[calc(100%+4rem)] md:w-[calc(100%+6rem)] lg:w-[calc(100%+8rem)]",
        className
      )}
    >
      <HorizontalRail centerCross={centerCross} />
    </div>
  )
}

/** Fixed vertical guides visible across entire scroll (behind content) */
export function LandingVerticalGuides() {
  return (
    <div
      className="fixed inset-0 z-[1] pointer-events-none flex justify-center"
      aria-hidden
    >
      <div
        className={cn(
          "relative w-full max-w-7xl h-full mx-auto",
          LANDING_FRAME_PX
        )}
      >
        <div className="absolute left-[34.5px] top-0 bottom-0 w-[2px] bg-outline-variant/40" />
        <div className="absolute right-[45.5px] top-0 bottom-0 w-[2px] bg-outline-variant/40" />
      </div>
    </div>
  )
}
