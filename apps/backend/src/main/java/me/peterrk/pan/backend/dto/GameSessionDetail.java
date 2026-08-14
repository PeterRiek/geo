package me.peterrk.pan.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import me.peterrk.pan.backend.model.GameSession;

public class GameSessionDetail {
  public Long id;
  public GameSession.Mode mode;
  public Long mapId;
  public int roundCount;
  public int roundTimeLimitSeconds;
  public LocalDateTime finishedAt;
  public List<PlayerResult> players;
  public List<RoundResult> rounds;

  public static class PlayerResult {
    public String username;
    public int totalScore;
  }

  public static class RoundResult {
    public int roundIndex;
    public double targetLat;
    public double targetLng;
    public List<GuessResult> guesses;
  }

  public static class GuessResult {
    public String username;
    public Double lat;
    public Double lng;
    public Double distanceKm;
    public int score;
    public boolean timedOut;
  }
}
