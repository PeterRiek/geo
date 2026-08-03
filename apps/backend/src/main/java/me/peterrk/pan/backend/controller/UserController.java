package me.peterrk.pan.backend.controller;

import me.peterrk.pan.backend.dto.UserDto;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.service.UserService;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
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
}
