package me.peterrk.pan.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "game_rounds")
public class GameRound {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "session_id", nullable = false)
  private GameSession session;

  @Column(name = "round_index", nullable = false)
  private int roundIndex;

  @Column(name = "target_lat", nullable = false)
  private double targetLat;

  @Column(name = "target_lng", nullable = false)
  private double targetLng;

  public GameRound() {
  }

  public GameRound(GameSession session, int roundIndex, double targetLat, double targetLng) {
    this.session = session;
    this.roundIndex = roundIndex;
    this.targetLat = targetLat;
    this.targetLng = targetLng;
  }

  public Long getId() {
    return id;
  }

  public GameSession getSession() {
    return session;
  }

  public void setSession(GameSession session) {
    this.session = session;
  }

  public int getRoundIndex() {
    return roundIndex;
  }

  public void setRoundIndex(int roundIndex) {
    this.roundIndex = roundIndex;
  }

  public double getTargetLat() {
    return targetLat;
  }

  public void setTargetLat(double targetLat) {
    this.targetLat = targetLat;
  }

  public double getTargetLng() {
    return targetLng;
  }

  public void setTargetLng(double targetLng) {
    this.targetLng = targetLng;
  }
}
