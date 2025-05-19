package me.peterrk.pan.backend.websocket;

import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import me.peterrk.pan.backend.dto.ws.GameMessageType;
import me.peterrk.pan.backend.dto.ws.GameResultMessage;
import me.peterrk.pan.backend.dto.ws.GameStartMessage;
import me.peterrk.pan.backend.dto.ws.JoinRoomMessage;
import me.peterrk.pan.backend.dto.ws.LatLng;
import me.peterrk.pan.backend.dto.ws.SubmitResultMessage;
import me.peterrk.pan.backend.service.DuelGameService;
import me.peterrk.pan.backend.util.GeoUtil;

public class DuelWebSocketHandler extends TextWebSocketHandler {

  private final DuelGameService duelGameService;
  private final ObjectMapper mapper = new ObjectMapper();
  private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();

  public DuelWebSocketHandler(DuelGameService duelGameService) {
    this.duelGameService = duelGameService;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    // noop
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    System.out.println("[" + session.getId() + "] Received message: " + message.getPayload());

    JsonNode node = mapper.readTree(message.getPayload().toString());
    String type = node.get("type").asText();

    switch (GameMessageType.valueOf(type)) {
      case JOIN_ROOM -> {
        // TODO: room full mechanic
        // TODO: incorrect data struct execption handling

        JoinRoomMessage joinRoomMessage = mapper.treeToValue(node, JoinRoomMessage.class);
        String roomId = joinRoomMessage.data.roomId;

        sessionRoomMap.put(session.getId(), roomId);
        duelGameService.addPlayerToRoom(roomId, session);

        if (!duelGameService.isRoomReady(roomId))
          return;
        LatLng targetLocation = duelGameService.getRandomTarget();
        duelGameService.setRoomTarget(roomId, targetLocation);
        long roundDurationMs = 60 * 1000;
        long endTimestamp = System.currentTimeMillis() + roundDurationMs;

        GameStartMessage.Data gameStartData = new GameStartMessage.Data();
        gameStartData.targetLocation = targetLocation;
        gameStartData.endTime = endTimestamp;
        GameStartMessage gameStartMessage = new GameStartMessage();
        gameStartMessage.data = gameStartData;

        broadcastToRoom(roomId, gameStartMessage);
      }
      case SUBMIT_RESULT -> {
        String roomId = sessionRoomMap.get(session.getId());
        SubmitResultMessage submitResultMessage = mapper.treeToValue(node, SubmitResultMessage.class);

        duelGameService.storePlayerGuess(roomId, session.getId(), submitResultMessage.data.guessLocation);

        if (!duelGameService.isGuessesReady(roomId))
          return;

        LatLng target = duelGameService.getRoomTarget(roomId);
        Map<String, LatLng> allGuesses = duelGameService.getRoomGuesses(roomId);
        String winner = determineWinner(allGuesses, target);

        GameResultMessage.Data gameResultMessageData = new GameResultMessage.Data();
        gameResultMessageData.winner = winner;
        gameResultMessageData.allGuesses = allGuesses;
        GameResultMessage gameResultMessage = new GameResultMessage();
        gameResultMessage.data = gameResultMessageData;

        broadcastToRoom(roomId, gameResultMessage);

        duelGameService.clearRoom(roomId);
      }

      default -> session.sendMessage(new TextMessage("{\"error\":\"Unknown message type\"}"));
    }

  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
    String username = (String) session.getAttributes().get("username");
    System.out.println("Connection closed " + username + " (" + session.getId() + ")");
  }

  private void broadcastToRoom(String roomId, Object message) throws Exception {
    String json = mapper.writeValueAsString(message);
    for (WebSocketSession s : duelGameService.getRoomSessions(roomId)) {
      if (s.isOpen())
        s.sendMessage(new TextMessage(json));
    }
  }

  private String determineWinner(Map<String, LatLng> guesses, LatLng target) {
    return guesses.entrySet().stream()
        .min(Comparator.comparingDouble(e -> GeoUtil.getDistanceInKM(e.getValue(), target)))
        .map(Map.Entry::getKey)
        .orElse(null);
  }
}