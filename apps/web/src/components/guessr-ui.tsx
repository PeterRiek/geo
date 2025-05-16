"use client";

import { Box, Button, useMediaQuery, useTheme } from "@mui/material";
import React from "react";

import Map from "@/components/map";
import { Coords } from "@/types/geo";

const GuessrUI: React.FC<{
  targetLocation: Coords;
  targetVisible: boolean;
  guessLocation?: Coords;
  guessingDisabled: boolean;
  mapClicksDisabled: boolean;
  onMapClick: (c: Coords) => void;
  onGuess: () => void;
  buttonLabel?: string;
}> = ({
  targetLocation,
  targetVisible,
  guessLocation,
  guessingDisabled,
  mapClicksDisabled,
  onMapClick,
  onGuess,
  buttonLabel,
}) => {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));

  let normalWidth = "20%";
  let normalHeight = "20%";
  let hoverWidth = "50%";
  let hoverHeight = "60%";

  if (isSm) {
    normalWidth = "40%";
    normalHeight = "20%";
    hoverWidth = "85%";
    hoverHeight = "60%";
  }

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: "100%",
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
            width: normalWidth,
            height: normalHeight,
            display: "flex",
            transition: "width 0.1s ease, height 0.1s ease",
            ":hover": { width: hoverWidth, height: hoverHeight },
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
            <Box
              sx={{
                flex: 1,
                borderRadius: 1,
                overflow: "hidden",
                cursor: "crosshair",
                opacity: 0.5,
                transition: "opacity 0.1s ease",
                ":hover": {
                  opacity: 1,
                },
                ".MuiBox-root:hover &": {
                  opacity: 1,
                },
              }}
            >
              <Map
                targetLocation={targetLocation}
                targetVisible={targetVisible}
                guessLocation={guessLocation}
                onMapClick={onMapClick}
                mapClicksDisabled={mapClicksDisabled}
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
                disabled={guessingDisabled}
                fullWidth
              >
                {buttonLabel ?? "GUESS"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default GuessrUI;
