package me.peterrk.pan.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.GameSettings;
import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.dto.ws.RoomState;
import me.peterrk.pan.backend.dto.ws.ServerMessage;
import me.peterrk.pan.backend.exception.MapAccessException;
import me.peterrk.pan.backend.model.GameMap;
import me.peterrk.pan.backend.util.GeoUtils;

@Service
public class GameService {

  private static final Logger log = LoggerFactory.getLogger(GameService.class);

  private static final int MIN_ROUND_TIME_LIMIT_SECONDS = 15;
  private static final int MAX_ROUND_TIME_LIMIT_SECONDS = 300;
  private static final int DEFAULT_ROUND_TIME_LIMIT_SECONDS = 60;

  private final GameMapService gameMapService;
  private final GameHistoryService gameHistoryService;
  private final ObjectMapper mapper = new ObjectMapper();

  private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();
  private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();
  private final Map<String, Set<String>> roomPlayers = new ConcurrentHashMap<>();

  public GameService(GameMapService gameMapService, GameHistoryService gameHistoryService) {
    this.gameMapService = gameMapService;
    this.gameHistoryService = gameHistoryService;
  }

  public RoomState createRoom(String roomId, String creatorUsername) {
    GameSettings gameSettings = new GameSettings();
    gameSettings.allowPan = true;
    gameSettings.allowZoom = true;
    gameSettings.mapId = 1L;
    gameSettings.roundCount = 2;
    gameSettings.roundTimeLimitSeconds = DEFAULT_ROUND_TIME_LIMIT_SECONDS;
    gameSettings.gameMode = GameSettings.GameMode.SINGLEPLAYER;
    return createRoom(roomId, gameSettings, creatorUsername);
  }

  public RoomState createRoom(String roomId, GameSettings gameSettings, String creatorUsername) {
    // 0 is a deliberate "unlimited" signal (the time-limit slider's leftmost position), not
    // "unset" — only clamp when a real, positive limit was requested.
    if (gameSettings.roundTimeLimitSeconds < 0) {
      gameSettings.roundTimeLimitSeconds = 0;
    } else if (gameSettings.roundTimeLimitSeconds > 0) {
      gameSettings.roundTimeLimitSeconds = Math.max(MIN_ROUND_TIME_LIMIT_SECONDS,
          Math.min(MAX_ROUND_TIME_LIMIT_SECONDS, gameSettings.roundTimeLimitSeconds));
    }

    GameMap map = gameMapService.getGameMap(gameSettings.mapId);
    if (map == null || !gameMapService.canAccess(map, creatorUsername)) {
      throw new MapAccessException("Map " + gameSettings.mapId + " is not accessible to " + creatorUsername);
    }
    // Never trust a client-supplied value here — always take the chosen map's own scoring range.
    gameSettings.maxErrorDistanceKm = map.getMaxErrorDistanceKm() != null
        ? map.getMaxErrorDistanceKm()
        : GeoUtils.DEFAULT_MAX_ERROR_DISTANCE_KM;

    return rooms.computeIfAbsent(roomId, id -> {
      RoomState room = new RoomState();
      room.roomId = roomId;
      room.roomSettings = gameSettings;
      room.creatorUsername = creatorUsername;
      room.roomPhase = RoomState.RoomPhase.WAITING;
      room.roundCount = 0;
      room.allGuesses = new ArrayList<Map<String, LatLng>>();
      room.allDistances = new ArrayList<Map<String, Double>>();
      room.allScores = new ArrayList<Map<String, Integer>>();
      room.allTargets = new ArrayList<LatLng>();

      // A solo room has no one else to wait on, so it starts itself immediately.
      // Safe without the room lock: not yet reachable from `rooms` until this
      // lambda returns.
      if (gameSettings.gameMode == GameSettings.GameMode.SINGLEPLAYER) {
        beginRound(room);
      }
      return room;
    });
  }

