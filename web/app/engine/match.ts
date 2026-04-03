import { TICKS_PER_SECOND, GAME_DURATION_SEC } from "./config";
import { FiringRateTracker } from "./analysis";
import { SpikeDecoder } from "./decoder";
import { computeStimChannels } from "./encoder";
import { PongGame } from "./game";
import { SpikeReplay } from "./replay";
import type { FeedConfig, RecordingData, TickResult } from "./types";

export type MatchState = "idle" | "running" | "finished";

export const DEFAULT_FEED: FeedConfig = {
  spatialFilter: "full",
  gain: 1.0,
  timeOffset: 0,
};

/**
 * Runs a two-brain Pong match entirely client-side.
 * Two recordings compete; the user controls feed parameters for each side.
 */
export class BrainMatch {
  private game: PongGame;
  private leftReplay: SpikeReplay;
  private rightReplay: SpikeReplay;
  private leftDecoder = new SpikeDecoder();
  private rightDecoder = new SpikeDecoder();
  private leftAnalysis = new FiringRateTracker();
  private rightAnalysis = new FiringRateTracker();

  leftFeed: FeedConfig = { ...DEFAULT_FEED };
  rightFeed: FeedConfig = { ...DEFAULT_FEED };

  state: MatchState = "idle";
  tickCount = 0;
  totalTicks: number;

  // Latest tick result for rendering
  lastTick: TickResult | null = null;

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onTick: ((tick: TickResult) => void) | null = null;
  private onFinish: ((game: TickResult) => void) | null = null;

  constructor(
    public leftRecording: RecordingData,
    public rightRecording: RecordingData,
  ) {
    this.game = new PongGame();
    this.leftReplay = new SpikeReplay(leftRecording, TICKS_PER_SECOND);
    this.rightReplay = new SpikeReplay(rightRecording, TICKS_PER_SECOND);
    this.totalTicks = GAME_DURATION_SEC * TICKS_PER_SECOND;
  }

  /** Set callbacks. */
  on(event: "tick", cb: (tick: TickResult) => void): this;
  on(event: "finish", cb: (tick: TickResult) => void): this;
  on(event: string, cb: (tick: TickResult) => void): this {
    if (event === "tick") this.onTick = cb;
    if (event === "finish") this.onFinish = cb;
    return this;
  }

  /** Start the match. Game loop runs at TICKS_PER_SECOND via setInterval. */
  start(): void {
    if (this.state === "running") return;
    this.state = "running";

    // Apply initial time offsets
    this.leftReplay.setTimeOffset(this.leftFeed.timeOffset);
    this.rightReplay.setTimeOffset(this.rightFeed.timeOffset);

    this.intervalId = setInterval(() => this.step(), 1000 / TICKS_PER_SECOND);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.state = "finished";
  }

  private step(): void {
    if (this.tickCount >= this.totalTicks) {
      this.stop();
      if (this.lastTick && this.onFinish) this.onFinish(this.lastTick);
      return;
    }

    // Get spikes for this tick
    const leftSpikes = this.leftReplay.nextTick();
    const rightSpikes = this.rightReplay.nextTick();

    // Decode spikes → paddle direction
    const leftDirection = this.leftDecoder.decode(leftSpikes, this.leftFeed);
    const rightDirection = this.rightDecoder.decode(rightSpikes, this.rightFeed);

    // Update game state
    this.game.update(leftDirection, rightDirection);

    // Compute stim channels for visualization
    const leftStimChannels = computeStimChannels(this.game.state.ballX, this.game.state.ballY);
    const rightStimChannels = computeStimChannels(this.game.state.ballX, this.game.state.ballY);

    // Update analysis
    this.leftAnalysis.update(leftSpikes);
    this.rightAnalysis.update(rightSpikes);

    const tick: TickResult = {
      game: { ...this.game.state },
      leftSpikes,
      rightSpikes,
      leftStimChannels,
      rightStimChannels,
      leftAnalysis: this.leftAnalysis.getRates(),
      rightAnalysis: this.rightAnalysis.getRates(),
      leftDirection,
      rightDirection,
    };

    this.lastTick = tick;
    this.tickCount++;

    if (this.onTick) this.onTick(tick);
  }
}
