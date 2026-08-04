package me.peterrk.pan.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import me.peterrk.pan.backend.model.Role;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.RoleRepository;
import me.peterrk.pan.backend.repository.UserRepository;

/**
 * Creates the admin account named by {@code app.admin.username} (default "admin") with the
 * password from {@code app.admin.password} (env {@code ADMIN_PASSWORD}) on first startup, so a
 * fresh deployment always has an ADMIN-role login without a manual DB edit.
 *
 * Only acts once: if {@code app.admin.password} is blank, or a user with that username already
 * exists, this is a no-op — it never overwrites an existing account's password or roles.
 */
@Component
@Order(2)
public class AdminUserSeeder implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(AdminUserSeeder.class);

  @Value("${app.admin.username}")
  private String adminUsername;

  @Value("${app.admin.password}")
  private String adminPassword;

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordEncoder passwordEncoder;

  public AdminUserSeeder(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (adminPassword == null || adminPassword.isBlank()) {
      log.info("ADMIN_PASSWORD not set — skipping admin user bootstrap");
      return;
    }
    if (userRepository.findByUsername(adminUsername).isPresent()) {
      return;
    }

    Role adminRole = roleRepository.findByName("ADMIN")
        .orElseThrow(() -> new IllegalStateException("ADMIN role missing — RoleSeeder should have created it"));

    User admin = new User(adminUsername, passwordEncoder.encode(adminPassword));
    admin.getRoles().add(adminRole);
    userRepository.save(admin);
    log.info("Created admin user '{}'", adminUsername);
  }
}
