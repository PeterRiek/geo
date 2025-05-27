import { auth } from "@/auth";
import SinglePlayerGame from "@/components/game/singleplayer/singleplayer-game";
import React from "react";

const PlaySinglePlayerPage = async () => {
  const session = await auth();

  if (!session || !session.accessToken) return <div>Missing Accesstoken</div>;

  if (!session || !session.user || !session.user.name) return <div>Missing Username</div>

  return <SinglePlayerGame accessToken={session.accessToken} username={session.user.name} />;
};

export default PlaySinglePlayerPage;
