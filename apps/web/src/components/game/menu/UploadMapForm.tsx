"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const UploadMapForm: React.FC = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [coordinatesFile, setCoordinatesFile] = useState<File>();
  const [imageFile, setImageFile] = useState<File>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);

  const canSubmit = name.trim() && coordinatesFile && imageFile && !submitting;

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
