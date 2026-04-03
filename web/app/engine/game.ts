import { BALL_SPEED, PADDLE_HEIGHT } from "./config";
import type { GameState } from "./types";

/**
 * Pong state machine. Both paddles are neural-driven in two-brain mode.
 */
export class PongGame {
  state: GameState;

  constructor() {
    this.state = {
      ballX: 0.5,
      ballY: 0.5,
      ballVx: BALL_SPEED,
      ballVy: BALL_SPEED * (Math.random() - 0.5) * 2,
      leftPaddleY: 0.5,
      rightPaddleY: 0.5,
      leftScore: 0,
      rightScore: 0,
    };
  }

  update(leftDirection: number, rightDirection: number): void {
    const s = this.state;
    const half = PADDLE_HEIGHT / 2;

    // Move paddles
    s.leftPaddleY = clamp(s.leftPaddleY + leftDirection, half, 1 - half);
    s.rightPaddleY = clamp(s.rightPaddleY + rightDirection, half, 1 - half);

    // Move ball
    s.ballX += s.ballVx;
    s.ballY += s.ballVy;

    // Wall bounce (top/bottom)
    if (s.ballY <= 0 || s.ballY >= 1) {
      s.ballVy *= -1;
      s.ballY = clamp(s.ballY, 0, 1);
    }

    // Left paddle (x ~ 0.05)
    if (s.ballX <= 0.07 && s.ballVx < 0) {
      if (Math.abs(s.ballY - s.leftPaddleY) < half) {
        s.ballVx *= -1;
        const offset = (s.ballY - s.leftPaddleY) / half;
        s.ballVy = offset * BALL_SPEED;
      } else if (s.ballX <= 0) {
        s.rightScore++;
        this.resetBall(1);
      }
    }

    // Right paddle (x ~ 0.95)
    if (s.ballX >= 0.93 && s.ballVx > 0) {
      if (Math.abs(s.ballY - s.rightPaddleY) < half) {
        s.ballVx *= -1;
        const offset = (s.ballY - s.rightPaddleY) / half;
        s.ballVy = offset * BALL_SPEED;
      } else if (s.ballX >= 1) {
        s.leftScore++;
        this.resetBall(-1);
      }
    }
  }

  private resetBall(direction: number): void {
    this.state.ballX = 0.5;
    this.state.ballY = 0.5;
    this.state.ballVx = BALL_SPEED * direction;
    this.state.ballVy = BALL_SPEED * (Math.random() - 0.5) * 2;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
