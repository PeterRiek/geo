import { auth } from "@/auth";
import GameFallback from "@/components/game/game-fallback";
import HistoryList from "@/components/game/history/history-list";
import { Box, Paper, Typography } from "@mui/material";

const HistoryPage = async () => {
  const session = await auth();

  if (!session?.accessToken) {
    return (
      <GameFallback
        variant="error"
        title="You need to be signed in to view your history."
        description="Please sign in and try again."
      />
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 3 }}>
      <Typography variant="h4" textAlign="center" sx={{ mb: 3 }}>
        Game History
      </Typography>
      <Paper
        sx={{
          flex: 1,
          minHeight: 0,
          p: 1,
          display: "flex",
          width: "100%",
          maxWidth: 650,
          mx: "auto",
        }}
      >
        <HistoryList />
      </Paper>
    </Box>
  );
};

export default HistoryPage;
