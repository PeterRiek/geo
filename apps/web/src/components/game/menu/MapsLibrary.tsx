"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Popover,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import CheckIcon from "@mui/icons-material/Check";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { getPublicBackendOrigin } from "@/lib/backend-url";
import { apiFetch } from "@/lib/api-fetch";
import MapListSkeleton from "./MapListSkeleton";

interface GameMap {
  id: number;
  name: string;
  imageUrl?: string;
  description?: string;
  ownerUsername?: string;
  isPublic: boolean;
  isOwn: boolean;
  isFavorite: boolean;
  maxErrorDistanceKm: number;
  playCount: number;
}

type SortOption = "title-asc" | "title-desc" | "creator-asc" | "creator-desc" | "popular";

const SORT_LABELS: Record<SortOption, string> = {
  "title-asc": "Title (A–Z)",
  "title-desc": "Title (Z–A)",
  "creator-asc": "Creator (A–Z)",
  "creator-desc": "Creator (Z–A)",
  popular: "Most played",
};

// Official/ownerless maps have no ownerUsername, treated as "" — sorts before any name in A-Z
// (and after in Z-A), same as any other string comparison.
const compareOwner = (a: GameMap, b: GameMap, dir: 1 | -1) =>
  dir * (a.ownerUsername ?? "").localeCompare(b.ownerUsername ?? "");

const SORT_COMPARATORS: Record<SortOption, (a: GameMap, b: GameMap) => number> = {
  "title-asc": (a, b) => a.name.localeCompare(b.name),
  "title-desc": (a, b) => b.name.localeCompare(a.name),
  "creator-asc": (a, b) => compareOwner(a, b, 1),
  "creator-desc": (a, b) => compareOwner(a, b, -1),
  popular: (a, b) => b.playCount - a.playCount || a.name.localeCompare(b.name),
};

interface EditState {
  map: GameMap;
  name: string;
  description: string;
  isPublic: boolean;
  maxErrorDistanceKm: number;
  submitting: boolean;
  error?: string;
  calculating?: boolean;
  calculateError?: string;
}

type MapCategory = "official" | "yours" | "community";

const mapCategory = (map: GameMap): MapCategory =>
  map.isOwn ? "yours" : map.ownerUsername ? "community" : "official";

