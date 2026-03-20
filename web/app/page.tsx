import NeuralBrain from "./components/NeuralBrain";

export default function Home() {
  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <NeuralBrain />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/40 via-[#050508]/20 to-[#050508]/90 z-10 pointer-events-none" />

      <main className="relative z-20 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="max-w-2xl text-center">
          <h1 className="animate-fade-in-up text-5xl sm:text-7xl font-bold tracking-tight mb-2">
            <span className="text-white">pinky</span>
            <span className="text-blue-400">s</span>
            <span className="text-white">brain</span>
          </h1>

          <p className="animate-fade-in-up delay-200 text-lg sm:text-xl text-zinc-400 mb-10 font-mono">
            Play against living neurons. Watch them think.
          </p>

          <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="https://github.com/MichaelLod/pinkysbrain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full text-sm font-medium text-white hover:bg-white/15 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
            <a
              href="/play"
              className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 backdrop-blur-sm border border-blue-400/20 rounded-full text-sm font-medium text-blue-300 hover:bg-blue-500/30 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play Pong
            </a>
          </div>

          <div className="animate-fade-in-up delay-600 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="text-blue-400 font-mono text-xs mb-2 uppercase tracking-widest">
                Input
              </div>
              <p className="text-sm text-zinc-400">
                Game state encoded as electrical stimulation patterns across a
                59-channel electrode array
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="text-blue-400 font-mono text-xs mb-2 uppercase tracking-widest">
                Brain
              </div>
              <p className="text-sm text-zinc-400">
                800,000 lab-grown human neurons respond with spike cascades and
                wave patterns
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
              <div className="text-blue-400 font-mono text-xs mb-2 uppercase tracking-widest">
                Output
              </div>
              <p className="text-sm text-zinc-400">
                Population spike patterns decoded into game actions — the
                neurons play back
              </p>
            </div>
          </div>

          <div className="animate-fade-in-up delay-800 mt-12 text-zinc-600 text-xs font-mono">
            Built on the{" "}
            <a
              href="https://github.com/Cortical-Labs/cl-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-blue-400 transition-colors"
            >
              Cortical Labs CL SDK
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
