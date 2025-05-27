"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import MapList from "./MapList";

type Map = { id: number; name: string };

const MapSelect: React.FC<{
  maps: Map[];
  selectedMap?: number;
  setSelectedMap: (id: number) => void;
  mapsLoading: boolean;
  scrollPositionRef: React.RefObject<number>;
}> = ({ maps, selectedMap, setSelectedMap, mapsLoading, scrollPositionRef }) => (
  <>
    {selectedMap && maps.find((m) => m.id === selectedMap) ? (
      <Typography gutterBottom>
        Selected Map:{" "}
        <strong>{maps.find((m) => m.id === selectedMap)?.name}</strong>
      </Typography>
    ) : (
      <Typography gutterBottom>No map selected</Typography>
    )}
    <Box
      sx={{
        height: "80%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {mapsLoading ? (
        <CircularProgress />
      ) : (
        <MapList
          maps={maps}
          selectedMap={selectedMap}
          setSelectedMap={setSelectedMap}
          scrollPositionRef={scrollPositionRef}
        />
      )}
    </Box>
  </>
);

export default MapSelect;
