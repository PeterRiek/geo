"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PeopleIcon from "@mui/icons-material/People";
import MapIcon from "@mui/icons-material/Map";
import GameFallback from "@/components/game/game-fallback";
import HistoryListSkeleton from "@/components/game/history/history-list-skeleton";
import { getPublicBackendOrigin } from "@/lib/backend-url";

const pad2 = (n: number) => n.toString().padStart(2, "0");

const formatFinishedAt = (isoString: string) => {
  const d = new Date(isoString);
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

interface GameSessionSummary {
  id: number;
  mode: "SINGLEPLAYER" | "MULTIPLAYER";
  mapId: number;
  mapName?: string;
  mapImageUrl?: string;
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
    return <HistoryListSkeleton />;
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
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        height: "100%",
        maxWidth: 600,
        mx: "auto",
        width: "100%",
        gap: 1,
        boxSizing: "border-box",
      }}
    >
      {sessions.map((session) => {
        // "Go to the map" only makes sense if the map still exists — a deleted map's session
        // omits mapName even though the (now-dangling) mapId is still stored.
        const mapHref = session.mapId != null && session.mapName ? `/game?mapId=${session.mapId}` : undefined;

        return (
          <Box
            key={session.id}
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              component={Link}
              href={`/history/${session.id}`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 1,
                pr: mapHref ? 5 : 1,
                flex: 1,
                minWidth: 0,
                borderRadius: 1,
                textDecoration: "none",
                color: "inherit",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {session.mapImageUrl ? (
                <Box
                  component="img"
                  src={`${getPublicBackendOrigin()}${session.mapImageUrl}`}
                  alt=""
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 1,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 1,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "action.selected",
                  }}
                >
                  {session.mode === "SINGLEPLAYER" ? (
                    <SportsEsportsIcon color="action" fontSize="large" />
                  ) : (
                    <PeopleIcon color="action" fontSize="large" />
                  )}
                </Box>
              )}
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>
                    {session.mapName ?? "Unknown map"}
                  </Typography>
                  <Chip label={`${session.yourScore} pts`} size="small" color="primary" />
                </Box>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {session.mode === "SINGLEPLAYER"
                    ? "Singleplayer"
                    : `Duel vs ${session.otherPlayers.join(", ") || "?"}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {session.roundCount} rounds &middot;{" "}
                  {formatFinishedAt(session.finishedAt)}
                </Typography>
              </Box>
            </Box>
            {mapHref && (
              <Tooltip title="Go to this map">
                <IconButton
                  component={Link}
                  href={mapHref}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    bgcolor: "background.paper",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <MapIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default HistoryList;
