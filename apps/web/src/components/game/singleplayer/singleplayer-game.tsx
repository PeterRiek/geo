"use client";

import { Coords } from "@/types/geo";
import { Fade, useMediaQuery, useTheme } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { getCenterCoords } from "@/lib/geo";
import RoundResultView from "@/components/game/singleplayer/views/round-result-view";
import InGameView from "@/components/game/singleplayer/views/ingame-view";
import PostgameView from "@/components/game/singleplayer/views/postgame-view";
import GameFallback from "@/components/game/game-fallback";
import ConnectionBanner from "@/components/game/connection-banner";
import useGameSocket from "@/lib/hooks/use-game-socket";
import useCountdown from "@/lib/hooks/use-countdown";
import { buildGameMenuHref } from "@/lib/game-settings-url";

const SinglePlayerGame: React.FC<{ accessToken: string; username: string }> = ({
  accessToken,
  username,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? undefined;

  const {
    gameState,
    connectionStatus,
    join,
    submitGuess,
    movePin,
    nextRound,
    reconnect,
    roomError,
    clockOffset,
    forfeit,
  } = useGameSocket(sessionId, accessToken);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const phaseContainerRef = useRef<HTMLDivElement>(null);

  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [roundFinished, setRoundFinished] = useState(false);
  const [prevGamePhase, setPrevGamePhase] = useState("");

  // Mirrors of the two states above, kept fresh every render — the deadline-triggered auto-submit
  // below schedules its setTimeout once per round rather than every render, so it can't rely on a
  // closure over guessLocation/roundFinished (that would freeze at whatever they were at round
  // start); it reads these instead so it always sees the latest pin placement.
  const guessLocationRef = useRef(guessLocation);
  guessLocationRef.current = guessLocation;
  const roundFinishedRef = useRef(roundFinished);
  roundFinishedRef.current = roundFinished;

  const secondsLeft = useCountdown(
    gameState?.roomPhase === "ROUND_IN_PROGRESS" ? gameState.roundEndsAt : undefined,
    clockOffset
  );

  useEffect(() => {
    phaseContainerRef.current?.focus();
  }, [gameState?.roomPhase, gameState?.roundCount]);

  const amForfeited = gameState?.inactivePlayers?.includes(username) ?? false;
  useEffect(() => {
    if (amForfeited) {
      router.push("/game");
    }
  }, [amForfeited, router]);

  const initRound = () => {
    if (!gameState) return;
    const guess = gameState.allGuesses[gameState.roundCount]?.[username];
    if (!guess) return;
    setGuessLocation(guess);
    setRoundFinished(true);
  };

  useEffect(() => {
    if (!gameState || !gameState.roomPhase) return;
    if (prevGamePhase === "" && gameState.roomPhase === "ROUND_IN_PROGRESS") {
      initRound();
    }
    if (
      prevGamePhase === "ROUND_RESULTS" &&
      gameState.roomPhase === "ROUND_IN_PROGRESS"
    ) {
      setGuessLocation(undefined);
      setRoundFinished(false);
    }
    setPrevGamePhase(gameState.roomPhase);
    // This effect only reacts to roomPhase transitions; gameState updates on
    // every socket tick and initRound/prevGamePhase are read from the closure
    // at transition time, so including them would refire on every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.roomPhase]);

  useEffect(() => {
    const isActiveGame =
      gameState?.roomPhase === "ROUND_IN_PROGRESS" || gameState?.roomPhase === "ROUND_RESULTS";
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
    movePin(pos);
  };

  const onGuess = () => {
    if (!guessLocation) return;
    submitGuess(guessLocation);
    setRoundFinished(true);
  };

  useEffect(() => {
    // Auto-submit whatever pin is already placed right at the deadline, rather than losing it to
    // the server's own timeout resolution. Scheduled directly off roundEndsAt (not off the
    // display-only secondsLeft tick from useCountdown, which only updates once a second and isn't
    // phase-aligned to the deadline) — waiting for that tick can fire up to ~1s late, which is
    // enough for the server's RoundTimeoutScheduler (also polling every second) to have already
    // resolved the round as a timeout before our late guess arrives.
    const roundEndsAt =
      gameState?.roomPhase === "ROUND_IN_PROGRESS" ? gameState.roundEndsAt : undefined;
    if (!roundEndsAt) return;

    // Correct for the local clock's skew relative to the server's (see use-countdown.ts) — without
    // this, a client whose clock runs ahead would fire this early relative to the actual server
    // deadline.
    const msRemaining = roundEndsAt - (Date.now() + clockOffset);
    const timeout = setTimeout(() => {
      if (roundFinishedRef.current || !guessLocationRef.current) return;
      submitGuess(guessLocationRef.current);
      setRoundFinished(true);
    }, Math.max(0, msRemaining));
    return () => clearTimeout(timeout);
    // Only re-schedule when the deadline or clock-offset estimate changes — the timeout body reads
    // the refs above instead of closing over state, so it doesn't need
    // onGuess/roundFinished/guessLocation here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.roundEndsAt, gameState?.roomPhase, clockOffset]);

  let content: React.ReactNode;
  let phaseKey: string;

  if (!gameState) {
    phaseKey = roomError ? "error" : "loading";
    content = roomError ? (
      <GameFallback
        variant="error"
        title="Couldn't load this game"
        description={roomError}
        onRetry={() => sessionId && join()}
      />
    ) : (
      <GameFallback variant="loading" title="Loading round..." />
    );
  } else {
    const gameSettings = gameState.roomSettings;

    if (gameState.roomPhase === "GAME_RESULTS") {
      phaseKey = "postgame";
      content = (
        <PostgameView
          username={username}
          players={gameState.players}
          allGuesses={gameState.allGuesses}
          allTargets={gameState.allTargets}
          allScores={gameState.allScores}
          allDistances={gameState.allDistances}
          backHref={buildGameMenuHref(gameSettings)}
        />
      );
    } else if (
      gameState.roomPhase === "ROUND_IN_PROGRESS" &&
      gameState.allTargets[gameState.roundCount]
    ) {
      phaseKey = `ingame-${gameState.roundCount}`;
      content = (
        <InGameView
          isMobile={isMobile}
          targetLocation={gameState.allTargets[gameState.roundCount]}
          guessLocation={guessLocation}
          roundFinished={roundFinished}
          onMapClick={onMapClick}
          onGuess={onGuess}
          onForfeit={forfeit}
          moveEnabled={gameSettings.allowMove}
          panEnabled={gameSettings.allowPan}
          zoomEnabled={gameSettings.allowZoom}
          round={gameState.roundCount + 1}
          totalRounds={gameSettings.roundCount}
          secondsLeft={secondsLeft}
        />
      );
    } else if (gameState.roomPhase === "ROUND_RESULTS") {
      phaseKey = `result-${gameState.roundCount}`;
      const userGuess = gameState.allGuesses[gameState.roundCount]?.[username];
      const target = gameState.allTargets[gameState.roundCount];
      const distance = gameState.allDistances[gameState.roundCount]?.[username] ?? -1;
      const score = gameState.allScores[gameState.roundCount]?.[username] ?? 0;
      const center = userGuess ? getCenterCoords(userGuess, target) : { lat: 0, lng: 0 };
      const zoom = 1 + (score / 5000) * 8;

      content = (
        <RoundResultView
          score={score}
          distance={distance}
          guessLocation={userGuess}
          targetLocation={target}
          center={center}
          zoom={zoom}
          onNext={() => nextRound()}
          isFinalRound={gameState.roundCount >= gameSettings.roundCount - 1}
        />
      );
    } else {
      phaseKey = "loading";
      content = <GameFallback variant="loading" title="Loading round..." />;
    }
  }

  return (
    <>
      {phaseKey !== "postgame" && (
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
    </>
  );
};

export default SinglePlayerGame;
