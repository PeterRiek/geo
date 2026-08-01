"use client";

import useMultiplayerSocket from "@/lib/hooks/use-multiplayer-socket";
import { Coords } from "@/types/geo";
import {
  Alert,
  Box,
  Button,
  Chip,
  Fade,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import React, { useEffect, useMemo, useRef, useState } from "react";
import InGameView from "../singleplayer/views/ingame-view";
import RoundResultView from "../singleplayer/views/round-result-view";
import { getCenterCoords, getDistanceInKm, getGuessrScore } from "@/lib/geo";
import { useSearchParams } from "next/navigation";
import PostgameView from "../singleplayer/views/postgame-view";
import GameFallback from "@/components/game/game-fallback";
import ConnectionBanner from "@/components/game/connection-banner";
import GameSettingsSummary from "@/components/game/game-settings-summary";

const MIN_PLAYERS_TO_START = 2;

export type GamePhase = "PREGAME" | "INGAME" | "ROUND_RESULT" | "POSTGAME";

const MultiplayerGame: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
  username,
}) => {
  const searchParams = useSearchParams();
  const roomId = useMemo(() => searchParams.get("roomId"), [searchParams]);
  // load searchparam.roomId into useMultiplaerSocker

  const { gameState, connectionStatus, join, startGame, nextRound, submitGuess, reconnect } =
    useMultiplayerSocket(roomId ?? "default", accessToken);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const phaseContainerRef = useRef<HTMLDivElement>(null);

  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [roundFinished, setRoundFinished] = useState(false);
  const [prevGamePhase, setPrevGamePhase] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    phaseContainerRef.current?.focus();
  }, [gameState?.roomPhase, gameState?.roundCount]);

  const startRound = () => {
    setGuessLocation(undefined);
    setRoundFinished(false);
  };

  const initRound = () => {
    if (!gameState) return;
    const guess = gameState.allGuesses[gameState.roundCount][username];
    if (!guess) return;
    setGuessLocation(guess);
    setRoundFinished(true);
  };

  useEffect(() => {
    if (!gameState || !gameState.roomPhase) return;
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
    // This effect only reacts to roomPhase transitions; gameState updates on
    // every socket tick and initRound/prevGamePhase are read from the closure
    // at transition time, so including them would refire on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.roomPhase]);

  useEffect(() => {
    const isActiveGame =
      gameState?.roomPhase === "ROUND_IN_PROGRESS" ||
      gameState?.roomPhase === "ROUND_RESULTS";
    if (!isActiveGame) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [gameState?.roomPhase]);

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

  const copyWithFallback = (text: string): boolean => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const succeeded = document.execCommand("copy");
    document.body.removeChild(textarea);
    return succeeded;
  };

  const handleCopyRoomCode = async () => {
    if (!roomId) return;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(roomId);
        setCodeCopied(true);
        return;
      } catch {
        // fall through to the legacy fallback below
      }
    }

    if (copyWithFallback(roomId)) {
      setCodeCopied(true);
    } else {
      setCopyError(true);
    }
  };

  const next = () => {
    nextRound();
  };

  let content: React.ReactNode;
  let phaseKey: string;

  if (!gameState) {
    phaseKey = "no-room";
    content = (
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
          <Button
            href="/game"
            variant="contained"
            size="large"
            onClick={() => setLeaving(true)}
          >
            BACK TO MENU
          </Button>
        </Stack>
      </Box>
    );
  } else if (!gameState.allGuesses || !gameState.roomPhase) {
    phaseKey = "loading";
    content = <GameFallback variant="loading" title="Loading game state..." />;
  } else {
    const gameSettings = gameState.roomSettings;

    if (gameState.roomPhase == "GAME_RESULTS") {
      phaseKey = "postgame";
      content = (
        <PostgameView
          username={username}
          allGuesses={gameState.allGuesses}
          allTargets={gameState.allTargets}
        />
      );
    } else if (gameState.roomPhase == "WAITING") {
      phaseKey = "waiting";
      const playerCount = gameState.players?.length ?? 0;
      const notEnoughPlayers = playerCount < MIN_PLAYERS_TO_START;

      content = (
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
          <GameSettingsSummary
            mapId={gameSettings.mapId}
            allowMove={gameSettings.allowMove}
            allowPan={gameSettings.allowPan}
            allowZoom={gameSettings.allowZoom}
            roundCount={gameSettings.roundCount}
          />
          <TextField
            label="Room Code"
            value={roomId ?? ""}
            slotProps={{
              input: {
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Copy room code">
                      <span>
                        <IconButton
                          onClick={handleCopyRoomCode}
                          disabled={!roomId}
                          edge="end"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Paper sx={{ p: 2, minWidth: 240 }}>
            <Typography variant="subtitle1" gutterBottom>
              Players ({playerCount})
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {gameState.players?.map((player) => (
                <Chip
                  key={player}
                  label={player === username ? `${player} (you)` : player}
                  color={player === username ? "primary" : "default"}
                />
              ))}
            </Stack>
          </Paper>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              href="/game"
              variant="outlined"
              size="large"
              onClick={() => setLeaving(true)}
            >
              Back
            </Button>
            <Button
              onClick={() => start()}
              variant="contained"
              size="large"
              disabled={notEnoughPlayers}
            >
              Start Game
            </Button>
          </Stack>
          {notEnoughPlayers && (
            <Typography variant="body2" color="text.secondary">
              Need at least {MIN_PLAYERS_TO_START} players to start
            </Typography>
          )}
        </Box>
      );
    } else if (
      gameState.roomPhase == "ROUND_IN_PROGRESS" &&
      gameState.allTargets[gameState.roundCount]
    ) {
      phaseKey = `ingame-${gameState.roundCount}`;
      const submittedCount = Object.keys(
        gameState.allGuesses[gameState.roundCount] ?? {}
      ).length;
      const totalPlayers = gameState.players?.length ?? 0;

      content = (
        <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
          <InGameView
            isMobile={isMobile}
            targetLocation={gameState.allTargets[gameState.roundCount]}
            guessLocation={guessLocation}
            roundFinished={roundFinished}
            targetVisible={false}
            guessingDisabled={!guessLocation || roundFinished}
            onMapClick={onMapClick}
            onGuess={onGuess}
            moveEnabled={gameSettings.allowMove}
            panEnabled={gameSettings.allowPan}
            zoomEnabled={gameSettings.allowZoom}
            round={gameState.roundCount + 1}
            totalRounds={gameSettings.roundCount}
          />
          {roundFinished && (
            <Chip
              label={`Waiting for other players... (${submittedCount}/${totalPlayers})`}
              sx={{
                position: "absolute",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 25,
                bgcolor: "rgba(0,0,0,0.7)",
                color: "#fff",
              }}
            />
          )}
        </Box>
      );
    } else if (gameState.roomPhase == "ROUND_RESULTS") {
      phaseKey = `result-${gameState.roundCount}`;
      const userGuess = gameState.allGuesses[gameState.roundCount][username];
      const otherGuesses = Object.entries(
        gameState.allGuesses[gameState.roundCount]
      )
        .filter(([_username]) => _username !== username)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(([_, guess]) => guess);

      const distance = userGuess
        ? getDistanceInKm(userGuess, gameState.allTargets[gameState.roundCount])
        : -1;
      const score = userGuess ? getGuessrScore(distance, 10_000) : 0;
      const center = userGuess
        ? getCenterCoords(userGuess, gameState.allTargets[gameState.roundCount])
        : { lat: 0, lng: 0 };
      const zoom = 1 + (score / 5000) * 8;

      content = (
        <RoundResultView
          score={score}
          distance={distance}
          guessLocation={userGuess}
          targetLocation={gameState.allTargets[gameState.roundCount]}
          otherGuessLocations={otherGuesses}
          center={center}
          zoom={zoom}
          onNext={next}
          isFinalRound={gameState.roundCount >= gameSettings.roundCount}
        />
      );
    } else {
      phaseKey = "unknown";
      content = <GameFallback variant="error" title="Unknown game state." />;
    }
  }

  return (
    <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
      {phaseKey !== "postgame" && !leaving && (
        <ConnectionBanner status={connectionStatus} onReconnect={reconnect} />
      )}
      <Fade in key={phaseKey} timeout={300}>
        <div
          ref={phaseContainerRef}
          tabIndex={-1}
          style={{ height: "100%", outline: "none" }}
        >
          {content}
        </div>
      </Fade>
      <Snackbar
        open={codeCopied}
        autoHideDuration={2000}
        onClose={() => setCodeCopied(false)}
        message="Room code copied!"
      />
      <Snackbar
        open={copyError}
        autoHideDuration={3000}
        onClose={() => setCopyError(false)}
      >
        <Alert severity="error" onClose={() => setCopyError(false)}>
          Couldn&apos;t copy the code. Please copy the Room Code manually.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MultiplayerGame;
