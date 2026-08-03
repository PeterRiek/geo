import { auth } from "@/auth";
import GameFallback from "@/components/game/game-fallback";
import HistoryList from "@/components/game/history/history-list";
import { Box, Typography } from "@mui/material";

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" textAlign="center" sx={{ mb: 3 }}>
        Game History
      </Typography>
      <HistoryList />
    </Box>
  );
};

export default HistoryPage;
