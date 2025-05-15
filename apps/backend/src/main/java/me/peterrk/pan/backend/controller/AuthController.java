package me.peterrk.pan.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import me.peterrk.pan.backend.config.JwtUtil;
import me.peterrk.pan.backend.model.AuthRequest;
import me.peterrk.pan.backend.model.AuthResponse;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  @Autowired
  private AuthenticationManager authManager;

  @Autowired
  private JwtUtil jwtUtil;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @PostMapping("/login")
  public ResponseEntity<?> login(@RequestBody AuthRequest request) {
    System.out.println(request.getPassword());
    try {
      // to trigger bad credentials
      authManager.authenticate(
          new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

      String token = jwtUtil.generateToken(request.getUsername());
      return ResponseEntity.ok(new AuthResponse(token, request.getUsername()));

    } catch (BadCredentialsException ex) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
  }

  @PostMapping("/register")
  public ResponseEntity<?> register(@RequestBody AuthRequest request) {
    try {
      if (userRepository.findByUsername(request.getUsername()).isPresent()) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists");
      }

      User newUser = new User();
      newUser.setUsername(request.getUsername());
      newUser.setPassword(passwordEncoder.encode(request.getPassword()));

      userRepository.save(newUser);

      return ResponseEntity.status(HttpStatus.CREATED).body("User registered successfully");

    } catch (DataIntegrityViolationException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid data");
    } catch (Exception e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
    }
  }

  @DeleteMapping("/delete")
  @Transactional
  public ResponseEntity<?> deleteUser() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = auth.getName();

    if (username == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
    }

    int deletedCount = userRepository.deleteByUsername(username);

    if (deletedCount == 0) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    return ResponseEntity.ok("User deleted successfully");
  }

}
