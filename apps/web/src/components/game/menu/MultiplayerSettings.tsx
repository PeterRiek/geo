"use client";

import React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import MapSelect from "./MapSelect";
import NMPZSelect from "./NMPZSelect";

// eslint-disable-next-line
const MultiplayerSettings: React.FC<any> = ({
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
  roomId,
  setRoomId,
  multiplayer,
  setMultiplayer,
  createRoom,
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
    <Typography variant="h4" gutterBottom>
      Multiplayer
    </Typography>

    <ToggleButtonGroup
      value={multiplayer}
      exclusive
      onChange={(_, val) => val && setMultiplayer(val)}
      color="primary"
      sx={{ mb: 2 }}
    >
      <ToggleButton value="join">Join</ToggleButton>
      <ToggleButton value="create">Create</ToggleButton>
    </ToggleButtonGroup>

    <Container
      sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1 }}
    >
      {multiplayer === "join" ? (
        <>
          <Paper sx={{ p: 1 }}>
            <TextField
              label="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              fullWidth
            />
          </Paper>
          <Button
            href={`/game/play/mp?roomId=${roomId}`}
            variant="contained"
            fullWidth
            disabled={!roomId}
          >
            Join Game
          </Button>
        </>
      ) : (
        <>
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
          <Paper sx={{ p: 1 }}>
            <TextField
              label="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              fullWidth
            />
          </Paper>
          <Button
            onClick={() => {
              createRoom(roomId, {
                allowMove: moveEnabled,
                allowPan: panEnabled,
                allowZoom: zoomEnabled,
                mapId: selectedMap ?? -1,
                roundCount: roundCount,
              });
            }}
            href={`/game/play/mp?roomId=${roomId}`}
            variant="contained"
            fullWidth
            disabled={!selectedMap || !roomId}
          >
            Create Game
          </Button>
        </>
      )}
    </Container>
  </Box>
);

export default MultiplayerSettings;
