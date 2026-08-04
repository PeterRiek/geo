package me.peterrk.pan.backend.dto;

import java.util.Set;
import java.util.stream.Collectors;

import me.peterrk.pan.backend.model.Role;

public class RoleDto {
  private Long id;
  private String name;
  private Set<String> permissions;

  public RoleDto(Role role) {
    this.id = role.getId();
    this.name = role.getName();
    this.permissions = role.getPermissions()
        .stream()
        .map(permission -> permission.getName())
        .collect(Collectors.toSet());
  }

  public Long getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public Set<String> getPermissions() {
    return permissions;
  }
}
