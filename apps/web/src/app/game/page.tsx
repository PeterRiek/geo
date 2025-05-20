"use server";

import { auth } from "@/auth";
import GameMenu from "@/components/game/game-menu";

const GamePage = async () => {
  const session = await auth();
  if (!session?.accessToken || !session.user.name) return <></>;
  return (
    <GameMenu accessToken={session?.accessToken} username={session.user.name} />
  );
};

export default GamePage;
