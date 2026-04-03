import type { RecordingData, SpikeEvent } from "./types";

/**
 * Replays spike data from a loaded recording, yielding spikes per tick.
 * Loops back to the start when the recording ends.
 */
export class SpikeReplay {
  private spikes: [number, number][];
  private samplingFreq: number;
  private totalFrames: number;
  private samplesPerTick: number;
  private tickIndex = 0;

  // Binary search indices for fast spike lookup
  private timestamps: Int32Array;

  constructor(recording: RecordingData, ticksPerSecond: number) {
    this.spikes = recording.spikes;
    this.samplingFreq = recording.meta.sampling_freq;
    this.totalFrames = recording.meta.duration_frames;
    this.samplesPerTick = Math.floor(this.samplingFreq / ticksPerSecond);

    // Pre-extract timestamps into typed array for fast binary search
    this.timestamps = new Int32Array(this.spikes.length);
    for (let i = 0; i < this.spikes.length; i++) {
      this.timestamps[i] = this.spikes[i][0];
    }
  }

  /** Reset to a specific time offset in seconds. */
  setTimeOffset(seconds: number): void {
    const frame = Math.floor(seconds * this.samplingFreq);
    this.tickIndex = Math.floor(frame / this.samplesPerTick);
  }

  /** Get spikes for the current tick and advance. */
  nextTick(): SpikeEvent[] {
    const sampleStart = (this.tickIndex * this.samplesPerTick) % this.totalFrames;
    const sampleEnd = sampleStart + this.samplesPerTick;

    let events: SpikeEvent[];

    if (sampleEnd <= this.totalFrames) {
      const lo = this.lowerBound(sampleStart);
      const hi = this.lowerBound(sampleEnd);
      events = this.extractRange(lo, hi);
    } else {
      // Wrap around
      const wrap = sampleEnd % this.totalFrames;
      const lo1 = this.lowerBound(sampleStart);
      const lo2 = this.lowerBound(wrap);
      events = [
        ...this.extractRange(lo1, this.timestamps.length),
        ...this.extractRange(0, lo2),
      ];
    }

    this.tickIndex++;
    return events;
  }

  private extractRange(lo: number, hi: number): SpikeEvent[] {
    const result: SpikeEvent[] = [];
    for (let i = lo; i < hi; i++) {
      result.push({
        timestamp: this.spikes[i][0],
        channel: this.spikes[i][1],
      });
    }
    return result;
  }

  /** Binary search: first index where timestamps[i] >= target. */
  private lowerBound(target: number): number {
    let lo = 0;
    let hi = this.timestamps.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.timestamps[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
