from server.config import CHANNEL_TO_POS, GRID_SIZE, PADDLE_SPEED


class SpikeDecoder:
    def __init__(self) -> None:
        self._smoothed = 0.0

    def decode(self, spikes: list) -> float:
        """Decode spike population into paddle movement direction."""
        if not spikes:
            return 0.0

        up_count = 0
        down_count = 0
        mid = GRID_SIZE / 2

        for spike in spikes:
            if spike.channel not in CHANNEL_TO_POS:
                continue
            row, _ = CHANNEL_TO_POS[spike.channel]
            if row < mid:
                up_count += 1
            else:
                down_count += 1

        total = up_count + down_count
        if total == 0:
            return 0.0

        raw = (down_count - up_count) / total
        self._smoothed = self._smoothed * 0.6 + raw * 0.4
        return self._smoothed * PADDLE_SPEED
