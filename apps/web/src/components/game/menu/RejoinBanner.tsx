"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";
import { apiFetch } from "@/lib/api-fetch";

interface ActiveRoom {
  roomId: string;
  mode: "SINGLEPLAYER" | "MULTIPLAYER";
}

const RejoinBanner: React.FC = () => {
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);

  useEffect(() => {
    apiFetch("/api/game/active")
      .then((res) => (res.status === 204 ? null : res.json()))
      .then((data) => setActiveRoom(data ?? null))
      .catch(() => setActiveRoom(null));
  }, []);

  if (!activeRoom) return null;

  const href =
    activeRoom.mode === "SINGLEPLAYER"
      ? `/game/play/sp?sessionId=${activeRoom.roomId}`
      : `/game/play/mp?roomId=${activeRoom.roomId}`;

  return (
    <Alert
      severity="info"
      sx={{ mb: 2, width: "100%", maxWidth: 480 }}
      action={
        <Button color="inherit" size="small" href={href}>
          Rejoin
        </Button>
      }
    >
      You have a game in progress.
    </Alert>
  );
};

export default RejoinBanner;
