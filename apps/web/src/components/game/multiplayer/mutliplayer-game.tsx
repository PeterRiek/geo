"use client";

import useMultiplayerSocket from "@/lib/hooks/ws";
import { Coords } from "@/types/geo";
import {
  Box,
  Button,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import InGameView from "../singleplayer/views/ingame-view";
import RoundResultView from "../singleplayer/views/round-result-view";
import { getCenterCoords, getDistanceInKm, getGuessrScore } from "@/lib/geo";
import { useSearchParams } from "next/navigation";
import PostgameView from "../singleplayer/views/postgame-view";

export type GamePhase = "PREGAME" | "INGAME" | "ROUND_RESULT" | "POSTGAME";

const MultiplayerGame: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
  username,
}) => {
  const searchParams = useSearchParams();
  const roomId = useMemo(() => searchParams.get("roomId"), [searchParams]);
  // load searchparam.roomId into useMultiplaerSocker

  const { gameState, join, startGame, nextRound, submitGuess } =
    useMultiplayerSocket(roomId ?? "default", accessToken);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [roundFinished, setRoundFinished] = useState(false);
  const [prevGamePhase, setPrevGamePhase] = useState("");

  const startRound = () => {
    setGuessLocation(undefined);
    setRoundFinished(false);
  };

  const initRound = () => {
    if (!gameState) return;
    const guess = gameState.allGuesses[username];
    if (!guess) return;
    setGuessLocation(guess);
    setRoundFinished(true);
  };

  useEffect(() => {
    if (!gameState || !gameState.roomPhase) return;
    console.log(prevGamePhase, "->", gameState.roomPhase);
    if (prevGamePhase == "" && gameState.roomPhase == "ROUND_IN_PROGRESS") {
      initRound();
    }
    if (
      prevGamePhase == "WAITING" &&
      gameState.roomPhase == "ROUND_IN_PROGRESS"
    ) {
      startRound();
    }
    if (
      prevGamePhase == "ROUND_RESULTS" &&
      gameState.roomPhase == "ROUND_IN_PROGRESS"
    ) {
      startRound();
    }
    setPrevGamePhase(gameState.roomPhase);
  }, [gameState?.roomPhase]);

  useEffect(() => {}, []);

  const onMapClick = (pos: Coords) => {
    if (roundFinished) return;
    setGuessLocation(pos);
  };

  const onGuess = () => {
    if (!guessLocation) return;
    submitGuess(guessLocation);
    setRoundFinished(true);
  };

  const start = () => {
    startGame();
  };

  const next = () => {
    nextRound();
  };

  if (!gameState)
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          p: 4,
        }}
      >
        <Stack>
          <Typography variant="h2" textAlign="center">
            In room
          </Typography>
          <Typography variant="h2" fontWeight={500} textAlign="center">
            {roomId}
          </Typography>
        </Stack>
        <Stack gap={1}>
          <Button onClick={() => join()} variant="contained" size="large">
            TRY TO REJOIN
          </Button>
          <Button href="/game" variant="contained" size="large">
            BACK TO MENU
          </Button>
        </Stack>
      </Box>
    );

  const isGameStateReady =
    gameState && gameState.allGuesses && gameState.roomPhase;

  if (!isGameStateReady) {
    return <div>Loading game state...</div>;
  }

  const gameSettings = gameState.roomSettings;

  if (gameState.roomPhase == "GAME_RESULTS") return <PostgameView />;

  if (gameState.roomPhase == "WAITING")
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          p: 4,
        }}
      >
        <Typography variant="h1" textAlign="center">
          Waiting to start...
        </Typography>
        <Button onClick={() => start()} variant="contained" size="large">
          Start Game
        </Button>
      </Box>
    );

  if (gameState.roomPhase == "ROUND_IN_PROGRESS" && gameState.targetLocation)
    return (
      <InGameView
        isMobile={isMobile}
        targetLocation={gameState.targetLocation}
        guessLocation={guessLocation}
        roundFinished={roundFinished}
        targetVisible={false}
        guessingDisabled={!guessLocation || roundFinished}
        onMapClick={onMapClick}
        onGuess={onGuess}
        moveEnabled={gameSettings.allowMove}
        panEnabled={gameSettings.allowPan}
        zoomEnabled={gameSettings.allowZoom}
      />
    );

  if (!guessLocation) return <div>Error: No guess location.</div>;

  if (gameState.roomPhase == "ROUND_RESULTS") {
    const userGuess = gameState.allGuesses[username];
    const otherGuesses = Object.entries(gameState.allGuesses)
      .filter(([_username]) => _username !== username)
      .map(([_, guess]) => guess);

    const distance = getDistanceInKm(guessLocation, gameState.targetLocation);
    const score = getGuessrScore(distance, 10_000);
    const center = getCenterCoords(guessLocation, gameState.targetLocation);
    const zoom = 1 + (score / 5000) * 8;

    return (
      <RoundResultView
        score={score}
        distance={distance}
        guessLocation={userGuess}
        targetLocation={gameState.targetLocation}
        otherGuessLocations={otherGuesses}
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
