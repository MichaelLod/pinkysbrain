GRID_SIZE = 8
GROUND_CHANNELS = {0, 7, 56, 63}
REF_CHANNEL = 4
EXCLUDED_CHANNELS = GROUND_CHANNELS | {REF_CHANNEL}

# Column-major channel layout matching CL SDK MEA
# channel = row + col * GRID_SIZE
ACTIVE_CHANNELS = [
    ch for ch in range(GRID_SIZE * GRID_SIZE) if ch not in EXCLUDED_CHANNELS
]

# Map channel number to (row, col) on the MEA
CHANNEL_TO_POS = {
    ch: (ch % GRID_SIZE, ch // GRID_SIZE) for ch in ACTIVE_CHANNELS
}

# Game settings
TICKS_PER_SECOND = 20
GAME_DURATION_SEC = 60
WS_HOST = "localhost"
WS_PORT = 8765

# Stim encoding
STIM_CURRENT_UA = 1.0
STIM_DURATION_US = 160

# Paddle / ball
PADDLE_HEIGHT = 0.15
PADDLE_SPEED = 0.04
BALL_SPEED = 0.015
