"use client";

import { Coords } from "@/types/geo";
import { getCenterCoords, getDistanceInKm, getGuessrScore, formatDistance } from "@/lib/geo";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import SummaryMap from "@/components/game/summary-map";
import FullTripMap from "@/components/game/full-trip-map";
import AnimatedScore from "@/components/game/animated-score";
import StandingsList from "@/components/game/standings-list";

const OVERALL_VIEW = "overall";

interface Props {
  username: string;
  players: string[];
  allGuesses: { [username: string]: Coords | null }[];
  allTargets: Coords[];
  backHref?: string;
  backLabel?: string;
}

const PostgameView: React.FC<Props> = ({
  username,
  players,
  allTargets,
  allGuesses,
  backHref = "/game",
  backLabel = "BACK TO MENU",
}) => {
  const [selected, setSelected] = useState<string>(OVERALL_VIEW);

  const scoresByPlayer = useMemo(() => {
    const result: Record<string, number[]> = {};
    for (const player of players) {
      result[player] = allGuesses.map((guesses, i) => {
        const guess = guesses[player];
        const target = allTargets[i];
        if (!guess || !target) return 0;
        return getGuessrScore(getDistanceInKm(guess, target), 10_000);
      });
    }
    return result;
  }, [players, allGuesses, allTargets]);

  const overallStandings = useMemo(
    () =>
      players
        .map((player) => ({
          player,
          score: (scoresByPlayer[player] ?? []).reduce((sum, s) => sum + s, 0),
        }))
        .sort((a, b) => b.score - a.score),
    [players, scoresByPlayer]
  );

  const myTotal = scoresByPlayer[username]?.reduce((sum, s) => sum + s, 0) ?? 0;
  const roundScores = scoresByPlayer[username] ?? [];

  const isOverall = selected === OVERALL_VIEW;
  const round = isOverall ? undefined : Number(selected);

  const roundStandings = useMemo(() => {
    if (round === undefined) return [];
    return players
      .map((player) => ({ player, score: scoresByPlayer[player]?.[round] ?? 0 }))
      .sort((a, b) => b.score - a.score);
  }, [players, scoresByPlayer, round]);

  const currentGuess = round !== undefined ? allGuesses[round]?.[username] : undefined;
  const currentTarget = round !== undefined ? allTargets[round] : undefined;
  const currentDistance =
    currentGuess && currentTarget
      ? getDistanceInKm(currentGuess, currentTarget)
      : undefined;
  const currentCenter =
    currentGuess && currentTarget
      ? getCenterCoords(currentGuess, currentTarget)
      : currentTarget ?? { lat: 0, lng: 0 };
  const currentZoom =
    round !== undefined ? 1 + (roundScores[round] / 5000) * 8 : 1;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 1,
        p: 4,
        overflowY: "auto",
      }}
    >

      <Paper sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="overline" color="text.secondary">
          Your Score
        </Typography>
        <AnimatedScore
          value={myTotal}
          variant="h3"
          fontWeight={500}
          color="primary"
        />
      </Paper>

      <Select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        size="small"
        sx={{ minWidth: 160 }}
      >
        <MenuItem value={OVERALL_VIEW}>Overall Summary</MenuItem>
        {roundScores.map((s, i) => (
          <MenuItem key={i} value={String(i)}>
            Round {i + 1}: {s}
          </MenuItem>
        ))}
      </Select>

      {isOverall ? (
        <>
          <StandingsList entries={overallStandings} username={username} />
          <Paper sx={{ width: "90%", height: "50vh", p: 1 }}>
            <Box sx={{ overflow: "hidden", borderRadius: 1, width: "100%", height: "100%" }}>
              <FullTripMap allTargets={allTargets} allGuesses={allGuesses} username={username} />
            </Box>
          </Paper>
        </>
      ) : (
        <>
          {currentDistance !== undefined && round !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {formatDistance(currentDistance)} away &middot; {roundScores[round]} points
            </Typography>
          )}
          {round !== undefined && players.length > 1 && (
            <StandingsList entries={roundStandings} username={username} />
          )}
          {round !== undefined && (
            <Paper sx={{ width: "90%", height: "50vh", p: 1 }}>
              <Box sx={{ overflow: "hidden", borderRadius: 1, width: "100%", height: "100%" }}>
                <SummaryMap
                  targetLocation={allTargets[round]}
                  otherGuesses={Object.entries(allGuesses[round] ?? {})
                    .filter(([_username, guess]) => _username !== username && guess != null)
                    // eslint-disable-next-line
                    .map(([_, guess]) => guess)}
                  guessLocation={currentGuess ?? undefined}
                  center={currentCenter}
                  zoom={currentZoom}
                />
              </Box>
            </Paper>
          )}
        </>
      )}

      <Button href={backHref} variant="contained" size="large">
        {backLabel}
      </Button>
    </Box>
  );
};

export default PostgameView;
