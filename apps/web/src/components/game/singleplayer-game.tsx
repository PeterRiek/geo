"use client";

import { Coords } from "@/types/geo";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  formatDistance,
  getCenterCoords,
  getDistanceInKm,
  getGuessrScore,
} from "@/lib/geo";
import StreetViewPano from "@/components/street-view-pano";
import GuessrMobileUI from "@/components/guessing-ui-mobile";
import GuessrUI from "@/components/guessing-ui";
import SummaryMap from "@/components/summary-map";

interface PlaySet {
  mapId: string;
  allowMove: boolean;
  allowZoom: boolean;
  allowPan: boolean;
}

type GamePhase = "PREGAME" | "INGAME" | "ROUND_RESULT" | "POSTGAME";

const SinglePlayerGame: React.FC<{ accessToken: string }> = ({
  accessToken,
}) => {
  const searchParams = useSearchParams();
  const playSet = {
    mapId: searchParams.get("mapId") || "world",
    allowMove: searchParams.get("allowMove") === "true",
    allowZoom: searchParams.get("allowZoom") === "true",
    allowPan: searchParams.get("allowPan") === "true",
  };
  console.log("playing set:", playSet);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [gamePhase, setGamePhase] = useState<GamePhase>("PREGAME");
  const [gameRoundCount, setGameRoundCount] = useState(0);

  const [targetLocation, setTargetLocation] = useState<Coords>();
  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [roundFinished, setRoundFinished] = useState(true);

  useEffect(() => {
    const fetchNextLocation = async () => {
      fetch(`/api/map/${playSet.mapId}/random`)
        .then((r) => r.json())
        .then((d) => setTargetLocation(d));
    };
    fetchNextLocation();
  }, [gameRoundCount]);

  const gameNextPhase = () => {
    if (gamePhase === "PREGAME") {
      setRoundFinished(false);
      setGameRoundCount((i) => i + 1);
      setGamePhase("INGAME");
    }
    if (gamePhase === "INGAME") {
      setRoundFinished(true);
      setGamePhase("ROUND_RESULT");
    }
    if (gamePhase === "ROUND_RESULT") {
      if (gameRoundCount >= 5) {
        setGamePhase("POSTGAME");
      } else {
        setGuessLocation(undefined);
        setRoundFinished(false);
        setGameRoundCount((i) => i + 1);
        setGamePhase("INGAME");
      }
    }
  };

  const onMapClick = (pos: Coords) => {
    setGuessLocation(pos);
  };

  const onGuess = () => {
    gameNextPhase();
  };

  if (gamePhase === "PREGAME")
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
        <Typography variant="h1">Singleplayer</Typography>
        <Paper
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
            p: 2,
          }}
        >
          <Stack justifyContent="center">
            <Typography variant="h2" textAlign="center">
              Playing Map
            </Typography>
            <Typography variant="h3" textAlign="center" fontWeight={500}>
              {playSet.mapId}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip
              label={playSet.allowMove ? "MOVE" : "NO MOVE"}
              color={playSet.allowMove ? "success" : "default"}
              size="small"
            />
            <Chip
              label={playSet.allowPan ? "PAN" : "NO PAN"}
              color={playSet.allowPan ? "success" : "default"}
              size="small"
            />
            <Chip
              label={playSet.allowZoom ? "ZOOM" : "NO ZOOM"}
              color={playSet.allowZoom ? "success" : "default"}
              size="small"
            />
          </Stack>
        </Paper>
        <Button onClick={gameNextPhase} variant="contained" size="large">
          Start Game
        </Button>
      </Box>
    );

  if (!targetLocation) return <div>error targetLocation</div>;

  if (gamePhase === "INGAME")
    return (
      <>
        <Box sx={{ width: "100%", height: "100%" }}>
          <StreetViewPano location={targetLocation} />
        </Box>
        {isMobile ? (
          <>
            <GuessrMobileUI
              targetLocation={targetLocation}
              targetVisible={roundFinished}
              guessLocation={guessLocation}
              guessingDisabled={!guessLocation || roundFinished}
              onMapClick={onMapClick}
              onGuess={onGuess}
            />
          </>
        ) : (
          <GuessrUI
            targetLocation={targetLocation}
            targetVisible={roundFinished}
            guessingDisabled={!guessLocation || roundFinished}
            guessLocation={guessLocation}
            mapClicksDisabled={roundFinished}
            onMapClick={onMapClick}
            onGuess={onGuess}
            buttonLabel={
              roundFinished
                ? "DONE"
                : guessLocation
                ? "GUESS"
                : "PLACE YOUR PIN"
            }
          />
        )}
      </>
    );

  if (!guessLocation) return <div>error guessLocation</div>;

  if (gamePhase === "ROUND_RESULT")
    return (
      <>
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            py: 5,
          }}
        >
          <Paper
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              p: 1,
            }}
          >
            <Typography variant="h2" fontWeight={500} color="primary">
              {getGuessrScore(
                getDistanceInKm(guessLocation, targetLocation),
                10_000
              )}
            </Typography>
            <Typography>
              You were{" "}
              {formatDistance(getDistanceInKm(guessLocation, targetLocation))}{" "}
              away
            </Typography>
          </Paper>
          <Paper sx={{ width: "90%", height: "70%", p: 1 }}>
            <Box
              sx={{
                overflow: "hidden",
                borderRadius: 1,
                width: "100%",
                height: "100%",
              }}
            >
              <SummaryMap
                guessLocation={guessLocation}
                targetLocation={targetLocation}
                center={getCenterCoords(guessLocation, targetLocation)}
                zoom={
                  1 +
                  (getGuessrScore(
                    getDistanceInKm(guessLocation, targetLocation),
                    10_000
                  ) /
                    5000) *
                    8
                }
              />
            </Box>
          </Paper>
          <Button onClick={gameNextPhase} size="large" variant="contained">
            {gameRoundCount < 5 ? "Next Round" : "End Game"}
          </Button>
        </Box>
      </>
    );

  if (gamePhase === "POSTGAME")
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
        <Typography variant="h1" textAlign="center">Thanks for playing!</Typography>
        <Button href="/game" variant="contained" size="large">
          BACK TO MENU
        </Button>
      </Box>
    );

  return <div>error something went wrong</div>;
};

export default SinglePlayerGame;
