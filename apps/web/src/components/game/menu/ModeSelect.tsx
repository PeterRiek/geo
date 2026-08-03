"use client";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PeopleIcon from "@mui/icons-material/People";
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
      <ToggleButton value="singleplayer">
        <PersonIcon sx={{ mr: 1 }} fontSize="small" />
        Singleplayer
      </ToggleButton>
      <ToggleButton value="multiplayer">
        <PeopleIcon sx={{ mr: 1 }} fontSize="small" />
        Multiplayer
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ModeSelect;
