package me.peterrk.pan.backend.websocket;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.GameSettings;
import me.peterrk.pan.backend.dto.ws.ClientMessage;
import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.dto.ws.RoomState;
import me.peterrk.pan.backend.dto.ws.ServerMessage;
import me.peterrk.pan.backend.dto.ws.RoomState.RoomPhase;
import me.peterrk.pan.backend.service.DuelGameService;

public class DuelWebSocketHandler extends TextWebSocketHandler {

  private final ObjectMapper mapper = new ObjectMapper();

  private final DuelGameService duelGameService;

  public DuelWebSocketHandler(DuelGameService duelGameService) {
    this.duelGameService = duelGameService;
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    ClientMessage msg = mapper.readValue(message.getPayload(), ClientMessage.class);
    String username = (String) session.getAttributes().get("username");

    System.out.println("[" + username + "] - " + msg.roomId + " - " + msg.type + " - " + (msg.payload != null
        ? (mapper.writeValueAsString(msg.payload))
        : "/"));

    switch (msg.type) {
      case "CREATE" -> {
        if (duelGameService.getRoomState(msg.roomId) != null) {
          ServerMessage response = new ServerMessage("ROOM_EXISTS");
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(response)));
          return;
        }
        RoomState roomState = null;
        if (msg.payload != null) {

          GameSettings roomSettings = mapper.convertValue(msg.payload, GameSettings.class);
          roomState = duelGameService.createRoom(msg.roomId, roomSettings);
        } else {
          roomState = duelGameService.createRoom(msg.roomId);
        }
        ServerMessage response = new ServerMessage("CREATED_ROOM", roomState);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
      }

      case "JOIN" -> {
        RoomState roomState = duelGameService.joinRoom(msg.roomId, username, session);
        if (roomState == null) {
          ServerMessage response = new ServerMessage("ROOM_NOT_FOUND");
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(response)));
          return;
        }
        duelGameService.broadcast(msg.roomId, mapper, new ServerMessage("JOINED_ROOM", roomState));
      }

      case "GUESS" -> {
        if (duelGameService.getRoomState(msg.roomId).roomPhase != RoomPhase.ROUND_IN_PROGRESS) {
          ServerMessage response = new ServerMessage("INVALID_OPERATION");
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(response)));
          return;
        }
        LatLng guess = mapper.convertValue(msg.payload, LatLng.class);
        duelGameService.submitGuess(msg.roomId, username, guess);
        RoomState updated = duelGameService.getRoomState(msg.roomId);
        if (updated.allGuesses.get(updated.roundCount).size() >= 2) {
          if (updated.roundCount >= updated.roomSettings.roundCount - 1) {
            updated.roomPhase = RoomState.RoomPhase.GAME_RESULTS;
            duelGameService.broadcast(msg.roomId, mapper, new ServerMessage("GAME_RESULTS", updated));
            duelGameService.closeRoom(msg.roomId);
          } else {
            updated.roomPhase = RoomState.RoomPhase.ROUND_RESULTS;
            duelGameService.broadcast(msg.roomId, mapper, new ServerMessage("ROUND_RESULTS", updated));
          }
        }
      }

      case "START_GAME" -> {
        if (duelGameService.getRoomState(msg.roomId).roomPhase != RoomPhase.WAITING) {
          ServerMessage response = new ServerMessage("INVALID_OPERATION");
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(response)));
          return;
        }
        RoomState roomState = duelGameService.startGame(msg.roomId);
        duelGameService.broadcast(msg.roomId, mapper, new ServerMessage("ROUND_STARTED", roomState));
      }

      case "NEXT_ROUND" -> {
        if (duelGameService.getRoomState(msg.roomId).roomPhase != RoomPhase.ROUND_RESULTS) {
          ServerMessage response = new ServerMessage("INVALID_OPERATION");
          session.sendMessage(new TextMessage(mapper.writeValueAsBytes(response)));
          return;
        }
        RoomState roomState = duelGameService.nextRound(msg.roomId);
        duelGameService.broadcast(msg.roomId, mapper, new ServerMessage("ROUND_STARTED", roomState));
      }

      default -> {
        session.sendMessage(new TextMessage(
            mapper.writeValueAsString(new ServerMessage("ERROR", "Unknown message type"))));
      }
    }
  }

}