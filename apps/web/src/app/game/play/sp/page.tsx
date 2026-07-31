import { auth } from "@/auth";
import SinglePlayerGame from "@/components/game/singleplayer/singleplayer-game";
import GameFallback from "@/components/game/game-fallback";
import React from "react";

const PlaySinglePlayerPage = async () => {
  const session = await auth();

  if (!session || !session.accessToken || !session.user?.name) {
    return (
      <GameFallback
        variant="error"
        title="You need to be signed in to play."
        description="Please sign in and try again."
      />
    );
  }

  return <SinglePlayerGame accessToken={session.accessToken} username={session.user.name} />;
};

export default PlaySinglePlayerPage;
