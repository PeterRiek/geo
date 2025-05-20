"use client";

import { Coords } from "@/types/geo";
import { useEffect, useRef, useState } from "react";

const useMultiplayerSocket = (roomId: string, accessToken?: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [gameState, setGameState] = useState<any>();

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/duel?token=${accessToken}`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "JOIN",
          roomId,
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("ws.onmessage", message);
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
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const join = () => {
    socketRef.current?.send(
      JSON.stringify({
        type: "JOIN",
        roomId,
      })
    );
  };

  const startGame = () => {
    socketRef.current?.send(
      JSON.stringify({
        type: "START_GAME",
        roomId,
      })
    );
  };

  const nextRound = () => {
    socketRef.current?.send(
      JSON.stringify({
        type: "NEXT_ROUND",
        roomId,
      })
    );
  };

  const submitGuess = (guess: Coords) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "GUESS",
        roomId,
        payload: guess,
      })
    );
  };

  return { gameState, join, startGame, nextRound, submitGuess };
};

export default useMultiplayerSocket;
