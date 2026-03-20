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

export default function PongCanvas({ gameState, onPlayerInput }: PongCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const y = (e.clientY - rect.top) / rect.height;
      onPlayerInput(Math.max(0, Math.min(1, y)));
    },
    [onPlayerInput]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const y = (e.touches[0].clientY - rect.top) / rect.height;
      onPlayerInput(Math.max(0, Math.min(1, y)));
    },
    [onPlayerInput]
  );

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
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

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
      `YOU ${gameState.player_score} : ${gameState.neural_score} NEURONS`,
      w / 2,
      Math.max(24, h * 0.06)
    );

    // Player paddle (left)
    const pw = PADDLE_WIDTH * w;
    const ph = PADDLE_HEIGHT * h;
    const px = w * 0.03;
    const py = gameState.player_paddle_y * h - ph / 2;
    ctx.fillStyle = "rgba(100, 180, 255, 0.8)";
    ctx.shadowColor = "rgba(100, 180, 255, 0.4)";
    ctx.shadowBlur = 10;
    ctx.fillRect(px, py, pw, ph);

    // Neural paddle (right)
    const nx = w * 0.97 - pw;
    const ny = gameState.neural_paddle_y * h - ph / 2;
    ctx.fillStyle = "rgba(255, 140, 60, 0.8)";
    ctx.shadowColor = "rgba(255, 140, 60, 0.4)";
    ctx.shadowBlur = 10;
    ctx.fillRect(nx, ny, pw, ph);

    // Ball
    const bx = gameState.ball_x * w;
    const by = gameState.ball_y * h;
    const br = BALL_RADIUS * w;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(220, 230, 255, 0.9)";
    ctx.shadowColor = "rgba(180, 200, 255, 0.6)";
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  }, [gameState]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      />
    </div>
  );
}
