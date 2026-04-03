from server.config import CHANNEL_TO_POS, GRID_SIZE, PADDLE_SPEED


class SpikeDecoder:
    def __init__(self) -> None:
        self._smoothed = 0.0

    def decode(self, spikes: list) -> float:
        """Decode spike population into paddle movement direction.

        Handles recordings with different spike densities (2.5k to 127k spikes)
        by using slow exponential decay instead of pulling to zero on silence.
        """
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
        if total > 0:
            raw = (down_count - up_count) / total
            self._smoothed = self._smoothed * 0.6 + raw * 0.4
        else:
            # Decay to zero slowly instead of snapping.
            # Keeps sparse recordings responsive without jitter.
            self._smoothed *= 0.95

        return self._smoothed * PADDLE_SPEED
