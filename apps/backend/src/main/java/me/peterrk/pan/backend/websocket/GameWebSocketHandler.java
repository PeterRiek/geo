package me.peterrk.pan.backend.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.GameSettings;
import me.peterrk.pan.backend.dto.ws.ClientMessage;
import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.dto.ws.RoomState;
import me.peterrk.pan.backend.dto.ws.ServerMessage;
import me.peterrk.pan.backend.exception.MapAccessException;
import me.peterrk.pan.backend.service.GameService;

public class GameWebSocketHandler extends TextWebSocketHandler {

  private static final Logger log = LoggerFactory.getLogger(GameWebSocketHandler.class);

  private final ObjectMapper mapper = new ObjectMapper();

  private final GameService gameService;

  public GameWebSocketHandler(GameService gameService) {
    this.gameService = gameService;
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    ClientMessage msg = mapper.readValue(message.getPayload(), ClientMessage.class);
    String username = (String) session.getAttributes().get("username");

    log.debug("[{}] - {} - {}", username, msg.roomId, msg.type);

    switch (msg.type) {
      case "CREATE" -> {
        if (gameService.getRoomState(msg.roomId) != null) {
          ServerMessage response = new ServerMessage("ROOM_EXISTS");
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(response)));
          return;
        }
        RoomState roomState = null;
        try {
          if (msg.payload != null) {
            GameSettings roomSettings = mapper.convertValue(msg.payload, GameSettings.class);
            roomState = gameService.createRoom(msg.roomId, roomSettings, username);
          } else {
            roomState = gameService.createRoom(msg.roomId, username);
          }
        } catch (MapAccessException e) {
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(new ServerMessage("MAP_NOT_ACCESSIBLE"))));
          return;
        }
        ServerMessage response = new ServerMessage("CREATED_ROOM", roomState);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
      }

      case "JOIN" -> {
        RoomState roomState = gameService.joinRoom(msg.roomId, username, session);
        if (roomState == null) {
          ServerMessage response = new ServerMessage("ROOM_NOT_FOUND");
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(response)));
          return;
        }
        session.getAttributes().put("roomId", msg.roomId);
        gameService.broadcast(msg.roomId, new ServerMessage("JOINED_ROOM", roomState));
      }

      case "GUESS" -> {
        LatLng guess = mapper.convertValue(msg.payload, LatLng.class);
        if (!gameService.submitGuess(msg.roomId, username, guess)) {
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(new ServerMessage("INVALID_OPERATION"))));
        }
      }

      case "START_GAME" -> {
        if (!gameService.startGame(msg.roomId)) {
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(new ServerMessage("INVALID_OPERATION"))));
        }
      }

      case "NEXT_ROUND" -> {
        if (!gameService.nextRound(msg.roomId)) {
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(new ServerMessage("INVALID_OPERATION"))));
        }
      }

      default -> {
        session.sendMessage(new TextMessage(
            mapper.writeValueAsString(new ServerMessage("ERROR", "Unknown message type"))));
      }
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
    String username = (String) session.getAttributes().get("username");
    String roomId = (String) session.getAttributes().get("roomId");
    if (username != null && roomId != null) {
      gameService.markDisconnected(roomId, username, session);
      RoomState room = gameService.getRoomState(roomId);
      if (room != null) {
        gameService.broadcast(roomId, new ServerMessage("PLAYER_STATUS", room));
      }
    }
  }
}
