import { Box, Button, Paper, Typography } from "@mui/material";
import { Coords } from "@/types/geo";
import { formatDistance } from "@/lib/geo";
import SummaryMap from "@/components/game/summary-map";
import AnimatedScore from "@/components/game/animated-score";
import StandingsList, { StandingsEntry } from "@/components/game/standings-list";

interface ReadyState {
  amReady: boolean;
  readyCount: number;
  totalCount: number;
}

interface Props {
  score: number;
  distance: number;
  guessLocation?: Coords;
  targetLocation: Coords;
  otherGuessLocations?: Coords[];
  center: Coords;
  zoom: number;
  onNext: () => void;
  isFinalRound: boolean;
  username?: string;
  standings?: StandingsEntry[];
  // Multiplayer only: when set, the "Next"/"Go to Summary" button becomes a ready-toggle
  // instead of an immediate advance — singleplayer omits this and keeps today's behavior.
  readyState?: ReadyState;
  // Multiplayer only: seconds left before the between-rounds failsafe force-advances the room
  // regardless of ready state. Rendered in-flow below the button (not as an overlay) so it can
  // never collide with it.
  readySecondsLeft?: number;
}

const RoundResultView: React.FC<Props> = ({
  score,
  distance,
  guessLocation,
  targetLocation,
  otherGuessLocations,
  center,
  zoom,
  onNext,
  isFinalRound,
  username,
  standings,
  readyState,
  readySecondsLeft,
}) => (
  <Box
    sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      py: 5,
    }}
  >
    <Paper sx={{ p: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <AnimatedScore value={score} variant="h2" fontWeight={500} color="primary" />
      <Typography>
        You were {formatDistance(distance)} away
      </Typography>
    </Paper>

    {standings && standings.length > 1 && username && (
      <StandingsList entries={standings} username={username} />
    )}

    <Paper sx={{ width: "90%", height: "70%", p: 1 }}>
      <Box sx={{ overflow: "hidden", borderRadius: 1, width: "100%", height: "100%" }}>
        <SummaryMap
          guessLocation={guessLocation}
          targetLocation={targetLocation}
          otherGuesses={otherGuessLocations}
          center={center}
          zoom={zoom}
        />
      </Box>
    </Paper>

    <Button
      onClick={onNext}
      size="large"
      variant={readyState && readyState.amReady ? "outlined" : "contained"}
    >
      {readyState
        ? readyState.amReady
          ? `Waiting for others (${readyState.readyCount}/${readyState.totalCount})`
          : "Ready"
        : isFinalRound
          ? "Go to Summary"
          : "Next Round"}
    </Button>
    {readyState && readySecondsLeft !== undefined && (
      <Typography variant="body2" color="text.secondary">
        Advancing automatically in {readySecondsLeft}s
      </Typography>
    )}
  </Box>
);

export default RoundResultView;
