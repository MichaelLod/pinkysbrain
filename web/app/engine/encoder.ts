import { ACTIVE_CHANNELS, CHANNEL_TO_POS, GRID_SIZE } from "./config";

/**
 * Compute organized stim channels — ball position maps to nearby electrodes.
 * This is the "reward" signal: predictable, structured input.
 */
export function computeStimChannels(ballX: number, ballY: number): number[] {
  const targetRow = Math.floor(ballY * (GRID_SIZE - 1));
  const targetCol = Math.floor(ballX * (GRID_SIZE - 1));

  const channels: number[] = [];
  for (const ch of ACTIVE_CHANNELS) {
    const pos = CHANNEL_TO_POS.get(ch)!;
    const dist = Math.abs(pos[0] - targetRow) + Math.abs(pos[1] - targetCol);
    if (dist <= 2) channels.push(ch);
  }
  return channels;
}

/**
 * Compute chaotic stim channels — random subset of electrodes.
 * This is the "punishment" signal: unpredictable noise,
 * inspired by DishBrain's Free Energy Principle approach.
 */
export function computeChaoticStimChannels(): number[] {
  const count = 5 + Math.floor(Math.random() * 10);
  const shuffled = [...ACTIVE_CHANNELS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
