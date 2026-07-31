"use client";

import { useEffect, useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

const ColorModeToggle = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <IconButton disabled sx={{ visibility: "hidden" }} />;
  }

  const resolvedMode = mode === "system" ? systemMode : mode;
  const isDark = resolvedMode === "dark";

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={() => setMode(isDark ? "light" : "dark")}
        color="inherit"
      >
        {isDark ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ColorModeToggle;
