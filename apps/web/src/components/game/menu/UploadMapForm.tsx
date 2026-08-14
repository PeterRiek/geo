"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { apiFetch } from "@/lib/api-fetch";

const InfoTooltip: React.FC<{ title: string }> = ({ title }) => (
  <Tooltip title={title}>
    <IconButton size="small" edge="end" tabIndex={-1}>
      <InfoOutlinedIcon fontSize="small" />
    </IconButton>
  </Tooltip>
);

const DEFAULT_MAX_ERROR_DISTANCE_KM = 10_000;

const UploadMapForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coordinatesFile, setCoordinatesFile] = useState<File>();
  const [imageFile, setImageFile] = useState<File>();
  const [isPublic, setIsPublic] = useState(false);
  const [maxErrorDistanceKm, setMaxErrorDistanceKm] = useState(DEFAULT_MAX_ERROR_DISTANCE_KM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calculateError, setCalculateError] = useState<string>();

  const canSubmit =
    name.trim() &&
    coordinatesFile &&
    imageFile &&
    maxErrorDistanceKm > 0 &&
    maxErrorDistanceKm <= 20_000 &&
    !submitting;

  const handleCalculate = async () => {
    if (!coordinatesFile) return;

    setCalculating(true);
    setCalculateError(undefined);
    try {
      const formData = new FormData();
      formData.append("coordinates", coordinatesFile);

      const res = await apiFetch("/api/gamemap/calculate-max-distance", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => undefined);

      if (!res.ok) {
        setCalculateError(data?.error ?? "Failed to calculate.");
        return;
      }

      setMaxErrorDistanceKm(Math.round(data.maxErrorDistanceKm));
    } catch {
      setCalculateError("Failed to calculate. Check your connection and try again.");
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatesFile || !imageFile) return;

    setSubmitting(true);
    setError(undefined);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("coordinates", coordinatesFile);
      formData.append("image", imageFile);
      formData.append("isPublic", String(isPublic));
      formData.append("maxErrorDistanceKm", String(maxErrorDistanceKm));

      const res = await apiFetch("/api/gamemap", { method: "POST", body: formData });
      const data = await res.json().catch(() => undefined);

      if (!res.ok) {
        setError(data?.error ?? "Failed to upload map.");
        return;
      }

      setSuccess(true);
      setName("");
      setDescription("");
      setCoordinatesFile(undefined);
      setImageFile(undefined);
      setIsPublic(false);
      setMaxErrorDistanceKm(DEFAULT_MAX_ERROR_DISTANCE_KM);
    } catch {
      setError("Failed to upload map. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Upload a Map
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Map name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <InfoTooltip title="Optional — shown to players before they start a round on this map." />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Boundary scale (max error distance, km)"
              type="number"
              value={maxErrorDistanceKm}
              onChange={(e) => setMaxErrorDistanceKm(Number(e.target.value))}
              slotProps={{
                htmlInput: { min: 1, max: 20_000 },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <InfoTooltip title="How far a wrong guess can be before it scores 0 — smaller for tightly-bounded maps, larger for world maps." />
                    </InputAdornment>
                  ),
                },
              }}
              fullWidth
              required
            />
            <Button
              variant="outlined"
              onClick={handleCalculate}
              disabled={!coordinatesFile}
              loading={calculating}
              sx={{ flexShrink: 0, height: 56 }}
            >
              Calculate
            </Button>
          </Stack>
          {calculateError && <Alert severity="error">{calculateError}</Alert>}

          <FormControlLabel
            control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
            label={isPublic ? "Public — anyone can play this map" : "Private — only you can play this map"}
          />

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
            >
              {coordinatesFile ? coordinatesFile.name : "Choose coordinates JSON"}
              <input
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => setCoordinatesFile(e.target.files?.[0])}
              />
            </Button>
            <InfoTooltip title={'A JSON file with a "customCoordinates" array of { lat, lng } points.'} />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
            >
              {imageFile ? imageFile.name : "Choose preview image"}
              <input
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={(e) => setImageFile(e.target.files?.[0])}
              />
            </Button>
            <InfoTooltip title="JPEG or PNG, up to 5MB." />
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success" action={
              <Button color="inherit" size="small" onClick={() => router.push("/game/maps")}>
                View all maps
              </Button>
            }>
              Map uploaded!
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="outlined"
              size="large"
              disabled={submitting}
              onClick={() => router.push("/game/maps")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" size="large" disabled={!canSubmit} loading={submitting}>
              Upload
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
};

export default UploadMapForm;
