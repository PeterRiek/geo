"use client";

import { Box } from "@mui/material";
import MapList from "./MapList";
import MapListSkeleton from "./MapListSkeleton";

type Map = { id: number; name: string };

const MapSelect: React.FC<{
  maps: Map[];
  selectedMap?: number;
  setSelectedMap: (id: number) => void;
  mapsLoading: boolean;
  scrollPositionRef: React.RefObject<number>;
}> = ({ maps, selectedMap, setSelectedMap, mapsLoading, scrollPositionRef }) => (
  <>
    <Box
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      {mapsLoading ? (
        <MapListSkeleton />
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
