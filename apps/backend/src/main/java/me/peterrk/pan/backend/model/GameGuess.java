package me.peterrk.pan.backend.model;

import jakarta.persistence.*;

/** lat/lng null means the player had no guess recorded for this round (timeout). */
@Entity
@Table(name = "game_guesses")
public class GameGuess {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "round_id", nullable = false)
  private GameRound round;

  @ManyToOne(optional = false)
  @JoinColumn(name = "player_id", nullable = false)
  private GameSessionPlayer player;

  private Double lat;
  private Double lng;

  @Column(name = "distance_km")
  private Double distanceKm;

  @Column(nullable = false)
  private int score;

  @Column(name = "timed_out", nullable = false)
  private boolean timedOut;

  public GameGuess() {
  }

  public GameGuess(GameRound round, GameSessionPlayer player, Double lat, Double lng, Double distanceKm,
      int score, boolean timedOut) {
    this.round = round;
    this.player = player;
    this.lat = lat;
    this.lng = lng;
    this.distanceKm = distanceKm;
    this.score = score;
    this.timedOut = timedOut;
  }

  public Long getId() {
    return id;
  }

  public GameRound getRound() {
    return round;
  }

  public void setRound(GameRound round) {
    this.round = round;
  }

  public GameSessionPlayer getPlayer() {
    return player;
  }

  public void setPlayer(GameSessionPlayer player) {
    this.player = player;
  }

  public Double getLat() {
    return lat;
  }

  public void setLat(Double lat) {
    this.lat = lat;
  }

  public Double getLng() {
    return lng;
  }

  public void setLng(Double lng) {
    this.lng = lng;
  }

  public Double getDistanceKm() {
    return distanceKm;
  }

  public void setDistanceKm(Double distanceKm) {
    this.distanceKm = distanceKm;
  }

  public int getScore() {
    return score;
  }

  public void setScore(int score) {
    this.score = score;
  }

  public boolean isTimedOut() {
    return timedOut;
  }

  public void setTimedOut(boolean timedOut) {
    this.timedOut = timedOut;
  }
}
