package me.peterrk.pan.backend.config;

import java.util.Map;
import java.util.Set;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import me.peterrk.pan.backend.model.Permission;
import me.peterrk.pan.backend.model.Role;
import me.peterrk.pan.backend.repository.PermissionRepository;
import me.peterrk.pan.backend.repository.RoleRepository;

/**
 * Ensures the permissions/roles the app depends on by name exist, without touching anything an
 * operator may have already created by hand — every write here is find-by-name-or-create, never
 * an update or delete.
 *
 * Runs before {@link AdminUserSeeder}, which depends on the ADMIN role already existing.
 */
@Component
@Order(1)
public class RoleSeeder implements ApplicationRunner {

  private static final Map<String, Set<String>> ROLE_PERMISSIONS = Map.of(
      "ADMIN", Set.of("READ_USER", "MANAGE_KEYS"),
      "VIP_100", Set.of("PLAY_100_PER_DAY"),
      "VIP_UNLIMITED", Set.of("PLAY_UNLIMITED"));

  private final RoleRepository roleRepository;
  private final PermissionRepository permissionRepository;

  public RoleSeeder(RoleRepository roleRepository, PermissionRepository permissionRepository) {
    this.roleRepository = roleRepository;
    this.permissionRepository = permissionRepository;
  }

  @Override
  public void run(ApplicationArguments args) {
    ROLE_PERMISSIONS.forEach((roleName, permissionNames) -> {
      Role role = roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(new Role(roleName)));

      boolean changed = false;
      for (String permissionName : permissionNames) {
        Permission permission = permissionRepository.findByName(permissionName)
            .orElseGet(() -> permissionRepository.save(new Permission(permissionName)));
        if (role.getPermissions().add(permission)) {
          changed = true;
        }
      }
      if (changed) {
        roleRepository.save(role);
      }
    });
  }
}
