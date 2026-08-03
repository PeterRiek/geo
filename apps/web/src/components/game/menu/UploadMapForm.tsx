"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const DEFAULT_MAX_ERROR_DISTANCE_KM = 10_000;

const UploadMapForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [coordinatesFile, setCoordinatesFile] = useState<File>();
  const [imageFile, setImageFile] = useState<File>();
  const [isPublic, setIsPublic] = useState(false);
  const [maxErrorDistanceKm, setMaxErrorDistanceKm] = useState(DEFAULT_MAX_ERROR_DISTANCE_KM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const canSubmit =
    name.trim() &&
    coordinatesFile &&
    imageFile &&
    maxErrorDistanceKm > 0 &&
    maxErrorDistanceKm <= 20_000 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordinatesFile || !imageFile) return;

    setSubmitting(true);
    setError(undefined);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("coordinates", coordinatesFile);
      formData.append("image", imageFile);
      formData.append("isPublic", String(isPublic));
      formData.append("maxErrorDistanceKm", String(maxErrorDistanceKm));

      const res = await fetch("/api/gamemap", { method: "POST", body: formData });
      const data = await res.json().catch(() => undefined);

      if (!res.ok) {
        setError(data?.error ?? "Failed to upload map.");
        return;
      }

      setSuccess(true);
      setName("");
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
        <Typography variant="h5" gutterBottom>
          Upload a Map
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          A name, a coordinates JSON file (a <code>customCoordinates</code> array of{" "}
          <code>{"{ lat, lng }"}</code> points), and a preview image.
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
            label="Boundary scale (max error distance, km)"
            type="number"
            value={maxErrorDistanceKm}
            onChange={(e) => setMaxErrorDistanceKm(Number(e.target.value))}
            helperText="How far a wrong guess can be before it scores 0 — smaller for tightly-bounded maps, larger for world maps."
            slotProps={{ htmlInput: { min: 1, max: 20_000 } }}
            fullWidth
            required
          />

          <FormControlLabel
            control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
            label={isPublic ? "Public — anyone can play this map" : "Private — only you can play this map"}
          />

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

          {error && <Alert severity="error">{error}</Alert>}
          {success && (
            <Alert severity="success" action={
              <Button color="inherit" size="small" onClick={() => router.push("/game")}>
                Go play
              </Button>
            }>
              Map uploaded!
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
