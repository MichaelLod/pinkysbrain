from server.config import (
    ACTIVE_CHANNELS,
    CHANNEL_TO_POS,
    GRID_SIZE,
    STIM_CURRENT_UA,
    STIM_DURATION_US,
)


def compute_stim_channels(ball_x: float, ball_y: float) -> list[int]:
    """Return which MEA channels fall within stimulation radius of ball position."""
    target_row = int(ball_y * (GRID_SIZE - 1))
    target_col = int(ball_x * (GRID_SIZE - 1))

    channels = []
    for ch in ACTIVE_CHANNELS:
        row, col = CHANNEL_TO_POS[ch]
        dist = abs(row - target_row) + abs(col - target_col)
        if dist <= 2:
            channels.append(ch)
    return channels


def encode_and_stim(neurons, ball_x: float, ball_y: float) -> list[int]:
    """Compute stim channels and deliver stimulation via CL SDK."""
    channels = compute_stim_channels(ball_x, ball_y)
    if not channels:
        return []

    import cl

    channel_set = cl.ChannelSet(*channels)
    design = cl.StimDesign(
        STIM_DURATION_US, -STIM_CURRENT_UA, STIM_DURATION_US, STIM_CURRENT_UA
    )
    neurons.stim(channel_set, design)
    return channels
