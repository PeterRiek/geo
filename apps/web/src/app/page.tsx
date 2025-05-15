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
          }}
        >
          <Typography variant="h1" fontWeight={500}>
            GeoGuessr
          </Typography>
          <Typography variant="h2" fontWeight={500}>(but free)</Typography>
          <Typography variant="h5" sx={{mt:2}}>Minimalistic POC</Typography>
          <Button onClick={startRound} size="large" variant="contained" sx={{mt:4}}>
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
      {/* Game UI */}
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          position: "absolute",
          top: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "end",
          alignItems: "end",
          zIndex: 10,
          pointerEvents: "none",
          p: 2,
        }}
      >
        <Box
          sx={{
            width: "15%",
            minWidth: 250,
            height: "15%",
            display: "flex",
            transition: "width 0.1s ease, height 0.1s ease",
            ":hover": { width: "60%", height: "60%" },
            pointerEvents: "auto",
          }}
        >
          {/* Select Map Container */}
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Map fills all available space */}
            <Box sx={{ flex: 1, overflow: "hidden", borderRadius: 1 }}>
              <Map
                targetPosition={targetLocation}
                onMapClick={onMapClick}
                allowClicks={!roundFinished}
                showTarget={roundFinished}
              />
            </Box>

            {/* Button pinned at the bottom */}
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ width: "100%", mt: 0.5 }}
            >
              <Button
                onClick={onGuess}
                variant="contained"
                disabled={!guessLocation}
                fullWidth
              >
                GUESS
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Home;
