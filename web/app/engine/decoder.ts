import { CHANNEL_TO_POS, GRID_SIZE, PADDLE_SPEED, TICKS_PER_SECOND } from "./config";
import type { FeedConfig, SpikeEvent } from "./types";

const DISRUPTION_TICKS = Math.floor(TICKS_PER_SECOND * 1.0); // 1 second of noise after a miss

/**
 * Decodes spike populations into paddle movement direction.
 * Supports spatial filtering, gain controls, and punishment disruption.
 *
 * Punishment model (inspired by DishBrain Free Energy Principle):
 *   Hit  → organized decode continues normally
 *   Miss → decoder is disrupted for 1 second: smoothing is broken,
 *          random noise is injected, simulating chaotic stimulation
 */
export class SpikeDecoder {
  private smoothed = 0;
  private disruptionRemaining = 0;

  /** Signal a miss — disrupts decoding for ~1 second. */
  punish(): void {
    this.disruptionRemaining = DISRUPTION_TICKS;
  }

  decode(spikes: SpikeEvent[], feed: FeedConfig): number {
    // During disruption: inject random noise, break smoothing
    if (this.disruptionRemaining > 0) {
      this.disruptionRemaining--;
      // Random jitter that decays as disruption wears off
      const intensity = this.disruptionRemaining / DISRUPTION_TICKS;
      this.smoothed = (Math.random() - 0.5) * 2 * intensity;
      return Math.max(-1, Math.min(1, this.smoothed)) * PADDLE_SPEED;
    }

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
      this.smoothed *= 0.95;
    }

    return Math.max(-1, Math.min(1, this.smoothed * feed.gain)) * PADDLE_SPEED;
  }

  get disrupted(): boolean {
    return this.disruptionRemaining > 0;
  }

  reset(): void {
    this.smoothed = 0;
    this.disruptionRemaining = 0;
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
