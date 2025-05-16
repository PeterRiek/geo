"use client";

import StreetViewPano from "@/components/street-view-pano";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";

import mapdata from "@/mapdata.json";
import { Coords } from "@/types/geo";
import GuessrMobileUI from "@/components/guessr-ui-mobile";
import GuessrUI from "@/components/guessr-ui";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import SummaryMap from "@/components/summary-map";
import { getCenterCoords, getDistanceInKm, getGuessrScore } from "@/lib/geo";

function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${Math.round(km)} km`;
}

const Home = () => {
  const [targetLocation, setTargetLocation] = useState<Coords>();
  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [roundFinished, setRoundFinished] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const onMapClick = (pos: Coords) => {
    if (roundFinished) return;
    setGuessLocation(pos);
  };

  const onGuess = () => {
    setRoundFinished(true);
  };

  const startRound = () => {
    const pos = getRandomElement(mapdata.customCoordinates);
    setTargetLocation(pos);
    setGuessLocation(undefined);
    setRoundFinished(false);
  };

  const endRound = () => {
    setTargetLocation(undefined);
  };

  if (!targetLocation)
    return (
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          px: 2, 
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h1"
          fontWeight={500}
          sx={{
            fontSize: { xs: "2.5rem", sm: "4rem" },
            wordBreak: "break-word",
          }}
        >
          GeoGuessr
        </Typography>

        <Typography
          variant="h2"
          fontWeight={500}
          sx={{ fontSize: { xs: "1.8rem", sm: "3rem" } }}
        >
          (but free)
        </Typography>

        <Typography variant="h5" sx={{ mt: 2 }}>
          Minimalistic POC
        </Typography>

        <Button
          onClick={startRound}
          size="large"
          variant="contained"
          sx={{ mt: 4 }}
        >
          Start Round
        </Button>
      </Box>
    );

  if (roundFinished && targetLocation && guessLocation)
    return (
      <>
        <Box
          sx={{
            width: "100vw",
            height: "100vh",
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
          <Stack direction="column" gap={1}>
            <Button onClick={startRound} size="large" variant="contained">
              New Round
            </Button>
            <Button onClick={endRound} size="large" variant="contained">
              Exit
            </Button>
          </Stack>
        </Box>
      </>
    );

  return (
    <>
      {/* Streetview Pano View */}
      <Box sx={{ width: "100vw", height: "100vh" }}>
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
          {/* To Menu */}

          <IconButton
            sx={{
              position: "absolute",
              top: 5,
              left: 5,
              zIndex: 20,
            }}
            onClick={endRound}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
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
            roundFinished ? "DONE" : guessLocation ? "GUESS" : "PLACE YOUR PIN"
          }
        />
      )}
    </>
  );
};

export default Home;
