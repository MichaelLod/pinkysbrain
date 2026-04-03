export interface RecordingMeta {
  id: string;
  type: "monolayer" | "organoid";
  duration_sec: number;
  duration_frames: number;
  sampling_freq: number;
  channels: number;
  spike_count: number;
}

export interface RecordingData {
  meta: RecordingMeta;
  spikes: [number, number][]; // [timestamp, channel][]
}

export interface SpikeEvent {
  channel: number;
  timestamp: number;
}

export interface GameState {
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  leftPaddleY: number;
  rightPaddleY: number;
  leftScore: number;
  rightScore: number;
}

export interface TickResult {
  game: GameState;
  leftSpikes: SpikeEvent[];
  rightSpikes: SpikeEvent[];
  leftStimChannels: number[];
  rightStimChannels: number[];
  leftAnalysis: AnalysisResult;
  rightAnalysis: AnalysisResult;
  leftDirection: number;
  rightDirection: number;
}

export interface AnalysisResult {
  channels: Map<number, number>; // channel → firing rate Hz
  meanRate: number;
  spikeCount: number;
}

// Feed controls the user can adjust per side
export interface FeedConfig {
  // Which spatial region of the MEA drives the decoder
  spatialFilter: "full" | "top" | "bottom" | "left" | "right" | "center" | "edges";
  // Decoder gain multiplier (0.5 to 3.0)
  gain: number;
  // Time offset in seconds — which segment of the recording to replay from
  timeOffset: number;
}
