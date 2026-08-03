"use client";

import {
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React from "react";

const NMPZSelect: React.FC<{
  moveEnabled: boolean;
  panEnabled: boolean;
  zoomEnabled: boolean;
  roundCount: number;
  roundTimeLimitSeconds: number;
  setMoveEnabled: (val: boolean) => void;
  setPanEnabled: (val: boolean) => void;
  setZoomEnabled: (val: boolean) => void;
  setRoundCount: (val: number) => void;
  setRoundTimeLimitSeconds: (val: number) => void;
}> = ({
  moveEnabled,
  panEnabled,
  zoomEnabled,
  roundCount,
  roundTimeLimitSeconds,
  setMoveEnabled,
  setPanEnabled,
  setZoomEnabled,
  setRoundCount,
  setRoundTimeLimitSeconds,
}) => (
  <Stack
    direction="row"
    spacing={2}
    justifyContent="center"
    alignItems="center"
  >
    <ToggleButtonGroup
      value={[moveEnabled, panEnabled, zoomEnabled]}
      color="primary"
    >
      <ToggleButton
        value="move"
        selected={moveEnabled}
        onClick={() => setMoveEnabled(!moveEnabled)}
      >
        Move
      </ToggleButton>
      <ToggleButton
        value="pan"
        selected={panEnabled}
        onClick={() => setPanEnabled(!panEnabled)}
      >
        Pan
      </ToggleButton>
      <ToggleButton
        value="zoom"
        selected={zoomEnabled}
        onClick={() => setZoomEnabled(!zoomEnabled)}
      >
        Zoom
      </ToggleButton>
    </ToggleButtonGroup>
    <Stack spacing={1} alignItems="center" width={200}>
      <Typography variant="body2">Rounds: {roundCount}</Typography>
      <Slider
        value={roundCount}
        onChange={(e, value) => setRoundCount(value as number)}
        step={1}
        min={1}
        max={10}
      />
    </Stack>
    <Stack spacing={1} alignItems="center" width={200}>
      <Typography variant="body2">Time limit: {roundTimeLimitSeconds}s</Typography>
      <Slider
        value={roundTimeLimitSeconds}
        onChange={(e, value) => setRoundTimeLimitSeconds(value as number)}
        step={15}
        min={15}
        max={300}
      />
    </Stack>
  </Stack>
);

export default NMPZSelect;
