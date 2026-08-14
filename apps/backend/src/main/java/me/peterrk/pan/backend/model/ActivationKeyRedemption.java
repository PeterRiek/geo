package me.peterrk.pan.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

// Unique (activation_key_id, user_id) so a user can't redeem the same multi-use key twice.
@Entity
@Table(name = "activation_key_redemptions", uniqueConstraints = @UniqueConstraint(columnNames = { "activation_key_id", "user_id" }))
public class ActivationKeyRedemption {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "activation_key_id", nullable = false)
  private ActivationKey activationKey;

  @ManyToOne(optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "redeemed_at", nullable = false)
  private LocalDateTime redeemedAt = LocalDateTime.now();

  public ActivationKeyRedemption() {
  }

  public ActivationKeyRedemption(ActivationKey activationKey, User user) {
    this.activationKey = activationKey;
    this.user = user;
  }

  public Long getId() {
    return id;
  }

  public ActivationKey getActivationKey() {
    return activationKey;
  }

  public void setActivationKey(ActivationKey activationKey) {
    this.activationKey = activationKey;
  }

  public User getUser() {
    return user;
  }

  public void setUser(User user) {
    this.user = user;
  }

  public LocalDateTime getRedeemedAt() {
    return redeemedAt;
  }
}
