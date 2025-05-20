"use client";

import useMultiplayerSocket from "@/lib/hooks/ws";
import { Coords } from "@/types/geo";
import { Box, Button, Stack, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import StreetViewPano from "../street-view-pano";
import GuessrMobileUI from "../guessing-ui-mobile";
import GuessrUI from "../guessing-ui";
import InGameView from "../singleplayer/views/ingame-view";
import RoundResultView from "../singleplayer/views/round-result-view";
import { getCenterCoords, getDistanceInKm, getGuessrScore } from "@/lib/geo";

export type GamePhase = "PREGAME" | "INGAME" | "ROUND_RESULT" | "POSTGAME";

const MultiplayerGame: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
  username,
}) => {
  const { gameState, join, startGame, nextRound, submitGuess } =
    useMultiplayerSocket("Room_Y", accessToken);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [roundFinished, setRoundFinished] = useState(false);

  useEffect(() => {
    if (!gameState) return;

    const guess = gameState.allGuesses[username];
    if (guess) {
      setGuessLocation({ ...guess });
      setRoundFinished(true);
      console.log("round finished", true, roundFinished)
    } else {
      setGuessLocation(undefined);
      setRoundFinished(false);
      console.log("reset round finished")
    }
  }, [gameState, username]);

  const onMapClick = (pos: Coords) => {
    console.log("clicked", roundFinished);
    if (roundFinished) return;
    setGuessLocation(pos);
  };

  const onGuess = () => {
    if (!guessLocation) return;
    setRoundFinished(true);
    submitGuess(guessLocation);
  };

  const start = () => {
    startGame();
    setRoundFinished(false);
  };

  const next = () => {
    nextRound();
    setRoundFinished(false);
  };

  if (!gameState) return <Button onClick={() => join()}>JOIN</Button>;

  const isGameStateReady =
    gameState && gameState.allGuesses && gameState.roomPhase;

  if (!isGameStateReady) {
    return <div>Loading game state...</div>;
  }

  const gameSettings = gameState.roomSettings;

  if (gameState.roomPhase == "WAITING")
    return <Button onClick={() => start()}>START</Button>;

  if (gameState.roomPhase == "ROUND_IN_PROGRESS" && gameState.targetLocation)
    return (
      <InGameView
        isMobile={isMobile}
        targetLocation={gameState.targetLocation}
        guessLocation={guessLocation}
        roundFinished={roundFinished}
        onMapClick={onMapClick}
        onGuess={onGuess}
        moveEnabled={gameSettings.allowMove}
        panEnabled={gameSettings.allowPan}
        zoomEnabled={gameSettings.allowZoom}
      />
    );

  if (!guessLocation) return <div>Error: No guess location.</div>;

  if (gameState.roomPhase == "ROUND_RESULTS") {
    const distance = getDistanceInKm(guessLocation, gameState.targetLocation);
    const score = getGuessrScore(distance, 10_000);
    const center = getCenterCoords(guessLocation, gameState.targetLocation);
    const zoom = 1 + (score / 5000) * 8;

    return (
      <RoundResultView
        score={score}
        distance={distance}
        guessLocation={guessLocation}
        targetLocation={gameState.targetLocation}
        center={center}
        zoom={zoom}
        onNext={next}
        isFinalRound={gameState.roundCount >= gameSettings.roundCount}
      />
    );
  }

  return <div>DONE</div>;
};

export default MultiplayerGame;
