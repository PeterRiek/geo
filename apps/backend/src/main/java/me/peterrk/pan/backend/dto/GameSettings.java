package me.peterrk.pan.backend.dto;

public class GameSettings {
  public enum GameMode {
    SINGLEPLAYER,
    MULTIPLAYER
  }
  public Long mapId;
  // Server-set only (from the chosen GameMap's own maxErrorDistanceKm) — never trust a
  // client-supplied value here, it would let a client widen its own scoring tolerance.
  public Double maxErrorDistanceKm;
  public boolean allowMove;
  public boolean allowZoom;
  public boolean allowPan;
  public int roundCount;
  public int roundTimeLimitSeconds;
  public GameMode gameMode;
}
