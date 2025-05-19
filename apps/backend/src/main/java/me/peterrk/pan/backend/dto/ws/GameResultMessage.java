package me.peterrk.pan.backend.dto.ws;

import java.util.Map;

public class GameResultMessage {
  public static class Data {
    public Map<String, LatLng> allGuesses;
    public String winner;
  }

  public GameMessageType type = GameMessageType.GAME_RESULT;
  public Data data;
}
