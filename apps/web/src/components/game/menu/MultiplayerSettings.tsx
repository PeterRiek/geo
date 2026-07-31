"use client";

import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
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
  isCreatingRoom,
  roomError,
  roundCount,
  setRoundCount,
}) => {
  const [linkCopied, setLinkCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const copyWithFallback = (text: string): boolean => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    return succeeded;
  };

  const handleCopyInviteLink = async () => {
    const link = `${window.location.origin}/game/play/mp?roomId=${roomId}`;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(link);
        setLinkCopied(true);
        return;
      } catch {
        // fall through to the legacy fallback below
      }
    }

    if (copyWithFallback(link)) {
      setLinkCopied(true);
    } else {
      setCopyError(true);
    }
  };

  return (
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
              helperText="Share this code, or copy an invite link for your friends"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Copy invite link">
                        <span>
                          <IconButton
                            onClick={handleCopyInviteLink}
                            disabled={!roomId}
                            edge="end"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Paper>
          {roomError && <Alert severity="error">{roomError}</Alert>}
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
            variant="contained"
            fullWidth
            loading={isCreatingRoom}
            disabled={!selectedMap || !roomId || isCreatingRoom}
          >
            Create Game
          </Button>
        </>
      )}
    </Container>

    <Snackbar
      open={linkCopied}
      autoHideDuration={2000}
      onClose={() => setLinkCopied(false)}
      message="Invite link copied!"
    />
    <Snackbar
      open={copyError}
      autoHideDuration={3000}
      onClose={() => setCopyError(false)}
    >
      <Alert severity="error" onClose={() => setCopyError(false)}>
        Couldn&apos;t copy the link. Please copy the Room ID manually.
      </Alert>
    </Snackbar>
  </Box>
  );
};

export default MultiplayerSettings;
