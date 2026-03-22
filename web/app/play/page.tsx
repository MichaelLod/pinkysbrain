"use client";

import { useRef } from "react";
import { useNeuralSocket } from "../hooks/useNeuralSocket";
import NeuralBrain from "../components/NeuralBrain";
import AnalysisOverlay from "../components/AnalysisOverlay";
import Link from "next/link";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8765";

function SetupGuide() {
  return (
    <div className="flex items-center justify-center min-h-screen px-6 py-12">
      <div className="max-w-xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Grow your own brain
          </h1>
          <p className="text-zinc-400 text-sm font-mono">
            Run a neural simulator on your machine. Play Pong against it.
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-blue-400 font-mono text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">
                  Clone the repo
                </h3>
                <p className="text-zinc-500 text-xs mb-3">
                  Grab the source and install dependencies
                </p>
                <div className="bg-black/40 rounded-lg p-3 font-mono text-sm space-y-1">
                  <div className="text-zinc-400">
                    <span className="text-zinc-600 select-none">$ </span>
                    <span className="text-blue-300">git clone</span>{" "}
                    https://github.com/MichaelLod/pinkysbrain.git
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-600 select-none">$ </span>
                    <span className="text-blue-300">cd</span> pinkysbrain
                  </div>
                  <div className="text-zinc-400">
                    <span className="text-zinc-600 select-none">$ </span>
                    <span className="text-blue-300">pip install</span> -r
                    requirements.txt
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-blue-400 font-mono text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">
                  Start the brain
                </h3>
                <p className="text-zinc-500 text-xs mb-3">
                  This spins up 800K simulated neurons on your machine
                </p>
                <div className="bg-black/40 rounded-lg p-3 font-mono text-sm">
                  <div className="text-zinc-400">
                    <span className="text-zinc-600 select-none">$ </span>
                    <span className="text-blue-300">python -m</span> server
                  </div>
                  <div className="text-green-400/60 text-xs mt-2">
                    Starting pinkysbrain server on localhost:8765
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 border border-orange-400/20 flex items-center justify-center text-orange-400 font-mono text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">
                  Come back here
                </h3>
                <p className="text-zinc-500 text-xs mb-3">
                  This page auto-connects when it detects your local brain
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse" />
                  <span className="text-zinc-500 font-mono text-xs">
                    Listening for neural connection on localhost:8765...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-zinc-600 text-xs font-mono">
            Requires Python 3.12+
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://github.com/MichaelLod/pinkysbrain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-mono"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View source
            </a>
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-mono"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayPage() {
  const { connected, latestTick, tickRef, prevTickRef, tickTimeRef, sendPlayerInput } = useNeuralSocket(WS_URL);
  const scoreRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508]">
      {/* 3D brain + Pong (single WebGL renderer, all meshes) */}
      <div className="absolute inset-0 z-0">
        <NeuralBrain
          mode={connected ? "live" : "demo"}
          spikeData={latestTick?.spikes}
          stimData={latestTick?.stims}
          showPong={connected}
          tickRef={tickRef}
          prevTickRef={prevTickRef}
          tickTimeRef={tickTimeRef}
          onPlayerInput={sendPlayerInput}
          scoreRef={scoreRef}
        />
      </div>

      {/* Score overlay (HTML, updated by rAF loop via ref) */}
      {connected && (
        <div className="absolute top-[18%] left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div
            ref={scoreRef}
            className="text-zinc-400/60 font-mono text-lg tracking-widest"
          >
            YOU 0 : 0 NEURONS
          </div>
        </div>
      )}

      {/* Content layer */}
      <div className="relative z-20 h-full pointer-events-none">
        {connected ? (
          <div className="flex h-full justify-end">
            {/* Analysis sidebar */}
            <div className="w-56 p-4 flex flex-col gap-4 pointer-events-auto">
              <Link
                href="/"
                className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono text-xs"
              >
                &larr; back
              </Link>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-mono text-xs text-zinc-400">
                  Connected
                </span>
              </div>

              <AnalysisOverlay
                analysis={latestTick?.analysis ?? null}
                spikeCount={latestTick?.spikes.length ?? 0}
                neuralDirection={latestTick?.neural_direction ?? 0}
              />

              {latestTick && (
                <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-4 font-mono text-xs">
                  <div className="text-orange-400 uppercase tracking-widest text-[10px] mb-3">
                    Score
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>You</span>
                    <span className="text-lg">
                      {latestTick.game.player_score}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span>Neurons</span>
                    <span className="text-lg">
                      {latestTick.game.neural_score}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <SetupGuide />
        )}
      </div>
    </div>
  );
}
