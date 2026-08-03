"use client";

import { useEffect, useState } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { Coords } from "@/types/geo";
import GameFallback from "@/components/game/game-fallback";
import PostgameView from "@/components/game/singleplayer/views/postgame-view";

interface GuessResult {
  username: string;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  score: number;
  timedOut: boolean;
}

interface RoundResult {
  roundIndex: number;
  targetLat: number;
  targetLng: number;
  guesses: GuessResult[];
}

interface PlayerResult {
  username: string;
  totalScore: number;
}

interface GameSessionDetail {
  id: number;
  mode: "SINGLEPLAYER" | "MULTIPLAYER";
  mapId: number;
  roundCount: number;
  roundTimeLimitSeconds: number;
  finishedAt: string;
  players: PlayerResult[];
  rounds: RoundResult[];
}

const HistoryDetail: React.FC<{ id: string; username: string }> = ({ id, username }) => {
  const [detail, setDetail] = useState<GameSessionDetail>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch(`/api/gamesession/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Session not found." : "Failed to load session.");
        return res.json();
      })
      .then(setDetail)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) {
    return <GameFallback variant="error" title="Couldn't load this game" description={error} />;
  }
  if (!detail) {
    return <GameFallback variant="loading" title="Loading game..." />;
  }

  const allTargets: Coords[] = detail.rounds.map((r) => ({ lat: r.targetLat, lng: r.targetLng }));
  const allGuesses: { [username: string]: Coords }[] = detail.rounds.map((r) =>
    Object.fromEntries(
      r.guesses
        .filter((g) => g.lat != null && g.lng != null)
        .map((g) => [g.username, { lat: g.lat as number, lng: g.lng as number }])
    )
  );

  const sortedPlayers = [...detail.players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <Box>
      {detail.mode === "MULTIPLAYER" && (
        <Paper sx={{ maxWidth: 400, mx: "auto", mb: 2, p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Players
          </Typography>
          <Stack spacing={1}>
            {sortedPlayers.map((player) => (
              <Stack key={player.username} direction="row" justifyContent="space-between">
                <Typography variant="body2">
                  {player.username === username ? `${player.username} (you)` : player.username}
                </Typography>
                <Chip label={`${player.totalScore} pts`} size="small" color="primary" />
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
      <PostgameView username={username} allGuesses={allGuesses} allTargets={allTargets} />
    </Box>
  );
};

export default HistoryDetail;
