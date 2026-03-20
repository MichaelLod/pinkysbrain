from collections import deque

from server.config import ACTIVE_CHANNELS, TICKS_PER_SECOND


class FiringRateTracker:
    def __init__(self, window_sec: float = 1.0) -> None:
        self._window_size = int(window_sec * TICKS_PER_SECOND)
        self._history: deque[dict[int, int]] = deque(maxlen=self._window_size)
        self._window_sec = window_sec

    def update(self, spikes: list) -> None:
        counts: dict[int, int] = {}
        for spike in spikes:
            counts[spike.channel] = counts.get(spike.channel, 0) + 1
        self._history.append(counts)

    def get_rates(self) -> dict:
        if not self._history:
            return {"channels": {}, "mean_rate": 0.0}

        totals: dict[int, int] = {}
        for counts in self._history:
            for ch, count in counts.items():
                totals[ch] = totals.get(ch, 0) + count

        duration = len(self._history) / TICKS_PER_SECOND
        rates = {str(ch): round(count / duration, 1) for ch, count in totals.items()}

        all_rates = [count / duration for count in totals.values()]
        mean_rate = round(sum(all_rates) / len(all_rates), 1) if all_rates else 0.0

        return {"channels": rates, "mean_rate": mean_rate, "spike_count": sum(totals.values())}
