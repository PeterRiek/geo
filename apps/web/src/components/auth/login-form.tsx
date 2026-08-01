"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Box, Button, TextField, Alert } from "@mui/material";

const LoginForm = () => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setLoading(true);
    const res = await signIn("credentials", {
      username: data.get("username"),
      password: data.get("password"),
      redirect: false,
    });

    if (res && !res.error) {
      router.push("/");
      router.refresh();
    } else {
      setLoading(false);
      setError("Invalid username or password");
    }
  };

  return (
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
        Login
      </Button>
      <Button component={Link} href="/register" fullWidth sx={{ mt: 1 }}>
        Need an account? Sign up
      </Button>
    </Box>
  );
};

export default LoginForm;
