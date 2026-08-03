package me.peterrk.pan.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.dto.GameSessionDetail;
import me.peterrk.pan.backend.dto.GameSessionSummary;
import me.peterrk.pan.backend.model.User;
import me.peterrk.pan.backend.repository.UserRepository;
import me.peterrk.pan.backend.service.GameHistoryService;

@RestController
@RequestMapping("/api/gamesession")
public class GameSessionController {

  private static final int MAX_HISTORY_PAGE_SIZE = 50;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private GameHistoryService gameHistoryService;

  @GetMapping("/history")
  public ResponseEntity<?> getHistory(Authentication auth, @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    User user = currentUser(auth);
    Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_HISTORY_PAGE_SIZE));
    Page<GameSessionSummary> history = gameHistoryService.getHistory(user, pageable);
    return ResponseEntity.ok(history);
  }

  @GetMapping("/{id}")
  public ResponseEntity<?> getSessionDetail(Authentication auth, @PathVariable Long id) {
    User user = currentUser(auth);
    GameSessionDetail detail = gameHistoryService.getDetail(user, id);
    if (detail == null) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Session not found");
    }
    return ResponseEntity.ok(detail);
  }

  private User currentUser(Authentication auth) {
    return userRepository.findByUsername(auth.getName())
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }
}
