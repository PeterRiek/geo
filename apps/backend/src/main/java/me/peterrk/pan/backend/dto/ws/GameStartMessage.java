package me.peterrk.pan.backend.dto.ws;

public class GameStartMessage {
  public static class Data {

    public LatLng targetLocation;
    public long endTime;
  }

  public String type = "GAME_START";
  public Data data;
}
