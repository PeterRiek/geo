"use client";

import { Coords } from "@/types/geo";
import { useCallback, useEffect, useRef, useState } from "react";

interface GameSettings {
  mapId: number;
  allowMove: boolean;
  allowPan: boolean;
  allowZoom: boolean;
  roundCount: number;
}

interface GameState {
  roomId: string;
  roomPhase: string;
  roundCount: number;
  roomSettings: GameSettings;
  allTargets: Coords[];
  allGuesses: { [username: string]: Coords }[];
  players: string[];
}

export type ConnectionStatus = "connecting" | "open" | "closed" | "error";

const useMultiplayerSocket = (roomId?: string, accessToken?: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  const [gameState, setGameState] = useState<GameState>();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [reconnectKey, setReconnectKey] = useState(0);
  const [createdRoomId, setCreatedRoomId] = useState<string>();
  const [roomError, setRoomError] = useState<string>();

  const send = useCallback((message: object) => {
    const payload = JSON.stringify(message);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(payload);
    } else {
      pendingMessagesRef.current.push(payload);
    }
  }, []);

  useEffect(() => {
    setConnectionStatus("connecting");
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/duel?token=${accessToken}`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("open");
      if (roomId) {
        pendingMessagesRef.current.push(JSON.stringify({ type: "JOIN", roomId }));
      }
      pendingMessagesRef.current.forEach((payload) => ws.send(payload));
      pendingMessagesRef.current = [];
    };

    ws.onerror = () => {
      setConnectionStatus("error");
    };

    ws.onclose = () => {
      setConnectionStatus("closed");
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case "JOINED_ROOM":
          setGameState(message.payload);
          break;
        case "ROUND_STARTED":
          setGameState(message.payload);
          break;
        case "ROUND_RESULTS":
          setGameState(message.payload);
          break;
        case "GAME_RESULTS":
          setGameState(message.payload);
          break;
        case "GUESS_SUBMITTED":
          setGameState(message.payload);
          break;
        case "CREATED_ROOM":
          setCreatedRoomId(message.payload.roomId);
          break;
        case "ROOM_EXISTS":
          setRoomError("A room with this ID already exists.");
          break;
        case "ROOM_NOT_FOUND":
          setRoomError("Room not found.");
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId, accessToken, reconnectKey]);

  const reconnect = useCallback(() => {
    pendingMessagesRef.current = [];
    setReconnectKey((k) => k + 1);
  }, []);

  const createRoom = (_roomId: string, settings?: GameSettings) => {
    send({ type: "CREATE", roomId: _roomId, payload: settings });
  };

  const join = () => {
    send({ type: "JOIN", roomId });
  };

  const startGame = () => {
    send({ type: "START_GAME", roomId });
  };

  const nextRound = () => {
    send({ type: "NEXT_ROUND", roomId });
  };

  const submitGuess = (guess: Coords) => {
    send({ type: "GUESS", roomId, payload: guess });
  };

  return {
    gameState,
    connectionStatus,
    createdRoomId,
    roomError,
    join,
    createRoom,
    startGame,
    nextRound,
    submitGuess,
    reconnect,
  };
};

export default useMultiplayerSocket;
