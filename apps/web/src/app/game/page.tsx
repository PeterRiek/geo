"use client";

import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

const GamePage = () => {
  const [maps, setMaps] = useState(["map-1", "map-2", "map-3"]);
  const [moveEnabled, setMoveEnabled] = useState(true);
  const [panEnabled, setPanEnabled] = useState(true);
  const [zoomEnabled, setZoomEnabled] = useState(true);
  return (
    <Container sx={{ height: "100%", p: 4 }}>
      <Typography variant="h2">Maps</Typography>
      <Divider sx={{ my: 2 }} />
      {/* List of Maps */}
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
            <Typography>{m}</Typography>
            <Button
              href={`/game/play/sp/?mapId=${m}&allowMove=${moveEnabled}&allowPan=${panEnabled}&allowZoom=${zoomEnabled}`}
            >
              PLAY
            </Button>
          </Paper>
        ))}
      </Stack>
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
