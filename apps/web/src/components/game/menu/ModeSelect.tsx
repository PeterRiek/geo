"use client";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import React from "react";

const ModeSelect: React.FC<{
  mode: "singleplayer" | "multiplayer";
  setMode: (mode: "singleplayer" | "multiplayer") => void;
}> = ({ mode, setMode }) => {
  const handleModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: "singleplayer" | "multiplayer"
  ) => {
    if (newMode) setMode(newMode);
  };

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleModeChange}
      color="primary"
      size="large"
    >
      <ToggleButton value="singleplayer">Singleplayer</ToggleButton>
      <ToggleButton value="multiplayer">Multiplayer</ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ModeSelect;
