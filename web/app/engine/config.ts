// MEA grid layout — matches Cortical Labs CL SDK 8x8 MEA
export const GRID_SIZE = 8;
export const GROUND_CHANNELS = new Set([0, 7, 56, 63]);
export const REF_CHANNEL = 4;
export const EXCLUDED_CHANNELS = new Set([...GROUND_CHANNELS, REF_CHANNEL]);

// Column-major: channel = row + col * GRID_SIZE
export const ACTIVE_CHANNELS: number[] = [];
export const CHANNEL_TO_POS = new Map<number, [number, number]>();

for (let ch = 0; ch < GRID_SIZE * GRID_SIZE; ch++) {
  if (!EXCLUDED_CHANNELS.has(ch)) {
    ACTIVE_CHANNELS.push(ch);
    CHANNEL_TO_POS.set(ch, [ch % GRID_SIZE, Math.floor(ch / GRID_SIZE)]);
  }
}

// Game settings
export const TICKS_PER_SECOND = 20;
export const TICK_DURATION_MS = 1000 / TICKS_PER_SECOND;
export const GAME_DURATION_SEC = 90;

// Paddle / ball
export const PADDLE_HEIGHT = 0.15;
export const PADDLE_SPEED = 0.04;
export const BALL_SPEED = 0.015;
