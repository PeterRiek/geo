"use client";

import { Chip } from "@mui/material";

interface Props {
  round: number;
  totalRounds: number;
}

const RoundHud: React.FC<Props> = ({ round, totalRounds }) => (
  <Chip
    label={`Round ${round} / ${totalRounds}`}
    sx={{
      position: "absolute",
      top: 16,
      left: 16,
      zIndex: 20,
      bgcolor: "rgba(0,0,0,0.6)",
      color: "#fff",
      fontWeight: 500,
    }}
  />
);

export default RoundHud;
