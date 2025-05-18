package me.peterrk.pan.backend.websocket;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class DuelWebSocketHandler extends TextWebSocketHandler {

  @Override
  public void afterConnectionEstablished(WebSocketSession session) {
    String username = (String) session.getAttributes().get("username");
    System.out.println("Connection established " + username + " (" + session.getId() + ")");
  }

  @Override
  protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    System.out.println("Received message: " + message.getPayload());
    session.sendMessage(new TextMessage("Echo: " + message.getPayload()));
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) {
    String username = (String) session.getAttributes().get("username");
    System.out.println("Connection closed " + username + " (" + session.getId() + ")");
  }
}