"use server";

import { auth } from "@/auth";
import { MAPS_ERROR_PARAM } from "@/lib/maps";
import LoginForm from "@/components/auth/login-form";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { Alert, Button, Container, Paper, Typography } from "@mui/material";

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface CanPlayData {
  gamesPlayedToday: number;
  canPlay: boolean;
  maxGamesPerDay: number;
}

const HomePage = async ({ searchParams }: HomePageProps) => {
  const session = await auth();
  const params = await searchParams;
  const showMapsError = params[MAPS_ERROR_PARAM] === "1";

  let canPlay: CanPlayData | undefined;
  if (session?.user) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/can-play`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      });
      if (res.ok) canPlay = await res.json();
    } catch {
      // fall back to CTA without a play count below
    }
  }

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
      {session?.user ? (
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: 480,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h4" textAlign="center" fontWeight={500}>
            Welcome back, {session.user.name}
          </Typography>
          {canPlay && (
            <Typography variant="body2" color="text.secondary">
              {canPlay.gamesPlayedToday}
              {canPlay.maxGamesPerDay >= 0 ? ` / ${canPlay.maxGamesPerDay}` : " / unlimited"}{" "}
              games played today
            </Typography>
          )}
          <Button
            href="/game"
            variant="contained"
            size="large"
            endIcon={<SportsEsportsIcon />}
            sx={{ px: 6 }}
          >
            Play
          </Button>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ width: "100%", maxWidth: 480, p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Sign in to play
          </Typography>
          <LoginForm />
        </Paper>
      )}
    </Container>
  );
};

export default HomePage;
