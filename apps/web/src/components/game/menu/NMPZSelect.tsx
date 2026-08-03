"use client";

import {
  Button,
  Popover,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

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
}) => {
  const [roundsAnchor, setRoundsAnchor] = useState<HTMLElement | null>(null);
  const [timeLimitAnchor, setTimeLimitAnchor] = useState<HTMLElement | null>(null);

  const timeLimitLabel =
    roundTimeLimitSeconds === 0 ? "Unlimited" : `${roundTimeLimitSeconds}s`;

  return (
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

      <Button variant="outlined" onClick={(e) => setRoundsAnchor(e.currentTarget)}>
        Rounds: {roundCount}
      </Button>
      <Popover
        open={!!roundsAnchor}
        anchorEl={roundsAnchor}
        onClose={() => setRoundsAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Stack spacing={1} alignItems="center" sx={{ p: 2, width: 220 }}>
          <Typography variant="body2">Rounds: {roundCount}</Typography>
          <Slider
            value={roundCount}
            onChange={(e, value) => setRoundCount(value as number)}
            step={1}
            min={1}
            max={10}
            marks
            valueLabelDisplay="auto"
          />
        </Stack>
      </Popover>

      <Button variant="outlined" onClick={(e) => setTimeLimitAnchor(e.currentTarget)}>
        Time: {timeLimitLabel}
      </Button>
      <Popover
        open={!!timeLimitAnchor}
        anchorEl={timeLimitAnchor}
        onClose={() => setTimeLimitAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Stack spacing={1} alignItems="center" sx={{ p: 2, width: 220 }}>
          <Typography variant="body2">Time: {timeLimitLabel}</Typography>
          <Slider
            value={roundTimeLimitSeconds}
            onChange={(e, value) => setRoundTimeLimitSeconds(value as number)}
            step={15}
            min={0}
            max={300}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => (v === 0 ? "Unlimited" : `${v}s`)}
          />
        </Stack>
      </Popover>
    </Stack>
  );
};

export default NMPZSelect;
