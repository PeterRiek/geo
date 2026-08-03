"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Divider } from "@mui/material";
import useGameSocket from "@/lib/hooks/use-game-socket";
import { generateRoomCode } from "@/lib/room-code";
import ModeSelect from "./menu/ModeSelect";
import SingleplayerSettings from "./menu/SingleplayerSettings";
import MultiplayerSettings from "./menu/MultiplayerSettings";
import RejoinBanner from "./menu/RejoinBanner";

interface RoomSettings {
  mapId: number;
  allowMove: boolean;
  allowPan: boolean;
  allowZoom: boolean;
  roundCount: number;
  roundTimeLimitSeconds: number;
  gameMode: "SINGLEPLAYER" | "MULTIPLAYER";
}

const CREATE_ROOM_TIMEOUT_MS = 10_000;

const GameMenu: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
}) => {
  const router = useRouter();
  const [maps, setMaps] = useState<{ id: number; name: string; imageUrl?: string }[]>([]);
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
  const [roundTimeLimitSeconds, setRoundTimeLimitSeconds] = useState(60);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [connectionError, setConnectionError] = useState<string>();
  const [pendingMode, setPendingMode] = useState<"singleplayer" | "multiplayer">();
  const scrollPositionRef = useRef<number>(0);
  const createTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { createRoom, createdRoomId, roomError, connectionStatus } =
    useGameSocket(undefined, accessToken);

  const clearCreateTimeout = () => {
    if (createTimeoutRef.current) {
      clearTimeout(createTimeoutRef.current);
      createTimeoutRef.current = undefined;
    }
  };

  const handleCreateRoom = (id: string, settings: RoomSettings) => {
    setConnectionError(undefined);
    setIsCreatingRoom(true);
    setPendingMode("multiplayer");
    createRoom(id, settings);

    clearCreateTimeout();
    createTimeoutRef.current = setTimeout(() => {
      setIsCreatingRoom(false);
      setConnectionError(
        "Couldn't reach the game server. Check your connection and try again."
      );
    }, CREATE_ROOM_TIMEOUT_MS);
  };

  const handleStartSingleplayer = () => {
    if (!selectedMap) return;
    setConnectionError(undefined);
    setIsCreatingRoom(true);
    setPendingMode("singleplayer");
    createRoom(generateRoomCode(), {
      mapId: selectedMap,
      allowMove: moveEnabled,
      allowPan: panEnabled,
      allowZoom: zoomEnabled,
      roundCount,
      roundTimeLimitSeconds,
      gameMode: "SINGLEPLAYER",
    });

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
      if (pendingMode === "singleplayer") {
        router.push(`/game/play/sp?sessionId=${createdRoomId}`);
      } else {
        router.push(`/game/play/mp?roomId=${createdRoomId}`);
      }
    }
  }, [createdRoomId, pendingMode, router]);

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
      setMaps(data.map((m: any) => ({ id: m.id, name: m.name, imageUrl: m.imageUrl })));
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
        pt: 4,
      }}
    >
      <RejoinBanner />
      <ModeSelect mode={mode} setMode={setMode} />
      <Divider sx={{ my: 1 }} />
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
            roundTimeLimitSeconds,
            setRoundTimeLimitSeconds,
            onStart: handleStartSingleplayer,
            isStarting: isCreatingRoom,
            startError: connectionError,
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
            roundTimeLimitSeconds,
            setRoundTimeLimitSeconds,
          }}
        />
      )}
    </Box>
  );
};

export default GameMenu;
