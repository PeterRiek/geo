package me.peterrk.pan.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import me.peterrk.pan.backend.model.GameSession;

public class GameSessionSummary {
  public Long id;
  public GameSession.Mode mode;
  public Long mapId;
  public String mapName;
  public String mapImageUrl;
  public int roundCount;
  public int roundTimeLimitSeconds;
  public boolean allowMove;
  public boolean allowPan;
  public boolean allowZoom;
  public LocalDateTime finishedAt;
  public int yourScore;
  public List<String> otherPlayers;
}
