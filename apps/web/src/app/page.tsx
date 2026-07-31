"use server";

import { auth } from "@/auth";
import { MAPS_ERROR_PARAM } from "@/lib/maps";
import SignOutButton from "@/components/auth/sing-out-button";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import LoginIcon from "@mui/icons-material/Login";
import {
  Alert,
  Avatar,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const HomePage = async ({ searchParams }: HomePageProps) => {
  const session = await auth();
  const params = await searchParams;
  const showMapsError = params[MAPS_ERROR_PARAM] === "1";

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
      {showMapsError && (
        <Alert severity="error" sx={{ width: "100%", maxWidth: 480 }}>
          The game was ended because Google Maps couldn&apos;t load. Please
          try again later.
        </Alert>
      )}
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
          <Button href="/register">Create Account</Button>
        </Paper>
      )}
    </Container>
  );
};

export default HomePage;
