"""Extract spike events from HDF5 recordings into compact JSON for client-side replay.

Outputs only (timestamp, channel) pairs and metadata — no raw voltage traces.
"""

import json
import sys
from pathlib import Path

import h5py
import numpy as np

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUT_DIR = Path(__file__).resolve().parent.parent / "web" / "public" / "recordings"


def extract(h5_path: Path) -> dict:
    with h5py.File(h5_path, "r") as h:
        sampling_freq = int(h.attrs["sampling_frequency"])
        duration_frames = int(h.attrs["duration_frames"])
        channel_count = int(h.attrs["channel_count"])
        duration_sec = duration_frames / sampling_freq

        timestamps = h["spikes"]["timestamp"][:].astype(int)
        channels = h["spikes"]["channel"][:].astype(int)

        # Sort by timestamp
        order = np.argsort(timestamps)
        timestamps = timestamps[order]
        channels = channels[order]

        name = h5_path.stem
        rec_type = "organoid" if "organoid" in name else "monolayer"

        return {
            "meta": {
                "id": name,
                "type": rec_type,
                "duration_sec": round(duration_sec, 1),
                "duration_frames": duration_frames,
                "sampling_freq": sampling_freq,
                "channels": channel_count,
                "spike_count": len(timestamps),
            },
            # Compact: array of [timestamp, channel] pairs
            "spikes": list(zip(timestamps.tolist(), channels.tolist())),
        }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    h5_files = sorted(DATA_DIR.glob("*.h5"))
    if not h5_files:
        print(f"No .h5 files found in {DATA_DIR}", file=sys.stderr)
        sys.exit(1)

    index = []

    for h5_path in h5_files:
        print(f"Extracting {h5_path.name}...")
        data = extract(h5_path)
        meta = data["meta"]

        out_path = OUT_DIR / f"{meta['id']}.json"
        with open(out_path, "w") as f:
            json.dump(data, f, separators=(",", ":"))

        size_kb = out_path.stat().st_size / 1024
        print(f"  → {out_path.name}: {meta['spike_count']} spikes, {size_kb:.0f} KB")

        index.append(meta)

    # Write index file (metadata only, no spikes)
    index_path = OUT_DIR / "index.json"
    with open(index_path, "w") as f:
        json.dump(index, f, indent=2)

    print(f"\nDone. {len(h5_files)} recordings extracted to {OUT_DIR}")
    print(f"Index: {index_path}")


if __name__ == "__main__":
    main()
