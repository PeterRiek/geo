"use server";

import { auth } from "@/auth";
import DuelGameView from "@/components/game/multiplayer/duel-view";
import useDuelSocket from "@/lib/hooks/use-duel-socket";
import { Container, Typography } from "@mui/material";
import React, { useEffect } from "react";

const DuelPage = async () => {
  const session = await auth();

  return <DuelGameView accessToken={session?.accessToken} roomId="room01" />;
};

export default DuelPage;
