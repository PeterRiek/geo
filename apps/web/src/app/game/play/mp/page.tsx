import { auth } from "@/auth";
import MultiplayerGame from "@/components/game/multiplayer/mutliplayer-game";
import React from "react";

const PlayMultiPlayerPage = async () => {
  const session = await auth();

  if (!session) return <div>Missing session</div>;
  if (!session.accessToken) return <div>Missing Accesstoken</div>;
  if (!session.user.name) return <div>Missing username</div>;

  return (
    <MultiplayerGame
      accessToken={session.accessToken}
      username={session.user.name}
    />
  );
};

export default PlayMultiPlayerPage;
