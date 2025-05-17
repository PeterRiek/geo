package me.peterrk.pan.backend.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.GameSessionRepository;
import me.peterrk.pan.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/user")
public class UserController {

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private GameSessionRepository gameSessionRepository;

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

  @GetMapping("/can-play")
  public ResponseEntity<?> canPlay(Authentication auth) {
    String username = auth.getName();
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    LocalDate today = LocalDate.now();
    LocalDateTime startOfDay = today.atStartOfDay();
    LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();
    int playedToday = gameSessionRepository.countTodayByUser(user, startOfDay, startOfNextDay);

    Map<String, Object> response = new HashMap<>();
    response.put("canPlay", playedToday < 5);
    response.put("gamesPlayedToday", playedToday);
    response.put("maxGamesPerDay", 5);

    return ResponseEntity.status(HttpStatus.OK).body(response);

  }

}
