package me.peterrk.pan.backend.dto;

import java.time.LocalDateTime;

import me.peterrk.pan.backend.model.ActivationKey;

public class ActivationKeyDto {
  private Long id;
  private String code;
  private String roleName;
  private int maxUses;
  private int useCount;
  private boolean revoked;
  private LocalDateTime expiresAt;
  private LocalDateTime createdAt;

  public ActivationKeyDto(ActivationKey key) {
    this.id = key.getId();
    this.code = key.getCode();
    this.roleName = key.getRole().getName();
    this.maxUses = key.getMaxUses();
    this.useCount = key.getUseCount();
    this.revoked = key.isRevoked();
    this.expiresAt = key.getExpiresAt();
    this.createdAt = key.getCreatedAt();
  }

  public Long getId() {
    return id;
  }

  public String getCode() {
    return code;
  }

  public String getRoleName() {
    return roleName;
  }

  public int getMaxUses() {
    return maxUses;
  }

  public int getUseCount() {
    return useCount;
  }

  public boolean isRevoked() {
    return revoked;
  }

  public LocalDateTime getExpiresAt() {
    return expiresAt;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
