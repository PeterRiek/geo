"use client";

import { Box, Button, CircularProgress, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StraightenIcon from "@mui/icons-material/Straighten";
import PlaceIcon from "@mui/icons-material/Place";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import { getPublicBackendOrigin } from "@/lib/backend-url";

type Map = {
  id: number;
  name: string;
  imageUrl?: string;
  description?: string;
  maxErrorDistanceKm?: number;
  ownerUsername?: string;
  locationCount?: number;
};

// Placeholder copy for maps that haven't been given a description yet.
const DESCRIPTIONS = [
  "A hand-picked set of locations to test your geography skills.",
  "Explore diverse landscapes and landmarks across this map.",
  "A curated trail of streets and scenery, ready to be guessed.",
  "Familiar and obscure spots alike, waiting to be pinpointed.",
];

// Deterministic pseudo-random helper so the placeholder stats stay stable across re-renders.
const seededInt = (seed: number, min: number, max: number) => {
  const frac = Math.sin(seed + 1) * 10000 % 1;
  return min + Math.floor((frac < 0 ? frac + 1 : frac) * (max - min + 1));
};

const SUMMARY_HEIGHT = { xs: 180, sm: 240 };

const SelectedMapSummary: React.FC<{
  maps: Map[];
  selectedMap?: number;
  mapsLoading: boolean;
}> = ({ maps, selectedMap, mapsLoading }) => {
  const map = maps.find((m) => m.id === selectedMap);

  if (mapsLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: SUMMARY_HEIGHT,
          width: "100%",
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!map) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: SUMMARY_HEIGHT,
          width: "100%",
        }}
      >
        <Button href="/game/maps" variant="outlined" startIcon={<AddIcon />}>
          Select map
        </Button>
      </Box>
    );
  }

  const description =
    map.description || DESCRIPTIONS[seededInt(map.id, 0, DESCRIPTIONS.length - 1)];
  const locationCount = map.locationCount ?? 0;

  return (
    <Box sx={{ position: "relative", display: "flex", width: "100%", height: SUMMARY_HEIGHT }}>
      <Tooltip title="Change map">
        <IconButton
          href="/game/maps"
          size="small"
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 1,
            bgcolor: "background.paper",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <SwapHorizIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box
        component="img"
        src={map.imageUrl ? `${getPublicBackendOrigin()}${map.imageUrl}` : undefined}
        alt=""
        sx={{
          width: { xs: 100, sm: 160, md: 220 },
          height: "100%",
          flexShrink: 0,
          objectFit: "cover",
          bgcolor: "action.hover",
        }}
      />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          px: 2,
          py: 1.5,
        }}
      >
        <Typography variant="h6" fontWeight={600} noWrap sx={{ flexShrink: 0, mb: 0.5 }}>
          {map.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {description}
        </Typography>

        <Divider sx={{ my: 1 }} />

        <Stack spacing={0.5}>
          <Stack direction="row" spacing={2}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StraightenIcon fontSize="inherit" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {(map.maxErrorDistanceKm ?? 0).toLocaleString()} km
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <PlaceIcon fontSize="inherit" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {locationCount} locations
              </Typography>
            </Stack>
          </Stack>
          {map.ownerUsername && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <PersonIcon fontSize="inherit" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
                {map.ownerUsername}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default SelectedMapSummary;
