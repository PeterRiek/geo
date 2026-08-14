"use client";

import { logout } from "@/lib/actions/auth";
import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import React from "react";

const SignOutButton = () => {
  return (
    <Button onClick={() => logout()} startIcon={<LogoutIcon />}>
      Sign Out
    </Button>
  );
};

export default SignOutButton;
