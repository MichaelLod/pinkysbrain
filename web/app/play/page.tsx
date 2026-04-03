"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import BrainMatchView from "../components/BrainMatchView";
import { BrainMatch, DEFAULT_FEED, GAME_DURATION_SEC } from "../engine";
import type { RecordingMeta, RecordingData, FeedConfig, TickResult } from "../engine";

const TYPE_INFO: Record<string, { label: string; desc: string; color: string }> = {
  monolayer: {
    label: "Monolayer",
    desc: "Flat sheet of neurons. Sparser firing, more organized.",
    color: "text-blue-400",
  },
  organoid: {
    label: "Organoid",
    desc: "3D neural cluster. Dense, chaotic activity.",
    color: "text-orange-400",
  },
};

const SPATIAL_FILTERS: { value: FeedConfig["spatialFilter"]; label: string }[] = [
  { value: "full", label: "Full Array" },
  { value: "top", label: "Top Half" },
  { value: "bottom", label: "Bottom Half" },
  { value: "left", label: "Left Half" },
  { value: "right", label: "Right Half" },
  { value: "center", label: "Center" },
  { value: "edges", label: "Edges" },
];

async function loadIndex(): Promise<RecordingMeta[]> {
  const res = await fetch("/recordings/index.json");
  return res.json();
}

async function loadRecording(id: string): Promise<RecordingData> {
  const res = await fetch(`/recordings/${id}.json`);
  return res.json();
}

function RecordingCard({
  rec,
  selected,
  onSelect,
  side,
}: {
  rec: RecordingMeta;
  selected: boolean;
  onSelect: () => void;
  side: "left" | "right";
}) {
  const info = TYPE_INFO[rec.type] ?? TYPE_INFO.monolayer;
  const borderColor = selected
    ? side === "left"
      ? "border-blue-400/40"
      : "border-orange-400/40"
    : "border-white/[0.06]";
  const bgColor = selected ? "bg-white/[0.06]" : "bg-white/[0.03]";

  return (
    <button
      onClick={onSelect}
      className={`${bgColor} border ${borderColor} backdrop-blur-sm rounded-lg p-4 hover:bg-white/[0.06] transition-all text-left w-full`}
    >
      <div className={`font-medium text-sm ${info.color}`}>{info.label}</div>
      <div className="text-zinc-500 text-xs font-mono">{rec.id}</div>
      <div className="text-zinc-500 text-xs mt-1">
        {rec.spike_count.toLocaleString()} spikes
      </div>
    </button>
  );
}

function FeedControls({
  feed,
  onChange,
  side,
  label,
}: {
  feed: FeedConfig;
  onChange: (f: FeedConfig) => void;
  side: "left" | "right";
  label: string;
}) {
  const accent = side === "left" ? "text-blue-400" : "text-orange-400";

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl p-4 font-mono text-xs space-y-3">
      <div className={`${accent} uppercase tracking-widest text-[10px]`}>
        {label}
      </div>

      <div>
        <div className="text-zinc-500 mb-1">Region</div>
        <select
          value={feed.spatialFilter}
          onChange={(e) =>
            onChange({ ...feed, spatialFilter: e.target.value as FeedConfig["spatialFilter"] })
          }
          className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-zinc-300 text-xs"
        >
          {SPATIAL_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="text-zinc-500 mb-1">
          Gain: {feed.gain.toFixed(1)}x
        </div>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={feed.gain}
          onChange={(e) => onChange({ ...feed, gain: parseFloat(e.target.value) })}
          className="w-full accent-current"
        />
      </div>

      <div>
        <div className="text-zinc-500 mb-1">
          Start: {feed.timeOffset}s
        </div>
        <input
          type="range"
          min="0"
          max="240"
          step="10"
          value={feed.timeOffset}
          onChange={(e) =>
            onChange({ ...feed, timeOffset: parseInt(e.target.value) })
          }
          className="w-full accent-current"
        />
      </div>
    </div>
  );
}

