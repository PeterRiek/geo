package me.peterrk.pan.backend.model;

import jakarta.persistence.*;

/** One row per room participant, written once at game completion. Ties history queries to a user. */
@Entity
@Table(name = "game_session_players")
public class GameSessionPlayer {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "session_id", nullable = false)
  private GameSession session;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "total_score", nullable = false)
  private int totalScore;

  public GameSessionPlayer() {
  }

  public GameSessionPlayer(GameSession session, User user, int totalScore) {
    this.session = session;
    this.user = user;
    this.totalScore = totalScore;
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

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public int getTotalScore() {
    return totalScore;
  }

  public void setTotalScore(int totalScore) {
    this.totalScore = totalScore;
  }
}
