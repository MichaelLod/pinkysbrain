import asyncio
import json
import logging

import cl

from server.analysis import FiringRateTracker
from server.config import GAME_DURATION_SEC, TICKS_PER_SECOND, WS_HOST, WS_PORT
from server.decoder import SpikeDecoder
from server.encoder import encode_game_state
from server.game import PongState

logger = logging.getLogger(__name__)


async def game_session(websocket) -> None:
    logger.info("Client connected")

    game = PongState()
    decoder = SpikeDecoder()
    tracker = FiringRateTracker()
    player_y = 0.5
    lock = asyncio.Lock()

    async def receive_input() -> None:
        nonlocal player_y
        try:
            async for raw in websocket:
                msg = json.loads(raw)
                if msg.get("type") == "input":
                    async with lock:
                        player_y = msg["y"]
        except Exception:
            pass

    input_task = asyncio.create_task(receive_input())
    queue: asyncio.Queue[dict | None] = asyncio.Queue(maxsize=5)

    def run_loop() -> None:
        nonlocal player_y
        try:
            with cl.open() as neurons:
                for tick in neurons.loop(
                    ticks_per_second=TICKS_PER_SECOND,
                    stop_after_seconds=GAME_DURATION_SEC,
                ):
                    spikes = tick.analysis.spikes
                    stims = tick.analysis.stims

                    encode_game_state(neurons, game.ball_x, game.ball_y)

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

            loop.call_soon_threadsafe(queue.put_nowait, None)
        except Exception as e:
            logger.error("Loop error: %s", e)
            try:
                loop.call_soon_threadsafe(queue.put_nowait, None)
            except RuntimeError:
                pass

    loop = asyncio.get_event_loop()

    loop_future = loop.run_in_executor(None, run_loop)

    try:
        while True:
            message = await queue.get()
            if message is None:
                break
            await websocket.send(json.dumps(message))
    except Exception:
        pass
    finally:
        input_task.cancel()
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
