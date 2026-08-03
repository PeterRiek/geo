"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PeopleIcon from "@mui/icons-material/People";
import GameFallback from "@/components/game/game-fallback";

interface GameSessionSummary {
  id: number;
  mode: "SINGLEPLAYER" | "MULTIPLAYER";
  mapId: number;
  roundCount: number;
  finishedAt: string;
  yourScore: number;
  otherPlayers: string[];
}

interface HistoryPage {
  content: GameSessionSummary[];
}

const HistoryList: React.FC = () => {
  const [sessions, setSessions] = useState<GameSessionSummary[]>();
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setSessions(undefined);
    fetch("/api/gamesession/history")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load history");
        return res.json();
      })
      .then((data: HistoryPage) => setSessions(data.content))
      .catch(() => setError(true));
  };

  useEffect(load, []);

  if (error) {
    return (
      <GameFallback
        variant="error"
        title="Couldn't load your game history"
        onRetry={load}
      />
    );
  }

  if (!sessions) {
    return <GameFallback variant="loading" title="Loading history..." />;
  }

  if (sessions.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 4 }}>
        <Typography variant="body1" color="text.secondary">
          You haven&apos;t finished any games yet.
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ maxWidth: 600, mx: "auto", width: "100%" }}>
      {sessions.map((session) => (
        <ListItemButton
          key={session.id}
          component={Link}
          href={`/history/${session.id}`}
          sx={{ borderRadius: 1, mb: 1 }}
        >
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                {session.mode === "SINGLEPLAYER" ? (
                  <SportsEsportsIcon fontSize="small" color="action" />
                ) : (
                  <PeopleIcon fontSize="small" color="action" />
                )}
                <Typography variant="body1">
                  {session.mode === "SINGLEPLAYER"
                    ? "Singleplayer"
                    : `Duel vs ${session.otherPlayers.join(", ") || "?"}`}
                </Typography>
                <Chip
                  label={`${session.yourScore} pts`}
                  size="small"
                  color="primary"
                />
              </Stack>
            }
            secondary={`${session.roundCount} rounds · ${new Date(
              session.finishedAt
            ).toLocaleString()}`}
          />
        </ListItemButton>
      ))}
    </List>
  );
};

export default HistoryList;
