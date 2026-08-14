"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { logout } from "@/lib/actions/auth";
import { apiFetch } from "@/lib/api-fetch";
import SignOutButton from "@/components/auth/sing-out-button";
import HistoryList from "@/components/game/history/history-list";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface UserData {
  id: number;
  username: string;
  roles?: string[];
  permissions?: string[];
}

interface CanPlayData {
  gamesPlayedToday: number;
  canPlay: boolean;
  maxGamesPerDay: number;
}

const ProfilePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "history" ? "history" : "overview";

  const [data, setData] = useState<UserData>();
  const [canPlay, setCanPlay] = useState<CanPlayData>();
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [username, setUsername] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [keyCode, setKeyCode] = useState("");
  const [keyActivating, setKeyActivating] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [keySuccess, setKeySuccess] = useState("");

  const refreshUser = async () => {
    const resMe = await apiFetch("/api/user/me");
    if (resMe.ok) {
      const me = await resMe.json();
      setData(me);
      setUsername(me.username);
    }

    const resCanPlay = await apiFetch("/api/user/can-play");
    if (resCanPlay.ok) setCanPlay(await resCanPlay.json());
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };
    init();
  }, []);

  const openActivateKey = () => {
    setKeyCode("");
    setKeyError("");
    setKeySuccess("");
    setKeyDialogOpen(true);
  };

  const handleActivateKey = async () => {
    const trimmed = keyCode.trim();
    if (!trimmed) return;

    setKeyActivating(true);
    setKeyError("");
    setKeySuccess("");
    try {
      const res = await apiFetch("/api/user/activate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const body = await res.json().catch(() => undefined);

      if (!res.ok) {
        setKeyError(body?.error ?? "Failed to activate key.");
        return;
      }

      setKeySuccess("Key activated! Your account has been updated.");
      setKeyCode("");
      await refreshUser();
    } catch {
      setKeyError("Failed to activate key. Check your connection and try again.");
    } finally {
      setKeyActivating(false);
    }
  };

  const openEdit = () => {
    setUsername(data?.username ?? "");
    setUsernameError("");
    setUsernameSaved(false);
    setEditOpen(true);
  };

  const handleSaveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed === data?.username) return;

    setUsernameSaving(true);
    setUsernameError("");
    setUsernameSaved(false);
    try {
      const res = await apiFetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });
      const body = await res.json().catch(() => undefined);

      if (!res.ok) {
        setUsernameError(body?.error ?? "Failed to update username.");
        return;
      }

      setData((prev) => (prev ? { ...prev, username: body.username } : prev));
      setUsername(body.username);
      setUsernameSaved(true);
      router.refresh();
    } catch {
      setUsernameError("Failed to update username. Check your connection and try again.");
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await apiFetch("/api/auth/delete", { method: "DELETE" });
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
        flexDirection: "column",
        height: "100%",
        p: 4,
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, value) => router.push(`/profile?tab=${value}`)}
        centered
        sx={{ mb: 2 }}
      >
        <Tab label="Overview" value="overview" />
        <Tab label="History" value="history" />
      </Tabs>

      {tab === "history" ? (
        <Paper sx={{ flex: 1, minHeight: 0, p: 1, display: "flex" }}>
          <HistoryList />
        </Paper>
      ) : loading ? (
        <Paper sx={{ width: "100%", p: 4 }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Skeleton variant="circular" width={72} height={72} />
            <Skeleton variant="text" width={140} height={32} />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1} sx={{ mb: 3 }}>
            <Skeleton variant="text" width={140} height={20} />
            <Skeleton variant="text" width={100} height={32} />
            <Skeleton variant="text" width={180} height={20} />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Skeleton variant="rounded" height={36} />
            <Skeleton variant="rounded" height={36} />
          </Stack>
        </Paper>
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
            <Button onClick={openEdit} startIcon={<EditIcon />}>
              Edit Profile
            </Button>
            <Button onClick={openActivateKey} startIcon={<VpnKeyIcon />}>
              Activate Key
            </Button>
            {data?.permissions?.includes("MANAGE_KEYS") && (
              <Button
                component={Link}
                href="/admin/keys"
                startIcon={<AdminPanelSettingsIcon />}
              >
                Manage Activation Keys
              </Button>
            )}
            <SignOutButton />
          </Stack>
        </Paper>
      )}

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameSaved(false);
              }}
              fullWidth
              required
            />
            {usernameError && <Alert severity="error">{usernameError}</Alert>}
            {usernameSaved && <Alert severity="success">Username updated.</Alert>}

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                Danger zone
              </Typography>
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                color="error"
                variant="outlined"
                startIcon={<DeleteForeverIcon />}
                fullWidth
              >
                Delete Account
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveUsername}
            variant="contained"
            loading={usernameSaving}
            disabled={!username.trim() || username.trim() === data?.username}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={keyDialogOpen} onClose={() => setKeyDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Activate Key</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DialogContentText>
              Paste an activation key to redeem a perk on your account.
            </DialogContentText>
            <TextField
              label="Activation key"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              value={keyCode}
              onChange={(e) => {
                setKeyCode(e.target.value);
                setKeyError("");
                setKeySuccess("");
              }}
              fullWidth
              autoFocus
            />
            {keyError && <Alert severity="error">{keyError}</Alert>}
            {keySuccess && <Alert severity="success">{keySuccess}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKeyDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleActivateKey}
            variant="contained"
            loading={keyActivating}
            disabled={!keyCode.trim()}
          >
            Activate
          </Button>
        </DialogActions>
      </Dialog>

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
