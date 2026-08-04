import type { GameMode } from "@/lib/hooks/use-game-socket";

interface RoomSettingsLike {
  mapId: number;
  allowMove: boolean;
  allowPan: boolean;
  allowZoom: boolean;
  roundCount: number;
  roundTimeLimitSeconds: number;
  gameMode: GameMode;
  timePressure?: boolean;
}

// Builds a /game?... link that reproduces a just-finished game's settings, so "back to menu"
// from the postgame screen lands with the same map/mode/settings preselected instead of blank
// defaults — game-menu.tsx's searchParams effect is what actually reads these back out.
export const buildGameMenuHref = (settings: RoomSettingsLike): string => {
  const params = new URLSearchParams({
    mapId: String(settings.mapId),
    mode: settings.gameMode === "MULTIPLAYER" ? "multiplayer" : "singleplayer",
    roundCount: String(settings.roundCount),
    roundTimeLimitSeconds: String(settings.roundTimeLimitSeconds),
    allowMove: String(settings.allowMove),
    allowPan: String(settings.allowPan),
    allowZoom: String(settings.allowZoom),
  });
  if (settings.timePressure) {
    params.set("timePressure", "true");
  }
  return `/game?${params.toString()}`;
};
