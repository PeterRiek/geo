"use client";

import { useEffect, useState } from "react";

/** Seconds remaining until `endsAt` (epoch millis), clamped to >= 0. The server is what actually resolves the round; this is display-only. */
const useCountdown = (endsAt?: number): number | undefined => {
  const [secondsLeft, setSecondsLeft] = useState<number>();

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(undefined);
      return;
    }

    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return secondsLeft;
};

export default useCountdown;
