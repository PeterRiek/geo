package me.peterrk.pan.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "game_sessions")
public class GameSession {

  public enum Mode {
    SINGLEPLAYER, MULTIPLAYER
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // Creator: the singleplayer player, or the duel room's creator.
  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "played_at", nullable = false)
  private LocalDateTime playedAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Mode mode;

  @Column(name = "map_id")
  private Long mapId;

  @Column(name = "round_count")
  private int roundCount;

  @Column(name = "round_time_limit_seconds")
  private int roundTimeLimitSeconds;

  private boolean allowMove;
  private boolean allowZoom;
  private boolean allowPan;

  @Column(name = "finished_at")
  private LocalDateTime finishedAt;

  public GameSession() {
    this.playedAt = LocalDateTime.now();
  }

  public GameSession(User user) {
    this.user = user;
    this.playedAt = LocalDateTime.now();
  }

  public Long getId() {
    return id;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public LocalDateTime getPlayedAt() {
    return playedAt;
  }

  public void setPlayedAt(LocalDateTime playedAt) {
    this.playedAt = playedAt;
  }

  public Mode getMode() {
    return mode;
  }

  public void setMode(Mode mode) {
    this.mode = mode;
  }

  public Long getMapId() {
    return mapId;
  }

  public void setMapId(Long mapId) {
    this.mapId = mapId;
  }

  public int getRoundCount() {
    return roundCount;
  }

  public void setRoundCount(int roundCount) {
    this.roundCount = roundCount;
  }

  public int getRoundTimeLimitSeconds() {
    return roundTimeLimitSeconds;
  }

  public void setRoundTimeLimitSeconds(int roundTimeLimitSeconds) {
    this.roundTimeLimitSeconds = roundTimeLimitSeconds;
  }

  public boolean isAllowMove() {
    return allowMove;
  }

  public void setAllowMove(boolean allowMove) {
    this.allowMove = allowMove;
  }

  public boolean isAllowZoom() {
    return allowZoom;
  }

  public void setAllowZoom(boolean allowZoom) {
    this.allowZoom = allowZoom;
  }

  public boolean isAllowPan() {
    return allowPan;
  }

  public void setAllowPan(boolean allowPan) {
    this.allowPan = allowPan;
  }

  public LocalDateTime getFinishedAt() {
    return finishedAt;
  }

  public void setFinishedAt(LocalDateTime finishedAt) {
    this.finishedAt = finishedAt;
  }
}
