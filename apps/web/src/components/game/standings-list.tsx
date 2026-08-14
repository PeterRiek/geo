"use client";

import { Paper, Stack, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export interface StandingsEntry {
  player: string;
  score: number;
  // Cumulative score through this point in the game. Omit for a standings list that's already
  // showing the game's grand total (e.g. the final postgame summary) — pass it for any
  // "this round's score" list where the running total is useful extra context.
  totalScore?: number;
}

const StandingsList: React.FC<{ entries: StandingsEntry[]; username: string }> = ({
  entries,
  username,
}) => {
  const topScore = entries[0]?.score ?? 0;
  return (
    <Paper sx={{ p: 2, width: "90%", maxWidth: 420 }}>
      <Stack spacing={1.5}>
        {entries.map((entry, i) => {
          const isWinner = entry.score === topScore && entries.length > 1;
          return (
            <Stack
              key={entry.player}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                <Typography variant="body1" fontWeight={isWinner ? 700 : 400} noWrap>
                  {i + 1}. {entry.player === username ? `${entry.player} (you)` : entry.player}
                </Typography>
                {isWinner && <EmojiEventsIcon color="warning" fontSize="small" />}
              </Stack>
              <Typography variant="body1" fontWeight={600}>
                {entry.score} pts
                {entry.totalScore !== undefined && ` (${entry.totalScore} total)`}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
};

export default StandingsList;
