"use client";

import Map from "@/components/map";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import MapIcon from "@mui/icons-material/Map";
import mapdata from "@/mapdata.json";
import StreetViewEmbed from "@/components/street-view";
import StreetViewPano from "@/components/street-view-pano";

const LOADING_IMG =
  "https://upload.wikimedia.org/wikipedia/commons/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg";

function getRandomElement<T>(array: T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

export default function Moving() {
  const [location, setLocation] = useState<string>("");
  const [target, setTarget] = useState<{ lat: number; lng: number }>();
  const [imgUrl, setImgUrl] = useState<string>(LOADING_IMG);
  const [showMap, setShowMap] = useState(false);
  const [showTarget, setShowTarget] = useState(false);

  const loadImage = async () => {
    const pos = getRandomElement(mapdata.customCoordinates);
    setTarget(pos);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      {target && (
        <StreetViewPano location={target} />
        // <StreetViewEmbed location={`${target.lat},${target.lng}`} />
      )}

      <Paper sx={{ p: 1 }}>
        <Typography>
          {location.length == 0 ? "No Location Selected" : location}
        </Typography>
      </Paper>
      <Paper>
        <Stack direction="row" gap={1}>
          <Button onClick={loadImage}>Go</Button>
          <Button onClick={() => setShowTarget(!showTarget)}>
            Toggle Solution
          </Button>
        </Stack>
      </Paper>

      {/* MAP SECTION */}
      {!showMap && (
        <IconButton
          sx={{ position: "absolute", right: 10, bottom: 10 }}
          onClick={() => setShowMap(true)}
        >
          <MapIcon />
        </IconButton>
      )}
      {showMap && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "absolute",
            right: 10,
            bottom: 10,
            width: 600,
            height: 500,
            zIndex: 1
          }}
        >
          <Map
            onMapClick={({ lat, lng }) => {
              console.log(lat, lng);
              setLocation(`${lat},${lng}`);
            }}
            targetPosition={target}
            showTarget={showTarget}
          />
          <IconButton
            sx={{ position: "absolute", left: 10, top: 10 }}
            onClick={() => setShowMap(false)}
          >
            <MapIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
