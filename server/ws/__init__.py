import asyncio
import json
import logging
import os
from pathlib import Path

from server.analysis import FiringRateTracker
from server.config import GAME_DURATION_SEC, TICKS_PER_SECOND, WS_HOST, WS_PORT
from server.decoder import SpikeDecoder
from server.game import PongState
from server.replay import open_replay, list_recordings, StimEvent

logger = logging.getLogger(__name__)

REPLAY_PATH = os.environ.get("REPLAY_PATH")


def _open_neurons(h5_path: str | None = None):
    if REPLAY_PATH:
        logger.info("Using replay file: %s", REPLAY_PATH)
        return open_replay(REPLAY_PATH)
    try:
        import cl

        return cl.open()
    except Exception:
        logger.info("CL SDK device not available, falling back to replay")
        return open_replay(h5_path)


def _should_encode() -> bool:
    return REPLAY_PATH is None and "cl" in __import__("sys").modules


def _infer_recording_type(filename: str) -> str:
    """Infer if recording is monolayer or organoid from filename."""
    if "organoid" in filename.lower():
        return "organoid"
    elif "monolayer" in filename.lower():
        return "monolayer"
    return "unknown"


def _get_recording_metadata():
    """Get list of available recordings with metadata (no raw samples)."""
    recordings = list_recordings()
    metadata = []
    for rec in recordings:
        metadata.append({
            "id": Path(rec["path"]).stem,
            "type": _infer_recording_type(rec["filename"]),
            "duration_sec": rec["duration_sec"],
            "spike_count": rec["spike_count"],
            "sampling_freq": rec["sampling_freq"],
            "channels": rec["channels"],
        })
    return metadata


async def game_session(websocket) -> None:
    logger.info("Client connected")

    game = PongState()
    decoder = SpikeDecoder()
    tracker = FiringRateTracker()
    player_y = 0.5
    lock = asyncio.Lock()
    selected_recording: str | None = None
    loop_future = None

    async def receive_input() -> None:
        nonlocal player_y, selected_recording, loop_future
        try:
            async for raw in websocket:
                msg = json.loads(raw)
                if msg.get("type") == "input":
                    async with lock:
                        player_y = msg["y"]
                elif msg.get("type") == "select_recording":
                    async with lock:
                        selected_recording = msg.get("recording_id")
        except Exception:
            pass

    async def send_recordings() -> None:
        """Send available recordings to client."""
        metadata = _get_recording_metadata()
        msg = {
            "type": "recordings_available",
            "recordings": metadata,
        }
        await websocket.send(json.dumps(msg))

    input_task = asyncio.create_task(receive_input())
    queue: asyncio.Queue[dict | None] = asyncio.Queue(maxsize=5)

    loop = asyncio.get_event_loop()

    try:
        # Send available recordings
        await send_recordings()

        # Wait for recording selection or timeout after 60s
        start_time = asyncio.get_event_loop().time()
        while selected_recording is None:
            if asyncio.get_event_loop().time() - start_time > 60:
                logger.info("No recording selected within 60s, picking random")
                from server.replay import pick_recording
                selected_recording = os.path.basename(pick_recording()).replace(".h5", "")
                break
            await asyncio.sleep(0.1)

        logger.info("Starting game with recording: %s", selected_recording)

        # Find h5 path for selected recording
        h5_path = None
        for rec in list_recordings():
            if Path(rec["path"]).stem == selected_recording:
                h5_path = rec["path"]
                break

        # Create closure for game loop with h5_path
        def run_game_with_h5() -> None:
            nonlocal player_y
            try:
                encode = _should_encode()
                if encode:
                    from server.encoder import compute_stim_channels

                with _open_neurons(h5_path) as neurons:
                    for tick in neurons.loop(
                        ticks_per_second=TICKS_PER_SECOND,
                        stop_after_seconds=GAME_DURATION_SEC,
                    ):
                        spikes = tick.analysis.spikes
                        stims = tick.analysis.stims

                        stim_channels = compute_stim_channels(game.ball_x, game.ball_y)
                        if encode:
                            # Deliver actual stim to live neurons
                            from server.encoder import encode_and_stim
                            encode_and_stim(neurons, game.ball_x, game.ball_y)
                        else:
                            # In replay mode, simulate stim events for visualization
                            stims = [StimEvent(channel=ch, timestamp=-1) for ch in stim_channels]

                        direction = decoder.decode(spikes)
                        game.update(direction, player_y)
                        tracker.update(spikes)

                        message = {
                            "type": "tick",
                            "game": game.to_dict(),
                            "spikes": [
                                {"ch": s.channel, "ts": s.timestamp} for s in spikes
                            ],
                            "stims": [
                                {"ch": s.channel, "ts": s.timestamp} for s in stims
                            ],
                            "analysis": tracker.get_rates(),
                            "neural_direction": direction,
                        }

                        try:
                            loop.call_soon_threadsafe(queue.put_nowait, message)
                        except (asyncio.QueueFull, RuntimeError):
                            pass

                loop.call_soon_threadsafe(queue.put_nowait, {"type": "game_over", "final_game": game.to_dict()})
            except Exception as e:
                logger.error("Loop error: %s", e)
                try:
                    loop.call_soon_threadsafe(queue.put_nowait, None)
                except RuntimeError:
                    pass

        # Start game loop
        loop_future = loop.run_in_executor(None, run_game_with_h5)

        while True:
            message = await queue.get()
            if message is None:
                break
            await websocket.send(json.dumps(message))
    except Exception as e:
        logger.error("Session error: %s", e)
    finally:
        input_task.cancel()
        if loop_future:
            await loop_future
        logger.info("Session ended")


async def main() -> None:
    import websockets.asyncio.server

    logging.basicConfig(level=logging.INFO)
    logger.info("Starting pinkysbrain server on %s:%s", WS_HOST, WS_PORT)

    async with websockets.asyncio.server.serve(
        game_session, WS_HOST, WS_PORT
    ) as server:
        await server.serve_forever()
