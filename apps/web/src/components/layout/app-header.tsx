"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Stack,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PublicIcon from "@mui/icons-material/Public";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "@/lib/actions/auth";
import SignOutButton from "@/components/auth/sing-out-button";
import ColorModeToggle from "./color-mode-toggle";

interface Props {
  username: string | null;
}

const AppHeader: React.FC<Props> = ({ username }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const closeMenu = () => setAnchorEl(null);

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
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            GeoGuessr Clone
          </Typography>
        </Stack>

        {username && (
          <>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              <Button component={Link} href="/game" startIcon={<SportsEsportsIcon />}>
                Play
              </Button>
              <Button component={Link} href="/profile" startIcon={<AccountCircleIcon />}>
                {username}
              </Button>
              <SignOutButton />
            </Stack>

            <Box sx={{ display: { xs: "block", sm: "none" } }}>
              <IconButton
                color="inherit"
                aria-label="Open menu"
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <MenuIcon />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
                <MenuItem component={Link} href="/game" onClick={closeMenu}>
                  <ListItemIcon>
                    <SportsEsportsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Play</ListItemText>
                </MenuItem>
                <MenuItem component={Link} href="/profile" onClick={closeMenu}>
                  <ListItemIcon>
                    <AccountCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>{username}</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Sign Out</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </>
        )}
        <ColorModeToggle />
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
