import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";

interface Props {
  playSet: {
    mapId: string;
    allowMove: boolean;
    allowZoom: boolean;
    allowPan: boolean;
  };
  onStart: () => void;
}

const PregameView: React.FC<Props> = ({ playSet, onStart }) => (
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
    <Typography variant="h2">Singleplayer</Typography>
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
        p: 2,
      }}
    >
      <Stack justifyContent="center">
        <Typography variant="h2" textAlign="center">
          Playing Map
        </Typography>
        <Typography variant="h3" textAlign="center" fontWeight={500}>
          {playSet.mapId}
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1}>
        <Chip label={playSet.allowMove ? "MOVE" : "NO MOVE"} color={playSet.allowMove ? "success" : "default"} />
        <Chip label={playSet.allowPan ? "PAN" : "NO PAN"} color={playSet.allowPan ? "success" : "default"} />
        <Chip label={playSet.allowZoom ? "ZOOM" : "NO ZOOM"} color={playSet.allowZoom ? "success" : "default"} />
      </Stack>
    </Paper>
    <Button onClick={onStart} variant="contained" size="large">
      Start Game
    </Button>
  </Box>
);

export default PregameView;
