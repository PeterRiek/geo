package me.peterrk.pan.backend.dto.ws;

public class ServerMessage {
  public String type;
  public Object payload;

  public ServerMessage(String type, Object payload) {
    this.type = type;
    this.payload = payload;
  }
}
