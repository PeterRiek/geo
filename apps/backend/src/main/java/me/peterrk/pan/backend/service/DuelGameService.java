package me.peterrk.pan.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import me.peterrk.pan.backend.dto.ws.LatLng;

@Service
public class DuelGameService {

  private final Map<String, List<WebSocketSession>> roomSessions = new HashMap<>();
  private final Map<String, Map<String, LatLng>> roomGuesses = new HashMap<>();
  private final Map<String, LatLng> roomTargets = new HashMap<>();

  public void addPlayerToRoom(String roomId, WebSocketSession session) {
    roomSessions.computeIfAbsent(roomId, key -> new ArrayList<>()).add(session);
  }

  public boolean isRoomReady(String roomId) {
    return roomSessions.getOrDefault(roomId, List.of()).size() == 2;
  }

  public List<WebSocketSession> getRoomSessions(String roomId) {
    return roomSessions.getOrDefault(roomId, List.of());
  }

  public void storePlayerGuess(String roomId, String sessionId, LatLng guess) {
    roomGuesses.computeIfAbsent(roomId, key -> new HashMap<>()).put(sessionId, guess);
  }

  public boolean isGuessesReady(String roomId) {
    return roomGuesses.getOrDefault(roomId, Map.of()).size() == 2;
  }

  public Map<String, LatLng> getRoomGuesses(String roomId) {
    return roomGuesses.get(roomId);
  }

  public void setRoomTarget(String roomId, LatLng target) {
    roomTargets.put(roomId, target);
  }

  public LatLng getRoomTarget(String roomId) {
    return roomTargets.get(roomId);
  }

  public void clearRoom(String roomId) {
    roomSessions.remove(roomId);
    roomGuesses.remove(roomId);
    roomTargets.remove(roomId);
  }

  public LatLng getRandomTarget() {
    // TODO: merge with map api
    var rng = new Random();
    LatLng[] opt = new LatLng[] {
        new LatLng(60.327760220139645, 19.916788229531633),
        new LatLng(50.084753267843695, 14.424322057315528)
    };
    return opt[rng.nextInt(opt.length)];
  }
}
