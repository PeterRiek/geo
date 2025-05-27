"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, Divider } from "@mui/material";
import useMultiplayerSocket from "@/lib/hooks/use-multiplayer-socket";
import ModeSelect from "./menu/ModeSelect";
import SingleplayerSettings from "./menu/SingleplayerSettings";
import MultiplayerSettings from "./menu/MultiplayerSettings";

const GameMenu: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
}) => {
  const [maps, setMaps] = useState<{ id: number; name: string }[]>([]);
  const [mapsLoading, setMapsLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<number>();
  const [roomId, setRoomId] = useState("");
  const [mode, setMode] = useState<"singleplayer" | "multiplayer">(
    "singleplayer"
  );
  const [multiplayer, setMultiplayer] = useState<"join" | "create">("join");
  const [moveEnabled, setMoveEnabled] = useState(true);
  const [panEnabled, setPanEnabled] = useState(true);
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [roundCount, setRoundCount] = useState(5);
  const scrollPositionRef = useRef<number>(0);

  const { createRoom } = useMultiplayerSocket(undefined, accessToken);

  useEffect(() => {
    const loadMaps = async () => {
      setMapsLoading(true);
      const resp = await fetch("/api/gamemap");
      const data = await resp.json();
      setMaps(data.map((m: any) => ({ id: m.id, name: m.name })));
      setMapsLoading(false);
    };
    loadMaps();
  }, []);

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
      <ModeSelect mode={mode} setMode={setMode} />
      <Divider sx={{ my: 4 }} />
      {mode === "singleplayer" ? (
        <SingleplayerSettings
          {...{
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
          }}
        />
      ) : (
        <MultiplayerSettings
          {...{
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
          }}
        />
      )}
    </Box>
  );
};

export default GameMenu;
