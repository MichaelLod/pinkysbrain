import random
from server.config import PADDLE_HEIGHT, BALL_SPEED


class PongState:
    def __init__(self) -> None:
        self.ball_x = 0.5
        self.ball_y = 0.5
        self.ball_vx = BALL_SPEED
        self.ball_vy = BALL_SPEED * (random.random() - 0.5) * 2
        self.player_paddle_y = 0.5
        self.neural_paddle_y = 0.5
        self.player_score = 0
        self.neural_score = 0

    def update(self, neural_direction: float, player_y: float) -> None:
        self.player_paddle_y = max(
            PADDLE_HEIGHT / 2, min(1 - PADDLE_HEIGHT / 2, player_y)
        )
        self.neural_paddle_y = max(
            PADDLE_HEIGHT / 2,
            min(1 - PADDLE_HEIGHT / 2, self.neural_paddle_y + neural_direction),
        )

        self.ball_x += self.ball_vx
        self.ball_y += self.ball_vy

        # Wall bounce (top/bottom)
        if self.ball_y <= 0 or self.ball_y >= 1:
            self.ball_vy *= -1
            self.ball_y = max(0, min(1, self.ball_y))

        # Player paddle (left side, x ~ 0.05)
        if self.ball_x <= 0.07 and self.ball_vx < 0:
            if abs(self.ball_y - self.player_paddle_y) < PADDLE_HEIGHT / 2:
                self.ball_vx *= -1
                offset = (self.ball_y - self.player_paddle_y) / (PADDLE_HEIGHT / 2)
                self.ball_vy = offset * BALL_SPEED
            elif self.ball_x <= 0:
                self.neural_score += 1
                self._reset_ball(direction=1)

        # Neural paddle (right side, x ~ 0.95)
        if self.ball_x >= 0.93 and self.ball_vx > 0:
            if abs(self.ball_y - self.neural_paddle_y) < PADDLE_HEIGHT / 2:
                self.ball_vx *= -1
                offset = (self.ball_y - self.neural_paddle_y) / (PADDLE_HEIGHT / 2)
                self.ball_vy = offset * BALL_SPEED
            elif self.ball_x >= 1:
                self.player_score += 1
                self._reset_ball(direction=-1)

    def _reset_ball(self, direction: int) -> None:
        self.ball_x = 0.5
        self.ball_y = 0.5
        self.ball_vx = BALL_SPEED * direction
        self.ball_vy = BALL_SPEED * (random.random() - 0.5) * 2

    def to_dict(self) -> dict:
        return {
            "ball_x": self.ball_x,
            "ball_y": self.ball_y,
            "ball_vx": self.ball_vx,
            "ball_vy": self.ball_vy,
            "player_paddle_y": self.player_paddle_y,
            "neural_paddle_y": self.neural_paddle_y,
            "player_score": self.player_score,
            "neural_score": self.neural_score,
        }
