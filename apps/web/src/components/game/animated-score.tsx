"use client";

import { Typography, TypographyProps } from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface Props extends TypographyProps {
  value: number;
  durationMs?: number;
}

const AnimatedScore: React.FC<Props> = ({ value, durationMs = 800, ...typographyProps }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const frameRef = useRef<number>(undefined);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (value - from) * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return <Typography {...typographyProps}>{displayValue}</Typography>;
};

export default AnimatedScore;
