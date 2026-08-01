"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  Paper,
} from "@mui/material";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const username = data.get("username");
    const password = data.get("password");
    const confirmPassword = data.get("confirmPassword");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.status === 409) {
      setLoading(false);
      setError("Username already exists");
      return;
    }

    if (!res.ok) {
      setLoading(false);
      setError("Failed to create account");
      return;
    }

    const signInRes = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (signInRes && !signInRes.error) {
      router.push("/");
      router.refresh();
    } else {
      setLoading(false);
      router.push("/login");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: "100%", p: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Create Account
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            loading={loading}
            sx={{ mt: 2 }}
          >
            Create Account
          </Button>
          <Button component={Link} href="/login" fullWidth sx={{ mt: 1 }}>
            Already have an account? Sign in
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
