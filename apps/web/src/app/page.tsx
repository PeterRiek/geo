"use client";

import StreetViewPano from "@/components/street-view-pano";
import { Box, Button, IconButton, Paper, Typography } from "@mui/material";
import React, { useState } from "react";
import MapIcon from "@mui/icons-material/Map";

import mapdata from "@/mapdata.json";
import Map from "@/components/map";
import { getDistanceInKm } from "@/lib/geo";

interface Coords {
  lat: number;
  lng: number;
}

function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

const Home = () => {
  const [targetLocation, setTargetLocation] = useState<Coords>();
  const [guessLocation, setGuessLocation] = useState<Coords>();
  const [mapVisible, setMapVisible] = useState(false);
  const [roundFinished, setRoundFinished] = useState(true);

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
    setMapVisible(false);
  };

  const endRound = () => {
    setTargetLocation(undefined);
  };

  if (!targetLocation)
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
            gap: 4,
          }}
        >
          <Typography variant="h1" fontWeight={500}>GeoGuessr (but free)</Typography>
          <Typography variant="h5">Minimalistic POC</Typography>
          <Button onClick={startRound} size="large" variant="contained">
            Start Round
          </Button>
        </Box>
      </>
    );

  return (
    <>
      {/* Streetview Pano View */}
      <Box sx={{ width: "100vw", height: "100vh" }}>
        <StreetViewPano location={targetLocation} />
      </Box>

      {/* Button to open map */}
      {!mapVisible && (
        <Box
          sx={{
            position: "absolute",
            right: 10,
            bottom: 10,
            zIndex: 10,
          }}
        >
          <IconButton size="large" onClick={() => setMapVisible(true)}>
            <MapIcon fontSize="large" />
          </IconButton>
        </Box>
      )}

      {/* Guessing map */}
      {mapVisible && (
        <>
          {/* Transparent dark bg */}
          <Box
            onClick={() => {
              if (roundFinished) return;
              setMapVisible(false);
            }}
            sx={{
              position: "absolute",
              display: "flex",
              gap: 1,
              flexDirection: "column",
              justifyContent: "end",
              alignItems: "end",
              top: 0,
              width: "100vw",
              height: "100vh",
              bgcolor: "rgba(0,0,0,0.8)",
              zIndex: 10,
              p: 2,
            }}
          >
            {/* Retry */}
            {roundFinished && (
              <Paper
                sx={{
                  width: "45%",
                  top: 0,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: 2,
                  p: 2,
                  alignItems: "center",
                }}
              >
                {guessLocation && (
                  <Typography variant="h4">
                    Your guess was{" "}
                    {Math.floor(getDistanceInKm(guessLocation, targetLocation))} km away!
                  </Typography>
                )}
                <Button
                  variant="contained"
                  onClick={endRound}
                  color="secondary"
                >
                  Exit
                </Button>
              </Paper>
            )}
            <Typography variant="h2">{roundFinished}</Typography>
            {/* Map container */}
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                width: "45%",
                height: "50%",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Map
                targetPosition={targetLocation}
                onMapClick={onMapClick}
                allowClicks={!roundFinished}
                showTarget={roundFinished}
              />
            </Box>
            <Box onClick={(e) => e.stopPropagation()} sx={{ width: "45%" }}>
              <Button
                onClick={onGuess}
                variant="contained"
                disabled={!guessLocation}
                loading={roundFinished}
                fullWidth
              >
                GUESS
              </Button>
            </Box>
          </Box>
        </>
      )}
    </>
  );
};

export default Home;