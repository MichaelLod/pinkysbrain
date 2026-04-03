# pinkysbrain

**Two lab-grown brains. One game of Pong. You decide who wins.**

[pinkysbrain.xyz](https://pinkysbrain.xyz)

Pick two neural recordings from real human neurons, tune what each brain "sees," and watch them compete at Pong. Every spike is from real biology — no simulation.

---

## What Are These Neurons?

The recordings come from [Cortical Labs](https://corticallabs.com)' CL1 biological computing platform.

Human **induced pluripotent stem cells** (iPSCs) are differentiated into cortical neurons — the same cell type that makes up your cerebral cortex. These neurons are cultured on a **multi-electrode array** (MEA): a chip with 64 electrodes arranged in an 8x8 grid. Over weeks, the cells form synaptic connections and begin firing **action potentials** (spikes) — the same electrical signals that carry information in a biological brain.

The MEA records this activity at **25,000 samples per second** across all 64 channels simultaneously.

### Two Types of Cultures

| Type | Structure | Behavior |
|------|-----------|----------|
| **Monolayer** | Flat sheet of neurons grown directly on the electrode surface | Sparser firing, more spatially organized patterns |
| **Organoid** | 3D cluster of neurons with layered structure resembling cortical tissue | Dense, chaotic activity with complex burst dynamics |

The platform includes 5 recordings: 3 monolayer and 2 organoid, each 5 minutes long.

### Why This Resembles a Brain

These are **real human cells** exhibiting the same fundamental properties as neurons in your brain:

- **Action potentials** — all-or-nothing electrical spikes, the universal signaling mechanism of neurons
- **Synaptic networks** — the cells form excitatory and inhibitory connections, self-organizing into functional circuits
- **Spontaneous activity** — the cultures fire without external input, producing bursts and oscillations also observed in developing cortical tissue
- **Population dynamics** — groups of neurons fire together in coordinated waves, just as neural populations do in vivo

The key differences: much smaller scale (~800,000 cells vs ~86 billion in a full brain), no sensory input, no vascular system, and no large-scale architecture. But at the cellular level, the biophysics is the same.

## How It Works

Everything runs **client-side in the browser**. No backend server needed during gameplay.

```
1. Browser loads spike data (compact JSON, ~1-2 MB per recording)
2. You pick two recordings — one for each paddle
3. Game loop runs at 20Hz in JavaScript:
   - Read spikes for this tick from each recording
   - Decode spike patterns → paddle direction (per your feed settings)
   - Update Pong physics
   - Compute stim channels for visualization
4. Three.js renders two brains + Pong at 60fps
```

### The Feed Controls

You don't move a paddle — both paddles are driven by neural recordings. Instead, you act as a **trainer**: adjusting how each brain's signals are interpreted.

| Control | What It Does |
|---------|-------------|
| **Region** | Which part of the 8x8 electrode array drives the decoder (full, top, bottom, center, edges, etc.) |
| **Gain** | Decoder sensitivity (0.5x to 3.0x) — higher gain = more responsive but more erratic |
| **Start Time** | Which segment of the 5-minute recording to replay from — different windows have different activity patterns |

### Decoding: Spikes to Paddle

The decoder divides the MEA grid into upper and lower halves. Spikes from upper channels vote "up," lower channels vote "down." The ratio is smoothed exponentially and scaled by your gain setting. Your spatial filter changes which channels participate — feeding "top half" to one side means only upper electrodes drive that paddle.

### Visualization

Three.js renders 59 electrodes per brain as a curved 3D surface. Spike activity drives blue glow (left brain) or orange glow (right brain). Stimulation channels (computed from ball position) light up to show what each brain would "see" in a live experiment. Pong renders as a 2D overlay between the two brains.

## Architecture

```
web/
├── app/
│   ├── engine/              # Client-side game engine (TypeScript)
│   │   ├── match.ts         # BrainMatch: orchestrates two recordings
│   │   ├── replay.ts        # SpikeReplay: reads spike JSON, yields per-tick
│   │   ├── decoder.ts       # Spike population → paddle direction + spatial filter
│   │   ├── encoder.ts       # Ball position → stim channels (visualization only)
│   │   ├── game.ts          # Pong physics
│   │   ├── analysis.ts      # Firing rate tracker
│   │   ├── config.ts        # MEA layout, game parameters
│   │   └── types.ts         # Shared types
│   ├── components/
│   │   ├── BrainMatchView.tsx   # Two-brain + Pong Three.js renderer
│   │   ├── NeuralBrain.tsx      # Single-brain renderer (landing page demo)
│   │   └── AnalysisOverlay.tsx  # Firing rate grid + metrics
│   ├── page.tsx             # Landing page
│   └── play/page.tsx        # Game: selection → match → results
├── public/
│   └── recordings/          # Extracted spike data (JSON, no raw traces)
│       ├── index.json       # Recording metadata
│       ├── monolayer_1.json # ~1.2 MB
│       ├── monolayer_2.json # ~148 KB
│       ├── monolayer_3.json # ~31 KB
│       ├── organoid_1.json  # ~1.5 MB
│       └── organoid_2.json  # ~71 KB

scripts/
└── extract_spikes.py        # HDF5 → JSON extraction (dev tool)

server/                      # Python backend (optional, for live CL1 hardware)
```

### Neural Data Pipeline

Raw HDF5 recordings (~500 MB-1 GB each with voltage traces) are processed by `scripts/extract_spikes.py` into compact JSON files containing only spike events (`[timestamp, channel]` pairs). These JSON files are served as static assets — **no raw voltage traces are exposed to clients**.

| Recording | Type | Spikes | JSON Size |
|-----------|------|--------|-----------|
| monolayer_1 | Monolayer | 95,950 | 1.2 MB |
| monolayer_2 | Monolayer | 11,809 | 148 KB |
| monolayer_3 | Monolayer | 2,468 | 31 KB |
| organoid_1 | Organoid | 127,175 | 1.5 MB |
| organoid_2 | Organoid | 5,685 | 71 KB |

### Tech Stack

| Layer | Technology |
|---|---|
| 3D Visualization | Three.js |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Game Engine | TypeScript (runs entirely in browser) |
| Hosting | Vercel (static) |

## Development

```bash
# Prerequisites: Node.js 20+, pnpm

cd web
pnpm install
pnpm dev

# Open http://localhost:3000
```

To re-extract spike data from HDF5 recordings (requires Python 3.12+, h5py, numpy):

```bash
uv run --with h5py --with numpy python3 scripts/extract_spikes.py
```

## Roadmap

- [x] Three.js 3D brain renderer with 59-electrode MEA layout
- [x] Cortical Labs HDF5 recording integration
- [x] Client-side game engine (no server needed)
- [x] Two-brain match mode with feed controls
- [x] Spatial filtering, gain control, time offset
- [x] Real-time firing rate analysis
- [ ] Burst detection and spatial propagation visualization
- [ ] Match history and shareable results
- [ ] Community decoder submissions + leaderboard
- [ ] Live neuron mode via Cortical Cloud

## License

MIT — the platform code is fully open source.

Neural recordings provided by Cortical Labs for development and testing.

## Name

[Pinky and the Brain](https://en.wikipedia.org/wiki/Pinky_and_the_Brain) — two lab mice. One is a genius. The other is also a genius, just on a chip.

*"What are we going to do tonight, Brain?"*
*"The same thing we do every night, Pinky — try to take over the world."*
