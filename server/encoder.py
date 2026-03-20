import cl
from server.config import (
    ACTIVE_CHANNELS,
    CHANNEL_TO_POS,
    GRID_SIZE,
    STIM_CURRENT_UA,
    STIM_DURATION_US,
)


def encode_game_state(
    neurons: cl.Neurons,
    ball_x: float,
    ball_y: float,
) -> None:
    """Encode ball position as spatial stimulation on the MEA."""
    target_row = int(ball_y * (GRID_SIZE - 1))
    target_col = int(ball_x * (GRID_SIZE - 1))

    channels = []
    for ch in ACTIVE_CHANNELS:
        row, col = CHANNEL_TO_POS[ch]
        dist = abs(row - target_row) + abs(col - target_col)
        if dist <= 2:
            channels.append(ch)

    if not channels:
        return

    channel_set = cl.ChannelSet(*channels)
    design = cl.StimDesign(
        STIM_DURATION_US, -STIM_CURRENT_UA, STIM_DURATION_US, STIM_CURRENT_UA
    )
    neurons.stim(channel_set, design)
