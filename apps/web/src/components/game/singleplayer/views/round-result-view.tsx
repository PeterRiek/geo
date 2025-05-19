import { Box, Button, Paper, Typography } from "@mui/material";
import { Coords } from "@/types/geo";
import { formatDistance } from "@/lib/geo";
import SummaryMap from "@/components/game/summary-map";

interface Props {
  score: number;
  distance: number;
  guessLocation: Coords;
  targetLocation: Coords;
  center: Coords;
  zoom: number;
  onNext: () => void;
  isFinalRound: boolean;
}

const RoundResultView: React.FC<Props> = ({
  score,
  distance,
  guessLocation,
  targetLocation,
  center,
  zoom,
  onNext,
  isFinalRound,
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
      <Typography variant="h2" fontWeight={500} color="primary">
        {score}
      </Typography>
      <Typography>
        You were {formatDistance(distance)} away
      </Typography>
    </Paper>

    <Paper sx={{ width: "90%", height: "70%", p: 1 }}>
      <Box sx={{ overflow: "hidden", borderRadius: 1, width: "100%", height: "100%" }}>
        <SummaryMap
          guessLocation={guessLocation}
          targetLocation={targetLocation}
          center={center}
          zoom={zoom}
        />
      </Box>
    </Paper>

    <Button onClick={onNext} size="large" variant="contained">
      {isFinalRound ? "End Game" : "Next Round"}
    </Button>
  </Box>
);

export default RoundResultView;
