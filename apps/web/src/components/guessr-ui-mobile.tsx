"use client";

import { Box, Button, IconButton, Paper } from "@mui/material";
import React, { useRef, useState } from "react";
import MapIcon from "@mui/icons-material/Map";

import Map from "@/components/map";
import CloseIcon from "@mui/icons-material/Close";
import { Coords } from "@/types/geo";

const GuessrMobileUI: React.FC<{
  targetLocation: Coords;
  targetVisible: boolean;
  guessLocation?: Coords;
  guessingDisabled: boolean;
  onMapClick: (c: Coords) => void;
  onGuess: () => void;
}> = ({
  targetLocation,
  targetVisible,
  guessLocation,
  guessingDisabled,
  onMapClick,
  onGuess,
}) => {
  const [mapVisible, setMapVisible] = useState(false);
  const zoomRef = useRef<number>(undefined);
  const centerRef = useRef<Coords>(undefined);

  return (
    <>
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
        }}
      >
        {/* Open Map Button */}
        {!mapVisible && (
          <Paper
            sx={{ m: 5, p: 1, pointerEvents: "auto", borderRadius: "50%" }}
          >
            <IconButton
              sx={{
                width: 72,
                height: 72,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setMapVisible(true);
              }}
            >
              <MapIcon
                fontSize="inherit"
                sx={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </IconButton>
          </Paper>
        )}

        {/* Select Map Container */}
        {mapVisible && (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "end",
            }}
          >
            {/* Map fills all available space */}
            <Box
              sx={{
                overflow: "hidden",
                borderRadius: 1,
                pointerEvents: "auto",
                height: "60%",
                width: "100%",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Map
                targetLocation={targetLocation}
                targetVisible={targetVisible}
                guessLocation={guessLocation}
                onMapClick={onMapClick}
                zoom={zoomRef.current}
                onZoomChange={(zoom) => (zoomRef.current = zoom)}
                center={centerRef.current}
                onCenterChange={(center) => (centerRef.current = center)}
              />
              <Paper
                sx={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  borderRadius: "50%",
                  p: 1,
                }}
              >
                <IconButton onClick={() => setMapVisible(false)}>
                  <CloseIcon />
                </IconButton>
              </Paper>
            </Box>
            <Button
              onClick={onGuess}
              variant="contained"
              disabled={guessingDisabled}
              sx={{
                position: "absolute",
                bottom: "5%",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 24,
                pointerEvents: "auto",
              }}
            >
              GUESS
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
};
export default GuessrMobileUI;
