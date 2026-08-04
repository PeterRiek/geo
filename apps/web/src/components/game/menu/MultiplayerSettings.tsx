"use client";

import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Popover,
  Snackbar,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LoginIcon from "@mui/icons-material/Login";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import SelectedMapSummary from "./SelectedMapSummary";
import NMPZSelect from "./NMPZSelect";

// Matches the Rounds/Time buttons in NMPZSelect (same button styling, same button+Popover
// pattern) so multiplayer-only settings read as part of the same settings row.
const TimePressureButton: React.FC<{
  timePressure: boolean;
  setTimePressure: (val: boolean) => void;
}> = ({ timePressure, setTimePressure }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Button
        variant="outlined"
        color={timePressure ? "primary" : undefined}
        startIcon={<SettingsIcon />}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          minWidth: 0,
          height: 36.5,
          px: { xs: 1.5, sm: 2 },
          "& .MuiButton-startIcon": { mx: { xs: 0, sm: undefined } },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          Settings
        </Box>
      </Button>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Stack spacing={1} sx={{ p: 2, width: 260 }}>
          <FormControlLabel
            control={
              <Switch
                checked={timePressure}
                onChange={(e) => setTimePressure(e.target.checked)}
              />
            }
            label="Time pressure"
          />
          <Typography variant="body2" color="text.secondary">
            When on, a guess clamps everyone&apos;s remaining time down to 10s.
          </Typography>
        </Stack>
      </Popover>
    </>
  );
};

// eslint-disable-next-line
const MultiplayerSettings: React.FC<any> = ({
  maps,
  selectedMap,
  mapsLoading,
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
  roundTimeLimitSeconds,
  setRoundTimeLimitSeconds,
  timePressure,
  setTimePressure,
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
      flex: 1,
      minHeight: 0,
      width: "100%",
      display: "flex",
      flexDirection: "column",
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
      <ToggleButton value="join">
        <LoginIcon sx={{ mr: 1 }} fontSize="small" />
        Join
      </ToggleButton>
      <ToggleButton value="create">
        <AddCircleOutlineIcon sx={{ mr: 1 }} fontSize="small" />
        Create
      </ToggleButton>
    </ToggleButtonGroup>

    <Container
      maxWidth="md"
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
            size="large"
            fullWidth
            disabled={!roomId}
          >
            Join Game
          </Button>
        </>
      ) : (
        <>
          <Paper sx={{ overflow: "hidden" }}>
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
              extraControls={
                <TimePressureButton
                  timePressure={timePressure}
                  setTimePressure={setTimePressure}
                />
              }
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
                roundTimeLimitSeconds: roundTimeLimitSeconds,
                gameMode: "MULTIPLAYER",
                timePressure: timePressure,
              });
            }}
            variant="contained"
            size="large"
            fullWidth
            loading={isCreatingRoom}
            disabled={!selectedMap || !roomId || isCreatingRoom}
          >
            {selectedMap
              ? `Create Game — ${
                  (maps as { id: number; name: string }[]).find(
                    (m) => m.id === selectedMap
                  )?.name ?? ""
                }`
              : "Select a map"}
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
