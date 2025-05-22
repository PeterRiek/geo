import PostgameView from "@/components/game/singleplayer/views/postgame-view";
import { Coords } from "@/types/geo";
import React from "react";

const ResPage = () => {
  const allTargets: Coords[] = [
    { lat: 0, lng: 0 },
    { lat: 81, lng: -100 },
    { lat: -12, lng: 21 },
  ];
  const allGuesses: { [username: string]: Coords }[] = [
    {
      peter: { lat: 10, lng: 10 },
      filip: { lat: 20, lng: 90 },
    },
    {
      peter: { lat: -10, lng: 89 },
      filip: { lat: -80, lng: -12 },
    },
    {
      peter: { lat: 71, lng: 12 },
      filip: { lat: 1, lng: 0 },
    },
  ];
  return (
    <PostgameView
      username="peter"
      allGuesses={allGuesses}
      allTargets={allTargets}
    />
  );
};

export default ResPage;
