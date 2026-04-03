import { TICKS_PER_SECOND } from "./config";
import type { AnalysisResult, SpikeEvent } from "./types";

/**
 * Tracks per-channel firing rates over a sliding window.
 */
export class FiringRateTracker {
  private windowSize: number;
  private history: Map<number, number>[] = [];

  constructor(windowSec = 1.0) {
    this.windowSize = Math.floor(windowSec * TICKS_PER_SECOND);
  }

  update(spikes: SpikeEvent[]): void {
    const counts = new Map<number, number>();
    for (const spike of spikes) {
      counts.set(spike.channel, (counts.get(spike.channel) ?? 0) + 1);
    }
    this.history.push(counts);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }
  }

  getRates(): AnalysisResult {
    if (this.history.length === 0) {
      return { channels: new Map(), meanRate: 0, spikeCount: 0 };
    }

    const totals = new Map<number, number>();
    for (const counts of this.history) {
      for (const [ch, count] of counts) {
        totals.set(ch, (totals.get(ch) ?? 0) + count);
      }
    }

    const duration = this.history.length / TICKS_PER_SECOND;
    const channels = new Map<number, number>();
    let sum = 0;
    let totalSpikes = 0;

    for (const [ch, count] of totals) {
      const rate = Math.round((count / duration) * 10) / 10;
      channels.set(ch, rate);
      sum += rate;
      totalSpikes += count;
    }

    const meanRate =
      channels.size > 0
        ? Math.round((sum / channels.size) * 10) / 10
        : 0;

    return { channels, meanRate, spikeCount: totalSpikes };
  }

  reset(): void {
    this.history = [];
  }
}
