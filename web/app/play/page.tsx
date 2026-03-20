"use client";

import { useNeuralSocket } from "../hooks/useNeuralSocket";
import NeuralBrain from "../components/NeuralBrain";
import PongCanvas from "../components/PongCanvas";
import AnalysisOverlay from "../components/AnalysisOverlay";
import Link from "next/link";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8765";

export default function PlayPage() {
  const { connected, latestTick, sendPlayerInput } = useNeuralSocket(WS_URL);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508]">
      {/* 3D brain background */}
      <div className="absolute inset-0 z-0">
        <NeuralBrain
          mode={connected ? "live" : "demo"}
          spikeData={latestTick?.spikes}
          stimData={latestTick?.stims}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/30 via-transparent to-[#050508]/30 z-10 pointer-events-none" />

      {/* Game layer */}
      <div className="relative z-20 flex h-full">
        {/* Pong */}
        <div className="flex-1 flex items-center justify-center p-4">
          {connected ? (
            <div className="w-full max-w-3xl aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.06]">
              <PongCanvas
                gameState={latestTick?.game ?? null}
                onPlayerInput={sendPlayerInput}
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="text-zinc-400 font-mono text-sm mb-4">
                Waiting for neural connection...
              </div>
              <div className="text-zinc-600 font-mono text-xs mb-6">
                Start the server: <code className="text-zinc-400">python -m server</code>
              </div>
              <div className="w-full max-w-3xl aspect-[4/3] rounded-xl overflow-hidden border border-white/[0.06] mx-auto">
                <PongCanvas
                  gameState={{
                    ball_x: 0.5,
                    ball_y: 0.5,
                    ball_vx: 0,
                    ball_vy: 0,
                    player_paddle_y: 0.5,
                    neural_paddle_y: 0.5,
                    player_score: 0,
                    neural_score: 0,
                  }}
                  onPlayerInput={() => {}}
                />
              </div>
            </div>
          )}
        </div>

        {/* Analysis sidebar */}
        <div className="w-56 p-4 flex flex-col gap-4">
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono text-xs"
          >
            &larr; back
          </Link>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-zinc-600"}`}
            />
            <span className="font-mono text-xs text-zinc-400">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <AnalysisOverlay
            analysis={latestTick?.analysis ?? null}
            spikeCount={latestTick?.spikes.length ?? 0}
            neuralDirection={latestTick?.neural_direction ?? 0}
          />

          {connected && latestTick && (
            <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-4 font-mono text-xs">
              <div className="text-orange-400 uppercase tracking-widest text-[10px] mb-3">
                Score
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>You</span>
                <span className="text-lg">{latestTick.game.player_score}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Neurons</span>
                <span className="text-lg">{latestTick.game.neural_score}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
