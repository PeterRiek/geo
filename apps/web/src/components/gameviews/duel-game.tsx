"use client";

import useDuelSocket from "@/lib/hooks/use-duel-socket";
import { Coords } from "@/types/geo";
import {
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useState } from "react";
import StreetViewPano from "../street-view-pano";
import GuessrMobileUI from "../guessr-ui-mobile";
import GuessrUI from "../guessr-ui";
import { formatDistance, getCenterCoords, getDistanceInKm, getGuessrScore } from "@/lib/geo";
import SummaryMap from "../summary-map";

const DuelGameView: React.FC<{ accessToken?: string; roomId: string }> = ({
  accessToken,
  roomId,
}) => {
  const { gameData, gameResult, submitResult } = useDuelSocket(
    roomId,
    accessToken
  );

  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [guessSubmitted, setGuesSubmitted] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const onMapClick = (pos: Coords) => {
    setGuessLocation(pos);
  };

  const onGuess = () => {
    if (!guessLocation) return;
    submitResult(guessLocation);
    setGuesSubmitted(true);
  };

  if (!gameData)
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
        }}
      >
        <Typography variant="h2">Waiting for opponent</Typography>
        <Stack direction={"row"} gap={1}>
          <Typography variant="body1">Room:</Typography>
          <Typography variant="body1" fontWeight={500}>
            {roomId}
          </Typography>
        </Stack>
      </Box>
    );

  if (!gameResult)
    return (
      <>
        {/* Streetview Pano View */}
        <Box sx={{ width: "100%", height: "100%" }}>
          <StreetViewPano location={gameData.targetLocation} />
        </Box>
        {isMobile ? (
          <>
            <GuessrMobileUI
              targetLocation={gameData.targetLocation}
              targetVisible={false}
              guessLocation={guessLocation}
              guessingDisabled={!guessLocation || guessSubmitted}
              onMapClick={onMapClick}
              onGuess={onGuess}
            />

            {/* To Menu */}
            {/* <IconButton
              sx={{
                position: "absolute",
                top: 5,
                left: 5,
                zIndex: 20,
              }}
              onClick={endRound}
            >
              <ArrowBackIosNewIcon />
            </IconButton> */}
          </>
        ) : (
          <GuessrUI
            targetLocation={gameData.targetLocation}
            targetVisible={false}
            guessingDisabled={!guessLocation || guessSubmitted}
            guessLocation={guessLocation}
            mapClicksDisabled={guessSubmitted}
            onMapClick={onMapClick}
            onGuess={onGuess}
            buttonLabel={
              guessSubmitted
                ? "WAITING FOR OPPONENT"
                : guessLocation
                ? "GUESS"
                : "PLACE YOUR PIN"
            }
          />
        )}
      </>
    );

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
              getDistanceInKm(guessLocation!, gameData.targetLocation),
              10_000
            )}
          </Typography>
          <Typography>
            You were{" "}
            {formatDistance(getDistanceInKm(guessLocation!, gameData.targetLocation))}{" "}
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
              guessLocation={guessLocation!}
              targetLocation={gameData.targetLocation}
              center={getCenterCoords(guessLocation!, gameData.targetLocation)}
              otherGuesses={Object.values(gameResult.allGuesses)}
              zoom={
                1 +
                (getGuessrScore(
                  getDistanceInKm(guessLocation!, gameData.targetLocation),
                  10_000
                ) /
                  5000) *
                  8
              }
            />
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default DuelGameView;
