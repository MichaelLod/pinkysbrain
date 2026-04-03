import { ACTIVE_CHANNELS, CHANNEL_TO_POS, GRID_SIZE } from "./config";

/**
 * Compute which MEA channels would be stimulated for a given ball position.
 * Used purely for visualization — no real stim in client-side mode.
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
