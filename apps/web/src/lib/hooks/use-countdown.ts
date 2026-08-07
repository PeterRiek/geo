"use client";

import { useEffect, useState } from "react";

/**
 * Seconds remaining until `endsAt` (epoch millis, from the server), clamped to >= 0. The server is
 * what actually resolves the round; this is display-only.
 *
 * `clockOffsetMs` (server time minus our own Date.now(), as measured on the last message received —
 * see use-game-socket) corrects for the local clock being skewed relative to the server's. Without
 * it, two players with different system clocks would each count down against `endsAt` using their
 * own wall clock, so their timers visibly disagree even though they're both racing the same deadline.
 */
const useCountdown = (endsAt?: number, clockOffsetMs = 0): number | undefined => {
  const [secondsLeft, setSecondsLeft] = useState<number>();

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(undefined);
      return;
    }

    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((endsAt - (Date.now() + clockOffsetMs)) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt, clockOffsetMs]);

  return secondsLeft;
};

export default useCountdown;
