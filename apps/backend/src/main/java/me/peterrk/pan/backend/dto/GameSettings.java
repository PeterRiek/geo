package me.peterrk.pan.backend.dto;

public class GameSettings {
  public enum GameMode {
    SINGLEPLAYER,
    MULTIPLAYER
  }
  public Long mapId;
  public boolean allowMove;
  public boolean allowZoom;
  public boolean allowPan;
  public int roundCount;
  public int roundTimeLimitSeconds;
  public GameMode gameMode;
}
