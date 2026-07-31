"use client";

import { Box, Button, CircularProgress, Paper, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface Props {
  variant: "loading" | "error";
  title: string;
  description?: string;
  onRetry?: () => void;
}

const GameFallback: React.FC<Props> = ({ variant, title, description, onRetry }) => (
  <Box
    sx={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      p: 4,
    }}
  >
    {variant === "loading" ? (
      <>
        <CircularProgress size={64} />
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </>
    ) : (
      <Paper
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          p: 3,
          maxWidth: 420,
          textAlign: "center",
        }}
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
        <Typography variant="h6">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
        {onRetry && (
          <Button variant="contained" onClick={onRetry} sx={{ mt: 1 }}>
            Retry
          </Button>
        )}
      </Paper>
    )}
  </Box>
);

export default GameFallback;
