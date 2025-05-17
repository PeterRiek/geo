"use client";

import { login } from "@/lib/actions/auth";
import { Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

const SignInButtonGoogle = () => {
  return (
    <Button onClick={() => login("google")} endIcon={<GoogleIcon />}>
      Sign In with Google
    </Button>
  );
};

export default SignInButtonGoogle;
