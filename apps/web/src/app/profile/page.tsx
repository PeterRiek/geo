"use client";

import { Container, Stack, Typography } from "@mui/material";
import { getSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

const ProfilePage = () => {
  const [data, setData] = useState<any>();

  useEffect(() => {
    const init = async () => {
      const resp = await fetch("/api/backend-user");
      if (!resp.ok) return;
      const data = await resp.json();
      setData(data);
    };
    init();
  }, []);

  return (
    <Container
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        height: "100svh",
      }}
    >
      <Stack>
        <Typography variant="h2">ID: {data?.id}</Typography>
        <Typography variant="h2">NI: {data?.username}</Typography>
      </Stack>
    </Container>
  );
};

export default ProfilePage;
