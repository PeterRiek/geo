package me.peterrk.pan.backend.controller;

import me.peterrk.pan.backend.dto.UserDto;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.service.UserService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

  @Autowired
  private UserService userService;

  @GetMapping("/me")
  public ResponseEntity<?> getUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = auth.getName();

    if (username == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
    }

    User user = userService.getAuthenticatedUser(username);
    return ResponseEntity.ok(user);
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
