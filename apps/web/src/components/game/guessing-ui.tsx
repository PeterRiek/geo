"use client";

import { Box, Button, IconButton, Tooltip, useMediaQuery, useTheme } from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import React, { useEffect, useRef, useState } from "react";

import Map from "@/components/game/guessing-map";
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
  const [pulsing, setPulsing] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [suppressHover, setSuppressHover] = useState(false);
  const hoverBoxRef = useRef<HTMLDivElement>(null);

  // A drag that starts outside the mini-map (e.g. panning the street view) can end up passing
  // the cursor over the mini-map's corner mid-drag — without this, that momentarily triggers the
  // hover-expand even though the user isn't trying to interact with the map at all. A drag that
  // starts on the mini-map itself (placing a guess) is left alone.
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (hoverBoxRef.current && !hoverBoxRef.current.contains(e.target as Node)) {
        setSuppressHover(true);
      }
    };
    const handleMouseUp = () => setSuppressHover(false);

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  let normalWidth = "25%";
  let normalHeight = "25%";
  let hoverWidth = "55%";
  let hoverHeight = "65%";

  if (isSm) {
    normalWidth = "40%";
    normalHeight = "25%";
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
        }}
      >
        <Box
          ref={hoverBoxRef}
          className="guess-map-hover-box"
          sx={{
            width: pinned ? hoverWidth : normalWidth,
            height: pinned ? hoverHeight : normalHeight,
            display: "flex",
            position: "relative",
            transition: "width 0.1s ease, height 0.1s ease",
            ...(!pinned && !suppressHover && { ":hover": { width: hoverWidth, height: hoverHeight } }),
            pointerEvents: "auto",
			p: 2
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
                position: "relative",
                borderRadius: 1,
                overflow: "hidden",
                cursor: "crosshair",
              }}
            >
              {/* Dims the map itself on approach — kept separate from the pin button below so
                  the button (a sibling, not a descendant) never inherits this opacity. */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.5,
                  transition: "opacity 0.1s ease",
                  ...(!suppressHover && {
                    ":hover": {
                      opacity: 1,
                    },
                    ".MuiBox-root:hover &": {
                      opacity: 1,
                    },
                  }),
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

              {/* Pin button — only reachable once the map is actually expanded (hovered or
                  pinned), so it never sits clickable over the small thumbnail. */}
              <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  zIndex: 5,
                  opacity: pinned ? 1 : 0,
                  pointerEvents: pinned ? "auto" : "none",
                  transition: "opacity 0.15s ease",
                  ...(!suppressHover && {
                    ".guess-map-hover-box:hover &": {
                      opacity: 1,
                      pointerEvents: "auto",
                    },
                  }),
                }}
              >
                <Tooltip title={pinned ? "Unpin map" : "Keep map expanded"}>
                  <IconButton
                    size="small"
                    onClick={() => setPinned((prev) => !prev)}
                    sx={{
                      bgcolor: "rgba(0,0,0,0.5)",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
                    }}
                  >
                    {pinned ? (
                      <PushPinIcon fontSize="small" sx={{ color: "#fff" }} />
                    ) : (
                      <PushPinOutlinedIcon fontSize="small" sx={{ color: "#fff" }} />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Button pinned at the bottom */}
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ width: "100%", mt: 0.5 }}
            >
              <Button
                onClick={() => {
                  setPulsing(true);
                  onGuess();
                }}
                onAnimationEnd={() => setPulsing(false)}
                variant="contained"
                disabled={guessingDisabled}
                autoFocus
                fullWidth
                sx={{
                  animation: pulsing ? "guess-pulse 0.3s ease" : undefined,
                  "@keyframes guess-pulse": {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(0.94)" },
                    "100%": { transform: "scale(1)" },
                  },
                }}
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
