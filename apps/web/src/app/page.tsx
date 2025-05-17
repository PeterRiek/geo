"use server";

import { auth } from "@/auth";
import SignOutButton from "@/components/auth/sing-out-button";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import LoginIcon from "@mui/icons-material/Login";
import {
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useEffect, useState } from "react";

const HomePage = async () => {
  const session = await auth();
    

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        py: 6,
        px: 3,
      }}
    >
      {session?.user?.image && (
        <Avatar
          src={session?.user?.image}
          alt="Avatar"
          sx={{ width: "10%", height: "10%" }}
        />
      )}
      <Typography variant="h2" textAlign={"center"}>
        {session?.user
          ? `Welcome ${session.user.name}`
          : "Please sign in first"}
      </Typography>
      {session?.user ? (
        <Paper sx={{ p: 1 }}>
          <Stack>
            <Button endIcon={<AccountCircleIcon />} href="/profile">
              Profile
            </Button>
            <Button endIcon={<SportsEsportsIcon />} href="/game">
              Game
            </Button>
            <SignOutButton />
          </Stack>
        </Paper>
      ) : (
        <Paper sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}>
          <Button endIcon={<LoginIcon />} href="/login">
            Sign In
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default HomePage;