const MapsLibrary: React.FC = () => {
  const router = useRouter();
  const [maps, setMaps] = useState<GameMap[]>();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<MapCategory, boolean>>({
    official: true,
    yours: true,
    community: true,
  });
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [loadError, setLoadError] = useState<string>();
  const [edit, setEdit] = useState<EditState>();
  const [deleteTarget, setDeleteTarget] = useState<GameMap>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    const loadMaps = async () => {
      try {
        const res = await apiFetch("/api/gamemap");
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

  const toggleFavorite = async (map: GameMap, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextFavorite = !map.isFavorite;
    setMaps((prev) =>
      prev?.map((m) => (m.id === map.id ? { ...m, isFavorite: nextFavorite } : m))
    );
    try {
      const res = await apiFetch(`/api/gamemap/${map.id}/favorite`, {
        method: nextFavorite ? "PUT" : "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to update favorite");
      }
    } catch {
      setMaps((prev) =>
        prev?.map((m) => (m.id === map.id ? { ...m, isFavorite: map.isFavorite } : m))
      );
    }
  };

  const filteredMaps = maps
    ?.filter(
      (map) =>
        map.name.toLowerCase().includes(search.trim().toLowerCase()) &&
        filters[mapCategory(map)] &&
        (!favoritesOnly || map.isFavorite)
    )
    .sort(SORT_COMPARATORS[sortBy]);

  const toggleFilter = (category: MapCategory) =>
    setFilters((prev) => ({ ...prev, [category]: !prev[category] }));

  const openEdit = (map: GameMap) => {
    setEdit({
      map,
      name: map.name,
      description: map.description ?? "",
      isPublic: map.isPublic,
      maxErrorDistanceKm: map.maxErrorDistanceKm,
      submitting: false,
    });
  };

  const calculateEditBoundaryScale = async () => {
    if (!edit) return;
    setEdit({ ...edit, calculating: true, calculateError: undefined });

    try {
      const res = await apiFetch(`/api/gamemap/${edit.map.id}/calculate-max-distance`);
      const data = await res.json().catch(() => undefined);

      if (!res.ok) {
        setEdit({ ...edit, calculating: false, calculateError: data?.error ?? "Failed to calculate." });
        return;
      }

      setEdit({
        ...edit,
        calculating: false,
        maxErrorDistanceKm: Math.round(data.maxErrorDistanceKm),
      });
    } catch {
      setEdit({
        ...edit,
        calculating: false,
        calculateError: "Failed to calculate. Check your connection and try again.",
      });
    }
  };

  const submitEdit = async () => {
    if (!edit) return;
    setEdit({ ...edit, submitting: true, error: undefined });

    try {
      const res = await apiFetch(`/api/gamemap/${edit.map.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: edit.name.trim(),
          description: edit.description.trim(),
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
      const res = await apiFetch(`/api/gamemap/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => undefined);
        setDeleteError(data?.error ?? "Failed to delete map.");
        return;
      }
      setMaps((prev) => prev?.filter((m) => m.id !== deleteTarget.id));
      setDeleteTarget(undefined);
      setEdit(undefined);
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
        <IconButton
          aria-label="Maps menu"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          open={!!menuAnchor}
          anchorEl={menuAnchor}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem
            component="a"
            href="/game/maps/upload"
            onClick={() => setMenuAnchor(null)}
          >
            <ListItemIcon>
              <UploadFileIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Upload a map</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>

      {loadError && <Alert severity="error">{loadError}</Alert>}

      {!loadError && (!maps || maps.length > 0) && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search maps"
            fullWidth
            size="small"
            disabled={!maps}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            disabled={!maps}
            sx={{
              minWidth: 0,
              height: 40,
              flexShrink: 0,
              px: { xs: 1.5, sm: 2 },
              color: "text.secondary",
              borderColor: "divider",
              "& .MuiButton-startIcon": { mx: { xs: 0, sm: undefined } },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Filter
            </Box>
          </Button>
          <Popover
            open={!!filterAnchor}
            anchorEl={filterAnchor}
            onClose={() => setFilterAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <FormGroup sx={{ p: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.official}
                    onChange={() => toggleFilter("official")}
                  />
                }
                label="Official"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.yours}
                    onChange={() => toggleFilter("yours")}
                  />
                }
                label="Yours"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.community}
                    onChange={() => toggleFilter("community")}
                  />
                }
                label="Community"
              />
              <Divider sx={{ my: 1 }} />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={favoritesOnly}
                    onChange={() => setFavoritesOnly((prev) => !prev)}
                  />
                }
                label="Favorites only"
              />
            </FormGroup>
          </Popover>
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={(e) => setSortAnchor(e.currentTarget)}
            disabled={!maps}
            sx={{
              minWidth: 0,
              height: 40,
              flexShrink: 0,
              px: { xs: 1.5, sm: 2 },
              color: "text.secondary",
              borderColor: "divider",
              "& .MuiButton-startIcon": { mx: { xs: 0, sm: undefined } },
            }}
          >
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              Sort
            </Box>
          </Button>
          <Menu
            open={!!sortAnchor}
            anchorEl={sortAnchor}
            onClose={() => setSortAnchor(null)}
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <MenuItem
                key={option}
                selected={sortBy === option}
                onClick={() => {
                  setSortBy(option);
                  setSortAnchor(null);
                }}
              >
                <ListItemIcon>
                  {sortBy === option && <CheckIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>{SORT_LABELS[option]}</ListItemText>
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      )}

      {!maps && !loadError && <MapListSkeleton />}

      {maps && maps.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No maps yet — upload one to get started.
        </Typography>
      )}

      {maps && maps.length > 0 && filteredMaps?.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          {search
            ? `No maps match "${search}".`
            : "No maps match the selected filters."}
        </Typography>
      )}

      <Stack spacing={1} sx={{ maxHeight: "60vh", overflowY: "auto", pr: 0.5 }}>
        {filteredMaps?.map((map) => (
          <Paper
            key={map.id}
            onClick={() => handlePlay(map.id)}
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 1,
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Stack
              direction="row"
              spacing={0.5}
              sx={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
            >
              <Tooltip title={map.isFavorite ? "Remove from favorites" : "Add to favorites"}>
                <IconButton onClick={(e) => toggleFavorite(map, e)}>
                  {map.isFavorite ? (
                    <StarIcon fontSize="small" sx={{ color: "warning.main" }} />
                  ) : (
                    <StarBorderIcon fontSize="small" />
                  )}
                </IconButton>
              </Tooltip>
              {map.isOwn && (
                <Tooltip title="Edit map">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(map);
                    }}
                    sx={{
                      bgcolor: "background.paper",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
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
                {!map.isPublic && (
                  <Tooltip title="Private">
                    <VisibilityOffIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </Tooltip>
                )}
              </Stack>
              {map.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{ mb: (map.isOwn || map.ownerUsername) ? 0.5 : 0 }}
                >
                  {map.description}
                </Typography>
              )}
              {(map.isOwn || map.ownerUsername) && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PersonIcon fontSize="inherit" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {map.isOwn ? "You" : map.ownerUsername}
                  </Typography>
                </Stack>
              )}
            </Box>
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
              label="Description"
              value={edit?.description ?? ""}
              onChange={(e) => edit && setEdit({ ...edit, description: e.target.value })}
              multiline
              minRows={2}
              fullWidth
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Boundary scale (max error distance, km)"
                type="number"
                value={edit?.maxErrorDistanceKm ?? 0}
                onChange={(e) => edit && setEdit({ ...edit, maxErrorDistanceKm: Number(e.target.value) })}
                slotProps={{ htmlInput: { min: 1, max: 20_000 } }}
                fullWidth
                required
              />
              <Button
                variant="outlined"
                onClick={calculateEditBoundaryScale}
                loading={edit?.calculating}
                sx={{ flexShrink: 0, height: 56 }}
              >
                Calculate
              </Button>
            </Stack>
            {edit?.calculateError && <Alert severity="error">{edit.calculateError}</Alert>}
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

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                Danger zone
              </Typography>
              <Button
                onClick={() => edit && setDeleteTarget(edit.map)}
                color="error"
                variant="outlined"
                startIcon={<DeleteIcon />}
                fullWidth
              >
                Delete Map
              </Button>
            </Box>
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
