package me.peterrk.pan.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/user")
public class UserController {

  @Autowired
  private UserRepository userRepository;

  @GetMapping("/me")
  public ResponseEntity<?> getUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    String username = auth.getName();

    if (username == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
    }

    User user = userRepository.findByUsername(username).get();

    return ResponseEntity.status(HttpStatus.OK).body(user);
  }
}
