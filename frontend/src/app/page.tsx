import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { RippleButton } from "@/components/ui/RippleButton";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full">
      {/* Header / Nav */}
      <header className="flex justify-between items-center mb-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neon-green rounded-sm flex items-center justify-center text-black font-bold">
            CA
          </div>
          <span className="font-heading text-xl font-bold tracking-tight uppercase">
            Sentinel OS <span className="text-neon-green">Auditor</span>
          </span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-mono uppercase tracking-widest text-on-surface-variant">
          <a href="#" className="hover:text-neon-green transition-colors">Dashboard</a>
          <a href="#" className="hover:text-neon-green transition-colors">Reports</a>
          <a href="#" className="hover:text-neon-green transition-colors">Network</a>
          <a href="#" className="hover:text-neon-green transition-colors">Settings</a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Show when="signed-out">
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <RippleButton className="px-5 py-2 border border-neon-green text-neon-green font-mono uppercase text-[10px] tracking-widest hover:bg-neon-green/10 transition-colors">
                  Sign In
                </RippleButton>
              </SignInButton>
              <SignUpButton mode="modal">
                <RippleButton className="px-5 py-2 bg-neon-green text-black font-bold uppercase text-[10px] tracking-widest hover:shadow-neon-green transition-shadow [--ripple-button-ripple-color:rgba(0,0,0,0.2)]">
                  Sign Up
                </RippleButton>
              </SignUpButton>
            </div>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <RippleButton className="px-5 py-2 bg-neon-green text-black font-bold rounded-none uppercase text-[10px] tracking-widest hover:shadow-neon-green transition-shadow [--ripple-button-ripple-color:rgba(0,0,0,0.2)]">
                  Dashboard
                </RippleButton>
              </Link>
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 rounded-none border border-neon-green/30",
                    userButtonTrigger: "focus:shadow-none"
                  }
                }}
              />
            </div>
          </Show>
        </div>
      </header>

      {/* Hero Section */}
      <section className="grid lg:grid-cols-2 gap-12 items-center mb-24">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 glass rounded-full text-[10px] font-mono text-neon-violet uppercase tracking-widest mb-6">
            <span className="w-2 h-2 bg-neon-violet rounded-full animate-pulse" />
            System Live: v4.2.0-industrial
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 leading-[1.1] tracking-tighter">
            SECURE THE <br />
            <span className="text-neon-green italic">PROTOCOL.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-md mb-8 leading-relaxed font-sans">
            High-density smart contract auditing. Zero-latency threat detection. 
            Engineered for researchers who demand technical superiority.
          </p>
          <div className="flex gap-4">
            <RippleButton className="px-8 py-4 bg-neon-green text-on-primary font-bold rounded-none uppercase text-sm tracking-tighter hover:shadow-neon-green transition-shadow [--ripple-button-ripple-color:rgba(0,0,0,0.2)]">
              Initialize New Audit
            </RippleButton>
            <RippleButton className="px-8 py-4 border border-neon-violet text-neon-violet font-bold rounded-none uppercase text-sm tracking-tighter hover:bg-neon-violet/10 transition-colors">
              View Documentation
            </RippleButton>
          </div>
        </div>

        <div className="relative">
          <div className="terminal w-full aspect-video glass">
            <div className="terminal-header">
              <span>scan_process.log</span>
              <span>12:44:02.392</span>
            </div>
            <div className="space-y-1 text-sm font-mono">
              <p className="text-on-surface-variant line-clamp-1">[INFO] Initializing Sentinel OS Audit Engine...</p>
              <p className="text-neon-cyan">[SCAN] Analyzing: 0x71C765...d897</p>
              <p className="text-on-surface-variant">[SCAN] Found 142 functions, 23 external calls.</p>
              <p className="text-error">[WARN] Reentrancy vulnerability detected in transfer_logic()</p>
              <p className="text-neon-green">[OK] Gas optimization suggested: 12.4% reduction.</p>
              <p className="text-on-surface-variant">[SCAN] Static analysis complete. 98% coverage.</p>
              <div className="mt-4 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-neon-green w-3/4 animate-[scanning_2s_infinite_linear]" />
              </div>
            </div>
          </div>
          {/* Decorative glows */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-neon-green/10 blur-[80px] -z-10" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-neon-violet/10 blur-[80px] -z-10" />
        </div>
      </section>

      {/* Grid Features */}
      <section className="grid md:grid-cols-3 gap-6 mb-24">
        {[
          { title: "Smart Scan", desc: "AI-powered vulnerability detection with 99.9% precision.", icon: "⚡", color: "green" },
          { title: "Real-time Ops", desc: "Monitor protocol health with sub-second latency telemetry.", icon: "🛰️", color: "violet" },
          { title: "Auto Remediation", desc: "Automated patch generation for critical logic flaws.", icon: "🛡️", color: "cyan" },
        ].map((feat, i) => (
          <div key={i} className="p-8 glass rounded-sm hover:border-on-surface/20 transition-all group">
            <div className={`text-3xl mb-4`}>{feat.icon}</div>
            <h3 className="text-xl font-heading font-bold mb-3 uppercase tracking-tight">{feat.title}</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </section>
      
      {/* Footer */}
      <footer className="mt-auto border-t border-wireframe pt-12 pb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-on-surface-variant">
          © 2026 Sentinel OS // Secure Operations Division
        </div>
        <div className="flex gap-8 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Status: Operational</a>
        </div>
      </footer>
    </main>
  );
}
