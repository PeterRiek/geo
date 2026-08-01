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
      flex: 1,
      minHeight: 0,
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
  >
    <Container
      sx={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pt: 1,
        pb: 3,
      }}
    >
      <Paper sx={{ p: 1, flex: 1, minHeight: 0, display: "flex" }}>
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
        size="large"
        fullWidth
        disabled={!selectedMap}
      >
        {selectedMap
          ? `Play ${
              (maps as { id: number; name: string }[]).find(
                (m) => m.id === selectedMap
              )?.name ?? ""
            }`
          : "Select a map"}
      </Button>
    </Container>
  </Box>
);

export default SingleplayerSettings;
