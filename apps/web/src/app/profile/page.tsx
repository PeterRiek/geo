"use client";

import { logout } from "@/lib/actions/auth";
import {
  Alert,
  Avatar,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface UserData {
  id: number;
  username: string;
}

interface CanPlayData {
  gamesPlayedToday: number;
  canPlay: boolean;
  maxGamesPerDay: number;
}

const ProfilePage = () => {
  const router = useRouter();
  const [data, setData] = useState<UserData>();
  const [canPlay, setCanPlay] = useState<CanPlayData>();
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const resMe = await fetch("/api/user/me");
      if (resMe.ok) setData(await resMe.json());

      const resCanPlay = await fetch("/api/user/can-play");
      if (resCanPlay.ok) setCanPlay(await resCanPlay.json());

      setLoading(false);
    };
    init();
  }, []);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/auth/delete", { method: "DELETE" });
      if (!res.ok) {
        setDeleteError("Failed to delete account. Please try again.");
        setDeleting(false);
        return;
      }
      await logout();
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        height: "100%",
        p: 4,
      }}
    >
      {loading ? (
        <LinearProgress sx={{ width: "100%" }} />
      ) : (
        <Paper sx={{ width: "100%", p: 4 }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Avatar sx={{ width: 72, height: 72 }}>
              <AccountCircleIcon sx={{ fontSize: 56 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={500}>
              {data?.username ?? "Unknown user"}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Games played today
            </Typography>
            <Typography variant="h6">
              {canPlay?.gamesPlayedToday ?? 0}
              {canPlay && canPlay.maxGamesPerDay >= 0
                ? ` / ${canPlay.maxGamesPerDay}`
                : " / unlimited"}
            </Typography>
            <Typography variant="body2" color={canPlay?.canPlay ? "success.main" : "error.main"}>
              {canPlay?.canPlay ? "You can still play today" : "Daily limit reached"}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Button onClick={() => router.push("/game")} variant="contained">
              Play a game
            </Button>
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              color="error"
              startIcon={<DeleteForeverIcon />}
            >
              Delete Account
            </Button>
          </Stack>
        </Paper>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete your account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This permanently deletes your account and cannot be undone.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            loading={deleting}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
