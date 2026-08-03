"use client";

import React from "react";
import { Alert, Box, Button, Container, Paper } from "@mui/material";
import SelectedMapSummary from "./SelectedMapSummary";
import NMPZSelect from "./NMPZSelect";

// eslint-disable-next-line
const SingleplayerSettings: React.FC<any> = ({
  maps,
  selectedMap,
  mapsLoading,
  moveEnabled,
  panEnabled,
  zoomEnabled,
  setMoveEnabled,
  setPanEnabled,
  setZoomEnabled,
  roundCount,
  setRoundCount,
  roundTimeLimitSeconds,
  setRoundTimeLimitSeconds,
  onStart,
  isStarting,
  startError,
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
      <Paper sx={{ p: 1 }}>
        <SelectedMapSummary maps={maps} selectedMap={selectedMap} mapsLoading={mapsLoading} />
      </Paper>
      <Paper sx={{ p: 1 }}>
        <NMPZSelect
          moveEnabled={moveEnabled}
          panEnabled={panEnabled}
          zoomEnabled={zoomEnabled}
          roundCount={roundCount}
          roundTimeLimitSeconds={roundTimeLimitSeconds}
          setMoveEnabled={setMoveEnabled}
          setPanEnabled={setPanEnabled}
          setZoomEnabled={setZoomEnabled}
          setRoundCount={setRoundCount}
          setRoundTimeLimitSeconds={setRoundTimeLimitSeconds}
        />
      </Paper>
      {startError && <Alert severity="error">{startError}</Alert>}
      <Button
        onClick={onStart}
        variant="contained"
        size="large"
        fullWidth
        loading={isStarting}
        disabled={!selectedMap || isStarting}
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
