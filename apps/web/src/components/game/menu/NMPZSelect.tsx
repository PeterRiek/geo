"use client";

import {
  Box,
  Button,
  Popover,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import TimerIcon from "@mui/icons-material/Timer";
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
  // Extra Rounds/Time-style button+popover controls rendered in the same row (e.g. multiplayer's
  // time-pressure toggle). Singleplayer omits this and the row is unchanged.
  extraControls?: React.ReactNode;
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
  extraControls,
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
        sx={{
          "& .MuiToggleButton-root": { height: 36.5 },
          "& .MuiToggleButton-root:not(.Mui-selected)": { color: "text.secondary" },
        }}
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

      <Button
        variant="outlined"
        startIcon={<FormatListNumberedIcon />}
        onClick={(e) => setRoundsAnchor(e.currentTarget)}
        sx={{
          minWidth: 0,
          height: 36.5,
          px: { xs: 1.5, sm: 2 },
          "& .MuiButton-startIcon": { mx: { xs: 0, sm: undefined } },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          Rounds: {roundCount}
        </Box>
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

      <Button
        variant="outlined"
        startIcon={<TimerIcon />}
        onClick={(e) => setTimeLimitAnchor(e.currentTarget)}
        sx={{
          minWidth: 0,
          height: 36.5,
          px: { xs: 1.5, sm: 2 },
          "& .MuiButton-startIcon": { mx: { xs: 0, sm: undefined } },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          Time: {timeLimitLabel}
        </Box>
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

      {extraControls}
    </Stack>
  );
};

export default NMPZSelect;
