"use client";

import { Coords } from "@/types/geo";
import { Fade, useMediaQuery, useTheme } from "@mui/material";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCenterCoords, getDistanceInKm, getGuessrScore } from "@/lib/geo";
import RoundResultView from "@/components/game/singleplayer/views/round-result-view";
import PregameView from "@/components/game/singleplayer/views/pregame-view";
import InGameView from "@/components/game/singleplayer/views/ingame-view";
import PostgameView from "@/components/game/singleplayer/views/postgame-view";
import GameFallback from "@/components/game/game-fallback";

export type GamePhase = "PREGAME" | "INGAME" | "ROUND_RESULT" | "POSTGAME";

const SinglePlayerGame: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
  username,
}) => {
  const searchParams = useSearchParams();
  const playSet = useMemo(
    () => ({
      mapId: searchParams.get("mapId") || "world",
      allowMove: searchParams.get("allowMove") === "true",
      allowZoom: searchParams.get("allowZoom") === "true",
      allowPan: searchParams.get("allowPan") === "true",
      roundCount: Number.parseInt(searchParams.get("rounds") ?? "5") ?? 5,
    }),
    [searchParams]
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const phaseContainerRef = useRef<HTMLDivElement>(null);

  const [gamePhase, setGamePhase] = useState<GamePhase>("PREGAME");
  const [gameRoundCount, setGameRoundCount] = useState(0);
  const [targetLocation, setTargetLocation] = useState<Coords>();
  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [roundFinished, setRoundFinished] = useState(true);
  const [locationLoadError, setLocationLoadError] = useState(false);
  const [allGuesses, setAllGuesses] = useState<
    { [username: string]: Coords }[]
  >([]);
  const [allTargets, setAllTargets] = useState<Coords[]>([]);

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

  useEffect(() => {
    phaseContainerRef.current?.focus();
  }, [gamePhase]);

  useEffect(() => {
    const isActiveGame = gamePhase === "INGAME" || gamePhase === "ROUND_RESULT";
    if (!isActiveGame) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [gamePhase]);

  const fetchNextLocation = async () => {
    try {
      setLocationLoadError(false);
      const res = await fetch(`/api/gamemap/${playSet.mapId}/locations/random`);
      if (!res.ok) throw new Error("Failed to fetch target location");
      const data = await res.json();
      setTargetLocation(data);
    } catch (err) {
      console.error("Error fetching location:", err);
      setLocationLoadError(true);
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
        if (guessLocation)
          setAllGuesses([...allGuesses, { [username]: guessLocation }]);
        if (targetLocation) setAllTargets([...allTargets, targetLocation]);

        if (gameRoundCount >= playSet.roundCount) {
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

  let content: React.ReactNode;
  let phaseKey = gamePhase;

  if (gamePhase === "PREGAME") {
    content = <PregameView playSet={playSet} onStart={gameNextPhase} />;
  } else if (!targetLocation) {
    phaseKey = `${gamePhase}-loading` as GamePhase;
    if (locationLoadError) {
      content = (
        <GameFallback
          variant="error"
          title="Couldn't load a location"
          description="Something went wrong fetching the next round. Please try again."
          onRetry={fetchNextLocation}
        />
      );
    } else {
      content = <GameFallback variant="loading" title="Loading round..." />;
    }
  } else if (gamePhase === "INGAME") {
    content = (
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
        round={gameRoundCount}
        totalRounds={playSet.roundCount}
      />
    );
  } else if (!guessLocation) {
    content = (
      <GameFallback variant="error" title="No guess was recorded for this round." />
    );
  } else if (gamePhase === "ROUND_RESULT") {
    const distance = getDistanceInKm(guessLocation, targetLocation);
    const score = getGuessrScore(distance, 10_000);
    const center = getCenterCoords(guessLocation, targetLocation);
    const zoom = 1 + (score / 5000) * 8;

    content = (
      <RoundResultView
        score={score}
        distance={distance}
        guessLocation={guessLocation}
        targetLocation={targetLocation}
        center={center}
        zoom={zoom}
        onNext={gameNextPhase}
        isFinalRound={gameRoundCount >= playSet.roundCount}
      />
    );
  } else if (gamePhase === "POSTGAME") {
    content = (
      <PostgameView
        allGuesses={allGuesses}
        allTargets={allTargets}
        username={username}
      />
    );
  } else {
    content = <GameFallback variant="error" title="Unknown game state." />;
  }

  return (
    <Fade in key={phaseKey} timeout={300}>
      <div
        ref={phaseContainerRef}
        tabIndex={-1}
        style={{ height: "100%", outline: "none" }}
      >
        {content}
      </div>
    </Fade>
  );
};

export default SinglePlayerGame;
