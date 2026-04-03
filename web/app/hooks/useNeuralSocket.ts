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

export interface RecordingMetadata {
  id: string;
  type: "monolayer" | "organoid" | "unknown";
  duration_sec: number;
  spike_count: number;
  sampling_freq: number;
  channels: number;
}

export interface GameOverMessage {
  type: "game_over";
  final_game: GameState;
}

export function useNeuralSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<RecordingMetadata | null>(null);
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
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
    ws.onclose = () => {
      setConnected(false);
      setGameActive(false);
    };
    ws.onerror = () => {
      setConnected(false);
      setGameActive(false);
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "recordings_available") {
        setRecordings(msg.recordings);
      } else if (msg.type === "tick") {
        setGameActive(true);
        // Update refs immediately (for rAF loop, no React overhead)
        prevTickRef.current = tickRef.current;
        tickRef.current = msg as TickMessage;
        tickTimeRef.current = performance.now();
        // Throttle React state updates to ~4/sec (every 5th tick)
        uiUpdateCounter++;
        if (uiUpdateCounter >= 5) {
          uiUpdateCounter = 0;
          setLatestTick(msg as TickMessage);
        }
      } else if (msg.type === "game_over") {
        setGameActive(false);
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

  const selectRecording = useCallback((recordingId: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      const rec = recordings.find(r => r.id === recordingId);
      if (rec) {
        setCurrentRecording(rec);
        ws.send(JSON.stringify({ type: "select_recording", recording_id: recordingId }));
      }
    }
  }, [recordings]);

  return {
    connected,
    gameActive,
    latestTick,
    tickRef,
    prevTickRef,
    tickTimeRef,
    sendPlayerInput,
    recordings,
    currentRecording,
    selectRecording,
  };
}
