"use client";

import { Alert, Box, Button } from "@mui/material";
import { ConnectionStatus } from "@/lib/hooks/use-multiplayer-socket";

interface Props {
  status: ConnectionStatus;
  onReconnect: () => void;
}

const ConnectionBanner: React.FC<Props> = ({ status, onReconnect }) => {
  if (status === "open" || status === "connecting") return null;

  return (
    <Box sx={{ position: "absolute", top: 8, left: 8, right: 8, zIndex: 30 }}>
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onReconnect}>
            Reconnect
          </Button>
        }
      >
        Connection lost. Your opponent may not see your actions until you reconnect.
      </Alert>
    </Box>
  );
};

export default ConnectionBanner;
