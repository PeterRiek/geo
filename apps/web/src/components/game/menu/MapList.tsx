"use client";

import React, { useEffect, useRef } from "react";
import { Box, ToggleButton } from "@mui/material";

type Map = { id: number; name: string };

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
  }, []);

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
		paddingBottom: 1,
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
          sx={{ borderRadius: 1 }}
        >
          {map.name}
        </ToggleButton>
      ))}
    </Box>
  );
};

export default MapList;
