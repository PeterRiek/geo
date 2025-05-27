"use client";

import useMultiplayerSocket from "@/lib/hooks/use-multiplayer-socket";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";

const MapList: React.FC<{
  maps: { id: number; name: string }[];
  selectedMap?: number;
  setSelectedMap: (id: number) => void;
  scrollPositionRef: React.RefObject<number>;
}> = ({ maps, selectedMap, setSelectedMap, scrollPositionRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMapClick = (id: number) => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop;
    }
    setSelectedMap(id);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        maxHeight: "100%",
        width: "100%",
        gap: 1,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {maps.map((map) => (
        <ToggleButton
          key={map.id}
          value={map.id}
          selected={selectedMap === map.id}
          onClick={() => handleMapClick(map.id)}
          fullWidth
          color={selectedMap === map.id ? "primary" : "standard"}
          sx={{ borderRadius: 1 }}
        >
          {map.name}
        </ToggleButton>
      ))}
    </Box>
  );
};

const GameMenu: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
}) => {
  const [maps, setMaps] = useState<{ id: number; name: string }[]>([]);
  const [moveEnabled, setMoveEnabled] = useState(true);
  const [panEnabled, setPanEnabled] = useState(true);
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [selectedMap, setSelectedMap] = useState<number>();
  const handleSelectMap = useCallback((id: number) => {
    setSelectedMap(id);
  }, []);

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

  const [mode, setMode] = useState<"singleplayer" | "multiplayer">(
    "singleplayer"
  );

  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: "singleplayer" | "multiplayer"
  ) => {
    if (!newMode) return;
    setMode(newMode);
  };

  const scrollPositionRef = useRef<number>(0); // NEW
  const MapSelect = ({
    maps,
    selectedMap,
    setSelectedMap,
  }: {
    maps: { id: number; name: string }[];
    selectedMap?: number;
    setSelectedMap: (id: number) => void;
  }) => (
    <>
      {selectedMap && maps.find((m) => m.id === selectedMap) ? (
        <Typography gutterBottom>
          Selected Map:{" "}
          <strong>{maps.find((m) => m.id === selectedMap)?.name}</strong>
        </Typography>
      ) : (
        <Typography gutterBottom>No map selected</Typography>
      )}
      <Box
        sx={{
          height: "80%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {mapsLoading ? (
          <CircularProgress />
        ) : (
          <MapList
            maps={maps}
            selectedMap={selectedMap}
            setSelectedMap={setSelectedMap}
            scrollPositionRef={scrollPositionRef}
          />
        )}
      </Box>
    </>
  );

  const ModeSelect = () => (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleModeChange}
      color="primary"
      size="large"
    >
      <ToggleButton value="singleplayer" aria-label="singleplayer">
        Singleplayer
      </ToggleButton>
      <ToggleButton value="multiplayer" aria-label="multiplayer">
        Multiplayer
      </ToggleButton>
    </ToggleButtonGroup>
  );

  const NMPZSelect = () => (
    <Stack
      direction={"row"}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <ToggleButtonGroup
        value={[moveEnabled, panEnabled, zoomEnabled]}
        color="primary"
      >
        <ToggleButton
          value="move"
          selected={moveEnabled}
          onClick={() => setMoveEnabled((prev) => !prev)}
        >
          Move
        </ToggleButton>

        <ToggleButton
          value="pan"
          selected={panEnabled}
          onClick={() => setPanEnabled((prev) => !prev)}
        >
          Pan
        </ToggleButton>

        <ToggleButton
          value="zoom"
          selected={zoomEnabled}
          onClick={() => setZoomEnabled((prev) => !prev)}
        >
          Zoom
        </ToggleButton>
      </ToggleButtonGroup>
      <Button>Other </Button>
      <Button>Other </Button>
      <Button>Other </Button>
    </Stack>
  );

  const SingleplayerSettings = () => {
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
        <Container
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <Paper sx={{ p: 1 }}>
            <MapSelect
              maps={maps}
              selectedMap={selectedMap}
              setSelectedMap={setSelectedMap}
            />
          </Paper>
          <Paper sx={{ p: 1 }}>
            <NMPZSelect />
          </Paper>
          <Button
            href={`/game/play/sp/?mapId=${selectedMap}&allowMove=${moveEnabled}&allowPan=${panEnabled}&allowZoom=${zoomEnabled}`}
            variant="contained"
            fullWidth
            disabled={!selectedMap}
          >
            Play
          </Button>
        </Container>
      </Box>
    );
  };

  const MultiplayerSettings = () => {
    return <Box sx={{ height: "80%" }}></Box>;
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ModeSelect />
      <Divider sx={{ my: 4 }} />
      {mode === "singleplayer" ? (
        <SingleplayerSettings />
      ) : (
        <Paper
          sx={{
            p: 1,
            maxHeight: "20%",
            overflow: "hidden",
          }}
        >
          <MapSelect
            maps={maps}
            selectedMap={selectedMap}
            setSelectedMap={handleSelectMap}
          />
        </Paper>
      )}
    </Box>
  );
};

export default GameMenu;
