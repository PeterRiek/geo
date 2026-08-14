"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Coords } from "@/types/geo";
import GameFallback from "@/components/game/game-fallback";
import PostgameView from "@/components/game/singleplayer/views/postgame-view";
import { apiFetch } from "@/lib/api-fetch";

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
    apiFetch(`/api/gamesession/${id}`)
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
  const allScores: { [username: string]: number }[] = detail.rounds.map((r) =>
    Object.fromEntries(r.guesses.map((g) => [g.username, g.score]))
  );
  const allDistances: { [username: string]: number | null }[] = detail.rounds.map((r) =>
    Object.fromEntries(r.guesses.map((g) => [g.username, g.distanceKm]))
  );

  return (
    <Box sx={{ height: "100%" }}>
      <PostgameView
        username={username}
        players={detail.players.map((p) => p.username)}
        allGuesses={allGuesses}
        allTargets={allTargets}
        allScores={allScores}
        allDistances={allDistances}
        backHref="/profile?tab=history"
        backLabel="BACK TO HISTORY"
      />
    </Box>
  );
};

export default HistoryDetail;
