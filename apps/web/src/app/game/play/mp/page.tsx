import { auth } from "@/auth";
import MultiplayerGame from "@/components/game/multiplayer/mutliplayer-game";
import GameFallback from "@/components/game/game-fallback";
import React from "react";

const PlayMultiPlayerPage = async () => {
  const session = await auth();

  if (!session || !session.accessToken || !session.user.name) {
    return (
      <GameFallback
        variant="error"
        title="You need to be signed in to play."
        description="Please sign in and try again."
      />
    );
  }

  return (
    <MultiplayerGame
      accessToken={session.accessToken}
      username={session.user.name}
    />
  );
};

export default PlayMultiPlayerPage;
