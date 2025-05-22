"use client";

import { Coords } from "@/types/geo";
import {
  Box,
  Button,
  Divider,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useState } from "react";
import SummaryMap from "@/components/game/summary-map";

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
  const handleChange = (event: SelectChangeEvent<number>): void => {
    setRound(event.target.value);
  };
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
      <Select value={round} onChange={handleChange}>
        {allGuesses.map((e, i) => (
          <MenuItem value={i}>Round {i + 1}</MenuItem>
        ))}
      </Select>
      <SummaryMap
        targetLocation={allTargets[round]}
        otherGuesses={Object.entries(allGuesses[round])
          .filter(([_username]) => _username !== username)
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
