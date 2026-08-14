package me.peterrk.pan.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
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
  private static final long TIME_PRESSURE_REMAINING_MS = 10_000;
  private static final int MIN_PLAYERS_TO_START = 2;
  private static final long READY_CHECK_COUNTDOWN_MS = 60_000;

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
    if (room == null || room.inactivePlayers.contains(username)) {
      return null;
    }
    roomSessions.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet()).add(session);
    Set<String> players = roomPlayers.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet());
    synchronized (room) {
      players.add(username);
      room.players = new ArrayList<>(players);
      room.disconnectedPlayers.remove(username);
      // Arm the lobby's ready-check failsafe exactly once, the moment the room first has enough
      // players to conceivably start. players.size() only grows (no "leave room" mechanic), so
      // this condition can only become true once per room.
      if (room.roomPhase == RoomState.RoomPhase.WAITING && room.readyDeadline == null
          && room.players.size() >= MIN_PLAYERS_TO_START) {
        room.readyDeadline = System.currentTimeMillis() + READY_CHECK_COUNTDOWN_MS;
      }
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
        // A disconnected player never counts as ready for either gate.
        room.readyPlayers.remove(username);
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
      if (room.roomPhase != RoomState.RoomPhase.ROUND_IN_PROGRESS || room.inactivePlayers.contains(username)) {
        return false;
      }
      recordGuess(room, username, guess);
      applyTimePressure(room);
      advanceIfComplete(room);
      return true;
    }
  }

  /**
   * Records where a player's pin currently sits before they've hit submit, so a round timeout can
   * fall back to it instead of scoring them as a miss (see {@link #resolveExpiredRounds}). Silently
   * ignored once the round has moved on or the player already submitted — a late PIN_MOVED racing
   * the round boundary should never resurrect a stale pending pin for the next round.
   */
  public void updatePendingGuess(String roomId, String username, LatLng pos) {
    RoomState room = rooms.get(roomId);
    if (room == null) {
      return;
    }
    synchronized (room) {
      if (room.roomPhase != RoomState.RoomPhase.ROUND_IN_PROGRESS) {
        return;
      }
      if (currentRoundGuesses(room).containsKey(username)) {
        return;
      }
      room.pendingGuesses.put(username, pos);
    }
  }

  /**
   * Must be called while holding `synchronized (room)`. One-way, monotonically-decreasing clamp:
   * never extends roundEndsAt, so reapplying on later guesses in the same round is a harmless
   * no-op once already clamped. No broadcast of its own — the caller's existing broadcast (either
   * GUESS_SUBMITTED or ROUND_RESULTS) already carries the mutated roundEndsAt to clients, and the
   * frontend's countdown hook already reschedules whenever roundEndsAt changes.
   */
  private void applyTimePressure(RoomState room) {
    if (!room.roomSettings.timePressure) {
      return;
    }
    long clampedEndsAt = System.currentTimeMillis() + TIME_PRESSURE_REMAINING_MS;
    if (room.roundEndsAt == null || room.roundEndsAt > clampedEndsAt) {
      room.roundEndsAt = clampedEndsAt;
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
        // Timeout: whoever hasn't submitted is resolved with the last pin they placed (null if
        // they never placed one at all), rather than being scored as a miss outright.
        Map<String, LatLng> currentGuesses = currentRoundGuesses(room);
        for (String player : room.players) {
          currentGuesses.putIfAbsent(player, room.pendingGuesses.get(player));
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
    if (!currentGuesses.keySet().containsAll(activePlayers(room))) {
      broadcast(room.roomId, new ServerMessage("GUESS_SUBMITTED", room));
      return;
    }
    computeRoundResults(room);
    room.roomPhase = RoomState.RoomPhase.ROUND_RESULTS;
    // Arm the between-rounds ready gate fresh for this round's results — no floor check here
    // (unlike the WAITING gate), the round already had players in it. Applies uniformly whether
    // or not this is the final round: advancing to GAME_RESULTS is gated the same as advancing
    // to the next round.
    room.readyPlayers = new HashSet<>();
    room.readyDeadline = System.currentTimeMillis() + READY_CHECK_COUNTDOWN_MS;
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

  /**
   * Toggles the caller's ready flag for whichever gate is currently open (WAITING's pre-round-1
   * gate, or ROUND_RESULTS's between-rounds gate) and advances the room if that completes it.
   * Returns false if the room doesn't exist or isn't in a gated phase right now.
   */
  public boolean setReady(String roomId, String username, boolean ready) {
    RoomState room = rooms.get(roomId);
    if (room == null) {
      return false;
    }
    RoomState.RoomPhase newPhase;
    synchronized (room) {
      if (room.roomPhase != RoomState.RoomPhase.WAITING && room.roomPhase != RoomState.RoomPhase.ROUND_RESULTS) {
        return false;
      }
      if (ready) {
        room.readyPlayers.add(username);
      } else {
        room.readyPlayers.remove(username);
      }
      newPhase = maybeAdvance(room);
    }
    if (newPhase == RoomState.RoomPhase.ROUND_IN_PROGRESS) {
      broadcast(roomId, new ServerMessage("ROUND_STARTED", room));
    } else if (newPhase == null) {
      // Didn't advance (still waiting on someone) — let clients refresh their ready-state view.
      // GAME_RESULTS needs no broadcast here: finishGame already sent it from inside the lock above.
      broadcast(roomId, new ServerMessage("READY_STATUS", room));
    }
    return true;
  }

  /**
   * Must be called while holding `synchronized (room)`. Advances the room if every currently
   * connected player is ready for its current gate, returning the phase it moved to (or null if
   * it didn't advance). The WAITING gate additionally requires MIN_PLAYERS_TO_START connected —
   * the ROUND_RESULTS gate has no such floor, so a lone player left mid-game can still ready up
   * and keep playing solo.
   */
  private RoomState.RoomPhase maybeAdvance(RoomState room) {
    Set<String> connected = connectedPlayers(room);
    if (room.roomPhase == RoomState.RoomPhase.WAITING) {
      if (connected.size() < MIN_PLAYERS_TO_START || !room.readyPlayers.containsAll(connected)) {
        return null;
      }
      beginRound(room);
      return RoomState.RoomPhase.ROUND_IN_PROGRESS;
    }
    if (room.roomPhase == RoomState.RoomPhase.ROUND_RESULTS) {
      if (!room.readyPlayers.containsAll(connected)) {
        return null;
      }
      advanceRoundOrFinish(room);
      return room.roomPhase;
    }
    return null;
  }

  private Set<String> connectedPlayers(RoomState room) {
    Set<String> connected = activePlayers(room);
    connected.removeAll(room.disconnectedPlayers);
    return connected;
  }

  /** Room members minus anyone who's forfeited — still includes players who are merely disconnected. */
  private Set<String> activePlayers(RoomState room) {
    Set<String> active = new HashSet<>(room.players);
    active.removeAll(room.inactivePlayers);
    return active;
  }

  /**
   * Scanned every second by {@link RoundTimeoutScheduler}; force-advances any room whose current
   * ready gate's failsafe deadline has passed. WAITING only force-starts with at least
   * MIN_PLAYERS_TO_START connected (else it's a no-op this tick — readyDeadline stays in the past,
   * so the very next tick re-checks against whatever the connected count is then, no re-arming
   * needed). ROUND_RESULTS has no such floor — it always force-advances once the deadline passes.
   */
  public void resolveExpiredReadyChecks() {
    long now = System.currentTimeMillis();
    for (RoomState room : rooms.values()) {
      boolean gated = room.roomPhase == RoomState.RoomPhase.WAITING
          || room.roomPhase == RoomState.RoomPhase.ROUND_RESULTS;
      if (!gated || room.readyDeadline == null || now < room.readyDeadline) {
        continue;
      }
      RoomState.RoomPhase newPhase = null;
      synchronized (room) {
        gated = room.roomPhase == RoomState.RoomPhase.WAITING || room.roomPhase == RoomState.RoomPhase.ROUND_RESULTS;
        if (!gated || room.readyDeadline == null || now < room.readyDeadline) {
          continue;
        }
        if (room.roomPhase == RoomState.RoomPhase.WAITING) {
          if (connectedPlayers(room).size() >= MIN_PLAYERS_TO_START) {
            beginRound(room);
            newPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
          }
        } else {
          advanceRoundOrFinish(room);
          newPhase = room.roomPhase;
        }
      }
      if (newPhase == RoomState.RoomPhase.ROUND_IN_PROGRESS) {
        broadcast(room.roomId, new ServerMessage("ROUND_STARTED", room));
      }
      // GAME_RESULTS already broadcast internally by finishGame via advanceRoundOrFinish.
    }
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
      advanceRoundOrFinish(room);
      if (room.roomPhase == RoomState.RoomPhase.GAME_RESULTS) {
        return true;
      }
    }
    broadcast(roomId, new ServerMessage("ROUND_STARTED", room));
    return true;
  }

  /**
   * Must be called while holding `synchronized (room)`, with `roomPhase == ROUND_RESULTS`. Always
   * either lands on ROUND_IN_PROGRESS (caller broadcasts ROUND_STARTED) or GAME_RESULTS (finishGame
   * already broadcasts internally — caller must not broadcast again).
   */
  private void advanceRoundOrFinish(RoomState room) {
    if (room.roundCount >= room.roomSettings.roundCount - 1) {
      finishGame(room);
      return;
    }
    room.roundCount++;
    room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
    room.allTargets.add(getRandomTarget(room.roomSettings.mapId));
    room.roundEndsAt = computeRoundEndsAt(room.roomSettings.roundTimeLimitSeconds);
  }

  /** Must be called while holding `synchronized (room)` (or before the room is visible to other threads). */
  private void beginRound(RoomState room) {
    room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
    room.allTargets.add(getRandomTarget(room.roomSettings.mapId));
    room.allGuesses = new ArrayList<Map<String, LatLng>>();
    room.roundEndsAt = computeRoundEndsAt(room.roomSettings.roundTimeLimitSeconds);
    room.pendingGuesses = new HashMap<>();
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
      if (room.players != null && room.players.contains(username) && !room.inactivePlayers.contains(username)) {
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

  /**
   * Marks the caller inactive rather than ending the room: every ready gate stops waiting on them
   * (see #connectedPlayers), a round in progress stops waiting on their guess (see
   * #advanceIfComplete), and #joinRoom refuses to let them back in — but the game plays out to its
   * normal end for whoever's still active, same as it would for any other round they simply never
   * guess in. The lone exception is when this forfeit empties the room of active players: with no
   * one left to play for, the room ends immediately instead of idling out the results gate.
   * Returns false if the room doesn't exist, has already finished, the caller isn't a player in it,
   * or they've already forfeited.
   */
  public boolean forfeit(String roomId, String username) {
    RoomState room = rooms.get(roomId);
    if (room == null) {
      return false;
    }
    RoomState.RoomPhase newPhase = null;
    boolean wasInProgress;
    synchronized (room) {
      if (room.roomPhase == RoomState.RoomPhase.GAME_RESULTS || !room.players.contains(username)
          || room.inactivePlayers.contains(username)) {
        return false;
      }
      room.inactivePlayers.add(username);
      room.readyPlayers.remove(username);

      if (activePlayers(room).isEmpty()) {
        finishGame(room);
        return true;
      }

      wasInProgress = room.roomPhase == RoomState.RoomPhase.ROUND_IN_PROGRESS;
      if (wasInProgress) {
        // Broadcasts internally (GUESS_SUBMITTED or ROUND_RESULTS) regardless of outcome.
        advanceIfComplete(room);
      } else {
        newPhase = maybeAdvance(room);
      }
    }
    if (!wasInProgress) {
      if (newPhase == RoomState.RoomPhase.ROUND_IN_PROGRESS) {
        broadcast(roomId, new ServerMessage("ROUND_STARTED", room));
      } else if (newPhase == null) {
        // Didn't advance — let clients refresh their player-status view (mirrors setReady).
        broadcast(roomId, new ServerMessage("PLAYER_STATUS", room));
      }
    }
    return true;
  }

  public LatLng getRandomTarget(Long mapId) {
    List<LatLng> coordinates = gameMapService.getCustomCoordinates(mapId);
    if (coordinates.isEmpty()) {
      throw new IllegalStateException("No coordinates available for map ID " + mapId);
    }
    return coordinates.get(new Random().nextInt(coordinates.size()));
  }
}
