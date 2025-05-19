"use client";

import { Coords } from "@/types/geo";
import {
  Box,
  CircularProgress,
  Container,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { getCenterCoords, getDistanceInKm, getGuessrScore } from "@/lib/geo";
import RoundResultView from "@/components/game/singleplayer/views/round-result-view";
import PregameView from "@/components/game/singleplayer/views/pregame-view";
import InGameView from "@/components/game/singleplayer/views/ingame-view";
import PostgameView from "@/components/game/singleplayer/views/postgame-view";

export type GamePhase = "PREGAME" | "INGAME" | "ROUND_RESULT" | "POSTGAME";

const SinglePlayerGame: React.FC<{ accessToken: string }> = ({
  accessToken,
}) => {
  const searchParams = useSearchParams();
  const playSet = useMemo(
    () => ({
      mapId: searchParams.get("mapId") || "world",
      allowMove: searchParams.get("allowMove") === "true",
      allowZoom: searchParams.get("allowZoom") === "true",
      allowPan: searchParams.get("allowPan") === "true",
    }),
    [searchParams]
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [gamePhase, setGamePhase] = useState<GamePhase>("PREGAME");
  const [gameRoundCount, setGameRoundCount] = useState(0);
  const [targetLocation, setTargetLocation] = useState<Coords>();
  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [roundFinished, setRoundFinished] = useState(true);
  const [loadingTargetLocation, setLoadingTargetLocation] = useState(false);

  useEffect(() => {
    const startGameSession = async () => {
      try {
        await fetch("/api/gamesession", {
          method: "POST",
        });
      } catch (err) {
        console.error("Failed to start gamesession.", err);
      }
    };
    startGameSession();
  }, [accessToken, playSet]);

  const fetchNextLocation = async () => {
    try {
      setLoadingTargetLocation(true);
      const res = await fetch(`/api/map/${playSet.mapId}/random`);
      if (!res.ok) throw new Error("Failed to fetch target location");
      const data = await res.json();
      setTargetLocation(data);
      setLoadingTargetLocation(false);
    } catch (err) {
      console.error("Error fetching location:", err);
    }
  };

  const gameNextPhase = () => {
    switch (gamePhase) {
      case "PREGAME":
        setRoundFinished(false);
        setGameRoundCount((i) => i + 1);
        fetchNextLocation();
        setGamePhase("INGAME");
        break;
      case "INGAME":
        setRoundFinished(true);
        setGamePhase("ROUND_RESULT");
        break;
      case "ROUND_RESULT":
        if (gameRoundCount >= 5) {
          setGamePhase("POSTGAME");
        } else {
          setGuessLocation(undefined);
          setTargetLocation(undefined);
          setRoundFinished(false);
          setGameRoundCount((i) => i + 1);
          fetchNextLocation();
          setGamePhase("INGAME");
        }
        break;
    }
  };

  const onMapClick = (pos: Coords) => {
    setGuessLocation(pos);
  };

  const onGuess = () => {
    gameNextPhase();
  };

  if (gamePhase === "PREGAME") {
    return <PregameView playSet={playSet} onStart={gameNextPhase} />;
  }

  if (!targetLocation) {
    if (loadingTargetLocation) {
      return (
        <Box
          height="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <CircularProgress size={64} />
        </Box>
      );
    }
    return <div>Error: No target location loaded.</div>;
  }

  if (gamePhase === "INGAME") {
    return (
      <InGameView
        isMobile={isMobile}
        targetLocation={targetLocation}
        guessLocation={guessLocation}
        roundFinished={roundFinished}
        onMapClick={onMapClick}
        onGuess={onGuess}
        moveEnabled={playSet.allowMove}
        panEnabled={playSet.allowPan}
        zoomEnabled={playSet.allowZoom}
      />
    );
  }

  if (!guessLocation) return <div>Error: No guess location.</div>;

  if (gamePhase === "ROUND_RESULT") {
    const distance = getDistanceInKm(guessLocation, targetLocation);
    const score = getGuessrScore(distance, 10_000);
    const center = getCenterCoords(guessLocation, targetLocation);
    const zoom = 1 + (score / 5000) * 8;

    return (
      <RoundResultView
        score={score}
        distance={distance}
        guessLocation={guessLocation}
        targetLocation={targetLocation}
        center={center}
        zoom={zoom}
        onNext={gameNextPhase}
        isFinalRound={gameRoundCount >= 5}
      />
    );
  }

  if (gamePhase === "POSTGAME") {
    return <PostgameView />;
  }

  return <div>Unknown game state</div>;
};

export default SinglePlayerGame;