  public RoomState joinRoom(String roomId, String username, WebSocketSession session) {
    RoomState room = rooms.get(roomId);
    if (room == null) {
      return null;
    }
    roomSessions.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet()).add(session);
    Set<String> players = roomPlayers.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet());
    synchronized (room) {
      players.add(username);
      room.players = new ArrayList<>(players);
      room.disconnectedPlayers.remove(username);
    }
    return room;
  }

  public void markDisconnected(String roomId, String username, WebSocketSession session) {
    Set<WebSocketSession> sessions = roomSessions.get(roomId);
    if (sessions != null) {
      sessions.remove(session);
    }
    RoomState room = rooms.get(roomId);
    if (room != null) {
      synchronized (room) {
        room.disconnectedPlayers.add(username);
      }
    }
  }

  /** Returns false if the room doesn't exist or isn't accepting guesses right now. */
  public boolean submitGuess(String roomId, String username, LatLng guess) {
    RoomState room = rooms.get(roomId);
    if (room == null) {
      return false;
    }
    synchronized (room) {
      if (room.roomPhase != RoomState.RoomPhase.ROUND_IN_PROGRESS) {
        return false;
      }
      recordGuess(room, username, guess);
      advanceIfComplete(room);
      return true;
    }
  }

  /** Scanned every second by {@link RoundTimeoutScheduler}; force-resolves any round whose deadline passed. */
  public void resolveExpiredRounds() {
    long now = System.currentTimeMillis();
    for (RoomState room : rooms.values()) {
      if (room.roomPhase != RoomState.RoomPhase.ROUND_IN_PROGRESS || room.roundEndsAt == null || now < room.roundEndsAt) {
        continue;
      }
      synchronized (room) {
        // Re-check inside the lock: a guess may have resolved the round between the
        // check above and acquiring the lock.
        if (room.roomPhase != RoomState.RoomPhase.ROUND_IN_PROGRESS || room.roundEndsAt == null
            || now < room.roundEndsAt) {
          continue;
        }
        Map<String, LatLng> currentGuesses = currentRoundGuesses(room);
        for (String player : room.players) {
          currentGuesses.putIfAbsent(player, null);
        }
        advanceIfComplete(room);
      }
    }
  }

  private Map<String, LatLng> currentRoundGuesses(RoomState room) {
    while (room.allGuesses.size() - 1 < room.roundCount) {
      room.allGuesses.add(new HashMap<String, LatLng>());
    }
    return room.allGuesses.get(room.roundCount);
  }

  private void recordGuess(RoomState room, String username, LatLng guess) {
    currentRoundGuesses(room).putIfAbsent(username, guess);
  }

  private Map<String, Double> currentRoundDistances(RoomState room) {
    while (room.allDistances.size() - 1 < room.roundCount) {
      room.allDistances.add(new HashMap<String, Double>());
    }
    return room.allDistances.get(room.roundCount);
  }

  private Map<String, Integer> currentRoundScores(RoomState room) {
    while (room.allScores.size() - 1 < room.roundCount) {
      room.allScores.add(new HashMap<String, Integer>());
    }
    return room.allScores.get(room.roundCount);
  }

  /** Must be called while holding `synchronized (room)`; the round's target must already exist. */
  private void computeRoundResults(RoomState room) {
    LatLng target = room.allTargets.get(room.roundCount);
    Map<String, LatLng> guesses = currentRoundGuesses(room);
    Map<String, Double> distances = currentRoundDistances(room);
    Map<String, Integer> scores = currentRoundScores(room);
    double maxErrorDistanceKm = room.roomSettings.maxErrorDistanceKm != null
        ? room.roomSettings.maxErrorDistanceKm
        : GeoUtils.DEFAULT_MAX_ERROR_DISTANCE_KM;
    for (String player : room.players) {
      LatLng guess = guesses.get(player);
      if (guess == null) {
        distances.put(player, null);
        scores.put(player, 0);
        continue;
      }
      double distanceKm = GeoUtils.distanceKm(target, guess);
      distances.put(player, distanceKm);
      scores.put(player, GeoUtils.score(distanceKm, maxErrorDistanceKm));
    }
  }

  /**
   * Must be called while holding `synchronized (room)`. Always lands on ROUND_RESULTS, even for
   * the last round — players should see that round's result before the game summary, not skip
   * straight to it. The game only actually ends when they click through via nextRound().
   */
  private void advanceIfComplete(RoomState room) {
    Map<String, LatLng> currentGuesses = currentRoundGuesses(room);
    if (currentGuesses.size() < room.players.size()) {
      broadcast(room.roomId, new ServerMessage("GUESS_SUBMITTED", room));
      return;
    }
    computeRoundResults(room);
    room.roomPhase = RoomState.RoomPhase.ROUND_RESULTS;
    broadcast(room.roomId, new ServerMessage("ROUND_RESULTS", room));
  }

  /** Must be called while holding `synchronized (room)`. */
  private void finishGame(RoomState room) {
    room.roomPhase = RoomState.RoomPhase.GAME_RESULTS;
    broadcast(room.roomId, new ServerMessage("GAME_RESULTS", room));
    try {
      gameHistoryService.persistCompletedSession(room);
    } catch (Exception e) {
      log.error("Failed to persist completed session {}", room.roomId, e);
    }
    closeRoom(room.roomId);
  }

  public boolean startGame(String roomId) {
    RoomState room = rooms.get(roomId);
    if (room == null) {
      return false;
    }
    synchronized (room) {
      if (room.roomPhase != RoomState.RoomPhase.WAITING) {
        return false;
      }
      beginRound(room);
    }
    broadcast(roomId, new ServerMessage("ROUND_STARTED", room));
    return true;
  }

  public boolean nextRound(String roomId) {
    RoomState room = rooms.get(roomId);
    if (room == null) {
      return false;
    }
    synchronized (room) {
      if (room.roomPhase != RoomState.RoomPhase.ROUND_RESULTS) {
        return false;
      }
      if (room.roundCount >= room.roomSettings.roundCount - 1) {
        finishGame(room);
        return true;
      }
      room.roundCount++;
      room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
      room.allTargets.add(getRandomTarget(room.roomSettings.mapId));
      room.roundEndsAt = computeRoundEndsAt(room.roomSettings.roundTimeLimitSeconds);
    }
    broadcast(roomId, new ServerMessage("ROUND_STARTED", room));
    return true;
  }

  /** Must be called while holding `synchronized (room)` (or before the room is visible to other threads). */
  private void beginRound(RoomState room) {
    room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
    room.allTargets.add(getRandomTarget(room.roomSettings.mapId));
    room.allGuesses = new ArrayList<Map<String, LatLng>>();
    room.roundEndsAt = computeRoundEndsAt(room.roomSettings.roundTimeLimitSeconds);
  }

  // null means unlimited — the round timeout scheduler and client countdown both already treat a
  // null roundEndsAt as "no deadline", so this is the only place that needs to know about it.
  private Long computeRoundEndsAt(int roundTimeLimitSeconds) {
    if (roundTimeLimitSeconds <= 0) {
      return null;
    }
    return System.currentTimeMillis() + roundTimeLimitSeconds * 1000L;
  }

  public void broadcast(String roomId, ServerMessage message) {
    roomSessions.getOrDefault(roomId, Set.of()).forEach(session -> {
      try {
        session.sendMessage(new TextMessage(mapper.writeValueAsString(message)));
      } catch (Exception e) {
        // A dead session here just means afterConnectionClosed will clean it up shortly.
      }
    });
  }

  public RoomState getRoomState(String roomId) {
    return rooms.get(roomId);
  }

  /** Used to power the "you have a game in progress" reconnect banner. */
  public RoomState findActiveRoomForUser(String username) {
    for (RoomState room : rooms.values()) {
      if (room.players != null && room.players.contains(username)) {
        return room;
      }
    }
    return null;
  }

  public void closeRoom(String roomId) {
    rooms.remove(roomId);
    roomPlayers.remove(roomId);
    Set<WebSocketSession> sessions = roomSessions.remove(roomId);
    if (sessions != null) {
      for (WebSocketSession session : sessions) {
        try {
          if (session.isOpen()) {
            session.close();
          }
        } catch (Exception e) {
          log.warn("Error closing session for room {}", roomId, e);
        }
      }
    }
  }

  public LatLng getRandomTarget(Long mapId) {
    List<LatLng> coordinates = gameMapService.getCustomCoordinates(mapId);
    if (coordinates.isEmpty()) {
      throw new IllegalStateException("No coordinates available for map ID " + mapId);
    }
    return coordinates.get(new Random().nextInt(coordinates.size()));
  }
}
