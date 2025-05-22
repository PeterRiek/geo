package me.peterrk.pan.backend.service;

import java.util.ArrayList;
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

  public RoomState createRoom(String roomId) {
    GameSettings gameSettings = new GameSettings();
    gameSettings.allowPan = true;
    gameSettings.allowZoom = true;
    gameSettings.mapId = 1L;
    gameSettings.roundCount = 2;
    return createRoom(roomId, gameSettings);
  }

  public RoomState createRoom(String roomId, GameSettings gameSettings) {
    return rooms.computeIfAbsent(roomId, id -> {
      RoomState room = new RoomState();
      room.roomId = roomId;
      room.roomSettings = gameSettings;
      room.roomPhase = RoomState.RoomPhase.WAITING;
      room.roundCount = 0;
      room.allGuesses = new ArrayList<Map<String, LatLng>>();
      room.allTargets = new ArrayList<LatLng>();
      return room;
    });
  }

  public RoomState joinRoom(String roomId, String username, WebSocketSession session) {
    roomSessions.computeIfAbsent(roomId, id -> ConcurrentHashMap.newKeySet()).add(session);
    return getRoomState(roomId);
  }

  public void submitGuess(String roomId, String username, LatLng guess) {
    RoomState room = rooms.get(roomId);
    if (room != null && room.roomPhase == RoomState.RoomPhase.ROUND_IN_PROGRESS) {
      while (room.allGuesses.size()-1 <  room.roundCount)
        room.allGuesses.add(new ConcurrentHashMap<String, LatLng>());
      room.allGuesses.get(room.roundCount).put(username, guess);
    }
  }

  public RoomState startGame(String roomId) {
    RoomState room = rooms.get(roomId);
    if (room != null) {
      room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
      room.allTargets.add(getRandomTarget(getRoomState(roomId).roomSettings.mapId));
      room.roundCount++;
      room.allGuesses = new ArrayList<Map<String,LatLng>>();
    }
    return room;
  }

  public RoomState nextRound(String roomId) {
    RoomState room = rooms.get(roomId);
    if (room != null) {
      room.roomPhase = RoomState.RoomPhase.ROUND_IN_PROGRESS;
      room.allTargets.add(getRandomTarget(getRoomState(roomId).roomSettings.mapId));
      room.roundCount++;
      room.allGuesses = new ArrayList<Map<String,LatLng>>();
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

  public void closeRoom(String roomId) {
    rooms.remove(roomId);
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