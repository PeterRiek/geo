package me.peterrk.pan.backend.dto.ws;

public class JoinRoomMessage {
  public static class Data {
    public String roomId;
  }

  public GameMessageType type = GameMessageType.JOIN_ROOM;
  public Data data;
}
