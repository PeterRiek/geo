"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";

export default function ServerStartingPage() {
  const [serverOnline, setServerOnline] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // start status check
        const resp = await fetch(`/api/status`, {
          cache: "no-store",
        });
        const data = await resp.json();
        if (resp.ok && data.status === "READY") {
          clearInterval(interval);
          setServerOnline(true);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        // server is still offline
      } finally {
        // end status check
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleContinue = () => {
    setRedirecting(true);
    router.push("/"); // TODO: redirect to origin
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: 4,
        p: 4,
      }}
    >
      <Typography variant="h2" fontWeight={500}>
        {!serverOnline ? "Server is starting up" : "Server up!"}
      </Typography>
      <Typography variant="h6">
        {!serverOnline
          ? "Please wait a moment while the API server wakes up."
          : "Server is ready, you can now connect."}
      </Typography>
      <Button
        variant="contained"
        size="large"
        loading={!serverOnline || redirecting}
        onClick={handleContinue}
      >
        Connect
      </Button>
    </Box>
  );
}
