import { Box, Button, Stack } from "@mui/material";
import GameSettingsSummary from "@/components/game/game-settings-summary";

interface Props {
  playSet: {
    mapId: string;
    allowMove: boolean;
    allowZoom: boolean;
    allowPan: boolean;
    roundCount: number;
  };
  onStart: () => void;
}

const PregameView: React.FC<Props> = ({ playSet, onStart }) => {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        p: 4,
      }}
    >
      <GameSettingsSummary
        mapId={playSet.mapId}
        allowMove={playSet.allowMove}
        allowPan={playSet.allowPan}
        allowZoom={playSet.allowZoom}
        roundCount={playSet.roundCount}
      />
      <Stack direction="row" spacing={2}>
        <Button href="/game" variant="outlined" size="large">
          Back
        </Button>
        <Button onClick={onStart} variant="contained" size="large">
          Start Game
        </Button>
      </Stack>
    </Box>
  );
};

export default PregameView;
