package me.peterrk.pan.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import me.peterrk.pan.backend.dto.AuthRequest;
import me.peterrk.pan.backend.dto.AuthResponse;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.UserRepository;
import me.peterrk.pan.backend.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private final AuthenticationManager authManager;
  private final JwtUtil jwtUtil;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public AuthController(AuthenticationManager authManager, JwtUtil jwtUtil, UserRepository userRepository,
      PasswordEncoder passwordEncoder) {
    this.authManager = authManager;
    this.jwtUtil = jwtUtil;
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
  }

  // A BadCredentialsException thrown here is left to propagate to GlobalExceptionHandler, which
  // maps it to 401.
  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody AuthRequest request) {
    authManager.authenticate(
        new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

    String token = jwtUtil.generateToken(request.getUsername());
    return ResponseEntity.ok(new AuthResponse(token, request.getUsername()));
  }

  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody AuthRequest request) {
    if (userRepository.findByUsername(request.getUsername()).isPresent()) {
      return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
    }

    User newUser = new User();
    newUser.setUsername(request.getUsername());
    newUser.setPassword(passwordEncoder.encode(request.getPassword()));

    userRepository.save(newUser);

    return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");
  }

  @DeleteMapping("/delete")
  @Transactional
  public ResponseEntity<?> deleteUser(Authentication auth) {
    int deletedCount = userRepository.deleteByUsername(auth.getName());

    if (deletedCount == 0) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    return ResponseEntity.ok("User deleted successfully");
  }

}
