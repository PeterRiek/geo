package me.peterrk.pan.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "activation_keys")
public class ActivationKey {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String code;

  @ManyToOne(optional = false)
  @JoinColumn(name = "role_id", nullable = false)
  private Role role;

  @Column(name = "max_uses", nullable = false)
  private int maxUses = 1;

  @Column(name = "use_count", nullable = false)
  private int useCount = 0;

  @Column(nullable = false)
  private boolean revoked = false;

  @Column(name = "expires_at")
  private LocalDateTime expiresAt;

  @ManyToOne
  @JoinColumn(name = "created_by")
  private User createdBy;

  @Column(name = "created_at", nullable = false)
  private LocalDateTime createdAt = LocalDateTime.now();

  public ActivationKey() {
  }

  public ActivationKey(String code, Role role, int maxUses, LocalDateTime expiresAt, User createdBy) {
    this.code = code;
    this.role = role;
    this.maxUses = maxUses;
    this.expiresAt = expiresAt;
    this.createdBy = createdBy;
  }

  public Long getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public int getMaxUses() {
    return maxUses;
  }

  public void setMaxUses(int maxUses) {
    this.maxUses = maxUses;
  }

  public int getUseCount() {
    return useCount;
  }

  public void setUseCount(int useCount) {
    this.useCount = useCount;
  }

  public boolean isRevoked() {
    return revoked;
  }

  public void setRevoked(boolean revoked) {
    this.revoked = revoked;
  }

  public LocalDateTime getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(LocalDateTime expiresAt) {
    this.expiresAt = expiresAt;
  }

  public User getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(User createdBy) {
    this.createdBy = createdBy;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
