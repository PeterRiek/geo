"use client";

import useMultiplayerSocket from "@/lib/hooks/ws";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

const GameMenu: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
  username,
}) => {
  const [maps, setMaps] = useState<{ id: number; name: string }[]>([]);
  const [moveEnabled, setMoveEnabled] = useState(true);
  const [panEnabled, setPanEnabled] = useState(true);
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [selectedMap, setSelectedMap] = useState<number>();
  const [mapsLoading, setMapsLoading] = useState(true);

  const [roomId, setRoomId] = useState("");

  const { createRoom } = useMultiplayerSocket(undefined, accessToken);

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
                onClick={() =>
                  setSelectedMap(selectedMap === m.id ? undefined : m.id)
                }
                variant={m.id === selectedMap ? "contained" : "outlined"}
                color={m.id === selectedMap ? "primary" : "inherit"}
              >
                {m.id === selectedMap ? "SELECTED" : "SELECT"}
              </Button>
            </Paper>
          ))}
        </Stack>
      )}
      {/* Toggle Playset Controls */}
      <Stack direction="row" spacing={2} mt={2}>
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
      <Divider sx={{ my: 2 }} />

      <Typography variant="h4" mb={2}>
        Singleplayer
      </Typography>

      <Button
        href={`/game/play/sp/?mapId=${selectedMap}&allowMove=${moveEnabled}&allowPan=${panEnabled}&allowZoom=${zoomEnabled}`}
        variant="contained"
        disabled={!selectedMap}
      >
        Play Singleplayer
      </Button>
      <Divider sx={{ my: 2 }} />

      <Typography variant="h4">Multiplayer</Typography>
      <Stack spacing={2} direction="column" mt={2}>
        <TextField
          label="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          onClick={() =>
            createRoom(roomId, {
              allowMove: moveEnabled,
              allowPan: panEnabled,
              allowZoom: zoomEnabled,
              mapId: selectedMap ?? -1,
              roundCount: 5,
            })
          }
          href={`/game/play/mp?roomId=${roomId}`}
          disabled={!selectedMap || !roomId}
        >
          Play Multiplayer
        </Button>
      </Stack>
    </Container>
  );
};

export default GameMenu;
