"use server";

import Link from "next/link";
import { auth } from "@/auth";
import { MAPS_ERROR_PARAM } from "@/lib/maps";
import { getPublicBackendOrigin } from "@/lib/backend-url";
import LoginForm from "@/components/auth/login-form";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PeopleIcon from "@mui/icons-material/People";
import MapIcon from "@mui/icons-material/Map";
import HistoryIcon from "@mui/icons-material/History";
import {
  Box,
  Alert,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface CanPlayData {
  gamesPlayedToday: number;
  canPlay: boolean;
  maxGamesPerDay: number;
}

interface LastSession {
  mapId: number;
  mapName?: string;
  mapImageUrl?: string;
  mode: "SINGLEPLAYER" | "MULTIPLAYER";
  roundCount: number;
  roundTimeLimitSeconds: number;
  allowMove: boolean;
  allowPan: boolean;
  allowZoom: boolean;
}

interface RecentGame {
  id: number;
  mode: "SINGLEPLAYER" | "MULTIPLAYER";
  mapId?: number;
  mapName?: string;
  mapImageUrl?: string;
  roundCount: number;
  finishedAt: string;
  yourScore: number;
  otherPlayers: string[];
}

interface ExploreMap {
  id: number;
  name: string;
  imageUrl?: string;
}

const RECENT_GAMES_LIMIT = 3;
const JUMP_BACK_IN_LOOKBACK = 50;
const EXPLORE_MAPS_LIMIT = 3;
// Slight fan-out per card so the stack reads as a deck rather than flat overlapping squares.
const EXPLORE_STACK_OFFSETS = [
  { rotate: -10, x: -22, z: 1 },
  { rotate: 8, x: 22, z: 2 },
  { rotate: 0, x: 0, z: 3 },
];

const HomePage = async ({ searchParams }: HomePageProps) => {
  const session = await auth();
  const params = await searchParams;
  const showMapsError = params[MAPS_ERROR_PARAM] === "1";

  let canPlay: CanPlayData | undefined;
  let lastSession: LastSession | undefined;
  let recentGames: RecentGame[] = [];
  let exploreMaps: ExploreMap[] = [];
  if (session?.user) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/can-play`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (res.ok) canPlay = await res.json();
    } catch {
      // fall back to CTA without a play count below
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gamemap`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        const maps: ExploreMap[] = await res.json();
        exploreMaps = maps.slice(0, EXPLORE_MAPS_LIMIT);
      }
    } catch {
      // fall back to an imageless explore section below
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gamesession/history?page=0&size=${JUMP_BACK_IN_LOOKBACK}`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const content: (LastSession & RecentGame)[] = data.content ?? [];

        // Independent of "Jump back in" below — always just "your last N games" as-is.
        recentGames = content.slice(0, RECENT_GAMES_LIMIT);

        // "Jump back in" surfaces whichever map you've played most often among these — not
        // necessarily your literal last game — with that map's most recent settings as the
        // replay target. Ties break toward whichever of the tied maps was played most recently
        // (content is already ordered newest-first, and Map preserves insertion order).
        const mapPlayCounts = new Map<number, number>();
        for (const s of content) {
          if (s.mapId == null) continue;
          mapPlayCounts.set(s.mapId, (mapPlayCounts.get(s.mapId) ?? 0) + 1);
        }
        let mostPlayedMapId: number | undefined;
        let mostPlayedCount = 0;
        for (const [mapId, count] of mapPlayCounts) {
          if (count > mostPlayedCount) {
            mostPlayedMapId = mapId;
            mostPlayedCount = count;
          }
        }
        const candidate = content.find((s) => s.mapId === mostPlayedMapId);
        // Only offer a replay if the map is still known — a deleted map's session omits
        // mapName, and linking to it would just fall back to "Select a map" on the menu.
        if (candidate?.mapName) lastSession = candidate;
      }
    } catch {
      // fall back to no "jump back in"/"recent games" sections below
    }
  }

  const lastSessionHref = lastSession
    ? `/game?${new URLSearchParams({
        mapId: String(lastSession.mapId),
        mode: lastSession.mode === "SINGLEPLAYER" ? "singleplayer" : "multiplayer",
        roundCount: String(lastSession.roundCount),
        roundTimeLimitSeconds: String(lastSession.roundTimeLimitSeconds),
        allowMove: String(lastSession.allowMove),
        allowPan: String(lastSession.allowPan),
        allowZoom: String(lastSession.allowZoom),
      }).toString()}`
    : undefined;

  const outOfGamesToday = canPlay?.canPlay === false;
  // Out of games today pre-empts "Jump back in" (nothing to jump back into until tomorrow), and a
  // new/no-recent-history player has nothing to jump back into either — both fall back to Explore.
  const showJumpBackIn = !!session?.user && !!lastSession && !!lastSessionHref && !outOfGamesToday;
  const showExploreMaps = !!session?.user && (outOfGamesToday || !lastSession);

  return (
    <Container
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        py: 6,
        px: 3,
        overflow: "hidden",
      }}
    >
      {showMapsError && (
        <Alert severity="error" sx={{ width: "100%", maxWidth: 480, flexShrink: 0 }}>
          The game was ended because Google Maps couldn&apos;t load. Please
          try again later.
        </Alert>
      )}
      {session?.user ? (
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: 480,
            flexShrink: 0,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h4" textAlign="center" fontWeight={500}>
            Welcome back,{" "}
            <Typography
              component="span"
              variant="h4"
              fontWeight={700}
              color="primary"
            >
              {session.user.name}
            </Typography>
          </Typography>
          {canPlay && (
            <Typography variant="body2" color="text.secondary">
              {canPlay.gamesPlayedToday}
              {canPlay.maxGamesPerDay >= 0 ? ` / ${canPlay.maxGamesPerDay}` : " / unlimited"}{" "}
              games played today
            </Typography>
          )}
          <Tooltip
            title={outOfGamesToday ? "You've used all your games for today — come back tomorrow!" : ""}
            disableHoverListener={!outOfGamesToday}
            disableFocusListener={!outOfGamesToday}
          >
            <span>
              <Button
                href="/game"
                variant="contained"
                size="large"
                endIcon={<SportsEsportsIcon />}
                sx={{ px: 6 }}
                disabled={outOfGamesToday}
              >
                Play
              </Button>
            </span>
          </Tooltip>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ width: "100%", maxWidth: 480, flexShrink: 0, p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Sign in to play
          </Typography>
          <LoginForm />
        </Paper>
      )}

      {showJumpBackIn && lastSession && (
        <Box sx={{ width: "100%", maxWidth: 480, flexShrink: 0 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Jump back in
          </Typography>
          <Paper
            elevation={3}
            component="a"
            href={lastSessionHref}
            sx={{
              width: "100%",
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              textDecoration: "none",
              color: "inherit",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box
              component="img"
              src={
                lastSession.mapImageUrl
                  ? `${getPublicBackendOrigin()}${lastSession.mapImageUrl}`
                  : undefined
              }
              alt=""
              sx={{
                width: 96,
                height: 96,
                borderRadius: 1,
                objectFit: "cover",
                flexShrink: 0,
                bgcolor: "action.hover",
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {lastSession.mapName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {lastSession.mode === "SINGLEPLAYER" ? "Singleplayer" : "Multiplayer"} ·{" "}
                {lastSession.roundCount} round{lastSession.roundCount === 1 ? "" : "s"}
              </Typography>
            </Box>
            <Stack alignItems="center" sx={{ flexShrink: 0 }}>
              <PlayArrowIcon color="primary" fontSize="large" />
            </Stack>
          </Paper>
        </Box>
      )}

      {showExploreMaps && (
        <Box sx={{ width: "100%", maxWidth: 480, flexShrink: 0 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
            Explore maps
          </Typography>
          <Paper
            elevation={3}
            component={Link}
            href="/game/maps"
            sx={{
              width: "100%",
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              textDecoration: "none",
              color: "inherit",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
              {EXPLORE_STACK_OFFSETS.map(({ rotate, x, z }, i) => {
                const map = exploreMaps[i];
                return (
                  <Box
                    key={i}
                    component={map?.imageUrl ? "img" : "div"}
                    src={map?.imageUrl ? `${getPublicBackendOrigin()}${map.imageUrl}` : undefined}
                    alt=""
                    sx={{
                      position: "absolute",
                      top: 4,
                      left: "50%",
                      width: 64,
                      height: 64,
                      ml: "-32px",
                      borderRadius: 1.5,
                      objectFit: "cover",
                      bgcolor: "action.hover",
                      border: "2px solid",
                      borderColor: "background.paper",
                      boxShadow: 2,
                      transform: `translateX(${x * 0.6}px) rotate(${rotate}deg)`,
                      zIndex: z,
                    }}
                  />
                );
              })}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                Discover new maps
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Official collections and community creations
              </Typography>
            </Box>
            <Stack alignItems="center" sx={{ flexShrink: 0 }}>
              <MapIcon color="primary" fontSize="large" />
            </Stack>
          </Paper>
        </Box>
      )}

      {recentGames.length > 0 && (
        <Box
          sx={{
            width: "100%",
            maxWidth: 480,
            minHeight: 0,
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1, flexShrink: 0 }}>
            Recent games
          </Typography>
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 1,
              p: 1,
              minHeight: 0,
              flex: "1 1 auto",
              overflowY: "auto",
            }}
          >
            <Stack spacing={1}>
              {recentGames.map((game) => {
                // "Go to the map" only makes sense if the map still exists — a deleted map's
                // session omits mapName (see the lastSession gate above for the same reasoning).
                const mapHref =
                  game.mapId != null && game.mapName ? `/game?mapId=${game.mapId}` : undefined;

                return (
                  <Box
                    key={game.id}
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
                      href={`/history/${game.id}`}
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
                      {game.mapImageUrl ? (
                        <Box
                          component="img"
                          src={`${getPublicBackendOrigin()}${game.mapImageUrl}`}
                          alt=""
                          sx={{ width: 56, height: 56, borderRadius: 1, objectFit: "cover", flexShrink: 0 }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 1,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: "action.selected",
                          }}
                        >
                          {game.mode === "SINGLEPLAYER" ? (
                            <SportsEsportsIcon color="action" />
                          ) : (
                            <PeopleIcon color="action" />
                          )}
                        </Box>
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {game.mapName ?? "Unknown map"}
                          </Typography>
                          <Chip label={`${game.yourScore} pts`} size="small" color="primary" />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {game.mode === "SINGLEPLAYER"
                            ? "Singleplayer"
                            : `Duel vs ${game.otherPlayers.join(", ") || "?"}`}{" "}
                          &middot; {new Date(game.finishedAt).toLocaleDateString()}
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
              <Button
                component={Link}
                href="/profile?tab=history"
                variant="text"
                size="small"
                startIcon={<HistoryIcon />}
                fullWidth
              >
                View full history
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default HomePage;
