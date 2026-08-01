"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Divider } from "@mui/material";
import useMultiplayerSocket from "@/lib/hooks/use-multiplayer-socket";
import { generateRoomCode } from "@/lib/room-code";
import ModeSelect from "./menu/ModeSelect";
import SingleplayerSettings from "./menu/SingleplayerSettings";
import MultiplayerSettings from "./menu/MultiplayerSettings";

interface RoomSettings {
  mapId: number;
  allowMove: boolean;
  allowPan: boolean;
  allowZoom: boolean;
  roundCount: number;
}

const CREATE_ROOM_TIMEOUT_MS = 10_000;

const GameMenu: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
}) => {
  const router = useRouter();
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
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [connectionError, setConnectionError] = useState<string>();
  const scrollPositionRef = useRef<number>(0);
  const createTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { createRoom, createdRoomId, roomError, connectionStatus } =
    useMultiplayerSocket(undefined, accessToken);

  const clearCreateTimeout = () => {
    if (createTimeoutRef.current) {
      clearTimeout(createTimeoutRef.current);
      createTimeoutRef.current = undefined;
    }
  };

  const handleCreateRoom = (id: string, settings: RoomSettings) => {
    setConnectionError(undefined);
    setIsCreatingRoom(true);
    createRoom(id, settings);

    clearCreateTimeout();
    createTimeoutRef.current = setTimeout(() => {
      setIsCreatingRoom(false);
      setConnectionError(
        "Couldn't reach the game server. Check your connection and try again."
      );
    }, CREATE_ROOM_TIMEOUT_MS);
  };

  useEffect(() => {
    if (createdRoomId) {
      clearCreateTimeout();
      router.push(`/game/play/mp?roomId=${createdRoomId}`);
    }
  }, [createdRoomId, router]);

  useEffect(() => {
    if (roomError) {
      clearCreateTimeout();
      setIsCreatingRoom(false);
    }
  }, [roomError]);

  useEffect(() => {
    if (
      isCreatingRoom &&
      (connectionStatus === "error" || connectionStatus === "closed")
    ) {
      clearCreateTimeout();
      setIsCreatingRoom(false);
      setConnectionError(
        "Lost connection to the game server. Please try again."
      );
    }
  }, [connectionStatus, isCreatingRoom]);

  useEffect(() => clearCreateTimeout, []);

  useEffect(() => {
    if (mode === "multiplayer" && multiplayer === "create" && !roomId) {
      setRoomId(generateRoomCode());
    }
  }, [mode, multiplayer, roomId]);

  useEffect(() => {
    const loadMaps = async () => {
      setMapsLoading(true);
      const resp = await fetch("/api/gamemap");
      const data = await resp.json();
      // eslint-disable-next-line
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
            createRoom: handleCreateRoom,
            isCreatingRoom,
            roomError: roomError ?? connectionError,
            roundCount,
            setRoundCount,
          }}
        />
      )}
    </Box>
  );
};

export default GameMenu;
