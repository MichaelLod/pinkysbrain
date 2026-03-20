# pinkysbrain

**Play against living neurons. Watch them think.**

🌐 [pinkysbrain.xyz](https://pinkysbrain.xyz)

A browser-based platform where humans play classic games against real neural recordings from biological computers. Every spike, every wave, every decision — visualized on a 3D brain in real time.

Built on top of the [Cortical Labs CL SDK](https://github.com/Cortical-Labs/cl-sdk).

---

## The Concept

The CL1 biological computer is real. 800,000 lab-grown human neurons on a chip, learning through plasticity, making decisions through spike patterns. The DishBrain paper proved neurons can learn Pong. The doom-neuron project proved the community wants to interact with this.

What's missing: **a place where anyone can experience it.**

pinkysbrain is that place.

You open a browser. You see a 3D brain — 59 electrodes mapped onto a neural surface. You pick a game. You play against the neurons. As the game runs, you watch the brain respond in real time: stimulation pulses ripple across the surface, spike cascades light up regions, wave patterns emerge as the neurons "decide" their next move. After each round, a neuroscience dashboard breaks down what just happened — firing rates, connectivity graphs, criticality analysis.

> "I just lost at Pong to 800,000 human neurons."

That's a tweet. That's a TikTok. That's a headline.

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Game State  │────▶│  Stim Encoder    │────▶│  Neural Data    │
│  (Browser)   │     │  (Input Layer)   │     │  (CL SDK)       │
└──────┬───────┘     └──────────────────┘     └────────┬────────┘
       │                                               │
       │              ┌──────────────────┐             │
       │◀─────────────│  Spike Decoder   │◀────────────┘
       │              │  (Output Layer)  │
       │              └──────────────────┘
       ▼
┌──────────────┐     ┌──────────────────┐
│  3D Brain    │◀────│  Analysis Engine  │
│  (Three.js)  │     │  (CL SDK)        │
└──────────────┘     └──────────────────┘
```

### Input: Game → Neurons

Game state is encoded as electrical stimulation patterns across the 59-channel electrode array. For Pong: ball position maps to spatial regions on the MEA. The stimulation design follows CL SDK conventions — biphasic waveforms, charge-balanced, within the 3.0 µA / 3.0 nC safety limits.

### Processing: Neural Response

The neurons respond. In replay mode, we play back real CL1 recordings captured during actual gameplay sessions. The CL SDK provides the full data pipeline: raw samples (25 kHz, 64 channels), detected spikes (75-sample waveforms), and delivered stims — all with precise timestamps.

### Output: Spikes → Action

A population decoder interprets the neural response. Not single-channel mapping, but spatial analysis: which region of the MEA fired most, with what intensity, at what latency. The spike pattern becomes a game action — paddle direction, movement speed, decision confidence.

### Visualization: The Brain

Three.js renders the 59 electrodes as a 3D neural surface. Every data point drives the visual:

| Neural Signal | Visual Effect |
|---|---|
| Spike amplitude | Node brightness |
| Firing rate | Pulse frequency |
| Cross-channel correlation | Visible connections between nodes |
| Stimulation input | Ripple effect from stimulated region |
| Population burst | Full-surface wave cascade |

The CL SDK's analysis toolkit runs in parallel, feeding real neuroscience metrics into an overlay dashboard:

- **Firing statistics** — per-channel and culture-wide rates
- **Network bursts** — population-level activity detection
- **Criticality** — is the network at the edge of chaos? (avalanche analysis, branching ratio, DCC)
- **Functional connectivity** — correlation-based adjacency matrices, clustering coefficients, modularity
- **Information entropy** — complexity of the neural response

## Architecture

```
pinkysbrain/
├── server/                    # Python — CL SDK integration
│   ├── replay/                # Neural recording management (HDF5)
│   ├── decoder/               # Population spike → game action decoding
│   ├── analysis/              # Real-time analysis pipeline (CL SDK)
│   └── ws/                    # WebSocket server (spike/stim streaming)
│
├── web/                       # TypeScript — Browser application
│   ├── engine/                # Game engine (Pong, Snake, reaction tests)
│   ├── brain/                 # Three.js 3D brain renderer
│   ├── dashboard/             # Analysis visualization overlay
│   └── app/                   # React app shell
│
└── data/                      # Neural recordings (HDF5)
    ├── raw/                   # Original CL1 recordings
    └── indexed/               # Preprocessed for replay
```

### Data Flow

1. Browser connects to Python backend via WebSocket
2. Game starts → game state sent to server
3. Server encodes state as stim pattern, feeds to CL SDK replay
4. CL SDK replays neural recording, yields spikes + raw samples
5. Server decodes spike population → game action
6. Server streams spikes, stims, analysis, and decoded action back to browser
7. Three.js renders neural activity on 3D brain in real time
8. Game engine applies neural decision, advances state
9. Loop continues at configurable tick rate

### Tech Stack

| Layer | Technology |
|---|---|
| 3D Visualization | Three.js with GPU instancing |
| Frontend | React, TypeScript |
| Real-time Transport | WebSocket (binary frames, msgpack) |
| Neural Data | CL SDK (Python), HDF5 via PyTables |
| Analysis | CL SDK analysis module (scipy, networkx, numpy) |
| Hosting | Static frontend (Vercel), Python backend (Fly.io / Railway) |

## Games

### Phase 1 — Pong
The classic. Ball position encoded as spatial stimulation, paddle movement decoded from population response. Direct comparison to DishBrain. Users play against the same neurons that learned the game.

### Phase 2 — Reaction Challenge
Simple stimulus-response timing. Flash a signal, measure how fast the neurons react vs. how fast you react. Shareable result card: "Your reaction time vs. 800K neurons."

### Phase 3 — Pattern Recognition
Present visual patterns encoded as multi-channel stimulation. Measure how the neural network's response differentiates between patterns. Can the neurons tell a circle from a square? Can you decode their answer better than the default decoder?

### Phase 4 — Community Decoders
Open the decoder layer. Let users write and submit their own decoding algorithms. Leaderboard: whose decoder extracts the best game performance from the same neural data? This is where it gets scientifically interesting.

## Neural Data

This platform is built to work with real CL1 neural recordings. The CL SDK's replay mode accepts HDF5 files containing raw samples, spike tables, and stim tables at 25 kHz across 64 channels.

**Current status:** The platform architecture is ready. The visualization pipeline, game engine, WebSocket transport, and analysis integration are designed around the CL SDK's exact data format and API. What we need is real neural recordings from CL1 gameplay sessions to bring it to life.

We can bootstrap with the CL SDK's random-mode simulator for development, but the magic — the thing that makes this shareable, credible, and scientifically meaningful — is real data from real neurons.

### For Cortical Labs

We're building the community gateway to biological computing. pinkysbrain makes your technology accessible to anyone with a browser — no $35K hardware, no $300/week cloud access, no Python setup. Just open a URL and play against neurons.

**What this does for CL1 adoption:**
- Hundreds of thousands of people experience biological computing for the first time
- Every game generates shareable content that references Cortical Labs
- The decoder challenge creates a developer community around your platform
- Players who want the real thing → Cortical Cloud funnel
- Open source means the community builds on your ecosystem

**What we need:**
- Sample CL1 recordings from gameplay sessions (Pong / reaction tasks) in the CL SDK's HDF5 format
- Permission to use them in this open-source, non-commercial project (compatible with CL SDK's CC BY-NC 4.0 license)
- Optionally: a Cortical Cloud connection for live "play against real neurons" events

**What you get:**
- A free, open-source showcase for your technology
- Direct attribution and branding throughout the platform
- A community tool that makes the CL SDK ecosystem more valuable
- Content that markets itself — every game played is potential viral reach

## Development

```bash
# Prerequisites
# Python 3.12+, Node.js 20+, pnpm

# Install dependencies
cd web && pnpm install && cd ..
pip install -r requirements.txt

# Start the backend (CL SDK simulator + WebSocket server)
python -m server

# Start the frontend (in another terminal)
cd web && pnpm dev

# Open http://localhost:3000/play to play Pong against the neurons

# With real neural data
CL_SDK_REPLAY_PATH=data/raw/pong_session_01.h5 python -m server
```

## Roadmap

- [x] Three.js 3D brain renderer with 59-electrode MEA layout
- [x] WebSocket pipeline (Python CL SDK ↔ Browser)
- [x] Pong game engine with stim encoder / spike decoder
- [x] Real-time firing rate analysis
- [x] Analysis dashboard overlay
- [ ] Full CL SDK analysis integration (connectivity, criticality)
- [ ] Real CL1 neural recordings integration
- [ ] Reaction challenge game mode
- [ ] Pattern recognition game mode
- [ ] Community decoder submissions + leaderboard
- [ ] Live neuron mode via Cortical Cloud

## License

MIT — the platform code is fully open source.

Neural recordings, when provided, will respect Cortical Labs' licensing terms.

## Name

[Pinky and the Brain](https://en.wikipedia.org/wiki/Pinky_and_the_Brain) — two lab mice. One is a genius. The other is also a genius, just on a chip.

*"What are we going to do tonight, Brain?"*
*"The same thing we do every night, Pinky — try to take over the world."*
