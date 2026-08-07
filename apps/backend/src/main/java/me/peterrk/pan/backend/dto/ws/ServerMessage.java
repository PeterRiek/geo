package me.peterrk.pan.backend.dto.ws;

public class ServerMessage {
  public String type;
  public Object payload;

  public ServerMessage(String type) {
    this.type = type;
  }

  public ServerMessage(String type, Object payload) {
    this.type = type;
    this.payload = payload;
    if (payload instanceof RoomState roomState) {
      roomState.serverTime = System.currentTimeMillis();
    }
  }
}
