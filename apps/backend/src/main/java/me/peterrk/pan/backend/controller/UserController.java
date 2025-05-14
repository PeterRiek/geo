package me.peterrk.pan.backend.controller;

import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/user")
public class UserController {

  private final UserRepository userRepository;

  public UserController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @GetMapping("/me")
  public User getCurrentUser(Authentication auth) {
    String email = auth.getName();
    System.out.println("searching for user: " + email);
    Optional<User> user = userRepository.findByEmail(email);
    return user.orElseThrow(() -> new RuntimeException("User not found"));
  }
}
