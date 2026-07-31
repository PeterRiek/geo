"use client";

import { Box, Button, Typography } from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

export default function LimitReachedPage() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: 3,
        p: 4,
      }}
    >
      <HourglassEmptyIcon color="warning" sx={{ fontSize: 64 }} />
      <Typography variant="h4" fontWeight={500}>
        Daily play limit reached
      </Typography>
      <Typography variant="body1" color="text.secondary">
        You&apos;ve used up your games for today. Come back tomorrow for more rounds.
      </Typography>
      <Button variant="contained" size="large" href="/">
        Back to Home
      </Button>
    </Box>
  );
}
