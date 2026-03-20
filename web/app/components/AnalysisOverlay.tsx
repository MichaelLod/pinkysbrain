"use client";

import type { AnalysisData } from "../hooks/useNeuralSocket";

const GRID_SIZE = 8;
const EXCLUDED = new Set([0, 4, 7, 56, 63]);

interface AnalysisOverlayProps {
  analysis: AnalysisData | null;
  spikeCount: number;
  neuralDirection: number;
}

export default function AnalysisOverlay({
  analysis,
  spikeCount,
  neuralDirection,
}: AnalysisOverlayProps) {
  const maxRate =
    analysis && Object.keys(analysis.channels).length > 0
      ? Math.max(...Object.values(analysis.channels), 1)
      : 1;

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-4 font-mono text-xs">
      <div className="text-blue-400 uppercase tracking-widest text-[10px] mb-3">
        Neural Activity
      </div>

      <div className="grid grid-cols-8 gap-[2px] mb-4">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          if (EXCLUDED.has(i)) {
            return <div key={i} className="aspect-square rounded-sm bg-transparent" />;
          }
          const rate = analysis?.channels[String(i)] ?? 0;
          const intensity = Math.min(1, rate / maxRate);
          return (
            <div
              key={i}
              className="aspect-square rounded-sm"
              style={{
                backgroundColor: `rgba(100, 160, 255, ${0.08 + intensity * 0.7})`,
              }}
            />
          );
        })}
      </div>

      <div className="space-y-2 text-zinc-400">
        <div className="flex justify-between">
          <span>Mean rate</span>
          <span className="text-zinc-200">
            {analysis?.mean_rate?.toFixed(1) ?? "0.0"} Hz
          </span>
        </div>
        <div className="flex justify-between">
          <span>Spikes/tick</span>
          <span className="text-zinc-200">{spikeCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Neural intent</span>
          <span
            className={
              neuralDirection > 0.01
                ? "text-orange-400"
                : neuralDirection < -0.01
                  ? "text-blue-400"
                  : "text-zinc-500"
            }
          >
            {neuralDirection > 0.01 ? "DOWN" : neuralDirection < -0.01 ? "UP" : "IDLE"}
          </span>
        </div>
      </div>
    </div>
  );
}
