package me.peterrk.pan.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.dto.ActivationKeyDto;
import me.peterrk.pan.backend.dto.RoleDto;
import me.peterrk.pan.backend.model.ActivationKey;
import me.peterrk.pan.backend.model.Role;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.RoleRepository;
import me.peterrk.pan.backend.service.ActivationKeyService;
import me.peterrk.pan.backend.service.UserService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('MANAGE_KEYS')")
public class AdminController {

  private final ActivationKeyService activationKeyService;
  private final RoleRepository roleRepository;
  private final UserService userService;

  public AdminController(ActivationKeyService activationKeyService, RoleRepository roleRepository, UserService userService) {
    this.activationKeyService = activationKeyService;
    this.roleRepository = roleRepository;
    this.userService = userService;
  }

  @GetMapping("/roles")
  public ResponseEntity<List<RoleDto>> getRoles() {
    List<RoleDto> roles = roleRepository.findAll().stream().map(RoleDto::new).toList();
    return ResponseEntity.ok(roles);
  }

  public record GenerateKeyRequest(Long roleId, Integer maxUses, LocalDateTime expiresAt) {
  }

  @PostMapping("/keys")
  public ResponseEntity<?> generateKey(Authentication auth, @RequestBody GenerateKeyRequest body) {
    if (body.roleId() == null) {
      return ResponseEntity.badRequest().body(Map.of("error", "roleId is required"));
    }
    Role role = roleRepository.findById(body.roleId())
        .orElseThrow(() -> new IllegalArgumentException("Role not found"));
    User creator = userService.getAuthenticatedUser(auth.getName());
    int maxUses = body.maxUses() == null ? 1 : body.maxUses();

    ActivationKey key = activationKeyService.generateKey(role, maxUses, body.expiresAt(), creator);
    return ResponseEntity.ok(new ActivationKeyDto(key));
  }

  @GetMapping("/keys")
  public ResponseEntity<List<ActivationKeyDto>> getKeys() {
    List<ActivationKeyDto> keys = activationKeyService.listKeys().stream().map(ActivationKeyDto::new).toList();
    return ResponseEntity.ok(keys);
  }

  @DeleteMapping("/keys/{id}")
  public ResponseEntity<ActivationKeyDto> revokeKey(@PathVariable Long id) {
    ActivationKey key = activationKeyService.revokeKey(id);
    return ResponseEntity.ok(new ActivationKeyDto(key));
  }
}