function SelectionScreen({
  recordings,
  onStart,
}: {
  recordings: RecordingMeta[];
  onStart: (leftId: string, rightId: string) => void;
}) {
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);

  const canStart = leftId && rightId;

  return (
    <div className="flex items-center justify-center min-h-screen px-6 py-12">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Two Brains Enter
          </h1>
          <p className="text-zinc-400 text-sm font-mono mb-4">
            Pick two neural recordings. They play Pong. You control what they see.
          </p>
          <p className="text-zinc-500 text-xs max-w-md mx-auto leading-relaxed">
            Each recording is from real human neurons grown on a chip — stem-cell-derived
            cortical cells firing electrical spikes on a 64-channel electrode array.
            Choose a monolayer (flat, organized) or organoid (3D, chaotic) for each side.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-blue-400 font-mono text-xs uppercase tracking-widest mb-3">
              Left Brain
            </div>
            <div className="space-y-2">
              {recordings.map((rec) => (
                <RecordingCard
                  key={rec.id}
                  rec={rec}
                  selected={leftId === rec.id}
                  onSelect={() => setLeftId(rec.id)}
                  side="left"
                />
              ))}
            </div>
          </div>
          <div>
            <div className="text-orange-400 font-mono text-xs uppercase tracking-widest mb-3">
              Right Brain
            </div>
            <div className="space-y-2">
              {recordings.map((rec) => (
                <RecordingCard
                  key={rec.id}
                  rec={rec}
                  selected={rightId === rec.id}
                  onSelect={() => setRightId(rec.id)}
                  side="right"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={() => canStart && onStart(leftId!, rightId!)}
            disabled={!canStart}
            className={`px-8 py-3 rounded-full font-mono text-sm transition-all ${
              canStart
                ? "bg-white/10 border border-white/20 text-white hover:bg-white/15"
                : "bg-white/[0.03] border border-white/[0.06] text-zinc-600 cursor-not-allowed"
            }`}
          >
            Start Match
          </button>
          <div>
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono text-xs"
            >
              &larr; back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayPage() {
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [phase, setPhase] = useState<"loading" | "select" | "playing" | "finished">("loading");
  const [match, setMatch] = useState<BrainMatch | null>(null);
  const [leftFeed, setLeftFeed] = useState<FeedConfig>({ ...DEFAULT_FEED });
  const [rightFeed, setRightFeed] = useState<FeedConfig>({ ...DEFAULT_FEED });
  const [latestTick, setLatestTick] = useState<TickResult | null>(null);
  const [leftMeta, setLeftMeta] = useState<RecordingMeta | null>(null);
  const [rightMeta, setRightMeta] = useState<RecordingMeta | null>(null);

  const tickRef = useRef<TickResult | null>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const uiCounter = useRef(0);

  useEffect(() => {
    loadIndex().then((recs) => {
      setRecordings(recs);
      setPhase("select");
    });
  }, []);

  const handleStart = useCallback(
    async (leftId: string, rightId: string) => {
      setPhase("loading");
      const [leftData, rightData] = await Promise.all([
        loadRecording(leftId),
        loadRecording(rightId),
      ]);
      setLeftMeta(leftData.meta);
      setRightMeta(rightData.meta);

      const m = new BrainMatch(leftData, rightData);

      m.on("tick", (tick) => {
        tickRef.current = tick;
        // Throttle React state to ~4/sec
        uiCounter.current++;
        if (uiCounter.current >= 5) {
          uiCounter.current = 0;
          setLatestTick(tick);
        }
      });

      m.on("finish", () => {
        setPhase("finished");
      });

      setMatch(m);
      setPhase("playing");
      m.start();
    },
    []
  );

  // Sync feed config changes to match
  useEffect(() => {
    if (match) match.leftFeed = leftFeed;
  }, [match, leftFeed]);

  useEffect(() => {
    if (match) match.rightFeed = rightFeed;
  }, [match, rightFeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { match?.stop(); };
  }, [match]);

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-500 font-mono text-sm animate-pulse">
          Loading neural recordings...
        </div>
      </div>
    );
  }

  if (phase === "select") {
    return <SelectionScreen recordings={recordings} onStart={handleStart} />;
  }

  const leftLabel = leftMeta ? `${leftMeta.type} (${leftMeta.id})` : "Left";
  const rightLabel = rightMeta ? `${rightMeta.type} (${rightMeta.id})` : "Right";

  const elapsed = match ? Math.floor(match.tickCount / 20) : 0;
  const remaining = GAME_DURATION_SEC - elapsed;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050508]">
      {/* 3D renderer */}
      <div className="absolute inset-0 z-0">
        <BrainMatchView tickRef={tickRef} scoreRef={scoreRef} />
      </div>

      {/* Score + timer */}
      <div className="absolute top-6 left-0 right-0 z-10 flex flex-col items-center pointer-events-none">
        <div className="flex items-center gap-6 mb-1">
          <span className="text-blue-400 font-mono text-xs uppercase tracking-widest">
            {leftMeta?.type ?? "left"}
          </span>
          <div
            ref={scoreRef}
            className="text-white font-mono text-2xl tracking-widest"
          >
            0 : 0
          </div>
          <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">
            {rightMeta?.type ?? "right"}
          </span>
        </div>
        <div className="text-zinc-600 font-mono text-xs">
          {remaining > 0 ? `${remaining}s` : "finished"}
        </div>
      </div>

      {/* Left feed controls */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-44">
        <FeedControls
          feed={leftFeed}
          onChange={setLeftFeed}
          side="left"
          label={leftLabel}
        />
        {latestTick && (
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 font-mono text-xs">
            <div className="text-zinc-500">
              Rate: {latestTick.leftAnalysis.meanRate} Hz
            </div>
            <div className="text-zinc-500">
              Spikes/tick: {latestTick.leftSpikes.length}
            </div>
          </div>
        )}
      </div>

      {/* Right feed controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-44">
        <FeedControls
          feed={rightFeed}
          onChange={setRightFeed}
          side="right"
          label={rightLabel}
        />
        {latestTick && (
          <div className="mt-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 font-mono text-xs">
            <div className="text-zinc-500">
              Rate: {latestTick.rightAnalysis.meanRate} Hz
            </div>
            <div className="text-zinc-500">
              Spikes/tick: {latestTick.rightSpikes.length}
            </div>
          </div>
        )}
      </div>

      {/* Back + play again */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-4">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-300 transition-colors font-mono text-xs"
        >
          &larr; back
        </Link>
        {phase === "finished" && (
          <button
            onClick={() => {
              match?.stop();
              setMatch(null);
              setLatestTick(null);
              tickRef.current = null;
              setPhase("select");
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors font-mono text-xs"
          >
            new match &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
