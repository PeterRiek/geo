package me.peterrk.pan.backend.dto;

import java.util.Set;
import java.util.stream.Collectors;

import me.peterrk.pan.backend.model.User;

public class UserDto {
  private Long id;
  private String username;
  private boolean enabled;
  private Set<String> roles;
  private Set<String> permissions;

  public UserDto(User user) {
    this.id = user.getId();
    this.username = user.getUsername();
    this.enabled = user.isEnabled();
    this.roles = user.getRoles()
        .stream()
        .map(role -> role.getName())
        .collect(Collectors.toSet());
    this.permissions = user.getRoles()
        .stream()
        .flatMap(role -> role.getPermissions().stream())
        .map(permission -> permission.getName())
        .collect(Collectors.toSet());
  }

  public Long getId() {
    return id;
  }

  public String getUsername() {
    return username;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public Set<String> getRoles() {
    return roles;
  }

  public Set<String> getPermissions() {
    return permissions;
  }
}
