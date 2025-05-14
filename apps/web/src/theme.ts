"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#47a12b",
        },
        secondary: {
          main: "#c98928",
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: "#47a12b",
        },
        secondary: {
          main: "#c98928",
        },
      },
    },
  },
  cssVariables: {
    colorSchemeSelector: "class",
  },
  palette: {
    primary: {
      main: "#47a12b",
    },
    secondary: {
      main: "#c98928",
    },
  },
  typography: {
    fontFamily: "var(--font-roboto)",
  },
});

export default theme;
