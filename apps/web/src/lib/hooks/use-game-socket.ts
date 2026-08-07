"use client";

import { Coords } from "@/types/geo";
import { useCallback, useEffect, useRef, useState } from "react";

export type GameMode = "SINGLEPLAYER" | "MULTIPLAYER";

interface GameSettings {
  mapId: number;
  allowMove: boolean;
  allowPan: boolean;
  allowZoom: boolean;
  roundCount: number;
  roundTimeLimitSeconds: number;
  gameMode: GameMode;
  timePressure?: boolean;
}

interface GameState {
  roomId: string;
  roomPhase: string;
  roundCount: number;
  roomSettings: GameSettings;
  allTargets: Coords[];
  allGuesses: { [username: string]: Coords }[];
  allDistances: { [username: string]: number | null }[];
  allScores: { [username: string]: number }[];
  players: string[];
  roundEndsAt?: number;
  disconnectedPlayers?: string[];
  readyPlayers?: string[];
  readyDeadline?: number;
  serverTime?: number;
}

export type ConnectionStatus = "connecting" | "open" | "closed" | "error";

const useGameSocket = (roomId?: string, accessToken?: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  // serverTime-on-arrival minus our own Date.now() — added to Date.now() elsewhere to approximate
  // the server's clock, so countdowns/auto-submit aren't thrown off by the client's own clock skew.
  const clockOffsetRef = useRef(0);
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
      `${process.env.NEXT_PUBLIC_WS_URL}/game?token=${accessToken}`
    );
    socketRef.current = ws;

    // A stale socket from a superseded effect run (React StrictMode's dev
    // double-invoke, or a real reconnect) can still fire onclose/onerror
    // after the *new* socket has already opened — without this guard, that
    // late event would clobber the current, correct "open" status.
    const isCurrent = () => socketRef.current === ws;

    ws.onopen = () => {
      if (!isCurrent()) return;
      setConnectionStatus("open");
      if (roomId) {
        pendingMessagesRef.current.push(JSON.stringify({ type: "JOIN", roomId }));
      }
      pendingMessagesRef.current.forEach((payload) => ws.send(payload));
      pendingMessagesRef.current = [];
    };

    ws.onerror = () => {
      if (!isCurrent()) return;
      setConnectionStatus("error");
    };

    ws.onclose = () => {
      if (!isCurrent()) return;
      setConnectionStatus("closed");
    };

    ws.onmessage = (event) => {
      if (!isCurrent()) return;
      const message = JSON.parse(event.data);
      const applyGameState = (payload: GameState) => {
        if (payload.serverTime) {
          clockOffsetRef.current = payload.serverTime - Date.now();
        }
        setGameState(payload);
      };
      switch (message.type) {
        case "JOINED_ROOM":
          applyGameState(message.payload);
          break;
        case "ROUND_STARTED":
          applyGameState(message.payload);
          break;
        case "ROUND_RESULTS":
          applyGameState(message.payload);
          break;
        case "GAME_RESULTS":
          applyGameState(message.payload);
          break;
        case "GUESS_SUBMITTED":
          applyGameState(message.payload);
          break;
        case "PLAYER_STATUS":
          applyGameState(message.payload);
          break;
        case "READY_STATUS":
          applyGameState(message.payload);
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
        case "MAP_NOT_ACCESSIBLE":
          setRoomError("That map isn't available to you anymore. Pick another one.");
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

  const setReady = (ready: boolean) => {
    send({ type: "READY", roomId, payload: ready });
  };

  const nextRound = () => {
    send({ type: "NEXT_ROUND", roomId });
  };

  const submitGuess = (guess: Coords) => {
    send({ type: "GUESS", roomId, payload: guess });
  };

  // Best-effort: lets the server fall back to this pin if the round times out before the player
  // hits submit (see GameService#updatePendingGuess). Not queued like `send` — if the socket isn't
  // open right now there's no point replaying a stale pin position once it reconnects.
  const movePin = (pos: Coords) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "PIN_MOVED", roomId, payload: pos }));
    }
  };

  return {
    gameState,
    connectionStatus,
    createdRoomId,
    roomError,
    clockOffset: clockOffsetRef.current,
    join,
    createRoom,
    setReady,
    nextRound,
    submitGuess,
    movePin,
    reconnect,
  };
};

export default useGameSocket;
