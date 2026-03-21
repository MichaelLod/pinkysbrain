"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface GameState {
  ball_x: number;
  ball_y: number;
  ball_vx: number;
  ball_vy: number;
  player_paddle_y: number;
  neural_paddle_y: number;
  player_score: number;
  neural_score: number;
}

export interface SpikeEvent {
  ch: number;
  ts: number;
}

export interface AnalysisData {
  channels: Record<string, number>;
  mean_rate: number;
  spike_count: number;
}

export interface TickMessage {
  type: "tick";
  game: GameState;
  spikes: SpikeEvent[];
  stims: SpikeEvent[];
  analysis: AnalysisData;
  neural_direction: number;
}

export function useNeuralSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  // State for UI components that don't need 60fps (analysis overlay, score)
  const [latestTick, setLatestTick] = useState<TickMessage | null>(null);
  // Ref for the rAF render loop — bypasses React entirely
  const tickRef = useRef<TickMessage | null>(null);
  const prevTickRef = useRef<TickMessage | null>(null);
  const tickTimeRef = useRef(0);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;
    let uiUpdateCounter = 0;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as TickMessage;
      if (msg.type === "tick") {
        // Update refs immediately (for rAF loop, no React overhead)
        prevTickRef.current = tickRef.current;
        tickRef.current = msg;
        tickTimeRef.current = performance.now();
        // Throttle React state updates to ~4/sec (every 5th tick)
        uiUpdateCounter++;
        if (uiUpdateCounter >= 5) {
          uiUpdateCounter = 0;
          setLatestTick(msg);
        }
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [url]);

  const sendPlayerInput = useCallback((y: number) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "input", y }));
    }
  }, []);

  return {
    connected,
    latestTick,
    tickRef,
    prevTickRef,
    tickTimeRef,
    sendPlayerInput,
  };
}
