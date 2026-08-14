"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Divider } from "@mui/material";
import useGameSocket from "@/lib/hooks/use-game-socket";
import { generateRoomCode } from "@/lib/room-code";
import { apiFetch } from "@/lib/api-fetch";
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
  timePressure?: boolean;
}

const CREATE_ROOM_TIMEOUT_MS = 10_000;

const GameMenu: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [maps, setMaps] = useState<
    {
      id: number;
      name: string;
      imageUrl?: string;
      description?: string;
      maxErrorDistanceKm?: number;
      ownerUsername?: string;
      locationCount?: number;
    }[]
  >([]);
  const [mapsLoading, setMapsLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<number>();
  const [createRoomId, setCreateRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [mode, setMode] = useState<"singleplayer" | "multiplayer">(
    "singleplayer"
  );
  const [multiplayer, setMultiplayer] = useState<"join" | "create">("create");
  const [moveEnabled, setMoveEnabled] = useState(true);
  const [panEnabled, setPanEnabled] = useState(true);
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [roundCount, setRoundCount] = useState(5);
  const [roundTimeLimitSeconds, setRoundTimeLimitSeconds] = useState(60);
  const [timePressure, setTimePressure] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [connectionError, setConnectionError] = useState<string>();
  const [pendingMode, setPendingMode] = useState<"singleplayer" | "multiplayer">();
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
    if (mode === "multiplayer" && multiplayer === "create" && !createRoomId) {
      setCreateRoomId(generateRoomCode());
    }
  }, [mode, multiplayer, createRoomId]);

  useEffect(() => {
    const loadMaps = async () => {
      setMapsLoading(true);
      const resp = await apiFetch("/api/gamemap");
      const data = await resp.json();
      setMaps(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((m: any) => ({
          id: m.id,
          name: m.name,
          imageUrl: m.imageUrl,
          description: m.description,
          maxErrorDistanceKm: m.maxErrorDistanceKm,
          ownerUsername: m.ownerUsername,
          locationCount: m.locationCount,
        }))
      );
      setMapsLoading(false);
    };
    loadMaps();
  }, []);

  useEffect(() => {
    const mapIdParam = searchParams.get("mapId");
    if (mapIdParam) {
      const mapId = Number(mapIdParam);
      if (Number.isFinite(mapId)) setSelectedMap(mapId);
    }

    const modeParam = searchParams.get("mode");
    if (modeParam === "singleplayer" || modeParam === "multiplayer") {
      setMode(modeParam);
      // They're relaunching settings into a fresh room, not rejoining the old (finished) one.
      if (modeParam === "multiplayer") setMultiplayer("create");
    }

    const roundCountParam = searchParams.get("roundCount");
    if (roundCountParam) {
      const n = Number(roundCountParam);
      if (Number.isFinite(n)) setRoundCount(n);
    }

    const roundTimeLimitParam = searchParams.get("roundTimeLimitSeconds");
    if (roundTimeLimitParam) {
      const n = Number(roundTimeLimitParam);
      if (Number.isFinite(n)) setRoundTimeLimitSeconds(n);
    }

    const allowMoveParam = searchParams.get("allowMove");
    if (allowMoveParam !== null) setMoveEnabled(allowMoveParam === "true");
    const allowPanParam = searchParams.get("allowPan");
    if (allowPanParam !== null) setPanEnabled(allowPanParam === "true");
    const allowZoomParam = searchParams.get("allowZoom");
    if (allowZoomParam !== null) setZoomEnabled(allowZoomParam === "true");

    const timePressureParam = searchParams.get("timePressure");
    if (timePressureParam !== null) setTimePressure(timePressureParam === "true");
  }, [searchParams]);

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
            startError: roomError ?? connectionError,
          }}
        />
      ) : (
        <MultiplayerSettings
          {...{
            maps,
            selectedMap,
            setSelectedMap,
            mapsLoading,
            moveEnabled,
            panEnabled,
            zoomEnabled,
            setMoveEnabled,
            setPanEnabled,
            setZoomEnabled,
            createRoomId,
            setCreateRoomId,
            joinRoomId,
            setJoinRoomId,
            multiplayer,
            setMultiplayer,
            createRoom: handleCreateRoom,
            isCreatingRoom,
            roomError: roomError ?? connectionError,
            roundCount,
            setRoundCount,
            roundTimeLimitSeconds,
            setRoundTimeLimitSeconds,
            timePressure,
            setTimePressure,
          }}
        />
      )}
    </Box>
  );
};

export default GameMenu;
