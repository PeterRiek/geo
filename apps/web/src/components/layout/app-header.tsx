"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Stack,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import PublicIcon from "@mui/icons-material/Public";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import HistoryIcon from "@mui/icons-material/History";
import MapIcon from "@mui/icons-material/Map";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { logout } from "@/lib/actions/auth";
import SignOutButton from "@/components/auth/sing-out-button";
import ColorModeToggle from "./color-mode-toggle";

interface Props {
  username: string | null;
}

const AppHeader: React.FC<Props> = ({ username }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  const { mode, systemMode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && (mode === "system" ? systemMode : mode) === "dark";

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ gap: 1 }}>
        <Stack
          component={Link}
          href="/"
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ textDecoration: "none", color: "inherit", flexGrow: 1, minWidth: 0 }}
        >
          <PublicIcon color="primary" />
          <Typography
            variant="h6"
            fontWeight={600}
            color="inherit"
            noWrap
          >
        	geo.riek.me
          </Typography>
        </Stack>

        {username && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            <Button component={Link} href="/game" startIcon={<SportsEsportsIcon />}>
              Play
            </Button>
            <Button component={Link} href="/history" startIcon={<HistoryIcon />}>
              History
            </Button>
            <Button component={Link} href="/game/maps" startIcon={<MapIcon />}>
              Maps
            </Button>
            <Button component={Link} href="/profile" startIcon={<AccountCircleIcon />}>
              Profile
            </Button>
            <SignOutButton />
          </Stack>
        )}

        <Box sx={{ display: { xs: "block", sm: "none" } }}>
          <IconButton
            color="inherit"
            aria-label="Open menu"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Drawer anchor="right" open={sidebarOpen} onClose={closeSidebar}>
            <Box
              role="presentation"
              sx={{
                width: 260,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <List>
                <ListItemButton
                  onClick={() => setMode(isDark ? "light" : "dark")}
                >
                  <ListItemIcon>
                    {isDark ? (
                      <LightModeIcon fontSize="small" />
                    ) : (
                      <DarkModeIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText>
                    {isDark ? "Light mode" : "Dark mode"}
                  </ListItemText>
                </ListItemButton>
                <Divider sx={{ my: 1 }} />
                {username ? (
                  <>
                    <ListItemButton
                      component={Link}
                      href="/game"
                      onClick={closeSidebar}
                    >
                      <ListItemIcon>
                        <SportsEsportsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Play</ListItemText>
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      href="/history"
                      onClick={closeSidebar}
                    >
                      <ListItemIcon>
                        <HistoryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>History</ListItemText>
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      href="/game/maps"
                      onClick={closeSidebar}
                    >
                      <ListItemIcon>
                        <MapIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Maps</ListItemText>
                    </ListItemButton>
                    <ListItemButton
                      component={Link}
                      href="/profile"
                      onClick={closeSidebar}
                    >
                      <ListItemIcon>
                        <AccountCircleIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Profile</ListItemText>
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => {
                        closeSidebar();
                        logout();
                      }}
                    >
                      <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Sign Out</ListItemText>
                    </ListItemButton>
                  </>
                ) : (
                  <ListItemButton
                    component={Link}
                    href="/login"
                    onClick={closeSidebar}
                  >
                    <ListItemIcon>
                      <LoginIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Login</ListItemText>
                  </ListItemButton>
                )}
              </List>

              <Box sx={{ flexGrow: 1 }} />

              <Divider />
              <Typography
                variant="caption"
                color="text.secondary"
                textAlign="center"
                sx={{ py: 2 }}
              >
                &copy; {new Date().getFullYear()} geo.riek.me
              </Typography>
            </Box>
          </Drawer>
        </Box>

        <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
          <ColorModeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
