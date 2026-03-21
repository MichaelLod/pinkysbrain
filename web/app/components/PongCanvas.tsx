"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GameState } from "../hooks/useNeuralSocket";

interface PongCanvasProps {
  gameState: GameState | null;
  onPlayerInput: (y: number) => void;
}

const PADDLE_WIDTH = 0.015;
const PADDLE_HEIGHT = 0.15;
const BALL_RADIUS = 0.01;
const TICK_MS = 50; // server sends at 20 ticks/sec

export default function PongCanvas({ gameState, onPlayerInput }: PongCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const prevStateRef = useRef<GameState | null>(null);
  const lastTickTime = useRef(0);

  useEffect(() => {
    if (gameState) {
      prevStateRef.current = stateRef.current;
      stateRef.current = gameState;
      lastTickTime.current = performance.now();
    }
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Track mouse globally so paddle follows even outside canvas
    const handleGlobalMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const y = (e.clientY - rect.top) / rect.height;
      onPlayerInput(Math.max(0, Math.min(1, y)));
    };
    const handleGlobalTouch = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const y = (e.touches[0].clientY - rect.top) / rect.height;
      onPlayerInput(Math.max(0, Math.min(1, y)));
    };
    window.addEventListener("mousemove", handleGlobalMouse);
    window.addEventListener("touchmove", handleGlobalTouch);

    let animId: number;

    function render() {
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;

      const state = stateRef.current;
      if (!state) {
        animId = requestAnimationFrame(render);
        return;
      }

      const w = canvas!.width;
      const h = canvas!.height;

      // Interpolate ball position using velocity
      const elapsed = performance.now() - lastTickTime.current;
      const t = Math.min(elapsed / TICK_MS, 2); // clamp to avoid overshoot
      const ballX = state.ball_x + state.ball_vx * t;
      const ballY = state.ball_y + state.ball_vy * t;

      // Smooth paddle positions (lerp toward target)
      const prev = prevStateRef.current;
      const lerpT = Math.min(elapsed / TICK_MS, 1);
      const neuralPaddleY = prev
        ? prev.neural_paddle_y + (state.neural_paddle_y - prev.neural_paddle_y) * lerpT
        : state.neural_paddle_y;
      const playerPaddleY = prev
        ? prev.player_paddle_y + (state.player_paddle_y - prev.player_paddle_y) * lerpT
        : state.player_paddle_y;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = "rgba(5, 5, 8, 0.85)";
      ctx.fillRect(0, 0, w, h);

      // Center line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "rgba(100, 140, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Score
      ctx.fillStyle = "rgba(200, 210, 255, 0.6)";
      ctx.font = `${Math.max(16, w * 0.04)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(
        `YOU ${state.player_score} : ${state.neural_score} NEURONS`,
        w / 2,
        Math.max(24, h * 0.06)
      );

      // Player paddle (left)
      const pw = PADDLE_WIDTH * w;
      const ph = PADDLE_HEIGHT * h;
      const px = w * 0.03;
      const py = playerPaddleY * h - ph / 2;
      ctx.fillStyle = "rgba(100, 180, 255, 0.8)";
      ctx.shadowColor = "rgba(100, 180, 255, 0.4)";
      ctx.shadowBlur = 10;
      ctx.fillRect(px, py, pw, ph);

      // Neural paddle (right)
      const nx = w * 0.97 - pw;
      const ny = neuralPaddleY * h - ph / 2;
      ctx.fillStyle = "rgba(255, 140, 60, 0.8)";
      ctx.shadowColor = "rgba(255, 140, 60, 0.4)";
      ctx.shadowBlur = 10;
      ctx.fillRect(nx, ny, pw, ph);

      // Ball
      const bx = Math.max(0, Math.min(1, ballX)) * w;
      const by = Math.max(0, Math.min(1, ballY)) * h;
      const br = BALL_RADIUS * w;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220, 230, 255, 0.9)";
      ctx.shadowColor = "rgba(180, 200, 255, 0.6)";
      ctx.shadowBlur = 15;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleGlobalMouse);
      window.removeEventListener("touchmove", handleGlobalTouch);
      cancelAnimationFrame(animId);
    };
  }, [onPlayerInput]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-none"
      />
    </div>
  );
}
