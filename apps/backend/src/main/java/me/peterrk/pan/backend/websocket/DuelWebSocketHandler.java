package me.peterrk.pan.backend.websocket;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.ws.ClientMessage;
import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.dto.ws.RoomState;
import me.peterrk.pan.backend.dto.ws.ServerMessage;
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
      case "JOIN" -> {
        RoomState roomState = duelGameService.joinRoom(msg.roomId, username, session);
        ServerMessage response = new ServerMessage("JOINED_ROOM", roomState);
        session.sendMessage(new TextMessage(mapper.writeValueAsString(response)));
      }

      case "GUESS" -> {
        LatLng guess = mapper.convertValue(msg.payload, LatLng.class);
        duelGameService.submitGuess(msg.roomId, username, guess);
        RoomState updated = duelGameService.getRoomState(msg.roomId);
        if (updated.allGuesses.size() >= 2) {
          updated.roomPhase = RoomState.RoomPhase.ROUND_RESULTS;

          duelGameService.broadcast(msg.roomId, mapper, new ServerMessage("GAME_RESULTS", updated));
        }
      }

      case "START_GAME" -> {
        RoomState roomState = duelGameService.startGame(msg.roomId);
        duelGameService.broadcast(msg.roomId, mapper, new ServerMessage("ROUND_STARTED", roomState));
      }

      case "NEXT_ROUND" -> {
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