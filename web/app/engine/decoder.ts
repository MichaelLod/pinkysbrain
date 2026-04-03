import { CHANNEL_TO_POS, GRID_SIZE, PADDLE_SPEED } from "./config";
import type { FeedConfig, SpikeEvent } from "./types";

/**
 * Decodes spike populations into paddle movement direction.
 * Supports spatial filtering and gain controls for the "feed" mechanic.
 */
export class SpikeDecoder {
  private smoothed = 0;

  decode(spikes: SpikeEvent[], feed: FeedConfig): number {
    let upCount = 0;
    let downCount = 0;
    const mid = GRID_SIZE / 2;

    for (const spike of spikes) {
      const pos = CHANNEL_TO_POS.get(spike.channel);
      if (!pos) continue;

      const [row, col] = pos;

      // Apply spatial filter — skip channels outside the selected region
      if (!passesFilter(row, col, feed.spatialFilter)) continue;

      if (row < mid) upCount++;
      else downCount++;
    }

    const total = upCount + downCount;
    if (total > 0) {
      const raw = (downCount - upCount) / total;
      this.smoothed = this.smoothed * 0.6 + raw * 0.4;
    } else {
      // Slow decay when no spikes — keeps sparse recordings responsive
      this.smoothed *= 0.95;
    }

    return Math.max(-1, Math.min(1, this.smoothed * feed.gain)) * PADDLE_SPEED;
  }

  reset(): void {
    this.smoothed = 0;
  }
}

function passesFilter(row: number, col: number, filter: FeedConfig["spatialFilter"]): boolean {
  const mid = GRID_SIZE / 2;
  switch (filter) {
    case "full":
      return true;
    case "top":
      return row < mid;
    case "bottom":
      return row >= mid;
    case "left":
      return col < mid;
    case "right":
      return col >= mid;
    case "center":
      return row >= 2 && row < 6 && col >= 2 && col < 6;
    case "edges":
      return row < 2 || row >= 6 || col < 2 || col >= 6;
  }
}
