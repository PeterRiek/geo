import { auth } from "@/auth";
import SinglePlayerGame from "@/components/game/singleplayer/singleplayer-game";
import React from "react";

interface PlaySinglePlayerPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

const PlaySinglePlayerPage = async (_: PlaySinglePlayerPageProps) => {
  const session = await auth();

  if (!session || !session.accessToken) return <div>Missing Accesstoken</div>;

  return <SinglePlayerGame accessToken={session.accessToken} />;
};

export default PlaySinglePlayerPage;
