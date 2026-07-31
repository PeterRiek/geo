"use client";

import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function ErrorPage() {
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
      <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
      <Typography variant="h4" fontWeight={500}>
        Something went wrong
      </Typography>
      <Typography variant="body1" color="text.secondary">
        We ran into a problem talking to the server. Please try again.
      </Typography>
      <Button variant="contained" size="large" href="/">
        Back to Home
      </Button>
    </Box>
  );
}
