package me.peterrk.pan.backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.peterrk.pan.backend.dto.ws.RoomState;
import me.peterrk.pan.backend.service.GameService;

@RestController
@RequestMapping("/api/game")
public class GameController {

  private final GameService gameService;

  public GameController(GameService gameService) {
    this.gameService = gameService;
  }

  /** The in-progress room (if any) the caller is currently a member of — powers the reconnect banner. */
  @GetMapping("/active")
  public ResponseEntity<?> getActiveRoom(Authentication auth) {
    RoomState room = gameService.findActiveRoomForUser(auth.getName());
    if (room == null) {
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.ok(Map.of(
        "roomId", room.roomId,
        "mode", room.roomSettings.gameMode));
  }
}
