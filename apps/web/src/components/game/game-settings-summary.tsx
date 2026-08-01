import { Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";

interface Props {
  mapId: string | number;
  allowMove: boolean;
  allowPan: boolean;
  allowZoom: boolean;
  roundCount: number;
}

const GameSettingsSummary: React.FC<Props> = ({
  mapId,
  allowMove,
  allowPan,
  allowZoom,
  roundCount,
}) => {
  const [mapName, setMapName] = useState<string>();

  useEffect(() => {
    const loadMapName = async () => {
      try {
        const res = await fetch(`/api/gamemap/${mapId}`);
        if (!res.ok) return;
        const data = await res.json();
        setMapName(data.name);
      } catch {
        // fall back to raw id below
      }
    };
    loadMapName();
  }, [mapId]);

  return (
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
        <Typography variant="h3" textAlign="center" fontWeight={300}>
          Playing Map
        </Typography>
        {mapName ? (
          <Typography variant="h3" textAlign="center" fontWeight={500}>
            {mapName}
          </Typography>
        ) : (
          <Skeleton
            variant="text"
            width={160}
            sx={{ fontSize: "2rem", mx: "auto" }}
          />
        )}
      </Stack>
      <Stack direction="row" spacing={1}>
        <Chip
          label={allowMove ? "MOVE" : "NO MOVE"}
          color={allowMove ? "success" : "default"}
        />
        <Chip
          label={allowPan ? "PAN" : "NO PAN"}
          color={allowPan ? "success" : "default"}
        />
        <Chip
          label={allowZoom ? "ZOOM" : "NO ZOOM"}
          color={allowZoom ? "success" : "default"}
        />
      </Stack>
      <Typography color="text.secondary">
        {roundCount} {roundCount === 1 ? "Round" : "Rounds"}
      </Typography>
    </Paper>
  );
};

export default GameSettingsSummary;
