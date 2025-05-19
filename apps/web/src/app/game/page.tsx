"use client";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

const GamePage = () => {
  const [maps, setMaps] = useState<{ id: number; name: string }[]>([]);
  const [moveEnabled, setMoveEnabled] = useState(true);
  const [panEnabled, setPanEnabled] = useState(true);
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [mapsLoading, setMapsLoading] = useState(true);

  useEffect(() => {
    const loadMaps = async () => {
      setMapsLoading(true);
      const resp = await fetch("/api/gamemap");
      const data = await resp.json();
      setMaps(
        data.map((map: { id: number; name: string; jsonFileUrl: string }) => ({
          id: map.id,
          name: map.name,
        }))
      );
      setMapsLoading(false);
    };

    loadMaps();
  }, []);

  return (
    <Container sx={{ height: "100%", p: 4 }}>
      <Typography variant="h2">Maps</Typography>
      <Divider sx={{ my: 2 }} />
      {/* List of Maps */}
      {mapsLoading && <CircularProgress />}
      {maps.length > 0 && (
        <Stack spacing={1} maxHeight="50%" overflow="scroll">
          {maps.map((m, i) => (
            <Paper
              key={`${m}${i}`}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 4,
                py: 1,
              }}
            >
              <Typography>{m.name}</Typography>
              <Button
                href={`/game/play/sp/?mapId=${m.id}&allowMove=${moveEnabled}&allowPan=${panEnabled}&allowZoom=${zoomEnabled}`}
              >
                PLAY
              </Button>
            </Paper>
          ))}
        </Stack>
      )}
      <Divider sx={{ my: 2 }} />

      {/* Toggle Playset Controls */}
      <Stack direction="row" spacing={2}>
        <Button
          variant={moveEnabled ? "contained" : "outlined"}
          color={moveEnabled ? "primary" : "inherit"}
          onClick={() => setMoveEnabled((prev) => !prev)}
        >
          Move
        </Button>

        <Button
          variant={panEnabled ? "contained" : "outlined"}
          color={panEnabled ? "primary" : "inherit"}
          onClick={() => setPanEnabled((prev) => !prev)}
        >
          Pan
        </Button>

        <Button
          variant={zoomEnabled ? "contained" : "outlined"}
          color={zoomEnabled ? "primary" : "inherit"}
          onClick={() => setZoomEnabled((prev) => !prev)}
        >
          Zoom
        </Button>
      </Stack>
    </Container>
  );
};

export default GamePage;
