import { Container, Typography, Paper } from "@mui/material";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Container maxWidth="sm" sx={{ height: "100%", p: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Login
        </Typography>
        <LoginForm />
      </Paper>
    </Container>
  );
}
