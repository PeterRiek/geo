package me.peterrk.pan.backend.service;

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
public class DuelGameService {

  private final GameMapService gameMapService;

  private final Map<String, RoomState> rooms = new ConcurrentHashMap<>();
  private final Map<String, Set<WebSocketSession>> roomSessions = new ConcurrentHashMap<>();

  public DuelGameService(GameMapService gameMapService) {
    this.gameMapService = gameMapService;
  }

  public RoomState joinRoom(String roomId, String username, WebSocketSession session) {
    roomSessions.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet()).add(session);

    return rooms.computeIfAbsent(roomId, id -> {
      // TODO: user sets room settings
      RoomState room = new RoomState();
      room.roomId = roomId;
      room.roomSettings = new GameSettings();
      room.roomSettings.allowPan = true;
      room.roomSettings.allowZoom = true;
      room.roomSettings.mapId = 1L;
      room.roomSettings.roundCount = 2;
      room.roomPhase = RoomState.RoomPhase.WAITING;
      room.roundCount = 0;
      room.allGuesses = new ConcurrentHashMap<>();
      return room;
    });
  }

  public void submitGuess(String roomId, String username, LatLng guess) {
    RoomState room = rooms.get(roomId);
    if (room != null && room.roomPhase == RoomState.RoomPhase.ROUND_IN_PROGRESS)
      room.allGuesses.put(username, guess);
  }

  public RoomState startGame(String roomId) {
    RoomState room = rooms.get(roomId);
    if (room != null) {
      room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
      room.targetLocation = getRandomTarget(getRoomState(roomId).roomSettings.mapId);
      room.roundCount++;
      room.allGuesses = new ConcurrentHashMap<>();
    }
    return room;
  }

  public RoomState nextRound(String roomId) {
    RoomState room = rooms.get(roomId);
    if (room != null) {
      room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
      room.targetLocation = getRandomTarget(getRoomState(roomId).roomSettings.mapId);
      room.roundCount++;
      room.allGuesses = new ConcurrentHashMap<>();
    }
    return room;
  }

  public void broadcast(String roomId, ObjectMapper mapper, ServerMessage message) {
    roomSessions.getOrDefault(roomId, Set.of()).forEach(session -> {
      try {
        session.sendMessage(new TextMessage(mapper.writeValueAsString(message)));
      } catch (Exception e) {
        // TODO: handle
      }
    });
  }

  public RoomState getRoomState(String roomId) {
    return rooms.get(roomId);
  }

  public LatLng getRandomTarget(Long mapId) {
    List<LatLng> coordinates = gameMapService.getCustomCoordinates(mapId);
    if (coordinates.isEmpty()) {
      throw new IllegalStateException("No coordinates available for map ID " + mapId);
    }
    return coordinates.get(new Random().nextInt(coordinates.size()));
  }
}
