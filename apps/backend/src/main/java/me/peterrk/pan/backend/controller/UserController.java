package me.peterrk.pan.backend.controller;

import me.peterrk.pan.backend.dto.AuthResponse;
import me.peterrk.pan.backend.dto.UserDto;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.service.ActivationKeyService;
import me.peterrk.pan.backend.service.UserService;
import me.peterrk.pan.backend.util.JwtUtil;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

  private final UserService userService;
  private final ActivationKeyService activationKeyService;
  private final JwtUtil jwtUtil;

  public UserController(UserService userService, ActivationKeyService activationKeyService, JwtUtil jwtUtil) {
    this.userService = userService;
    this.activationKeyService = activationKeyService;
    this.jwtUtil = jwtUtil;
  }

  @GetMapping("/me")
  public ResponseEntity<?> getUser(Authentication auth) {
    User user = userService.getAuthenticatedUser(auth.getName());
    return ResponseEntity.ok(new UserDto(user));
  }

  @GetMapping("/can-play")
  public ResponseEntity<?> canPlay(Authentication auth) {
    String username = auth.getName();
    User user = userService.getAuthenticatedUser(username);
    return ResponseEntity.ok(userService.getPlayPermissionStatus(user));
  }

  @PreAuthorize("hasAuthority('READ_USER')")
  @GetMapping("/list")
  public ResponseEntity<List<UserDto>> getUsers() {
    List<UserDto> userDtos = userService.getAllUsers()
        .stream()
        .map(UserDto::new)
        .toList();
    return ResponseEntity.ok(userDtos);
  }

  public record UpdateUsernameRequest(String username) {
  }

  // The JWT subject is the username, so a successful change invalidates the caller's current
  // token — issue a fresh one so the frontend can swap it in without forcing a re-login.
  @PatchMapping("/me")
  public ResponseEntity<?> updateUsername(Authentication auth, @RequestBody UpdateUsernameRequest body) {
    User currentUser = userService.getAuthenticatedUser(auth.getName());
    User updated = userService.updateUsername(currentUser, body.username());
    String token = jwtUtil.generateToken(updated.getUsername());
    return ResponseEntity.ok(new AuthResponse(token, updated.getUsername()));
  }

  public record ActivateKeyRequest(String code) {
  }

  @PostMapping("/activate-key")
  public ResponseEntity<?> activateKey(Authentication auth, @RequestBody ActivateKeyRequest body) {
    User currentUser = userService.getAuthenticatedUser(auth.getName());
    User updated = activationKeyService.redeemKey(currentUser, body.code());
    return ResponseEntity.ok(new UserDto(updated));
  }

  public record UpdatePasswordRequest(String currentPassword, String newPassword) {
  }

  @PatchMapping("/me/password")
  public ResponseEntity<?> updatePassword(Authentication auth, @RequestBody UpdatePasswordRequest body) {
    User currentUser = userService.getAuthenticatedUser(auth.getName());
    User updated = userService.updatePassword(currentUser.getUsername(), body.currentPassword(), body.newPassword());
    return ResponseEntity.ok(new UserDto(updated));
  }
}
