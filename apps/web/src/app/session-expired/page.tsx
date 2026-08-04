"use client";

import { logout } from "@/lib/actions/auth";
import { Box, CircularProgress, Typography } from "@mui/material";
import React, { useEffect } from "react";

const SessionExpiredPage = () => {
  useEffect(() => {
    logout("/login");
  }, []);

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
      <Typography variant="h4" fontWeight={500}>
        Your session has expired
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Please sign in again to continue.
      </Typography>
      <CircularProgress size={32} />
    </Box>
  );
};

export default SessionExpiredPage;
