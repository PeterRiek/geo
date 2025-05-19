"use client";

import { Coords } from "@/types/geo";
import { useEffect, useRef, useState } from "react";

const useDuelSocket = (roomId: string, accessToken?: string) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [gameData, setGameData] = useState<{
    endTime: Number;
    targetLocation: Coords;
  } | null>(null);
  const [gameResult, setGameResult] = useState<{
    allGuesses: Map<string, Coords>;
    winner: string;
  } | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/duel?token=${accessToken}`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "JOIN_ROOM",
          data: { roomId },
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("ws.onmessage", message)
      switch (message.type) {
        case "GAME_START":
          setGameData(message.data);
          break;
        case "GAME_RESULT":
          setGameResult(message.data);
          break;
      }
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const submitResult = (guess: Coords) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "SUBMIT_RESULT",
        data: { guessLocation: guess },
      })
    );
  };

  return { gameData, gameResult, submitResult };
};

export default useDuelSocket;
