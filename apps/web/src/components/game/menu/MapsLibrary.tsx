"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { getPublicBackendOrigin } from "@/lib/backend-url";
import MapListSkeleton from "./MapListSkeleton";

interface GameMap {
  id: number;
  name: string;
  imageUrl?: string;
  ownerUsername?: string;
  isPublic: boolean;
  isOwn: boolean;
  maxErrorDistanceKm: number;
}

interface EditState {
  map: GameMap;
  name: string;
  isPublic: boolean;
  maxErrorDistanceKm: number;
  submitting: boolean;
  error?: string;
}

const MapsLibrary: React.FC = () => {
  const router = useRouter();
  const [maps, setMaps] = useState<GameMap[]>();
  const [loadError, setLoadError] = useState<string>();
  const [edit, setEdit] = useState<EditState>();
  const [deleteTarget, setDeleteTarget] = useState<GameMap>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const res = await fetch("/api/gamemap");
        if (!res.ok) {
          setLoadError("Failed to load maps.");
          return;
        }
        setMaps(await res.json());
      } catch {
        setLoadError("Failed to load maps. Check your connection and try again.");
      }
    };
    loadMaps();
  }, []);

  const handlePlay = (id: number) => {
    router.push(`/game?mapId=${id}`);
  };

  const openEdit = (map: GameMap) => {
    setEdit({
      map,
      name: map.name,
      isPublic: map.isPublic,
      maxErrorDistanceKm: map.maxErrorDistanceKm,
      submitting: false,
    });
  };

  const submitEdit = async () => {
    if (!edit) return;
    setEdit({ ...edit, submitting: true, error: undefined });

    try {
      const res = await fetch(`/api/gamemap/${edit.map.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: edit.name.trim(),
          isPublic: edit.isPublic,
          maxErrorDistanceKm: edit.maxErrorDistanceKm,
        }),
      });
      const data = await res.json().catch(() => undefined);

      if (!res.ok) {
        setEdit({ ...edit, submitting: false, error: data?.error ?? "Failed to save changes." });
        return;
      }

      setMaps((prev) => prev?.map((m) => (m.id === data.id ? data : m)));
      setEdit(undefined);
    } catch {
      setEdit({ ...edit, submitting: false, error: "Failed to save changes. Check your connection and try again." });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(undefined);

    try {
      const res = await fetch(`/api/gamemap/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => undefined);
        setDeleteError(data?.error ?? "Failed to delete map.");
        return;
      }
      setMaps((prev) => prev?.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(undefined);
    } catch {
      setDeleteError("Failed to delete map. Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Maps</Typography>
        <Button href="/game/maps/upload" variant="contained" startIcon={<UploadFileIcon />}>
          Upload a map
        </Button>
      </Stack>

      {loadError && <Alert severity="error">{loadError}</Alert>}

      {!maps && !loadError && <MapListSkeleton />}

      {maps && maps.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No maps yet — upload one to get started.
        </Typography>
      )}

      <Stack spacing={1}>
        {maps?.map((map) => (
          <Paper
            key={map.id}
            sx={{ display: "flex", alignItems: "center", gap: 2, p: 1 }}
          >
            <Box
              component="img"
              src={
                map.imageUrl
                  ? `${getPublicBackendOrigin()}${map.imageUrl}`
                  : undefined
              }
              alt=""
              sx={{
                width: 96,
                height: 96,
                borderRadius: 1,
                objectFit: "cover",
                flexShrink: 0,
                bgcolor: "action.hover",
              }}
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {map.name}
                </Typography>
                <Chip
                  size="small"
                  label={map.isPublic ? "Public" : "Private"}
                  color={map.isPublic ? "success" : "default"}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {map.isOwn ? "You" : map.ownerUsername ?? "Unknown"} · boundary scale{" "}
                {map.maxErrorDistanceKm.toLocaleString()} km
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              {map.isOwn && (
                <>
                  <Tooltip title="Edit map">
                    <IconButton onClick={() => openEdit(map)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete map">
                    <IconButton onClick={() => setDeleteTarget(map)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <Button variant="contained" onClick={() => handlePlay(map.id)}>
                Play
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Dialog open={!!edit} onClose={() => setEdit(undefined)} fullWidth maxWidth="xs">
        <DialogTitle>Edit map</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Map name"
              value={edit?.name ?? ""}
              onChange={(e) => edit && setEdit({ ...edit, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Boundary scale (max error distance, km)"
              type="number"
              value={edit?.maxErrorDistanceKm ?? 0}
              onChange={(e) => edit && setEdit({ ...edit, maxErrorDistanceKm: Number(e.target.value) })}
              slotProps={{ htmlInput: { min: 1, max: 20_000 } }}
              fullWidth
              required
            />
            <FormControlLabel
              control={
                <Switch
                  checked={edit?.isPublic ?? false}
                  onChange={(e) => edit && setEdit({ ...edit, isPublic: e.target.checked })}
                />
              }
              label={edit?.isPublic ? "Public — anyone can play this map" : "Private — only you can play this map"}
            />
            {edit?.error && <Alert severity="error">{edit.error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(undefined)}>Cancel</Button>
          <Button
            onClick={submitEdit}
            variant="contained"
            loading={edit?.submitting}
            disabled={!edit?.name.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(undefined)}>
        <DialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This can&apos;t be undone.
          </Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(undefined)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" loading={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MapsLibrary;
