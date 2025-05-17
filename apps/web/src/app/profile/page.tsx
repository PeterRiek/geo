"use client";

import { Button, Container, Stack, Typography } from "@mui/material";
import { getSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

const ProfilePage = () => {
  const [data, setData] = useState<any>();
  const [canPlay, setCanPlay] = useState<any>();

  const addSession = async () => {
    fetch("/api/gamesession", { method: "POST" })
      .then((r) => r.json())
      .then((d) => console.log(d));
  };

  useEffect(() => {
    const init = async () => {
      const resMe = await fetch("/api/user/me");
      if (!resMe.ok) return;
      setData(await resMe.json());

      const resCanPlay = await fetch("/api/user/can-play");
      if (!resCanPlay.ok) return;
      const d = await resCanPlay.json();
      console.log(d);
      setCanPlay(d);
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
        <Typography variant="h2">NI: {canPlay?.gamesPlayedToday}</Typography>
        <Typography variant="h2">NI: {canPlay?.canPlay.toString()}</Typography>
        <Button onClick={addSession}>ADD SESSION</Button>
      </Stack>
    </Container>
  );
};

export default ProfilePage;
