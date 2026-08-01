"use client";

import React from "react";
import { Box, Button, Container, Paper } from "@mui/material";
import MapSelect from "./MapSelect";
import NMPZSelect from "./NMPZSelect";

// eslint-disable-next-line
const SingleplayerSettings: React.FC<any> = ({
  maps,
  selectedMap,
  setSelectedMap,
  mapsLoading,
  scrollPositionRef,
  moveEnabled,
  panEnabled,
  zoomEnabled,
  setMoveEnabled,
  setPanEnabled,
  setZoomEnabled,
  roundCount,
  setRoundCount,
}) => (
  <Box
    sx={{
      height: "80%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Container
      sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1 }}
    >
      <Paper sx={{ p: 1, maxHeight: "50%" }}>
        <MapSelect
          maps={maps}
          selectedMap={selectedMap}
          setSelectedMap={setSelectedMap}
          mapsLoading={mapsLoading}
          scrollPositionRef={scrollPositionRef}
        />
      </Paper>
      <Paper sx={{ p: 1 }}>
        <NMPZSelect
          moveEnabled={moveEnabled}
          panEnabled={panEnabled}
          zoomEnabled={zoomEnabled}
          roundCount={roundCount}
          setMoveEnabled={setMoveEnabled}
          setPanEnabled={setPanEnabled}
          setZoomEnabled={setZoomEnabled}
          setRoundCount={setRoundCount}
        />
      </Paper>
      <Button
        href={`/game/play/sp/?mapId=${selectedMap}&allowMove=${moveEnabled}&allowPan=${panEnabled}&allowZoom=${zoomEnabled}&rounds=${roundCount}`}
        variant="contained"
        fullWidth
        disabled={!selectedMap}
      >
        Play
      </Button>
    </Container>
  </Box>
);

export default SingleplayerSettings;
