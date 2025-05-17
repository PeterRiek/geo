package me.peterrk.pan.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.model.GameSession;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.GameSessionRepository;
import me.peterrk.pan.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/gamesession")
public class GameSessionController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private GameSessionRepository gameSessionRepository;

  @PostMapping
  public ResponseEntity<?> addGameSession(Authentication auth) {
    String username = auth.getName();
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    GameSession gameSession = new GameSession(user);
    gameSessionRepository.save(gameSession);

    return ResponseEntity.ok(gameSession.getId());

  }
}
