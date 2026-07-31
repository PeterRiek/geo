package me.peterrk.pan.backend.dto.ws;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import me.peterrk.pan.backend.dto.GameSettings;

public class RoomState {
  public static enum RoomPhase {
    WAITING, ROUND_IN_PROGRESS, ROUND_RESULTS, GAME_RESULTS;
  }

  public String roomId;
  public GameSettings roomSettings;
  public RoomPhase roomPhase;

  public List<LatLng> allTargets;
  public List<Map<String, LatLng>> allGuesses;
  public int roundCount;
  public List<String> players = new ArrayList<>();
}
