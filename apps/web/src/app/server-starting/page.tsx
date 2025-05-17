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
      } catch (error) {
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
        textAlign:"center",
        gap: 4,
        p: 4,
      }}
    >
      <Typography variant="h2" fontWeight={500}>Server is starting up</Typography>
      <Typography variant="h6">
        Please wait a moment while the API server wakes up.
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
