"use client";

import React, { useEffect, useRef } from "react";
import { Box, ToggleButton, Typography } from "@mui/material";

type Map = { id: number; name: string };

// TODO: backend doesn't provide map thumbnails/descriptions yet — mock until it does.
// picsum.photos seeds aren't content-filterable, so use loremflickr's tag
// search (landscape/skyline only) with a per-map lock for determinism.
const MOCK_IMAGE_CATEGORIES = ["landscape", "skyline"];

const MOCK_DESCRIPTIONS = [
  "A hand-picked set of locations to explore and guess your way through.",
  "Somewhere out there, a pin is waiting to be dropped.",
  "Familiar landmarks, unfamiliar streets — can you place them?",
  "A mix of cities and countryside for a well-rounded challenge.",
  "Locations chosen to keep you guessing until the very last round.",
  "From bustling streets to quiet backroads.",
  "A tour through places you'll swear you almost recognize.",
  "Every round, a new corner of the map to figure out.",
  "Curated views meant to test your sense of direction.",
  "A varied set of spots, easy to start, tricky to master.",
];

// Deterministic per-map pick so the same map always shows the same mock
// image/description across renders, instead of reshuffling every time.
const pickForId = <T,>(options: T[], id: number): T =>
  options[Math.abs(id) % options.length];

const mockImageUrl = (id: number) =>
  `https://loremflickr.com/200/200/${pickForId(MOCK_IMAGE_CATEGORIES, id)}?lock=${id}`;

const mockDescription = (id: number) => pickForId(MOCK_DESCRIPTIONS, id);

const MapList: React.FC<{
  maps: Map[];
  selectedMap?: number;
  setSelectedMap: (id: number) => void;
  scrollPositionRef: React.RefObject<number>;
}> = ({ maps, selectedMap, setSelectedMap, scrollPositionRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMapClick = (id: number) => {
    if (containerRef.current) {
      scrollPositionRef.current = containerRef.current.scrollTop;
    }
    setSelectedMap(id);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [scrollPositionRef]);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        maxHeight: "100%",
        width: "100%",
        gap: 1,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {maps.map((map) => (
        <ToggleButton
          key={map.id}
          value={map.id}
          selected={selectedMap === map.id}
          onClick={() => handleMapClick(map.id)}
          fullWidth
          color={selectedMap === map.id ? "primary" : "standard"}
          sx={{
            borderRadius: 1,
            textTransform: "none",
            justifyContent: "flex-start",
            textAlign: "left",
            gap: 2,
            p: 1,
          }}
        >
          <Box
            component="img"
            src={mockImageUrl(map.id)}
            alt=""
            sx={{
              width: 96,
              height: 96,
              borderRadius: 1,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {map.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {mockDescription(map.id)}
            </Typography>
          </Box>
        </ToggleButton>
      ))}
    </Box>
  );
};

export default MapList;
