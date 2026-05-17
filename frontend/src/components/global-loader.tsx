"use client";

import { DotmSquare14 } from "@/components/ui/dotm-square-14";

export function GlobalLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-[#050505] ${fullScreen ? 'fixed inset-0 z-[9999] h-screen w-screen' : 'h-full w-full min-h-[400px]'}`}>
      <DotmSquare14
        size={30}
        color="#c8ff00"
        speed={1.5}
        bloom
      />
      <div className="mt-12 flex items-center gap-3">
        <span className="w-2 h-2 bg-neon-green rounded-none animate-ping" />
        <p className="text-xs font-mono uppercase tracking-widest text-neon-green animate-pulse">
          Initializing Workspace...
        </p>
      </div>
    </div>
  );
}
