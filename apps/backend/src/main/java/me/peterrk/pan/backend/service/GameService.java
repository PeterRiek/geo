package me.peterrk.pan.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.GameSettings;
import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.dto.ws.RoomState;
import me.peterrk.pan.backend.dto.ws.ServerMessage;

@Service
public class GameService {

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
    if (gameSettings.roundTimeLimitSeconds <= 0) {
      gameSettings.roundTimeLimitSeconds = DEFAULT_ROUND_TIME_LIMIT_SECONDS;
    }
    gameSettings.roundTimeLimitSeconds = Math.max(MIN_ROUND_TIME_LIMIT_SECONDS,
        Math.min(MAX_ROUND_TIME_LIMIT_SECONDS, gameSettings.roundTimeLimitSeconds));

    return rooms.computeIfAbsent(roomId, id -> {
      RoomState room = new RoomState();
      room.roomId = roomId;
      room.roomSettings = gameSettings;
      room.creatorUsername = creatorUsername;
      room.roomPhase = RoomState.RoomPhase.WAITING;
      room.roundCount = 0;
      room.allGuesses = new ArrayList<Map<String, LatLng>>();
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

  /** Must be called while holding `synchronized (room)`. */
  private void advanceIfComplete(RoomState room) {
    Map<String, LatLng> currentGuesses = currentRoundGuesses(room);
    if (currentGuesses.size() < room.players.size()) {
      broadcast(room.roomId, new ServerMessage("GUESS_SUBMITTED", room));
      return;
    }
    if (room.roundCount >= room.roomSettings.roundCount - 1) {
      room.roomPhase = RoomState.RoomPhase.GAME_RESULTS;
      broadcast(room.roomId, new ServerMessage("GAME_RESULTS", room));
      try {
        gameHistoryService.persistCompletedSession(room);
      } catch (Exception e) {
        System.err.println("Failed to persist completed session " + room.roomId + ": " + e.getMessage());
      }
      closeRoom(room.roomId);
    } else {
      room.roomPhase = RoomState.RoomPhase.ROUND_RESULTS;
      broadcast(room.roomId, new ServerMessage("ROUND_RESULTS", room));
    }
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
      room.roundCount++;
      room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
      room.allTargets.add(getRandomTarget(room.roomSettings.mapId));
      room.roundEndsAt = System.currentTimeMillis() + room.roomSettings.roundTimeLimitSeconds * 1000L;
    }
    broadcast(roomId, new ServerMessage("ROUND_STARTED", room));
    return true;
  }

  /** Must be called while holding `synchronized (room)` (or before the room is visible to other threads). */
  private void beginRound(RoomState room) {
    room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
    room.allTargets.add(getRandomTarget(room.roomSettings.mapId));
    room.allGuesses = new ArrayList<Map<String, LatLng>>();
    room.roundEndsAt = System.currentTimeMillis() + room.roomSettings.roundTimeLimitSeconds * 1000L;
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
          System.err.println("Error closing session: " + e.getMessage());
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
