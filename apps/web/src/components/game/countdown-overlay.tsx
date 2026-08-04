"use client";

import { Box, Typography } from "@mui/material";

interface Props {
  secondsLeft: number;
}

// Shown centered over the pano for the last few seconds of a round, on top of RoundHud's small
// corner timer — key={secondsLeft} on the root remounts it every tick so the pulse animation
// replays each second instead of only playing once.
const CountdownOverlay: React.FC<Props> = ({ secondsLeft }) => (
  <Box
    key={secondsLeft}
    sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 30,
      pointerEvents: "none",
      width: { xs: 96, sm: 128 },
      height: { xs: 96, sm: 128 },
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: secondsLeft <= 3 ? "rgba(211,47,47,0.75)" : "rgba(0,0,0,0.6)",
      "@keyframes countdownPulse": {
        "0%": { transform: "translate(-50%, -50%) scale(1.4)", opacity: 0 },
        "60%": { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        "100%": { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
      },
      animation: "countdownPulse 0.4s ease-out",
    }}
  >
    <Typography
      sx={{
        fontSize: { xs: "3rem", sm: "4rem" },
        fontWeight: 700,
        color: "#fff",
        lineHeight: 1,
      }}
    >
      {secondsLeft}
    </Typography>
  </Box>
);

export default CountdownOverlay;
