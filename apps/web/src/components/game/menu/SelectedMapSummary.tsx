"use client";

import { Box, Button, Typography } from "@mui/material";
import { getPublicBackendOrigin } from "@/lib/backend-url";

type Map = { id: number; name: string; imageUrl?: string };

const SelectedMapSummary: React.FC<{
  maps: Map[];
  selectedMap?: number;
  mapsLoading: boolean;
}> = ({ maps, selectedMap, mapsLoading }) => {
  const map = maps.find((m) => m.id === selectedMap);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 1, width: "100%" }}>
      <Box
        component="img"
        src={map?.imageUrl ? `${getPublicBackendOrigin()}${map.imageUrl}` : undefined}
        alt=""
        sx={{
          width: 64,
          height: 64,
          borderRadius: 1,
          objectFit: "cover",
          flexShrink: 0,
          bgcolor: "action.hover",
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="overline" color="text.secondary" display="block">
          Map
        </Typography>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {mapsLoading ? "Loading…" : map ? map.name : "No map selected"}
        </Typography>
      </Box>
      <Button href="/game/maps" variant="outlined">
        {map ? "Change map" : "Browse maps"}
      </Button>
    </Box>
  );
};

export default SelectedMapSummary;
