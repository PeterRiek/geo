"use client";

import Link from "next/link";
import { AppBar, Toolbar, Typography, Stack, Button } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LoginIcon from "@mui/icons-material/Login";
import SignOutButton from "@/components/auth/sing-out-button";

interface Props {
  username: string | null;
}

const AppHeader: React.FC<Props> = ({ username }) => (
  <AppBar position="static" color="default" elevation={1}>
    <Toolbar sx={{ gap: 1 }}>
      <Stack
        component={Link}
        href="/"
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}
      >
        <PublicIcon color="primary" />
        <Typography variant="h6" fontWeight={600} color="inherit">
          GeoGuessr Clone
        </Typography>
      </Stack>

      {username ? (
        <Stack direction="row" spacing={1} alignItems="center">
          <Button component={Link} href="/game" startIcon={<SportsEsportsIcon />}>
            Play
          </Button>
          <Button component={Link} href="/profile" startIcon={<AccountCircleIcon />}>
            {username}
          </Button>
          <SignOutButton />
        </Stack>
      ) : (
        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/login" startIcon={<LoginIcon />}>
            Sign In
          </Button>
          <Button component={Link} href="/register" variant="contained">
            Sign Up
          </Button>
        </Stack>
      )}
    </Toolbar>
  </AppBar>
);

export default AppHeader;
