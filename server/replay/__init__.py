from __future__ import annotations

import logging
import random
import time
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path

import h5py
import numpy as np

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


@dataclass(slots=True)
class SpikeEvent:
    channel: int
    timestamp: int


@dataclass(slots=True)
class StimEvent:
    channel: int
    timestamp: int


@dataclass(slots=True)
class TickAnalysis:
    spikes: list[SpikeEvent]
    stims: list[StimEvent]


@dataclass(slots=True)
class Tick:
    analysis: TickAnalysis


class ReplayNeurons:
    """Drop-in replacement for cl.Neurons using pre-recorded HDF5 data."""

    def __init__(self, h5_path: str) -> None:
        self._h5 = h5py.File(h5_path, "r")
        self._sampling_freq = int(self._h5.attrs["sampling_frequency"])
        self._total_samples = int(self._h5.attrs["duration_frames"])
        self._spike_timestamps: np.ndarray = self._h5["spikes"]["timestamp"][:]
        self._spike_channels: np.ndarray = self._h5["spikes"]["channel"][:]
        self._name = Path(h5_path).stem
        logger.info(
            "Loaded %s: %d spikes, %ds @ %d Hz",
            self._name,
            len(self._spike_timestamps),
            self._total_samples // self._sampling_freq,
            self._sampling_freq,
        )

    def loop(
        self, ticks_per_second: int = 20, stop_after_seconds: int = 60
    ):
        samples_per_tick = self._sampling_freq // ticks_per_second
        total_ticks = stop_after_seconds * ticks_per_second
        tick_duration = 1.0 / ticks_per_second

        for tick_idx in range(total_ticks):
            t0 = time.monotonic()

            sample_start = (tick_idx * samples_per_tick) % self._total_samples
            sample_end = sample_start + samples_per_tick

            if sample_end <= self._total_samples:
                mask = (self._spike_timestamps >= sample_start) & (
                    self._spike_timestamps < sample_end
                )
            else:
                wrap = sample_end % self._total_samples
                mask = (self._spike_timestamps >= sample_start) | (
                    self._spike_timestamps < wrap
                )

            channels = self._spike_channels[mask]
            timestamps = self._spike_timestamps[mask]

            spikes = [
                SpikeEvent(channel=int(ch), timestamp=int(ts))
                for ch, ts in zip(channels, timestamps)
            ]

            yield Tick(analysis=TickAnalysis(spikes=spikes, stims=[]))

            elapsed = time.monotonic() - t0
            remaining = tick_duration - elapsed
            if remaining > 0:
                time.sleep(remaining)

    def stim(self, *args, **kwargs) -> None:
        pass

    def close(self) -> None:
        self._h5.close()


@contextmanager
def open_replay(h5_path: str | None = None):
    if h5_path is None:
        h5_path = pick_recording()
    neurons = ReplayNeurons(h5_path)
    try:
        yield neurons
    finally:
        neurons.close()


def pick_recording() -> str:
    recordings = list(DATA_DIR.glob("*.h5"))
    if not recordings:
        raise FileNotFoundError(f"No .h5 recordings found in {DATA_DIR}")
    return str(random.choice(recordings))


def list_recordings() -> list[dict]:
    results = []
    for path in sorted(DATA_DIR.glob("*.h5")):
        with h5py.File(path, "r") as h:
            created = h.attrs.get("created_utc", "unknown")
            if isinstance(created, bytes):
                created = created.decode()
            results.append({
                "filename": path.name,
                "path": str(path),
                "channels": int(h.attrs["channel_count"]),
                "duration_sec": float(h.attrs["duration_seconds"]),
                "sampling_freq": int(h.attrs["sampling_frequency"]),
                "spike_count": h["spikes"].shape[0],
                "created": str(created),
            })
    return results
