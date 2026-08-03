"use client";

import { Chip, Stack } from "@mui/material";

interface Props {
  round: number;
  totalRounds: number;
  secondsLeft?: number;
}

const formatSecondsLeft = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const RoundHud: React.FC<Props> = ({ round, totalRounds, secondsLeft }) => (
  <Stack
    direction="row"
    spacing={1}
    sx={{ position: "absolute", top: 16, left: 16, zIndex: 20 }}
  >
    <Chip
      label={`Round ${round} / ${totalRounds}`}
      sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "#fff", fontWeight: 500 }}
    />
    {secondsLeft !== undefined && (
      <Chip
        label={formatSecondsLeft(secondsLeft)}
        sx={{
          bgcolor: secondsLeft <= 10 ? "rgba(211,47,47,0.85)" : "rgba(0,0,0,0.6)",
          color: "#fff",
          fontWeight: 500,
        }}
      />
    )}
  </Stack>
);

export default RoundHud;
