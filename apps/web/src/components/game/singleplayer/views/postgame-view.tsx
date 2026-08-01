"use client";

import { Coords } from "@/types/geo";
import { getDistanceInKm, getGuessrScore, formatDistance } from "@/lib/geo";
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
import AnimatedScore from "@/components/game/animated-score";

interface Props {
  username: string;
  allGuesses: { [username: string]: Coords }[];
  allTargets: Coords[];
}

const PostgameView: React.FC<Props> = ({
  username,
  allTargets,
  allGuesses,
}) => {
  const [round, setRound] = useState(0);

  const roundScores = useMemo(
    () =>
      allGuesses.map((guesses, i) => {
        const guess = guesses[username];
        const target = allTargets[i];
        if (!guess || !target) return 0;
        return getGuessrScore(getDistanceInKm(guess, target), 10_000);
      }),
    [allGuesses, allTargets, username]
  );

  const totalScore = roundScores.reduce((sum, s) => sum + s, 0);

  const currentGuess = allGuesses[round][username];
  const currentTarget = allTargets[round];
  const currentDistance =
    currentGuess && currentTarget
      ? getDistanceInKm(currentGuess, currentTarget)
      : undefined;

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
      }}
    >
      <Typography variant="h2" textAlign="center">
        Game Summary
      </Typography>

      <Paper sx={{ p: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="overline" color="text.secondary">
          Total Score
        </Typography>
        <AnimatedScore
          value={totalScore}
          variant="h3"
          fontWeight={500}
          color="primary"
        />
      </Paper>

      <Select
        value={round}
        onChange={(e) => setRound(Number(e.target.value))}
        size="small"
        sx={{ minWidth: 160 }}
      >
        {roundScores.map((s, i) => (
          <MenuItem key={i} value={i}>
            Round {i + 1}: {s}
          </MenuItem>
        ))}
      </Select>

      {currentDistance !== undefined && (
        <Typography variant="body2" color="text.secondary">
          {formatDistance(currentDistance)} away &middot; {roundScores[round]} points
        </Typography>
      )}
      <SummaryMap
        targetLocation={allTargets[round]}
        otherGuesses={Object.entries(allGuesses[round])
          .filter(([_username]) => _username !== username)
          // eslint-disable-next-line
          .map(([_, guess]) => guess)}
        guessLocation={allGuesses[round][username]}
      />

      <Button href="/game" variant="contained" size="large">
        BACK TO MENU
      </Button>
    </Box>
  );
};

export default PostgameView;
